(function () {
  var RETURN_PATH_KEY = 'wjs_return_path';

  function readReturnPath() {
    try {
      return sessionStorage.getItem(RETURN_PATH_KEY);
    } catch (e) {
      return null;
    }
  }

  function saveReturnPath() {
    try {
      var path = window.location.pathname + window.location.search + window.location.hash;
      if (!path || path === '/index.html') return;
      sessionStorage.setItem(RETURN_PATH_KEY, path);
    } catch (e) {
      /* ignore */
    }
  }

  function clearRecoverState() {
    try {
      localStorage.removeItem('wjs_app_version');
      sessionStorage.removeItem('wjs_app_version_reload');
      sessionStorage.removeItem('wjs_app_version_attempts');
      sessionStorage.removeItem('wjs_deploy_reload');
      sessionStorage.removeItem('wjs_deploy_loaded_version');
      sessionStorage.removeItem('wjs_asset_recover_attempts');
      sessionStorage.removeItem('wjs_asset_recover_lock');
    } catch (e) {
      /* ignore */
    }
  }

  function setRecoverLoading(loading, label) {
    var btn = document.getElementById('wjs-recover-btn') || document.getElementById('wjs-update-reload');
    if (!btn) return;
    btn.disabled = !!loading;
    btn.textContent = loading ? label || 'Đang tải...' : 'Tải lại trang';
  }

  function clearAllCaches() {
    var tasks = [];
    try {
      if ('caches' in window) {
        tasks.push(
          caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (key) { return caches.delete(key); }));
          }),
        );
      }
      if ('serviceWorker' in navigator) {
        tasks.push(
          navigator.serviceWorker.getRegistrations().then(function (regs) {
            return Promise.all(regs.map(function (reg) { return reg.unregister(); }));
          }),
        );
      }
    } catch (e) {
      /* ignore */
    }
    if (!tasks.length) return Promise.resolve();
    return Promise.all(tasks).catch(function () {});
  }

  function fetchFreshShellHtml() {
    var url = window.location.origin + '/index.html?_=' + Date.now();
    return fetch(url, {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        Accept: 'text/html',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    }).then(function (res) {
      if (!res.ok) throw new Error('shell-' + res.status);
      return res.text();
    });
  }

  function extractMainScriptSrc(html) {
    var match = html.match(/<script type="module"[^>]*src="([^"]+)"/i);
    return match ? match[1] : null;
  }

  function verifyAssetExists(src) {
    if (!src) return Promise.resolve(true);
    var url = src.indexOf('http') === 0 ? src : window.location.origin + src;
    return fetch(url, { method: 'HEAD', cache: 'no-store' })
      .then(function (res) { return res.ok; })
      .catch(function () { return false; });
  }

  function applyFreshShell(html) {
    document.open();
    document.write(html);
    document.close();
  }

  function reloadFresh() {
    saveReturnPath();
    clearRecoverState();
    setRecoverLoading(true);

    clearAllCaches()
      .then(fetchFreshShellHtml)
      .then(function (html) {
        var scriptSrc = extractMainScriptSrc(html);
        return verifyAssetExists(scriptSrc).then(function (ok) {
          if (!ok) throw new Error('asset-missing');
          applyFreshShell(html);
        });
      })
      .catch(function () {
        setRecoverLoading(false);
        window.location.replace(
          window.location.origin + '/index.html?_=' + Date.now() + '&r=' + Math.random(),
        );
      });
  }

  function showBootRecoverHint(message) {
    var root = document.getElementById('root');
    if (!root || document.getElementById('wjs-recover-btn')) return;

    root.innerHTML =
      '<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-align:center;padding:48px 20px;color:#333;max-width:420px;margin:0 auto;">' +
      '<p style="font-size:18px;font-weight:600;margin:0 0 12px;">Trang chưa tải được</p>' +
      '<p id="wjs-recover-msg" style="margin:0 0 20px;color:#666;line-height:1.5;">' +
      (message || 'Web vừa cập nhật phiên bản mới. Nhấn bên dưới để tải lại.') +
      '</p>' +
      '<button type="button" id="wjs-recover-btn" style="display:block;width:100%;padding:12px 20px;font-size:16px;cursor:pointer;border-radius:8px;border:1px solid #2563eb;background:#2563eb;color:#fff;margin-bottom:10px;">Tải lại trang</button>' +
      '<a id="wjs-recover-home" href="' + window.location.origin + '/index.html" style="display:block;font-size:14px;color:#2563eb;text-decoration:underline;margin-bottom:8px;">Mở tab mới (index.html)</a>' +
      '<a id="wjs-recover-root" href="' + window.location.origin + '/" style="display:block;font-size:14px;color:#2563eb;text-decoration:underline;">Về trang chủ</a>' +
      '</div>';

    var btn = document.getElementById('wjs-recover-btn');
    if (btn) btn.onclick = reloadFresh;

    var home = document.getElementById('wjs-recover-home');
    if (home) {
      home.onclick = function (ev) {
        ev.preventDefault();
        clearRecoverState();
        window.location.href = window.location.origin + '/index.html?_=' + Date.now();
      };
    }

    var rootLink = document.getElementById('wjs-recover-root');
    if (rootLink) {
      rootLink.onclick = function (ev) {
        ev.preventDefault();
        clearRecoverState();
        try {
          sessionStorage.removeItem(RETURN_PATH_KEY);
        } catch (e) {
          /* ignore */
        }
        window.location.href = window.location.origin + '/?_=' + Date.now();
      };
    }
  }

  function showUpdateBanner() {
    if (document.getElementById('wjs-update-banner')) return;

    var banner = document.createElement('div');
    banner.id = 'wjs-update-banner';
    banner.style.cssText =
      'position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483647;' +
      'background:#1e3a8a;color:#fff;padding:14px 16px;border-radius:10px;' +
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;' +
      'box-shadow:0 8px 24px rgba(0,0,0,.18);display:flex;gap:12px;align-items:center;justify-content:space-between;';
    banner.innerHTML =
      '<span>Đã có phiên bản mới. Nhấn tải lại để cập nhật.</span>' +
      '<button type="button" id="wjs-update-reload" style="flex-shrink:0;padding:8px 14px;border:0;border-radius:8px;background:#fff;color:#1e3a8a;font-weight:600;cursor:pointer;">Tải lại</button>';

    document.body.appendChild(banner);
    var btn = document.getElementById('wjs-update-reload');
    if (btn) btn.onclick = reloadFresh;
  }

  function isAssetUrl(src) {
    if (!src) return false;
    return src.indexOf('/assets/') > -1 || /\.m?js(?:\?|$)/i.test(src) || /\.css(?:\?|$)/i.test(src);
  }

  function isChunkLoadError(message) {
    return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
      message,
    );
  }

  try {
    var returnPath = readReturnPath();
    if (returnPath && returnPath !== '/index.html') {
      sessionStorage.removeItem(RETURN_PATH_KEY);
      window.history.replaceState(null, '', returnPath);
    }
  } catch (e) {
    /* ignore */
  }

  window.__wjsReloadFresh = reloadFresh;
  window.__wjsShowBootRecover = showBootRecoverHint;
  window.__wjsShowUpdateBanner = showUpdateBanner;

  window.addEventListener(
    'error',
    function (ev) {
      var target = ev.target;
      if (!target || !target.tagName) return;
      if (target.tagName !== 'SCRIPT' && target.tagName !== 'LINK') return;
      var src = target.src || target.href || '';
      if (isAssetUrl(src)) showBootRecoverHint();
    },
    true,
  );

  window.addEventListener('unhandledrejection', function (ev) {
    var msg = String((ev.reason && ev.reason.message) || ev.reason || '');
    if (isChunkLoadError(msg)) showBootRecoverHint();
  });

  window.addEventListener('load', function () {
    setTimeout(function () {
      var root = document.getElementById('root');
      if (!root || document.getElementById('wjs-recover-btn')) return;
      if (root.children.length > 0) return;
      showBootRecoverHint();
    }, 8000);
  });
})();
