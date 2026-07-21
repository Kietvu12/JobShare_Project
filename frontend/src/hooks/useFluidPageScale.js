import { useEffect, useRef, useState } from 'react';

/** Chiều rộng nội dung tham chiếu (đã trừ sidebar) tương ứng scale = 1 */
const REFERENCE_WIDTH = 1120;
const MIN_SCALE = 0.68;
const MAX_SCALE = 1.08;
/** Dưới ngưỡng này: tab Form/Preview, 1 cột */
const NARROW_WIDTH = 1080;

function computeScale(width) {
  if (!width || width <= 0) return 1;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, width / REFERENCE_WIDTH));
}

/**
 * Scale UI theo chiều rộng vùng nội dung (ResizeObserver).
 * zoom trên Chromium; transform + width bù trên Firefox.
 */
export function useFluidPageScale() {
  const hostRef = useRef(null);
  const [state, setState] = useState({
    scale: 1,
    contentWidth: REFERENCE_WIDTH,
    isNarrow: false,
  });

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;

    const update = (width) => {
      const contentWidth = width ?? node.clientWidth ?? REFERENCE_WIDTH;
      const scale = computeScale(contentWidth);
      setState({
        scale,
        contentWidth,
        isNarrow: contentWidth < NARROW_WIDTH,
      });
    };

    update(node.clientWidth);

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w != null) update(w);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const supportsZoom = typeof CSS !== 'undefined' && CSS.supports?.('zoom', '1');

  const fluidStyle = supportsZoom
    ? { zoom: state.scale, width: '100%' }
    : {
        transform: `scale(${state.scale})`,
        transformOrigin: 'top left',
        width: `${100 / state.scale}%`,
      };

  return {
    hostRef,
    scale: state.scale,
    contentWidth: state.contentWidth,
    isNarrow: state.isNarrow,
    fluidStyle,
  };
}

export default useFluidPageScale;
