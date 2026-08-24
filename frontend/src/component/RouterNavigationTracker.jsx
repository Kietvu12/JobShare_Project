import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncRouterPathname } from '../utils/routerNavigationHistory';
import { capturePageAttribution, syncAttributionToAddressBar } from '../utils/utmTracking';

/** Ghi nhớ pathname trước mỗi lần chuyển route (dùng cho restore state danh sách ứng viên). */
export default function RouterNavigationTracker() {
  const location = useLocation();

  useLayoutEffect(() => {
    syncRouterPathname(location.pathname);
    capturePageAttribution({
      search: location.search,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    });
    syncAttributionToAddressBar(location.pathname, location.search, location.hash);
  }, [location.pathname, location.search, location.hash]);

  return null;
}
