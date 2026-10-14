import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JobShareTemplateLoginLayout from '../../shared/pages/JobShareTemplateLoginLayout';
import { COLLABORATOR_LOGIN_COPY } from '../../shared/lib/jobShareTemplateLoginCopy';
import { useLanguage } from '../../../context/LanguageContext';
import { getLocaleFromPathname, switchLocaleInPathname, withLocalePath } from '../../../utils/localeRoutes';
import apiService from '../../../services/api';

const seoMeta = {
  vi: {
    description:
      'Đăng nhập tài khoản cộng tác viên JobShare để giới thiệu ứng viên, theo dõi tiến cử và nhận hoa hồng.',
  },
  en: {
    description:
      'Sign in to your JobShare collaborator account to refer candidates, track nominations and commissions.',
  },
  ja: {
    description:
      'JobShareコラボレーターアカウントにログインし、候補者紹介・進捗管理・報酬確認ができます。',
  },
};

export default function CollaboratorLoginPage() {
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const copy = COLLABORATOR_LOGIN_COPY[language] || COLLABORATOR_LOGIN_COPY.vi;
  const seo = seoMeta[language] || seoMeta.vi;

  const locale = getLocaleFromPathname(pathname) || language || 'vi';
  const homePath = useMemo(() => withLocalePath(locale, '/'), [locale]);
  const registerPath = useMemo(() => withLocalePath(locale, '/collaborator/register'), [locale]);

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
    if (!email.trim() || !password) {
      setError(copy.required);
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.loginCTV({
        email: email.trim(),
        password,
      });
      if (res.success && res.data?.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userType', 'ctv');
        if (res.data.collaborator) {
          localStorage.setItem('user', JSON.stringify(res.data.collaborator));
        }
        const dest = location.state?.from;
        navigate(typeof dest === 'string' && dest.startsWith('/') ? dest : '/agent', { replace: true });
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
      const res = await apiService.forgotPasswordCTV(forgotEmail.trim());
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
      variant="collaborator"
      copy={copy}
      language={language}
      onLanguageChange={handleLanguageChange}
      backHref={homePath}
      registerHref={registerPath}
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
