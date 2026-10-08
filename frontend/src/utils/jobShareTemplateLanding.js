import { resolveApiBaseUrl } from '../services/api';
import {
  localizedPersonaHref,
  resolveCandidatePrefix,
  resolveCollaboratorPrefix,
} from './localeRoutes';

export const JOBSHARE_TEMPLATE_CONFIG = {
  'collaborator-v3': {
    publicBase: '/landing/collaborator-v3',
    indexByLang: { vi: 'index.html', en: 'index-en.html', ja: 'index-ja.html' },
    newsSurface: 'collaborator',
    includeJobs: false,
    chatSessionKey: 'jobshare_v3_chat_session',
    chatVisitorKey: 'jobshare_v3_visitor_name',
    chatOpenEvent: 'jobshare:open-collaborator-chat',
    chatApiPrefix: '/public/ctv-chat',
  },
  'candidate-v1_1': {
    publicBase: '/landing/candidate-v1_1',
    indexByLang: { vi: 'index.html', en: 'index-en.html', ja: 'index-ja.html' },
    newsSurface: 'candidate',
    includeJobs: true,
    chatSessionKey: 'jobshare_candidate_chat_session',
    chatVisitorKey: 'jobshare_candidate_visitor_name',
    chatOpenEvent: 'jobshare:open-candidate-chat',
    chatApiPrefix: '/public/candidate-chat',
  },
};

export function templateIndexFile(language, config) {
  const lang = language === 'en' || language === 'ja' ? language : 'vi';
  return config.indexByLang[lang] || config.indexByLang.vi;
}

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function rewriteWsJobShareUrl(href, { language, pathname }) {
  if (!href || typeof href !== 'string') return href;
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return href;

  const collabPrefix = resolveCollaboratorPrefix(pathname);
  const candidatePrefix = resolveCandidatePrefix(pathname);
  const lang = language || 'vi';

  if (/^index(-en|-ja)?\.html$/i.test(href)) return href;

  let url;
  try {
    url = new URL(href, 'https://ws-jobshare.com');
  } catch {
    return href;
  }

  if (url.origin !== 'https://ws-jobshare.com') return href;

  const path = url.pathname.replace(/\/+$/, '') || '/';
  const segments = path.split('/').filter(Boolean);
  const pathLocale = ['vi', 'en', 'ja'].includes(segments[0]) ? segments.shift() : lang;
  const effectiveLang = pathLocale || lang;

  if (path === '/login') return '/login';
  if (path === '/register') return '/register';
  if (path === '/business' || path.startsWith('/business/')) {
    const rest = path.slice('/business'.length) || '';
    return `/${effectiveLang}/business${rest}${url.search}${url.hash}`;
  }

  if (segments[0] === 'candidate') {
    const rest = segments.slice(1).join('/');
    const base = resolveCandidatePrefix(`/${effectiveLang}/candidate`);
    return rest ? `${base}/${rest}${url.search}${url.hash}` : `${base}${url.search}${url.hash}`;
  }

  if (segments[0] === 'jobs') {
    const rest = segments.slice(1).join('/');
    const base = `${collabPrefix}/jobs`;
    return rest ? `${base}/${rest}${url.search}${url.hash}` : `${base}${url.search}${url.hash}`;
  }

  if (segments[0] === 'about-us') return `${collabPrefix}/about-us${url.search}${url.hash}`;
  if (segments[0] === 'blog') {
    const rest = segments.slice(1).join('/');
    const blogBase = `${collabPrefix}/blog`;
    return rest ? `${blogBase}/${rest}${url.search}${url.hash}` : `${blogBase}${url.search}${url.hash}`;
  }

  if (segments.length === 0) {
    return localizedPersonaHref(effectiveLang, 'collaborator') + url.hash;
  }

  return href;
}

export function prepareTemplateHtml(rawHtml, { language, pathname, templateConfig }) {
  const assetBase = templateConfig.publicBase;
  let html = rawHtml;

  html = html.replace(/\s(href|src)="assets\//g, ` $1="${assetBase}/assets/`);
  html = html.replace(/<script[^>]+src="app\.js"[^>]*>\s*<\/script>/gi, '');

  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    const mapped = rewriteWsJobShareUrl(href, { language, pathname });
    if (mapped !== href) a.setAttribute('href', mapped);
  });

  const chatConfigEl = doc.querySelector('#chat-config');
  if (chatConfigEl) {
    let labels = {};
    try {
      labels = JSON.parse(chatConfigEl.textContent || '{}');
    } catch {
      labels = {};
    }
    chatConfigEl.textContent = JSON.stringify({
      ...labels,
      api: resolveApiBaseUrl(),
    });
  }

  return doc.body.innerHTML;
}

export function buildTemplateNewsCard({
  post,
  language,
  assetBase,
  blogPrefix,
  pickTitle,
  pickCategory,
  formatDate,
  detailHref,
}) {
  const title = pickTitle(post, language);
  const href = detailHref(post, blogPrefix);
  const date = formatDate(post, language);
  const category = pickCategory(post, language);
  const imgRaw = post?.coverImageUrl || post?.thumbnailUrl || post?.thumbnail || '';
  const img = imgRaw && String(imgRaw).startsWith('http')
    ? imgRaw
    : imgRaw
      ? imgRaw
      : `${assetBase}/assets/news-1.jpg`;
  const datetime = post?.publishedAt || post?.published_at || '';

  return `<a class="news-card" href="${escapeAttr(href)}" data-news-id="${escapeAttr(post?.id ?? '')}" data-reveal>
<div class="news-image"><img src="${escapeAttr(img)}" alt="${escapeAttr(title)}" loading="lazy" decoding="async"></div>
<div class="news-body"><div class="news-meta"><time datetime="${escapeAttr(datetime)}">${escapeHtml(date)}</time><span>· ${escapeHtml(category)}</span></div><h3>${escapeHtml(title)}</h3></div></a>`;
}

export function buildTemplateJobCard({ job, language, candidatePrefix, salaryText, companyName, jobTitle, employmentLabel }) {
  const id = job?.id ?? '';
  const href = id ? `${candidatePrefix}/jobs/${encodeURIComponent(id)}` : `${candidatePrefix}/jobs`;
  return `<a class="job-card" href="${escapeAttr(href)}" data-reveal>
<div class="job-card-top"><span class="job-company">${escapeHtml(companyName)}</span><span class="job-arrow" aria-hidden="true">→</span></div>
<h3>${escapeHtml(jobTitle)}</h3>
<div class="job-meta"><span class="job-salary">${escapeHtml(salaryText)}</span><span class="job-type">${escapeHtml(employmentLabel)}</span></div></a>`;
}

export function buildTemplateJobMoreCard({ candidatePrefix, extraCount, labels }) {
  const count = Math.max(0, Number(extraCount) || 0);
  return `<a class="job-more-card" href="${escapeAttr(`${candidatePrefix}/jobs`)}" data-reveal aria-label="${escapeAttr(labels.aria)}">
<div class="job-more-top"><span>${escapeHtml(labels.top)}</span><span class="job-more-arrow" aria-hidden="true">↗</span></div>
<strong>+${count}</strong><p>${escapeHtml(labels.body)} <span aria-hidden="true">›</span></p></a>`;
}
