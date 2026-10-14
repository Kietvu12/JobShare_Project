export const BLOGS_LIST_COPY = {
  vi: {
    pageTitle: 'Blog | JobShare',
    latestPost: 'Bài viết mới',
    morePosts: 'Khám phá thêm',
    allPosts: 'Tất cả bài viết',
    minRead: 'phút đọc',
    empty: 'Chưa có bài viết nào.',
    error: 'Không tải được danh sách bài viết.',
    loading: 'Đang tải…',
    retry: 'Thử lại',
    prev: 'Trước',
    next: 'Sau',
    categoryFallback: 'Tin tức',
  },
  en: {
    pageTitle: 'Blog | JobShare',
    latestPost: 'Latest post',
    morePosts: 'Founders corner',
    allPosts: 'All articles',
    minRead: 'min read',
    empty: 'No posts yet.',
    error: 'Could not load posts.',
    loading: 'Loading…',
    retry: 'Try again',
    prev: 'Previous',
    next: 'Next',
    categoryFallback: 'News',
  },
  ja: {
    pageTitle: 'ブログ | JobShare',
    latestPost: '最新記事',
    morePosts: 'ピックアップ',
    allPosts: '記事一覧',
    minRead: '分',
    empty: '記事がありません。',
    error: '記事一覧を取得できませんでした。',
    loading: '読み込み中…',
    retry: '再試行',
    prev: '前へ',
    next: '次へ',
    categoryFallback: 'ニュース',
  },
};

export function blogsListCopy(lang) {
  return BLOGS_LIST_COPY[lang] || BLOGS_LIST_COPY.vi;
}

/**
 * Trang 1 — đúng 3 vùng mẫu (không trùng bài):
 * 1) Featured + Latest (tối đa 4 bài sidebar)
 * 2) Founders corner (các bài còn lại trên trang)
 * Trang 2+: chỉ lưới + phân trang.
 */
export function partitionBlogPosts(posts, page) {
  if (page > 1) {
    return {
      featured: null,
      latest: [],
      grid: posts,
      showHeroRow: false,
    };
  }

  if (!posts.length) {
    return { featured: null, latest: [], grid: [], showHeroRow: false };
  }

  const featured = posts[0];
  const rest = posts.slice(1);

  if (!rest.length) {
    return { featured, latest: [], grid: [], showHeroRow: true };
  }

  let latest = rest.slice(0, 4);
  let grid = rest.slice(4);

  // Đủ bài thì luôn có khối Founders (ít nhất 1 thẻ), không “nuốt” hết vào sidebar
  if (grid.length === 0 && rest.length >= 2) {
    const latestCount = Math.min(4, Math.max(1, rest.length - 1));
    latest = rest.slice(0, latestCount);
    grid = rest.slice(latestCount);
  }

  return {
    featured,
    latest,
    grid,
    showHeroRow: true,
  };
}
