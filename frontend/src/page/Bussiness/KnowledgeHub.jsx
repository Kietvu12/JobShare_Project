import React, { useState } from 'react'
import {
  Search, ChevronRight, FileText, Eye, Share2, Filter, BookOpen, Users, Rocket, Shield, Zap,
  MessageSquare, Clock,
} from 'lucide-react'

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"
const BRAND = '#0077B6'
const BRAND_LIGHT = '#e8f4fa'
const BRAND_BORDER = '#cce5f0'

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

const categories = [
  { id: 1, icon: BookOpen, name: 'Tuyển dụng', count: 128 },
  { id: 2, icon: Users, name: 'Quản trị nhân sự', count: 96 },
  { id: 3, icon: Rocket, name: 'Phát triển đội ngũ', count: 78 },
  { id: 4, icon: Shield, name: 'Pháp lý & Tuân thủ', count: 52 },
  { id: 5, icon: Zap, name: 'Kỹ năng nghề nghiệp', count: 67 },
  { id: 6, icon: FileText, name: 'Khác', count: 34 },
]

const featuredPost = {
  id: 1,
  title: '10 bước xây dựng quy trình tuyển dụng hiệu quả',
  description:
    'Hướng dẫn chi tiết từng bước quy định doanh nghiệp để xây trình tuyển dụng, tiết kiệm thời gian và nâng cao chất lượng ứng viên',
  date: '15/05/2024',
  views: 2,
  shares: 3.4,
  image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop',
  category: 'Tuyển dụng',
}

const posts = [
  { id: 2, title: 'Quản trị nhân sự', category: 'Quản trị nhân sự', date: '16/05/2024', views: 8, shares: 1.8, image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop' },
  { id: 3, title: 'Phát triển đội ngũ', category: 'Phát triển đội ngũ', date: '15/05/2024', views: 10, shares: 1.2, image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop' },
  { id: 4, title: 'Pháp lý & Tuân thủ', category: 'Pháp lý & Tuân thủ', date: '12/05/2024', views: 5, shares: 1.1, image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop' },
  { id: 5, title: 'Kỹ năng phỏng vấn hiệu quả', category: 'Kỹ năng nghề nghiệp', date: '11/05/2024', views: 15, shares: 2.5, image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop' },
]

const recommendations = [
  { id: 1, icon: Zap, title: 'Tài liệu nổi bật cho bạn', desc: 'Dựa trên lịch sử đọc và vai trò của bạn' },
  { id: 2, icon: FileText, title: 'Mẫu JD chuẩn theo vị trí', desc: 'Tuyển dụng' },
  { id: 3, icon: BookOpen, title: 'Khung năng lực nhân sự', desc: 'Quản trị nhân sự' },
  { id: 4, icon: FileText, title: 'Template định giá ứng viên', desc: 'Tuyển dụng' },
  { id: 5, icon: Users, title: 'Bộ câu hỏi phỏng vấn năng lực', desc: 'Kỹ năng nghề nghiệp' },
]

const latestMaterials = [
  { time: '15/05', title: 'Xu hướng tuyển dụng IT 2024', type: 'MẪU' },
  { time: '14/05', title: 'Checklist onboarding nhân viên mới', type: 'MẪU' },
  { time: '13/05', title: 'Chính sách làm việc hybrid hiệu quả', type: 'MẪU' },
  { time: '12/05', title: 'Hướng dẫn sử dụng EVP', type: 'MẪU' },
  { time: '10/05', title: 'Bộ KPI cho từng vị trí phòng ban', type: 'MẪU' },
]

const templates = [
  { id: 1, icon: FileText, label: 'Mẫu JD', name: 'Mẫu JD theo vị trí', desc: '23 mẫu', action: 'Xem ngay' },
  { id: 2, icon: FileText, label: 'Mẫu Excel', name: 'Bảng đánh giá ứng viên', desc: 'Excel · 15 KB', action: 'Tải về' },
  { id: 3, icon: FileText, label: 'Mẫu quy trình', name: 'Quy trình tuyển dụng chuẩn', desc: 'PDF · 2.4 MB', action: 'Xem ngay' },
  { id: 4, icon: FileText, label: 'Mẫu slide', name: 'Bộ slide onboarding nhân viên mới', desc: 'PPTX · 5.6 MB', action: 'Tải về' },
  { id: 5, icon: FileText, label: 'Mẫu văn bản', name: 'Hợp đồng lao động mẫu', desc: 'DOCX · 48 KB', action: 'Tải về' },
]

function SectionHeader({ title, actionLabel }) {
  return (
    <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2.5">
      <h2 className="text-xs font-bold text-slate-900 sm:text-sm">{title}</h2>
      {actionLabel ? (
        <button
          type="button"
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
  const [selectedCategory, setSelectedCategory] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <>
      <style>{hubStyles}</style>
      <div
        className="business-homepage-shell flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="business-homepage-ui flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Header + search */}
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
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 transition-colors hover:border-[#cce5f0] hover:bg-[#e8f4fa]/50 sm:text-[11px]"
              >
                <Filter className="h-3 w-3" />
                Tất cả chủ đề
              </button>
            </div>
          </div>

          <div className="knowledge-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="grid w-full min-h-0 grid-cols-1 items-start gap-3 px-3 py-3 sm:px-4 sm:py-4 xl:grid-cols-[minmax(0,1fr)_minmax(240px,300px)] xl:gap-4">
              {/* Main column */}
              <div className="flex min-w-0 flex-col gap-3">
                {/* Categories */}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-2.5">
                    {categories.map((cat) => {
                      const Icon = cat.icon
                      const active = selectedCategory === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
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
                          <span className="text-[8px] font-medium text-slate-500 sm:text-[9px]">{cat.count} bài</span>
                        </button>
                      )
                    })}
                </div>

                {/* Featured */}
                <article className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,280px)_1fr]">
                    <div className="relative aspect-[16/10] sm:aspect-auto sm:min-h-[160px]">
                      <img src={featuredPost.image} alt="" className="h-full w-full object-cover" />
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
                          {featuredPost.category}
                        </span>
                        <h3 className="mt-2 text-xs font-bold leading-snug text-slate-900 sm:text-sm">{featuredPost.title}</h3>
                        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600 sm:text-[11px]">{featuredPost.description}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[9px] text-slate-400 sm:text-[10px]">
                        <span>{featuredPost.date}</span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {featuredPost.views} phút đọc
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Share2 className="h-3 w-3" />
                          {featuredPost.shares} lượt chia sẻ
                        </span>
                      </div>
                    </div>
                  </div>
                </article>

                {/* Posts */}
                <section className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
                  <SectionHeader title="Bài viết nổi bật" actionLabel="Xem tất cả" />
                  <ul className="flex flex-col gap-2">
                    {posts.map((post) => (
                      <li key={post.id}>
                        <button
                          type="button"
                          className="grid w-full grid-cols-[88px_1fr] gap-2.5 rounded-lg border border-slate-100 bg-slate-50/40 p-2 text-left transition-colors hover:border-[#cce5f0] hover:bg-[#e8f4fa]/30 sm:grid-cols-[100px_1fr] sm:gap-3 sm:p-2.5"
                        >
                          <div className="overflow-hidden rounded-md">
                            <img src={post.image} alt="" className="h-[70px] w-full object-cover" />
                          </div>
                          <div className="flex min-w-0 flex-col justify-between gap-1">
                            <div>
                              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                <span className="rounded-full bg-[#e8f4fa] px-1.5 py-0.5 text-[8px] font-semibold text-[#0077B6] sm:text-[9px]">
                                  {post.category}
                                </span>
                                <span className="text-[8px] text-slate-400 sm:text-[9px]">{post.date}</span>
                              </div>
                              <h4 className="text-[10px] font-semibold leading-snug text-slate-800 sm:text-[11px]">{post.title}</h4>
                            </div>
                            <div className="flex gap-3 text-[8px] text-slate-400 sm:text-[9px]">
                              <span className="inline-flex items-center gap-0.5">
                                <Eye className="h-2.5 w-2.5" />
                                {post.views} phút
                              </span>
                              <span className="inline-flex items-center gap-0.5">
                                <Share2 className="h-2.5 w-2.5" />
                                {post.shares} chia sẻ
                              </span>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Templates */}
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

              {/* Sidebar */}
              <aside className="flex min-w-0 flex-col gap-3">
                <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
                  <div className="mb-2.5 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <h3 className="text-[11px] font-bold text-slate-900 sm:text-xs">Gợi ý cho bạn</h3>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {recommendations.map((rec) => {
                      const RecIcon = rec.icon
                      return (
                        <li key={rec.id}>
                          <button
                            type="button"
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
                    })}
                  </ul>
                  <button
                    type="button"
                    className="mt-2.5 w-full rounded-lg py-2 text-[10px] font-semibold text-[#0077B6] transition-colors hover:bg-[#e8f4fa]/80 sm:text-[11px]"
                    style={{ background: BRAND_LIGHT }}
                  >
                    Xem thêm gợi ý
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
                  <h3 className="mb-2.5 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 text-[11px] font-bold text-slate-900 sm:text-xs">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    Tài liệu mới cập nhật
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {latestMaterials.map((mat) => (
                      <li key={`${mat.time}-${mat.title}`} className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[9px] text-slate-400">{mat.time}</p>
                          <p className="text-[10px] font-medium leading-snug text-slate-800 sm:text-[11px]">{mat.title}</p>
                        </div>
                        <span className="shrink-0 rounded bg-[#e8f4fa] px-1.5 py-0.5 text-[7px] font-bold text-[#0077B6] sm:text-[8px]">
                          {mat.type}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="mt-2.5 w-full rounded-lg border border-[#0077B6]/35 py-2 text-[10px] font-semibold text-[#0077B6] transition-colors hover:bg-[#e8f4fa]/50 sm:text-[11px]"
                  >
                    Xem tất cả
                  </button>
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
