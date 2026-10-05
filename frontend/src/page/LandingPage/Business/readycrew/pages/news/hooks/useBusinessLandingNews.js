import { useCallback, useEffect, useState } from 'react'
import apiService from '../../../../../../../services/api'

const PAGE_SIZE = 10

export function buildNewsPaginationModel(currentPage, totalPages) {
  if (totalPages <= 1) return { pages: [], hasNext: false, nextPage: null }

  const pages = []
  const windowSize = 5
  let start = Math.max(1, currentPage - 2)
  let end = Math.min(totalPages, start + windowSize - 1)
  start = Math.max(1, end - windowSize + 1)

  if (start > 1) {
    pages.push({ page: 1 })
    if (start > 2) pages.push({ type: 'dots' })
  }
  for (let p = start; p <= end; p += 1) {
    pages.push({ page: p, current: p === currentPage })
  }
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push({ type: 'dots' })
    pages.push({ page: totalPages })
  }

  return {
    pages,
    hasNext: currentPage < totalPages,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
  }
}

export function useBusinessLandingNews() {
  const [page, setPage] = useState(1)
  const [categoryId, setCategoryIdState] = useState('')
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const setCategoryId = useCallback((id) => {
    setCategoryIdState(id)
    setPage(1)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiService.getPublicPostCategories()
        if (cancelled) return
        const list = res?.data?.categories || []
        setCategories(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setCategories([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const params = {
          page,
          limit: PAGE_SIZE,
          sortBy: 'publishedAt',
          sortOrder: 'DESC',
          surface: 'business',
        }
        if (categoryId) params.categoryId = categoryId

        const res = await apiService.getPublicPosts(params)
        if (cancelled) return
        const list = res?.data?.posts || []
        const tp = res?.data?.pagination?.totalPages ?? 1
        setPosts(Array.isArray(list) ? list : [])
        setTotalPages(Math.max(1, Number(tp) || 1))
      } catch {
        if (!cancelled) {
          setPosts([])
          setTotalPages(1)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [page, categoryId])

  const pagination = buildNewsPaginationModel(page, totalPages)

  return {
    page,
    setPage,
    categoryId,
    setCategoryId,
    posts,
    categories,
    totalPages,
    loading,
    pagination,
  }
}
