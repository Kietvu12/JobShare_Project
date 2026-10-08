/**
 * Template landing interactions (from JobShare V3 / Candidate V1.1 app.js) with cleanup for SPA.
 */
export function attachJobShareTemplateBehavior(root, templateConfig) {
  if (!root) return () => {};

  const disposers = [];
  const on = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    disposers.push(() => target.removeEventListener(type, handler, options));
  };

  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof IntersectionObserver !== 'undefined' && !reduced) {
    document.body.classList.add('motion');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.05 },
    );
    root.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    disposers.push(() => observer.disconnect());
  }

  const toggle = root.querySelector('.menu-btn');
  const nav = root.querySelector('.nav');
  function closeMenu() {
    if (nav) nav.classList.remove('open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle && nav) {
    on(toggle, 'click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('open', !open);
    });
    on(nav, 'click', (e) => {
      if (e.target.closest('a')) closeMenu();
    });
    on(document, 'click', (e) => {
      if (!e.target.closest('.site-header')) closeMenu();
    });
  }

  const up = root.querySelector('.back-top');
  function updateBackTop() {
    if (up) up.classList.toggle('show', window.scrollY > 650);
  }
  if (up) {
    on(window, 'scroll', updateBackTop, { passive: true });
    updateBackTop();
  }

  const contact = root.querySelector('.contact-dialog');
  const policy = root.querySelector('.policy-dialog');
  root.querySelectorAll('[data-action=contact]').forEach((b) => {
    on(b, 'click', () => contact?.showModal?.());
  });
  root.querySelectorAll('[data-action=policy]').forEach((b) => {
    on(b, 'click', () => policy?.showModal?.());
  });
  for (const dialog of [contact, policy]) {
    if (!dialog) continue;
    on(dialog, 'click', (e) => {
      if (e.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
      }
    });
  }

  const launcher = root.querySelector('.support-launcher');
  const panel = root.querySelector('.support-panel');
  const closeBtn = root.querySelector('.support-close');
  const home = root.querySelector('#support-home');
  const messages = root.querySelector('#support-messages');
  const tabs = [...root.querySelectorAll('.support-tabs [role=tab]')];
  const configEl = root.querySelector('#chat-config');
  const form = root.querySelector('#support-form');
  const input = root.querySelector('#chat-body');
  const nameInput = root.querySelector('#visitor-name');
  const send = form?.querySelector('button');
  const error = root.querySelector('.chat-error');
  const history = root.querySelector('.chat-history');

  let config = {};
  try {
    config = JSON.parse(configEl?.textContent || '{}');
  } catch {
    config = {};
  }

  let session = '';
  let stream = null;
  let busy = false;
  let chatMessages = [];
  let priorFocus = null;

  try {
    session = sessionStorage.getItem(templateConfig.chatSessionKey) || '';
    if (nameInput) nameInput.value = sessionStorage.getItem(templateConfig.chatVisitorKey) || '';
  } catch {
    /* ignore */
  }

  function closeStream() {
    if (stream) {
      stream.close();
      stream = null;
    }
  }

  function renderChat() {
    if (!history) return;
    history.replaceChildren();
    for (const m of chatMessages) {
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble${m.senderType === 'visitor' ? ' visitor' : ''}`;
      bubble.textContent = m.body || '';
      if (m.createdAt || m.created_at) {
        const time = document.createElement('small');
        time.textContent = new Date(m.createdAt || m.created_at).toLocaleTimeString(document.documentElement.lang, {
          hour: '2-digit',
          minute: '2-digit',
        });
        bubble.append(time);
      }
      history.append(bubble);
    }
    history.scrollTop = history.scrollHeight;
    if (session && send) {
      send.textContent = config.send || 'Send';
      root.querySelector('.name-label')?.setAttribute('hidden', '');
      root.querySelector('.chat-hint')?.setAttribute('hidden', '');
    }
  }

  async function chatApi(path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const r = await fetch(`${config.api}${path}`, {
        ...options,
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      });
      const data = await r.json();
      if (!r.ok || !data.success) throw new Error(data.message || 'Request failed');
      return data.data;
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadMessages() {
    const data = await chatApi(`${templateConfig.chatApiPrefix}/messages?${new URLSearchParams({ sessionToken: session })}`);
    chatMessages = data.messages || [];
    renderChat();
  }

  function startStream() {
    closeStream();
    if (!panel || panel.hidden || !session) return;
    stream = new EventSource(`${config.api}${templateConfig.chatApiPrefix}/stream?${new URLSearchParams({ sessionToken: session })}`);
    stream.addEventListener('chat', (e) => {
      try {
        const v = JSON.parse(e.data);
        if (v.type === 'message' && v.message) {
          const ix = chatMessages.findIndex((m) => m.id === v.message.id);
          if (ix < 0) chatMessages.push(v.message);
          else chatMessages[ix] = v.message;
          renderChat();
        }
      } catch {
        /* ignore */
      }
    });
  }

  function setTab(which) {
    const isMessages = which === 'messages';
    if (home) home.hidden = isMessages;
    if (messages) messages.hidden = !isMessages;
    tabs.forEach((t, i) => {
      t.setAttribute('aria-selected', String(i === (isMessages ? 1 : 0)));
      t.tabIndex = i === (isMessages ? 1 : 0) ? 0 : -1;
    });
    if (isMessages && session) {
      loadMessages().then(startStream).catch(() => {
        if (error) error.hidden = false;
      });
    }
  }

  function openChat(which = 'home') {
    closeMenu();
    priorFocus = document.activeElement;
    if (panel) panel.hidden = false;
    launcher?.setAttribute('aria-expanded', 'true');
    setTab(which);
    closeBtn?.focus();
  }

  function closeChat() {
    if (panel) panel.hidden = true;
    launcher?.setAttribute('aria-expanded', 'false');
    closeStream();
    (priorFocus || launcher)?.focus();
  }

  if (launcher && panel) {
    on(launcher, 'click', () => (panel.hidden ? openChat() : closeChat()));
    closeBtn && on(closeBtn, 'click', closeChat);
    tabs.forEach((t, i) => on(t, 'click', () => setTab(i === 0 ? 'home' : 'messages')));
    const tablist = root.querySelector('.support-tabs');
    if (tablist) {
      on(tablist, 'keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const i = tabs.indexOf(document.activeElement) === 0 ? 1 : 0;
          setTab(i ? 'messages' : 'home');
          tabs[i]?.focus();
        }
      });
    }
    const onOpenChat = (e) => openChat(e.detail?.tab || 'home');
    on(window, templateConfig.chatOpenEvent, onOpenChat);
    disposers.push(() => window.removeEventListener(templateConfig.chatOpenEvent, onOpenChat));
  }

  if (form && input && send) {
    on(form, 'submit', async (e) => {
      e.preventDefault();
      if (busy || !input.value.trim()) return;
      busy = true;
      send.disabled = true;
      send.textContent = config.connecting || '…';
      if (error) error.hidden = true;
      try {
        if (!session) {
          const data = await chatApi(`${templateConfig.chatApiPrefix}/sessions`, {
            method: 'POST',
            body: JSON.stringify({ visitorLabel: nameInput?.value?.trim() || undefined }),
          });
          if (!data.sessionToken) throw new Error('No session');
          session = data.sessionToken;
          try {
            sessionStorage.setItem(templateConfig.chatSessionKey, session);
            sessionStorage.setItem(templateConfig.chatVisitorKey, nameInput?.value?.trim() || '');
          } catch {
            /* ignore */
          }
        }
        const sent = await chatApi(`${templateConfig.chatApiPrefix}/messages`, {
          method: 'POST',
          body: JSON.stringify({ sessionToken: session, body: input.value.trim() }),
        });
        if (sent.message) {
          chatMessages.push(sent.message);
          renderChat();
        }
        input.value = '';
        await loadMessages();
        startStream();
        input.focus();
      } catch {
        if (error) error.hidden = false;
      } finally {
        busy = false;
        send.disabled = false;
        send.textContent = session ? (config.send || 'Send') : (config.start || 'Start');
      }
    });
  }

  on(document, 'keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
      if (panel && !panel.hidden && !contact?.open && !policy?.open) closeChat();
    }
  });
  on(window, 'pagehide', closeStream);

  const controls = root.querySelector('.floating-controls');
  if (controls) {
    let queued = false;
    function avoidOverlap() {
      const r = controls.getBoundingClientRect();
      const base = innerWidth <= 720 ? 12 : 20;
      let y = innerHeight - base - r.height;
      const x = r.left;
      if (panel?.hidden) {
        const targets = [...root.querySelectorAll('main h1,main h2,main h3,main .actions,.nav.open,.roles')]
          .map((el) => el.getBoundingClientRect())
          .filter((t) => t.width && t.bottom > 0 && t.top < innerHeight && t.right > x && t.left < r.right);
        for (let i = 0; i < 8; i += 1) {
          const hit = targets.find((t) => t.top < y + r.height && t.bottom > y);
          if (!hit) break;
          y = hit.top - r.height - 10;
        }
      }
      controls.style.bottom = `${Math.max(base, Math.min(innerHeight - r.height - 100, innerHeight - y - r.height))}px`;
    }
    function scheduleAvoid() {
      if (!queued) {
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          avoidOverlap();
        });
      }
    }
    on(window, 'scroll', scheduleAvoid, { passive: true });
    on(window, 'resize', scheduleAvoid);
    document.fonts?.ready?.then(scheduleAvoid);
    scheduleAvoid();
  }

  return () => {
    closeStream();
    closeMenu();
    disposers.forEach((fn) => fn());
    document.body.classList.remove('motion');
  };
}
