import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import sirv from 'sirv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templateDir = path.resolve(__dirname, 'template')

function serveTemplateAssets() {
  let buildOutDir = path.resolve(__dirname, 'dist')

  return {
    name: 'serve-landing-templates',
    configResolved(config) {
      buildOutDir = path.resolve(config.root, config.build.outDir)
    },
    configureServer(server) {
      server.middlewares.use('/template', sirv(templateDir, { dev: true, single: false }))
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
    plugins: [react(), tailwindcss(), serveTemplateAssets()],
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
