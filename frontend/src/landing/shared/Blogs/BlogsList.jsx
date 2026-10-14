import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import apiService from '../../../services/api';
import {
  formatPublicPostDate,
  getPostDetailHref,
  getPublicPostThumbnailUrl,
  pickPublicPostCategoryLabel,
  pickPublicPostExcerpt,
  pickPublicPostTitle,
} from '../../../utils/publicPostDisplay';
import { landingContainer } from '../lib/landingUi';
import { useLandingLocale } from '../lib/useLandingLocale';
import { blogsListCopy, partitionBlogPosts } from './blogsListCopy';

const PAGE_SIZE = 10;

const COVER_IMG_BASE =
  'absolute inset-0 h-full w-full min-h-full min-w-full object-cover';

function BlogCover({ src, className = '', position = 'center' }) {
  const positionClass =
    position === 'top'
      ? 'object-top [object-position:center_top]'
      : 'object-center [object-position:center]';

  return (
    <div className={`relative overflow-hidden bg-[#dce4e9] ${className}`}>
      {src ? (
        <img
          src={src}
          alt=""
          className={`${COVER_IMG_BASE} ${positionClass}`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div
          className={`${COVER_IMG_BASE} ${positionClass} bg-gradient-to-br from-[#c5d3db] to-[#e8eef2]`}
          aria-hidden
        />
      )}
    </div>
  );
}

function estimateReadMinutes(post, lang) {
  const excerpt = pickPublicPostExcerpt(post, lang);
  const title = pickPublicPostTitle(post, lang);
  const words = `${title} ${excerpt}`.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

function PostMeta({ post, lang, t, light = false }) {
  const date = formatPublicPostDate(post.publishedAt || post.createdAt, lang);
  const mins = estimateReadMinutes(post, lang);
  if (!date && !mins) return null;
  return (
    <p className={`text-sm ${light ? 'text-white/90' : 'text-[#617782]'}`}>
      {date}
      {date && mins ? ' · ' : ''}
      {mins ? `${mins} ${t.minRead}` : ''}
    </p>
  );
}

function CategoryTag({ post, lang, t, variant = 'default' }) {
  const label = pickPublicPostCategoryLabel(post, lang, t.categoryFallback);
  const color = post?.category?.color || '#be1824';
  const base = 'inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide';
  if (variant === 'featured') {
    return (
      <span className={`${base} border border-white/35 bg-white/10 px-3 py-1.5 text-white backdrop-blur-[2px]`}>
        <span className="inline-block h-2 w-2 shrink-0" style={{ backgroundColor: color }} aria-hidden />
        {label}
      </span>
    );
  }
  return (
    <span className={`${base} text-[#2f4d5c]`}>
      <span className="inline-block h-2 w-2 shrink-0" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  );
}

function SectionDivider() {
  return <div className="my-10 border-t border-[#e3eaef] sm:my-14 md:my-16 lg:my-20" role="presentation" />;
}

/** Khối 1 — Featured (trái) */
function FeaturedCard({ post, lang, t, blogBase, detailListPath }) {
  const href = getPostDetailHref(post, blogBase, detailListPath);
  const img = getPublicPostThumbnailUrl(post);
  const title = pickPublicPostTitle(post, lang);

  return (
    <Link
      to={href}
      className="group relative block w-full overflow-hidden border border-[#dae4e9] bg-[#c5d3db]"
    >
      {/* Tỉ lệ cố định — không kéo theo chiều cao sidebar (tránh object-cover cắt quá nhiều) */}
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/10] md:aspect-[16/9] lg:aspect-[5/3]">
        <BlogCover src={img} className="absolute inset-0 h-full w-full" position="top" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-[#102a43]/75 from-10% via-[#102a43]/30 via-55% to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] backdrop-blur-[3px] [mask-image:linear-gradient(to_top,black_25%,transparent)]"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 z-[1] p-5 sm:p-7 md:p-9 lg:p-10">
          <CategoryTag post={post} lang={lang} t={t} variant="featured" />
          <h2 className="mt-3 text-lg font-black leading-snug text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35),0_4px_24px_rgba(0,0,0,0.25)] sm:mt-4 sm:text-xl md:text-2xl lg:text-[2rem] lg:leading-tight">
            {title}
          </h2>
          <div className="mt-4 [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
            <PostMeta post={post} lang={lang} t={t} light />
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Khối 1 — Latest (phải) */
function LatestItem({ post, lang, t, blogBase, detailListPath }) {
  const href = getPostDetailHref(post, blogBase, detailListPath);
  const img = getPublicPostThumbnailUrl(post);
  const title = pickPublicPostTitle(post, lang);

  return (
    <Link
      to={href}
      className="flex gap-3 border-b border-[#e8eef2] py-4 transition-colors last:border-b-0 hover:bg-[#f8fafb] sm:gap-5 sm:py-5 md:py-6"
    >
      <BlogCover src={img} className="h-16 w-16 shrink-0 border border-[#dae4e9] sm:h-[72px] sm:w-[72px] md:h-20 md:w-20" />
      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="line-clamp-2 text-[0.9375rem] font-bold leading-snug text-[#112f3d] sm:text-base">{title}</h3>
        <div className="mt-2.5">
          <PostMeta post={post} lang={lang} t={t} />
        </div>
      </div>
    </Link>
  );
}

/** Khối 2 — Founders corner */
function GridCard({ post, lang, t, blogBase, detailListPath, className = '' }) {
  const href = getPostDetailHref(post, blogBase, detailListPath);
  const img = getPublicPostThumbnailUrl(post);
  const title = pickPublicPostTitle(post, lang);
  const excerpt = pickPublicPostExcerpt(post, lang);

  return (
    <article
      data-blog-grid-card
      className={`flex h-full flex-col border border-[#dae4e9] bg-white ${className}`}
    >
      <Link to={href} className="block shrink-0">
        <BlogCover src={img} className="aspect-[16/10] w-full border-b border-[#dae4e9]" />
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-6 md:p-7">
        <CategoryTag post={post} lang={lang} t={t} />
        <h3 className="mt-3 text-lg font-bold leading-snug text-[#112f3d]">
          <Link to={href} className="hover:text-[#be1824]">
            {title}
          </Link>
        </h3>
        {excerpt ? (
          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-[1.65] text-[#2f4d5c]">{excerpt}</p>
        ) : (
          <div className="flex-1" />
        )}
        <div className="mt-5 border-t border-[#e8eef2] pt-4">
          <PostMeta post={post} lang={lang} t={t} />
        </div>
      </div>
    </article>
  );
}

export default function BlogsList({
  blogBasePath,
  detailListPath = 'blog',
  surface = 'collaborator',
}) {
  const lang = useLandingLocale();
  const t = blogsListCopy(lang);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const gridRef = useRef(null);

  const blogBase = blogBasePath.replace(/\/+$/, '');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await apiService.getPublicPosts({
        surface,
        page,
        limit: PAGE_SIZE,
        sortBy: 'publishedAt',
        sortOrder: 'DESC',
      });
      if (!res?.success) throw new Error('failed');
      setPosts(res.data?.posts ?? []);
      setTotalPages(Math.max(1, res.data?.pagination?.totalPages ?? 1));
    } catch (e) {
      console.error('[BlogsList]', e);
      setPosts([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, surface]);

  useEffect(() => {
    load();
  }, [load]);

  const layout = useMemo(() => partitionBlogPosts(posts, page), [posts, page]);

  const isPageOneLayout = page === 1 && layout.showHeroRow;
  const foundersTitle = isPageOneLayout ? t.morePosts : t.allPosts;
  const showFoundersNav = layout.grid.length > 1;

  const goPage = (p) => {
    const next = Math.min(Math.max(1, p), totalPages);
    const params = new URLSearchParams(searchParams);
    if (next <= 1) params.delete('page');
    else params.set('page', String(next));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollGrid = (dir) => {
    const el = gridRef.current;
    if (!el) return;
    const card = el.querySelector('[data-blog-grid-card]');
    const step = card ? card.offsetWidth + 32 : el.clientWidth * 0.85;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>{t.pageTitle}</title>
      </Helmet>

      <div className="bg-white py-8 sm:py-12 md:py-14 lg:py-16">
        <div className={`${landingContainer} max-w-[1280px]`}>
          {loading && posts.length === 0 ? (
            <p className="py-24 text-center text-[#617782]">{t.loading}</p>
          ) : null}

          {error && !posts.length ? (
            <div className="border border-[#efc9ce] bg-[#fff5f6] px-8 py-14 text-center">
              <p className="text-[#be1824]">{t.error}</p>
              <button
                type="button"
                onClick={load}
                className="mt-5 border border-[#be1824] bg-[#be1824] px-6 py-2.5 text-sm font-bold text-white"
              >
                {t.retry}
              </button>
            </div>
          ) : null}

          {!loading && !error && posts.length === 0 ? (
            <p className="py-24 text-center text-[#617782]">{t.empty}</p>
          ) : null}

          {/* ——— Khối 1: Featured + Latest ——— */}
          {isPageOneLayout && layout.featured ? (
            <div
              className={
                layout.latest.length > 0
                  ? 'grid items-start gap-6 sm:gap-8 md:grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-10 xl:gap-12'
                  : ''
              }
            >
              <FeaturedCard
                post={layout.featured}
                lang={lang}
                t={t}
                blogBase={blogBase}
                detailListPath={detailListPath}
              />
              {layout.latest.length > 0 ? (
                <aside className="flex flex-col border border-[#dae4e9] bg-white px-4 py-5 sm:px-6 sm:py-7 md:px-7 md:py-8 lg:self-stretch">
                  <h2 className="text-base font-black text-[#112f3d] sm:text-lg md:text-xl">{t.latestPost}</h2>
                  <div className="mt-3 flex-1">
                    {layout.latest.map((p) => (
                      <LatestItem
                        key={p.id}
                        post={p}
                        lang={lang}
                        t={t}
                        blogBase={blogBase}
                        detailListPath={detailListPath}
                      />
                    ))}
                  </div>
                </aside>
              ) : null}
            </div>
          ) : null}

          {/* ——— Khối 2: Founders corner (hoặc lưới trang 2+) ——— */}
          {layout.grid.length > 0 ? (
            <section>
              {isPageOneLayout && layout.featured ? <SectionDivider /> : null}
              <div className="mb-5 flex items-center justify-between gap-3 sm:mb-7 md:mb-9">
                <h2 className="text-lg font-black text-[#112f3d] sm:text-xl md:text-2xl">{foundersTitle}</h2>
                {showFoundersNav ? (
                  <div className="flex shrink-0 gap-2 lg:hidden">
                    <button
                      type="button"
                      onClick={() => scrollGrid(-1)}
                      className="flex h-10 w-10 items-center justify-center border border-[#dae4e9] bg-white text-[#112f3d] hover:border-[#112f3d]"
                      aria-label={t.prev}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollGrid(1)}
                      className="flex h-10 w-10 items-center justify-center border border-[#dae4e9] bg-white text-[#112f3d] hover:border-[#112f3d]"
                      aria-label={t.next}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                ) : null}
              </div>
              <div
                ref={gridRef}
                className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-0 sm:gap-6 sm:px-0 md:gap-8 lg:grid lg:grid-cols-2 lg:gap-8 lg:overflow-visible lg:snap-none xl:grid-cols-3 xl:gap-10 [&::-webkit-scrollbar]:hidden"
              >
                {layout.grid.map((p) => (
                  <GridCard
                    key={p.id}
                    post={p}
                    lang={lang}
                    t={t}
                    blogBase={blogBase}
                    detailListPath={detailListPath}
                    className="w-[min(88vw,320px)] shrink-0 snap-start sm:w-[min(46vw,360px)] md:w-[min(44vw,380px)] lg:w-auto lg:min-w-0 lg:shrink"
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* ——— Khối 3: Pagination ——— */}
          {totalPages > 1 ? (
            <>
              <SectionDivider />
              <nav
                className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 md:gap-2.5"
                aria-label="Pagination"
              >
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => goPage(page - 1)}
                  className="flex h-9 w-9 items-center justify-center border border-[#dae4e9] bg-white disabled:opacity-40 sm:h-10 sm:w-10"
                  aria-label={t.prev}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let n = i + 1;
                  if (totalPages > 5) {
                    if (page <= 3) n = i + 1;
                    else if (page >= totalPages - 2) n = totalPages - 4 + i;
                    else n = page - 2 + i;
                  }
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={loading}
                      onClick={() => goPage(n)}
                      className={`flex h-9 min-w-[36px] items-center justify-center border px-2 text-xs font-bold sm:h-10 sm:min-w-[40px] sm:px-2.5 sm:text-sm ${
                        n === page
                          ? 'border-[#112f3d] bg-[#112f3d] text-white'
                          : 'border-[#dae4e9] bg-white text-[#112f3d] hover:border-[#112f3d]'
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => goPage(page + 1)}
                  className="flex h-9 w-9 items-center justify-center border border-[#dae4e9] bg-white disabled:opacity-40 sm:h-10 sm:w-10"
                  aria-label={t.next}
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </nav>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
