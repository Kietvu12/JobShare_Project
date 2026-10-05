import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const xlsxPath = path.join(__dirname, '../JobShare_Business_Email_Notification_Spec_JP_EN (1).xlsx')
const outPath = path.join(__dirname, '../JobShare_Business_Email_Notification_Spec.md')
const extractDir = path.join(__dirname, '../../scripts/_xlsx_extract_email_spec')

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
      const inner = cm[2]
      const vMatch = inner.match(/<x:v>([\s\S]*?)<\/x:v>/)
      const isStr = /t="str"/.test(cm[0])
      let val = vMatch ? decodeXml(vMatch[1]) : ''
      if (!isStr && val !== '' && /^-?\d+(\.\d+)?$/.test(val)) val = val
      cells[colFromCellRef(ref)] = val
    }
    rows.push({ rowNum, cells })
  }
  rows.sort((a, b) => a.rowNum - b.rowNum)
  return rows
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

function rowsToTable(rows, headers) {
  if (!rows.length) return '_（空）_\n'
  const lines = []
  lines.push(`| ${headers.join(' | ')} |`)
  lines.push(`| ${headers.map(() => '---').join(' | ')} |`)
  for (const row of rows) {
    const vals = headers.map((_, i) => (row.cells[i] ?? '').replace(/\|/g, '\\|').replace(/\n/g, '<br>'))
    lines.push(`| ${vals.join(' | ')} |`)
  }
  return `${lines.join('\n')}\n`
}

function sectionForTemplate(row, headers) {
  const get = (i) => row.cells[i] ?? ''
  const id = get(0)
  const key = get(1)
  const trigger = get(2)
  const subject = get(3)
  const body = get(4)
  const cta = get(5)
  const ctaLink = get(6)
  const vars = get(7)
  const notes = get(8)
  const priority = get(9)

  const lines = []
  lines.push(`## ${id}. ${key}`)
  lines.push('')
  lines.push(`| Thuộc tính | Giá trị |`)
  lines.push(`| --- | --- |`)
  lines.push(`| **Template Key** | \`${key}\` |`)
  lines.push(`| **Trigger / Tính năng** | ${trigger.replace(/\n/g, ' ')} |`)
  if (priority) lines.push(`| **Priority** | ${priority} |`)
  lines.push('')
  lines.push('### Tiêu đề mail (JP → EN)')
  lines.push('')
  lines.push('```text')
  lines.push(subject)
  lines.push('```')
  lines.push('')
  lines.push('### Nội dung mail (JP → EN)')
  lines.push('')
  lines.push('```text')
  lines.push(body)
  lines.push('```')
  lines.push('')
  if (cta && cta !== '—') {
    lines.push('### CTA (JP → EN)')
    lines.push('')
    lines.push('```text')
    lines.push(cta)
    lines.push('```')
    lines.push('')
  }
  if (ctaLink) {
    lines.push('### CTA link / Suggested route')
    lines.push('')
    lines.push(ctaLink)
    lines.push('')
  }
  if (vars) {
    lines.push('### Biến bắt buộc')
    lines.push('')
    lines.push(`\`${vars}\``)
    lines.push('')
  }
  if (notes) {
    lines.push('### Ghi chú triển khai')
    lines.push('')
    lines.push(notes)
    lines.push('')
  }
  lines.push('---')
  lines.push('')
  return lines.join('\n')
}

ensureExtracted()

const workbookPath = path.join(extractDir, 'xl/workbook.xml')
const workbookXml = fs.readFileSync(workbookPath, 'utf8')
const sheetNames = [...workbookXml.matchAll(/name="([^"]+)"/g)].map((m) => m[1])

const sheetFiles = ['sheet1.xml', 'sheet2.xml', 'sheet3.xml']
const md = []

md.push('# JobShare Business — Email Notification Spec (JP / EN)')
md.push('')
md.push('> Nguồn: `JobShare_Business_Email_Notification_Spec_JP_EN (1).xlsx`')
md.push('> Xuất tự động — mỗi action/template một mục bên dưới.')
md.push('')

const emailHeaders = [
  'ID',
  'Template Key',
  'Trigger / Tính năng',
  'Tiêu đề mail (JP → EN)',
  'Nội dung mail (JP → EN)',
  'CTA (JP → EN)',
  'CTA link / Route',
  'Biến bắt buộc',
  'Ghi chú triển khai',
  'Priority',
]

for (let i = 0; i < sheetFiles.length; i++) {
  const name = sheetNames[i] || `Sheet ${i + 1}`
  const xml = fs.readFileSync(path.join(extractDir, 'xl/worksheets', sheetFiles[i]), 'utf8')
  const rows = parseSheetXml(xml)
  if (!rows.length) continue

  md.push(`# Phần: ${name}`)
  md.push('')

  if (i === 0) {
    const headerRow = rows[0]
    const dataRows = rows.slice(1).filter((r) => r.cells[1] || r.cells[2])
    md.push('## Mục lục')
    md.push('')
    for (const r of dataRows) {
      const id = r.cells[0] ?? ''
      const key = r.cells[1] ?? ''
      const trigger = (r.cells[2] ?? '').split('\n')[0]
      md.push(`- [${id}. ${key}](#${id}-${key.toLowerCase().replace(/_/g, '-')}) — ${trigger}`)
    }
    md.push('')
    md.push('# Chi tiết từng action (Email Templates)')
    md.push('')
    for (const r of dataRows) {
      md.push(sectionForTemplate(r, emailHeaders))
    }
  } else if (i === 1) {
    md.push('Quy tắc chung áp dụng cho mọi email JobShare Business.')
    md.push('')
    md.push('| Hạng mục | Quy tắc đề xuất cho IT |')
    md.push('| --- | --- |')
    for (const r of rows.slice(1)) {
      const a = (r.cells[0] ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
      let b = r.cells[1] ?? ''
      b = b.replace(/\\n/g, '\n').replace(/\|/g, '\\|')
      if (a.startsWith('Footer')) {
        md.push(`| **${a}** | |`)
        md.push('')
        md.push('```text')
        md.push(b)
        md.push('```')
        md.push('')
      } else if (a || b) {
        md.push(`| **${a}** | ${b.replace(/\n/g, ' ')} |`)
      }
    }
    md.push('')
  } else {
    md.push('Đề xuất bổ sung template / trigger (chưa có trong bảng chính hoặc mở rộng sau).')
    md.push('')
    const recRows = rows.slice(1).filter((r) => r.cells[1])
    md.push('## Mục lục')
    md.push('')
    for (const r of recRows) {
      const id = r.cells[0] ?? ''
      const key = r.cells[1] ?? ''
      const trigger = (r.cells[2] ?? '').split('\n')[0]
      md.push(`- [${id}. ${key}](#${String(id).toLowerCase()}-${key.toLowerCase().replace(/_/g, '-')}) — ${trigger}`)
    }
    md.push('')
    const header = rows[0]
    const hdrs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      .map((c) => header.cells[c])
      .filter((h) => h)
    const useHdrs = hdrs.length ? hdrs : emailHeaders.slice(0, Math.max(...Object.keys(header.cells).map(Number)) + 1)
    const dataRows = rows.slice(1).filter((r) => Object.values(r.cells).some(Boolean))
    if (dataRows.length) {
      for (const r of dataRows) {
        if (r.cells[1]) {
          md.push(sectionForTemplate(r, emailHeaders))
        } else {
          md.push('```text')
          md.push(Object.values(r.cells).filter(Boolean).join('\n\n'))
          md.push('```')
          md.push('')
        }
      }
    } else {
      md.push(rowsToTable(rows, useHdrs.length ? useHdrs : ['Cột A', 'Cột B', 'Cột C']))
    }
  }
}

fs.writeFileSync(outPath, md.join('\n'), 'utf8')
console.log('Wrote', outPath, 'bytes', fs.statSync(outPath).size)
