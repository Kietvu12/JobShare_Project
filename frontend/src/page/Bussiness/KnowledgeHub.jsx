import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, Clock, Eye, Loader2 } from 'lucide-react'
import nothingIllustration from '../../assets/Nothing.png'
import apiService, { normalizePostImageUrl } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import {
  pickPublicPostCategoryLabel,
  pickPublicPostExcerpt,
  pickPublicPostTitle,
} from '../../utils/publicPostDisplay'
import { getKnowledgeHubCopy } from '../../i18n/businessApp/knowledgeHub.js'

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"
const BRAND = '#0077B6'

const CATEGORY_SECTIONS = [
  { slug: 'tuyen-dung', title: 'Tuyển dụng' },
  { slug: 'quan-tri-nhan-su', title: 'Quản trị nhân sự' },
  { slug: 'phat-trien-doi-ngu', title: 'Phát triển đội ngũ' },
  { slug: 'phap-ly-tuan-thu', title: 'Pháp lý & tuân thủ' },
  { slug: 'ky-nang-nghe-nghiep', title: 'Kỹ năng nghề nghiệp' },
]

const hubStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .knowledge-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .knowledge-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .knowledge-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  .business-homepage-shell { --hp-zoom: 1; }
  @media (min-width: 1280px) and (max-width: 1535px) {
    .business-homepage-shell { --hp-zoom: 0.92; }
  }
  .business-homepage-ui { zoom: var(--hp-zoom); }
  @supports not (zoom: 1) {
    .business-homepage-ui {
      transform: scale(var(--hp-zoom));
      transform-origin: top left;
      width: calc(100% / var(--hp-zoom));
    }
  }
`

function formatPostDate(iso, lang) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const locale = lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'vi-VN'
  try {
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return ''
  }
}

function postImage(post) {
  const raw = post?.thumbnail || post?.image || ''
  return raw ? normalizePostImageUrl(raw) : ''
}

function estimateReadMinutes(post, lang) {
  const html = lang === 'en'
    ? (post?.contentEn || post?.content || '')
    : lang === 'ja'
      ? (post?.contentJp || post?.contentEn || post?.content || '')
      : (post?.content || post?.contentEn || post?.contentJp || '')
  const text = String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return 1
  return Math.max(1, Math.round(text.split(/\s+/).length / 200))
}

function SectionTitle({ children }) {
  return (
    <h2 className="border-b border-slate-200/80 pb-2 text-sm font-bold tracking-tight text-slate-900 sm:text-base">
      {children}
    </h2>
  )
}

function ArticleRow({ post, language, onOpen, className = '' }) {
  const img = postImage(post)
  const title = pickPublicPostTitle(post, language)
  const excerpt = pickPublicPostExcerpt(post, language)
  const category = pickPublicPostCategoryLabel(post, language, '')
  const date = formatPostDate(post.publishedAt || post.createdAt, language)
  const readMin = estimateReadMinutes(post, language)

  return (
    <button
      type="button"
      onClick={() => onOpen(post)}
      className={`group flex w-full gap-3 border-b border-slate-100 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50/60 sm:gap-4 sm:py-4 ${className}`}
    >
      <div className="h-[72px] w-[108px] shrink-0 overflow-hidden rounded-md bg-slate-100 sm:h-[80px] sm:w-[120px]">
        {img ? (
          <img src={img} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full items-center justify-center text-[9px] text-slate-400">KB</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {category ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#0077B6]">{category}</span>
        ) : null}
        <h3 className="mt-0.5 text-[13px] font-semibold leading-snug text-slate-900 group-hover:text-[#0077B6] sm:text-sm">
          {title}
        </h3>
        {excerpt ? (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-600 sm:text-xs">{excerpt}</p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-400">
          {date ? <span>{date}</span> : null}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden />
            {readMin} phút đọc
          </span>
        </div>
      </div>
    </button>
  )
}

const KnowledgeHub = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const copy = useMemo(() => getKnowledgeHubCopy(language), [language])
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [posts, setPosts] = useState([])
  const [popularPosts, setPopularPosts] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchTerm.trim()), 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoadingCategories(true)
        const res = await apiService.getBusinessKnowledgeCategories()
        if (!cancelled) setCategories(res?.data?.categories || [])
      } catch {
        if (!cancelled) setCategories([])
      } finally {
        if (!cancelled) setLoadingCategories(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const isBrowseAll = !searchQuery && !selectedCategoryId

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoadingPosts(true)
        setLoadError('')
        const listParams = { page: 1, limit: isBrowseAll ? 48 : 24, sortBy: 'published_at', sortOrder: 'DESC' }
        if (selectedCategoryId) listParams.categoryId = selectedCategoryId
        if (searchQuery) listParams.search = searchQuery

        const requests = [apiService.getBusinessKnowledgePosts(listParams)]
        if (isBrowseAll) {
          requests.push(apiService.getBusinessKnowledgePosts({
            page: 1,
            limit: 12,
            sortBy: 'viewCount',
            sortOrder: 'DESC',
          }))
        }

        const [listRes, popRes] = await Promise.all(requests)
        if (!cancelled) {
          setPosts(listRes?.data?.posts || [])
          setPopularPosts(isBrowseAll ? (popRes?.data?.posts || []) : [])
        }
      } catch (err) {
        if (!cancelled) {
          setPosts([])
          setPopularPosts([])
          setLoadError(err?.message || copy.loadPostsError)
        }
      } finally {
        if (!cancelled) setLoadingPosts(false)
      }
    })()
    return () => { cancelled = true }
  }, [selectedCategoryId, searchQuery, isBrowseAll, copy.loadPostsError])

  const categoriesWithPosts = useMemo(
    () => categories.filter((c) => (c.postCount ?? 0) > 0),
    [categories],
  )

  const openPost = useCallback((post) => {
    const key = post?.slug || post?.id
    if (!key) return
    navigate(`/business/knowledge/${encodeURIComponent(key)}`)
  }, [navigate])

  const hubSections = useMemo(() => {
    if (!isBrowseAll || !posts.length) return null

    const used = new Set()

    const hero = [...posts].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))[0] || posts[0]
    if (hero) used.add(String(hero.id))

    const pickUnused = (list, limit) => {
      const out = []
      for (const p of list) {
        const id = String(p.id)
        if (used.has(id)) continue
        out.push(p)
        used.add(id)
        if (out.length >= limit) break
      }
      return out
    }

    const featured = pickUnused(
      [...posts].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)),
      5,
    )

    const latest = pickUnused(posts, 6)

    const byCategorySlug = {}
    for (const { slug, title } of CATEGORY_SECTIONS) {
      const cat = categories.find((c) => c.slug === slug)
      if (!cat || (cat.postCount ?? 0) === 0) continue
      const inCat = posts.filter((p) => String(p.category?.id || p.categoryId) === String(cat.id))
      const items = pickUnused(inCat, 4)
      if (items.length) byCategorySlug[slug] = { title, items }
    }

    return { hero, featured, latest, byCategorySlug, usedIds: used }
  }, [isBrowseAll, posts, categories])

  const sidebarPopular = useMemo(() => {
    const used = hubSections?.usedIds || new Set()
    return popularPosts.filter((p) => !used.has(String(p.id))).slice(0, 6)
  }, [popularPosts, hubSections])

  const resetFilters = () => {
    setSelectedCategoryId(null)
    setSearchTerm('')
  }

  return (
    <>
      <style>{hubStyles}</style>
      <div
        className="business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-white"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="business-homepage-ui flex min-h-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 border-b border-slate-200/80 bg-white px-3 py-3 sm:px-5">
            <nav aria-label="Breadcrumb" className="mb-2 text-[11px] text-slate-500">
              <button type="button" onClick={() => navigate('/business')} className="transition hover:text-[#0077B6]">
                {copy.breadcrumb.home}
              </button>
              <span className="mx-1.5 text-slate-300">/</span>
              <span className="font-medium text-slate-800">{copy.breadcrumb.current}</span>
            </nav>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 focus-within:border-[#0077B6]/35 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0077B6]/10">
                <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <input
                  type="search"
                  placeholder={copy.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-w-0 flex-1 border-none bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
              <button
                type="button"
                onClick={resetFilters}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors sm:text-xs ${
                  !selectedCategoryId
                    ? 'bg-[#0077B6] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                Tất cả
              </button>
              {loadingCategories ? (
                <span className="inline-flex items-center gap-1 py-1 text-[11px] text-slate-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                </span>
              ) : categoriesWithPosts.map((cat) => {
                const active = selectedCategoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(active ? null : cat.id)}
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors sm:text-xs ${
                      active
                        ? 'bg-[#0077B6] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    {cat.name}
                  </button>
                )
              })}
            </div>
          </header>

          <div className="knowledge-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#fafbfc]">
            <div className="flex w-full min-w-0 gap-6 px-3 py-4 sm:px-5 lg:gap-8 lg:py-5">
              <div className="min-w-0 flex-1">
                {loadingPosts ? (
                  <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải bài viết...
                  </div>
                ) : loadError ? (
                  <p className="py-12 text-center text-sm text-red-600">{loadError}</p>
                ) : posts.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <img src={nothingIllustration} alt="" className="mb-4 max-w-[200px]" draggable={false} />
                    <p className="text-sm text-slate-600">{copy.noPosts}</p>
                  </div>
                ) : null}

                {isBrowseAll && hubSections?.hero ? (
                  <button
                    type="button"
                    onClick={() => openPost(hubSections.hero)}
                    className="group mb-8 block w-full overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-slate-200/80"
                  >
                    <div className="relative aspect-[21/9] max-h-[280px] w-full overflow-hidden bg-slate-100 sm:max-h-[320px]">
                      {postImage(hubSections.hero) ? (
                        <img
                          src={postImage(hubSections.hero)}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full min-h-[160px] items-center justify-center text-xs text-slate-400">
                          Knowledge Hub
                        </div>
                      )}
                      <span className="absolute left-3 top-3 rounded-md bg-[#0077B6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        {copy.featured}
                      </span>
                    </div>
                    <div className="space-y-2 px-4 py-4 sm:px-5 sm:py-5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#0077B6]">
                        {pickPublicPostCategoryLabel(hubSections.hero, language, 'Bài viết')}
                      </span>
                      <h2 className="text-lg font-bold leading-snug text-slate-900 sm:text-xl lg:text-2xl">
                        {pickPublicPostTitle(hubSections.hero, language)}
                      </h2>
                      <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
                        {pickPublicPostExcerpt(hubSections.hero, language)}
                      </p>
                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
                        <span>{formatPostDate(hubSections.hero.publishedAt || hubSections.hero.createdAt, language)}</span>
                        <span>{estimateReadMinutes(hubSections.hero, language)} phút đọc</span>
                        {(hubSections.hero.viewCount ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {hubSections.hero.viewCount} lượt xem
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ) : null}

                {!isBrowseAll && posts.length > 0 ? (
                  <section className="mb-6">
                    <SectionTitle>
                      {searchQuery ? 'Kết quả tìm kiếm' : categories.find((c) => c.id === selectedCategoryId)?.name || 'Bài viết'}
                    </SectionTitle>
                    <div className="mt-1 rounded-lg bg-white px-3 sm:px-4">
                      {posts.map((post) => (
                        <ArticleRow key={post.id} post={post} language={language} onOpen={openPost} />
                      ))}
                    </div>
                  </section>
                ) : null}

                {isBrowseAll && hubSections ? (
                  <div className="space-y-10">
                    {hubSections.featured.length > 0 ? (
                      <section>
                        <SectionTitle>Bài viết nổi bật</SectionTitle>
                        <div className="mt-2 rounded-lg bg-white px-3 sm:px-4">
                          {hubSections.featured.map((post) => (
                            <ArticleRow key={post.id} post={post} language={language} onOpen={openPost} />
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {hubSections.latest.length > 0 ? (
                      <section>
                        <SectionTitle>Mới cập nhật</SectionTitle>
                        <div className="mt-2 rounded-lg bg-white px-3 sm:px-4">
                          {hubSections.latest.map((post) => (
                            <ArticleRow key={post.id} post={post} language={language} onOpen={openPost} />
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {Object.entries(hubSections.byCategorySlug).map(([slug, { title, items }]) => (
                      <section key={slug}>
                        <SectionTitle>{title}</SectionTitle>
                        <div className="mt-2 rounded-lg bg-white px-3 sm:px-4">
                          {items.map((post) => (
                            <ArticleRow key={post.id} post={post} language={language} onOpen={openPost} />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : null}
              </div>

              {isBrowseAll ? (
                <aside className="hidden w-[260px] shrink-0 lg:block xl:w-[280px]">
                  <div className="sticky top-4 rounded-lg border border-slate-200/80 bg-white p-4">
                    <h3 className="border-b border-slate-100 pb-2 text-xs font-bold text-slate-900">
                      Đọc nhiều
                    </h3>
                    <ul className="mt-2 divide-y divide-slate-100">
                      {sidebarPopular.length > 0 ? sidebarPopular.map((post, idx) => (
                        <li key={post.id}>
                          <button
                            type="button"
                            onClick={() => openPost(post)}
                            className="flex w-full gap-2 py-2.5 text-left hover:text-[#0077B6]"
                          >
                            <span className="mt-0.5 w-5 shrink-0 text-sm font-bold tabular-nums text-slate-300">
                              {idx + 1}
                            </span>
                            <span className="min-w-0">
                              <span className="line-clamp-2 text-[12px] font-medium leading-snug text-slate-800">
                                {pickPublicPostTitle(post, language)}
                              </span>
                              <span className="mt-0.5 block text-[10px] text-slate-400">
                                {pickPublicPostCategoryLabel(post, language, '')}
                              </span>
                            </span>
                          </button>
                        </li>
                      )) : (
                        <li className="py-4 text-[11px] text-slate-400">Chưa có dữ liệu.</li>
                      )}
                    </ul>
                  </div>
                </aside>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default KnowledgeHub
