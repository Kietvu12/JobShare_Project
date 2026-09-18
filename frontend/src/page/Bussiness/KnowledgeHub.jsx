import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, Clock, Eye, Loader2 } from 'lucide-react'
import nothingIllustration from '../../assets/Nothing.png'
import apiService, { normalizePostImageUrl } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import {
  pickPublicPostExcerpt,
  pickPublicPostTitle,
} from '../../utils/publicPostDisplay'
import {
  getKnowledgeHubCopy,
  getKnowledgeHubCategoryLabel,
  pickKnowledgePostCategoryLabel,
} from '../../i18n/businessApp/knowledgeHub.js'
import {
  BUSINESS_HOMEPAGE_PAGE_BASE_STYLES,
  BUSINESS_HP_TEXT,
  BUSINESS_UI_FONT,
} from '../../utils/businessHomepageTypography'

const KNOWLEDGE_HUB_EXTRA_STYLES = `
  .business-app-ui .knowledge-hub-ui {
    font-size: var(--biz-hp-body);
    line-height: 1.5;
    color: #334155;
  }
`
const pageStyles = `${BUSINESS_HOMEPAGE_PAGE_BASE_STYLES}${KNOWLEDGE_HUB_EXTRA_STYLES}`
const KH_CATEGORY_PILL = `font-semibold uppercase tracking-wide text-[#0077B6] ${BUSINESS_HP_TEXT.caption}`
const KH_CHIP = `shrink-0 rounded-full px-3.5 py-1.5 font-semibold ${BUSINESS_HP_TEXT.button}`

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

const SIDEBAR_MOST_READ_LIMIT = 8

function pickRandomPosts(source, count, excludeIds) {
  if (!count || count <= 0) return []
  const pool = source.filter((p) => p?.id != null && !excludeIds.has(String(p.id)))
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

/** Ưu tiên viewCount; thiếu thì bổ sung ngẫu nhiên từ pool bài đã tải. */
function buildMostReadSidebar({ popularPosts, posts, usedIds, limit = SIDEBAR_MOST_READ_LIMIT }) {
  const used = usedIds instanceof Set ? usedIds : new Set(usedIds || [])
  const seen = new Set()
  const out = []

  const byViews = [...(popularPosts || [])].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
  for (const p of byViews) {
    const id = String(p.id)
    if (used.has(id) || seen.has(id)) continue
    out.push(p)
    seen.add(id)
    if (out.length >= limit) return out
  }

  const need = limit - out.length
  if (need > 0 && posts?.length) {
    const fillerExclude = new Set([...used, ...seen])
    const filler = pickRandomPosts(posts, need, fillerExclude)
    for (const p of filler) {
      seen.add(String(p.id))
      out.push(p)
    }
  }

  if (out.length === 0 && posts?.length) {
    return pickRandomPosts(posts, limit, used)
  }

  return out
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
    <h2 className={`border-b border-slate-200/80 pb-2 tracking-tight ${BUSINESS_HP_TEXT.section}`}>
      {children}
    </h2>
  )
}

function ArticleRow({ post, language, copy, onOpen, className = '' }) {
  const img = postImage(post)
  const title = pickPublicPostTitle(post, language)
  const excerpt = pickPublicPostExcerpt(post, language)
  const category = pickKnowledgePostCategoryLabel(post, language, '')
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
          <div className={`flex h-full items-center justify-center ${BUSINESS_HP_TEXT.caption}`}>KB</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {category ? (
          <span className={KH_CATEGORY_PILL}>{category}</span>
        ) : null}
        <h3 className={`mt-0.5 font-semibold leading-snug text-slate-900 group-hover:text-[#0077B6] ${BUSINESS_HP_TEXT.body}`}>
          {title}
        </h3>
        {excerpt ? (
          <p className={`mt-1 line-clamp-2 leading-relaxed text-slate-600 ${BUSINESS_HP_TEXT.caption}`}>{excerpt}</p>
        ) : null}
        <div className={`mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 ${BUSINESS_HP_TEXT.caption}`}>
          {date ? <span>{date}</span> : null}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden />
            {copy.minRead(readMin)}
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
            limit: 24,
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
    for (const cat of categories) {
      const slug = cat.slug
      if (!slug || (cat.postCount ?? 0) === 0) continue
      const inCat = posts.filter((p) => String(p.category?.id || p.categoryId) === String(cat.id))
      const items = pickUnused(inCat, 4)
      const title = getKnowledgeHubCategoryLabel(cat, language)
      if (items.length && title) byCategorySlug[slug] = { title, items }
    }

    return { hero, featured, latest, byCategorySlug, usedIds: used }
  }, [isBrowseAll, posts, categories, language])

  const sidebarPopular = useMemo(() => {
    if (!posts?.length) return []
    const excludeHero = new Set()
    if (hubSections?.hero?.id != null) excludeHero.add(String(hubSections.hero.id))
    return buildMostReadSidebar({
      popularPosts,
      posts,
      usedIds: excludeHero,
    })
  }, [popularPosts, posts, hubSections])

  const resetFilters = () => {
    setSelectedCategoryId(null)
    setSearchTerm('')
  }

  return (
    <>
      <style>{pageStyles}</style>
      <div
        className="business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-white"
        style={{ fontFamily: BUSINESS_UI_FONT }}
      >
        <div className="business-homepage-ui business-app-ui knowledge-hub-ui flex min-h-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 border-b border-slate-200/80 bg-white px-3 py-3 sm:px-5">
            <nav aria-label="Breadcrumb" className={`mb-2 ${BUSINESS_HP_TEXT.meta}`}>
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
                  className={`min-w-0 flex-1 border-none bg-transparent text-slate-800 outline-none placeholder:text-slate-400 ${BUSINESS_HP_TEXT.body}`}
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
              <button
                type="button"
                onClick={resetFilters}
                className={`${KH_CHIP} transition-colors ${
                  !selectedCategoryId
                    ? 'bg-[#0077B6] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {copy.filterAll}
              </button>
              {loadingCategories ? (
                <span className={`inline-flex items-center gap-1 py-1 ${BUSINESS_HP_TEXT.caption}`}>
                  <Loader2 className="h-3 w-3 animate-spin" />
                </span>
              ) : categoriesWithPosts.map((cat) => {
                const active = selectedCategoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(active ? null : cat.id)}
                    className={`${KH_CHIP} transition-colors ${
                      active
                        ? 'bg-[#0077B6] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    {getKnowledgeHubCategoryLabel(cat, language) || cat.name}
                  </button>
                )
              })}
            </div>
          </header>

          <div className="knowledge-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#fafbfc]">
            <div className="flex w-full min-w-0 gap-6 px-3 py-4 sm:px-5 lg:gap-8 lg:py-5">
              <div className="min-w-0 flex-1">
                {loadingPosts ? (
                  <div className={`flex items-center justify-center gap-2 py-20 text-slate-500 ${BUSINESS_HP_TEXT.body}`}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {copy.loadingPosts}
                  </div>
                ) : loadError ? (
                  <p className={`py-12 text-center text-red-600 ${BUSINESS_HP_TEXT.body}`}>{loadError}</p>
                ) : posts.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <img src={nothingIllustration} alt="" className="mb-4 max-w-[200px]" draggable={false} />
                    <p className={BUSINESS_HP_TEXT.body}>{copy.noPosts}</p>
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
                        <div className={`flex h-full min-h-[160px] items-center justify-center text-slate-400 ${BUSINESS_HP_TEXT.caption}`}>
                          {copy.hubImagePlaceholder}
                        </div>
                      )}
                      <span className={`absolute left-3 top-3 rounded-md bg-[#0077B6] px-2.5 py-0.5 font-bold uppercase tracking-wide text-white ${BUSINESS_HP_TEXT.micro}`}>
                        {copy.featured}
                      </span>
                    </div>
                    <div className="space-y-2 px-4 py-4 sm:px-5 sm:py-5">
                      <span className={KH_CATEGORY_PILL}>
                        {pickKnowledgePostCategoryLabel(hubSections.hero, language)}
                      </span>
                      <h2 className={`leading-snug ${BUSINESS_HP_TEXT.display}`}>
                        {pickPublicPostTitle(hubSections.hero, language)}
                      </h2>
                      <p className={`line-clamp-2 leading-relaxed text-slate-600 ${BUSINESS_HP_TEXT.bodyLg}`}>
                        {pickPublicPostExcerpt(hubSections.hero, language)}
                      </p>
                      <div className={`flex flex-wrap gap-3 ${BUSINESS_HP_TEXT.caption}`}>
                        <span>{formatPostDate(hubSections.hero.publishedAt || hubSections.hero.createdAt, language)}</span>
                        <span>{copy.minRead(estimateReadMinutes(hubSections.hero, language))}</span>
                        {(hubSections.hero.viewCount ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {copy.views(hubSections.hero.viewCount)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ) : null}

                {!isBrowseAll && posts.length > 0 ? (
                  <section className="mb-6">
                    <SectionTitle>
                      {searchQuery
                        ? copy.searchResults
                        : getKnowledgeHubCategoryLabel(
                            categories.find((c) => c.id === selectedCategoryId),
                            language,
                          ) || copy.defaultArticle}
                    </SectionTitle>
                    <div className="mt-1 rounded-lg bg-white px-3 sm:px-4">
                      {posts.map((post) => (
                        <ArticleRow key={post.id} post={post} language={language} copy={copy} onOpen={openPost} />
                      ))}
                    </div>
                  </section>
                ) : null}

                {isBrowseAll && hubSections ? (
                  <div className="space-y-10">
                    {hubSections.featured.length > 0 ? (
                      <section>
                        <SectionTitle>{copy.sectionFeatured}</SectionTitle>
                        <div className="mt-2 rounded-lg bg-white px-3 sm:px-4">
                          {hubSections.featured.map((post) => (
                            <ArticleRow key={post.id} post={post} language={language} copy={copy} onOpen={openPost} />
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {hubSections.latest.length > 0 ? (
                      <section>
                        <SectionTitle>{copy.sectionLatest}</SectionTitle>
                        <div className="mt-2 rounded-lg bg-white px-3 sm:px-4">
                          {hubSections.latest.map((post) => (
                            <ArticleRow key={post.id} post={post} language={language} copy={copy} onOpen={openPost} />
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {Object.entries(hubSections.byCategorySlug).map(([slug, { title, items }]) => (
                      <section key={slug}>
                        <SectionTitle>{title}</SectionTitle>
                        <div className="mt-2 rounded-lg bg-white px-3 sm:px-4">
                          {items.map((post) => (
                            <ArticleRow key={post.id} post={post} language={language} copy={copy} onOpen={openPost} />
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
                    <h3 className={`border-b border-slate-100 pb-2 ${BUSINESS_HP_TEXT.section}`}>
                      {copy.mostRead}
                    </h3>
                    <ul className="mt-2 divide-y divide-slate-100">
                      {sidebarPopular.length > 0 ? sidebarPopular.map((post, idx) => (
                        <li key={post.id}>
                          <button
                            type="button"
                            onClick={() => openPost(post)}
                            className="flex w-full gap-2 py-2.5 text-left hover:text-[#0077B6]"
                          >
                            <span className={`mt-0.5 w-5 shrink-0 font-bold tabular-nums text-slate-300 ${BUSINESS_HP_TEXT.body}`}>
                              {idx + 1}
                            </span>
                            <span className="min-w-0">
                              <span className={`line-clamp-2 font-medium leading-snug text-slate-800 ${BUSINESS_HP_TEXT.body}`}>
                                {pickPublicPostTitle(post, language)}
                              </span>
                              <span className={`mt-0.5 block ${BUSINESS_HP_TEXT.caption}`}>
                                {pickKnowledgePostCategoryLabel(post, language, '')}
                              </span>
                            </span>
                          </button>
                        </li>
                      )) : (
                        <li className={`py-4 ${BUSINESS_HP_TEXT.caption}`}>{copy.sidebarEmpty}</li>
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
