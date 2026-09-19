/** Đưa viewport và các vùng scroll layout (main, …) về đầu sau khi chuyển trang. */
export function scrollAppToTop() {
  if (typeof window === 'undefined') return;

  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  } catch {
    window.scrollTo(0, 0);
  }

  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const root = document.getElementById('root');
  if (root) root.scrollTop = 0;

  document.querySelectorAll('main').forEach((el) => {
    el.scrollTop = 0;
  });
}
