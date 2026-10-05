import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChevronRight, Plus, Loader2, X, BarChart3,
  FileText, Users, ArrowRight, Search, Briefcase,
  Sparkles, Wallet, Link2, SlidersHorizontal, UserCheck,
  MoreHorizontal, AlertTriangle,
} from 'lucide-react'
import nothingIllustration from '../../assets/Nothing.png'
import apiService from '../../services/api'
import NominationChat from '../../component/Chat/NominationChat'
import BusinessQuickActionsPageLayout from '../../component/Bussiness/BusinessQuickActionsPageLayout.jsx'
import JobCommissionEditor, { validateCommissionForMarketplace } from '../../component/Bussiness/JobCommissionEditor'
import {
  createAndSubmitMarketplaceListing,
  mapJobValuesForListingApi,
  savePendingMarketplaceListingDraft,
} from '../../utils/marketplaceListingFlow'
import {
  MARKETPLACE_PLATFORM_FEE_PERCENT,
  buildMarketplaceRequirements,
  computeListingFeeSplitPreview,
} from '../../utils/marketplaceListingSettings'
import {
  SIMPLE_FEE_MODES,
  parseJobCommissionToSimple,
  simpleCommissionToPayload,
} from '../../utils/businessSimpleCommission'
import { normalizeJobSalaryCurrency } from '../../utils/jobSalaryCurrency'
import { useLanguage } from '../../context/LanguageContext'
import {
  getBusinessAppCopy,
  getHomepageSolutionCards,
  getCandidateSharingCopy,
  getMarketplaceListingStatusLabel,
  getMarketplaceListingStatusStyle,
  getMarketplaceSettlementStatusLabel,
  formatMarketplaceDate,
  formatMarketplaceJobPickerLabel,
  getApplicationStatusLabelForMarketplace,
  getNominationStatusBadgeStyle,
  formatPlatformStat,
  getMarketplaceListingReferralFeeLabel,
} from '../../i18n/businessAppI18n'
import { getLocalizedJobTitle } from '../../i18n/businessApp/jdBuilder'
import {
  BUSINESS_HOMEPAGE_PAGE_BASE_STYLES,
  BUSINESS_HP_TEXT,
  BUSINESS_UI_FONT,
} from '../../utils/businessHomepageTypography'

const BRAND = '#0077B6'
const PIPELINE_STATUSES = new Set([2, 3, 5, 7, 8, 9, 11, 12])

const CTV_TABLE_HEAD_ROW = `border-b border-slate-100 bg-slate-50/80 uppercase tracking-wide text-slate-400 font-semibold ${BUSINESS_HP_TEXT.caption}`
const CTV_FILTER_LABEL = `font-semibold text-slate-600 ${BUSINESS_HP_TEXT.caption}`
const CTV_FILTER_SELECT = `mt-1 block rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-800 ${BUSINESS_HP_TEXT.body}`
const CTV_SHELL_PAD = 'p-3 sm:p-4'
const CTV_STACK_GAP = 'gap-3 sm:gap-4'
const CTV_PANEL_HEAD = 'px-4 py-3 sm:px-5 sm:py-3.5'
const CTV_JOBS_TOOLBAR =
  'flex shrink-0 flex-wrap items-end gap-x-3 gap-y-2 border-b border-slate-100 bg-white sm:gap-x-4'
const CTV_JOBS_FILTERS = 'flex min-w-0 flex-1 flex-wrap items-end justify-end gap-2 sm:gap-3'
const CTV_TH = 'px-3 py-2.5 font-semibold sm:px-4 sm:py-3'
const CTV_TD = 'px-3 py-2.5 sm:px-4 sm:py-3'
const CTV_COUNT_BADGE = `rounded-full bg-[#e8f4fa] px-1.5 py-0.5 font-bold text-[#0077B6] ${BUSINESS_HP_TEXT.micro}`
const CTV_STATUS_BADGE = `${BUSINESS_HP_TEXT.micro} font-semibold`

const CTV_MARKETPLACE_LAYOUT_STYLES = `
  .ctv-marketplace-dashboard {
    height: 100%;
    min-height: 0;
    max-height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .ctv-marketplace-table-panel {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
  }
  .ctv-marketplace-table-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
  }
  .ctv-marketplace-workspace {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }
  .ctv-marketplace-workspace--split {
    display: grid;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
  .ctv-marketplace-col {
    min-height: 0;
    height: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .ctv-marketplace-col--table {
    flex: 1 1 auto;
    min-height: 0;
  }
  .ctv-marketplace-body {
    min-height: 0;
    flex: 1 1 auto;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .business-app-ui .ctv-marketplace-table-ui {
    font-size: var(--biz-hp-body);
    line-height: 1.5;
    color: #334155;
  }
  .business-app-ui .ctv-marketplace-table-ui th,
  .business-app-ui .ctv-marketplace-table-ui td {
    vertical-align: middle;
  }
  .business-app-ui .ctv-marketplace-table-body thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: rgb(248 250 252 / 0.96);
    box-shadow: 0 1px 0 rgb(241 245 249);
  }

  @keyframes biz-hp-card-slide-in {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .biz-hp-solution-card-wrap,
  .ctv-motion-wrap {
    animation: biz-hp-card-slide-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  }
  .biz-hp-solution-card,
  .ctv-motion-card {
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.28s ease;
    will-change: transform;
  }
  .biz-hp-solution-card:hover,
  .ctv-motion-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 32px -12px rgba(0, 119, 182, 0.35);
  }
  @media (prefers-reduced-motion: reduce) {
    .biz-hp-solution-card-wrap,
    .ctv-motion-wrap { animation: none; }
    .biz-hp-solution-card,
    .ctv-motion-card { transition: none; }
    .biz-hp-solution-card:hover,
    .ctv-motion-card:hover { transform: none; }
  }
`

const pageStyles = `${BUSINESS_HOMEPAGE_PAGE_BASE_STYLES}${CTV_MARKETPLACE_LAYOUT_STYLES}`

const ONBOARDING_ICON_MAP = {
  sparkles: Sparkles,
  wallet: Wallet,
  link: Link2,
  sliders: SlidersHorizontal,
}

const CTV_CARD = 'rounded-xl border border-slate-200 bg-white shadow-sm'

function CtvKpiCard({ icon: Icon, iconBg, iconColor, title, value, subValue }) {
  return (
    <div className={`${CTV_CARD} p-3 sm:p-3.5`}>
      <div className="flex items-start gap-2.5">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: iconBg }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className={`leading-tight ${BUSINESS_HP_TEXT.caption}`}>{title}</div>
          <div className={`mt-0.5 tabular-nums leading-tight ${BUSINESS_HP_TEXT.stat}`}>{value}</div>
          {subValue ? (
            <div className={`mt-0.5 font-medium text-slate-600 ${BUSINESS_HP_TEXT.caption}`}>{subValue}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function formatReferralFeeCell(fee) {
  const raw = String(fee || '').trim()
  if (!raw || raw === '—') return '—'
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length <= 1) return lines[0] || '—'
  return lines.join(' · ')
}

function OnboardingView({
  hasMarketplaceData,
  platformOverview,
  onCreate,
  onViewDetails,
  onNavigate,
  breadcrumbHome,
  breadcrumbCurrent,
  cs,
  language,
}) {
  const ob = cs.onboarding
  const platformKpis = [
    {
      icon: Users,
      label: ob.platformKpis.activeCtv,
      value: formatPlatformStat(platformOverview?.activeCtv, '', language),
    },
    {
      icon: Briefcase,
      label: ob.platformKpis.activeListings,
      value: formatPlatformStat(platformOverview?.activeListings, '', language),
    },
    {
      icon: UserCheck,
      label: ob.platformKpis.totalNominations,
      value: formatPlatformStat(platformOverview?.totalNominations, '', language),
    },
    {
      icon: BarChart3,
      label: ob.platformKpis.successRate,
      value: platformOverview?.successRatePercent != null
        ? `${platformOverview.successRatePercent}%`
        : cs.common.emDash,
    },
  ]

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 pb-3 sm:gap-5 sm:pb-4 2xl:gap-6">
      <div className="shrink-0">
        <nav aria-label="Breadcrumb" className={BUSINESS_HP_TEXT.meta}>
          <button
            type="button"
            onClick={() => onNavigate('/business')}
            className="transition hover:text-[#0077B6]"
          >
            {breadcrumbHome}
          </button>
          <span className="mx-1.5 text-slate-400">&gt;</span>
          <span className="font-medium text-slate-700">{breadcrumbCurrent}</span>
        </nav>
      </div>

      <div
        className="ctv-motion-wrap ctv-motion-card rounded-xl border border-[#0077B6]/20 bg-gradient-to-br from-[#e8f4fa] to-white p-5 shadow-sm sm:p-6"
        style={{ animationDelay: '0.06s' }}
      >
        <p className={`font-bold uppercase tracking-wide text-[#0077B6] ${BUSINESS_HP_TEXT.caption}`}>{ob.kicker}</p>
        <h1 className={`mt-1 leading-snug ${BUSINESS_HP_TEXT.title}`}>
          {ob.heroTitle}
        </h1>
        <p className={`mt-2 max-w-3xl leading-relaxed text-slate-600 ${BUSINESS_HP_TEXT.body}`}>
          {ob.heroBody}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onCreate}
            className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#0077B6] px-4 py-2.5 text-white transition-colors hover:bg-[#006399] ${BUSINESS_HP_TEXT.buttonPrimary}`}
          >
            {ob.ctaPost}
            <ArrowRight className="h-4 w-4" />
          </button>
          {hasMarketplaceData ? (
            <button
              type="button"
              onClick={onViewDetails}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-700 transition-colors hover:bg-slate-50 ${BUSINESS_HP_TEXT.button}`}
            >
              {ob.ctaManage}
            </button>
          ) : null}
        </div>
      </div>

      <div
        className="ctv-motion-wrap overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        style={{ animationDelay: '0.14s' }}
      >
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
          <h2 className={BUSINESS_HP_TEXT.section}>{ob.compareTitle}</h2>
          <p className={`mt-0.5 ${BUSINESS_HP_TEXT.caption}`}>{ob.compareSubtitle}</p>
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full min-w-[520px] border-collapse ctv-marketplace-table-ui ${BUSINESS_HP_TEXT.body}`}>
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500">
                <th className="px-4 py-2.5 font-semibold sm:px-5 sm:py-3">{ob.compareCriterion}</th>
                <th className="px-4 py-2.5 font-semibold text-[#0077B6] sm:px-5 sm:py-3">{ob.compareCtv}</th>
                <th className="px-4 py-2.5 font-semibold text-[#E879A8] sm:px-5 sm:py-3">{ob.compareManaged}</th>
              </tr>
            </thead>
            <tbody>
              {ob.compareRows.map((row) => (
                <tr key={row.key} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-semibold text-slate-700 sm:px-5 sm:py-3">{row.label}</td>
                  <td className="px-4 py-2.5 text-slate-600 sm:px-5 sm:py-3">{row.ctv}</td>
                  <td className="px-4 py-2.5 text-slate-600 sm:px-5 sm:py-3">{row.managed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-3 text-right sm:px-5">
          <button
            type="button"
            onClick={() => onNavigate('/business/scout/managed')}
            className={BUSINESS_HP_TEXT.link}
          >
            {ob.compareLearnManaged}
          </button>
        </div>
      </div>

      <div
        className="ctv-motion-wrap rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
        style={{ animationDelay: '0.2s' }}
      >
        <h2 className={BUSINESS_HP_TEXT.section}>{ob.benefitsTitle}</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {ob.benefits.map((item, index) => {
            const Icon = ONBOARDING_ICON_MAP[item.iconKey] || Sparkles
            return (
              <div
                key={item.title}
                className="biz-hp-solution-card-wrap h-full min-w-0"
                style={{ animationDelay: `${0.24 + index * 0.08}s` }}
              >
                <div className="ctv-motion-card flex h-full gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 sm:p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f4fa]">
                    <Icon className="h-4 w-4 text-[#0077B6]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-bold text-slate-800 ${BUSINESS_HP_TEXT.body}`}>{item.title}</h3>
                    <p className={`mt-0.5 leading-relaxed ${BUSINESS_HP_TEXT.caption}`}>{item.desc}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div
        className="ctv-motion-wrap shrink-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 2xl:p-6"
        style={{ animationDelay: '0.28s' }}
      >
        <h2 className={`mb-4 sm:mb-5 ${BUSINESS_HP_TEXT.section}`}>{ob.processTitle}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
          {ob.processSteps.map((step, idx) => (
            <div
              key={step.num}
              className="biz-hp-solution-card-wrap h-full min-w-0"
              style={{ animationDelay: `${0.32 + idx * 0.08}s` }}
            >
              <div className="ctv-motion-card relative flex h-full flex-col gap-2 rounded-lg border border-transparent bg-white p-1 sm:gap-2.5">
                {idx < ob.processSteps.length - 1 && (
                  <div className="absolute left-[calc(100%-8px)] top-4 z-0 hidden h-px w-full bg-[#cce5f0] xl:block" />
                )}
                <span className={`relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0077B6] font-bold text-white sm:h-9 sm:w-9 ${BUSINESS_HP_TEXT.caption}`}>
                  {step.num}
                </span>
                <h3 className={`font-bold text-slate-800 ${BUSINESS_HP_TEXT.body}`}>{step.title}</h3>
                <p className={`leading-relaxed text-slate-500 ${BUSINESS_HP_TEXT.caption}`}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="ctv-motion-wrap rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5"
        style={{ animationDelay: '0.36s' }}
      >
        <h2 className={BUSINESS_HP_TEXT.section}>{ob.platformStatsTitle}</h2>
        <p className={`mt-1 ${BUSINESS_HP_TEXT.caption}`}>{ob.platformStatsSubtitle}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {platformKpis.map((kpi, index) => {
            const Icon = kpi.icon
            return (
              <div
                key={kpi.label}
                className="biz-hp-solution-card-wrap h-full min-w-0"
                style={{ animationDelay: `${0.4 + index * 0.08}s` }}
              >
                <div className="ctv-motion-card h-full rounded-lg border border-slate-100 bg-slate-50/80 p-3.5 sm:p-4">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-[#0077B6]" strokeWidth={2} />
                    <span className={`font-medium leading-snug ${BUSINESS_HP_TEXT.caption}`}>{kpi.label}</span>
                  </div>
                  <div className={`tabular-nums ${BUSINESS_HP_TEXT.stat}`}>{kpi.value}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


const businessModalTitleClass = `font-bold leading-snug text-slate-900 ${BUSINESS_HP_TEXT.section}`
const businessModalSubtitleClass = `mt-0.5 font-medium leading-relaxed text-slate-600 ${BUSINESS_HP_TEXT.body}`
const businessLabelClass = `block font-semibold text-slate-700 mb-1 ${BUSINESS_HP_TEXT.caption}`
const businessInputClass =
  `w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-900 outline-none focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/25 ${BUSINESS_HP_TEXT.body}`
const businessBtnSecondaryClass =
  `w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 sm:px-4 sm:py-2 ${BUSINESS_HP_TEXT.button}`
const businessBtnPrimaryClass =
  `w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0077B6] px-3 py-1.5 font-bold text-white shadow-sm shadow-[#0077B6]/15 transition-colors hover:bg-[#006399] disabled:opacity-60 sm:px-4 sm:py-2 ${BUSINESS_HP_TEXT.buttonPrimary}`
const businessBtnQuickCreateClass =
  `w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#0077B6]/35 bg-[#e8f4fa] px-3 py-1.5 font-bold text-[#0077B6] transition-colors hover:bg-[#0077B6]/10 disabled:opacity-60 sm:px-4 sm:py-2 ${BUSINESS_HP_TEXT.buttonPrimary}`

function CreateListingModal({ open, onClose, onCreated, initialJobId = '' }) {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const cs = useMemo(() => getCandidateSharingCopy(language), [language])
  const cm = cs.createModal
  const [jobId, setJobId] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [jobSearchQuery, setJobSearchQuery] = useState('')
  const [jobSearchResults, setJobSearchResults] = useState([])
  const [jobSearchLoading, setJobSearchLoading] = useState(false)
  const [jobSearchOpen, setJobSearchOpen] = useState(false)
  const [jobCommissionType, setJobCommissionType] = useState('percent')
  const [jobValues, setJobValues] = useState(() => simpleCommissionToPayload(SIMPLE_FEE_MODES.PERCENT_ANNUAL, '').jobValues)
  const [salaryCurrency, setSalaryCurrency] = useState('JPY')
  const [commissionSeedJob, setCommissionSeedJob] = useState(null)
  const [recruitmentDeadline, setRecruitmentDeadline] = useState('')
  const [minCtvRating, setMinCtvRating] = useState(0)
  const [platformBillingAck, setPlatformBillingAck] = useState(false)
  const [creating, setCreating] = useState(false)
  const [loadingJobMeta, setLoadingJobMeta] = useState(false)
  const [jobsAvailability, setJobsAvailability] = useState({ loading: false, hasJobs: true })

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape' && !creating) onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, creating])

  useEffect(() => {
    if (!open) return undefined
    if (initialJobId) {
      setJobsAvailability({ loading: false, hasJobs: true })
      return undefined
    }
    let mounted = true
    setJobsAvailability({ loading: true, hasJobs: true })
    apiService.getBusinessJobs({ page: 1, limit: 1 }).then((res) => {
      if (!mounted) return
      const jobs = res?.data?.jobs || res?.data?.items || []
      const total = res?.data?.pagination?.total
      const hasJobs = typeof total === 'number' ? total > 0 : jobs.length > 0
      setJobsAvailability({ loading: false, hasJobs: res?.success ? hasJobs : true })
    }).catch(() => {
      if (mounted) setJobsAvailability({ loading: false, hasJobs: true })
    })
    return () => { mounted = false }
  }, [open, initialJobId])

  useEffect(() => {
    if (!open) return
    setJobId(initialJobId ? String(initialJobId) : '')
    setSelectedJob(null)
    setJobSearchQuery('')
    setJobSearchResults([])
    setJobSearchOpen(false)
    const emptyPayload = simpleCommissionToPayload(SIMPLE_FEE_MODES.PERCENT_ANNUAL, '')
    setJobCommissionType(emptyPayload.jobCommissionType)
    setJobValues(emptyPayload.jobValues)
    setSalaryCurrency('JPY')
    setCommissionSeedJob(null)
    setRecruitmentDeadline('')
    setMinCtvRating(0)
    setPlatformBillingAck(false)
  }, [open, initialJobId])

  useEffect(() => {
    if (!open || !initialJobId) return
    let mounted = true
    apiService.getBusinessJobById(initialJobId).then((res) => {
      if (!mounted) return
      const job = res?.data?.job || res?.data
      if (job?.id) {
        setSelectedJob(job)
        setJobId(String(job.id))
      }
    }).catch(() => {})
    return () => { mounted = false }
  }, [open, initialJobId])

  useEffect(() => {
    if (!open || selectedJob) return
    const q = jobSearchQuery.trim()
    if (q.length < 1) {
      setJobSearchResults([])
      setJobSearchLoading(false)
      return undefined
    }
    setJobSearchLoading(true)
    let mounted = true
    const timer = setTimeout(() => {
      apiService.getBusinessJobs({ page: 1, limit: 20, search: q }).then((res) => {
        if (!mounted) return
        setJobSearchResults(res?.data?.jobs || res?.data?.items || [])
      }).catch(() => {
        if (mounted) setJobSearchResults([])
      }).finally(() => {
        if (mounted) setJobSearchLoading(false)
      })
    }, 280)
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [open, jobSearchQuery, selectedJob])

  useEffect(() => {
    if (!jobId) return
    let mounted = true
    setLoadingJobMeta(true)
    apiService.getBusinessJobById(jobId).then((res) => {
      if (!mounted) return
      const job = res?.data?.job || res?.data
      setCommissionSeedJob(job || null)
      if (job?.id) setSelectedJob(job)
      const parsed = parseJobCommissionToSimple(job)
      const payload = simpleCommissionToPayload(parsed.feeMode, parsed.amount, {
        viewOnCollaborator: parsed.viewOnCollaborator,
      })
      setJobCommissionType(payload.jobCommissionType)
      setJobValues(payload.jobValues)
      if (job?.salaryCurrency) {
        setSalaryCurrency(normalizeJobSalaryCurrency(job.salaryCurrency))
      }
      if (job?.deadline) {
        setRecruitmentDeadline(String(job.deadline).slice(0, 10))
      }
    }).catch(() => {
      if (mounted) setCommissionSeedJob(null)
    }).finally(() => {
      if (mounted) setLoadingJobMeta(false)
    })
    return () => { mounted = false }
  }, [jobId])

  const clearSelectedJob = () => {
    setJobId('')
    setSelectedJob(null)
    setCommissionSeedJob(null)
    setJobSearchQuery('')
    setJobSearchResults([])
    setJobSearchOpen(false)
  }

  const pickJob = (job) => {
    if (!job?.id) return
    setJobId(String(job.id))
    setSelectedJob(job)
    setJobSearchQuery('')
    setJobSearchResults([])
    setJobSearchOpen(false)
  }

  const feeSplitPreview = useMemo(
    () => computeListingFeeSplitPreview({
      jobCommissionType,
      jobValues,
      platformFeePercent: MARKETPLACE_PLATFORM_FEE_PERCENT,
    }),
    [jobCommissionType, jobValues],
  )

  const buildListingDraftFromForm = () => ({
    jobCommissionType,
    jobValues: mapJobValuesForListingApi(jobValues),
    recruitmentDeadline: recruitmentDeadline || null,
    platformFeePercent: MARKETPLACE_PLATFORM_FEE_PERCENT,
    requirements: buildMarketplaceRequirements({ minCtvRating: Number(minCtvRating) || 0 }),
  })

  const handleQuickCreate = () => {
    const commissionError = validateCommissionForMarketplace(jobCommissionType, jobValues)
    if (commissionError) {
      alert(commissionError)
      return
    }
    if (!platformBillingAck) {
      alert(cs.alerts.billingAckRequired)
      return
    }
    savePendingMarketplaceListingDraft(buildListingDraftFromForm())
    onClose?.()
    navigate('/business/jobs/create?quickMarketplace=1')
  }

  const handleEmptyQuickCreate = () => {
    onClose?.()
    navigate('/business/jobs/create')
  }

  const handleCreate = async () => {
    if (!jobId) { alert(cs.alerts.selectJob); return }
    const commissionError = validateCommissionForMarketplace(jobCommissionType, jobValues)
    if (commissionError) { alert(commissionError); return }
    if (!platformBillingAck) {
      alert(cs.alerts.billingAckRequired)
      return
    }
    setCreating(true)
    try {
      const { wsSessionId } = await createAndSubmitMarketplaceListing(
        Number(jobId),
        buildListingDraftFromForm(),
      )
      onCreated()
      onClose()
      if (wsSessionId) {
        navigate(`/business/messages?tab=ws&wsView=chat&sessionId=${wsSessionId}`)
      }
    } catch (e) {
      console.error(e)
      alert(e?.message || cs.alerts.createFailed)
    } finally {
      setCreating(false)
    }
  }

  if (!open) return null

  const showNoJobsEmpty = !initialJobId && !jobsAvailability.loading && !jobsAvailability.hasJobs

  return createPortal(
    <div
      className="business-app-ui fixed inset-0 z-[10050] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-listing-modal-title"
      style={{ fontFamily: BUSINESS_UI_FONT }}
    >
      <button
        type="button"
        aria-label={cs.common.close}
        className="absolute inset-0 bg-slate-900/45"
        onClick={() => !creating && onClose?.()}
      />
      <div
        className="relative z-10 flex w-full max-w-3xl max-h-[90vh] min-h-0 justify-center pointer-events-none"
      >
        <div className="create-listing-modal pointer-events-auto relative flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl antialiased">
        <button
          type="button"
          onClick={() => !creating && onClose?.()}
          disabled={creating}
          className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          aria-label={cs.common.closeDialog}
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>

        {!showNoJobsEmpty ? (
        <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 pr-11">
          <div className="flex items-start gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#0077B6]/20 bg-[#0077B6]/5"
              aria-hidden
            >
              <Briefcase className="h-3.5 w-3.5 text-[#0077B6]" strokeWidth={2} />
            </div>
            <div className="min-w-0 pt-0.5">
              <h2 id="create-listing-modal-title" className={businessModalTitleClass}>
                {cm.title}
              </h2>
              <p className={businessModalSubtitleClass}>
                {cm.subtitle}
              </p>
            </div>
          </div>
        </div>
        ) : (
          <h2 id="create-listing-modal-title" className="sr-only">{cm.noJobsTitle}</h2>
        )}

        <div className={`ctv-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-3 ${showNoJobsEmpty ? 'pt-10' : ''}`}>
          {!initialJobId && jobsAvailability.loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#0077B6]" />
            </div>
          ) : showNoJobsEmpty ? (
            <div className="flex flex-col items-center justify-center px-2 py-6 text-center sm:py-8">
              <img
                src={nothingIllustration}
                alt=""
                className="mb-4 w-full max-w-[220px] object-contain"
                draggable={false}
              />
              <p className={`font-semibold text-slate-800 ${BUSINESS_HP_TEXT.bodyLg}`}>{cm.noJobsTitle}</p>
              <p className={`mt-1.5 max-w-sm leading-relaxed ${BUSINESS_HP_TEXT.caption}`}>
                {cm.noJobsBody}
              </p>
              <button
                type="button"
                onClick={handleEmptyQuickCreate}
                className={`mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0077B6] px-4 py-2.5 text-white shadow-sm shadow-[#0077B6]/15 transition-colors hover:bg-[#006399] ${BUSINESS_HP_TEXT.buttonPrimary}`}
              >
                {cm.quickCreate}
              </button>
            </div>
          ) : (
          <>
          <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3">
            <div className="relative">
              <label className={businessLabelClass}>
                {cm.selectJobLabel} <span className="text-red-500">*</span>
              </label>
              {selectedJob ? (
                <div className="flex items-center gap-2 rounded-lg border border-[#0077B6]/30 bg-white px-3 py-2.5 shadow-sm">
                  <span className={`flex-1 min-w-0 font-medium text-slate-800 truncate ${BUSINESS_HP_TEXT.body}`}>
                    {formatMarketplaceJobPickerLabel(selectedJob, language)}
                  </span>
                  <button
                    type="button"
                    onClick={clearSelectedJob}
                    disabled={creating}
                    className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
                    aria-label={cm.clearJob}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={jobSearchQuery}
                    onChange={(e) => {
                      setJobSearchQuery(e.target.value)
                      setJobSearchOpen(true)
                    }}
                    onFocus={() => setJobSearchOpen(true)}
                    placeholder={cm.jobSearchPlaceholder}
                    className={`${businessInputClass} pl-9`}
                    autoComplete="off"
                  />
                  {jobSearchOpen && jobSearchQuery.trim() ? (
                    <div className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg ctv-scrollbar">
                      {jobSearchLoading ? (
                        <div className={`flex items-center gap-2 px-3 py-2.5 ${BUSINESS_HP_TEXT.caption}`}>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0077B6]" />
                          {cm.searching}
                        </div>
                      ) : jobSearchResults.length === 0 ? (
                        <p className={`px-3 py-2.5 ${BUSINESS_HP_TEXT.caption}`}>{cm.noJobMatch}</p>
                      ) : (
                        jobSearchResults.map((j) => (
                          <button
                            key={j.id}
                            type="button"
                            onClick={() => pickJob(j)}
                            className={`w-full px-3 py-2.5 text-left font-medium text-slate-800 transition-colors hover:bg-[#0077B6]/5 hover:text-[#0077B6] ${BUSINESS_HP_TEXT.body}`}
                          >
                            {formatMarketplaceJobPickerLabel(j, language)}
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              )}
              {initialJobId && selectedJob && String(selectedJob.id) === String(initialJobId) ? (
                <p className={`mt-2 font-semibold text-[#0077B6] ${BUSINESS_HP_TEXT.caption}`}>{cm.preselectedJob}</p>
              ) : null}
            </div>

            {loadingJobMeta && jobId ? (
              <div className={`mt-3 flex items-center gap-2 font-medium text-slate-500 ${BUSINESS_HP_TEXT.body}`}>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0077B6]" />
                {cm.loadingJobMeta}
              </div>
            ) : null}
          </section>

          <JobCommissionEditor
            compact
            jobCommissionType={jobCommissionType}
            onCommissionTypeChange={setJobCommissionType}
            jobValues={jobValues}
            onJobValuesChange={setJobValues}
            commissionSeedJob={commissionSeedJob}
            salaryCurrency={salaryCurrency}
            onSalaryCurrencyChange={setSalaryCurrency}
          />

          {feeSplitPreview ? (
            <section className="rounded-lg border border-[#0077B6]/25 bg-[#e8f4fa]/50 p-3 sm:p-4">
              <p className={`mb-2 font-bold text-slate-800 ${BUSINESS_HP_TEXT.section}`}>{cm.feeSplitTitle}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200/80 bg-white px-3 py-2">
                  <p className={`font-semibold uppercase tracking-wide text-slate-400 ${BUSINESS_HP_TEXT.micro}`}>{cm.feeSplitBusiness}</p>
                  <p className={`mt-0.5 font-bold text-[#0077B6] ${BUSINESS_HP_TEXT.body}`}>{feeSplitPreview.businessPaysLabel}</p>
                </div>
                <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-2">
                  <p className={`font-semibold uppercase tracking-wide text-emerald-700 ${BUSINESS_HP_TEXT.micro}`}>{cm.feeSplitCtv}</p>
                  <p className={`mt-0.5 font-bold text-emerald-800 ${BUSINESS_HP_TEXT.body}`}>{feeSplitPreview.ctvReceivesLabel}</p>
                </div>
                <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2">
                  <p className={`font-semibold uppercase tracking-wide text-amber-700 ${BUSINESS_HP_TEXT.micro}`}>{cm.feeSplitPlatform}</p>
                  <p className={`mt-0.5 font-bold text-amber-900 ${BUSINESS_HP_TEXT.body}`}>{feeSplitPreview.platformFeeLabel}</p>
                </div>
              </div>
              <p className={`mt-2 leading-relaxed ${BUSINESS_HP_TEXT.caption}`}>
                {cm.feeSplitHint}
              </p>
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3">
            <label className={businessLabelClass}>{cm.minRatingLabel}</label>
            <select
              value={minCtvRating}
              onChange={(e) => setMinCtvRating(Number(e.target.value))}
              disabled={creating}
              className={businessInputClass}
            >
              {cm.minCtvRatingOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className={`mt-1.5 leading-relaxed ${BUSINESS_HP_TEXT.caption}`}>
              {cm.minRatingHint}
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-2.5 sm:p-3 space-y-1.5">
            <p className={`font-bold text-slate-800 ${BUSINESS_HP_TEXT.section}`}>{cm.rulesTitle}</p>
            <ul className={`list-disc space-y-1 pl-4 leading-relaxed text-slate-600 ${BUSINESS_HP_TEXT.body}`}>
              <li>{cm.rules[0]}</li>
              <li>{cm.rules[1]}</li>
              <li>{typeof cm.rules[2] === 'function' ? cm.rules[2](MARKETPLACE_PLATFORM_FEE_PERCENT) : cm.rules[2]}</li>
            </ul>
            <label className="flex cursor-pointer items-start gap-2 pt-1">
              <input
                type="checkbox"
                checked={platformBillingAck}
                onChange={(e) => setPlatformBillingAck(e.target.checked)}
                disabled={creating}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0077B6] focus:ring-[#0077B6]/30"
              />
              <span className={`leading-relaxed text-slate-700 ${BUSINESS_HP_TEXT.body}`}>
                {cm.billingAck}
                <span className="text-red-500"> *</span>
              </span>
            </label>
          </section>

          <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3">
            <label className={businessLabelClass}>{cm.deadlineLabel}</label>
            <input
              type="date"
              value={recruitmentDeadline}
              onChange={(e) => setRecruitmentDeadline(e.target.value)}
              className={businessInputClass}
            />
          </section>
          </>
          )}
        </div>

        {!showNoJobsEmpty && !jobsAvailability.loading ? (
        <div className="shrink-0 flex flex-col gap-1.5 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
          <p className={`leading-relaxed ${BUSINESS_HP_TEXT.caption}`}>
            <strong className="font-semibold text-slate-600">{cm.footerQuickCreateStrong}</strong>
            {' '}
            {cm.footerQuickCreateBody}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className={businessBtnSecondaryClass}
          >
            {cs.common.cancel}
          </button>
          <button
            type="button"
            disabled={creating}
            onClick={handleQuickCreate}
            className={businessBtnQuickCreateClass}
          >
            {cm.quickCreate}
          </button>
          <button
            type="button"
            disabled={creating}
            onClick={() => handleCreate()}
            className={businessBtnPrimaryClass}
          >
            {creating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {cm.processing}
              </>
            ) : (
              cm.submitWs
            )}
          </button>
          </div>
        </div>
        ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}

const MARKETPLACE_LISTING_STATUS = {
  DRAFT: 0,
  PENDING_APPROVAL: 1,
  PUBLISHED: 3,
  PAUSED: 4,
  CLOSED: 5,
}

function parseDeadline(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function isDeadlineExpiringSoon(value, withinDays = 7) {
  const d = parseDeadline(value)
  if (!d) return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const limit = new Date(now)
  limit.setDate(limit.getDate() + withinDays)
  return d >= now && d <= limit
}

function isDeadlinePast(value) {
  const d = parseDeadline(value)
  if (!d) return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return d < now
}

function openSanCtvListingDetail(navigate, jobId) {
  if (!jobId || !navigate) return
  navigate(`/business/candidate-sharing/jobs/${encodeURIComponent(String(jobId))}`)
}

const Avatar = ({ id, size = 24, bg = '#e0e7ff', color = '#4f46e5' }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
    {id}
  </div>
)

const VALID_TABS = ['jobs', 'nominations', 'candidates', 'costs']

function ThreeWayChatPanel({ selectedNomination, cs, language }) {
  const introJobTitle = selectedNomination
    ? (
      getLocalizedJobTitle(
        {
          title: selectedNomination.jobTitle,
          titleEn: selectedNomination.jobTitleEn,
          titleJp: selectedNomination.jobTitleJp,
          id: selectedNomination.jobId,
        },
        language,
      ) || selectedNomination.jobTitleLocalized || selectedNomination.jobTitle || cs.common.emDash
    )
    : cs.common.emDash
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {selectedNomination ? (
          <NominationChat
            jobApplicationId={selectedNomination.id}
            userType="business"
            currentStatus={selectedNomination.status}
            introCandidateName={selectedNomination.candidateName || cs.common.emDash}
            introJobTitle={introJobTitle}
            mobileHeaderName={selectedNomination.candidateName || cs.common.threeWayChat}
            mobileHeaderAvatar={(selectedNomination.candidateName || '?').charAt(0).toUpperCase()}
            embeddedPanel
            disableBusinessFreeStatusChange
            contactBarVariant="subtle"
          />
        ) : (
          <div className={`flex flex-1 items-center justify-center px-5 py-10 text-center text-slate-400 sm:px-6 ${BUSINESS_HP_TEXT.caption}`}>
            {cs.dashboard.chatPickNomination}
          </div>
        )}
      </div>
    </div>
  )
}

const CandidateSharing = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const copy = useMemo(() => getBusinessAppCopy(language), [language])
  const cs = useMemo(() => getCandidateSharingCopy(language), [language])
  const db = cs.dashboard
  const breadcrumbCurrent = useMemo(() => {
    const card = getHomepageSolutionCards(language).find((c) => c.tagId === 'hr-partner-network')
    return card?.title || cs.marketplaceSubtitle
  }, [language, cs.marketplaceSubtitle])
  const breadcrumbHome = copy.jobs.breadcrumb.home
  const [searchParams, setSearchParams] = useSearchParams()
  const urlTab = searchParams.get('tab')
  const urlNominationId = searchParams.get('nominationId')
  const urlListingId = searchParams.get('listingId')
  const urlJobId = searchParams.get('jobId')
  const urlCreate = searchParams.get('create')
  const urlView = searchParams.get('view')

  const [tab, setTab] = useState(() => (
    urlTab && VALID_TABS.includes(urlTab) ? urlTab : 'jobs'
  ))
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [platformOverview, setPlatformOverview] = useState(null)
  const [jobFilterStatus, setJobFilterStatus] = useState('')
  const [jobFilterDeadline, setJobFilterDeadline] = useState('')
  const [jobFilterHasNomination, setJobFilterHasNomination] = useState('')
  const [jobFilterHasInterest, setJobFilterHasInterest] = useState('')
  const [openListingMenuId, setOpenListingMenuId] = useState(null)
  const [listingActionBusyId, setListingActionBusyId] = useState(null)
  const [listings, setListings] = useState([])
  const [nominations, setNominations] = useState([])
  const [settlements, setSettlements] = useState([])
  const [selectedNomination, setSelectedNomination] = useState(null)
  const [confirmingHireId, setConfirmingHireId] = useState(null)
  const [showCreate, setShowCreate] = useState(() => urlCreate === '1' || !!urlJobId)
  const [createJobId, setCreateJobId] = useState(() => urlJobId || '')
  const listingJustCreatedRef = useRef(false)

  useEffect(() => {
    if (urlCreate === '1' || urlJobId) {
      setShowCreate(true)
      if (urlJobId) setCreateJobId(String(urlJobId))
    }
  }, [urlCreate, urlJobId])

  const closeCreateModal = () => {
    setShowCreate(false)
    const justCreated = listingJustCreatedRef.current
    listingJustCreatedRef.current = false
    if (urlCreate || urlJobId || justCreated) {
      const next = new URLSearchParams(searchParams)
      next.delete('create')
      next.delete('jobId')
      if (justCreated) next.set('view', 'dashboard')
      setSearchParams(next, { replace: true })
    }
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const nomParams = {
        page: 1,
        limit: urlNominationId ? 50 : 10,
        ...(urlListingId ? { listingId: urlListingId } : {}),
      }
      const [dashRes, listRes, nomRes, setRes, platformRes] = await Promise.all([
        apiService.getBusinessCandidateSharingDashboard(),
        apiService.getBusinessCandidateSharingListings({ page: 1, limit: 50 }),
        apiService.getBusinessCandidateSharingNominations(nomParams),
        apiService.getBusinessCandidateSharingSettlements({ page: 1, limit: 50 }),
        apiService.getBusinessCandidateSharingPlatformOverview(),
      ])
      if (platformRes?.success) setPlatformOverview(platformRes.data)
      if (dashRes?.success) {
        setStats(dashRes.data?.stats || null)
        if (dashRes.data?.recentListings?.length) setListings(dashRes.data.recentListings)
      }
      if (listRes?.success) setListings(listRes.data?.listings || [])
      if (nomRes?.success) setNominations(nomRes.data?.nominations || [])
      if (setRes?.success) setSettlements(setRes.data?.settlements || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [urlNominationId, urlListingId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (urlTab && VALID_TABS.includes(urlTab)) setTab(urlTab)
  }, [urlTab])

  useEffect(() => {
    if (!nominations.length) return
    if (urlNominationId) {
      const match = nominations.find((n) => String(n.id) === String(urlNominationId))
      if (match) {
        setSelectedNomination(match)
        return
      }
    }
    if (!selectedNomination) setSelectedNomination(nominations[0])
  }, [nominations, selectedNomination, urlNominationId])

  const statCards = useMemo(() => {
    const s = stats || {}
    return [
      {
        icon: Briefcase,
        iconBg: '#e8f4fa',
        iconColor: BRAND,
        title: db.kpiListings,
        value: s.totalListings ?? 0,
        subValue: db.kpiListingsSub(s.activeOnMarket ?? 0),
      },
      {
        icon: FileText,
        iconBg: '#ffedd5',
        iconColor: '#ea580c',
        title: db.kpiNominations,
        value: s.totalNominations ?? 0,
        subValue: db.kpiNominationsSub(s.totalInterests ?? 0),
      },
      {
        icon: Users,
        iconBg: '#dbeafe',
        iconColor: '#2563eb',
        title: db.kpiPipeline,
        value: s.pipelineCandidates ?? 0,
        subValue: null,
      },
      {
        icon: UserCheck,
        iconBg: '#dcfce7',
        iconColor: '#16a34a',
        title: db.kpiHired,
        value: s.hired ?? 0,
        subValue: s.pendingApproval ? db.kpiPendingApproval(s.pendingApproval) : null,
      },
    ]
  }, [stats, db])

  const jobsData = useMemo(() => listings.map((l) => {
    const deadlineRaw = l.recruitmentDeadline || l.job?.deadline
    return {
      id: l.id,
      jobId: l.job?.id,
      title: getLocalizedJobTitle(l.job, language) || cs.common.emDash,
      code: l.job?.jobCode || cs.common.emDash,
      referralFee: getMarketplaceListingReferralFeeLabel(l, language),
      status: getMarketplaceListingStatusLabel(l.status, language),
      statusCode: l.status,
      ctvCount: l.interestCount,
      nominationCount: l.nominationsCount,
      deadline: formatMarketplaceDate(deadlineRaw, language),
      deadlineRaw,
      expiringSoon: isDeadlineExpiringSoon(deadlineRaw),
      deadlinePast: isDeadlinePast(deadlineRaw),
      raw: l,
    }
  }), [listings, language, cs.common.emDash])

  const filteredJobsData = useMemo(() => jobsData.filter((job) => {
    if (jobFilterStatus !== '' && String(job.statusCode) !== jobFilterStatus) return false
    if (jobFilterDeadline === 'expiring' && !job.expiringSoon) return false
    if (jobFilterDeadline === 'expired' && !job.deadlinePast) return false
    if (jobFilterHasNomination === 'yes' && !(job.nominationCount > 0)) return false
    if (jobFilterHasNomination === 'no' && job.nominationCount > 0) return false
    if (jobFilterHasInterest === 'yes' && !(job.ctvCount > 0)) return false
    if (jobFilterHasInterest === 'no' && job.ctvCount > 0) return false
    return true
  }), [jobsData, jobFilterStatus, jobFilterDeadline, jobFilterHasNomination, jobFilterHasInterest])

  const nominationsData = useMemo(() => nominations.map((n) => {
    const jobTitleLocalized = getLocalizedJobTitle(
      { title: n.jobTitle, titleEn: n.jobTitleEn, titleJp: n.jobTitleJp, id: n.jobId },
      language,
    ) || n.jobTitle
    return {
      nominationId: n.id,
      id: (n.candidateName || '?').charAt(0).toUpperCase(),
      name: n.candidateName,
      subName: n.candidateSub ? `(${n.candidateSub})` : '',
      position: jobTitleLocalized,
      posCode: n.jobCode,
      ctv: n.ctvName,
      rating: n.matchScore,
      date: formatMarketplaceDate(n.appliedAt, language),
      status: getApplicationStatusLabelForMarketplace(n.status, language),
      statusCode: n.status,
      cvStorageId: n.cvStorageId,
      raw: { ...n, jobTitleLocalized },
    }
  }), [nominations, language])

  const tabs = [
    { key: 'jobs', label: db.tabs.jobs },
    { key: 'nominations', label: db.tabs.nominations },
    { key: 'candidates', label: db.tabs.candidates },
    { key: 'costs', label: db.tabs.costs },
  ]

  const hasListings = listings.length > 0 || (stats?.totalListings ?? 0) > 0

  const deepLinkDashboard = Boolean(
    urlNominationId
    || urlListingId
    || urlView === 'dashboard'
    || (urlTab && VALID_TABS.includes(urlTab)),
  )

  const showOnboarding = !loading && !deepLinkDashboard

  const enterMarketplaceDashboard = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.set('view', 'dashboard')
    setSearchParams(next)
  }, [searchParams, setSearchParams])

  const backToMarketplaceIntro = useCallback(() => {
    navigate('/business/candidate-sharing')
  }, [navigate])

  useEffect(() => {
    if (!urlListingId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiService.getBusinessCandidateSharingListing(urlListingId)
        const jid = res?.data?.listing?.jobId ?? res?.data?.listing?.job?.id
        if (cancelled || !res?.success || !jid) return
        const nom = urlNominationId
        const path = `/business/candidate-sharing/jobs/${encodeURIComponent(String(jid))}`
        navigate(nom ? `${path}?tab=nominations&nominationId=${encodeURIComponent(String(nom))}` : path, { replace: true })
      } catch {
        /* giữ query listingId — user ở dashboard */
      }
    })()
    return () => { cancelled = true }
  }, [urlListingId, urlNominationId, navigate])

  const openCreateModal = () => setShowCreate(true)

  const handleTabChange = useCallback((key) => {
    setTab(key)
    const next = new URLSearchParams(searchParams)
    if (key === 'jobs') next.delete('tab')
    else next.set('tab', key)
    next.set('view', 'dashboard')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const candidatesData = useMemo(
    () => nominationsData.filter((n) => PIPELINE_STATUSES.has(Number(n.statusCode))),
    [nominationsData],
  )

  const handleCreatedListing = useCallback(async () => {
    listingJustCreatedRef.current = true
    await loadData()
  }, [loadData])

  const handleListingPause = useCallback(async (listingId) => {
    setListingActionBusyId(listingId)
    setOpenListingMenuId(null)
    try {
      const res = await apiService.pauseBusinessCandidateSharingListing(listingId)
      if (res?.success) await loadData()
      else alert(res?.message || cs.alerts.pauseFailed)
    } catch (e) {
      alert(e?.message || cs.alerts.pauseFailed)
    } finally {
      setListingActionBusyId(null)
    }
  }, [loadData, cs.alerts.pauseFailed])

  const handleListingClose = useCallback(async (listingId) => {
    if (!window.confirm(db.confirmCloseListing)) return
    setListingActionBusyId(listingId)
    setOpenListingMenuId(null)
    try {
      const res = await apiService.closeBusinessCandidateSharingListing(listingId)
      if (res?.success) await loadData()
      else alert(res?.message || cs.alerts.closeFailed)
    } catch (e) {
      alert(e?.message || cs.alerts.closeFailed)
    } finally {
      setListingActionBusyId(null)
    }
  }, [loadData, cs.alerts.closeFailed, db.confirmCloseListing])

  const handleListingExtend = useCallback(async (job) => {
    const next = window.prompt(db.promptExtend, job.deadlineRaw?.slice(0, 10) || '')
    if (!next) return
    setListingActionBusyId(job.id)
    setOpenListingMenuId(null)
    try {
      const res = await apiService.updateBusinessCandidateSharingListing(job.id, { recruitmentDeadline: next })
      if (res?.success) await loadData()
      else alert(res?.message || cs.alerts.extendFailed)
    } catch (e) {
      alert(e?.message || cs.alerts.extendFailed)
    } finally {
      setListingActionBusyId(null)
    }
  }, [loadData, cs.alerts.extendFailed, db.promptExtend])

  const handleListingEditFee = useCallback((job) => {
    setOpenListingMenuId(null)
    if (job.jobId) {
      window.open(`${window.location.origin}/business/jobs/${encodeURIComponent(String(job.jobId))}`, '_blank', 'noopener,noreferrer')
    }
  }, [])

  const handleListingSubmitDraft = useCallback(async (listingId) => {
    setListingActionBusyId(listingId)
    setOpenListingMenuId(null)
    try {
      const res = await apiService.submitBusinessCandidateSharingListing(listingId)
      if (res?.success) await loadData()
      else alert(res?.message || cs.alerts.submitFailed)
    } catch (e) {
      alert(e?.message || cs.alerts.submitFailed)
    } finally {
      setListingActionBusyId(null)
    }
  }, [loadData, cs.alerts.submitFailed])

  const HIRE_CONFIRM_ELIGIBLE = new Set([11, 12])

  const handleConfirmHire = useCallback(async (nomination, e) => {
    e?.stopPropagation?.()
    if (!nomination?.id || confirmingHireId) return
    if (!window.confirm(db.confirmHire(nomination.candidateName || cs.common.candidateFallback))) {
      return
    }
    setConfirmingHireId(nomination.id)
    try {
      const res = await apiService.updateBusinessApplicationStatus(nomination.id, { status: 14 })
      if (res?.success) {
        await loadData()
      } else {
        alert(res?.message || cs.alerts.confirmHireFailed)
      }
    } catch (err) {
      alert(err?.message || cs.alerts.confirmHireFailed)
    } finally {
      setConfirmingHireId(null)
    }
  }, [confirmingHireId, loadData, cs.alerts.confirmHireFailed, cs.common.candidateFallback, db])

  const showChatColumn = tab !== 'costs' && tab !== 'jobs'

  const tablePanelClass =
    'ctv-marketplace-table-panel min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm'
  const tableBodyScrollClass = 'ctv-marketplace-table-body ctv-scrollbar overflow-x-auto'

  const tbl = db.table
  const nominationHeaders = [
    tbl.candidate,
    tbl.position,
    tbl.collaborator,
    tbl.date,
    tbl.status,
  ]

  const renderNominationsTable = (list, emptyMessage, { showHireAction = false } = {}) => (
    <div className={tableBodyScrollClass}>
      <table className={`w-full min-w-[640px] border-collapse ctv-marketplace-table-ui ${BUSINESS_HP_TEXT.body}`}>
        <thead>
          <tr className={CTV_TABLE_HEAD_ROW}>
            {[...nominationHeaders, ...(showHireAction ? [''] : [])].map((h, idx) => (
              <th
                key={h || `action-${idx}`}
                className={`${CTV_TH} ${h === tbl.date || h === tbl.status || h === '' ? 'text-center' : 'text-left'}`}
              >
                {h === '' ? cs.common.actions : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan={showHireAction ? 6 : 5} className={`${CTV_TD} h-full min-h-[12rem] text-center align-middle text-slate-400`}>
                {emptyMessage}
              </td>
            </tr>
          ) : list.map((n) => {
            const sc = getNominationStatusBadgeStyle(n.statusCode)
            const sel = String(selectedNomination?.id) === String(n.nominationId)
            const statusCode = Number(n.statusCode)
            const canConfirmHire = showHireAction && HIRE_CONFIRM_ELIGIBLE.has(statusCode)
            const hireDone = statusCode === 14 || statusCode === 15
            return (
              <tr
                key={n.nominationId}
                className={`cursor-pointer border-t border-slate-100 transition-colors ${sel ? 'bg-[#e8f4fa]/80' : 'hover:bg-slate-50/80'}`}
                onClick={() => setSelectedNomination(n.raw)}
              >
                <td className={CTV_TD}>
                  <div className="flex items-center gap-2.5">
                    <Avatar id={n.id} size={24} />
                    <div>
                      <div className="font-semibold text-slate-800">{n.name}</div>
                      {n.subName ? <div className={`text-slate-400 ${BUSINESS_HP_TEXT.caption}`}>{n.subName}</div> : null}
                    </div>
                  </div>
                </td>
                <td className={CTV_TD}>
                  <div className="font-medium text-slate-800">{n.position}</div>
                  <div className={`text-slate-400 ${BUSINESS_HP_TEXT.caption}`}>{n.posCode}</div>
                </td>
                <td className={`${CTV_TD} font-medium text-slate-700`}>{n.ctv}</td>
                <td className={`${CTV_TD} text-center text-slate-500`}>{n.date}</td>
                <td className={`${CTV_TD} text-center`}>
                  <span className={`rounded-full px-2 py-0.5 ${CTV_STATUS_BADGE}`} style={{ color: sc.color, background: sc.bg }}>
                    {n.status}
                  </span>
                </td>
                {showHireAction ? (
                  <td className={`${CTV_TD} text-center`} onClick={(e) => e.stopPropagation()}>
                    {canConfirmHire ? (
                      <button
                        type="button"
                        disabled={confirmingHireId === n.nominationId}
                        onClick={(e) => handleConfirmHire(n.raw, e)}
                        className={`rounded-md bg-emerald-600 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 ${BUSINESS_HP_TEXT.button}`}
                      >
                        {confirmingHireId === n.nominationId ? '...' : db.confirmHireBtn}
                      </button>
                    ) : hireDone ? (
                      <span className={`font-medium text-emerald-600 ${BUSINESS_HP_TEXT.caption}`}>{db.hireConfirmed}</span>
                    ) : (
                      <span className={`text-slate-300 ${BUSINESS_HP_TEXT.caption}`}>—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  const marketplaceShell = (
    <>
      <style>{pageStyles}</style>
      <CreateListingModal
        open={showCreate}
        onClose={closeCreateModal}
        onCreated={handleCreatedListing}
        initialJobId={createJobId}
      />
      <div
        className="business-homepage-shell flex min-h-0 h-full flex-col overflow-x-hidden bg-[#f4f6f8] xl:overflow-hidden"
        style={{ fontFamily: BUSINESS_UI_FONT }}
      >
        <div className={`business-homepage-ui business-app-ui flex h-full min-h-0 w-full flex-1 flex-col ${CTV_SHELL_PAD}`}>
          <BusinessQuickActionsPageLayout
            onNavigate={navigate}
            className="min-h-0 flex-1 xl:overflow-hidden"
            mainClassName="min-h-0 flex-1 xl:h-full xl:overflow-hidden"
          >
            <div className="ctv-marketplace-dashboard flex h-full min-h-0 flex-1 flex-col overflow-hidden">
              <div className={`flex h-full min-h-0 flex-1 flex-col overflow-hidden ${CTV_STACK_GAP}`}>
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 sm:gap-4 pb-0.5">
          <nav aria-label="Breadcrumb" className={BUSINESS_HP_TEXT.meta}>
            <button
              type="button"
              onClick={() => navigate('/business')}
              className="transition hover:text-[#0077B6]"
            >
              {breadcrumbHome}
            </button>
            <span className="mx-1.5 text-slate-400">&gt;</span>
            <button
              type="button"
              onClick={backToMarketplaceIntro}
              className="transition hover:text-[#0077B6]"
            >
              {breadcrumbCurrent}
            </button>
            <span className="mx-1.5 text-slate-400">&gt;</span>
            <span className="font-medium text-slate-700">{cs.onboarding.dashboardCrumb}</span>
          </nav>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0077B6] px-3 py-2 text-white shadow-sm transition-colors hover:bg-[#006399] ${BUSINESS_HP_TEXT.buttonPrimary}`}
          >
            <Plus className="h-3.5 w-3.5" /> {db.postJob}
          </button>
        </header>

        <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 xl:shrink-0">
          {statCards.map((card, index) => (
            <div
              key={card.title}
              className="biz-hp-solution-card-wrap h-full min-w-0"
              style={{ animationDelay: `${0.06 + index * 0.1}s` }}
            >
              <div className="ctv-motion-card h-full">
                <CtvKpiCard {...card} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 gap-5 overflow-x-auto border-b border-slate-200 px-0.5 scrollbar-hide sm:gap-6 xl:shrink-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTabChange(t.key)}
              className={`-mb-px shrink-0 border-b-2 px-2 pb-2.5 pt-0.5 font-semibold transition-colors sm:px-3 sm:pb-3 ${BUSINESS_HP_TEXT.body} ${
                tab === t.key
                  ? 'border-[#0077B6] text-[#0077B6]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ctv-marketplace-body">
            <div
              className={
                showChatColumn
                  ? 'ctv-marketplace-workspace--split grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:gap-4'
                  : 'ctv-marketplace-workspace'
              }
            >
          <div className="ctv-marketplace-col ctv-marketplace-col--table flex min-h-0 flex-1 flex-col">
            {tab === 'jobs' && (
              <div className={tablePanelClass}>
                <div className={`${CTV_JOBS_TOOLBAR} ${CTV_PANEL_HEAD}`}>
                  <div className="flex shrink-0 items-center gap-2 pb-0.5 sm:pb-1">
                    <span className={BUSINESS_HP_TEXT.section}>{db.jobsPanelTitle}</span>
                    <span className={`rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 ${BUSINESS_HP_TEXT.micro}`}>
                      {filteredJobsData.length}/{jobsData.length}
                    </span>
                  </div>
                  <div className={CTV_JOBS_FILTERS}>
                    <label className={CTV_FILTER_LABEL}>
                      {db.filters.status}
                      <select
                        value={jobFilterStatus}
                        onChange={(e) => setJobFilterStatus(e.target.value)}
                        className={`${CTV_FILTER_SELECT} min-w-[6.5rem] sm:min-w-[7rem]`}
                      >
                        <option value="">{cs.common.all}</option>
                        <option value="0">{getMarketplaceListingStatusLabel(0, language)}</option>
                        <option value="1">{getMarketplaceListingStatusLabel(1, language)}</option>
                        <option value="3">{getMarketplaceListingStatusLabel(3, language)}</option>
                        <option value="4">{getMarketplaceListingStatusLabel(4, language)}</option>
                        <option value="5">{getMarketplaceListingStatusLabel(5, language)}</option>
                      </select>
                    </label>
                    <label className={CTV_FILTER_LABEL}>
                      {db.filters.deadline}
                      <select
                        value={jobFilterDeadline}
                        onChange={(e) => setJobFilterDeadline(e.target.value)}
                        className={`${CTV_FILTER_SELECT} min-w-[6.5rem] sm:min-w-[7rem]`}
                      >
                        <option value="">{cs.common.all}</option>
                        <option value="expiring">{db.filters.expiring}</option>
                        <option value="expired">{db.filters.expired}</option>
                      </select>
                    </label>
                    <label className={CTV_FILTER_LABEL}>
                      {db.filters.nominations}
                      <select
                        value={jobFilterHasNomination}
                        onChange={(e) => setJobFilterHasNomination(e.target.value)}
                        className={`${CTV_FILTER_SELECT} min-w-[5.5rem] sm:min-w-[6rem]`}
                      >
                        <option value="">{cs.common.all}</option>
                        <option value="yes">{cs.common.yes}</option>
                        <option value="no">{cs.common.no}</option>
                      </select>
                    </label>
                    <label className={CTV_FILTER_LABEL}>
                      {db.filters.interests}
                      <select
                        value={jobFilterHasInterest}
                        onChange={(e) => setJobFilterHasInterest(e.target.value)}
                        className={`${CTV_FILTER_SELECT} min-w-[5.5rem] sm:min-w-[6rem]`}
                      >
                        <option value="">{cs.common.all}</option>
                        <option value="yes">{cs.common.yes}</option>
                        <option value="no">{cs.common.no}</option>
                      </select>
                    </label>
                  </div>
                </div>
                <div className={tableBodyScrollClass}>
                  <table className={`w-full min-w-[800px] border-collapse ctv-marketplace-table-ui ${BUSINESS_HP_TEXT.body}`}>
                    <thead>
                      <tr className={CTV_TABLE_HEAD_ROW}>
                        {[tbl.job, tbl.referralFee, tbl.status, tbl.ctv, tbl.nominations, tbl.deadline, ''].map((h) => (
                          <th
                            key={h || 'actions'}
                            className={`${CTV_TH} ${h === tbl.job || h === tbl.referralFee ? 'text-left' : 'text-center'}`}
                          >
                            {h === '' ? cs.common.actions : h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJobsData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className={`${CTV_TD} h-full min-h-[12rem] text-center align-middle text-slate-400 ${BUSINESS_HP_TEXT.body}`}>
                            {jobsData.length === 0
                              ? db.emptyJobsNone
                              : db.emptyJobsFilter}
                          </td>
                        </tr>
                      ) : filteredJobsData.map((job) => {
                        const sc = getMarketplaceListingStatusStyle(job.statusCode)
                        const busy = listingActionBusyId === job.id
                        const openDetail = () => openSanCtvListingDetail(navigate, job.jobId)
                        return (
                          <tr
                            key={job.id}
                            role={job.jobId ? 'button' : undefined}
                            tabIndex={job.jobId ? 0 : undefined}
                            onClick={job.jobId ? openDetail : undefined}
                            onKeyDown={job.jobId ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                openDetail()
                              }
                            } : undefined}
                            className={`border-t border-slate-100 hover:bg-slate-50/70 ${job.jobId ? 'cursor-pointer' : ''}`}
                          >
                            <td className={CTV_TD}>
                              <div className="font-semibold text-slate-800">{job.title}</div>
                              <div className={`text-slate-400 ${BUSINESS_HP_TEXT.caption}`}>{job.code}</div>
                            </td>
                            <td className={`max-w-[200px] leading-snug text-slate-600 ${CTV_TD} ${BUSINESS_HP_TEXT.body}`}>
                              <span className="line-clamp-2" title={job.referralFee}>
                                {formatReferralFeeCell(job.referralFee)}
                              </span>
                            </td>
                            <td className={`${CTV_TD} text-center`}>
                              <span className={`rounded-full px-2 py-0.5 font-semibold ${BUSINESS_HP_TEXT.micro}`} style={{ color: sc.color, background: sc.bg }}>
                                {job.status}
                              </span>
                            </td>
                            <td className={`${CTV_TD} text-center font-medium tabular-nums text-slate-700`}>{job.ctvCount ?? '—'}</td>
                            <td className={`${CTV_TD} text-center font-medium tabular-nums text-slate-700`}>{job.nominationCount ?? '—'}</td>
                            <td className={`${CTV_TD} text-center`}>
                              <div className="text-slate-600">{job.deadline}</div>
                              {job.expiringSoon ? (
                                <div className={`mt-0.5 inline-flex items-center gap-0.5 font-semibold text-amber-700 ${BUSINESS_HP_TEXT.micro}`}>
                                  <AlertTriangle className="h-3 w-3" aria-hidden />
                                  {tbl.expiringSoon}
                                </div>
                              ) : null}
                            </td>
                            <td className={`relative ${CTV_TD} text-center`} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setOpenListingMenuId((prev) => (prev === job.id ? null : job.id))}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                aria-label={cs.common.actions}
                              >
                                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                              </button>
                              {openListingMenuId === job.id ? (
                                <div className="absolute right-2 top-full z-20 mt-1 min-w-[10.5rem] rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg sm:right-3">
                                  {job.jobId ? (
                                    <button type="button" className={`block w-full px-3 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-50 ${BUSINESS_HP_TEXT.body}`} onClick={() => openDetail()}>
                                      {db.menu.viewDetail}
                                    </button>
                                  ) : null}
                                  {job.jobId ? (
                                    <button type="button" className={`block w-full px-3 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-50 ${BUSINESS_HP_TEXT.body}`} onClick={() => handleListingEditFee(job)}>
                                      {db.menu.editFee}
                                    </button>
                                  ) : null}
                                  {Number(job.statusCode) === MARKETPLACE_LISTING_STATUS.DRAFT ? (
                                    <button type="button" className={`block w-full px-3 py-1.5 text-left font-medium text-[#0077B6] hover:bg-slate-50 ${BUSINESS_HP_TEXT.body}`} onClick={() => handleListingSubmitDraft(job.id)}>
                                      {db.menu.submitWs}
                                    </button>
                                  ) : null}
                                  {Number(job.statusCode) === MARKETPLACE_LISTING_STATUS.PUBLISHED ? (
                                    <button type="button" className={`block w-full px-3 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-50 ${BUSINESS_HP_TEXT.body}`} onClick={() => handleListingPause(job.id)}>
                                      {db.menu.pause}
                                    </button>
                                  ) : null}
                                  {[MARKETPLACE_LISTING_STATUS.PUBLISHED, MARKETPLACE_LISTING_STATUS.PAUSED].includes(Number(job.statusCode)) ? (
                                    <button type="button" className={`block w-full px-3 py-1.5 text-left font-medium text-rose-700 hover:bg-rose-50 ${BUSINESS_HP_TEXT.body}`} onClick={() => handleListingClose(job.id)}>
                                      {db.menu.closeJob}
                                    </button>
                                  ) : null}
                                  {(job.expiringSoon || Number(job.statusCode) === MARKETPLACE_LISTING_STATUS.PUBLISHED) ? (
                                    <button type="button" className={`block w-full px-3 py-1.5 text-left font-medium text-amber-800 hover:bg-amber-50 ${BUSINESS_HP_TEXT.body}`} onClick={() => handleListingExtend(job)}>
                                      {db.menu.extend}
                                    </button>
                                  ) : null}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'nominations' && (
              <div className={tablePanelClass}>
                <div className={`flex items-center gap-2.5 border-b border-slate-100 ${CTV_PANEL_HEAD}`}>
                  <span className={BUSINESS_HP_TEXT.section}>{db.tabs.nominations}</span>
                  <span className={CTV_COUNT_BADGE}>{nominationsData.length}</span>
                </div>
                {renderNominationsTable(nominationsData, db.emptyNominations, { showHireAction: true })}
              </div>
            )}

            {tab === 'candidates' && (
              <div className={tablePanelClass}>
                <div className={`flex items-center gap-2.5 border-b border-slate-100 ${CTV_PANEL_HEAD}`}>
                  <span className={BUSINESS_HP_TEXT.section}>{db.kpiPipeline}</span>
                  <span className={CTV_COUNT_BADGE}>{candidatesData.length}</span>
                </div>
                {renderNominationsTable(candidatesData, db.emptyCandidates, { showHireAction: true })}
              </div>
            )}

            {tab === 'costs' && (
              <div className={tablePanelClass}>
                <div className={`flex shrink-0 items-center justify-between border-b border-slate-100 ${CTV_PANEL_HEAD}`}>
                  <span className={BUSINESS_HP_TEXT.section}>{db.tabs.costs}</span>
                  <span className={CTV_COUNT_BADGE}>{settlements.length}</span>
                </div>
                {settlements.length === 0 ? (
                  <div className={`${tableBodyScrollClass} flex flex-1 items-center justify-center px-4 py-8 text-center text-slate-400 ${BUSINESS_HP_TEXT.body}`}>
                    {db.emptySettlements}
                  </div>
                ) : (
                  <div className={tableBodyScrollClass}>
                    <table className={`w-full border-collapse ctv-marketplace-table-ui ${BUSINESS_HP_TEXT.body}`}>
                      <thead>
                        <tr className={CTV_TABLE_HEAD_ROW}>
                          {[tbl.candidate, tbl.position, tbl.status, tbl.amountBusinessToWs, tbl.date].map((h) => (
                            <th key={h} className={`${CTV_TH} text-left`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {settlements.map((set) => (
                          <tr key={set.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                            <td className={`${CTV_TD} font-semibold text-slate-800`}>{set.candidateName || cs.common.emDash}</td>
                            <td className={`${CTV_TD} text-slate-600`}>
                              {getLocalizedJobTitle(
                                { title: set.jobTitle, titleEn: set.jobTitleEn, titleJp: set.jobTitleJp },
                                language,
                              ) || set.jobTitle}
                              {' '}
                              {set.jobCode ? `(${set.jobCode})` : ''}
                            </td>
                            <td className={CTV_TD}>
                              <span className={`rounded-full px-2 py-0.5 font-semibold ${CTV_STATUS_BADGE} ${set.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {getMarketplaceSettlementStatusLabel(set.status, language)}
                              </span>
                            </td>
                            <td className={`${CTV_TD} tabular-nums font-semibold text-slate-800`}>{Number(set.totalAmountBusiness || 0).toLocaleString(language === 'ja' ? 'ja-JP' : language === 'en' ? 'en-US' : 'vi-VN')}đ</td>
                            <td className={`${CTV_TD} text-slate-500`}>{formatMarketplaceDate(set.createdAt, language)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {showChatColumn && (
            <div className="ctv-marketplace-col min-h-0 flex flex-col overflow-hidden">
              <div className="flex min-h-0 flex-1 flex-col">
                <ThreeWayChatPanel selectedNomination={selectedNomination} cs={cs} language={language} />
              </div>
            </div>
          )}
            </div>
              </div>
            </div>
            </div>
          </BusinessQuickActionsPageLayout>
        </div>
      </div>
    </>
  )

  if (loading) {
    return (
      <>
        <style>{pageStyles}</style>
        <CreateListingModal
          open={showCreate}
          onClose={closeCreateModal}
          onCreated={handleCreatedListing}
          initialJobId={createJobId}
        />
        <div className="h-full min-h-0 w-full flex items-center justify-center bg-slate-50">
          <div className={`flex items-center gap-2 text-slate-500 ${BUSINESS_HP_TEXT.body}`}>
            <Loader2 className="w-5 h-5 animate-spin" /> {cs.loading.marketplace}
          </div>
        </div>
      </>
    )
  }

  if (showOnboarding) {
    return (
      <>
        <style>{pageStyles}</style>
        <CreateListingModal
          open={showCreate}
          onClose={closeCreateModal}
          onCreated={handleCreatedListing}
          initialJobId={createJobId}
        />
        <div className="business-homepage-shell min-h-0 h-full overflow-x-hidden bg-[#f4f6f8] xl:h-full xl:overflow-hidden" style={{ fontFamily: BUSINESS_UI_FONT }}>
          <div className={`business-homepage-ui business-app-ui flex h-full min-h-0 w-full flex-1 flex-col ${CTV_SHELL_PAD}`}>
            <BusinessQuickActionsPageLayout onNavigate={navigate}>
              <OnboardingView
                hasMarketplaceData={hasListings || nominations.length > 0}
                platformOverview={platformOverview}
                onCreate={openCreateModal}
                onViewDetails={enterMarketplaceDashboard}
                onNavigate={navigate}
                breadcrumbHome={breadcrumbHome}
                breadcrumbCurrent={breadcrumbCurrent}
                cs={cs}
                language={language}
              />
            </BusinessQuickActionsPageLayout>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="h-full min-h-0 max-h-full overflow-hidden">
      {marketplaceShell}
    </div>
  )
}

export default CandidateSharing