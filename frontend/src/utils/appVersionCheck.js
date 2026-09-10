const STORAGE_KEY = 'wjs_app_version'
const RELOAD_FLAG_KEY = 'wjs_app_version_reload'

function readStoredVersion() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredVersion(version) {
  try {
    localStorage.setItem(STORAGE_KEY, version)
  } catch {
    /* ignore quota / private mode */
  }
}

function clearReloadFlag() {
  try {
    sessionStorage.removeItem(RELOAD_FLAG_KEY)
  } catch {
    /* ignore */
  }
}

function readEmbeddedVersion() {
  if (import.meta.env.DEV) return null
  const fromEnv = import.meta.env.VITE_APP_BUILD_ID
  if (fromEnv) return String(fromEnv)
  try {
    return document.querySelector('meta[name="app-build-id"]')?.getAttribute('content') || null
  } catch {
    return null
  }
}

async function clearBrowserCaches() {
  try {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }
  } catch {
    /* ignore */
  }

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    }
  } catch {
    /* ignore */
  }
}

async function fetchRemoteVersion() {
  const res = await fetch(`/version.json?_=${Date.now()}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data?.version ? String(data.version) : null
}

function reloadForVersion(version) {
  const reloadFlag = sessionStorage.getItem(RELOAD_FLAG_KEY)
  if (reloadFlag === version) {
    clearReloadFlag()
    writeStoredVersion(version)
    return
  }

  try {
    sessionStorage.setItem(RELOAD_FLAG_KEY, version)
  } catch {
    /* ignore */
  }

  writeStoredVersion(version)
  const url = new URL(window.location.href)
  url.searchParams.set('_v', version)
  void clearBrowserCaches().finally(() => {
    window.location.replace(url.toString())
  })
}

function shouldReloadForVersion(version) {
  if (!version) return false
  const stored = readStoredVersion()
  const embedded = readEmbeddedVersion()
  if (stored && stored !== version) return true
  if (embedded && embedded !== version) return true
  return false
}

function applyVersion(version) {
  if (!version) return false
  if (shouldReloadForVersion(version)) {
    reloadForVersion(version)
    return true
  }
  if (!readStoredVersion()) writeStoredVersion(version)
  clearReloadFlag()
  return false
}

/** Chặn boot React cho tới khi xác nhận không cần reload sau deploy. */
export async function ensureFreshDeploy() {
  if (import.meta.env.DEV) return false

  const embedded = readEmbeddedVersion()
  const stored = readStoredVersion()

  if (embedded && stored && stored !== embedded) {
    reloadForVersion(embedded)
    await new Promise(() => {})
  }

  try {
    const remoteVersion = await fetchRemoteVersion()
    if (applyVersion(remoteVersion)) {
      await new Promise(() => {})
    }
    if (remoteVersion && !stored) writeStoredVersion(remoteVersion)
    else if (embedded && !stored) writeStoredVersion(embedded)
  } catch {
    /* network error — tiếp tục boot với bundle hiện tại */
  }

  return false
}

/** So sánh build id baked-in (bundle hiện tại) với bản server. */
export function checkEmbeddedAppVersion() {
  if (import.meta.env.DEV) return false
  const version = readEmbeddedVersion()
  return applyVersion(version)
}

/** Poll version.json — bắt user đang mở tab cũ sau khi deploy. */
export async function checkRemoteAppVersion() {
  if (import.meta.env.DEV) return false
  try {
    const remoteVersion = await fetchRemoteVersion()
    const embedded = readEmbeddedVersion()
    if (remoteVersion && embedded && embedded !== remoteVersion) {
      reloadForVersion(remoteVersion)
      return true
    }
    return applyVersion(remoteVersion)
  } catch {
    return false
  }
}

function handleAssetLoadFailure() {
  if (import.meta.env.DEV) return
  reloadForVersion(String(Date.now()))
}

/** Bắt lỗi chunk/asset sau deploy (file hash cũ không còn trên server). */
export function setupDeployRecovery() {
  if (import.meta.env.DEV) return undefined

  window.addEventListener(
    'error',
    (event) => {
      const target = event.target
      if (!target || !target.tagName) return
      if (target.tagName !== 'SCRIPT' && target.tagName !== 'LINK') return
      const src = target.src || target.href || ''
      if (src.includes('/assets/') || /\.m?js(?:\?|$)/i.test(src)) {
        handleAssetLoadFailure()
      }
    },
    true,
  )

  window.addEventListener('vite:preloadError', () => {
    handleAssetLoadFailure()
  })

  return undefined
}

export function startAppVersionWatcher() {
  if (import.meta.env.DEV) return undefined

  checkEmbeddedAppVersion()

  const runRemoteCheck = () => {
    checkRemoteAppVersion()
  }

  runRemoteCheck()

  const onVisible = () => {
    if (document.visibilityState === 'visible') runRemoteCheck()
  }
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', runRemoteCheck)

  const intervalId = window.setInterval(runRemoteCheck, 60 * 1000)

  return () => {
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('focus', runRemoteCheck)
    window.clearInterval(intervalId)
  }
}
