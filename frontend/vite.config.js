import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import sirv from 'sirv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const deployGuardInlineScript = readFileSync(
  path.resolve(__dirname, 'src/utils/deployGuard.inline.js'),
  'utf8',
).trim()
const templateDir = path.resolve(__dirname, 'template')

function serveTemplateAssets() {
  return {
    name: 'serve-landing-templates',
    configureServer(server) {
      server.middlewares.use('/template', sirv(templateDir, { dev: true, single: false }))
    },
    configurePreviewServer(server) {
      server.middlewares.use('/template', sirv(templateDir, { dev: false, single: false }))
    },
  }
}

/** pdf.js worker — luôn serve cùng origin (tránh CDN worker.jobshare.com lỗi fetch). */
function copyPdfWorkerPlugin() {
  const workerSrc = path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs')
  const workerDest = path.resolve(__dirname, 'public/pdf.worker.min.js')
  const copy = () => {
    if (!existsSync(workerSrc)) return
    cpSync(workerSrc, workerDest)
  }
  return {
    name: 'copy-pdf-worker',
    buildStart: copy,
  }
}

function generateBuildId() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  try {
    const hash = execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (hash) return `${hash}-${stamp}`
  } catch {
    /* not a git repo or git unavailable */
  }
  return stamp
}

/** Ghi version.json + embed build id — client reload khi deploy bản mới. */
function appBuildVersionPlugin() {
  let buildId = 'dev'
  return {
    name: 'app-build-version',
    config(_config, { command }) {
      buildId = command === 'build' ? generateBuildId() : 'dev'
      return {
        define: {
          'import.meta.env.VITE_APP_BUILD_ID': JSON.stringify(buildId),
        },
      }
    },
    transformIndexHtml(html) {
      if (buildId === 'dev') return html
      const withMeta = html.replace(
        '</head>',
        `    <meta name="app-build-id" content="${buildId}" />\n    <script>${deployGuardInlineScript}</script>\n  </head>`,
      )
      return withMeta
    },
    closeBundle() {
      if (buildId === 'dev') return
      const outDir = path.resolve(__dirname, 'dist')
      writeFileSync(
        path.join(outDir, 'version.json'),
        `${JSON.stringify({ version: buildId, builtAt: new Date().toISOString() }, null, 2)}\n`,
        'utf8',
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const remoteApi = (env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  let remoteOrigin = 'https://ws-jobshare.com'
  try {
    if (remoteApi.startsWith('http')) {
      remoteOrigin = new URL(remoteApi).origin
    }
  } catch {
    /* keep default */
  }
  const localApi = env.VITE_DEV_API_PROXY || 'http://localhost:3000'

  return {
    plugins: [copyPdfWorkerPlugin(), appBuildVersionPlugin(), react(), tailwindcss(), serveTemplateAssets()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    base: '/',
    server: {
      strictPort: false,
      proxy: {
        '/api': { target: localApi, changeOrigin: true, ws: true },
        '/api_jobshare': {
          target: remoteOrigin,
          changeOrigin: true,
          secure: true,
          ws: true,
        },
        '/uploads': { target: localApi, changeOrigin: true },
        '/socket.io': { target: localApi, changeOrigin: true, ws: true },
      },
    },
    optimizeDeps: {
      include: ['react-datepicker', 'date-fns', 'recharts'],
    },
  }
})
