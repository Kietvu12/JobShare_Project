import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Eye, Loader2 } from 'lucide-react';
import apiService, { normalizePostImageUrl } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import {
  pickPublicPostCategoryLabel,
  pickPublicPostExcerpt,
  pickPublicPostTitle,
} from '../../utils/publicPostDisplay';

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif";
const BRAND = '#0077B6';

function formatDate(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const locale = lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'vi-VN';
  try {
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
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

export default function KnowledgeArticlePage() {
  const { postSlug } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [post, setPost] = useState(null);
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
  const contentHtml = useMemo(() => pickPostContentHtml(post, language), [post, language]);
  const imageUrl = post?.thumbnail || post?.image
    ? normalizePostImageUrl(post.thumbnail || post.image)
    : '';
  const dateStr = formatDate(post?.publishedAt || post?.createdAt, language);
  const readMin = estimateReadMinutes(post, language);
  const views = post?.viewCount ?? post?.view_count ?? null;

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f6f8]"
      style={{ fontFamily: PAGE_FONT }}
    >
      <div className="shrink-0 border-b border-slate-200/90 bg-white px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={() => navigate('/business/knowledge')}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0077B6] hover:text-[#006399]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại Knowledge Hub
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải bài viết...
          </div>
        ) : error ? (
          <div className="mx-auto max-w-2xl rounded-xl border border-red-100 bg-white p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Link
              to="/business/knowledge"
              className="mt-3 inline-block text-xs font-semibold text-[#0077B6]"
            >
              Về Knowledge Hub
            </Link>
          </div>
        ) : (
          <article className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
            {imageUrl ? (
              <div className="aspect-[16/8] w-full overflow-hidden bg-slate-100">
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <div className="p-4 sm:p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {categoryLabel ? (
                  <span className="rounded-full bg-[#e8f4fa] px-2 py-0.5 text-[10px] font-semibold text-[#0077B6]">
                    {categoryLabel}
                  </span>
                ) : null}
                {dateStr ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                    <Calendar className="h-3 w-3" />
                    {dateStr}
                  </span>
                ) : null}
                {readMin ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                    <Eye className="h-3 w-3" />
                    {readMin} phút đọc
                  </span>
                ) : null}
                {views != null ? (
                  <span className="text-[10px] text-slate-400">{views} lượt xem</span>
                ) : null}
              </div>
              <h1 className="text-lg font-bold leading-snug text-slate-900 sm:text-xl">{title}</h1>
              {excerpt ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{excerpt}</p>
              ) : null}
              {contentHtml ? (
                <div
                  className="prose prose-sm mt-5 max-w-none text-slate-800 prose-headings:text-slate-900 prose-a:text-[#0077B6]"
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
              ) : (
                <p className="mt-5 text-sm text-slate-500">Nội dung đang được cập nhật.</p>
              )}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
