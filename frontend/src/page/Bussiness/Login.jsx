import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JobShareTemplateLoginLayout from '../../landing/shared/pages/JobShareTemplateLoginLayout';
import { BUSINESS_LOGIN_COPY } from '../../landing/shared/lib/jobShareTemplateLoginCopy';
import { useLanguage } from '../../context/LanguageContext';
import { useLangFromQuery } from '../../hooks/useLangFromQuery';
import { withLocalePath } from '../../utils/localeRoutes';
import apiService from '../../services/api';

const Login = () => {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  useLangFromQuery();
  const copy = BUSINESS_LOGIN_COPY[language] || BUSINESS_LOGIN_COPY.vi;

  const backHref = useMemo(() => withLocalePath(language, '/business'), [language]);
  const registerHref = useMemo(
    () => `/business/register${language ? `?lang=${language}` : ''}`,
    [language],
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [view, setView] = useState('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    const remembered = localStorage.getItem('businessRememberEmail');
    if (remembered) {
      setEmail(remembered);
      setRemember(true);
    }
    if (token && userType === 'business') {
      navigate('/business', { replace: true });
    }
  }, [navigate]);

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url.toString());
  };

  const onLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError(copy.required);
      return;
    }
    setLoading(true);
    try {
      const response = await apiService.loginBusiness({
        email: email.trim(),
        password,
      });
      if (response.success && response.data?.token) {
        if (remember) {
          localStorage.setItem('businessRememberEmail', email.trim());
        } else {
          localStorage.removeItem('businessRememberEmail');
        }
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userType', 'business');
        if (response.data.business) {
          localStorage.setItem('user', JSON.stringify(response.data.business));
        }
        navigate('/business', { replace: true });
        return;
      }
      setError(response.message || copy.failed);
    } catch (err) {
      setError(err.message || copy.failedCheck);
    } finally {
      setLoading(false);
    }
  };

  const onForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!forgotEmail.trim()) {
      setError(copy.required);
      return;
    }
    setLoading(true);
    try {
      const response = await apiService.forgotPasswordBusiness(forgotEmail.trim());
      if (response.success) {
        setForgotSuccess(true);
      } else {
        setError(response.message || copy.failed);
      }
    } catch (err) {
      setError(err.message || copy.failedCheck);
    } finally {
      setLoading(false);
    }
  };

  const loginFormExtra = view === 'login' ? (
    <label className="terms-row" style={{ marginTop: 4 }}>
      <input
        type="checkbox"
        checked={remember}
        onChange={(e) => setRemember(e.target.checked)}
      />
      <span>
        {language === 'en' ? 'Remember email' : language === 'ja' ? 'メールを記憶' : 'Ghi nhớ email'}
      </span>
    </label>
  ) : null;

  return (
    <JobShareTemplateLoginLayout
      variant="business"
      copy={copy}
      language={language}
      onLanguageChange={handleLanguageChange}
      backHref={backHref}
      registerHref={registerHref}
      pageTitle={copy.pageTitle}
      metaDescription={copy.metaDescription}
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
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
      showPassword={showPassword}
      onTogglePassword={() => setShowPassword((v) => !v)}
      onLoginSubmit={onLoginSubmit}
      forgotEmail={forgotEmail}
      onForgotEmailChange={setForgotEmail}
      onForgotSubmit={onForgotSubmit}
      forgotSuccess={forgotSuccess}
      loginFormExtra={loginFormExtra}
    />
  );
};

export default Login;
