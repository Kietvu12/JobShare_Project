import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncRouterPathname } from '../utils/routerNavigationHistory';

/** Ghi nhớ pathname trước mỗi lần chuyển route (dùng cho restore state danh sách ứng viên). */
export default function RouterNavigationTracker() {
  const location = useLocation();

  useLayoutEffect(() => {
    syncRouterPathname(location.pathname);
  }, [location.pathname]);

  return null;
}
