export const homeNewsI18n = {
  vi: {
    heading: 'Tin tức',
    pageTitle: 'Tin tức | JobShare for Business',
    viewAll: 'Xem tất cả tin tức',
    tabAll: 'Tất cả',
    empty: 'Chưa có bài viết.',
    categoryFallback: 'Tin tức',
    paginationAria: 'Phân trang bài viết',
    paginationScreenReader: 'Phân trang bài viết',
  },
  en: {
    heading: 'News',
    pageTitle: 'News | JobShare for Business',
    viewAll: 'View all news',
    tabAll: 'ALL',
    empty: 'No articles yet.',
    categoryFallback: 'News',
    paginationAria: 'Article pagination',
    paginationScreenReader: 'Article pagination',
  },
  ja: {
    heading: 'お知らせ',
    pageTitle: 'お知らせ | JobShare for Business',
    viewAll: 'お知らせ一覧',
    tabAll: 'ALL',
    empty: '現在、お知らせはありません。',
    categoryFallback: 'ニュース',
    paginationAria: '投稿のページ送り',
    paginationScreenReader: '投稿のページ送り',
  },
};

export function getHomeNewsCopy(language) {
  return homeNewsI18n[language] || homeNewsI18n.ja;
}
