import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useLangFromQuery } from '../../hooks/useLangFromQuery';
import apiService from '../../services/api';
import { getBusinessRegisterCopy } from '../../i18n/businessApp/businessRegister';
import heroImage from '../../assets/business-register-hero.jpg';
import './businessRegister.css';

const LANGUAGE_OPTIONS = ['vi', 'en', 'ja'];

const EMPTY_FORM = {
  company: '',
  business: '',
  location: '',
  contact: '',
  department: '',
  email: '',
  phone: '',
  password: '',
  password2: '',
  consent: false,
};

function emailOK(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
}

function flattenCategoryTree(tree, out = []) {
  (tree || []).forEach((node) => {
    out.push(node);
    if (node.children?.length) flattenCategoryTree(node.children, out);
  });
  return out;
}

function pickJobCategoryIds(businessText, tree) {
  const flat = flattenCategoryTree(tree);
  if (!flat.length) return [];
  const q = String(businessText || '').trim().toLowerCase();
  if (q) {
    const hit = flat.find((n) => {
      const names = [n.nameVi, n.nameEn, n.nameJa, n.name, n.label].filter(Boolean).map((s) => String(s).toLowerCase());
      return names.some((name) => name.includes(q) || q.includes(name));
    });
    if (hit?.id != null) return [Number(hit.id)];
  }
  return flat[0]?.id != null ? [Number(flat[0].id)] : [];
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 4 4L20 5" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21h18M5 21V6l7-3 7 3v15M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c.5-4 2.7-6 6-6s5.5 2 6 6" />
      <path d="M16 8h5m-2.5-2.5V10.5" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16v12H7l-3 3V4Z" />
      <path d="M8 8h8M8 12h5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h15" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

const Register = () => {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  useLangFromQuery();
  const copy = useMemo(() => getBusinessRegisterCopy(language), [language]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [categoryTree, setCategoryTree] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    if (token && userType === 'business') {
      navigate('/business', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiService.getCTVJobCategoryTree();
        if (!cancelled && res?.success && Array.isArray(res.data?.tree)) {
          setCategoryTree(res.data.tree);
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [language]);

  const update = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: false }));
    setSubmitError('');
  }, []);

  const setError = useCallback((name, on) => {
    setFieldErrors((prev) => ({ ...prev, [name]: on }));
  }, []);

  const validate = useCallback(() => {
    const v = {
      company: form.company.trim(),
      business: form.business.trim(),
      contact: form.contact.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      password2: form.password2,
      consent: form.consent,
    };
    setError('company', !v.company);
    setError('business', !v.business);
    setError('contact', !v.contact);
    setError('email', !emailOK(v.email));
    setError('phone', !v.phone);
    setError('password', v.password.length < 8);
    setError('password2', !v.password2 || v.password2 !== v.password);
    setError('consent', !v.consent);
    return v.company && v.business && v.contact && emailOK(v.email) && v.phone
      && v.password.length >= 8 && v.password2 === v.password && v.consent;
  }, [form, setError]);

  const buildPayload = useCallback(() => {
    const jobCategoryIds = pickJobCategoryIds(form.business, categoryTree);
    const taxCode = `JSB-${Date.now().toString(36).toUpperCase()}`;
    const address = form.location.trim() || '—';
    const contactTitle = form.department.trim() || copy.defaultContactTitle;
    const email = form.email.trim();
    const payload = {
      companyName: form.company.trim(),
      taxCode,
      jobCategoryIds,
      address,
      city: form.location.trim() || null,
      website: form.business.trim() ? `industry:${form.business.trim()}` : null,
      contactName: form.contact.trim(),
      contactTitle,
      contactEmail: email,
      contactPhone: form.phone.trim(),
      loginEmail: email,
      password: form.password,
      acceptTerms: true,
    };
    if (language === 'ja') payload.companyNameJp = form.company.trim();
    if (language === 'en') payload.companyNameEn = form.company.trim();
    if (language === 'ja') {
      payload.contactNameJp = form.contact.trim();
      payload.contactTitleJp = contactTitle;
      payload.addressJp = address;
    }
    return payload;
  }, [form, categoryTree, copy.defaultContactTitle, language]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!categoryTree.length) {
      setSubmitError('Không tải được danh mục ngành nghề. Vui lòng thử lại.');
      return;
    }
    setLoading(true);
    setSubmitError('');
    try {
      const response = await apiService.registerBusiness(buildPayload());
      if (response.success) {
        setToastOpen(true);
        setTimeout(() => setToastOpen(false), 5200);
        setForm(EMPTY_FORM);
      } else {
        setSubmitError(response.message || 'Đăng ký thất bại');
      }
    } catch (err) {
      setSubmitError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const fullFields = useMemo(() => new Set(['company', 'business', 'email', 'phone']), []);
  const fieldClass = (name) => `jr-field${fieldErrors[name] ? ' is-error' : ''}${fullFields.has(name) ? ' full' : ''}`;
  const sideIcons = [BuildingIcon, UserPlusIcon, ChatIcon];

  return (
    <div className="jr-register-page">
      <Helmet>
        <title>{copy.metaTitle}</title>
        <meta name="description" content={copy.metaDescription} />
      </Helmet>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700;800&display=swap" rel="stylesheet" />

      <header className="jr-topbar">
        <div className="jr-topbar-inner">
          <Link to="/" className="jr-topbar-logo">
            <img src="/logo.png" alt="JobShare" />
          </Link>
          <div className="jr-topbar-actions">
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang}
                type="button"
                className={`jr-lang-btn${language === lang ? ' is-active' : ''}`}
                onClick={() => changeLanguage(lang)}
                aria-label={lang}
              >
                {lang.toUpperCase()}
              </button>
            ))}
            <Link to="/business/login" className="jr-topbar-login">{copy.loginLink}</Link>
          </div>
        </div>
      </header>

      <main className="jr-page" lang={language === 'ja' ? 'ja' : language}>
        <section className="jr-hero" aria-labelledby="register-title">
          <div className="jr-wrap jr-hero-inner">
            <div>
              <p className="jr-kicker">{copy.kicker}</p>
              <h1 id="register-title">
                {copy.heroTitle}
                <em>{copy.heroEm}</em>
              </h1>
              <p className="jr-lead">
                <span className="jr-lead-line">{copy.lead1}</span>
                <span className="jr-lead-line">{copy.lead2}</span>
              </p>
              <div className="jr-hero-note">
                <span><CheckIcon />{copy.note1}</span>
                <span><CheckIcon />{copy.note2}</span>
              </div>
            </div>
            <figure className="jr-photo">
              <img src={heroImage} alt={copy.photoAlt} />
              <figcaption className="jr-photo-cap">{copy.photoCap}</figcaption>
            </figure>
          </div>
        </section>

        <section className="jr-main">
          <div className="jr-wrap jr-grid">
            <aside className="jr-side">
              <small>{copy.sideKicker}</small>
              <h2>{copy.sideTitle}</h2>
              <p>{copy.sideBody}</p>
              <ul className="jr-list">
                {copy.sideList.map((item, index) => {
                  const Icon = sideIcons[index] || BuildingIcon;
                  return (
                    <li key={item}>
                      <Icon />
                      <span>{item}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="jr-side-note">{copy.sideNote}</div>
            </aside>

            <section className="jr-form-shell" aria-labelledby="form-title">
              <div className="jr-form-head">
                <small>{copy.formKicker}</small>
                <h2 id="form-title">{copy.formTitle}</h2>
                <p>{copy.formDesc}</p>
              </div>

              <form className="jr-form" id="register-form" noValidate onSubmit={onSubmit}>
                {submitError ? <p className="jr-form-error" role="alert">{submitError}</p> : null}

                <div className="jr-section">
                  <h3 className="jr-section-title"><b>01</b>{copy.sec1Title}</h3>
                  <p className="jr-section-desc">{copy.sec1Desc}</p>
                  <div className="jr-fields">
                    <div className={fieldClass('company')} data-field="company">
                      <label className="jr-label" htmlFor="company">
                        <span className="jr-required">{copy.required}</span>
                        {copy.company}
                      </label>
                      <input
                        className="jr-input"
                        id="company"
                        name="company"
                        type="text"
                        placeholder={copy.companyPh}
                        autoComplete="organization"
                        value={form.company}
                        onChange={(ev) => update('company', ev.target.value)}
                      />
                      <p className="jr-error">{copy.companyErr}</p>
                    </div>
                    <div className={fieldClass('business')} data-field="business">
                      <label className="jr-label" htmlFor="business">
                        <span className="jr-required">{copy.required}</span>
                        {copy.business}
                      </label>
                      <input
                        className="jr-input"
                        id="business"
                        name="business"
                        type="text"
                        placeholder={copy.businessPh}
                        value={form.business}
                        onChange={(ev) => update('business', ev.target.value)}
                      />
                      <p className="jr-error">{copy.businessErr}</p>
                    </div>
                    <div className="jr-field full">
                      <label className="jr-label" htmlFor="location">
                        <span className="jr-optional">{copy.optional}</span>
                        {copy.location}
                      </label>
                      <input
                        className="jr-input"
                        id="location"
                        name="location"
                        type="text"
                        placeholder={copy.locationPh}
                        autoComplete="street-address"
                        value={form.location}
                        onChange={(ev) => update('location', ev.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="jr-section">
                  <h3 className="jr-section-title"><b>02</b>{copy.sec2Title}</h3>
                  <p className="jr-section-desc">{copy.sec2Desc}</p>
                  <div className="jr-fields">
                    <div className={fieldClass('contact')} data-field="contact">
                      <label className="jr-label" htmlFor="contact">
                        <span className="jr-required">{copy.required}</span>
                        {copy.contact}
                      </label>
                      <input
                        className="jr-input"
                        id="contact"
                        name="contact"
                        type="text"
                        placeholder={copy.contactPh}
                        autoComplete="name"
                        value={form.contact}
                        onChange={(ev) => update('contact', ev.target.value)}
                      />
                      <p className="jr-error">{copy.contactErr}</p>
                    </div>
                    <div className="jr-field">
                      <label className="jr-label" htmlFor="department">
                        <span className="jr-optional">{copy.optional}</span>
                        {copy.department}
                      </label>
                      <input
                        className="jr-input"
                        id="department"
                        name="department"
                        type="text"
                        placeholder={copy.departmentPh}
                        autoComplete="organization-title"
                        value={form.department}
                        onChange={(ev) => update('department', ev.target.value)}
                      />
                    </div>
                    <div className={fieldClass('email')} data-field="email">
                      <label className="jr-label" htmlFor="email">
                        <span className="jr-required">{copy.required}</span>
                        {copy.email}
                      </label>
                      <input
                        className="jr-input"
                        id="email"
                        name="email"
                        type="email"
                        placeholder={copy.emailPh}
                        autoComplete="email"
                        value={form.email}
                        onChange={(ev) => update('email', ev.target.value)}
                      />
                      <p className="jr-error">{copy.emailErr}</p>
                    </div>
                    <div className={fieldClass('phone')} data-field="phone">
                      <label className="jr-label" htmlFor="phone">
                        <span className="jr-required">{copy.required}</span>
                        {copy.phone}
                      </label>
                      <input
                        className="jr-input"
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder={copy.phonePh}
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(ev) => update('phone', ev.target.value)}
                      />
                      <p className="jr-error">{copy.phoneErr}</p>
                    </div>
                  </div>
                </div>

                <div className="jr-section">
                  <h3 className="jr-section-title"><b>03</b>{copy.sec3Title}</h3>
                  <p className="jr-section-desc">{copy.sec3Desc}</p>
                  <div className="jr-fields">
                    <div className={fieldClass('password')} data-field="password">
                      <label className="jr-label" htmlFor="password">
                        <span className="jr-required">{copy.required}</span>
                        {copy.password}
                      </label>
                      <div className="jr-password-wrap">
                        <input
                          className="jr-input"
                          id="password"
                          name="password"
                          type={showPw ? 'text' : 'password'}
                          placeholder={copy.passwordPh}
                          autoComplete="new-password"
                          value={form.password}
                          onChange={(ev) => update('password', ev.target.value)}
                        />
                        <button
                          className="jr-toggle"
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                        >
                          {showPw ? copy.hide : copy.show}
                        </button>
                      </div>
                      <p className="jr-help">{copy.passwordHelp}</p>
                      <p className="jr-error">{copy.passwordErr}</p>
                    </div>
                    <div className={fieldClass('password2')} data-field="password2">
                      <label className="jr-label" htmlFor="password2">
                        <span className="jr-required">{copy.required}</span>
                        {copy.password2}
                      </label>
                      <div className="jr-password-wrap">
                        <input
                          className="jr-input"
                          id="password2"
                          name="password2"
                          type={showPw2 ? 'text' : 'password'}
                          placeholder={copy.password2Ph}
                          autoComplete="new-password"
                          value={form.password2}
                          onChange={(ev) => update('password2', ev.target.value)}
                        />
                        <button
                          className="jr-toggle"
                          type="button"
                          onClick={() => setShowPw2((v) => !v)}
                        >
                          {showPw2 ? copy.hide : copy.show}
                        </button>
                      </div>
                      <p className="jr-error">{copy.password2Err}</p>
                    </div>
                  </div>
                </div>

                <label className={`jr-consent${fieldErrors.consent ? ' is-error' : ''}`} data-field="consent">
                  <input
                    type="checkbox"
                    id="consent"
                    name="consent"
                    checked={form.consent}
                    onChange={(ev) => update('consent', ev.target.checked)}
                  />
                  <span>
                    {copy.consent}
                    <span className="jr-error">{copy.consentErr}</span>
                  </span>
                </label>

                <div className="jr-submit-area">
                  <button className="jr-submit" type="submit" disabled={loading}>
                    <span>{loading ? copy.submitting : copy.submit}</span>
                    <ArrowIcon />
                  </button>
                  <p className="jr-login-note">
                    {copy.loginNote}
                    {' '}
                    <Link to="/business/login">{copy.loginLink}</Link>
                    {copy.loginNoteSuffix ? ` ${copy.loginNoteSuffix}` : null}
                  </p>
                </div>
              </form>
            </section>
          </div>
        </section>
      </main>

      <div className={`jr-toast${toastOpen ? ' is-show' : ''}`} id="register-toast" role="status" aria-live="polite" aria-atomic="true">
        <button className="jr-toast-close" type="button" aria-label="Close" onClick={() => setToastOpen(false)}>×</button>
        <strong>{copy.toastTitle}</strong>
        <p>{copy.toastBody}</p>
      </div>

      <footer className="jr-footer-note">{copy.footer}</footer>
    </div>
  );
};

export default Register;
