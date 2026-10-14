import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useCandidateAuth } from '../../../context/CandidateAuthContext';
import {
  ArrowRight,
  Briefcase,
  Building2,
  ChevronRight,
  Copy,
  MapPin,
  UserPlus,
  Wallet,
} from 'lucide-react';
import apiService from '../../../services/api';
import { landingBtnPrimary, landingContainer } from '../lib/landingUi';
import { useLandingLocale } from '../lib/useLandingLocale';
import { detailCopy } from './publicJobCopy';
import './jobs-v3-overrides.css';
import {
  buildJobDetailSections,
  categoryName,
  companyName,
  displaySalary,
  formatJobDate,
  jobLocations,
  localizedField,
  parseJobDetailResponse,
  parseJobsListResponse,
  recruitmentLabel,
  toneBorderClass,
} from './publicJobModel';

function TextBlock({ text }) {
  if (!text) return null;
  const paragraphs = String(text).split(/\n\s*\n/).filter(Boolean);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-[#2f4d5c]">
      {paragraphs.map((p) => (
        <p key={p.slice(0, 40)} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

function BulletList({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="mt-2 space-y-2 text-sm text-[#2f4d5c]">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#be1824]" aria-hidden />
          <span className="whitespace-pre-line">{item.replace(/^[■•・]\s*/, '')}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionCard({ id, title, icon: Icon, children }) {
  if (!children) return null;
  return (
    <section id={id} className="border border-[#d7e2e8] bg-white p-5 sm:p-6" aria-labelledby={`heading-${id}`}>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#be1824]" aria-hidden />
        <h2 id={`heading-${id}`} className="text-lg font-extrabold text-[#112f3d]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function RelatedCard({ job, lang, t, jobsBasePath }) {
  const href = `${jobsBasePath.replace(/\/+$/, '')}/${job.id}`;
  const sal = displaySalary(job, lang);
  return (
    <article className={`border border-[#d7e2e8] bg-white p-4 border-l-4 ${toneBorderClass(job)}`}>
      <p className="text-xs font-bold uppercase text-[#5a7380]">{categoryName(job, lang)}</p>
      <h3 className="mt-2 text-base font-bold text-[#112f3d]">
        <Link to={href} className="hover:text-[#be1824] hover:underline">
          {localizedField(job, 'title', lang)}
        </Link>
      </h3>
      {jobLocations(job, lang) ? (
        <p className="mt-2 flex items-center gap-1 text-sm text-[#2f4d5c]">
          <MapPin className="h-3.5 w-3.5 text-[#be1824]" aria-hidden />
          {jobLocations(job, lang)}
        </p>
      ) : null}
      {sal.primary ? <p className="mt-2 text-sm font-semibold text-[#112f3d]">{sal.primary}</p> : null}
      <Link to={href} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#be1824]">
        {t.viewDetail}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </article>
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
        return {
          to: `${jobsRoot}/${jobId}/nominate`,
          label: t.apply,
          state: undefined,
          solidCta: true,
        };
      }
      return {
        to: loginPath,
        label: t.applyLogin,
        state: { from: location.pathname },
        solidCta: true,
      };
    }
    return {
      to: registerPath,
      label: t.suggest,
      state: undefined,
      solidCta: false,
    };
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
  const [copyMsg, setCopyMsg] = useState('');

  const sections = useMemo(
    () => (job ? buildJobDetailSections(job, lang) : null),
    [job, lang],
  );

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

  const onCopyUrl = async () => {
    const url = `${window.location.origin}${jobsBasePath.replace(/\/+$/, '')}/${jobId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyMsg(t.copied);
      setTimeout(() => setCopyMsg(''), 3500);
    } catch {
      setCopyMsg(t.copyErr);
    }
  };

  if (loading) {
    return (
      <div className={`${landingContainer} py-16 text-center text-[#2f4d5c]`}>
        <p>{t.loading}</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className={`${landingContainer} py-16 text-center`}>
        <p className="text-[#be1824]" role="alert">
          {error || t.noData}
        </p>
        <Link to={jobsBasePath} className="mt-6 inline-block font-bold text-[#be1824] hover:underline">
          {t.back}
        </Link>
      </div>
    );
  }

  const title = localizedField(job, 'title', lang);
  const sal = displaySalary(job, lang);
  const loc = jobLocations(job, lang);
  const employ = recruitmentLabel(job.recruitmentType, lang);
  const recruitLoc =
    localizedField(job, 'recruitmentLocationLabel', lang)
    || job.recruitmentLocationText
    || '';

  const sectionNav = [
    sections?.overview && 'overview',
    sections?.requirements?.length && 'requirements',
    (sal.primary || sections?.workBenefits?.length) && 'conditions',
    sections?.benefits?.length && 'benefits',
    sections?.process && 'process',
    sections?.company && 'company',
  ].filter(Boolean);

  return (
    <>
      <Helmet>
        <title>{`${title} | JobShare`}</title>
      </Helmet>

      <div className="border-b border-[#d7e2e8] bg-[#f4f7f9] py-4">
        <div className={landingContainer}>
          <nav className="flex flex-wrap items-center gap-2 text-sm text-[#5a7380]" aria-label="Breadcrumb">
            <Link to={jobsBasePath} className="font-semibold hover:text-[#be1824]">
              {t.jobs}
            </Link>
            <ChevronRight className="h-4 w-4" aria-hidden />
            <span className="font-bold text-[#112f3d]">{t.detail}</span>
          </nav>
        </div>
      </div>

      <div className={`${landingContainer} py-8 lg:py-10`}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="min-w-0 space-y-6">
            <article
              className={`border border-[#d7e2e8] bg-white p-5 sm:p-8 border-l-4 ${toneBorderClass(job)}`}
              aria-labelledby="job-title"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-[#be1824]">
                {categoryName(job, lang)}
              </p>
              <h1 id="job-title" className="mt-2 text-2xl font-black leading-tight text-[#112f3d] sm:text-3xl">
                {title}
              </h1>
              {companyName(job, lang) ? (
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#2f4d5c]">
                  <Building2 className="h-4 w-4 text-[#be1824]" aria-hidden />
                  {companyName(job, lang)}
                </p>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {loc ? (
                  <div className="border border-[#e8eef2] bg-[#fbfcfd] p-3">
                    <p className="text-xs font-bold uppercase text-[#5a7380]">{t.work}</p>
                    <p className="mt-1 text-sm font-semibold text-[#112f3d]">{loc}</p>
                  </div>
                ) : null}
                {recruitLoc ? (
                  <div className="border border-[#e8eef2] bg-[#fbfcfd] p-3">
                    <p className="text-xs font-bold uppercase text-[#5a7380]">{t.recruitment}</p>
                    <p className="mt-1 text-sm font-semibold text-[#112f3d]">{recruitLoc}</p>
                  </div>
                ) : null}
                {employ ? (
                  <div className="border border-[#e8eef2] bg-[#fbfcfd] p-3">
                    <p className="text-xs font-bold uppercase text-[#5a7380]">{t.employment}</p>
                    <p className="mt-1 text-sm font-semibold text-[#112f3d]">{employ}</p>
                  </div>
                ) : null}
              </div>

              {sal.primary ? (
                <div className="mt-5 flex flex-wrap items-center gap-4 border border-[#efc9ce] bg-[#fff8f9] p-4">
                  <Wallet className="h-8 w-8 text-[#be1824]" aria-hidden />
                  <div>
                    <p className="text-xs font-bold uppercase text-[#be1824]">
                      {sal.primaryLabel === 'yearly' ? t.salary : t.monthly}
                    </p>
                    <p className="text-xl font-black text-[#112f3d]">{sal.primary}</p>
                    {sal.secondary ? (
                      <p className="text-sm text-[#2f4d5c]">
                        {t.monthly}: {sal.secondary}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <p className="mt-4 flex flex-wrap gap-4 text-xs text-[#5a7380]">
                {job.jobCode ? (
                  <span>
                    {t.jobId}: <strong className="text-[#112f3d]">{job.jobCode}</strong>
                  </span>
                ) : null}
                {job.createdAt ? (
                  <span>
                    {t.created}:{' '}
                    <strong className="text-[#112f3d]">{formatJobDate(job.createdAt, lang)}</strong>
                  </span>
                ) : null}
              </p>
            </article>

            {sectionNav.length > 1 ? (
              <nav
                className="flex flex-wrap gap-2 border border-[#d7e2e8] bg-white p-3"
                aria-label={t.overview}
              >
                {sectionNav.map((id) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="rounded-sm px-3 py-1.5 text-sm font-bold text-[#112f3d] hover:bg-[#f4f7f9]"
                  >
                    {t[id]}
                  </a>
                ))}
              </nav>
            ) : null}

            <SectionCard id="overview" title={t.overview} icon={Briefcase}>
              {sections?.overview ? <TextBlock text={sections.overview.text} /> : null}
            </SectionCard>

            <SectionCard id="requirements" title={t.requirements} icon={Briefcase}>
              {sections?.requirements?.map((group) => (
                <div key={group.label} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#112f3d]">
                    {group.label}
                  </h3>
                  <BulletList items={group.items} />
                </div>
              ))}
            </SectionCard>

            <SectionCard id="conditions" title={t.conditions} icon={Wallet}>
              {sal.primary || sal.secondary ? (
                <dl className="mb-4 space-y-2 text-sm">
                  {sal.primary ? (
                    <div className="flex flex-wrap gap-2">
                      <dt className="font-bold text-[#5a7380]">{t.salary}</dt>
                      <dd className="font-semibold text-[#112f3d]">{sal.primary}</dd>
                    </div>
                  ) : null}
                  {sal.secondary ? (
                    <div className="flex flex-wrap gap-2">
                      <dt className="font-bold text-[#5a7380]">{t.monthly}</dt>
                      <dd className="font-semibold text-[#112f3d]">{sal.secondary}</dd>
                    </div>
                  ) : null}
                  {loc ? (
                    <div className="flex flex-wrap gap-2">
                      <dt className="font-bold text-[#5a7380]">{t.work}</dt>
                      <dd className="font-semibold text-[#112f3d]">{loc}</dd>
                    </div>
                  ) : null}
                  {employ ? (
                    <div className="flex flex-wrap gap-2">
                      <dt className="font-bold text-[#5a7380]">{t.employment}</dt>
                      <dd className="font-semibold text-[#112f3d]">{employ}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
              {sections?.workBenefits?.map((b) => (
                <div key={b.label} className="mb-4 border-t border-[#e8eef2] pt-4">
                  <h3 className="text-sm font-bold text-[#112f3d]">{b.label}</h3>
                  {b.items?.length ? <BulletList items={b.items} /> : <TextBlock text={b.text} />}
                </div>
              ))}
            </SectionCard>

            <SectionCard id="benefits" title={t.benefits} icon={Briefcase}>
              {sections?.benefits?.map((b) => (
                <div key={b.label} className="mb-4 last:mb-0">
                  <h3 className="text-sm font-bold text-[#112f3d]">{b.label}</h3>
                  {b.items?.length ? <BulletList items={b.items} /> : <TextBlock text={b.text} />}
                </div>
              ))}
            </SectionCard>

            <SectionCard id="process" title={t.process} icon={Briefcase}>
              {sections?.process ? <TextBlock text={sections.process.text} /> : null}
            </SectionCard>

            <SectionCard id="company" title={t.company} icon={Building2}>
              {sections?.company ? (
                <>
                  {sections.company.info ? (
                    <p className="mb-3 text-sm font-bold text-[#112f3d]">{sections.company.info}</p>
                  ) : null}
                  <TextBlock text={sections.company.text} />
                </>
              ) : null}
            </SectionCard>

            {related.length > 0 ? (
              <section aria-labelledby="related-heading">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 id="related-heading" className="text-lg font-extrabold text-[#112f3d]">
                    {t.related}
                  </h2>
                  <Link to={jobsBasePath} className="text-sm font-bold text-[#be1824] hover:underline">
                    {t.viewAll}
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {related.map((r) => (
                    <RelatedCard
                      key={r.id}
                      job={r}
                      lang={lang}
                      t={t}
                      jobsBasePath={jobsBasePath}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="jobshare-job-detail-aside">
            <div className="border border-[#d7e2e8] bg-white p-5 shadow-sm">
              {sal.primary ? (
                <>
                  <p className="text-xs font-bold uppercase text-[#be1824]">
                    {sal.primaryLabel === 'yearly' ? t.salary : t.monthly}
                  </p>
                  <p className="mt-1 text-2xl font-black text-[#112f3d]">{sal.primary}</p>
                </>
              ) : null}
              <Link
                to={primaryCta.to}
                state={primaryCta.state}
                className={`${landingBtnPrimary} mt-5 w-full gap-2${primaryCta.solidCta ? ' candidate-solid-cta' : ''}`}
              >
                <UserPlus className="h-5 w-5" aria-hidden />
                {primaryCta.label}
              </Link>
              <button
                type="button"
                onClick={onCopyUrl}
                className="mt-3 flex w-full min-h-[48px] items-center justify-center gap-2 border border-[#d7e2e8] bg-white text-sm font-bold text-[#112f3d] hover:bg-[#f4f7f9]"
              >
                <Copy className="h-4 w-4" aria-hidden />
                {t.copy}
              </button>
              {copyMsg ? (
                <p className="mt-2 text-center text-xs font-semibold text-[#112f3d]" role="status">
                  {copyMsg}
                </p>
              ) : null}
              <Link
                to={jobsBasePath}
                className="mt-4 block text-center text-sm font-bold text-[#be1824] hover:underline"
              >
                {t.back}
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#d7e2e8] bg-white p-3 lg:hidden">
        <Link
          to={primaryCta.to}
          state={primaryCta.state}
          className={`${landingBtnPrimary} w-full gap-2${primaryCta.solidCta ? ' candidate-solid-cta' : ''}`}
        >
          <UserPlus className="h-5 w-5" aria-hidden />
          {primaryCta.label}
        </Link>
      </div>
    </>
  );
}
