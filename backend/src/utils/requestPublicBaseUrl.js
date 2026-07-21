/**
 * Base URL công khai (scheme + host) — dùng sau reverse proxy (nginx).
 * Tránh req.protocol = http khi client truy cập HTTPS.
 */
export function getRequestPublicBaseUrl(req) {
  const forwardedProto = String(req.get('x-forwarded-proto') || '')
    .split(',')[0]
    .trim()
    .replace(/:$/, '');
  const proto = forwardedProto || req.protocol || 'http';
  const host = String(req.get('x-forwarded-host') || req.get('host') || '')
    .split(',')[0]
    .trim();
  return `${proto}://${host}`.replace(/\/+$/, '');
}
