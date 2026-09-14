import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock, Eye, Loader2, User } from 'lucide-react';
import apiService, { normalizePostImageUrl } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import {
  pickPublicPostCategoryLabel,
  pickPublicPostExcerpt,
  pickPublicPostTitle,
} from '../../utils/publicPostDisplay';

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif";
const articleStyles = `
  .kh-prose {
    font-size: 15px;
    line-height: 1.75;
    color: #334155;
    max-width: 65ch;
  }
  .kh-prose h2 {
    font-size: 1.15rem;
    font-weight: 700;
    color: #0f172a;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    scroll-margin-top: 5rem;
  }
  .kh-prose h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    scroll-margin-top: 5rem;
  }
  .kh-prose p { margin-bottom: 1rem; }
  .kh-prose ul, .kh-prose ol { margin-bottom: 1rem; padding-left: 1.25rem; }
  .kh-prose li { margin-bottom: 0.35rem; }
  .kh-prose a { color: #0077B6; text-decoration: underline; }
  .kh-prose img { max-width: 100%; height: auto; border-radius: 0.375rem; margin: 1rem 0; }
  .kh-prose blockquote {
    border-left: 3px solid #cce5f0;
    padding-left: 1rem;
    color: #64748b;
    margin: 1.25rem 0;
  }
`;

function formatDate(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const locale = lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'vi-VN';
  try {
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

function pickPostContentHtml(post, lang) {
  if (!post) return '';
  if (lang === 'en') return post.contentEn || post.content || '';
  if (lang === 'ja') return post.contentJp || post.contentEn || post.content || '';
  return post.content || post.contentEn || post.contentJp || '';
}

function estimateReadMinutes(post, lang) {
  const html = pickPostContentHtml(post, lang);
  const text = String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

function parsePostTags(post) {
  const raw = [
    post?.tag,
    post?.metaKeywords,
  ].filter(Boolean).join(',');
  if (!raw.trim()) return [];
  return [...new Set(
    raw.split(/[,;|#]/).map((s) => s.trim()).filter((s) => s.length > 1),
  )].slice(0, 10);
}

function injectHeadingIds(html) {
  if (!html || typeof document === 'undefined') return { html, headings: [] };
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  const headings = [];
  wrap.querySelectorAll('h2, h3').forEach((el, i) => {
    const id = `kh-h-${i}`;
    el.id = id;
    headings.push({
      id,
      text: el.textContent?.trim() || '',
      level: el.tagName === 'H2' ? 2 : 3,
    });
  });
  return { html: wrap.innerHTML, headings };
}

function postThumb(post) {
  const raw = post?.thumbnail || post?.image || '';
  return raw ? normalizePostImageUrl(raw) : '';
}

function RelatedCard({ post, language, onOpen }) {
  const img = postThumb(post);
  return (
    <button
      type="button"
      onClick={() => onOpen(post)}
      className="group flex flex-col overflow-hidden rounded-lg border border-slate-200/80 bg-white text-left transition-shadow hover:shadow-md"
    >
      <div className="aspect-[16/10] overflow-hidden bg-slate-100">
        {img ? (
          <img src={img} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-slate-400">KB</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#0077B6]">
          {pickPublicPostCategoryLabel(post, language, '')}
        </span>
        <h4 className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-slate-900 group-hover:text-[#0077B6]">
          {pickPublicPostTitle(post, language)}
        </h4>
      </div>
    </button>
  );
}

export default function KnowledgeArticlePage() {
  const { postSlug } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await apiService.getBusinessKnowledgePostById(postSlug);
        const item = res?.data?.post || null;
        if (!cancelled) {
          setPost(item);
          if (!item) setError('Không tìm thấy bài viết.');
        }
        if (item?.categoryId || item?.category?.id) {
          const catId = item.category?.id || item.categoryId;
          const [relRes, popRes] = await Promise.all([
            apiService.getBusinessKnowledgePosts({
              categoryId: catId,
              limit: 6,
              sortBy: 'published_at',
              sortOrder: 'DESC',
            }),
            apiService.getBusinessKnowledgePosts({
              limit: 6,
              sortBy: 'viewCount',
              sortOrder: 'DESC',
            }),
          ]);
          if (!cancelled) {
            const selfKey = String(item.id);
            setRelatedPosts(
              (relRes?.data?.posts || []).filter((p) => String(p.id) !== selfKey).slice(0, 3),
            );
            setPopularPosts(
              (popRes?.data?.posts || []).filter((p) => String(p.id) !== selfKey).slice(0, 5),
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          setPost(null);
          setError(err?.message || 'Không tải được bài viết.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (postSlug) run();
    return () => { cancelled = true; };
  }, [postSlug]);

  const title = useMemo(() => pickPublicPostTitle(post, language), [post, language]);
  const excerpt = useMemo(() => pickPublicPostExcerpt(post, language), [post, language]);
  const categoryLabel = useMemo(
    () => pickPublicPostCategoryLabel(post, language, ''),
    [post, language],
  );
  const rawContentHtml = useMemo(() => pickPostContentHtml(post, language), [post, language]);
  const { html: contentHtml, headings } = useMemo(
    () => injectHeadingIds(rawContentHtml),
    [rawContentHtml],
  );
  const tags = useMemo(() => parsePostTags(post), [post]);

  const imageUrl = post?.thumbnail || post?.image
    ? normalizePostImageUrl(post.thumbnail || post.image)
    : '';
  const dateStr = formatDate(post?.publishedAt || post?.createdAt, language);
  const readMin = estimateReadMinutes(post, language);
  const views = post?.viewCount ?? post?.view_count ?? null;
  const authorName = post?.author?.name || post?.author?.email || 'Ban biên tập Work Station';

  const openPost = (p) => {
    const key = p?.slug || p?.id;
    if (key) navigate(`/business/knowledge/${encodeURIComponent(key)}`);
  };

  return (
    <>
      <style>{articleStyles}</style>
      <div
        className="flex h-full min-h-0 flex-col overflow-hidden bg-[#fafbfc]"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="shrink-0 border-b border-slate-200/80 bg-white px-3 py-2 sm:px-5">
          <nav className="text-[11px] text-slate-500 sm:text-xs">
            <Link to="/business" className="hover:text-[#0077B6]">Trang chủ</Link>
            <span className="mx-1.5 text-slate-300">/</span>
            <Link to="/business/knowledge" className="hover:text-[#0077B6]">Knowledge Hub</Link>
            <span className="mx-1.5 text-slate-300">/</span>
            <span className="font-medium text-slate-700 line-clamp-1">{title || 'Bài viết'}</span>
          </nav>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải bài viết...
            </div>
          ) : error ? (
            <div className="mx-auto max-w-lg rounded-lg border border-red-100 bg-white p-6 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <Link to="/business/knowledge" className="mt-3 inline-block text-xs font-semibold text-[#0077B6]">
                Về Knowledge Hub
              </Link>
            </div>
          ) : (
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_260px] xl:gap-10">
              <article className="min-w-0">
                {imageUrl ? (
                  <div className="aspect-[16/6] max-h-[220px] w-full overflow-hidden rounded-lg bg-slate-100 sm:max-h-[260px]">
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : null}

                <header className={`${imageUrl ? 'mt-5' : 'mt-0'} max-w-3xl`}>
                  {categoryLabel ? (
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#0077B6]">
                      {categoryLabel}
                    </span>
                  ) : null}
                  <h1 className="mt-2 text-xl font-bold leading-tight text-slate-900 sm:text-2xl lg:text-[1.65rem]">
                    {title}
                  </h1>
                  {excerpt ? (
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">{excerpt}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200/80 pb-4 text-[11px] text-slate-500 sm:text-xs">
                    {dateStr ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" aria-hidden />
                        {dateStr}
                      </span>
                    ) : null}
                    {readMin ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {readMin} phút đọc
                      </span>
                    ) : null}
                    {views != null ? (
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        {views} lượt xem
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5" aria-hidden />
                      {authorName}
                    </span>
                  </div>

                  {tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </header>

                {contentHtml ? (
                  <div
                    className="kh-prose mt-6"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />
                ) : (
                  <p className="mt-6 text-sm text-slate-500">Nội dung đang được cập nhật.</p>
                )}

                {tags.length > 0 ? (
                  <div className="mt-8 max-w-3xl border-t border-slate-200/80 pt-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Chủ đề</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <span
                          key={`foot-${tag}`}
                          className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-medium text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {relatedPosts.length > 0 ? (
                  <section className="mt-10 max-w-4xl border-t border-slate-200/80 pt-8">
                    <h2 className="text-base font-bold text-slate-900">Bài viết liên quan</h2>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {relatedPosts.map((p) => (
                        <RelatedCard key={p.id} post={p} language={language} onOpen={openPost} />
                      ))}
                    </div>
                  </section>
                ) : null}
              </article>

              <aside className="hidden lg:block">
                <div className="sticky top-4 space-y-6">
                  {headings.length > 2 ? (
                    <nav className="rounded-lg border border-slate-200/80 bg-white p-4" aria-label="Mục lục">
                      <h3 className="border-b border-slate-100 pb-2 text-xs font-bold text-slate-900">Mục lục</h3>
                      <ul className="mt-2 max-h-[40vh] space-y-1 overflow-y-auto text-[11px]">
                        {headings.map((h) => (
                          <li key={h.id} style={{ paddingLeft: h.level === 3 ? '0.75rem' : 0 }}>
                            <a
                              href={`#${h.id}`}
                              className="block py-0.5 leading-snug text-slate-600 hover:text-[#0077B6]"
                            >
                              {h.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  ) : null}

                  {relatedPosts.length > 0 ? (
                    <div className="rounded-lg border border-slate-200/80 bg-white p-4">
                      <h3 className="border-b border-slate-100 pb-2 text-xs font-bold text-slate-900">Bài viết liên quan</h3>
                      <ul className="mt-2 divide-y divide-slate-100">
                        {relatedPosts.map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => openPost(p)}
                              className="w-full py-2 text-left text-[12px] font-medium leading-snug text-slate-800 hover:text-[#0077B6]"
                            >
                              {pickPublicPostTitle(p, language)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {popularPosts.length > 0 ? (
                    <div className="rounded-lg border border-slate-200/80 bg-white p-4">
                      <h3 className="border-b border-slate-100 pb-2 text-xs font-bold text-slate-900">Đọc nhiều</h3>
                      <ul className="mt-2 divide-y divide-slate-100">
                        {popularPosts.map((p, idx) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => openPost(p)}
                              className="flex w-full gap-2 py-2 text-left"
                            >
                              <span className="w-4 shrink-0 text-xs font-bold text-slate-300">{idx + 1}</span>
                              <span className="text-[12px] font-medium leading-snug text-slate-800 hover:text-[#0077B6]">
                                {pickPublicPostTitle(p, language)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {categoryLabel ? (
                    <div className="rounded-lg border border-slate-200/80 bg-white p-4">
                      <h3 className="text-xs font-bold text-slate-900">Chủ đề liên quan</h3>
                      <Link
                        to="/business/knowledge"
                        className="mt-2 inline-block rounded-full bg-[#e8f4fa] px-3 py-1 text-[11px] font-semibold text-[#0077B6]"
                      >
                        {categoryLabel}
                      </Link>
                    </div>
                  ) : null}
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
