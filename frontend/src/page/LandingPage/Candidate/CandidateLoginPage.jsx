import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Lock, Mail } from 'lucide-react';
import CandidateAuthShell from './CandidateAuthShell';
import {
  AUTH_FONT,
  AuthErrorAlert,
  AuthPasswordToggle,
  AuthPrimaryButton,
  AuthSubmitButton,
  authInputWithIcons,
  authLabelClass,
} from './CandidateAuthFormUi';
import { useCandidateAuth } from '../../../context/CandidateAuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { resolveCandidatePrefix } from '../../../utils/localeRoutes';
import apiService from '../../../services/api';

const seoMeta = {
  vi: { title: 'Đăng nhập ứng viên | Workstation JobShare', description: 'Đăng nhập tài khoản ứng viên JobShare để tìm việc kỹ sư tại Nhật Bản, quản lý hồ sơ và theo dõi ứng tuyển.' },
  en: { title: 'Candidate Sign In | Workstation JobShare', description: 'Sign in to your JobShare candidate account to find engineering jobs in Japan, manage your profile and track applications.' },
  ja: { title: '応募者ログイン | Workstation JobShare', description: 'JobShareの応募者アカウントにログインして、日本のエンジニア求人を検索し、プロフィール管理や応募状況を確認しましょう。' },
};

const STR = {
  vi: {
    formTitle: 'Đăng nhập',
    formSubtitle: 'Tiếp tục với tài khoản ứng viên của bạn',
    email: 'Email',
    password: 'Mật khẩu',
    forgot: 'Quên mật khẩu?',
    submit: 'Đăng nhập',
    noAccount: 'Chưa có tài khoản?',
    signUp: 'Đăng ký',
    errorGeneric: 'Đăng nhập thất bại. Vui lòng thử lại.',
    forgotTitle: 'Quên mật khẩu',
    forgotSubtitle: 'Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.',
    sendResetLink: 'Gửi liên kết đặt lại',
    sending: 'Đang gửi...',
    backToLogin: 'Quay lại đăng nhập',
    forgotSuccessMsg: 'Nếu email tồn tại, bạn sẽ nhận được liên kết đặt lại mật khẩu trong hộp thư.',
    newRegistration: 'Đăng ký tài khoản mới',
  },
  en: {
    formTitle: 'Sign in',
    formSubtitle: 'Continue with your candidate account',
    email: 'Email',
    password: 'Password',
    forgot: 'Forgot password?',
    submit: 'Sign in',
    noAccount: "Don\u2019t have an account?",
    signUp: 'Sign up',
    errorGeneric: 'Sign-in failed. Please try again.',
    forgotTitle: 'Forgot Password',
    forgotSubtitle: 'Enter your registered email to receive a password reset link.',
    sendResetLink: 'Send Reset Link',
    sending: 'Sending...',
    backToLogin: 'Back to sign in',
    forgotSuccessMsg: 'If that email exists, you will receive a password reset link in your inbox.',
    newRegistration: 'Create new account',
  },
  ja: {
    formTitle: 'ログイン',
    formSubtitle: '応募者アカウントで続行',
    email: 'メール',
    password: 'パスワード',
    forgot: 'パスワードをお忘れですか？',
    submit: 'ログイン',
    noAccount: 'アカウントをお持ちでない方',
    signUp: '新規登録',
    errorGeneric: 'ログインに失敗しました。もう一度お試しください。',
    forgotTitle: 'パスワードをお忘れの場合',
    forgotSubtitle: '登録したメールアドレスを入力して、パスワードリセットリンクを受け取ってください。',
    sendResetLink: 'リセットリンクを送信',
    sending: '送信中...',
    backToLogin: 'ログインに戻る',
    forgotSuccessMsg: 'メールアドレスが存在する場合、パスワードリセットリンクが届きます。',
    newRegistration: '新規アカウント登録',
  },
};

export default function CandidateLoginPage() {
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = STR[language] || STR.vi;
  const { setAuth } = useCandidateAuth();

  const prefix = useMemo(() => resolveCandidatePrefix(pathname), [pathname]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [view, setView] = useState('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiService.loginApplicant({
        email: email.trim(),
        password,
      });
      if (res.success && res.data?.token && res.data?.applicant) {
        setAuth(res.data.token, res.data.applicant);
        const dest = location.state && typeof location.state.from === 'string' ? location.state.from : null;
        navigate(typeof dest === 'string' && dest.startsWith('/') ? dest : prefix, { replace: true });
        return;
      }
      setError(res.message || t.errorGeneric);
    } catch (err) {
      setError(err.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const onForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!forgotEmail.trim()) return;
    setLoading(true);
    try {
      const res = await apiService.forgotPasswordApplicant(forgotEmail.trim());
      if (res.success) {
        setForgotSuccess(true);
      } else {
        setError(res.message || t.errorGeneric);
      }
    } catch (err) {
      setError(err.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const switchToForgot = () => {
    setView('forgot');
    setError('');
    setForgotSuccess(false);
    setForgotEmail('');
  };

  const switchToLogin = () => {
    setView('login');
    setError('');
    setForgotSuccess(false);
  };

  const seo = seoMeta[language] || seoMeta.vi;
  const formTitle = view === 'login' ? t.formTitle : t.forgotTitle;
  const formSubtitle = view === 'login' ? t.formSubtitle : t.forgotSubtitle;

  const leftLinks =
    view === 'login' ? (
      <>
        <button
          type="button"
          onClick={switchToForgot}
          className="block text-black hover:text-red-700 text-sm transition-colors text-center lg:text-left underline bg-transparent border-none cursor-pointer p-0 w-full lg:w-auto"
          style={{ fontFamily: AUTH_FONT }}
        >
          {t.forgot}
        </button>
        <Link
          to={`${prefix}/register`}
          className="block text-black hover:text-red-700 text-sm transition-colors text-center lg:text-left underline"
          style={{ fontFamily: AUTH_FONT }}
        >
          {t.newRegistration}
        </Link>
      </>
    ) : (
      <button
        type="button"
        onClick={switchToLogin}
        className="block text-black hover:text-red-700 text-sm transition-colors text-center lg:text-left underline bg-transparent border-none cursor-pointer p-0 w-full lg:w-auto"
        style={{ fontFamily: AUTH_FONT }}
      >
        {t.backToLogin}
      </button>
    );

  return (
    <CandidateAuthShell formTitle={formTitle} formSubtitle={formSubtitle} leftLinks={leftLinks}>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {view === 'login' ? (
        <form onSubmit={onSubmit} className="space-y-5">
          <AuthErrorAlert message={error} />

          <div>
            <label htmlFor="cand-login-email" className={authLabelClass} style={{ fontFamily: AUTH_FONT }}>
              {t.email}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="cand-login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className={authInputWithIcons({ leftIcon: true })}
                style={{ fontFamily: AUTH_FONT }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="cand-login-password" className={authLabelClass} style={{ fontFamily: AUTH_FONT }}>
              {t.password}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="cand-login-password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.password}
                required
                className={authInputWithIcons({ leftIcon: true, rightIcon: true })}
                style={{ fontFamily: AUTH_FONT }}
              />
              <AuthPasswordToggle
                show={showPw}
                onToggle={() => setShowPw((v) => !v)}
                inputId="cand-login-password"
              />
            </div>
          </div>

          <AuthSubmitButton loading={loading}>{t.submit}</AuthSubmitButton>

          <p className="text-center text-sm text-gray-600" style={{ fontFamily: AUTH_FONT }}>
            {t.noAccount}{' '}
            <Link to={`${prefix}/register`} className="font-semibold text-red-600 hover:text-red-700 no-underline">
              {t.signUp}
            </Link>
          </p>
        </form>
      ) : forgotSuccess ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{t.forgotSuccessMsg}</span>
          </div>
          <AuthPrimaryButton onClick={switchToLogin}>{t.backToLogin}</AuthPrimaryButton>
        </div>
      ) : (
        <form onSubmit={onForgotSubmit} className="space-y-5">
          <AuthErrorAlert message={error} />

          <div>
            <label htmlFor="cand-forgot-email" className={authLabelClass} style={{ fontFamily: AUTH_FONT }}>
              {t.email}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="cand-forgot-email"
                type="email"
                autoComplete="email"
                value={forgotEmail}
                onChange={(e) => {
                  setForgotEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Email"
                required
                className={authInputWithIcons({ leftIcon: true })}
                style={{ fontFamily: AUTH_FONT }}
              />
            </div>
          </div>

          <AuthSubmitButton loading={loading} loadingText={t.sending}>
            {t.sendResetLink}
          </AuthSubmitButton>

          <button
            type="button"
            onClick={switchToLogin}
            className="block w-full text-center text-sm font-medium text-black hover:text-red-700 underline bg-transparent border-none cursor-pointer"
            style={{ fontFamily: AUTH_FONT }}
          >
            {t.backToLogin}
          </button>
        </form>
      )}
    </CandidateAuthShell>
  );
}
