import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useCandidateAuth } from '../../../context/CandidateAuthContext';
import apiService from '../../../services/api';
import { getRecruitmentLocationLabel } from '../../../utils/recruitmentLocationLabels';
import { getResidenceStatusLabel, normalizeResidenceStatusValues } from '../../../utils/residenceStatusLabels';
import { rootFor } from '../../templates/JobShare_Jobs_V3_20261007/dist/ui.js';
import { useLandingLocale } from '../lib/useLandingLocale';
import { JOBS_V3_CATEGORY_TREE } from './jobsV3Catalog';
import { DetailIcon, detailIconFor, detailToneFor } from './jobDetailV2Icons';
import { detailCopy } from './publicJobCopy';
import {
  buildJobDetailSections,
  categoryName,
  companyName,
  displaySalary,
  formatJobDate,
  jobLocations,
  jobWorkLocation,
  localizedField,
  parseJobDetailResponse,
  parseJobsListResponse,
  recruitmentLabel,
} from './publicJobModel';
import './job-detail-v2-styles.scoped.css';
import './job-detail-v2-overrides.css';

const SECTION_IDS = ['overview', 'requirements', 'conditions', 'benefits', 'process', 'company'];
const SECTION_ICONS = {
  overview: 'briefcase',
  requirements: 'check',
  conditions: 'yen',
  benefits: 'gift',
  process: 'layers',
  company: 'building',
};
const JD_FILE_TYPES = ['jdFile', 'jdFileEn', 'jdFileJp', 'jdOriginalFile', 'requiredCvForm'];
const BULLET = /^[・•●■]\s*/;

/** JA: tiêu đề đã ghi 年収/月給 nên bỏ chữ lặp ở đầu con số (giữ nguyên khoảng tiền). */
function stripSalaryLead(value, kind, lang) {
  if (lang !== 'ja' || !value) return value;
  if (kind === 'yearly') return value.replace(/^年収\s*[:：]?\s*/, '');
  if (kind === 'monthly') return value.replace(/^月給\s*[:：]?\s*/, '');
  return value;
}

function categoryOf(job, lang) {
  const root = rootFor(job?.jobCategoryId ?? job?.category?.id, JOBS_V3_CATEGORY_TREE);
  return {
    tone: detailToneFor(root?.id),
    icon: detailIconFor(root?.id),
    name: categoryName(job, lang) || localizedField(root, 'name', lang),
  };
}

/** Văn bản JD: dòng `・` thành danh sách, dòng ngắn kết thúc bằng `:` thành tiêu đề phụ, còn lại là đoạn văn. */
function ContentLines({ text }) {
  const blocks = [];
  let items = [];
  const flush = () => {
    if (items.length) blocks.push({ type: 'list', items });
    items = [];
  };
  String(text || '')
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .forEach((line) => {
      if (BULLET.test(line)) {
        items.push(line.replace(BULLET, ''));
        return;
      }
      flush();
      blocks.push({ type: /[:：]\s*$/.test(line) && line.length < 100 ? 'heading' : 'text', text: line });
    });
  flush();

  return blocks.map((b, i) => {
    if (b.type === 'list') {
      return (
        <ul key={i} className="jd-lines">
          {b.items.map((item, j) => (
            <li key={j}>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (b.type === 'heading') {
      return (
        <h3 key={i} className="subheading">
          {b.text}
        </h3>
      );
    }
    return (
      <p key={i} className="content-intro">
        {b.text}
      </p>
    );
  });
}

function DetailRow({ row }) {
  return (
    <div className="benefit-row">
      <h3>{row.label}</h3>
      <div className="section-body">
        {row.items ? (
          <ul className="jd-lines">
            {row.items.map((item, i) => (
              <li key={i}>
                <span>{item.replace(BULLET, '')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-paragraphs">
            <ContentLines text={row.text} />
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({ id, title, children }) {
  return (
    <section id={id} className={`section-card section-${id}`} aria-labelledby={`heading-${id}`}>
      <div className="section-title">
        <span className="section-symbol">
          <DetailIcon name={SECTION_ICONS[id]} />
        </span>
        <h2 id={`heading-${id}`}>{title}</h2>
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}

function RelatedCard({ job, lang, t, jobsBasePath }) {
  const href = `${jobsBasePath.replace(/\/+$/, '')}/${job.id}`;
  const cat = categoryOf(job, lang);
  const loc = jobLocations(job, lang).split(' · ')[0];
  const sal = displaySalary(job, lang);
  const salary = sal.primaryLabel === 'detail' ? '' : stripSalaryLead(sal.primary, sal.primaryLabel, lang);
  return (
    <article className={`related-card tone-${cat.tone}`}>
      <div className="rel-top">
        <span className="rel-icon">
          <DetailIcon name={cat.icon} />
        </span>
        <span>{cat.name}</span>
      </div>
      <h3>
        <Link to={href}>{localizedField(job, 'title', lang)}</Link>
      </h3>
      {loc ? (
        <p className="rel-meta">
          <DetailIcon name="pin" />
          <span>{loc}</span>
        </p>
      ) : null}
      {salary ? <div className="rel-salary">{salary}</div> : null}
      <Link className="rel-detail" to={href}>
        {t.viewDetail}
        <DetailIcon name="arrow" />
      </Link>
    </article>
  );
}

function SecondaryActions({ t, files, onCopy, onDownload, withFeedback }) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !pickerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <>
      <div className="secondary-actions">
        <button className="action-secondary" type="button" onClick={onCopy}>
          <DetailIcon name="copy" />
          <span>{t.copy}</span>
        </button>
        {files.length ? (
          <div className="file-picker" ref={pickerRef}>
            <button
              type="button"
              className="action-secondary"
              aria-expanded={open}
              aria-haspopup="true"
              onClick={() => setOpen((v) => !v)}
            >
              <DetailIcon name="download" />
              <span>{t.download}</span>
            </button>
            {open ? (
              <div className="download-menu">
                {files.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onDownload(type);
                    }}
                  >
                    {t.fileNames[type]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {withFeedback ? <p className="action-feedback" aria-live="polite" /> : null}
    </>
  );
}

export default function JobDetails({
  jobsBasePath,
  registerPath = '/register',
  loginPath = '/candidate/login',
  persona = 'collaborator',
}) {
  const { jobId } = useParams();
  const location = useLocation();
  const lang = useLandingLocale();
  const t = detailCopy(lang);
  const isCandidatePersona = persona === 'candidate';
  const { isAuthenticated } = useCandidateAuth();

  const primaryCta = useMemo(() => {
    const jobsRoot = jobsBasePath.replace(/\/+$/, '');
    if (isCandidatePersona) {
      if (isAuthenticated && jobId) {
        return { to: `${jobsRoot}/${jobId}/nominate`, label: t.apply, state: undefined };
      }
      return { to: loginPath, label: t.applyLogin, state: { from: location.pathname } };
    }
    return { to: registerPath, label: t.suggest, state: undefined };
  }, [
    isCandidatePersona,
    isAuthenticated,
    jobId,
    jobsBasePath,
    loginPath,
    registerPath,
    location.pathname,
    t.apply,
    t.applyLogin,
    t.suggest,
  ]);

  const [job, setJob] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [activeSection, setActiveSection] = useState('');
  const toastTimer = useRef(null);

  const sections = useMemo(() => (job ? buildJobDetailSections(job, lang) : null), [job, lang]);

  const loadDetail = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError('');
    try {
      const response = await apiService.getPublicApplicantJobById(jobId);
      const detail = parseJobDetailResponse(response);
      setJob(detail);

      const catId = detail.jobCategoryId ?? detail.category?.id;
      if (catId) {
        try {
          const listRes = await apiService.getPublicApplicantJobs({
            jobCategoryIds: String(catId),
            limit: 4,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
          });
          const { jobs: list } = parseJobsListResponse(listRes);
          setRelated(list.filter((j) => String(j.id) !== String(detail.id)).slice(0, 3));
        } catch {
          setRelated([]);
        }
      } else {
        setRelated([]);
      }
    } catch (e) {
      console.error('[JobDetails]', e);
      setJob(null);
      setRelated([]);
      setError(t.failedLoad);
    } finally {
      setLoading(false);
    }
  }, [jobId, t.failedLoad]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const onCopyUrl = async () => {
    const url = `${window.location.origin}${jobsBasePath.replace(/\/+$/, '')}/${jobId}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(t.copied);
    } catch {
      showToast(t.copyErr, true);
    }
  };

  const onDownload = async (fileType) => {
    try {
      await apiService.downloadJobFile(job.id, fileType, 'applicant');
    } catch (e) {
      console.warn('[JobDetails] JD download', e);
      showToast(t.failedDownload, true);
    }
  };

  const visibleSections = useMemo(() => {
    if (!sections) return [];
    return SECTION_IDS.filter((id) => {
      if (id === 'overview') return !!sections.overview;
      if (id === 'requirements') return sections.requirements.length > 0;
      if (id === 'conditions') return true;
      if (id === 'benefits') return sections.benefitRows.length > 0;
      if (id === 'process') return !!sections.process;
      return !!sections.company;
    });
  }, [sections]);

  useEffect(() => {
    if (!visibleSections.length || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-118px 0px -68% 0px', threshold: 0 },
    );
    visibleSections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [visibleSections]);

  if (loading || error || !job) {
    return (
      <div className="jobshare-job-detail-v2">
        <div className="wrap detail-layout detail-layout--state">
          <div className={`loading-state${loading ? '' : ' error-state'}`} role={loading ? 'status' : 'alert'}>
            {loading ? (
              t.loading
            ) : (
              <>
                {error || t.noData} <Link to={jobsBasePath}>{t.back}</Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const title = localizedField(job, 'title', lang);
  const cat = categoryOf(job, lang);
  const company = companyName(job, lang);
  const workLoc = jobWorkLocation(job, lang);
  const recruitArea =
    localizedField(job, 'recruitmentLocationLabel', lang)
    || job.recruitmentLocationText
    || getRecruitmentLocationLabel(job.interviewLocation ?? job.interview_location, lang);
  const employ = recruitmentLabel(job.recruitmentType, lang);
  const visa = normalizeResidenceStatusValues(
    job.residenceStatuses ?? job.residenceStatus ?? job.residence_status,
  )
    .map((code) => getResidenceStatusLabel(code, lang))
    .join(lang === 'ja' ? '、' : ', ');
  const supportingMeta = [
    [t.employment, employ, 'briefcase'],
    [t.visa, visa, 'document'],
  ].filter((x) => x[1]);

  const sal = displaySalary(job, lang);
  const salIsDetail = sal.primaryLabel === 'detail';
  const salLabel = salIsDetail ? t.salaryDetail : sal.primaryLabel === 'yearly' ? t.salary : t.monthly;
  const salPrimary = stripSalaryLead(sal.primary, sal.primaryLabel, lang);
  const salMonthly = stripSalaryLead(sal.secondary, 'monthly', lang);
  const salaryDetailNote = salIsDetail ? '' : buildSalaryDetailNote(job, lang);

  const locationCards = [
    [t.work, workLoc, 'pin', 'work'],
    [t.recruitment, recruitArea, 'users', 'recruit'],
  ].filter((x) => x[1]);
  const files = JD_FILE_TYPES.filter((type) => String(job[type] || '').trim());
  const created = job.createdAt ? formatJobDate(job.createdAt, lang) : '';
  const updated = job.updatedAt ? formatJobDate(job.updatedAt, lang) : '';

  const infoFields = [
    [salLabel, salPrimary, salIsDetail],
    [t.monthly, salMonthly],
    [t.work, workLoc],
    [t.employment, employ],
    [t.recruitment, recruitArea],
    [t.visa, visa],
  ].filter((x) => x[1]);
  const workRows = [
    ...(salaryDetailNote ? [{ label: t.salaryDetailRow, text: salaryDetailNote }] : []),
    ...sections.workRows,
  ];

  const ctaButton = (
    <Link to={primaryCta.to} state={primaryCta.state} className="action-primary">
      <DetailIcon name="user" />
      {primaryCta.label}
      <DetailIcon name="arrow" />
    </Link>
  );

  return (
    <div className="jobshare-job-detail-v2">
      <Helmet>
        <title>{`${title} | JobShare`}</title>
      </Helmet>

      <div className="detail-band">
        <div className="wrap">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to={jobsBasePath}>{t.jobs}</Link>
            <DetailIcon name="chevron" />
            <strong>{t.detail}</strong>
          </nav>
        </div>
      </div>

      <main id="detail-content">
        <div className="wrap detail-layout">
          <div className={`detail-main tone-${cat.tone}`}>
            <article className="overview-card" aria-labelledby="job-title">
              <div className="overview-top">
                <span className="cat-icon">
                  <DetailIcon name={cat.icon} />
                </span>
                {cat.name ? <span className="category-pill">{cat.name}</span> : null}
              </div>
              <h1 id="job-title">{title}</h1>
              {company ? (
                <div className="company-line">
                  <DetailIcon name="building" />
                  {company}
                </div>
              ) : null}

              {locationCards.length ? (
                <div className={`location-grid${locationCards.length === 1 ? ' location-grid--single' : ''}`}>
                  {locationCards.map(([label, value, icon, tone]) => (
                    <div key={tone} className={`location-tile location-tile--${tone}`}>
                      <span className="location-icon">
                        <DetailIcon name={icon} />
                      </span>
                      <div className="location-copy">
                        <p className="location-label">{label}</p>
                        <p className="location-value">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {supportingMeta.length ? (
                <div className="overview-meta">
                  {supportingMeta.map(([label, value, icon]) => (
                    <div key={label} className="meta">
                      <span className="meta-icon">
                        <DetailIcon name={icon} />
                      </span>
                      <span className="meta-copy">
                        <span className="meta-label">{label}</span>
                        <span className="meta-value">{value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              {salPrimary ? (
                <div className={`salary-panel${salIsDetail ? ' salary-panel--detail' : ''}`}>
                  <div className="salary-primary">
                    <span className="salary-orb">
                      <DetailIcon name="yen" />
                    </span>
                    <div className="salary-copy">
                      <p className="salary-kicker">{salLabel}</p>
                      <p className="salary-value">{salPrimary}</p>
                    </div>
                  </div>
                  {salMonthly ? (
                    <div className="monthly">
                      <p className="salary-kicker">{t.monthly}</p>
                      <strong>{salMonthly}</strong>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="micro-row">
                {job.jobCode ? (
                  <span>
                    {t.jobId}: <b>{job.jobCode}</b>
                  </span>
                ) : null}
                {created ? (
                  <span>
                    {t.created}: <b>{created}</b>
                  </span>
                ) : null}
                {updated ? (
                  <span>
                    {t.updated}: <b>{updated}</b>
                  </span>
                ) : null}
              </div>
              <div className="mobile-actions">
                <SecondaryActions t={t} files={files} onCopy={onCopyUrl} onDownload={onDownload} />
              </div>
            </article>

            {visibleSections.length > 1 ? (
              <nav className="section-links" aria-label={t.overview}>
                {visibleSections.map((id) => (
                  <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'true' : undefined}>
                    {t[id]}
                  </a>
                ))}
              </nav>
            ) : null}

            {sections.overview ? (
              <SectionCard id="overview" title={t.overview}>
                <h3 className="subheading">{sections.overview.label}</h3>
                <ContentLines text={sections.overview.text} />
              </SectionCard>
            ) : null}

            {sections.requirements.length ? (
              <SectionCard id="requirements" title={t.requirements}>
                {sections.requirements.map((group) => (
                  <div key={group.label} className={`req-group ${group.required ? 'required' : 'preferred'}`}>
                    <h3 className="subheading">
                      <DetailIcon name={group.required ? 'check' : 'star'} />
                      {group.label}
                    </h3>
                    <ul className={`jd-lines${group.required ? ' required' : ''}`}>
                      {group.items.map((item, i) => (
                        <li key={i}>
                          <span>{item.replace(/^[■•・]\s*/, '')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </SectionCard>
            ) : null}

            <SectionCard id="conditions" title={t.conditions}>
              {infoFields.length ? (
                <dl className="info-fields">
                  {infoFields.map(([label, value, multiline]) => (
                    <div key={label} className={`info-row${multiline ? ' info-row--multiline' : ''}`}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {workRows.map((row) => (
                <DetailRow key={row.label} row={row} />
              ))}
            </SectionCard>

            {sections.benefitRows.length ? (
              <SectionCard id="benefits" title={t.benefits}>
                {sections.benefitRows.map((row) => (
                  <DetailRow key={row.label} row={row} />
                ))}
              </SectionCard>
            ) : null}

            {sections.process ? (
              <SectionCard id="process" title={t.process}>
                <div className="process-text">
                  {sections.process.map((block) => `${block.label}\n${block.text}`).join('\n\n')}
                </div>
              </SectionCard>
            ) : null}

            {sections.company ? (
              <SectionCard id="company" title={t.company}>
                {sections.company.info ? <div className="company-info">{sections.company.info}</div> : null}
                {sections.company.text ? (
                  <div className="text-paragraphs">
                    {sections.company.text
                      .split(/\n\s*\n/)
                      .filter(Boolean)
                      .map((p, i) => (
                        <p key={i}>{p.replace(/\n/g, ' ')}</p>
                      ))}
                  </div>
                ) : null}
              </SectionCard>
            ) : null}

            {related.length ? (
              <section className="related-section" aria-labelledby="related-heading">
                <div className="related-head">
                  <h2 id="related-heading">
                    <span className="related-heading-icon">
                      <DetailIcon name="layers" />
                    </span>
                    {t.related}
                  </h2>
                  <Link to={jobsBasePath}>
                    {t.viewAll} <DetailIcon name="arrow" />
                  </Link>
                </div>
                <div className="related-grid">
                  {related.map((r) => (
                    <RelatedCard key={r.id} job={r} lang={lang} t={t} jobsBasePath={jobsBasePath} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="detail-side" aria-label={primaryCta.label}>
            <div className="action-card">
              {salPrimary ? (
                <>
                  <p className="side-kicker">{salLabel}</p>
                  <p className={`side-salary${salIsDetail ? ' side-salary--detail' : ''}`}>{salPrimary}</p>
                  {salMonthly ? (
                    <p className="side-month">
                      {t.monthly}: {salMonthly}
                    </p>
                  ) : null}
                </>
              ) : null}
              {ctaButton}
              <div className="action-divider" />
              <SecondaryActions t={t} files={files} onCopy={onCopyUrl} onDownload={onDownload} withFeedback />
              <div className="side-meta">
                {job.jobCode ? (
                  <span>
                    {t.jobId}: <b>{job.jobCode}</b>
                  </span>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <div className="mobile-sticky">{ctaButton}</div>
      {toast ? (
        <div id="toast" role="status" aria-live="polite" style={{ background: toast.isError ? '#be1824' : undefined }}>
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}

/** «Chi tiết mức lương» hiển thị thêm trong mục điều kiện khi phần lương chính đã là khoảng lương ngắn. */
function buildSalaryDetailNote(job, lang) {
  const rows = Array.isArray(job?.salaryRangeDetails)
    ? job.salaryRangeDetails
    : job?.salaryRangeDetails
      ? [job.salaryRangeDetails]
      : [];
  return rows
    .map((r) => localizedField(r, 'content', lang))
    .filter(Boolean)
    .join('\n');
}
