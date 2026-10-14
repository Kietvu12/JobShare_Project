import { useLayoutEffect, useRef } from 'react';

export const ROLE_BAR_HEIGHT_VAR = '--jobshare-role-bar-height';

/** Đo chiều cao role bar cố định và gán CSS variable cho header sticky. */
export function useRoleBarHeight(enabled = true) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (!enabled) {
      document.documentElement.style.removeProperty(ROLE_BAR_HEIGHT_VAR);
      return undefined;
    }

    const el = ref.current;
    if (!el) return undefined;

    const sync = () => {
      document.documentElement.style.setProperty(ROLE_BAR_HEIGHT_VAR, `${el.offsetHeight}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    window.addEventListener('resize', sync);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', sync);
      document.documentElement.style.removeProperty(ROLE_BAR_HEIGHT_VAR);
    };
  }, [enabled]);

  return ref;
}
