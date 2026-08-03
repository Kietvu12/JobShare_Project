/** Pathname trước lần điều hướng gần nhất (cập nhật bởi RouterNavigationTracker). */
let previousPathname = '';

export const CANDIDATES_LIST_STORAGE_PREFIX = 'wsj_candidates_list_v1';

export const RESET_CANDIDATES_LIST_LOCATION_STATE = { resetCandidatesList: true };

export function clearCandidatesListSession(variant) {
  try {
    sessionStorage.removeItem(`${CANDIDATES_LIST_STORAGE_PREFIX}_${variant}`);
  } catch {
    // ignore
  }
}

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
