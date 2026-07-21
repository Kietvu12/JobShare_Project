import { useEffect } from 'react';
import { getLandingPageTemplate, getTemplateAssetBase, getTemplateCssFiles } from '../../../constants/landingPageTemplates';

function loadStylesheet(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
  return link;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve(existing);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => resolve(script);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/** Load CSS/JS của template HTML gốc (frontend/template/) */
export function useTemplateAssets(templateKey) {
  const tpl = getLandingPageTemplate(templateKey);
  const assetBase = getTemplateAssetBase(templateKey);

  useEffect(() => {
    const cssLinks = getTemplateCssFiles(tpl.key).map((file) => loadStylesheet(`${assetBase}/${file}`));
    const faLink = loadStylesheet('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css');

    document.body.classList.add('home');
    document.body.style.margin = '0';

    return () => {
      cssLinks.forEach((l) => l.remove());
      faLink.remove();
      document.body.classList.remove('home');
      document.body.style.margin = '';
    };
  }, [assetBase, tpl.key]);

  useEffect(() => {
    let cancelled = false;
    const scripts = [];

    const boot = async () => {
      try {
        await loadScript('https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js');
        if (cancelled) return;
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/protonet-jquery.inview/1.1.2/jquery.inview.min.js');
        if (cancelled) return;
        const inview = await loadScript(`${assetBase}/js/jquery.inview_set.js`);
        scripts.push(inview);
        const main = await loadScript(`${assetBase}/js/main.js`);
        scripts.push(main);
      } catch (e) {
        console.warn('Template scripts load failed:', e);
      }
    };

    boot();

    return () => {
      cancelled = true;
      scripts.forEach((s) => s?.remove());
    };
  }, [assetBase]);
}
