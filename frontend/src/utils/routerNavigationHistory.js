/** Pathname trước lần điều hướng gần nhất (cập nhật bởi RouterNavigationTracker). */
let previousPathname = '';

export function getPreviousPathname() {
  return previousPathname;
}

export function syncRouterPathname(pathname) {
  const prev = previousPathname;
  previousPathname = pathname;
  return prev;
}

/** Chỉ giữ filter/tìm kiếm danh sách khi quay lại từ trang con hồ sơ (vd. /admin/candidates/123). */
export function shouldRestoreCandidatesListState(basePath) {
  const prev = getPreviousPathname();
  if (!prev || prev === basePath) return false;
  return prev.startsWith(`${basePath}/`);
}
