/* Ready Crew template — iframe bootstrap */
(function () {
  var LANDING_MAP = {
    'index.html': '/landing/business',
    'pages/about.html': '/landing/business/about',
    'pages/services.html': '/landing/business/services',
    'pages/seminar.html': '/landing/business/seminar',
    'pages/news.html': '/landing/business/news',
    'pages/news-detail.html': '/landing/business/news/sample',
  };
  var TEMPLATE_BASE = '/template/jobshare_business_landing/';

  function resolveLandingHref(href) {
    if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) {
      return null;
    }
    if (href.indexOf('/landing/business') === 0 || href.indexOf('/business/') === 0) {
      return null;
    }
    if (href.indexOf('http://') === 0 || href.indexOf('https://') === 0) {
      return null;
    }
    if (href.indexOf(TEMPLATE_BASE) === 0) {
      var rest = href.slice(TEMPLATE_BASE.length);
      return LANDING_MAP[rest] || '/landing/business';
    }
    if (href.indexOf('pages/') === 0) {
      return LANDING_MAP[href] || null;
    }
    if (href === './' || href === '../index.html' || href === 'index.html') {
      return '/landing/business';
    }
    return null;
  }

  document.addEventListener(
    'click',
    function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var targetAttr = (a.getAttribute('target') || '').toLowerCase();
      if (targetAttr !== '_top' && targetAttr !== '_parent') return;
      var landing = resolveLandingHref(a.getAttribute('href'));
      if (!landing) return;
      e.preventDefault();
      window.top.location.href = landing;
    },
    true,
  );

  var initialized = false;
  function init() {
    if (initialized) return;
    initialized = true;
    var loading = document.querySelector('.js-loading');
    if (loading) loading.style.display = 'none';
    document.body.classList.add('is-loaded');
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
  window.addEventListener('load', init, { once: true });
})();
