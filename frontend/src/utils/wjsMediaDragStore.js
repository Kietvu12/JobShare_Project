/** Payload kéo-thả ảnh từ thư viện media (parent → iframe không luôn đọc được dataTransfer). */
let activePayload = null;

export function setWjsMediaDragPayload(url) {
  activePayload = url || null;
}

export function getWjsMediaDragPayload() {
  return activePayload;
}

export function clearWjsMediaDragPayload() {
  activePayload = null;
}

export function readWjsMediaDropUrl(dataTransfer) {
  const fromTransfer = dataTransfer?.getData?.('application/x-wjs-media-url') || '';
  return fromTransfer || getWjsMediaDragPayload() || '';
}
