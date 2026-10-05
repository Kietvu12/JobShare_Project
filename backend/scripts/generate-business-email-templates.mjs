import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const xlsxPath = path.join(__dirname, '../JobShare_Business_Email_Notification_Spec_JP_EN (1).xlsx')
const outPath = path.join(__dirname, '../src/services/businessNotificationEmail/templates.generated.json')
const extractDir = path.join(__dirname, '../../scripts/_xlsx_email_tpl')

function decodeXml(text) {
  if (!text) return ''
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function colFromCellRef(ref) {
  const m = ref.match(/^([A-Z]+)/)
  if (!m) return 0
  let n = 0
  for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

function parseSheetXml(xml) {
  const rows = []
  const rowRe = /<x:row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/x:row>/g
  let rm
  while ((rm = rowRe.exec(xml)) !== null) {
    const rowNum = Number(rm[1])
    const rowBody = rm[2]
    const cells = {}
    const cellRe = /<x:c\b[^>]*\br="([A-Z]+\d+)"[^>]*>([\s\S]*?)<\/x:c>/g
    let cm
    while ((cm = cellRe.exec(rowBody)) !== null) {
      const ref = cm[1]
      const vMatch = cm[2].match(/<x:v>([\s\S]*?)<\/x:v>/)
      cells[colFromCellRef(ref)] = vMatch ? decodeXml(vMatch[1]) : ''
    }
    rows.push({ rowNum, cells })
  }
  return rows.sort((a, b) => a.rowNum - b.rowNum)
}

function splitJpEn(block) {
  const text = String(block || '').trim()
  if (!text) return { ja: '', en: '' }
  const enIdx = text.search(/\nEN:\s*\n/i)
  if (enIdx === -1) {
    const jaIdx = text.search(/^JP:\s*\n/i)
    if (jaIdx === 0) return { ja: text.replace(/^JP:\s*\n/i, '').trim(), en: '' }
    return { ja: '', en: text }
  }
  const jaPart = text.slice(0, enIdx).replace(/^JP:\s*\n/i, '').trim()
  const enPart = text.slice(enIdx).replace(/^EN:\s*\n/i, '').trim()
  return { ja: jaPart, en: enPart }
}

function ensureExtracted() {
  fs.mkdirSync(extractDir, { recursive: true })
  const zipPath = path.join(extractDir, 'book.zip')
  fs.copyFileSync(xlsxPath, zipPath)
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force"`,
    { stdio: 'pipe' },
  )
}

function rowToTemplate(row) {
  const key = row.cells[1]
  if (!key || key === 'Template Key') return null
  const subject = splitJpEn(row.cells[3])
  const body = splitJpEn(row.cells[4])
  const cta = splitJpEn(row.cells[5])
  const ctaRoute = (row.cells[6] || '').trim()
  const requiredVars = (row.cells[7] || '').split(',').map((s) => s.trim()).filter(Boolean)
  const notes = row.cells[8] || ''
  const priority = row.cells[9] || ''
  return {
    id: row.cells[0] || '',
    key,
    trigger: row.cells[2] || '',
    priority,
    subject,
    body,
    cta,
    ctaRoute,
    requiredVars,
    notes,
  }
}

ensureExtracted()
const templates = {}
for (const sheet of ['sheet1.xml', 'sheet3.xml']) {
  const xml = fs.readFileSync(path.join(extractDir, 'xl/worksheets', sheet), 'utf8')
  for (const row of parseSheetXml(xml).slice(1)) {
    const t = rowToTemplate(row)
    if (t) templates[t.key] = t
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, `${JSON.stringify(templates, null, 2)}\n`, 'utf8')
console.log('Templates:', Object.keys(templates).length, '->', outPath)
