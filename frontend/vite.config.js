import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cpSync, existsSync } from 'node:fs'
import sirv from 'sirv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
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
    plugins: [copyPdfWorkerPlugin(), react(), tailwindcss(), serveTemplateAssets()],
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
