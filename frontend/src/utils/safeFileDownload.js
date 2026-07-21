/**
 * Tải file an toàn trên iOS Safari / WebKit:
 * - window.open sau async thường bị chặn popup
 * - revokeObjectURL quá sớm làm mất blob trước khi tải xong
 */

export function isIOSOrIPadOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
  return false;
}

/** Lấy tên file từ header Content-Disposition (hỗ trợ filename*=UTF-8). */
export function parseContentDispositionFilename(disposition, fallback = 'download') {
  if (!disposition || typeof disposition !== 'string') return fallback;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;\n]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const asciiMatch = disposition.match(/filename="([^"]*)"/i) || disposition.match(/filename=([^;\n]+)/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1].trim().replace(/^["']|["']$/g, '') || fallback;
  }
  return fallback;
}

/** URL S3 / CDN — fetch từ JS bị chặn CORS; phải mở link trực tiếp. */
export function isExternalStorageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes('amazonaws.com') || host.startsWith('s3.') || host.includes('.s3.');
  } catch {
    return false;
  }
}

function shouldNavigateDirectly(url, headers = {}) {
  if (typeof window === 'undefined') return isExternalStorageUrl(url);
  if (isExternalStorageUrl(url)) return true;
  try {
    const origin = new URL(url).origin;
    const hasAuth = Boolean(headers?.Authorization || headers?.authorization);
    return origin !== window.location.origin && !hasAuth;
  } catch {
    return false;
  }
}

/**
 * Fetch URL có auth → blob → lưu với tên từ Content-Disposition hoặc fallback.
 * URL S3 presigned / cross-origin không CORS → mở link trực tiếp (tên file từ query disposition).
 */
export async function downloadAuthenticatedFileUrl(url, { headers = {}, fallbackName = 'download' } = {}) {
  if (!url) throw new Error('Missing download URL');
  let fetchUrl = url;
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && fetchUrl.startsWith('http://')) {
    fetchUrl = fetchUrl.replace(/^http:\/\//i, 'https://');
  }
  if (shouldNavigateDirectly(fetchUrl, headers)) {
    openRemoteFileDownloadUrl(fetchUrl);
    return;
  }
  const res = await fetch(fetchUrl, { method: 'GET', headers });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  const name = parseContentDispositionFilename(res.headers.get('Content-Disposition'), fallbackName);
  downloadBlobAsFile(blob, name);
}

/**
 * Tải Blob (PDF/ZIP/…) về máy. Trên iOS trì hoãn revoke lâu hơn.
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlobAsFile(blob, filename = 'download') {
  if (!blob || !(blob instanceof Blob)) return;
  const url = URL.createObjectURL(blob);
  const name = String(filename || 'download').replace(/[\\/:*?"<>|]/g, '_') || 'download';
  const revokeDelayMs = isIOSOrIPadOS() ? 60000 : 4000;

  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (_) {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e2) {
      window.location.assign(url);
    }
  } finally {
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch (_) {}
    }, revokeDelayMs);
  }
}

/**
 * Mở URL đã ký (S3/presigned) để tải hoặc xem file.
 * Tránh window.open sau await (bị chặn trên iOS) bằng iframe ẩn + fallback.
 */
export function openRemoteFileDownloadUrl(url) {
  if (!url || typeof url !== 'string') return;

  if (isIOSOrIPadOS()) {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none;';
    iframe.src = url;
    document.body.appendChild(iframe);
    setTimeout(() => {
      try {
        iframe.remove();
      } catch (_) {}
    }, 180000);
    return;
  }

  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win || win.closed) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
