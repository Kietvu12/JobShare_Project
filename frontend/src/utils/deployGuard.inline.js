(function () {
  var SK = 'wjs_app_version';
  var RK = 'wjs_app_version_reload';

  function reload(v) {
    try {
      var flag = sessionStorage.getItem(RK);
      if (flag === v) {
        sessionStorage.removeItem(RK);
        localStorage.setItem(SK, v);
        return;
      }
      sessionStorage.setItem(RK, v);
      localStorage.setItem(SK, v);
    } catch (e) {
      /* ignore */
    }
    var url = new URL(window.location.href);
    url.searchParams.set('_v', v || String(Date.now()));
    window.location.replace(url.toString());
  }

  var meta = document.querySelector('meta[name="app-build-id"]');
  var embedded = meta && meta.getAttribute('content');
  var stored = null;
  try {
    stored = localStorage.getItem(SK);
  } catch (e) {
    /* ignore */
  }

  if (embedded && stored && stored !== embedded) {
    reload(embedded);
    return;
  }
  if (embedded && !stored) {
    try {
      localStorage.setItem(SK, embedded);
    } catch (e) {
      /* ignore */
    }
  }

  window.addEventListener(
    'error',
    function (ev) {
      var target = ev.target;
      if (!target || !target.tagName) return;
      if (target.tagName !== 'SCRIPT' && target.tagName !== 'LINK') return;
      var src = target.src || target.href || '';
      if (src.indexOf('/assets/') > -1 || /\.m?js(?:\?|$)/i.test(src)) {
        reload(String(Date.now()));
      }
    },
    true,
  );

  fetch('/version.json?_=' + Date.now(), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
    .then(function (res) {
      return res.ok ? res.json() : null;
    })
    .then(function (data) {
      var remote = data && data.version ? String(data.version) : null;
      if (!remote) return;
      if (stored && stored !== remote) {
        reload(remote);
        return;
      }
      if (embedded && embedded !== remote) {
        reload(remote);
        return;
      }
      if (!stored) {
        try {
          localStorage.setItem(SK, remote);
        } catch (e) {
          /* ignore */
        }
      }
    })
    .catch(function () {
      /* ignore network errors */
    });
})();
