import { useEffect, useState } from 'react'

const PAGE_VISUAL_SELECTORS = [
  '.front-page-visual',
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

export function isPastPageVisual() {
  const visual = getPageVisualElement()
  const headerMain = document.querySelector('.header-main')

  if (!visual) {
    return (document.scrollingElement?.scrollTop ?? 0) + (document.body?.scrollTop ?? 0) + window.scrollY > 80
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
    // capture: trang này cuộn trong <body> (overflow: auto), sự kiện scroll của phần tử không nổi lên window nếu không bắt ở capture
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onScroll)
      if (frameId) window.cancelAnimationFrame(frameId)
      document.querySelector('.header')?.classList.remove('header--past-visual')
    }
  }, [pathname])

  return pastVisual
}
