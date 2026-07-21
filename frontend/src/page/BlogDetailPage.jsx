import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useParams } from 'react-router-dom';
import apiService, { normalizePostImageUrl } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useCandidateAuth } from '../context/CandidateAuthContext';
import { translations } from '../translations/translations';
import BlogEventRegistrationSidebar from '../component/Shared/BlogEventRegistrationSidebar';
import {
  isCandidatePublicPath,
  resolvePublicBlogPrefix,
} from '../utils/localeRoutes';
import {
  pickPublicPostMetaTitle,
  pickPublicPostExcerpt,
  pickPublicPostTitle,
  getPostBlogSlug,
  getPostDetailHref,
  getPostShareImageUrl,
} from '../utils/publicPostDisplay';

const LOAD_ERROR_KEY = '__blog_load_error__';

const sidebarI18n = {
  vi: { otherNews: 'Các tin tức khác', loading: 'Đang tải…', empty: 'Chưa có bài khác.' },
  en: { otherNews: 'Other news', loading: 'Loading…', empty: 'No other articles.' },
  ja: { otherNews: 'その他のニュース', loading: '読み込み中…', empty: '他の記事はありません。' },
};

function isSamePost(post, slugOrId) {
  if (!post || !slugOrId) return false;
  const key = decodeURIComponent(String(slugOrId).trim());
  const postSlug = getPostBlogSlug(post);
  return postSlug === key || String(post.id) === key;
}

function formatDate(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const locale = lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'vi-VN';
  try {
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function getPostImage(post) {
  const raw = post?.thumbnail || post?.image || '';
  return raw ? normalizePostImageUrl(raw) : '';
}

function getPostShareImage(post) {
  return getPostShareImageUrl(post);
}

function pickPostTitle(post, lang) {
  if (!post) return '';
  if (lang === 'en') return post.titleEn || post.title || '';
  if (lang === 'ja') return post.titleJp || post.titleEn || post.title || '';
  return post.title || post.titleEn || post.titleJp || '';
}

function pickPostContentHtml(post, lang) {
  if (!post) return '';
  if (lang === 'en') return post.contentEn || post.content || '';
  if (lang === 'ja') return post.contentJp || post.contentEn || post.content || '';
  return post.content || post.contentEn || post.contentJp || '';
}

export default function BlogDetailPage() {
  const { postSlug } = useParams();
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const { applicant } = useCandidateAuth();
  const t = translations[language] || translations.vi;
  const [post, setPost] = useState(null);
  const [linkedEvent, setLinkedEvent] = useState(null);
  const [otherPosts, setOtherPosts] = useState([]);
  const [otherPostsLoading, setOtherPostsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isStandaloneBlog = /^\/blog\/[^/]+$/.test(pathname);
  const backLink = useMemo(() => {
    const tr = translations[language] || translations.vi;
    const listLabel = tr.publicBlogBackToList;
    if (isCandidatePublicPath(pathname)) {
      const p = resolvePublicBlogPrefix(pathname);
      return { to: `${p}/blog`, label: listLabel };
    }
    if (pathname.includes('/blog')) {
      const p = resolvePublicBlogPrefix(pathname);
      return { to: `${p}/blog`, label: listLabel };
    }
    return { to: '/login', label: tr.publicBlogBackToLogin };
  }, [pathname, language]);

  const blogSurface = useMemo(() => {
    if (isCandidatePublicPath(pathname)) return 'candidate';
    return 'collaborator';
  }, [pathname]);

  const blogBase = useMemo(() => resolvePublicBlogPrefix(pathname), [pathname]);
  const sidebarT = sidebarI18n[language] || sidebarI18n.vi;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await apiService.getPublicPostById(postSlug, { surface: blogSurface });
        const item = res?.data?.post || res?.data || null;
        const ev = res?.data?.linkedEvent ?? null;
        if (!cancelled) {
          setPost(item);
          setLinkedEvent(ev && ev.id ? ev : null);
        }
      } catch (e) {
        if (!cancelled) {
          setPost(null);
          setLinkedEvent(null);
          setError(e?.message ? String(e.message) : LOAD_ERROR_KEY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [postSlug, blogSurface]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setOtherPostsLoading(true);
        const res = await apiService.getPublicPosts({
          page: 1,
          limit: 12,
          sortBy: 'published_at',
          sortOrder: 'DESC',
          surface: blogSurface,
        });
        if (cancelled) return;
        const list = Array.isArray(res?.data?.posts) ? res.data.posts : [];
        setOtherPosts(list.filter((item) => !isSamePost(item, postSlug)).slice(0, 8));
      } catch {
        if (!cancelled) setOtherPosts([]);
      } finally {
        if (!cancelled) setOtherPostsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [postSlug, blogSurface]);

  const title = useMemo(() => {
    const tr = translations[language] || translations.vi;
    const raw = pickPublicPostMetaTitle(post, language) || pickPostTitle(post, language);
    return raw.trim() ? raw : tr.publicBlogDetailTitleFallback;
  }, [post, language]);

  const tag = useMemo(() => {
    const tr = translations[language] || translations.vi;
    if (typeof post?.tag === 'string') {
      const first = post.tag.split(',').map((x) => x.trim()).filter(Boolean)[0];
      if (first) return first;
    }
    if (post?.category?.name) return post.category.name;
    return tr.publicBlogDefaultTag;
  }, [post, language]);

  const contentHtml = useMemo(() => pickPostContentHtml(post, language), [post, language]);

  const coverImage = useMemo(() => getPostImage(post), [post]);
  const shareImage = useMemo(() => getPostShareImage(post), [post]);

  const errorDisplay = useMemo(() => {
    const tr = translations[language] || translations.vi;
    if (!error) return '';
    if (error === LOAD_ERROR_KEY) return tr.publicBlogDetailLoadError;
    return error;
  }, [error, language]);

  const eventPrefillName = applicant?.name?.trim() || '';
  const eventPrefillEmail = applicant?.email?.trim() || '';

  const blogSeoTitle = title ? `${title} | Workstation JobShare` : 'Blog | Workstation JobShare';
  const blogSeoDesc = useMemo(() => {
    const excerpt = pickPublicPostExcerpt(post, language);
    if (excerpt) return excerpt;
    return contentHtml ? contentHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) : '';
  }, [post, language, contentHtml]);

  return (
    <div className="flex flex-1 flex-col">
      <Helmet>
        <title>{blogSeoTitle}</title>
        {blogSeoDesc && <meta name="description" content={blogSeoDesc} />}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={blogSeoTitle} />
        {blogSeoDesc && <meta property="og:description" content={blogSeoDesc} />}
        <meta property="og:url" content={`https://ws-jobshare.com${pathname}`} />
        {shareImage && <meta property="og:image" content={shareImage} />}
        {shareImage && <meta property="og:image:secure_url" content={shareImage} />}
        <meta property="og:site_name" content="Workstation JobShare" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blogSeoTitle} />
        {shareImage && <meta name="twitter:image" content={shareImage} />}
        {post && (
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": title,
            "url": `https://ws-jobshare.com${pathname}`,
            ...(shareImage ? { "image": shareImage } : {}),
            ...(post.publishedAt ? { "datePublished": post.publishedAt } : {}),
            "publisher": { "@type": "Organization", "name": "Workstation JobShare", "url": "https://ws-jobshare.com" }
          })}</script>
        )}
      </Helmet>
      <main
        className={`mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 px-4 py-8 md:px-6 md:py-10 lg:flex-row lg:items-start lg:gap-10 ${
          isStandaloneBlog ? 'pt-[120px] sm:pt-[130px]' : 'pt-4 sm:pt-8'
        }`}
      >
        <section className="min-w-0 flex-1 lg:w-[70%]">
          <style>{`
            .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6 {
              color: #111827;
              font-weight: 700;
              line-height: 1.3;
              margin: 1.1em 0 0.55em;
            }
            .blog-content h1 { font-size: 2rem; }
            .blog-content h2 { font-size: 1.6rem; }
            .blog-content h3 { font-size: 1.35rem; }
            .blog-content p { margin: 0.85em 0; line-height: 1.75; color: #1f2937; }
            .blog-content ul, .blog-content ol { margin: 0.9em 0; padding-left: 1.5em; }
            .blog-content ul { list-style: disc; }
            .blog-content ol { list-style: decimal; }
            .blog-content li { margin: 0.35em 0; }
            .blog-content a { color: #2563eb; text-decoration: underline; }
            .blog-content blockquote {
              margin: 1em 0;
              padding: 0.75em 1em;
              border-left: 4px solid #e5e7eb;
              background: #f9fafb;
              color: #374151;
            }
            .blog-content img, .blog-content video {
              max-width: 100%;
              height: auto;
              border-radius: 0.75rem;
              margin: 0.9em 0;
            }
          `}</style>

          {/* <div className="mb-5">
            <Link
              to={backLink.to}
              className="inline-flex items-center text-sm font-semibold !text-[#ED212F] hover:underline"
            >
              {backLink.label}
            </Link>
          </div> */}

          {loading ? (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-[#6B7280]">
              {t.publicBlogDetailLoading}
            </div>
          ) : error || !post ? (
            <div className="rounded-2xl border border-[#F1C4C9] bg-[#FFF5F5] p-8 text-[#B42318]">
              {error ? errorDisplay : t.publicBlogDetailNotFound}
            </div>
          ) : (
            <article className="min-w-0 rounded-2xl bg-white p-5 sm:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Link
                  to={backLink.to}
                  className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-full border border-[#ED212F]/25 bg-[#fff5f6] text-lg font-bold leading-none !text-[#ED212F] transition-colors hover:bg-[#ffe8eb] hover:!text-[#d11824]"
                  aria-label={backLink.label}
                  title={backLink.label}
                >
                  ←
                </Link>
                <span className="inline-flex h-[28px] items-center justify-center rounded-full bg-[#1848a0] px-3 text-[12px] font-bold text-white">
                  {tag}
                </span>
                <span className="text-[15px] font-medium text-[#4b5563]">
                  {formatDate(post?.publishedAt || post?.createdAt, language)}
                </span>
              </div>

              <h1 className="text-[clamp(1.5rem,4.2vw,2.2rem)] font-semibold leading-tight text-[#1f2937]">
                {title}
              </h1>

              {coverImage ? (
                <div className="mx-auto mt-6 w-full max-w-[720px]">
                  <img src={coverImage} alt={title} className="h-auto max-h-[360px] w-full rounded-xl object-contain" />
                </div>
              ) : null}

              {linkedEvent?.id ? (
                <div className="mt-7 flex flex-col gap-8">
                  <div
                    className="blog-content min-w-0 max-w-none text-[#1f2937]"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />
                  <div className="w-full max-w-[480px]">
                    <BlogEventRegistrationSidebar
                      event={linkedEvent}
                      initialName={eventPrefillName}
                      initialEmail={eventPrefillEmail}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="blog-content mt-7 max-w-none text-[#1f2937]"
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
              )}
            </article>
          )}
        </section>

        <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-[30%] lg:max-w-[360px]">
          <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
            <h2 className="border-b border-[#E5E7EB] bg-[#f9fafb] px-4 py-3 text-sm font-bold text-[#111827] sm:px-5">
              {sidebarT.otherNews}
            </h2>
            {otherPostsLoading ? (
              <p className="px-4 py-6 text-sm text-[#6B7280] sm:px-5">{sidebarT.loading}</p>
            ) : otherPosts.length === 0 ? (
              <p className="px-4 py-6 text-sm text-[#6B7280] sm:px-5">{sidebarT.empty}</p>
            ) : (
              <nav className="divide-y divide-[#E5E7EB]">
                {otherPosts.map((item) => {
                  const itemTitle = pickPublicPostTitle(item, language);
                  const itemDate = formatDate(item.publishedAt || item.createdAt, language);
                  const href = getPostDetailHref(item, blogBase);
                  const isActive = isSamePost(item, postSlug);
                  return (
                    <Link
                      key={item.id ?? href}
                      to={href}
                      className={`block px-4 py-3.5 transition-colors sm:px-5 ${
                        isActive
                          ? 'bg-[#fff5f6] text-[#ED212F]'
                          : 'text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827]'
                      }`}
                    >
                      <span className="line-clamp-3 text-[13px] font-semibold leading-snug sm:text-sm">
                        {itemTitle}
                      </span>
                      {itemDate ? (
                        <span className="mt-1 block text-[11px] font-medium text-[#9CA3AF]">{itemDate}</span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            )}
            <div className="border-t border-[#E5E7EB] px-4 py-3 sm:px-5">
              <Link
                to={backLink.to}
                className="text-xs font-semibold !text-[#ED212F] hover:underline sm:text-sm"
              >
                {backLink.label}
              </Link>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
