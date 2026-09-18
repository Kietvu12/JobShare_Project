/** Knowledge Hub page — VI / EN / JA */

function resolveLang(language) {
  if (language === 'en' || language === 'ja') return language;
  return 'vi';
}

/** Danh mục Knowledge Hub (slug seed) — API chỉ trả name tiếng Việt */
const KNOWLEDGE_CATEGORY_BY_SLUG = {
  'tuyen-dung': {
    vi: 'Tuyển dụng',
    en: 'Recruitment',
    ja: '採用',
  },
  'quan-tri-nhan-su': {
    vi: 'Quản trị nhân sự',
    en: 'HR management',
    ja: '人事管理',
  },
  'phat-trien-doi-ngu': {
    vi: 'Phát triển đội ngũ',
    en: 'Team development',
    ja: 'チーム育成',
  },
  'phap-ly-tuan-thu': {
    vi: 'Pháp lý & tuân thủ',
    en: 'Legal & compliance',
    ja: '法務・コンプライアンス',
  },
  'ky-nang-nghe-nghiep': {
    vi: 'Kỹ năng nghề nghiệp',
    en: 'Career skills',
    ja: 'キャリアスキル',
  },
  khac: {
    vi: 'Khác',
    en: 'Other',
    ja: 'その他',
  },
};

export const KNOWLEDGE_HUB_CATEGORY_SLUGS = Object.keys(KNOWLEDGE_CATEGORY_BY_SLUG);

export function getKnowledgeHubCategoryLabel(categoryOrSlug, language = 'vi') {
  const lang = resolveLang(language);
  const slug =
    typeof categoryOrSlug === 'string'
      ? categoryOrSlug
      : String(categoryOrSlug?.slug || '').trim();
  const row = KNOWLEDGE_CATEGORY_BY_SLUG[slug];
  if (row) return row[lang] || row.vi;
  if (categoryOrSlug && typeof categoryOrSlug === 'object') {
    return categoryOrSlug.name || '';
  }
  return '';
}

export const knowledgeHubI18n = {
  vi: {
    breadcrumb: {
      home: 'Trang chủ',
      current: 'Knowledge Hub',
    },
    pageTitle: 'Knowledge Hub',
    pageSubtitle: 'Bài viết, hướng dẫn và mẫu tài liệu HR',
    searchPlaceholder: 'Tìm bài viết, hướng dẫn, mẫu tài liệu...',
    filterAll: 'Tất cả',
    allTopics: 'Tất cả chủ đề',
    loadingCategories: 'Đang tải danh mục...',
    loadingPosts: 'Đang tải bài viết...',
    loadPostsError: 'Không tải được danh sách bài viết.',
    loadArticleError: 'Không tải được bài viết.',
    articleNotFound: 'Không tìm thấy bài viết.',
    backToHub: 'Về Knowledge Hub',
    viewAll: 'Xem tất cả',
    readMore: 'Đọc thêm',
    minRead: (n) => `${n} phút đọc`,
    views: (n) => `${n} lượt xem`,
    noPosts: 'Chưa có bài viết phù hợp.',
    featured: 'Nổi bật',
    sectionFeatured: 'Bài viết nổi bật',
    sectionLatest: 'Mới cập nhật',
    searchResults: 'Kết quả tìm kiếm',
    defaultArticle: 'Bài viết',
    mostRead: 'Đọc nhiều',
    sidebarEmpty: 'Chưa có dữ liệu.',
    hubImagePlaceholder: 'Knowledge Hub',
    latestArticles: 'Bài viết mới',
    recommendations: 'Gợi ý cho bạn',
    templates: 'Mẫu tài liệu',
    recentPosts: 'Bài viết gần đây',
    contentPending: 'Nội dung đang được cập nhật.',
    topicsLabel: 'Chủ đề',
    relatedArticles: 'Bài viết liên quan',
    tableOfContents: 'Mục lục',
    relatedTopic: 'Chủ đề liên quan',
    defaultAuthor: 'Ban biên tập Work Station',
    wsSupport: 'Hỗ trợ từ Work Station',
    wsSupportDesc: 'Cần tư vấn thêm? Liên hệ WS qua tin nhắn.',
    wsSupportCta: 'Nhắn tin WS',
  },
  en: {
    breadcrumb: {
      home: 'Home',
      current: 'Knowledge Hub',
    },
    pageTitle: 'Knowledge Hub',
    pageSubtitle: 'Articles, guides, and HR document templates',
    searchPlaceholder: 'Search articles, guides, templates...',
    filterAll: 'All',
    allTopics: 'All topics',
    loadingCategories: 'Loading categories...',
    loadingPosts: 'Loading articles...',
    loadPostsError: 'Could not load articles.',
    loadArticleError: 'Could not load the article.',
    articleNotFound: 'Article not found.',
    backToHub: 'Back to Knowledge Hub',
    viewAll: 'View all',
    readMore: 'Read more',
    minRead: (n) => `${n} min read`,
    views: (n) => `${n} views`,
    noPosts: 'No matching articles yet.',
    featured: 'Featured',
    sectionFeatured: 'Featured articles',
    sectionLatest: 'Recently updated',
    searchResults: 'Search results',
    defaultArticle: 'Article',
    mostRead: 'Most read',
    sidebarEmpty: 'No data yet.',
    hubImagePlaceholder: 'Knowledge Hub',
    latestArticles: 'Latest articles',
    recommendations: 'Recommended for you',
    templates: 'Templates',
    recentPosts: 'Recent posts',
    contentPending: 'Content is being updated.',
    topicsLabel: 'Topics',
    relatedArticles: 'Related articles',
    tableOfContents: 'Table of contents',
    relatedTopic: 'Related topic',
    defaultAuthor: 'Work Station Editorial',
    wsSupport: 'Work Station support',
    wsSupportDesc: 'Need more help? Message WS directly.',
    wsSupportCta: 'Message WS',
  },
  ja: {
    breadcrumb: {
      home: 'ホーム',
      current: 'ナレッジハブ',
    },
    pageTitle: 'ナレッジハブ',
    pageSubtitle: '記事・ガイド・HRテンプレート',
    searchPlaceholder: '記事、ガイド、テンプレートを検索...',
    filterAll: 'すべて',
    allTopics: 'すべてのトピック',
    loadingCategories: 'カテゴリを読み込み中...',
    loadingPosts: '記事を読み込み中...',
    loadPostsError: '記事一覧を読み込めませんでした。',
    loadArticleError: '記事を読み込めませんでした。',
    articleNotFound: '記事が見つかりません。',
    backToHub: 'ナレッジハブに戻る',
    viewAll: 'すべて見る',
    readMore: '続きを読む',
    minRead: (n) => `${n}分で読める`,
    views: (n) => `${n}回閲覧`,
    noPosts: '該当する記事がありません。',
    featured: '注目',
    sectionFeatured: '注目記事',
    sectionLatest: '最近の更新',
    searchResults: '検索結果',
    defaultArticle: '記事',
    mostRead: 'よく読まれている',
    sidebarEmpty: 'データがありません。',
    hubImagePlaceholder: 'ナレッジハブ',
    latestArticles: '新着記事',
    recommendations: 'おすすめ',
    templates: 'テンプレート',
    recentPosts: '最近の記事',
    contentPending: 'コンテンツを更新中です。',
    topicsLabel: 'トピック',
    relatedArticles: '関連記事',
    tableOfContents: '目次',
    relatedTopic: '関連トピック',
    defaultAuthor: 'Work Station 編集部',
    wsSupport: 'Work Stationサポート',
    wsSupportDesc: 'ご相談はWSへメッセージをお送りください。',
    wsSupportCta: 'WSにメッセージ',
  },
};

export function getKnowledgeHubCopy(language = 'vi') {
  return knowledgeHubI18n[resolveLang(language)] || knowledgeHubI18n.vi;
}

/** Nhãn danh mục trên thẻ bài — ưu tiên slug Knowledge Hub */
export function pickKnowledgePostCategoryLabel(post, language = 'vi', fallback) {
  const copy = getKnowledgeHubCopy(language);
  const fb = fallback !== undefined ? fallback : copy.defaultArticle;
  const category = post?.category;
  if (!category) return fb;
  const fromSlug = getKnowledgeHubCategoryLabel(category, language);
  if (fromSlug) return fromSlug;
  return category.name || fb;
}
