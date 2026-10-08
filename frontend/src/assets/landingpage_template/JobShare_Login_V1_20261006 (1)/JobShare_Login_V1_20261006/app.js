(() => {
  'use strict';

  const API_BASE = 'https://ws-jobshare.com/api_jobshare/api';
  const COPY = {
    vi: {
      back: 'Quay lại trang chủ',
      kicker: 'WORKSTATION JOBSHARE',
      title: 'Đăng nhập CTV',
      email: 'Email',
      password: 'Mật khẩu',
      login: 'Đăng nhập',
      loggingIn: 'Đang đăng nhập...',
      forgot: 'Quên mật khẩu? Nhấn vào đây',
      register: 'Đăng ký mới? Nhấn vào đây',
      failed: 'Đăng nhập thất bại. Vui lòng thử lại.',
      failedCheck: 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.',
      required: 'Vui lòng nhập đầy đủ email và mật khẩu',
      forgotTitle: 'Quên mật khẩu',
      forgotDesc: 'Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.',
      sendReset: 'Gửi liên kết đặt lại',
      sending: 'Đang gửi...',
      backLogin: 'Quay lại đăng nhập',
      showPassword: 'Hiển thị mật khẩu',
      hidePassword: 'Ẩn mật khẩu'
    },
    en: {
      back: 'Back to home',
      kicker: 'WORKSTATION JOBSHARE',
      title: 'Agent Login',
      email: 'Email',
      password: 'Password',
      login: 'Login',
      loggingIn: 'Logging in...',
      forgot: 'Forgot password? Click here',
      register: 'New registration? Click here',
      failed: 'Login failed. Please try again.',
      failedCheck: 'Login failed. Please check your information.',
      required: 'Please enter email and password',
      forgotTitle: 'Forgot Password',
      forgotDesc: 'Enter your registered email to receive a password reset link.',
      sendReset: 'Send Reset Link',
      sending: 'Sending...',
      backLogin: 'Back to Login',
      showPassword: 'Show password',
      hidePassword: 'Hide password'
    },
    ja: {
      back: 'ホームに戻る',
      kicker: 'WORKSTATION JOBSHARE',
      title: 'エージェントログイン',
      email: 'Email',
      password: 'パスワード',
      login: 'ログイン',
      loggingIn: 'ログイン中...',
      forgot: 'パスワードをお忘れですか？ここをクリック',
      register: '新規登録？ここをクリック',
      failed: 'ログインに失敗しました。もう一度お試しください。',
      failedCheck: 'ログインに失敗しました。情報を確認してください。',
      required: 'メールアドレスとパスワードを入力してください',
      forgotTitle: 'パスワードをお忘れの場合',
      forgotDesc: '登録したメールアドレスを入力して、パスワードリセットリンクを受け取ってください。',
      sendReset: 'リセットリンクを送信',
      sending: '送信中...',
      backLogin: 'ログインに戻る',
      showPassword: 'パスワードを表示',
      hidePassword: 'パスワードを非表示'
    }
  };

  const root = document.documentElement;
  const body = document.body;
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

  function setText(selector, key){
    const el = $(selector);
    if (el) el.textContent = t(key);
  }

  function applyLanguage(next){
    if (!COPY[next]) return;
    lang = next;
    root.lang = next;
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

  function clearAlerts(){
    [loginAlert, forgotAlert].forEach(el => { el.hidden = true; el.querySelector('span').textContent = ''; });
  }

  function showAlert(el, message){
    el.querySelector('span').textContent = message;
    el.hidden = false;
  }

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
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    let data = null;
    try { data = await response.json(); } catch (_) {}
    if (!data) data = {success: response.ok, message: response.statusText};
    if (typeof data.success === 'undefined') data.success = response.ok;
    return data;
  }

  function openForgot(){
    mode = 'forgot';
    clearAlerts();
    loginView.hidden = true;
    forgotView.hidden = false;
    forgotForm.hidden = false;
    forgotSuccess.hidden = true;
    $('#forgot-email').value = '';
    requestAnimationFrame(() => $('#forgot-email').focus());
  }

  function openLogin(){
    mode = 'login';
    clearAlerts();
    forgotView.hidden = true;
    loginView.hidden = false;
    requestAnimationFrame(() => $('#email').focus());
  }

  async function handleLogin(event){
    event.preventDefault();
    clearAlerts();
    const email = $('#email').value.trim();
    const password = passwordInput.value;
    if (!email || !password){ showAlert(loginAlert, t('required')); return; }
    setBusy(true,'login');
    try {
      const result = await api('/ctv/auth/login',{email,password});
      if (result.success && result.data && result.data.token){
        localStorage.setItem('token',result.data.token);
        localStorage.setItem('userType','ctv');
        if (result.data.collaborator) localStorage.setItem('user',JSON.stringify(result.data.collaborator));
        window.location.assign('/agent');
        return;
      }
      showAlert(loginAlert,result.message || t('failed'));
    } catch (error){
      showAlert(loginAlert,(error && error.message) || t('failedCheck'));
    } finally {
      setBusy(false,'login');
    }
  }

  async function handleForgot(event){
    event.preventDefault();
    clearAlerts();
    const email = $('#forgot-email').value.trim();
    if (!email){ showAlert(forgotAlert,t('required')); return; }
    setBusy(true,'forgot');
    try {
      const result = await api('/ctv/auth/forgot-password',{email});
      if (result.success){
        forgotForm.hidden = true;
        forgotSuccess.hidden = false;
        $('#forgot-success-copy').textContent = t('forgotDesc');
      } else {
        showAlert(forgotAlert,result.message || t('failed'));
      }
    } catch (error){
      showAlert(forgotAlert,(error && error.message) || t('failed'));
    } finally {
      setBusy(false,'forgot');
    }
  }

  $$('.languages button').forEach(btn => btn.addEventListener('click', () => applyLanguage(btn.dataset.lang)));
  $('#forgot-link').addEventListener('click',openForgot);
  $('#back-login').addEventListener('click',openLogin);
  $('#success-back-login').addEventListener('click',openLogin);
  loginForm.addEventListener('submit',handleLogin);
  forgotForm.addEventListener('submit',handleForgot);
  [$('#email'),passwordInput,$('#forgot-email')].forEach(input => input.addEventListener('input',clearAlerts));

  togglePassword.addEventListener('click',() => {
    const reveal = passwordInput.type === 'password';
    passwordInput.type = reveal ? 'text' : 'password';
    togglePassword.setAttribute('aria-pressed',String(reveal));
    togglePassword.setAttribute('aria-label',reveal ? t('hidePassword') : t('showPassword'));
    togglePassword.querySelector('.eye-open').hidden = reveal;
    togglePassword.querySelector('.eye-off').hidden = !reveal;
    passwordInput.focus({preventScroll:true});
  });

  try {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    if (token && userType === 'ctv') { window.location.replace('/agent'); return; }
  } catch (_) {}

  applyLanguage(lang);
})();
