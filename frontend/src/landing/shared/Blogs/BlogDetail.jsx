import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Facebook, Link2, Linkedin } from 'lucide-react';
import apiService, { rewritePostContentMediaUrls } from '../../../services/api';
import {
  formatPublicPostDate,
  getPostBlogSlug,
  getPostDetailHref,
  getPostShareImageUrl,
  getPublicPostThumbnailUrl,
  pickPublicPostCategoryLabel,
  pickPublicPostExcerpt,
  pickPublicPostMetaTitle,
  pickPublicPostTitle,
} from '../../../utils/publicPostDisplay';
import { landingContainer } from '../lib/landingUi';
import { useLandingLocale } from '../lib/useLandingLocale';
import { blogDetailCopy } from './blogDetailCopy';
import './blogDetailContent.css';

const SURFACE_DEFAULT = 'collaborator';

function estimateReadMinutes(post, lang) {
  const excerpt = pickPublicPostExcerpt(post, lang);
  const title = pickPublicPostTitle(post, lang);
  const words = `${title} ${excerpt}`.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

function pickPostContentHtml(post, lang) {
  if (!post) return '';
  if (lang === 'en') return rewritePostContentMediaUrls(post.contentEn || post.content || '');
  if (lang === 'ja') return rewritePostContentMediaUrls(post.contentJp || post.contentEn || post.content || '');
  return rewritePostContentMediaUrls(post.content || post.contentEn || post.contentJp || '');
}

function MetaRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="border-b border-[#e3eaef] py-4 first:pt-0 last:border-b-0 sm:border-b-0 sm:py-0 lg:border-b lg:py-5 lg:first:pt-0 lg:last:border-b-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#617782] sm:text-[11px]">{label}</p>
      <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-[#112f3d] sm:mt-2 sm:text-sm">
        {value}
      </p>
    </div>
  );
}

/** Ảnh đại diện bài — full width, tỉ lệ gốc, không crop/zoom */
function ArticleCover({ src }) {
  if (!src) return null;
  return (
    <figure className="mt-6 w-full border border-[#dae4e9] bg-white sm:mt-8 md:mt-10 lg:mt-12">
      <img
        src={src}
        alt=""
        className="block h-auto w-full max-w-full object-contain object-center"
        fetchPriority="high"
        decoding="async"
      />
    </figure>
  );
}

/** Tin liên quan — thu ảnh vừa khung, không zoom; nền trắng */
function RelatedThumbnail({ src }) {
  return (
    <div className="flex h-[160px] w-full shrink-0 items-center justify-center overflow-hidden bg-white sm:h-[200px]">
      {src ? (
        <img
          src={src}
          alt=""
          className="max-h-full max-w-full object-contain object-center"
          loading="lazy"
          decoding="async"
        />
      ) : null}
    </div>
  );
}

function RelatedCard({ post, lang, t, blogBase, detailListPath }) {
  const href = getPostDetailHref(post, blogBase, detailListPath);
  const img = getPublicPostThumbnailUrl(post);
  const title = pickPublicPostTitle(post, lang);
  return (
    <Link
      to={href}
      className="group flex h-full w-full min-w-0 flex-col gap-0 overflow-hidden border border-[#dae4e9] bg-white"
    >
      <RelatedThumbnail src={img} />
      <div className="flex flex-1 flex-col border-t border-[#e8eef2] bg-white p-4">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-[#112f3d] group-hover:text-[#be1824]">
          {title}
        </p>
        <p className="mt-2 text-xs text-[#617782]">
          {formatPublicPostDate(post.publishedAt || post.createdAt, lang)}
        </p>
      </div>
    </Link>
  );
}

export default function BlogDetail({
  surface = SURFACE_DEFAULT,
  listPath,
  blogBasePath,
  detailListPath = 'collaborator/blog',
}) {
  const { postSlug } = useParams();
  const lang = useLandingLocale();
  const t = blogDetailCopy(lang);

  const blogBase = (blogBasePath || '').replace(/\/+$/, '');
  const listTo = listPath || `${blogBase}/${detailListPath}`.replace(/\/+/g, '/');

  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await apiService.getPublicPostById(postSlug, { surface });
      const item = res?.data?.post || res?.data || null;
      if (!item) throw new Error('not found');
      setPost(item);

      const rel = await apiService.getPublicPosts({
        surface,
        page: 1,
        limit: 4,
        sortBy: 'publishedAt',
        sortOrder: 'DESC',
      });
      const slug = getPostBlogSlug(item);
      const others = (rel?.data?.posts ?? []).filter((p) => getPostBlogSlug(p) !== slug).slice(0, 3);
      setRelated(others);
    } catch (e) {
      console.error('[BlogDetail]', e);
      setPost(null);
      setRelated([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [postSlug, surface]);

  useEffect(() => {
    load();
  }, [load]);

  const title = useMemo(() => {
    const raw = pickPublicPostMetaTitle(post, lang) || pickPublicPostTitle(post, lang);
    return raw.trim() || t.pageTitleFallback;
  }, [post, lang, t.pageTitleFallback]);

  const excerpt = useMemo(() => pickPublicPostExcerpt(post, lang), [post, lang]);
  const contentHtml = useMemo(() => pickPostContentHtml(post, lang), [post, lang]);
  const cover = useMemo(() => getPublicPostThumbnailUrl(post), [post]);
  const shareImage = useMemo(() => getPostShareImageUrl(post), [post]);
  const category = useMemo(
    () => pickPublicPostCategoryLabel(post, lang, t.categoryFallback),
    [post, lang, t.categoryFallback],
  );
  const dateLabel = useMemo(
    () => formatPublicPostDate(post?.publishedAt || post?.createdAt, lang),
    [post, lang],
  );
  const readLabel = useMemo(() => {
    if (!post) return '';
    return `${estimateReadMinutes(post, lang)} ${t.minRead}`;
  }, [post, lang, t.minRead]);

  const authorName = post?.author?.name || post?.authorName || 'JobShare';
  const authorBio = post?.author?.bio || t.authorBioFallback;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <Helmet>
        <title>{title ? `${title} | JobShare` : t.pageTitleFallback}</title>
        {excerpt ? <meta name="description" content={excerpt} /> : null}
        {shareImage ? <meta property="og:image" content={shareImage} /> : null}
      </Helmet>

      <div className="bg-white py-8 sm:py-12 md:py-14 lg:py-16">
        <div className={`${landingContainer} max-w-[1280px]`}>
          {loading ? (
            <p className="py-20 text-center text-[#617782]">{t.loading}</p>
          ) : null}

          {error || (!loading && !post) ? (
            <div className="border border-[#efc9ce] bg-[#fff5f6] px-4 py-10 text-center sm:px-8 sm:py-14">
              <p className="text-[#be1824]">{error ? t.loadError : t.notFound}</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={load}
                  className="border border-[#be1824] bg-[#be1824] px-5 py-2 text-sm font-bold text-white"
                >
                  {t.retry}
                </button>
                <Link to={listTo} className="border border-[#dae4e9] px-5 py-2 text-sm font-bold text-[#112f3d]">
                  {t.goBack}
                </Link>
              </div>
            </div>
          ) : null}

          {post && !loading ? (
            <article className="min-w-0">
              <Link
                to={listTo}
                className="inline-flex items-center gap-2 border border-[#112f3d] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#112f3d] hover:bg-[#f4f7f9]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                {t.goBack}
              </Link>

              <div className="mt-6 grid gap-6 sm:mt-8 md:mt-10 md:gap-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-0 xl:grid-cols-[minmax(0,1fr)_260px]">
                <div className="min-w-0 lg:pr-8 xl:pr-14">
                  <h1 className="text-[clamp(1.375rem,5vw,2.75rem)] font-black leading-[1.2] tracking-tight text-[#112f3d] sm:leading-[1.15]">
                    {title}
                  </h1>
                  {excerpt ? (
                    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#617782] sm:mt-5 sm:text-base md:text-lg">
                      {excerpt}
                    </p>
                  ) : null}
                </div>
                <aside className="grid grid-cols-1 gap-4 border-t border-[#e3eaef] pt-6 sm:grid-cols-3 sm:gap-4 sm:border-t-0 sm:pt-0 md:gap-6 lg:block lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 xl:pl-14">
                  <MetaRow label={t.date} value={dateLabel} />
                  <MetaRow label={t.category} value={category} />
                  <MetaRow label={t.readingTime} value={readLabel} />
                </aside>
              </div>

              <ArticleCover src={cover} />

              <div className="mt-8 grid gap-8 sm:mt-10 md:mt-12 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_260px] xl:gap-12">
                <div
                  className="blog-detail-content min-w-0 text-sm sm:text-base lg:pr-4 xl:pr-16"
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />

                <aside className="border-t border-[#e3eaef] pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 xl:pl-10">
                  <div className="border-b border-[#e3eaef] pb-8">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#617782]">{t.author}</p>
                    <p className="mt-3 text-lg font-bold text-[#112f3d]">{authorName}</p>
                    <p className="mt-3 text-sm leading-relaxed text-[#617782]">{authorBio}</p>
                  </div>
                  <div className="pt-8">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#617782]">{t.share}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={copyLink}
                        className="flex h-10 w-10 items-center justify-center border border-[#dae4e9] text-[#112f3d] hover:border-[#112f3d]"
                        title={copied ? t.copied : t.copyLink}
                        aria-label={t.copyLink}
                      >
                        <Link2 className="h-4 w-4" />
                      </button>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 w-10 items-center justify-center border border-[#dae4e9] text-[#112f3d] hover:border-[#112f3d]"
                        aria-label="Facebook"
                      >
                        <Facebook className="h-4 w-4" />
                      </a>
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 w-10 items-center justify-center border border-[#dae4e9] text-[#112f3d] hover:border-[#112f3d]"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </aside>
              </div>

              {related.length > 0 ? (
                <section className="mt-10 border-t border-[#e3eaef] pt-8 sm:mt-14 sm:pt-10 md:mt-16 md:pt-12">
                  <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
                    <h2 className="text-xl font-black uppercase tracking-tight text-[#112f3d] sm:text-2xl md:text-3xl">
                      {t.relatedNews}
                    </h2>
                    <Link
                      to={listTo}
                      className="inline-flex w-fit border border-[#112f3d] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#112f3d] hover:bg-[#f4f7f9]"
                    >
                      {t.seeAll}
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
                    {related.map((p) => (
                      <RelatedCard
                        key={p.id}
                        post={p}
                        lang={lang}
                        t={t}
                        blogBase={blogBase}
                        detailListPath={detailListPath}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </article>
          ) : null}
        </div>
      </div>
    </>
  );
}
