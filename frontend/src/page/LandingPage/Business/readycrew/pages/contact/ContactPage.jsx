import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../../../../../context/LanguageContext';
import { getBusinessContactCopy } from '../../../../../../i18n/businessApp/businessContact';
import apiService from '../../../../../../services/api';
import heroImage from '../../../../../../assets/business-contact-hero.jpg';
import './businessContact.css';

const EMPTY = { company: '', email: '', business: '', message: '' };

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 4 4L20 5" />
    </svg>
  );
}

function SideIconBuilding() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21h18M5 21V6l7-3 7 3v15M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1" />
    </svg>
  );
}

function SideIconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function SideIconDoc() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16v16H4zM8 9h8M8 13h5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12h17m-6-6 6 6-6 6" />
    </svg>
  );
}

const SIDE_ICONS = [SideIconBuilding, SideIconSearch, SideIconDoc];

function emailOK(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
}

export default function ContactPage() {
  const { language } = useLanguage();
  const copy = useMemo(() => getBusinessContactCopy(language), [language]);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    document.title = copy.metaTitle;
  }, [copy.metaTitle]);

  useEffect(() => {
    if (!toastOpen) return undefined;
    const t = setTimeout(() => setToastOpen(false), 7000);
    return () => clearTimeout(t);
  }, [toastOpen]);

  const update = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: false }));
    setSubmitError('');
  }, []);

  const validate = useCallback(() => {
    const next = {
      company: !form.company.trim(),
      email: !emailOK(form.email),
      business: !form.business.trim(),
      message: !form.message.trim(),
    };
    setErrors(next);
    return !next.company && !next.email && !next.business && !next.message;
  }, [form]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError('');
    try {
      const res = await apiService.requestBusinessContactInquiry({
        company: form.company.trim(),
        email: form.email.trim(),
        business: form.business.trim(),
        message: form.message.trim(),
        lang: language,
      });
      if (res?.success) {
        setForm(EMPTY);
        setToastOpen(true);
      } else {
        setSubmitError(res?.message || copy.submitError);
      }
    } catch (err) {
      setSubmitError(err.message || copy.submitError);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (name) => `jc-field${errors[name] ? ' is-error' : ''}`;

  return (
    <div className="jc-contact-page">
      <Helmet>
        <title>{copy.metaTitle}</title>
        <meta name="description" content={copy.metaDescription} />
      </Helmet>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700;800&display=swap" rel="stylesheet" />

      <main className="jc-page" lang={language === 'ja' ? 'ja' : language}>
        <section className="jc-hero" aria-labelledby="contact-title">
          <div className="jc-wrap jc-hero-inner">
            <div>
              <p className="jc-kicker">{copy.kicker}</p>
              <h1 id="contact-title">
                {copy.heroTitle}
                <em>{copy.heroEm}</em>
              </h1>
              <p className="jc-lead">
                <span className="jc-lead-line">{copy.lead1}</span>
                <span className="jc-lead-line">{copy.lead2}</span>
                <span className="jc-lead-line">{copy.lead3}</span>
              </p>
              <div className="jc-hero-note">
                <span><CheckIcon />{copy.note1}</span>
                <span><CheckIcon />{copy.note2}</span>
              </div>
            </div>
            <figure className="jc-photo">
              <img src={heroImage} alt={copy.photoAlt} />
              <figcaption className="jc-photo-cap">{copy.photoCap}</figcaption>
            </figure>
          </div>
        </section>

        <section className="jc-main" aria-labelledby="form-title">
          <div className="jc-wrap jc-grid">
            <aside className="jc-side">
              <h2>
                <span className="jc-side-title-line">{copy.sideTitle1}</span>
                <span className="jc-side-title-line">{copy.sideTitle2}</span>
              </h2>
              <p>{copy.sideDesc}</p>
              <ul className="jc-list">
                {copy.sideList.map((text, i) => {
                  const Icon = SIDE_ICONS[i] || SideIconBuilding;
                  return (
                    <li key={text}>
                      <Icon />
                      <span>{text}</span>
                    </li>
                  );
                })}
              </ul>
            </aside>

            <div className="jc-form-shell">
              <header className="jc-form-head">
                <small>{copy.formKicker}</small>
                <h2 id="form-title">{copy.formTitle}</h2>
                <p><span aria-hidden="true">※</span> {copy.formDesc}</p>
              </header>
              <form className="jc-form" id="jobshare-contact-form" noValidate onSubmit={onSubmit}>
                {submitError ? (
                  <p className="jc-error" style={{ display: 'block', marginBottom: 8 }} role="alert">
                    {submitError}
                  </p>
                ) : null}

                <div className={fieldClass('company')}>
                  <label className="jc-label" htmlFor="company">
                    <span className="jc-required">{copy.required}</span>
                    {copy.company}
                  </label>
                  <input
                    className="jc-input"
                    id="company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    placeholder={copy.companyPh}
                    value={form.company}
                    onChange={(ev) => update('company', ev.target.value)}
                    aria-invalid={errors.company ? 'true' : 'false'}
                  />
                  <p className="jc-error">{copy.companyErr}</p>
                </div>

                <div className={fieldClass('email')}>
                  <label className="jc-label" htmlFor="email">
                    <span className="jc-required">{copy.required}</span>
                    {copy.email}
                  </label>
                  <input
                    className="jc-input"
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder={copy.emailPh}
                    value={form.email}
                    onChange={(ev) => update('email', ev.target.value)}
                    aria-invalid={errors.email ? 'true' : 'false'}
                  />
                  <p className="jc-error">{copy.emailErr}</p>
                </div>

                <div className={fieldClass('business')}>
                  <label className="jc-label" htmlFor="business">
                    <span className="jc-required">{copy.required}</span>
                    {copy.business}
                  </label>
                  <input
                    className="jc-input"
                    id="business"
                    name="business"
                    type="text"
                    placeholder={copy.businessPh}
                    value={form.business}
                    onChange={(ev) => update('business', ev.target.value)}
                    aria-invalid={errors.business ? 'true' : 'false'}
                  />
                  <p className="jc-error">{copy.businessErr}</p>
                </div>

                <div className={fieldClass('message')}>
                  <label className="jc-label" htmlFor="message">
                    <span className="jc-required">{copy.required}</span>
                    {copy.message}
                  </label>
                  <textarea
                    className="jc-textarea"
                    id="message"
                    name="message"
                    placeholder={copy.messagePh}
                    value={form.message}
                    onChange={(ev) => update('message', ev.target.value)}
                    aria-invalid={errors.message ? 'true' : 'false'}
                  />
                  <p className="jc-error">{copy.messageErr}</p>
                </div>

                <div className="jc-submit-row">
                  <p className="jc-privacy">{copy.privacy}</p>
                  <button className="jc-submit" type="submit" disabled={loading}>
                    <span>{loading ? copy.submitting : copy.submit}</span>
                    <ArrowIcon />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      <div
        className={`jc-toast${toastOpen ? ' is-show' : ''}`}
        id="contact-toast"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <button
          className="jc-toast-close"
          type="button"
          aria-label={copy.toastClose}
          onClick={() => setToastOpen(false)}
        >
          ×
        </button>
        <strong>{copy.toastTitle}</strong>
        <p>{copy.toastBody}</p>
      </div>

      <div className="jc-footer-note">{copy.footer}</div>
    </div>
  );
}
