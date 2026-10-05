import { useEffect, useRef } from 'react';
import './jobshare-home-v2.css';
import './jobshare-home-v2.js';

/**
 * Mount inside the existing JobShare Business layout.
 * html should be one of content-ja.html / content-en.html / content-vi.html.
 * The fragments intentionally do not include site header/footer or locale switcher.
 */
export default function JobShareHomeV2({ html, routes }) {
  const container = useRef(null);
  useEffect(() => {
    const root = container.current?.querySelector('.jsb-v2');
    return window.initJobShareHomeV2?.(root, { routes });
  }, [html, routes]);
  return <div ref={container} dangerouslySetInnerHTML={{ __html: html }} />;
}
