import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ChevronRight, Loader2, Pause, CalendarPlus, XCircle, ExternalLink,
  Users, FileText, Wallet, LayoutGrid, UserCheck,
} from 'lucide-react'
import apiService from '../../services/api'
import NominationChat from '../../component/Chat/NominationChat'
import BusinessQuickActionsPageLayout from '../../component/Bussiness/BusinessQuickActionsPageLayout.jsx'
import {
  buildBusinessJobDetailTabs,
  BusinessJobDetailSectionList,
} from '../../utils/businessJobDetailView'
import {
  BUSINESS_HOMEPAGE_PAGE_BASE_STYLES,
  BUSINESS_HP_TEXT,
  BUSINESS_UI_FONT,
} from '../../utils/businessHomepageTypography'
import { useLanguage } from '../../context/LanguageContext'
import {
  getBusinessAppCopy,
  getCandidateSharingCopy,
  getMarketplaceListingStatusLabel,
  getMarketplaceListingHeaderBadge,
  getMarketplaceSettlementStatusLabel,
  formatMarketplaceDate,
  getLocalizedJobTitle,
  getApplicationStatusLabelForMarketplace,
  getMarketplaceListingReferralFeeLabel,
  getCandidateSharingJobDetailLabels,
} from '../../i18n/businessAppI18n'

const BRAND = '#0077B6'

const CTV_DETAIL_EXTRA_STYLES = `
  .business-app-ui .ctv-marketplace-table-ui {
    font-size: var(--biz-hp-body);
    line-height: 1.5;
    color: #334155;
  }
  .business-app-ui .ctv-listing-detail-ui {
    font-size: var(--biz-hp-body);
    line-height: 1.5;
    color: #334155;
  }
  .business-app-ui .ctv-listing-detail-ui .biz-jd-body,
  .business-app-ui .ctv-listing-detail-ui .biz-jd-muted {
    font-size: var(--biz-hp-body);
    line-height: 1.55;
  }
  .business-app-ui .ctv-listing-detail-ui .biz-jd-label {
    font-size: var(--biz-hp-section);
    line-height: 1.4;
    font-weight: 600;
    color: #334155;
  }
  .business-app-ui .ctv-listing-jd-sections .space-y-3 > section {
    padding: 1rem 1.25rem;
    border-radius: 0.75rem;
  }
  @media (min-width: 640px) {
    .business-app-ui .ctv-listing-jd-sections .space-y-3 > section {
      padding: 1.125rem 1.5rem;
    }
  }
  .business-app-ui .ctv-listing-jd-sections .space-y-3 {
    gap: 0.875rem;
  }
`
const pageStyles = `${BUSINESS_HOMEPAGE_PAGE_BASE_STYLES}${CTV_DETAIL_EXTRA_STYLES}`
const CTV_TABLE_HEAD_ROW = `border-b border-slate-100 bg-slate-50/80 uppercase tracking-wide text-slate-400 font-semibold ${BUSINESS_HP_TEXT.caption}`
const CTV_STATUS_BADGE = `${BUSINESS_HP_TEXT.micro} font-semibold`
const CTV_ACTION_BTN = `inline-flex items-center gap-2 rounded-lg px-3.5 py-2 font-semibold ${BUSINESS_HP_TEXT.button}`
const CTV_PANEL = 'rounded-xl border border-slate-200/90 bg-white shadow-sm'
const CTV_PANEL_PAD = 'p-4 sm:p-5'
const CTV_TH = 'px-4 py-2.5 font-semibold sm:px-5 sm:py-3'
const CTV_TD = 'px-4 py-2.5 sm:px-5 sm:py-3'
const CTV_META_LABEL = `${BUSINESS_HP_TEXT.caption} text-slate-400`

const LISTING_STATUS = {
  DRAFT: 0,
  PENDING_APPROVAL: 1,
  APPROVED: 2,
  PUBLISHED: 3,
  PAUSED: 4,
  CLOSED: 5,
  REJECTED: 6,
}

const TAB_ICONS = {
  overview: LayoutGrid,
  nominations: FileText,
  interests: Users,
  payments: Wallet,
  jd: UserCheck,
}

function badgeStyle(status) {
  const code = Number(status)
  if (code === LISTING_STATUS.PUBLISHED) return { bg: '#d1fae5', color: '#059669' }
  if (code === LISTING_STATUS.PENDING_APPROVAL) return { bg: '#fef9c3', color: '#d97706' }
  if (code === LISTING_STATUS.PAUSED) return { bg: '#e2e8f0', color: '#475569' }
  if (code === LISTING_STATUS.CLOSED) return { bg: '#fee2e2', color: '#dc2626' }
  return { bg: '#f1f5f9', color: '#64748b' }
}

function CtvListingPageShell({ children, navigate }) {
  return (
    <>
      <style>{pageStyles}</style>
      <div
        className="business-homepage-shell min-h-0 h-full overflow-x-hidden bg-[#f4f6f8] xl:h-full xl:overflow-hidden"
        style={{ fontFamily: BUSINESS_UI_FONT }}
      >
        <div className="business-homepage-ui business-app-ui flex h-full min-h-0 w-full flex-1 flex-col p-2.5 sm:p-3">
          <BusinessQuickActionsPageLayout onNavigate={navigate} className="min-h-0 flex-1">
            <div className="ctv-listing-detail-ui flex h-full min-h-0 flex-col overflow-hidden">
              {children}
            </div>
          </BusinessQuickActionsPageLayout>
        </div>
      </div>
    </>
  )
}

function NominationChatPanel({ nomination, cs, language }) {
  const introJobTitle = nomination
    ? (
      getLocalizedJobTitle(
        {
          title: nomination.jobTitle,
          titleEn: nomination.jobTitleEn,
          titleJp: nomination.jobTitleJp,
          id: nomination.jobId,
        },
        language,
      ) || nomination.jobTitle || cs.common.emDash
    )
    : cs.common.emDash
  return (
    <div className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm lg:min-h-0">
      <div className="shrink-0 border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-3.5">
        <h3 className={BUSINESS_HP_TEXT.section}>{cs.detail.chatTitle}</h3>
        <p className={`mt-0.5 ${BUSINESS_HP_TEXT.caption}`}>{cs.detail.chatSubtitle}</p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {nomination ? (
          <NominationChat
            jobApplicationId={nomination.id}
            userType="business"
            currentStatus={nomination.status}
            introCandidateName={nomination.candidateName || cs.common.emDash}
            introJobTitle={introJobTitle}
            mobileHeaderName={nomination.candidateName || cs.common.threeWayChat}
            mobileHeaderAvatar={(nomination.candidateName || '?').charAt(0).toUpperCase()}
            embeddedPanel
          />
        ) : (
          <div className={`flex flex-1 items-center justify-center px-4 py-8 text-center text-slate-400 ${BUSINESS_HP_TEXT.caption}`}>
            {cs.detail.chatEmpty}
          </div>
        )}
      </div>
    </div>
  )
}

/** Link cũ `/listings/:listingId` → chuyển sang URL theo jobId */
export function CandidateSharingListingLegacyRedirect() {
  const navigate = useNavigate()
  const { listingId } = useParams()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (!listingId) {
      navigate('/business/candidate-sharing', { replace: true })
      return undefined
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiService.getBusinessCandidateSharingListing(listingId)
        const jid = res?.data?.listing?.jobId ?? res?.data?.listing?.job?.id
        if (cancelled) return
        const qs = searchParams.toString()
        if (res?.success && jid) {
          navigate(`/business/candidate-sharing/jobs/${encodeURIComponent(String(jid))}${qs ? `?${qs}` : ''}`, { replace: true })
        } else {
          navigate('/business/candidate-sharing', { replace: true })
        }
      } catch {
        if (!cancelled) navigate('/business/candidate-sharing', { replace: true })
      }
    })()
    return () => { cancelled = true }
  }, [listingId, navigate, searchParams])

  return (
    <CtvListingPageShell navigate={navigate}>
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden />
      </div>
    </CtvListingPageShell>
  )
}

export default function CandidateSharingListingDetail() {
  const navigate = useNavigate()
  const { jobId } = useParams()
  const { language } = useLanguage()
  const cs = useMemo(() => getCandidateSharingCopy(language), [language])
  const dt = cs.detail
  const appCopy = useMemo(() => getBusinessAppCopy(language), [language])
  const breadcrumbHome = appCopy.jobs.breadcrumb.home
  const tabs = useMemo(() => Object.entries(dt.tabs).map(([id, label]) => ({
    id,
    label,
    icon: TAB_ICONS[id] || LayoutGrid,
  })), [dt.tabs])
  const [searchParams, setSearchParams] = useSearchParams()
  const urlTab = searchParams.get('tab')
  const activeTab = tabs.some((t) => t.id === urlTab) ? urlTab : 'overview'

  const [loading, setLoading] = useState(true)
  const [actionBusy, setActionBusy] = useState(false)
  const [listing, setListing] = useState(null)
  const [stats, setStats] = useState(null)
  const [nominations, setNominations] = useState([])
  const [interests, setInterests] = useState([])
  const [settlements, setSettlements] = useState([])
  const [selectedNomination, setSelectedNomination] = useState(null)
  const [jobDetail, setJobDetail] = useState(null)
  const [jobLoading, setJobLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)

  const marketplaceListingId = listing?.id

  const setTab = (id) => {
    const next = new URLSearchParams(searchParams)
    if (id === 'overview') next.delete('tab')
    else next.set('tab', id)
    setSearchParams(next, { replace: true })
  }

  const loadCore = useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    try {
      const res = await apiService.getBusinessCandidateSharingListingByJobId(jobId)
      if (res?.success && res.data) {
        const listingPayload = res.data.listing ?? (res.data.id != null ? res.data : null)
        if (listingPayload?.id != null) {
          setListing(listingPayload)
          setStats(res.data.stats ?? null)
          setLoadError(null)
        } else {
          setListing(null)
          setLoadError(dt.loadError)
        }
      } else {
        setListing(null)
        setLoadError(res?.message || dt.notFound)
      }
    } catch (err) {
      setListing(null)
      setLoadError(err?.message || dt.loadError)
    } finally {
      setLoading(false)
    }
  }, [jobId, dt.loadError, dt.notFound])

  useEffect(() => {
    loadCore()
  }, [loadCore])

  useEffect(() => {
    if (!marketplaceListingId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiService.getBusinessCandidateSharingNominations({
          listingId: marketplaceListingId,
          page: 1,
          limit: 50,
        })
        if (!cancelled && res?.success) {
          const rows = res.data?.nominations || []
          setNominations(rows)
          const urlNom = searchParams.get('nominationId')
          if (urlNom) {
            const pick = rows.find((n) => String(n.id) === String(urlNom))
            if (pick) setSelectedNomination(pick)
          }
        }
      } catch {
        if (!cancelled) setNominations([])
      }
    })()
    return () => { cancelled = true }
  }, [marketplaceListingId, searchParams])

  useEffect(() => {
    if (!marketplaceListingId || activeTab !== 'interests') return
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiService.getBusinessCandidateSharingListingInterests(marketplaceListingId, { limit: 100 })
        if (!cancelled && res?.success) setInterests(res.data?.interests || [])
      } catch {
        if (!cancelled) setInterests([])
      }
    })()
    return () => { cancelled = true }
  }, [marketplaceListingId, activeTab])

  useEffect(() => {
    if (!marketplaceListingId || activeTab !== 'payments') return
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiService.getBusinessCandidateSharingSettlements({ listingId: marketplaceListingId, limit: 50 })
        if (!cancelled && res?.success) setSettlements(res.data?.settlements || [])
      } catch {
        if (!cancelled) setSettlements([])
      }
    })()
    return () => { cancelled = true }
  }, [marketplaceListingId, activeTab])

  useEffect(() => {
    const jobId = listing?.jobId
    if (!jobId || activeTab !== 'jd') return
    let cancelled = false
    setJobLoading(true)
    ;(async () => {
      try {
        const res = await apiService.getBusinessJobById(jobId)
        if (!cancelled && res?.success) setJobDetail(res.data?.job || res.data || null)
        else if (!cancelled) setJobDetail(null)
      } catch {
        if (!cancelled) setJobDetail(null)
      } finally {
        if (!cancelled) setJobLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [listing?.jobId, activeTab])

  const jobTabs = useMemo(() => buildBusinessJobDetailTabs(jobDetail, language), [jobDetail, language])
  const listingReferralFee = useMemo(
    () => (listing ? getMarketplaceListingReferralFeeLabel(listing, language) : cs.common.emDash),
    [listing, language, cs.common.emDash],
  )
  const jdSectionEmpty = getCandidateSharingJobDetailLabels(language).sectionEmpty

  const handlePause = async () => {
    if (!listing?.id || !window.confirm(dt.confirmPause)) return
    setActionBusy(true)
    try {
      const res = await apiService.pauseBusinessCandidateSharingListing(listing.id)
      if (res?.success) await loadCore()
      else alert(res?.message || dt.alertPauseFailed)
    } catch (e) {
      alert(e?.message || dt.alertPauseFailed)
    } finally {
      setActionBusy(false)
    }
  }

  const handleClose = async () => {
    if (!listing?.id || !window.confirm(dt.confirmClose)) return
    setActionBusy(true)
    try {
      const res = await apiService.closeBusinessCandidateSharingListing(listing.id)
      if (res?.success) await loadCore()
      else alert(res?.message || dt.alertCloseFailed)
    } catch (e) {
      alert(e?.message || dt.alertCloseFailed)
    } finally {
      setActionBusy(false)
    }
  }

  const handleExtend = async () => {
    if (!listing?.id) return
    const current = listing.recruitmentDeadline || listing.job?.deadline
    const next = window.prompt(dt.promptExtend, current?.slice?.(0, 10) || '')
    if (!next) return
    setActionBusy(true)
    try {
      const res = await apiService.updateBusinessCandidateSharingListing(listing.id, { recruitmentDeadline: next })
      if (res?.success) await loadCore()
      else alert(res?.message || dt.alertExtendFailed)
    } catch (e) {
      alert(e?.message || dt.alertExtendFailed)
    } finally {
      setActionBusy(false)
    }
  }

  const statusCode = Number(listing?.status)
  const canPause = [LISTING_STATUS.PUBLISHED, LISTING_STATUS.APPROVED].includes(statusCode)
  const canClose = statusCode !== LISTING_STATUS.CLOSED
  const canExtend = ![
    LISTING_STATUS.DRAFT,
    LISTING_STATUS.REJECTED,
    LISTING_STATUS.CLOSED,
  ].includes(statusCode)

  const badge = badgeStyle(statusCode)

  if (loading) {
    return (
      <CtvListingPageShell navigate={navigate}>
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden />
        </div>
      </CtvListingPageShell>
    )
  }

  if (!listing) {
    return (
      <CtvListingPageShell navigate={navigate}>
        <nav className={`mb-3 shrink-0 ${BUSINESS_HP_TEXT.meta}`} aria-label="Breadcrumb">
          <Link to="/business" className="hover:text-[#0077B6]">{breadcrumbHome}</Link>
          <span className="mx-1.5 text-slate-400">&gt;</span>
          <Link to="/business/candidate-sharing" className="hover:text-[#0077B6]">{cs.breadcrumbMarketplace}</Link>
          <span className="mx-1.5 text-slate-400">&gt;</span>
          <span className="font-medium text-slate-700">{cs.breadcrumbListingDetail}</span>
        </nav>
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200/90 bg-white px-6 py-12 text-center shadow-sm">
          <p className={`font-semibold text-slate-800 ${BUSINESS_HP_TEXT.section}`}>
            {loadError || dt.notFound}
          </p>
          <p className={`mt-2 max-w-md ${BUSINESS_HP_TEXT.caption}`}>
            {dt.notFoundBody(jobId)}
          </p>
          <Link
            to="/business/candidate-sharing"
            className={`mt-5 inline-flex items-center justify-center rounded-lg bg-[#0077B6] px-4 py-2.5 text-white hover:bg-[#006399] ${BUSINESS_HP_TEXT.buttonPrimary}`}
          >
            {dt.backToMarketplace}
          </Link>
        </div>
      </CtvListingPageShell>
    )
  }

  const title = getLocalizedJobTitle(listing.job, language) || dt.fallbackTitle
  const jobCode = listing.job?.jobCode || cs.common.emDash

  return (
    <CtvListingPageShell navigate={navigate}>
        <nav className={`mb-3 shrink-0 flex flex-wrap items-center gap-1.5 ${BUSINESS_HP_TEXT.meta}`}>
          <Link to="/business" className="hover:text-slate-800">{breadcrumbHome}</Link>
          <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />
          <Link to="/business/candidate-sharing" className="hover:text-slate-800">{cs.breadcrumbMarketplace}</Link>
          <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />
          <span className="font-medium text-slate-800">{cs.breadcrumbListingDetail}</span>
        </nav>

        <header className={`mb-4 ${CTV_PANEL} px-4 py-4 sm:px-5 sm:py-5`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wide ${BUSINESS_HP_TEXT.micro}`}
                  style={{ background: badge.bg, color: badge.color }}
                >
                  {getMarketplaceListingHeaderBadge(listing.status, language)}
                </span>
                <span className={`text-slate-400 ${BUSINESS_HP_TEXT.caption}`}>{cs.marketplaceSubtitle}</span>
              </div>
              <h1 className={BUSINESS_HP_TEXT.title}>{title}</h1>
              <p className={BUSINESS_HP_TEXT.caption}>{jobCode}</p>
              <dl className={`mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-4 ${BUSINESS_HP_TEXT.body}`}>
                <div>
                  <dt className={CTV_META_LABEL}>{dt.metaReferralFee}</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800 whitespace-pre-line">{listingReferralFee}</dd>
                </div>
                <div>
                  <dt className={CTV_META_LABEL}>{dt.metaPosted}</dt>
                  <dd className="mt-0.5 font-medium text-slate-700">{formatMarketplaceDate(listing.publishedAt || listing.approvedAt || listing.submittedAt, language)}</dd>
                </div>
                <div>
                  <dt className={CTV_META_LABEL}>{dt.metaDeadline}</dt>
                  <dd className="mt-0.5 font-medium text-slate-700">{formatMarketplaceDate(listing.recruitmentDeadline || listing.job?.deadline, language)}</dd>
                </div>
                <div>
                  <dt className={CTV_META_LABEL}>{dt.metaListingStatus}</dt>
                  <dd className="mt-0.5 font-medium text-slate-700">{getMarketplaceListingStatusLabel(listing.status, language)}</dd>
                </div>
              </dl>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {canPause ? (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={handlePause}
                  className={`${CTV_ACTION_BTN} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50`}
                >
                  {actionBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pause className="h-3.5 w-3.5" />}
                  {dt.pauseListing}
                </button>
              ) : null}
              {canExtend ? (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={handleExtend}
                  className={`${CTV_ACTION_BTN} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50`}
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  {dt.extend}
                </button>
              ) : null}
              {canClose ? (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={handleClose}
                  className={`${CTV_ACTION_BTN} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50`}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {dt.closeListing}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex gap-1.5 overflow-x-auto border-t border-slate-100 pt-3.5 scrollbar-hide">
            {tabs.map(({ id, label, icon: Icon }) => {
              const on = activeTab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 font-semibold transition-colors ${BUSINESS_HP_TEXT.button} ${
                    on ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  style={on ? { background: BRAND } : undefined}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </button>
              )
            })}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto ctv-scrollbar pb-5 pt-0.5">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: dt.kpiInterests, value: stats?.interestCount ?? listing.interestCount ?? 0 },
                  { label: dt.kpiNominations, value: stats?.nominationsCount ?? listing.nominationsCount ?? 0 },
                  { label: dt.kpiPipeline, value: stats?.pipelineCount ?? 0 },
                  { label: dt.kpiHired, value: stats?.hiredCount ?? listing.hiredCount ?? 0 },
                ].map((kpi) => (
                  <div key={kpi.label} className={`${CTV_PANEL} ${CTV_PANEL_PAD}`}>
                    <div className={`font-medium uppercase tracking-wide text-slate-400 ${BUSINESS_HP_TEXT.caption}`}>{kpi.label}</div>
                    <div className={`mt-2 tabular-nums ${BUSINESS_HP_TEXT.stat}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>
              {listing.requirements ? (
                <div className={`${CTV_PANEL} ${CTV_PANEL_PAD} text-slate-700 ${BUSINESS_HP_TEXT.body}`}>
                  <h2 className={`mb-2 ${BUSINESS_HP_TEXT.section}`}>{dt.requirementsTitle}</h2>
                  <p className="whitespace-pre-wrap">{listing.requirements}</p>
                </div>
              ) : null}
              <p className={BUSINESS_HP_TEXT.caption}>
                {dt.overviewHintTemplate.split('__TAB__')[0]}
                <button type="button" className="font-semibold" style={{ color: BRAND }} onClick={() => setTab('nominations')}>
                  {dt.tabs.nominations}
                </button>
                {dt.overviewHintTemplate.split('__TAB__')[1]}
              </p>
            </div>
          )}

          {activeTab === 'nominations' && (
            <div className="grid min-h-[420px] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:min-h-[calc(100vh-280px)]">
              <div className={`overflow-hidden ${CTV_PANEL}`}>
                <div className="overflow-x-auto">
                  <table className={`w-full min-w-[520px] border-collapse ctv-marketplace-table-ui ${BUSINESS_HP_TEXT.body}`}>
                    <thead>
                      <tr className={CTV_TABLE_HEAD_ROW}>
                        {[cs.dashboard.table.candidate, cs.dashboard.table.collaborator, cs.dashboard.table.date, cs.dashboard.table.status].map((h) => (
                          <th key={h} className={`${CTV_TH} ${h === cs.dashboard.table.date || h === cs.dashboard.table.status ? 'text-center' : 'text-left'}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {nominations.length === 0 ? (
                        <tr>
                          <td colSpan={4} className={`${CTV_TD} py-14 text-center text-slate-400 ${BUSINESS_HP_TEXT.body}`}>{dt.emptyNominations}</td>
                        </tr>
                      ) : nominations.map((n) => {
                        const sel = String(selectedNomination?.id) === String(n.id)
                        return (
                          <tr
                            key={n.id}
                            className={`cursor-pointer border-t border-slate-100 ${sel ? 'bg-[#e8f4fa]/80' : 'hover:bg-slate-50/80'}`}
                            onClick={() => setSelectedNomination(n)}
                          >
                            <td className={`${CTV_TD} font-semibold text-slate-800`}>{n.candidateName}</td>
                            <td className={`${CTV_TD} text-slate-700`}>{n.ctvName}</td>
                            <td className={`${CTV_TD} text-center text-slate-500`}>{formatMarketplaceDate(n.appliedAt, language)}</td>
                            <td className={`${CTV_TD} text-center`}>
                              <span className={`rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700 ${CTV_STATUS_BADGE}`}>
                                {getApplicationStatusLabelForMarketplace(n.status, language)}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <NominationChatPanel nomination={selectedNomination} cs={cs} language={language} />
            </div>
          )}

          {activeTab === 'interests' && (
            <div className={`overflow-hidden ${CTV_PANEL}`}>
              <table className={`w-full border-collapse ctv-marketplace-table-ui ${BUSINESS_HP_TEXT.body}`}>
                <thead>
                  <tr className={CTV_TABLE_HEAD_ROW}>
                    {[dt.interestsTable.collaborator, dt.interestsTable.code, dt.interestsTable.email, dt.interestsTable.date].map((h) => (
                      <th key={h} className={`${CTV_TH} text-left`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {interests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={`${CTV_TD} py-14 text-center text-slate-400`}>{dt.interestsTable.empty}</td>
                    </tr>
                  ) : interests.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className={`${CTV_TD} font-medium text-slate-800`}>{row.ctvName}</td>
                      <td className={`${CTV_TD} text-slate-600`}>{row.ctvCode || '—'}</td>
                      <td className={`${CTV_TD} text-slate-600`}>{row.ctvEmail || '—'}</td>
                      <td className={`${CTV_TD} text-slate-500`}>{formatMarketplaceDate(row.interestedAt, language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className={`${CTV_PANEL} ${CTV_PANEL_PAD}`}>
                <h2 className={BUSINESS_HP_TEXT.section}>{dt.paymentsConfigured}</h2>
                <p className={`mt-2 font-semibold text-slate-800 whitespace-pre-line ${BUSINESS_HP_TEXT.bodyLg}`}>{listingReferralFee}</p>
                <p className={`mt-2 ${BUSINESS_HP_TEXT.caption}`}>
                  {dt.platformFee(listing.platformFeePercent ?? 20)}
                </p>
              </div>
              <div className={`overflow-hidden ${CTV_PANEL}`}>
                <h2 className={`border-b border-slate-100 px-4 py-3 sm:px-5 ${BUSINESS_HP_TEXT.section}`}>{dt.paymentsOnHire}</h2>
                <table className={`w-full border-collapse ctv-marketplace-table-ui ${BUSINESS_HP_TEXT.body}`}>
                  <thead>
                    <tr className={CTV_TABLE_HEAD_ROW}>
                      {[cs.dashboard.table.candidate, dt.paymentsAmountBusiness, cs.dashboard.table.status, cs.dashboard.table.date].map((h) => (
                        <th key={h} className={`${CTV_TH} text-left`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.length === 0 ? (
                      <tr>
                        <td colSpan={4} className={`${CTV_TD} py-14 text-center text-slate-400`}>{dt.paymentsEmpty}</td>
                      </tr>
                    ) : settlements.map((s) => (
                      <tr key={s.id} className="border-t border-slate-100">
                        <td className={`${CTV_TD} font-medium text-slate-800`}>{s.candidateName}</td>
                        <td className={`${CTV_TD} tabular-nums text-slate-700`}>
                          {Number(s.totalAmountBusiness || 0).toLocaleString(language === 'ja' ? 'ja-JP' : language === 'en' ? 'en-US' : 'vi-VN')}đ
                        </td>
                        <td className={`${CTV_TD} text-slate-600`}>{getMarketplaceSettlementStatusLabel(s.status, language)}</td>
                        <td className={`${CTV_TD} text-slate-500`}>{formatMarketplaceDate(s.paidAt || s.createdAt, language)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'jd' && (
            <div className="space-y-4">
              <div className={`flex flex-wrap items-center justify-between gap-3 ${CTV_PANEL} px-4 py-3.5 sm:px-5 sm:py-4`}>
                <p className={`max-w-2xl leading-relaxed ${BUSINESS_HP_TEXT.bodyLg}`}>
                  {dt.jdIntro}
                </p>
                {listing.jobId ? (
                  <Link
                    to={`/business/jobs/${listing.jobId}`}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#0077B6]/30 bg-[#e8f4fa]/60 px-3.5 py-2 ${BUSINESS_HP_TEXT.button} text-[#0077B6] hover:bg-[#e8f4fa]`}
                  >
                    {dt.jdEditLink}
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                ) : null}
              </div>
              {jobLoading ? (
                <div className={`flex justify-center ${CTV_PANEL} py-16`}>
                  <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
                </div>
              ) : jobDetail ? (
                <div className={`${CTV_PANEL} ${CTV_PANEL_PAD} sm:p-6`}>
                  <section className="space-y-4">
                    <h3 className={BUSINESS_HP_TEXT.section}>{dt.jdDescription}</h3>
                    <div className="ctv-listing-jd-sections space-y-4">
                      <BusinessJobDetailSectionList sections={jobTabs.description.sections} emptyMessage={jdSectionEmpty} />
                      <BusinessJobDetailSectionList sections={jobTabs.requirements.sections} emptyMessage={jdSectionEmpty} />
                    </div>
                  </section>
                  <section className="mt-8 space-y-4 border-t border-slate-100 pt-8">
                    <h3 className={BUSINESS_HP_TEXT.section}>{dt.jdBenefits}</h3>
                    <div className="ctv-listing-jd-sections">
                      <BusinessJobDetailSectionList sections={jobTabs.benefits.sections} emptyMessage={jdSectionEmpty} />
                    </div>
                  </section>
                </div>
              ) : (
                <p className={`${CTV_PANEL} py-14 text-center ${BUSINESS_HP_TEXT.body}`}>{dt.jdLoadFailed}</p>
              )}
            </div>
          )}
        </main>
    </CtvListingPageShell>
  )
}
