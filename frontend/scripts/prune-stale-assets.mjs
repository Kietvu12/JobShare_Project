/**
 * Chạy TRÊN SERVER sau vài ngày deploy — xóa file /assets cũ không còn trong index.html.
 * Usage: node prune-stale-assets.mjs /home/ubuntu/JobShare_Web_True/frontend
 */
import fs from 'node:fs'
import path from 'node:path'

const frontendRoot = process.argv[2]
if (!frontendRoot) {
  console.error('Usage: node prune-stale-assets.mjs <frontend-root>')
  process.exit(1)
}

const indexPath = path.join(frontendRoot, 'index.html')
const assetsDir = path.join(frontendRoot, 'assets')

if (!fs.existsSync(indexPath) || !fs.existsSync(assetsDir)) {
  console.error('index.html or assets/ not found')
  process.exit(1)
}

const indexHtml = fs.readFileSync(indexPath, 'utf8')
const keep = new Set(
  [...indexHtml.matchAll(/\/assets\/[^"'\s)]+/g)].map((m) => path.basename(m[0])),
)

let removed = 0
for (const file of fs.readdirSync(assetsDir)) {
  if (keep.has(file)) continue
  fs.unlinkSync(path.join(assetsDir, file))
  removed += 1
}

console.log(`Pruned ${removed} stale asset(s). Kept ${keep.size} referenced file(s).`)
