/** Khớp build.py — SEO + ô “+481” featured jobs. */
export const CANDIDATE_HOME_PAGE_TITLE = {
  vi: 'Tìm việc kỹ sư tại Nhật Bản | Workstation JobShare - Tạo CV bằng AI',
  en: 'Engineering Jobs in Japan | Workstation JobShare - AI-Powered CV Builder',
  ja: '日本のエンジニア求人 | Workstation JobShare - AIで履歴書作成',
};

export const CANDIDATE_HOME_PAGE_DESC = {
  vi: 'Nền tảng tuyển dụng thông minh cho người nước ngoài tại Nhật Bản. Tìm việc làm kỹ sư, tạo CV chuẩn Nhật bằng AI, theo dõi ứng tuyển minh bạch. Hoàn toàn miễn phí!',
  en: 'A smart recruitment platform for foreign professionals in Japan. Find engineering jobs, build a Japan-ready CV with AI, and track applications transparently.',
  ja: '日本で働く外国人向けのスマート採用プラットフォーム。エンジニア求人検索、AIによる履歴書作成、応募進捗の確認を無料で利用できます。',
};

export const CANDIDATE_MORE_JOBS = {
  vi: { eyebrow: 'Cơ hội khác', text: 'Việc làm trên JobShare. Khám phá tất cả' },
  en: { eyebrow: 'More opportunities', text: 'Jobs on JobShare. Explore all' },
  ja: { eyebrow: 'さらに探す', text: 'JobShareの求人をもっと見る' },
};

export const CANDIDATE_FEATURED_JOBS_EXTRA_COUNT = 481;

export function formatCandidateNewsDate(iso, lang) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (lang === 'vi') return `${d} thg ${m}, ${y}`;
  if (lang === 'ja') return `${y}年${m}月${d}日`;
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m]} ${d}, ${y}`;
}

export function slugFromCandidateNewsItem(item, lang) {
  const url = item.urls?.[lang] || item.urls?.vi || '';
  const match = url.match(/\/blog\/([^/?#]+)/);
  return match ? match[1] : String(item.id);
}
