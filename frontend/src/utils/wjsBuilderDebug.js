/** Bật log: localStorage.setItem('wjs-debug','1') · Tắt: localStorage.setItem('wjs-debug','0') */
export function isWjsDebugEnabled() {
  if (typeof localStorage !== 'undefined') {
    const flag = localStorage.getItem('wjs-debug');
    if (flag === '0') return false;
    if (flag === '1') return true;
  }
  return typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);
}

let bootLogged = false;

export function wjsDebug(tag, ...args) {
  if (!isWjsDebugEnabled()) return;
  if (!bootLogged) {
    bootLogged = true;
    console.log('[wjs:debug] Builder debug ON (localStorage wjs-debug=0 to disable)');
  }
  console.log(`[wjs:${tag}]`, ...args);
}

/** Safe closest — e.target có thể là Text node (không có .closest). */
export function eventTargetElement(e) {
  const t = e?.target;
  if (!t) return null;
  if (t.nodeType === Node.ELEMENT_NODE) return t;
  return t.parentElement ?? null;
}

export function closestFromEvent(e, selector) {
  return eventTargetElement(e)?.closest(selector) ?? null;
}
