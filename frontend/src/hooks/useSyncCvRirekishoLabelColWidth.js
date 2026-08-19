import { useLayoutEffect } from 'react';

/** Đo cột nhãn personalGrid (px) → --cv-rirekisho-label-col-px cho các bảng section thẳng hàng. */
export function useSyncCvRirekishoLabelColWidth(bodyRef, deps = []) {
  useLayoutEffect(() => {
    const body = bodyRef?.current;
    if (!body) return undefined;

    const sync = () => {
      const table = body.querySelector('table.cv-personal-grid-v3');
      if (!table) return;
      const labelCell = table.querySelector('tbody tr:nth-child(2) td:first-child');
      if (!labelCell) return;
      const w = labelCell.getBoundingClientRect().width;
      if (w > 4) {
        body.style.setProperty('--cv-rirekisho-label-col-px', `${Math.round(w * 100) / 100}px`);
      }
    };

    sync();
    requestAnimationFrame(sync);

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null;
    ro?.observe(body);
    const table = body.querySelector('table.cv-personal-grid-v3');
    if (table) ro?.observe(table);

    const mo = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => sync())
      : null;
    mo?.observe(body, { childList: true, subtree: true });

    window.addEventListener('resize', sync);
    return () => {
      ro?.disconnect();
      mo?.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, deps);
}
