import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ChevronRight, FileText, Eye, Share2, Filter, BookOpen, Users, Rocket, Shield, Zap,
  MessageSquare, Clock, Loader2,
} from 'lucide-react'
import apiService, { normalizePostImageUrl } from '../../services/api'
import { useLanguage } from '../../context/LanguageContext'
import {
  pickPublicPostCategoryLabel,
  pickPublicPostExcerpt,
  pickPublicPostTitle,
} from '../../utils/publicPostDisplay'

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"
const BRAND = '#0077B6'
const BRAND_LIGHT = '#e8f4fa'
const BRAND_BORDER = '#cce5f0'

const CATEGORY_ICONS = {
  'tuyen-dung': BookOpen,
  'quan-tri-nhan-su': Users,
  'phat-trien-doi-ngu': Rocket,
  'phap-ly-tuan-thu': Shield,
  'ky-nang-nghe-nghiep': Zap,
  khac: FileText,
}

const hubStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .knowledge-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .knowledge-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .knowledge-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .knowledge-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .knowledge-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  .business-homepage-shell { --hp-zoom: 1; }
  @media (min-width: 1024px) and (max-width: 1279px) {
    .business-homepage-shell { --hp-zoom: 0.9; }
  }
  @media (min-width: 1280px) and (max-width: 1535px) {
    .business-homepage-shell { --hp-zoom: 0.86; }
  }
  @media (min-width: 1024px) and (max-height: 760px) {
    .business-homepage-shell { --hp-zoom: 0.78; }
  }
  @media (min-width: 1536px) and (min-height: 861px) {
    .business-homepage-shell { --hp-zoom: 0.94; }
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

const recommendations = [
  { id: 1, icon: Zap, title: 'Tài liệu nổi bật cho bạn', desc: 'Dựa trên lịch sử đọc và vai trò của bạn' },
  { id: 2, icon: FileText, title: 'Mẫu JD chuẩn theo vị trí', desc: 'Tuyển dụng' },
  { id: 3, icon: BookOpen, title: 'Khung năng lực nhân sự', desc: 'Quản trị nhân sự' },
  { id: 4, icon: FileText, title: 'Template định giá ứng viên', desc: 'Tuyển dụng' },
  { id: 5, icon: Users, title: 'Bộ câu hỏi phỏng vấn năng lực', desc: 'Kỹ năng nghề nghiệp' },
]

const templates = [
  { id: 1, icon: FileText, label: 'Mẫu JD', name: 'Mẫu JD theo vị trí', desc: '23 mẫu', action: 'Xem ngay' },
  { id: 2, icon: FileText, label: 'Mẫu Excel', name: 'Bảng đánh giá ứng viên', desc: 'Excel · 15 KB', action: 'Tải về' },
  { id: 3, icon: FileText, label: 'Mẫu quy trình', name: 'Quy trình tuyển dụng chuẩn', desc: 'PDF · 2.4 MB', action: 'Xem ngay' },
  { id: 4, icon: FileText, label: 'Mẫu slide', name: 'Bộ slide onboarding nhân viên mới', desc: 'PPTX · 5.6 MB', action: 'Tải về' },
  { id: 5, icon: FileText, label: 'Mẫu văn bản', name: 'Hợp đồng lao động mẫu', desc: 'DOCX · 48 KB', action: 'Tải về' },
]

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

function formatShortDate(iso, lang) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const locale = lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'vi-VN'
  try {
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })
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

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2.5">
      <h2 className="text-xs font-bold text-slate-900 sm:text-sm">{title}</h2>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#0077B6] transition-colors hover:text-[#006399] sm:text-[11px]"
        >
          {actionLabel}
          <ChevronRight className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  )
}

const KnowledgeHub = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [posts, setPosts] = useState([])
  const [sidebarPosts, setSidebarPosts] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchTerm.trim()), 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    let cancelled = false
    const loadCategories = async () => {
      try {
        setLoadingCategories(true)
        const res = await apiService.getBusinessKnowledgeCategories()
        if (!cancelled) {
          setCategories(res?.data?.categories || [])
        }
      } catch {
        if (!cancelled) setCategories([])
      } finally {
        if (!cancelled) setLoadingCategories(false)
      }
    }
    loadCategories()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadPosts = async () => {
      try {
        setLoadingPosts(true)
        setLoadError('')
        const params = { page: 1, limit: 20, sortBy: 'published_at', sortOrder: 'DESC' }
        if (selectedCategoryId) params.categoryId = selectedCategoryId
        if (searchQuery) params.search = searchQuery

        const [listRes, sidebarRes] = await Promise.all([
          apiService.getBusinessKnowledgePosts(params),
          apiService.getBusinessKnowledgePosts({ page: 1, limit: 5, sortBy: 'published_at', sortOrder: 'DESC' }),
        ])

        if (!cancelled) {
          setPosts(listRes?.data?.posts || [])
          setSidebarPosts(sidebarRes?.data?.posts || [])
        }
      } catch (err) {
        if (!cancelled) {
          setPosts([])
          setSidebarPosts([])
          setLoadError(err?.message || 'Không tải được danh sách bài viết.')
        }
      } finally {
        if (!cancelled) setLoadingPosts(false)
      }
    }
    loadPosts()
    return () => { cancelled = true }
  }, [selectedCategoryId, searchQuery])

  const showFeatured = !searchQuery && posts.length > 0
  const featuredPost = showFeatured ? posts[0] : null
  const listPosts = showFeatured ? posts.slice(1) : posts

  const apiRecommendations = useMemo(() => {
    return sidebarPosts.slice(0, 4).map((post) => ({
      id: post.id,
      icon: CATEGORY_ICONS[post.category?.slug] || FileText,
      title: pickPublicPostTitle(post, language),
      desc: pickPublicPostCategoryLabel(post, language, ''),
      slug: post.slug || post.id,
    }))
  }, [sidebarPosts, language])

  const openPost = (post) => {
    const key = post?.slug || post?.id
    if (!key) return
    navigate(`/business/knowledge/${encodeURIComponent(key)}`)
  }

  const resetFilters = () => {
    setSelectedCategoryId(null)
    setSearchTerm('')
  }

  return (
    <>
      <style>{hubStyles}</style>
      <div
        className="business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="business-homepage-ui flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-slate-200/90 bg-white px-3 py-2.5 sm:px-4">
            <div className="mb-2.5 flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-900 sm:text-base">Knowledge Hub</h1>
                <p className="text-[10px] text-slate-500 sm:text-[11px]">Bài viết, hướng dẫn và mẫu tài liệu HR</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 focus-within:border-[#0077B6]/40 focus-within:ring-2 focus-within:ring-[#0077B6]/15">
                <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm bài viết, hướng dẫn, mẫu tài liệu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-w-0 flex-1 border-none bg-transparent text-[11px] text-slate-800 outline-none placeholder:text-slate-400 sm:text-xs"
                />
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 transition-colors hover:border-[#cce5f0] hover:bg-[#e8f4fa]/50 sm:text-[11px]"
              >
                <Filter className="h-3 w-3" />
                Tất cả chủ đề
              </button>
            </div>
          </div>

          <div className="knowledge-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="grid w-full min-h-0 grid-cols-1 items-start gap-3 px-3 py-3 sm:px-4 sm:py-4 xl:grid-cols-[minmax(0,1fr)_minmax(240px,300px)] xl:gap-4">
              <div className="flex min-w-0 flex-col gap-3">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-2.5">
                  {loadingCategories ? (
                    <div className="col-span-full flex items-center gap-2 py-2 text-[11px] text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Đang tải danh mục...
                    </div>
                  ) : categories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.slug] || FileText
                    const active = selectedCategoryId === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(active ? null : cat.id)}
                        className={`flex min-w-0 flex-col items-center gap-1 rounded-xl border px-1.5 py-2.5 transition-colors sm:px-2 sm:py-3 ${
                          active
                            ? 'border-[#0077B6] bg-[#e8f4fa] shadow-sm shadow-[#0077B6]/10'
                            : 'border-slate-200/90 bg-white hover:border-[#cce5f0] hover:bg-slate-50/80'
                        }`}
                      >
                        <Icon
                          className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
                          style={{ color: active ? BRAND : '#64748b' }}
                        />
                        <span className="text-center text-[9px] font-semibold leading-tight text-slate-800 sm:text-[10px]">
                          {cat.name}
                        </span>
                        <span className="text-[8px] font-medium text-slate-500 sm:text-[9px]">
                          {cat.postCount ?? 0} bài
                        </span>
                      </button>
                    )
                  })}
                </div>

                {loadingPosts ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white py-12 text-[11px] text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải bài viết...
                  </div>
                ) : loadError ? (
                  <div className="rounded-xl border border-red-100 bg-white p-4 text-center text-[11px] text-red-600">
                    {loadError}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="rounded-xl border border-slate-200/90 bg-white p-6 text-center text-[11px] text-slate-500">
                    Chưa có bài viết phù hợp. Admin có thể thêm bài trong mục Posts và bật hiển thị Knowledge Hub.
                  </div>
                ) : null}

                {featuredPost ? (
                  <article className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
                    <button type="button" onClick={() => openPost(featuredPost)} className="grid w-full grid-cols-1 text-left sm:grid-cols-[minmax(0,280px)_1fr]">
                      <div className="relative aspect-[16/10] sm:aspect-auto sm:min-h-[160px]">
                        {postImage(featuredPost) ? (
                          <img src={postImage(featuredPost)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full min-h-[160px] items-center justify-center bg-slate-100 text-[10px] text-slate-400">
                            Knowledge Hub
                          </div>
                        )}
                        <span
                          className="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white sm:text-[9px]"
                          style={{ background: BRAND }}
                        >
                          Nổi bật
                        </span>
                      </div>
                      <div className="flex flex-col justify-between gap-3 p-3 sm:p-4">
                        <div>
                          <span className="inline-flex rounded-full bg-[#e8f4fa] px-2 py-0.5 text-[9px] font-semibold text-[#0077B6]">
                            {pickPublicPostCategoryLabel(featuredPost, language, 'Bài viết')}
                          </span>
                          <h3 className="mt-2 text-xs font-bold leading-snug text-slate-900 sm:text-sm">
                            {pickPublicPostTitle(featuredPost, language)}
                          </h3>
                          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600 sm:text-[11px]">
                            {pickPublicPostExcerpt(featuredPost, language)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[9px] text-slate-400 sm:text-[10px]">
                          <span>{formatPostDate(featuredPost.publishedAt || featuredPost.createdAt, language)}</span>
                          <span className="inline-flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {estimateReadMinutes(featuredPost, language)} phút đọc
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Share2 className="h-3 w-3" />
                            {featuredPost.viewCount ?? 0} lượt xem
                          </span>
                        </div>
                      </div>
                    </button>
                  </article>
                ) : null}

                {listPosts.length > 0 ? (
                  <section className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
                    <SectionHeader title="Bài viết nổi bật" actionLabel="Xem tất cả" onAction={resetFilters} />
                    <ul className="flex flex-col gap-2">
                      {listPosts.map((post) => (
                        <li key={post.id}>
                          <button
                            type="button"
                            onClick={() => openPost(post)}
                            className="grid w-full grid-cols-[88px_1fr] gap-2.5 rounded-lg border border-slate-100 bg-slate-50/40 p-2 text-left transition-colors hover:border-[#cce5f0] hover:bg-[#e8f4fa]/30 sm:grid-cols-[100px_1fr] sm:gap-3 sm:p-2.5"
                          >
                            <div className="overflow-hidden rounded-md">
                              {postImage(post) ? (
                                <img src={postImage(post)} alt="" className="h-[70px] w-full object-cover" />
                              ) : (
                                <div className="flex h-[70px] items-center justify-center bg-slate-100 text-[8px] text-slate-400">
                                  KB
                                </div>
                              )}
                            </div>
                            <div className="flex min-w-0 flex-col justify-between gap-1">
                              <div>
                                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                  <span className="rounded-full bg-[#e8f4fa] px-1.5 py-0.5 text-[8px] font-semibold text-[#0077B6] sm:text-[9px]">
                                    {pickPublicPostCategoryLabel(post, language, 'Bài viết')}
                                  </span>
                                  <span className="text-[8px] text-slate-400 sm:text-[9px]">
                                    {formatPostDate(post.publishedAt || post.createdAt, language)}
                                  </span>
                                </div>
                                <h4 className="text-[10px] font-semibold leading-snug text-slate-800 sm:text-[11px]">
                                  {pickPublicPostTitle(post, language)}
                                </h4>
                              </div>
                              <div className="flex gap-3 text-[8px] text-slate-400 sm:text-[9px]">
                                <span className="inline-flex items-center gap-0.5">
                                  <Eye className="h-2.5 w-2.5" />
                                  {estimateReadMinutes(post, language)} phút
                                </span>
                                <span className="inline-flex items-center gap-0.5">
                                  <Share2 className="h-2.5 w-2.5" />
                                  {post.viewCount ?? 0} lượt xem
                                </span>
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <section className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
                  <SectionHeader title="Tài liệu & mẫu biểu hữu ích" actionLabel="Xem tất cả mẫu" />
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-2.5">
                    {templates.map((tpl) => {
                      const TplIcon = tpl.icon
                      return (
                        <div
                          key={tpl.id}
                          className="flex flex-col rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 sm:p-3"
                        >
                          <TplIcon className="mb-2 h-4 w-4 text-[#0077B6]" />
                          <span className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">{tpl.label}</span>
                          <p className="mt-0.5 flex-1 text-[10px] font-semibold leading-snug text-slate-800 sm:text-[11px]">{tpl.name}</p>
                          <p className="mt-1 text-[8px] text-slate-500 sm:text-[9px]">{tpl.desc}</p>
                          <button
                            type="button"
                            className="mt-2 w-full rounded-md border border-slate-200 bg-white py-1.5 text-[9px] font-semibold text-[#0077B6] transition-colors hover:border-[#0077B6]/30 hover:bg-[#e8f4fa]/60 sm:text-[10px]"
                          >
                            {tpl.action}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </section>
              </div>

              <aside className="flex min-w-0 flex-col gap-3">
                <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
                  <div className="mb-2.5 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <h3 className="text-[11px] font-bold text-slate-900 sm:text-xs">Gợi ý cho bạn</h3>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {apiRecommendations.length > 0
                      ? apiRecommendations.map((rec) => {
                        const RecIcon = rec.icon
                        return (
                          <li key={rec.id}>
                            <button
                              type="button"
                              onClick={() => navigate(`/business/knowledge/${encodeURIComponent(rec.slug)}`)}
                              className="flex w-full gap-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2 text-left transition-colors hover:border-[#cce5f0] hover:bg-[#e8f4fa]/40"
                            >
                              <RecIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0077B6]" />
                              <span className="min-w-0">
                                <span className="block text-[10px] font-semibold text-slate-800 sm:text-[11px]">{rec.title}</span>
                                <span className="block text-[9px] text-slate-500">{rec.desc}</span>
                              </span>
                            </button>
                          </li>
                        )
                      })
                      : recommendations.map((rec) => {
                        const RecIcon = rec.icon
                        return (
                          <li key={rec.id}>
                            <div className="flex w-full gap-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2 text-left opacity-70">
                              <RecIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0077B6]" />
                              <span className="min-w-0">
                                <span className="block text-[10px] font-semibold text-slate-800 sm:text-[11px]">{rec.title}</span>
                                <span className="block text-[9px] text-slate-500">{rec.desc}</span>
                              </span>
                            </div>
                          </li>
                        )
                      })}
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
                  <h3 className="mb-2.5 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 text-[11px] font-bold text-slate-900 sm:text-xs">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    Bài viết mới cập nhật
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {sidebarPosts.length > 0
                      ? sidebarPosts.map((post) => (
                        <li key={post.id}>
                          <button
                            type="button"
                            onClick={() => openPost(post)}
                            className="flex w-full items-start justify-between gap-2 text-left"
                          >
                            <div className="min-w-0">
                              <p className="text-[9px] text-slate-400">
                                {formatShortDate(post.publishedAt || post.createdAt, language)}
                              </p>
                              <p className="text-[10px] font-medium leading-snug text-slate-800 sm:text-[11px]">
                                {pickPublicPostTitle(post, language)}
                              </p>
                            </div>
                            <span className="shrink-0 rounded bg-[#e8f4fa] px-1.5 py-0.5 text-[7px] font-bold text-[#0077B6] sm:text-[8px]">
                              BÀI
                            </span>
                          </button>
                        </li>
                      ))
                      : (
                        <li className="text-[10px] text-slate-500">Chưa có bài viết mới.</li>
                      )}
                  </ul>
                </div>

                <div
                  className="rounded-xl border p-3 text-center sm:p-4"
                  style={{ borderColor: BRAND_BORDER, background: `${BRAND_LIGHT}99` }}
                >
                  <MessageSquare className="mx-auto mb-2 h-6 w-6 text-[#0077B6]" />
                  <h3 className="text-[11px] font-bold text-slate-900 sm:text-xs">Góp ý & yêu cầu tài liệu</h3>
                  <p className="mt-1 text-[9px] leading-relaxed text-slate-600 sm:text-[10px]">
                    Bạn cần tài liệu nào? Gửi góp ý để chúng tôi bổ sung nội dung phù hợp.
                  </p>
                  <button
                    type="button"
                    className="mt-3 w-full rounded-lg py-2 text-[10px] font-semibold text-white shadow-sm transition-colors hover:bg-[#006399] sm:text-[11px]"
                    style={{ background: BRAND, boxShadow: '0 1px 2px rgba(0,119,182,0.2)' }}
                  >
                    Gửi góp ý
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default KnowledgeHub
