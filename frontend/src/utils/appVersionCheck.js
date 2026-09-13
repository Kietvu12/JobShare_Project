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

async function fetchRemoteVersion() {
  const res = await fetch(`/version.json?_=${Date.now()}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data?.version ? String(data.version) : null
}

function promptVersionUpdate() {
  if (typeof window.__wjsShowUpdateBanner === 'function') {
    window.__wjsShowUpdateBanner()
    return
  }
  if (typeof window.__wjsShowBootRecover === 'function') {
    window.__wjsShowBootRecover()
  }
}

/** Tab đang mở lúc deploy — báo user bấm tải lại, không tự reload. */
export async function checkRemoteAppVersion() {
  if (import.meta.env.DEV) return false

  const embedded = readEmbeddedVersion()
  if (!embedded) return false

  try {
    const remote = await fetchRemoteVersion()
    if (!remote || remote === embedded) return false
    promptVersionUpdate()
    return true
  } catch {
    return false
  }
}

/** Chunk lỗi sau deploy — hiện banner, user tự bấm tải lại. */
export function setupDeployRecovery() {
  if (import.meta.env.DEV) return undefined

  window.addEventListener('vite:preloadError', () => {
    promptVersionUpdate()
  })

  window.addEventListener('unhandledrejection', (event) => {
    const message = String(event?.reason?.message || event?.reason || '')
    if (
      /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
        message,
      )
    ) {
      promptVersionUpdate()
    }
  })

  return undefined
}

export function startAppVersionWatcher() {
  if (import.meta.env.DEV) return undefined

  const runRemoteCheck = () => {
    checkRemoteAppVersion()
  }

  runRemoteCheck()
  const intervalId = window.setInterval(runRemoteCheck, 30 * 1000)

  const onVisible = () => {
    if (document.visibilityState === 'visible') runRemoteCheck()
  }
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', runRemoteCheck)

  return () => {
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('focus', runRemoteCheck)
    window.clearInterval(intervalId)
  }
}
