import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JobShareTemplateLoginLayout from '../JobShareTemplateLoginLayout';
import { useCandidateAuth } from '../../../context/CandidateAuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { resolveCandidatePrefix, switchLocaleInPathname } from '../../../utils/localeRoutes';
import { CANDIDATE_LOGIN_COPY } from '../../../utils/jobShareTemplateLoginCopy';
import apiService from '../../../services/api';

const seoMeta = {
  vi: { description: 'Đăng nhập tài khoản ứng viên JobShare để tìm việc kỹ sư tại Nhật Bản, quản lý hồ sơ và theo dõi ứng tuyển.' },
  en: { description: 'Sign in to your JobShare candidate account to find engineering jobs in Japan, manage your profile and track applications.' },
  ja: { description: 'JobShareの応募者アカウントにログインして、日本のエンジニア求人を検索し、プロフィール管理や応募状況を確認しましょう。' },
};

export default function CandidateLoginPage() {
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const copy = CANDIDATE_LOGIN_COPY[language] || CANDIDATE_LOGIN_COPY.vi;
  const seo = seoMeta[language] || seoMeta.vi;
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
      setError(res.message || copy.failed);
    } catch (err) {
      setError(err.message || copy.failedCheck);
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
        setError(res.message || copy.failed);
      }
    } catch (err) {
      setError(err.message || copy.failedCheck);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    navigate(switchLocaleInPathname(pathname, lang));
  };

  return (
    <JobShareTemplateLoginLayout
      variant="candidate"
      copy={copy}
      language={language}
      onLanguageChange={handleLanguageChange}
      backHref={prefix}
      registerHref={`${prefix}/register`}
      pageTitle={copy.pageTitle}
      metaDescription={seo.description}
      view={view}
      onShowForgot={() => {
        setView('forgot');
        setError('');
        setForgotSuccess(false);
        setForgotEmail('');
      }}
      onShowLogin={() => {
        setView('login');
        setError('');
        setForgotSuccess(false);
      }}
      error={error}
      loading={loading}
      email={email}
      onEmailChange={(v) => {
        setEmail(v);
        if (error) setError('');
      }}
      password={password}
      onPasswordChange={(v) => {
        setPassword(v);
        if (error) setError('');
      }}
      showPassword={showPw}
      onTogglePassword={() => setShowPw((v) => !v)}
      onLoginSubmit={onSubmit}
      forgotEmail={forgotEmail}
      onForgotEmailChange={(v) => {
        setForgotEmail(v);
        if (error) setError('');
      }}
      onForgotSubmit={onForgotSubmit}
      forgotSuccess={forgotSuccess}
    />
  );
}
