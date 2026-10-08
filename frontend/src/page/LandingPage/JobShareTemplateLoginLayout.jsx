import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { LOGIN_TEMPLATE_ASSETS } from '../../utils/jobShareTemplateLoginCopy';
import './jobShareTemplateLogin.css';

const LANGS = ['vi', 'en', 'ja'];

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h16v16H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 17h.01" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

export default function JobShareTemplateLoginLayout({
  variant,
  copy,
  language,
  onLanguageChange,
  backHref,
  registerHref,
  pageTitle,
  metaDescription,
  view,
  onShowForgot,
  onShowLogin,
  error,
  loading,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  onLoginSubmit,
  forgotEmail,
  onForgotEmailChange,
  onForgotSubmit,
  forgotSuccess,
}) {
  const assets = LOGIN_TEMPLATE_ASSETS[variant];
  const assetBase = assets.publicBase;
  const brandSrc = `${assetBase}/assets/${assets.brandImage}`;
  const logoSrc = `${assetBase}/assets/jobshare-logo.png`;
  const htmlLang = language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'vi';

  useEffect(() => {
    document.documentElement.lang = htmlLang;
    document.documentElement.classList.add('jobshare-template-login-root');
    const links = [
      { id: `js-login-fonts-${variant}`, href: `${assetBase}/fonts.css` },
      { id: `js-login-styles-${variant}`, href: `${assetBase}/styles.css` },
    ];
    links.forEach(({ id, href }) => {
      if (document.getElementById(id)) return;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    });
    return () => {
      document.documentElement.classList.remove('jobshare-template-login-root');
    };
  }, [assetBase, htmlLang, variant]);

  return (
    <>
      {pageTitle ? (
        <Helmet>
          <html lang={htmlLang} />
          <title>{pageTitle}</title>
          {metaDescription ? <meta name="description" content={metaDescription} /> : null}
          <meta name="robots" content="noindex, follow" />
        </Helmet>
      ) : null}

      <main className="login-page">
        <div className="login-utility">
          <Link className="back-link" to={backHref} aria-label={copy.back}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>{copy.back}</span>
          </Link>
          <nav className="languages" aria-label="Language">
            {LANGS.map((code) => (
              <button
                key={code}
                type="button"
                data-lang={code}
                aria-current={language === code ? 'true' : 'false'}
                onClick={() => onLanguageChange?.(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </nav>
        </div>

        <div className="login-stage">
          <section className="login-shell" aria-label={assets.shellLabel}>
            <aside className="login-brand" aria-label="JobShare">
              <div className="brand-lockup">
                <img src={logoSrc} alt="JobShare" width="1563" height="468" />
              </div>
              <div className="brand-visual" aria-hidden="true">
                <img src={brandSrc} alt="" width="1400" height="1713" decoding="async" />
              </div>
            </aside>

            <div className="login-panel">
              <div className="login-panel-inner">
                {view === 'login' ? (
                  <div id="login-view">
                    <header className="login-heading">
                      <div className="kicker">{copy.kicker}</div>
                      <h1>{copy.title}</h1>
                    </header>

                    <form className="login-form" onSubmit={onLoginSubmit}>
                      <div className="field">
                        <label htmlFor="js-login-email">{copy.email}</label>
                        <div className="input-wrap">
                          <span className="input-icon" aria-hidden="true">
                            <EmailIcon />
                          </span>
                          <input
                            id="js-login-email"
                            name="email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder={copy.email}
                            value={email}
                            onChange={(e) => onEmailChange(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="field">
                        <label htmlFor="js-login-password">{copy.password}</label>
                        <div className="input-wrap">
                          <span className="input-icon" aria-hidden="true">
                            <LockIcon />
                          </span>
                          <input
                            id="js-login-password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            placeholder={copy.password}
                            value={password}
                            onChange={(e) => onPasswordChange(e.target.value)}
                            required
                          />
                          <button
                            className="password-toggle"
                            type="button"
                            aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                            aria-pressed={showPassword}
                            onClick={onTogglePassword}
                          >
                            <svg
                              className="eye-open"
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              hidden={showPassword}
                            >
                              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                              <circle cx="12" cy="12" r="2.6" />
                            </svg>
                            <svg
                              className="eye-off"
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              hidden={!showPassword}
                            >
                              <path d="m3 3 18 18" />
                              <path d="M10.6 6.2A11 11 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.1 3.8M6.6 6.6C3.6 8.3 2 12 2 12s3.5 6 10 6c1.6 0 3-.4 4.2-1" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="form-links">
                        <button className="text-link" type="button" onClick={onShowForgot}>
                          {copy.forgot}
                        </button>
                      </div>

                      {error ? (
                        <div className="form-alert" role="alert" aria-live="polite">
                          <AlertIcon />
                          <span>{error}</span>
                        </div>
                      ) : null}

                      <button className="btn btn-primary" type="submit" disabled={loading}>
                        <span className={`btn-spinner${loading ? '' : ''}`} hidden={!loading} />
                        <span className="btn-label">{loading ? copy.loggingIn : copy.login}</span>
                      </button>
                    </form>

                    <p className="register-row">
                      <Link to={registerHref}>{copy.register}</Link>
                    </p>
                  </div>
                ) : (
                  <div id="forgot-view">
                    {!forgotSuccess ? (
                      <>
                        <header className="login-heading">
                          <div className="kicker">{copy.kicker}</div>
                          <h1>{copy.forgotTitle}</h1>
                          <p className="forgot-description">{copy.forgotDesc}</p>
                        </header>

                        <form className="login-form" onSubmit={onForgotSubmit}>
                          <div className="field">
                            <label htmlFor="js-forgot-email">{copy.email}</label>
                            <div className="input-wrap">
                              <span className="input-icon" aria-hidden="true">
                                <EmailIcon />
                              </span>
                              <input
                                id="js-forgot-email"
                                name="email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                placeholder={copy.email}
                                value={forgotEmail}
                                onChange={(e) => onForgotEmailChange(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          {error ? (
                            <div className="form-alert" role="alert" aria-live="polite">
                              <AlertIcon />
                              <span>{error}</span>
                            </div>
                          ) : null}

                          <button className="btn btn-primary" type="submit" disabled={loading}>
                            <span className="btn-spinner" hidden={!loading} />
                            <span className="btn-label">{loading ? copy.sending : copy.sendReset}</span>
                          </button>
                          <button className="text-link back-login" type="button" onClick={onShowLogin}>
                            {copy.backLogin}
                          </button>
                        </form>
                      </>
                    ) : (
                      <div id="forgot-success">
                        <div className="form-alert success" role="status" aria-live="polite">
                          <SuccessIcon />
                          <span>{copy.forgotDesc}</span>
                        </div>
                        <div className="forgot-actions">
                          <button className="btn btn-primary" type="button" onClick={onShowLogin}>
                            <span className="btn-label">{copy.backLogin}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
