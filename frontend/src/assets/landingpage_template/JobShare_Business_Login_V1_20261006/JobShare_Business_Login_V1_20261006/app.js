(() => {
  'use strict';

  const API_BASE = 'https://ws-jobshare.com/api_jobshare/api';
  const AUTH_KEY = 'businessjs_auth';
  const ENDPOINTS = {
    login: '/business/auth/login',
    forgot: '/business/auth/forgot-password'
  };
  const COPY = {
    vi: {
      back: 'Quay lại Business Home',
      kicker: 'JOBSHARE BUSINESS',
      title: 'Đăng nhập doanh nghiệp',
      pageTitle: 'Đăng nhập doanh nghiệp | JobShare Business',
      email: 'Email',
      password: 'Mật khẩu',
      login: 'Đăng nhập',
      loggingIn: 'Đang đăng nhập...',
      forgot: 'Quên mật khẩu? Nhấn vào đây',
      register: 'Đăng ký doanh nghiệp mới? Nhấn vào đây',
      failed: 'Đăng nhập thất bại. Vui lòng thử lại.',
      failedCheck: 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.',
      required: 'Vui lòng nhập đầy đủ email và mật khẩu',
      forgotTitle: 'Quên mật khẩu',
      forgotDesc: 'Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.',
      sendReset: 'Gửi liên kết đặt lại',
      sending: 'Đang gửi...',
      backLogin: 'Quay lại đăng nhập',
      showPassword: 'Hiển thị mật khẩu',
      hidePassword: 'Ẩn mật khẩu',
      home: '/vi/business',
      registerHref: '/vi/business/register'
    },
    en: {
      back: 'Back to Business Home',
      kicker: 'JOBSHARE BUSINESS',
      title: 'Business Sign In',
      pageTitle: 'Business Sign In | JobShare Business',
      email: 'Email',
      password: 'Password',
      login: 'Sign In',
      loggingIn: 'Signing in...',
      forgot: 'Forgot password? Click here',
      register: 'New business registration? Click here',
      failed: 'Sign in failed. Please try again.',
      failedCheck: 'Sign in failed. Please check your information.',
      required: 'Please enter email and password',
      forgotTitle: 'Forgot Password',
      forgotDesc: 'Enter your registered email to receive a password reset link.',
      sendReset: 'Send Reset Link',
      sending: 'Sending...',
      backLogin: 'Back to Sign In',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      home: '/en/business',
      registerHref: '/en/business/register'
    },
    ja: {
      back: 'Business Homeに戻る',
      kicker: 'JOBSHARE BUSINESS',
      title: '企業ログイン',
      pageTitle: '企業ログイン | JobShare Business',
      email: 'メールアドレス',
      password: 'パスワード',
      login: 'ログイン',
      loggingIn: 'ログイン中...',
      forgot: 'パスワードをお忘れですか？ここをクリック',
      register: '新規企業登録はこちら',
      failed: 'ログインに失敗しました。もう一度お試しください。',
      failedCheck: 'ログインに失敗しました。情報を確認してください。',
      required: 'メールアドレスとパスワードを入力してください',
      forgotTitle: 'パスワードをお忘れの場合',
      forgotDesc: '登録したメールアドレスを入力して、パスワードリセットリンクを受け取ってください。',
      sendReset: 'リセットリンクを送信',
      sending: '送信中...',
      backLogin: 'ログインに戻る',
      showPassword: 'パスワードを表示',
      hidePassword: 'パスワードを非表示',
      home: '/ja/business',
      registerHref: '/ja/business/register'
    }
  };

  const root = document.documentElement;
  const initialLang = root.dataset.initialLang;
  let lang = ['vi','en','ja'].includes(initialLang) ? initialLang : 'vi';
  let mode = 'login';
  let busy = false;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const loginForm = $('#login-form');
  const forgotForm = $('#forgot-form');
  const loginView = $('#login-view');
  const forgotView = $('#forgot-view');
  const forgotSuccess = $('#forgot-success');
  const loginAlert = $('#login-alert');
  const forgotAlert = $('#forgot-alert');
  const passwordInput = $('#password');
  const togglePassword = $('#password-toggle');
  const loginSubmit = $('#login-submit');
  const forgotSubmit = $('#forgot-submit');

  function t(key){ return COPY[lang][key] || COPY.vi[key] || key; }
  function setText(selector, key){ const el = $(selector); if (el) el.textContent = t(key); }

  function applyLanguage(next){
    if (!COPY[next]) return;
    lang = next;
    root.lang = next;
    document.title = t('pageTitle');
    try { localStorage.setItem('language', next); } catch (_) {}
    $$('.languages button').forEach(btn => btn.setAttribute('aria-current', String(btn.dataset.lang === next)));
    setText('#back-label','back');
    setText('#login-kicker','kicker');
    setText('#login-title','title');
    setText('#email-label','email');
    setText('#password-label','password');
    setText('#forgot-link','forgot');
    setText('#register-link','register');
    setText('#forgot-title','forgotTitle');
    setText('#forgot-description','forgotDesc');
    setText('#forgot-email-label','email');
    setText('#back-login','backLogin');
    setText('#success-back-login .btn-label','backLogin');
    $('#back-link').setAttribute('aria-label', t('back'));
    $('#back-link').setAttribute('href', t('home'));
    $('#register-link').setAttribute('href', t('registerHref'));
    passwordInput.placeholder = t('password');
    $('#email').placeholder = 'Email';
    $('#forgot-email').placeholder = 'Email';
    togglePassword.setAttribute('aria-label', passwordInput.type === 'password' ? t('showPassword') : t('hidePassword'));
    if (!busy) {
      loginSubmit.querySelector('.btn-label').textContent = t('login');
      forgotSubmit.querySelector('.btn-label').textContent = t('sendReset');
    }
    if (forgotSuccess.hidden === false) $('#forgot-success-copy').textContent = t('forgotDesc');
    clearAlerts();
  }

  function clearAlerts(){ [loginAlert, forgotAlert].forEach(el => { el.hidden = true; el.querySelector('span').textContent = ''; }); }
  function showAlert(el, message){ el.querySelector('span').textContent = message; el.hidden = false; }

  function setBusy(value, target){
    busy = value;
    [loginSubmit, forgotSubmit].forEach(btn => btn.disabled = value);
    const button = target === 'forgot' ? forgotSubmit : loginSubmit;
    button.querySelector('.btn-spinner').hidden = !value;
    button.querySelector('.btn-label').textContent = value ? t(target === 'forgot' ? 'sending' : 'loggingIn') : t(target === 'forgot' ? 'sendReset' : 'login');
  }

  async function api(path, payload){
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { message: text }; }
    if (!response.ok) {
      const message = data?.message || data?.error || data?.errors?.email?.[0] || data?.errors?.password?.[0] || null;
      throw new Error(message || 'Request failed');
    }
    return data;
  }

  function authTokenOf(data){
    return data?.token || data?.access_token || data?.data?.token || data?.data?.access_token || null;
  }
  function userPayloadOf(data){
    return data?.business || data?.company || data?.employer || data?.enterprise || data?.user || data?.data?.business || data?.data?.company || data?.data?.user || null;
  }
  function saveAuth(data){
    const token = authTokenOf(data);
    if (!token) return;
    const payload = { token, business: userPayloadOf(data) };
    try { localStorage.setItem(AUTH_KEY, JSON.stringify(payload)); } catch (_) {}
  }
  function hasAuth(){
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Boolean(parsed && parsed.token);
    } catch (_) { return false; }
  }
  function loginDestination(){
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (!from) return t('home');
    const localeHome = t('home');
    const allowed = [localeHome, '/business', '/business/', '/vi/business', '/en/business', '/ja/business'];
    if (allowed.some(prefix => from === prefix || from.startsWith(prefix + '/') || from.startsWith(prefix + '?'))) return from;
    return localeHome;
  }
  function redirectAfterLogin(){ window.location.assign(loginDestination()); }

  function setMode(next){
    mode = next;
    clearAlerts();
    if (next === 'forgot') {
      loginView.hidden = true;
      forgotView.hidden = false;
      forgotSuccess.hidden = true;
      forgotForm.hidden = false;
      $('#forgot-email').value = $('#email').value.trim();
      setTimeout(() => $('#forgot-email').focus(), 0);
    } else {
      loginView.hidden = false;
      forgotView.hidden = true;
      forgotSuccess.hidden = true;
      forgotForm.hidden = false;
      setTimeout(() => $('#email').focus(), 0);
    }
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlerts();
    const email = $('#email').value.trim();
    const password = $('#password').value;
    if (!email || !password) {
      showAlert(loginAlert, t('required'));
      return;
    }
    setBusy(true, 'login');
    try {
      const data = await api(ENDPOINTS.login, { email, password });
      saveAuth(data);
      redirectAfterLogin();
    } catch (error) {
      const msg = (error && error.message && error.message !== 'Request failed') ? error.message : t('failedCheck');
      showAlert(loginAlert, msg || t('failed'));
    } finally {
      setBusy(false, 'login');
    }
  });

  forgotForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlerts();
    const email = $('#forgot-email').value.trim();
    if (!email) {
      showAlert(forgotAlert, t('email'));
      return;
    }
    setBusy(true, 'forgot');
    try {
      await api(ENDPOINTS.forgot, { email });
      forgotForm.hidden = true;
      forgotSuccess.hidden = false;
      $('#forgot-success-copy').textContent = t('forgotDesc');
    } catch (error) {
      const msg = (error && error.message && error.message !== 'Request failed') ? error.message : t('failed');
      showAlert(forgotAlert, msg);
    } finally {
      setBusy(false, 'forgot');
    }
  });

  $('#forgot-link').addEventListener('click', () => setMode('forgot'));
  $('#back-login').addEventListener('click', () => setMode('login'));
  $('#success-back-login').addEventListener('click', () => setMode('login'));

  togglePassword.addEventListener('click', () => {
    const nextType = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = nextType;
    togglePassword.setAttribute('aria-pressed', String(nextType === 'text'));
    togglePassword.querySelector('.eye-open').hidden = nextType === 'text';
    togglePassword.querySelector('.eye-off').hidden = nextType !== 'text';
    togglePassword.setAttribute('aria-label', nextType === 'password' ? t('showPassword') : t('hidePassword'));
  });

  $$('.languages button').forEach((button) => {
    button.addEventListener('click', () => {
      applyLanguage(button.dataset.lang);
      const target = button.dataset.lang === 'vi' ? 'index.html' : button.dataset.lang === 'en' ? 'index-en.html' : 'index-ja.html';
      const current = window.location.pathname.split('/').pop() || 'index.html';
      if (current !== target && /index(-en|-ja)?\.html$/i.test(current)) {
        const url = new URL(window.location.href);
        url.pathname = url.pathname.replace(/[^/]+$/, target);
        window.location.assign(url.toString());
      }
    });
  });

  try {
    const saved = localStorage.getItem('language');
    if (saved && COPY[saved]) lang = saved;
  } catch (_) {}
  applyLanguage(lang);
  if (hasAuth()) {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('logout') && mode === 'login') redirectAfterLogin();
  }
})();
