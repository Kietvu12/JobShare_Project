import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail, User } from 'lucide-react';
import CandidateAuthShell from './CandidateAuthShell';
import {
  AUTH_FONT,
  AuthErrorAlert,
  AuthPasswordToggle,
  AuthSubmitButton,
  authInputWithIcons,
  authLabelClass,
} from './CandidateAuthFormUi';
import { useCandidateAuth } from '../../../context/CandidateAuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { resolveCandidatePrefix } from '../../../utils/localeRoutes';
import apiService from '../../../services/api';

const seoMeta = {
  vi: { title: 'Đăng ký ứng viên | Workstation JobShare', description: 'Tạo tài khoản ứng viên JobShare miễn phí. Tìm việc kỹ sư tại Nhật Bản, tạo CV bằng AI và theo dõi ứng tuyển.' },
  en: { title: 'Candidate Sign Up | Workstation JobShare', description: 'Create your free JobShare candidate account. Find engineering jobs in Japan, build AI-powered CVs and track applications.' },
  ja: { title: '応募者新規登録 | Workstation JobShare', description: 'JobShareの応募者アカウントを無料作成。日本のエンジニア求人検索、AI履歴書作成、応募管理が可能です。' },
};

const STR = {
  vi: {
    formTitle: 'Đăng ký',
    formSubtitle: 'Tạo tài khoản ứng viên JobShare',
    name: 'Họ và tên',
    email: 'Email',
    password: 'Mật khẩu',
    repeatPassword: 'Nhập lại mật khẩu',
    passwordHint: 'Dùng ít nhất 8 ký tự, gồm chữ, số và ký tự đặc biệt.',
    accept: 'Tôi đồng ý với',
    termLink: 'Điều khoản',
    submit: 'Đăng ký',
    hasAccount: 'Đã có tài khoản?',
    signIn: 'Đăng nhập',
    signInLink: 'Đăng nhập tài khoản',
    errorGeneric: 'Đăng ký thất bại. Vui lòng thử lại.',
    errorPwMatch: 'Mật khẩu nhập lại không khớp.',
    errorPwLen: 'Mật khẩu cần ít nhất 8 ký tự.',
    errorTerms: 'Vui lòng đồng ý điều khoản.',
  },
  en: {
    formTitle: 'Sign up',
    formSubtitle: 'Create your JobShare candidate account',
    name: 'Full name',
    email: 'Email',
    password: 'Password',
    repeatPassword: 'Repeat password',
    passwordHint: 'Use 8 or more characters with a mix of letters, numbers & symbols.',
    accept: 'I accept the',
    termLink: 'Terms',
    submit: 'Sign up',
    hasAccount: 'Already have an account?',
    signIn: 'Sign in',
    signInLink: 'Sign in to your account',
    errorGeneric: 'Registration failed. Please try again.',
    errorPwMatch: 'Passwords do not match.',
    errorPwLen: 'Password must be at least 8 characters.',
    errorTerms: 'Please accept the terms.',
  },
  ja: {
    formTitle: '新規登録',
    formSubtitle: 'JobShare 応募者アカウントを作成',
    name: '氏名',
    email: 'メール',
    password: 'パスワード',
    repeatPassword: 'パスワード（確認）',
    passwordHint: '8文字以上で、英数字・記号を組み合わせてください。',
    accept: '次に同意します',
    termLink: '利用規約',
    submit: '登録',
    hasAccount: 'すでにアカウントをお持ちの方',
    signIn: 'ログイン',
    signInLink: 'アカウントにログイン',
    errorGeneric: '登録に失敗しました。もう一度お試しください。',
    errorPwMatch: 'パスワードが一致しません。',
    errorPwLen: 'パスワードは8文字以上にしてください。',
    errorTerms: '規約に同意してください。',
  },
};

export default function CandidateRegisterPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = STR[language] || STR.vi;
  const { setAuth } = useCandidateAuth();

  const prefix = useMemo(() => resolveCandidatePrefix(pathname), [pathname]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!acceptTerms) {
      setError(t.errorTerms);
      return;
    }
    if (password.length < 8) {
      setError(t.errorPwLen);
      return;
    }
    if (password !== password2) {
      setError(t.errorPwMatch);
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.registerApplicant({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      if (res.success && res.data?.token && res.data?.applicant) {
        setAuth(res.data.token, res.data.applicant);
        navigate(prefix, { replace: true });
        return;
      }
      setError(res.message || t.errorGeneric);
    } catch (err) {
      setError(err.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const seo = seoMeta[language] || seoMeta.vi;

  const leftLinks = (
    <Link
      to={`${prefix}/login`}
      className="block text-black hover:text-red-700 text-sm transition-colors text-center lg:text-left underline"
      style={{ fontFamily: AUTH_FONT }}
    >
      {t.signInLink}
    </Link>
  );

  return (
    <CandidateAuthShell formTitle={t.formTitle} formSubtitle={t.formSubtitle} leftLinks={leftLinks}>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href="https://ws-jobshare.com/landing/candidate/register" />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content="https://ws-jobshare.com/landing/candidate/register" />
      </Helmet>

      <form onSubmit={onSubmit} className="space-y-5">
        <AuthErrorAlert message={error} />

        <div>
          <label htmlFor="cand-reg-name" className={authLabelClass} style={{ fontFamily: AUTH_FONT }}>
            {t.name}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <User className="w-5 h-5" />
            </div>
            <input
              id="cand-reg-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={authInputWithIcons({ leftIcon: true })}
              style={{ fontFamily: AUTH_FONT }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="cand-reg-email" className={authLabelClass} style={{ fontFamily: AUTH_FONT }}>
            {t.email}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Mail className="w-5 h-5" />
            </div>
            <input
              id="cand-reg-email"
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
          <label htmlFor="cand-reg-password" className={authLabelClass} style={{ fontFamily: AUTH_FONT }}>
            {t.password}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Lock className="w-5 h-5" />
            </div>
            <input
              id="cand-reg-password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={authInputWithIcons({ leftIcon: true, rightIcon: true })}
              style={{ fontFamily: AUTH_FONT }}
            />
            <AuthPasswordToggle
              show={showPw}
              onToggle={() => setShowPw((v) => !v)}
              inputId="cand-reg-password"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">{t.passwordHint}</p>
        </div>

        <div>
          <label htmlFor="cand-reg-password2" className={authLabelClass} style={{ fontFamily: AUTH_FONT }}>
            {t.repeatPassword}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Lock className="w-5 h-5" />
            </div>
            <input
              id="cand-reg-password2"
              type={showPw2 ? 'text' : 'password'}
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              className={authInputWithIcons({ leftIcon: true, rightIcon: true })}
              style={{ fontFamily: AUTH_FONT }}
            />
            <AuthPasswordToggle
              show={showPw2}
              onToggle={() => setShowPw2((v) => !v)}
              inputId="cand-reg-password2"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
          />
          <span style={{ fontFamily: AUTH_FONT }}>
            {t.accept}{' '}
            <a
              href="#"
              className="font-semibold text-red-600 hover:text-red-700 underline"
              onClick={(e) => e.preventDefault()}
            >
              {t.termLink}
            </a>
          </span>
        </label>

        <AuthSubmitButton loading={loading}>{t.submit}</AuthSubmitButton>

        <p className="text-center text-sm text-gray-600" style={{ fontFamily: AUTH_FONT }}>
          {t.hasAccount}{' '}
          <Link to={`${prefix}/login`} className="font-semibold text-red-600 hover:text-red-700 no-underline">
            {t.signIn}
          </Link>
        </p>
      </form>
    </CandidateAuthShell>
  );
}
