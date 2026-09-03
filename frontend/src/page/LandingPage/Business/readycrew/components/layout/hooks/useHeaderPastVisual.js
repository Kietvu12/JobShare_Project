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
    return window.scrollY > 80
  }

  const headerHeight = headerMain?.offsetHeight ?? 70
  const headerTop = headerMain?.getBoundingClientRect().top ?? 0
  const visualBottom = visual.offsetTop + visual.offsetHeight

  return window.scrollY + headerTop + headerHeight >= visualBottom - 8
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
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frameId) window.cancelAnimationFrame(frameId)
      document.querySelector('.header')?.classList.remove('header--past-visual')
    }
  }, [pathname])

  return pastVisual
}
