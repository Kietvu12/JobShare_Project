import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { cpSync, existsSync } from 'node:fs'
import sirv from 'sirv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templateDir = path.resolve(__dirname, 'template')
const collaboratorV3Dir = path.resolve(
  __dirname,
  'src/landing/templates/JobShare_Collaborator_V3',
)

function serveCollaboratorV3Public() {
  let buildOutDir = path.resolve(__dirname, 'dist')

  return {
    name: 'serve-collaborator-v3-public',
    configResolved(config) {
      buildOutDir = path.resolve(config.root, config.build.outDir)
    },
    configureServer(server) {
      server.middlewares.use(
        '/landing/collaborator-v3',
        sirv(collaboratorV3Dir, {
          dev: true,
          single: false,
          setHeaders(res, filepath) {
            if (filepath.endsWith('.html')) {
              res.setHeader('Content-Type', 'text/html; charset=utf-8')
            }
          },
        }),
      )
    },
    configurePreviewServer(server) {
      server.middlewares.use(
        '/landing/collaborator-v3',
        sirv(collaboratorV3Dir, { dev: false, single: false }),
      )
    },
    closeBundle() {
      const dest = path.join(buildOutDir, 'landing/collaborator-v3')
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.cpSync(collaboratorV3Dir, dest, { recursive: true })
    },
  }
}

function serveTemplateAssets() {
  let buildOutDir = path.resolve(__dirname, 'dist')

  return {
    name: 'serve-landing-templates',
    enforce: 'pre',
    configResolved(config) {
      buildOutDir = path.resolve(config.root, config.build.outDir)
    },
    configureServer(server) {
      server.middlewares.use(
        '/template',
        sirv(templateDir, {
          dev: true,
          single: false,
          setHeaders(res, filepath) {
            if (filepath.endsWith('.html')) {
              res.setHeader('Content-Type', 'text/html; charset=utf-8')
            }
          },
        }),
      )
    },
    configurePreviewServer(server) {
      server.middlewares.use('/template', sirv(templateDir, { dev: false, single: false }))
    },
    closeBundle() {
      const dest = path.join(buildOutDir, 'template')
      fs.cpSync(templateDir, dest, { recursive: true })
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

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const localApi = env.VITE_DEV_API_PROXY || 'http://localhost:3000'
  /** Nguồn JobShare production cho `/api_jobshare` — không dùng VITE_API_BASE_URL (thường trỏ backend local). */
  const jobshareRemoteRaw = (env.VITE_PUBLIC_JOBS_API_ORIGIN || 'https://ws-jobshare.com').trim()
  let jobshareRemoteOrigin = 'https://ws-jobshare.com'
  try {
    if (jobshareRemoteRaw.startsWith('http')) {
      jobshareRemoteOrigin = new URL(jobshareRemoteRaw).origin
    }
  } catch {
    /* keep default */
  }

  return {
    plugins: [
      copyPdfWorkerPlugin(),
      react(),
      tailwindcss(),
      serveCollaboratorV3Public(),
      serveTemplateAssets(),
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@landing': path.resolve(__dirname, 'src/landing'),
      },
    },
    base: '/',
    server: {
      strictPort: false,
      proxy: {
        // Phải đặt trước `/api` — path `/api_jobshare/...` cũng bắt đầu bằng `/api`.
        '/api_jobshare': {
          target: jobshareRemoteOrigin,
          changeOrigin: true,
          secure: true,
          ws: true,
        },
        '^/api/': {
          target: localApi,
          changeOrigin: true,
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
