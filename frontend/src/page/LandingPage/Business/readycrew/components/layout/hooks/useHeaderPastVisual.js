import { useEffect, useState } from 'react'

const PAGE_VISUAL_SELECTORS = [
  '.front-page-visual',
  '.jsb-v2 .hero',
  '.l-article-mv-plus-lower',
  '.page-price-visual',
  '.page-proposal-visual',
  '.page-news-visual',
  '.page-document-visual',
  '.page-results-visual',
  '.page-manga-visual',
  '.l-article-mv',
].join(', ')

export function getPageVisualElement() {
  return document.querySelector(PAGE_VISUAL_SELECTORS)
}

export function getLandingScrollTop() {
  const root = document.getElementById('root')
  return Math.max(
    window.scrollY || 0,
    document.documentElement?.scrollTop || 0,
    document.body?.scrollTop || 0,
    root?.scrollTop || 0,
  )
}

function getScrollEventTargets() {
  const root = document.getElementById('root')
  return [window, document, document.documentElement, document.body, root].filter(Boolean)
}

export function isPastPageVisual() {
  const visual = getPageVisualElement()
  const headerMain = document.querySelector('.header-main')

  if (!visual) {
    return getLandingScrollTop() > 80
  }

  const headerHeight = headerMain?.offsetHeight ?? 70
  const headerTop = headerMain?.getBoundingClientRect().top ?? 0
  // Dùng getBoundingClientRect thay offsetTop: offsetTop lệch khi offsetParent không phải body
  // (dẫn tới thanh phụ header vẫn chữ trắng khi đã cuộn qua khỏi hero).
  const visualBottom = visual.getBoundingClientRect().bottom

  return headerTop + headerHeight >= visualBottom - 8
}

export function useHeaderPastVisual(pathname) {
  const [pastVisual, setPastVisual] = useState(false)

  useEffect(() => {
    let frameId = 0

    const update = () => {
      frameId = 0
      const next = isPastPageVisual()
      setPastVisual(next)

      const header = document.querySelector('.header')
      header?.classList.toggle('header--past-visual', next)
    }

    const onScroll = () => {
      if (frameId) return
      frameId = window.requestAnimationFrame(update)
    }

    update()
    const timeoutId = window.setTimeout(update, 200)
    const scrollOpts = { passive: true, capture: true }
    // #root có overflow-y:auto (index.css <1500px) — scroll không lên window
    getScrollEventTargets().forEach((target) => {
      target.addEventListener('scroll', onScroll, scrollOpts)
    })
    window.addEventListener('resize', onScroll)

    return () => {
      window.clearTimeout(timeoutId)
      getScrollEventTargets().forEach((target) => {
        target.removeEventListener('scroll', onScroll, scrollOpts)
      })
      window.removeEventListener('resize', onScroll)
      if (frameId) window.cancelAnimationFrame(frameId)
      document.querySelector('.header')?.classList.remove('header--past-visual')
    }
  }, [pathname])

  return pastVisual
}
