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
  window.location.replace(url.toString())
}

function applyVersion(version) {
  if (!version) return false
  const stored = readStoredVersion()
  if (stored && stored !== version) {
    reloadForVersion(version)
    return true
  }
  if (!stored) writeStoredVersion(version)
  clearReloadFlag()
  return false
}

/** So sánh build id baked-in (bundle hiện tại) với bản server. */
export function checkEmbeddedAppVersion() {
  if (import.meta.env.DEV) return false
  const version = import.meta.env.VITE_APP_BUILD_ID
  return applyVersion(version)
}

/** Poll version.json — bắt user đang mở tab cũ sau khi deploy. */
export async function checkRemoteAppVersion() {
  if (import.meta.env.DEV) return false
  try {
    const remoteVersion = await fetchRemoteVersion()
    return applyVersion(remoteVersion)
  } catch {
    return false
  }
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

  const intervalId = window.setInterval(runRemoteCheck, 5 * 60 * 1000)

  return () => {
    document.removeEventListener('visibilitychange', onVisible)
    window.clearInterval(intervalId)
  }
}
