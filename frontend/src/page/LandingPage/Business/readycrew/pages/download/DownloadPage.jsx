import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../../../../../context/LanguageContext';
import { getBusinessDownloadCopy } from '../../../../../../i18n/businessApp/businessDownload';
import apiService from '../../../../../../services/api';
import heroImage from '../../../../../../assets/business-download-hero.jpg';
import './businessDownload.css';

const EMPTY = { company: '', email: '', business: '' };

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 4 4L20 5" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
}

function emailOK(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
}

function triggerBrowserDownload(url, fileName) {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'JobShare_Business_Service_Guide.pdf';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function DownloadPage() {
  const { language } = useLanguage();
  const copy = useMemo(() => getBusinessDownloadCopy(language), [language]);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    document.title = copy.metaTitle;
  }, [copy.metaTitle]);

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
    };
    setErrors(next);
    return !next.company && !next.email && !next.business;
  }, [form]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError('');
    try {
      const res = await apiService.requestBusinessDocumentDownload({
        company: form.company.trim(),
        email: form.email.trim(),
        business: form.business.trim(),
        lang: language,
      });
      if (res?.success) {
        const url = res.data?.downloadUrl || '/documents/JobShare_Business_Service_Guide.pdf';
        const fileName = res.data?.fileName || 'JobShare_Business_Service_Guide.pdf';
        triggerBrowserDownload(url, fileName);
        setToastOpen(true);
        setTimeout(() => setToastOpen(false), 5200);
      } else {
        setSubmitError(res?.message || copy.submitError);
      }
    } catch (err) {
      setSubmitError(err.message || copy.submitError);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (name) => `jd-field${errors[name] ? ' is-error' : ''}`;

  return (
    <div className="jd-download-page">
      <Helmet>
        <title>{copy.metaTitle}</title>
        <meta name="description" content={copy.metaDescription} />
      </Helmet>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700;800&display=swap" rel="stylesheet" />

      <main className="jd-page" lang={language === 'ja' ? 'ja' : language}>
        <section className="jd-hero" aria-labelledby="download-title">
          <div className="jd-wrap jd-hero-inner">
            <div>
              <p className="jd-kicker">{copy.kicker}</p>
              <h1 id="download-title">
                {copy.heroTitle}
                <em>{copy.heroEm}</em>
              </h1>
              <p className="jd-lead">
                <span className="jd-lead-line">{copy.lead1}</span>
                <span className="jd-lead-line">{copy.lead2}</span>
              </p>
              <div className="jd-hero-note">
                <span><CheckIcon />{copy.note1}</span>
                <span><CheckIcon />{copy.note2}</span>
              </div>
            </div>
            <figure className="jd-photo">
              <img src={heroImage} alt={copy.photoAlt} />
              <figcaption className="jd-photo-cap">{copy.photoCap}</figcaption>
            </figure>
          </div>
        </section>

        <section className="jd-main">
          <div className="jd-wrap jd-grid">
            <aside className="jd-preview-shell" aria-label={copy.previewLabel}>
              <div className="jd-preview-label">
                <span>{copy.previewLabel}</span>
                <span>{copy.previewBadge}</span>
              </div>
              <div className="jd-doc">
                <div className="jd-cover" role="img" aria-label={copy.coverTitle}>
                  <div>
                    <div className="jd-cover-top">
                      <small>{copy.coverSmall}</small>
                      <h2>{copy.coverTitle}</h2>
                      <p>{copy.coverDesc}</p>
                    </div>
                    <div className="jd-cover-badges">
                      {copy.coverBadges.map((b) => (
                        <span key={b} className="jd-badge">{b}</span>
                      ))}
                    </div>
                  </div>
                  <div className="jd-cover-panel">
                    <strong>{copy.coverPanelTitle}</strong>
                    <div className="jd-cover-stats">
                      {copy.coverStats.map((s) => (
                        <div key={s.num} className="jd-stat">
                          <b>{s.num}</b>
                          <span>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="jd-preview-copy">
                <h3>{copy.previewTitle}</h3>
                <p>{copy.previewBody}</p>
                <ul className="jd-preview-list">
                  {copy.previewList.map((item) => (
                    <li key={item}>
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <section className="jd-form-shell" aria-labelledby="form-title">
              <div className="jd-form-head">
                <small>{copy.formKicker}</small>
                <h2 id="form-title">{copy.formTitle}</h2>
                <p>{copy.formDesc}</p>
              </div>
              <form id="download-form" className="jd-form" noValidate onSubmit={onSubmit}>
                {submitError ? <p className="jd-form-error" role="alert">{submitError}</p> : null}

                <div className={fieldClass('company')} data-field="company">
                  <label className="jd-label" htmlFor="company">
                    <span>{copy.company}</span>
                    <span className="jd-required">{copy.required}</span>
                  </label>
                  <input
                    className="jd-input"
                    id="company"
                    name="company"
                    type="text"
                    placeholder={copy.companyPh}
                    autoComplete="organization"
                    value={form.company}
                    onChange={(ev) => update('company', ev.target.value)}
                  />
                  <p className="jd-error">{copy.companyErr}</p>
                </div>

                <div className={fieldClass('email')} data-field="email">
                  <label className="jd-label" htmlFor="email">
                    <span>{copy.email}</span>
                    <span className="jd-required">{copy.required}</span>
                  </label>
                  <input
                    className="jd-input"
                    id="email"
                    name="email"
                    type="email"
                    placeholder={copy.emailPh}
                    autoComplete="email"
                    value={form.email}
                    onChange={(ev) => update('email', ev.target.value)}
                  />
                  <p className="jd-error">{copy.emailErr}</p>
                </div>

                <div className={fieldClass('business')} data-field="business">
                  <label className="jd-label" htmlFor="business">
                    <span>{copy.business}</span>
                    <span className="jd-required">{copy.required}</span>
                  </label>
                  <input
                    className="jd-input"
                    id="business"
                    name="business"
                    type="text"
                    placeholder={copy.businessPh}
                    value={form.business}
                    onChange={(ev) => update('business', ev.target.value)}
                  />
                  <p className="jd-error">{copy.businessErr}</p>
                </div>

                <div className="jd-submit-area">
                  <p className="jd-privacy">{copy.privacy}</p>
                  <button className="jd-submit" type="submit" disabled={loading}>
                    <span>{loading ? copy.submitting : copy.submit}</span>
                    <ArrowDownIcon />
                  </button>
                </div>
              </form>
            </section>
          </div>
        </section>
      </main>

      <div className={`jd-toast${toastOpen ? ' is-show' : ''}`} id="success-toast" role="status" aria-live="polite">
        <button className="jd-toast-close" type="button" aria-label="Close" onClick={() => setToastOpen(false)}>×</button>
        <strong>{copy.toastTitle}</strong>
        <p>{copy.toastBody}</p>
      </div>

      <footer className="jd-footer-note">{copy.footer}</footer>
    </div>
  );
}
