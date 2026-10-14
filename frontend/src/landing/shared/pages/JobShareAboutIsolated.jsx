import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import {
  useJobShareAboutEffects,
  useJobShareAboutHtml,
} from '../../business/readycrew/pages/about/JobShareAboutContent'
import homeV2Css from '../../business/readycrew/pages/home/jobshare-v2/jobshare-home-v2.css?inline'
import aboutCss from '../../business/readycrew/pages/about/about-us.page.css?inline'

/** Màu chủ đạo đỏ của site CTV / ứng viên thay cho xanh của bản doanh nghiệp. */
const RED_THEME =
  '.jsb-v2{--blue:#ed212f;--blue-deep:#be1824;--blue-ink:#5a0d13;--sky:#fdeff0;--sky2:#fff7f7;--line:#ead7d9}'

const RED_HUE = 356

function rgbToHsl(r, g, b) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return [h * 60, s, l]
}

function hslToRgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255))
}

/** Xoay các màu xanh dương bão hòa sang đỏ (giữ độ sáng / alpha); màu chữ xám-xanh đậm giữ nguyên. */
function blueToRed(r, g, b) {
  const [h, s, l] = rgbToHsl(r, g, b)
  if (h < 185 || h > 228 || s < 0.5 || l < 0.18 || l > 0.85) return null
  return hslToRgb(RED_HUE, Math.min(1, s * 0.92), l < 0.5 ? Math.min(0.55, l * 1.25) : l)
}

const toHex = (rgb) => rgb.map((v) => v.toString(16).padStart(2, '0')).join('')

/** Bản build minify màu thành #rgb / #rgba / #rrggbbaa nên phải xử lý đủ các dạng hex. */
function hexBlueToRed(match, hex) {
  if (![3, 4, 6, 8].includes(hex.length)) return match
  const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex
  const red = blueToRed(...[0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)))
  return red ? `#${toHex(red)}${full.slice(6)}` : match
}

const toRed = (css) =>
  css
    .replace(/#0077b6\b/gi, '#ed212f')
    .replace(/#005b8d\b/gi, '#be1824')
    .replace(/#([0-9a-f]{3,8})\b/gi, hexBlueToRed)
    .replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+\s*)?\)/gi, (match, r, g, b, alpha) => {
      const red = blueToRed(Number(r), Number(g), Number(b))
      if (!red) return match
      return alpha ? `rgba(${red.join(',')}${alpha.replace(/\s+/g, '')})` : `rgb(${red.join(',')})`
    })

const SHADOW_CSS = `:host{display:block}:where(p){margin:0}:where(a){font-weight:500}${toRed(homeV2Css)}\n${toRed(aboutCss)}\n${RED_THEME}`

/**
 * About Us V5 cho site CTV / ứng viên. Render trong Shadow DOM vì CSS của site
 * (selector `#collaborator-site-root …`) trùng class với template (.btn, .kicker, h1…).
 */
export default function JobShareAboutIsolated({ locale }) {
  const hostRef = useRef(null)
  const [shadow, setShadow] = useState(null)
  const html = useJobShareAboutHtml(locale)

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return
    setShadow(host.shadowRoot || host.attachShadow({ mode: 'open' }))
  }, [])

  useLayoutEffect(() => {
    if (!shadow) return
    shadow.innerHTML = `<style>${SHADOW_CSS}</style>${html}`
  }, [shadow, html])

  useLayoutEffect(() => {
    if (!shadow) return undefined
    const onClick = (event) => {
      const anchor = event.target.closest?.('a[href^="#"]')
      if (!anchor) return
      const id = decodeURIComponent(anchor.getAttribute('href').slice(1))
      const target = id && shadow.getElementById(id)
      if (!target) return
      event.preventDefault()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    shadow.addEventListener('click', onClick)
    return () => shadow.removeEventListener('click', onClick)
  }, [shadow])

  const getRoot = useCallback(() => shadow?.getElementById('jobshare-business-v2') ?? null, [shadow])
  useJobShareAboutEffects(shadow ? html : null, getRoot)

  return <div ref={hostRef} />
}
