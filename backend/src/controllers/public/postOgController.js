import { buildPostOgMeta } from '../../services/postPublicService.js';
import { getDefaultOgImageUrl } from '../../utils/publicShareUrls.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderOgHtml({ title, description, shareImageUrl, canonicalUrl }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const img = escapeHtml(shareImageUrl || getDefaultOgImageUrl());
  const url = escapeHtml(canonicalUrl);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${t}</title>
  ${d ? `<meta name="description" content="${d}" />` : ''}
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Workstation JobShare" />
  <meta property="og:title" content="${t}" />
  ${d ? `<meta property="og:description" content="${d}" />` : ''}
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:image:secure_url" content="${img}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  ${d ? `<meta name="twitter:description" content="${d}" />` : ''}
  <meta name="twitter:image" content="${img}" />
  <link rel="canonical" href="${url}" />
  <meta http-equiv="refresh" content="0;url=${url}" />
</head>
<body>
  <p>Đang chuyển tới <a href="${url}">${t}</a>...</p>
  <script>window.location.replace(${JSON.stringify(canonicalUrl)});</script>
</body>
</html>`;
}

async function renderPostOgPage(req, res, surface) {
  try {
    const { lang, slug } = req.params;
    const meta = await buildPostOgMeta({ slug, lang, surface });
    if (!meta) {
      return res.status(404).send('Post not found');
    }
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=300');
    return res.send(renderOgHtml(meta));
  } catch (err) {
    return res.status(500).send('Error rendering preview');
  }
}

export const postOgController = {
  renderCollaboratorBlog: (req, res) => renderPostOgPage(req, res, 'collaborator'),
  renderCandidateBlog: (req, res) => renderPostOgPage(req, res, 'candidate'),
};
