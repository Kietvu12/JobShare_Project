/**
 * Sau `vite build`: ghi manifest asset hiện tại + hướng dẫn deploy an toàn.
 * KHÔNG xóa thư mục assets trên server trước khi upload — merge file mới lên.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const assetsDir = path.join(distDir, 'assets')

function listFiles(dir, base = '') {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const rel = base ? `${base}/${name}` : name
    if (fs.statSync(full).isDirectory()) {
      out.push(...listFiles(full, rel))
    } else {
      out.push(rel.replace(/\\/g, '/'))
    }
  }
  return out
}

const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')
const assetRefs = [...indexHtml.matchAll(/\/assets\/[^"'\s)]+/g)].map((m) => m[0].replace(/^\//, ''))
const assetFiles = listFiles(assetsDir, 'assets')

const manifest = {
  builtAt: new Date().toISOString(),
  shell: ['index.html', 'version.json'],
  assets: assetFiles,
  referencedInIndex: assetRefs,
}

fs.writeFileSync(path.join(distDir, 'deploy-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

console.log('\n[deploy] deploy-manifest.json written')
console.log('[deploy] Upload TOÀN BỘ nội dung dist/ lên server (merge, KHÔNG xóa assets/ cũ trước).')
console.log('[deploy] Tab đang mở sẽ tự reload khi asset 404 sau deploy.\n')
