import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Loader2,
  Check,
  ArrowUpRight,
  Sparkles,
  Megaphone,
  CalendarDays,
  Building2,
  LayoutGrid,
} from 'lucide-react'
import apiService from '../../services/api'
import TemplateSlidePanel from '../../component/BusinessBranding/TemplateSlidePanel'
import BrandingAlertModal from '../../component/BusinessBranding/BrandingAlertModal'
import BrandingServiceIntakeModal from '../../component/BusinessBranding/BrandingServiceIntakeModal'
import { getBillingServiceKeyFromIntake } from '../../utils/serviceRequestNoteDisplay'
import { getServiceByKey } from '../../utils/businessServiceRequestCatalog'
import BusinessQuickActionsPageLayout from '../../component/Bussiness/BusinessQuickActionsPageLayout.jsx'
import { useLanguage } from '../../context/LanguageContext'
import {
  getBrandingCopy,
  getBrandingServicePackages,
} from '../../i18n/businessAppI18n'

const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"
const BRAND = '#0077B6'

const homepageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .business-homepage-scroll::-webkit-scrollbar { width: 4px; }
  .business-homepage-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

  .business-homepage-shell { --hp-zoom: 1; }
  @media (min-width: 1024px) and (max-width: 1279px) {
    .business-homepage-shell { --hp-zoom: 0.9; }
  }
  @media (min-width: 1280px) and (max-width: 1535px) {
    .business-homepage-shell { --hp-zoom: 0.86; }
  }
  @media (min-width: 1024px) and (max-height: 760px) {
    .business-homepage-shell { --hp-zoom: 0.78; }
  }
  @media (min-width: 1024px) and (min-height: 761px) and (max-height: 860px) {
    .business-homepage-shell { --hp-zoom: 0.84; }
  }
  @media (min-width: 1536px) and (min-height: 861px) {
    .business-homepage-shell { --hp-zoom: 0.94; }
  }
  @media (min-width: 1920px) and (min-height: 900px) {
    .business-homepage-shell { --hp-zoom: 1; }
  }
  .business-homepage-ui { zoom: var(--hp-zoom); }
  @supports not (zoom: 1) {
    .business-homepage-ui {
      transform: scale(var(--hp-zoom));
      transform-origin: top left;
      width: calc(100% / var(--hp-zoom));
    }
  }

  @keyframes biz-hp-card-slide-in {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .biz-hp-solution-card-wrap {
    height: 100%;
    animation: biz-hp-card-slide-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  }
  .biz-hp-solution-card {
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.28s ease;
    will-change: transform;
  }
  .biz-hp-solution-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 32px -12px rgba(0, 119, 182, 0.35);
  }
  .biz-hp-solution-card.biz-hp-solution-card--dark:hover {
    box-shadow: 0 16px 32px -12px rgba(0, 60, 100, 0.45);
  }
  @media (prefers-reduced-motion: reduce) {
    .biz-hp-solution-card-wrap { animation: none; }
    .biz-hp-solution-card { transition: none; }
    .biz-hp-solution-card:hover { transform: none; }
  }

  .branding-service-cards-grid {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  @media (min-width: 640px) {
    .branding-service-cards-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`

const CARD_SURFACE = {
  brandLight: 'bg-[#e8f4fa] border border-[#cce5f0]/80 text-slate-900',
  neutral: 'bg-white border border-slate-200/90 text-slate-900',
  primary: 'bg-[#0077B6] border border-[#0077B6] text-white shadow-sm shadow-[#0077B6]/15',
}

const PACKAGE_ICONS = {
  landing: Sparkles,
  recruitment_ads: Megaphone,
  recruitment_event: CalendarDays,
  company_profile: Building2,
}

const CTA_TAG_STYLE = {
  free: 'bg-emerald-100 text-emerald-700',
  pro: 'bg-violet-100 text-violet-700',
}

const DELIVERY_BADGE_STYLE = {
  self_service: 'bg-emerald-100 text-emerald-800',
  ws_support: 'bg-amber-100 text-amber-800',
}

const READY_NOW_BADGE_STYLE = 'bg-sky-100 text-sky-800'

const SERVICE_CARD_BADGE =
  'inline-flex h-[1.375rem] items-center rounded-full px-2 text-[9px] font-bold uppercase tracking-wide sm:text-[10px]'

function ServiceCardCtaButton({ cta, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-[2.125rem] w-full items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-center text-[9px] font-semibold leading-tight text-slate-800 transition-colors hover:border-[#0077B6]/30 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[2.25rem] sm:text-[10px]"
    >
      <span className="min-w-0 flex-1 line-clamp-2">{cta.label}</span>
      {cta.tag ? (
        <span
          className={`inline-flex h-5 min-w-[2rem] shrink-0 items-center justify-center rounded px-1.5 text-[8px] font-bold uppercase tracking-wide ${
            CTA_TAG_STYLE[cta.tagTone] || 'bg-slate-100 text-slate-600'
          }`}
        >
          {cta.tag}
        </span>
      ) : null}
    </button>
  )
}

function BrandingServiceCard({ card, onCta, loadingKey, copy, hasCreatedLandingPages, onManageLandingPages }) {
  const isOnDark = card.variant === 'primary'
  const surface = CARD_SURFACE[card.variant] || CARD_SURFACE.neutral
  const DecoIcon = PACKAGE_ICONS[card.id] || Sparkles
  const busy = Boolean(loadingKey && (loadingKey === card.serviceKey || loadingKey === card.id))
  const primaryCta = card.ctas?.[0]

  const bodyClass = isOnDark ? 'text-white/95' : 'text-slate-600'
  const mutedClass = isOnDark ? 'text-white/85' : 'text-slate-500'

  return (
    <article
      className={`biz-hp-solution-card ${isOnDark ? 'biz-hp-solution-card--dark' : ''} relative flex h-full min-h-[260px] flex-col overflow-hidden rounded-[1.25rem] p-3 sm:p-3.5 xl:min-h-[280px] 2xl:min-h-[300px] 2xl:p-4 ${surface}`}
    >
      <div className="relative z-20 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${
              isOnDark ? 'bg-white/20 text-white' : 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-100'
            }`}
          >
            {card.num}
          </span>
          {card.readyNow ? (
            <span className={`${SERVICE_CARD_BADGE} ${READY_NOW_BADGE_STYLE}`}>{copy.readyNowBadge}</span>
          ) : null}
          {card.deliveryBadge ? (
            <span
              className={`${SERVICE_CARD_BADGE} ${
                DELIVERY_BADGE_STYLE[card.deliveryBadge.type] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {card.deliveryBadge.label}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => primaryCta && onCta(card, primaryCta)}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-60 ${
            isOnDark
              ? 'bg-white/15 text-white hover:bg-white/25'
              : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-100 hover:text-[#0077B6]'
          }`}
          aria-label={primaryCta ? primaryCta.label : copy.useCard(card.title)}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" strokeWidth={2} />}
        </button>
      </div>

      <div className="relative z-10 mt-1.5 pr-10 sm:mt-2 sm:pr-14">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight sm:text-base 2xl:text-lg">{card.title}</h3>
        <p className={`mt-1 line-clamp-2 text-[11px] leading-snug sm:text-xs 2xl:text-[13px] ${mutedClass}`}>{card.subtitle}</p>
      </div>

      <div className="pointer-events-none absolute right-0 top-[2.75rem] z-0 translate-x-[18%] sm:top-[3.25rem]" aria-hidden>
        <DecoIcon
          className={`h-16 w-16 sm:h-[5.5rem] sm:w-[5.5rem] 2xl:h-28 2xl:w-28 ${isOnDark ? 'text-white/30' : 'text-[#0077B6]/22'}`}
          strokeWidth={1.1}
        />
      </div>

      <div className="relative z-10 mt-2 flex min-h-0 flex-1 flex-col">
        <h4 className={`shrink-0 text-[11px] font-bold sm:text-xs ${isOnDark ? 'text-white' : 'text-[#0077B6]'}`}>
          {copy.featuresHeading}
        </h4>
        <ul className={`mt-1 flex min-h-0 flex-1 flex-col gap-1 text-[10px] leading-snug sm:text-[11px] ${bodyClass}`}>
          {card.features.map((line) => (
            <li key={line} className="flex gap-2">
              <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isOnDark ? 'text-white' : 'text-[#0077B6]'}`} strokeWidth={2.5} />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={`relative z-10 mt-auto shrink-0 border-t pt-2 ${isOnDark ? 'border-white/20' : 'border-slate-200/80'}`}>
        <h4 className={`text-[11px] font-bold sm:text-xs ${isOnDark ? 'text-white' : 'text-[#0077B6]'}`}>{copy.suitableHeading}</h4>
        <p className={`mt-1 min-h-[2rem] text-[10px] leading-snug sm:min-h-[2.25rem] sm:text-[11px] ${bodyClass}`}>{card.suitableFor}</p>
        {card.id === 'landing' && hasCreatedLandingPages ? (
          <button
            type="button"
            onClick={onManageLandingPages}
            className="mt-1.5 flex min-h-[2.125rem] w-full items-center justify-center gap-1 rounded-md border border-[#0077B6]/35 bg-[#e8f4fa] px-1.5 py-1 text-[9px] font-semibold text-[#0077B6] transition-colors hover:bg-[#dceef8] sm:min-h-[2.25rem] sm:text-[10px]"
          >
            <LayoutGrid className="h-3 w-3 shrink-0" strokeWidth={2.25} />
            {copy.manageLandingPagesCta}
          </button>
        ) : null}
        <div
          className={`mt-1.5 grid gap-1.5 ${
            (card.ctas || []).length >= 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-[14rem]'
          }`}
        >
          {(card.ctas || []).map((cta) => (
            <ServiceCardCtaButton
              key={cta.action}
              cta={cta}
              disabled={busy}
              onClick={() => onCta(card, cta)}
            />
          ))}
        </div>
      </div>
    </article>
  )
}

function BrandingOverviewMain({
  onNavigate,
  onCardCta,
  onConsultation,
  requestLoadingKey,
  copy,
  servicePackages,
  hasCreatedLandingPages,
  onManageLandingPages,
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="shrink-0">
        <nav aria-label="Breadcrumb" className="text-[11px] text-slate-500 lg:text-xs">
          <button
            type="button"
            onClick={() => onNavigate('/business')}
            className="transition hover:text-[#0077B6]"
          >
            {copy.breadcrumb.home}
          </button>
          <span className="mx-1.5 text-slate-400">&gt;</span>
          <span className="font-medium text-slate-700">{copy.breadcrumb.current}</span>
        </nav>
      </div>

      <div className="branding-service-cards-grid grid items-stretch gap-2">
        {servicePackages.map((card, index) => (
          <div
            key={card.num}
            className="biz-hp-solution-card-wrap min-w-0"
            style={{ animationDelay: `${0.06 + index * 0.1}s` }}
          >
            <BrandingServiceCard
              card={card}
              onCta={onCardCta}
              loadingKey={requestLoadingKey}
              copy={copy}
              hasCreatedLandingPages={card.id === 'landing' && hasCreatedLandingPages}
              onManageLandingPages={onManageLandingPages}
            />
          </div>
        ))}
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 flex-1 text-xs leading-snug text-slate-700">
          <span className="font-semibold text-slate-900">{copy.consultTitle}</span>
          {' '}
          {copy.consultBody}
        </p>
        <button
          type="button"
          disabled={requestLoadingKey === 'consultation'}
          onClick={onConsultation}
          className="shrink-0 rounded-lg bg-[#0077B6] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#006399] disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {requestLoadingKey === 'consultation' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {copy.consultCta}
        </button>
      </div>
    </div>
  )
}

const LANDING_PAGES_MANAGE_PATH = '/business/saiyo/landing-pages'

const Branding = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { language } = useLanguage()
  const copy = useMemo(() => getBrandingCopy(language), [language])
  const servicePackages = useMemo(() => getBrandingServicePackages(language), [language])
  const [loading, setLoading] = useState(true)
  const [hasCreatedLandingPages, setHasCreatedLandingPages] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [requestLoadingKey, setRequestLoadingKey] = useState(null)
  const [intakeModal, setIntakeModal] = useState({ open: false, serviceKey: null })
  const [alertModal, setAlertModal] = useState({
    open: false,
    kind: 'notice',
    title: '',
    message: '',
    variant: 'info',
    confirmLabel: 'OK',
    cancelLabel: '',
    hideCancel: false,
    onConfirm: null,
  })

  const closeAlertModal = () => {
    setAlertModal((prev) => ({ ...prev, open: false, onConfirm: null }))
  }

  const openNoticeModal = (title, message, variant = 'info', confirmLabel) => {
    setAlertModal({
      open: true,
      kind: 'notice',
      title,
      message,
      variant,
      confirmLabel: confirmLabel ?? copy.alerts.ok,
      cancelLabel: copy.alerts.cancel,
      hideCancel: false,
      onConfirm: null,
    })
  }

  const openConfirmModal = ({
    title,
    message,
    onConfirm,
    variant = 'info',
    confirmLabel,
    cancelLabel,
    hideCancel = false,
  }) => {
    setAlertModal({
      open: true,
      kind: 'confirm',
      title,
      message,
      variant,
      confirmLabel: confirmLabel ?? copy.alerts.ok,
      cancelLabel: cancelLabel ?? copy.alerts.cancel,
      hideCancel,
      onConfirm,
    })
  }

  const loadLandingPagePresence = useCallback(async () => {
    try {
      setLoading(true)
      const listRes = await apiService.getBusinessLandingPages({ page: 1, limit: 1 })
      if (listRes?.success) {
        const total = listRes.data?.pagination?.total
        const list = listRes.data?.landingPages || []
        setHasCreatedLandingPages(
          (typeof total === 'number' ? total > 0 : list.length > 0),
        )
      } else {
        setHasCreatedLandingPages(false)
      }
    } catch (e) {
      console.error(e)
      setHasCreatedLandingPages(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLandingPagePresence()
  }, [loadLandingPagePresence])

  useEffect(() => {
    if (location.search.includes('view=')) {
      navigate(location.pathname, { replace: true, state: location.state })
    }
  }, [location.pathname, location.search, location.state, navigate])

  useEffect(() => {
    if (location.state?.openLandingCreate) {
      setShowCreate(true)
      navigate(location.pathname + location.search, { replace: true, state: {} })
    }
  }, [location.pathname, location.search, location.state, navigate])

  const handleCreated = () => {
    loadLandingPagePresence()
  }

  const handleNavigate = useMemo(() => (path) => navigate(path), [navigate])

  const handleManageLandingPages = useCallback(() => {
    navigate(LANDING_PAGES_MANAGE_PATH)
  }, [navigate])

  const sendServiceRequest = async (serviceKey, note = null) => {
    setRequestLoadingKey(serviceKey)
    try {
      const billingKey = getBillingServiceKeyFromIntake(serviceKey)
      let res
      if (billingKey) {
        const catalog = getServiceByKey(billingKey)
        res = await apiService.createBusinessServiceRequest({
          serviceKey: billingKey,
          serviceTitle: catalog?.title,
          note,
        })
      } else {
        const body = { serviceKey }
        if (note) body.note = note
        res = await apiService.createBusinessSaiyoBrandingServiceRequest(body)
      }
      if (res?.success) {
        openConfirmModal({
          title: copy.alerts.requestSentTitle,
          message: copy.alerts.requestSentMessage(res.message),
          variant: 'success',
          confirmLabel: copy.alerts.openMessages,
          hideCancel: true,
          onConfirm: () => navigate('/business/messages?tab=ws'),
        })
      } else {
        openNoticeModal(
          copy.alerts.requestFailedTitle,
          res?.message || copy.alerts.requestFailedMessage,
          'error',
        )
      }
    } catch (e) {
      openNoticeModal(
        copy.alerts.requestFailedTitle,
        e?.message || copy.alerts.requestFailedMessage,
        'error',
      )
    } finally {
      setRequestLoadingKey(null)
    }
  }

  const handleCardCta = (pkg, cta) => {
    if (cta.action === 'landing_free') {
      setShowCreate(true)
      return
    }
    if (cta.action === 'landing_pro') {
      navigate('/business/service-requests/landing-page')
      return
    }
    if (cta.action === 'view_docs' && cta.docsPath) {
      navigate(cta.docsPath)
      return
    }
    if (cta.action === 'request_service' && pkg.serviceKey) {
      if (pkg.serviceKey === 'recruitment_ads' || pkg.serviceKey === 'recruitment_event' || pkg.serviceKey === 'company_profile') {
        setIntakeModal({ open: true, serviceKey: pkg.serviceKey })
        return
      }
      sendServiceRequest(pkg.serviceKey)
    }
  }

  const handleIntakeSubmit = async ({ serviceKey, note }) => {
    await sendServiceRequest(serviceKey, note)
    setIntakeModal({ open: false, serviceKey: null })
  }

  const handleConsultation = () => {
    sendServiceRequest('consultation')
  }

  return (
    <>
      <style>{homepageStyles}</style>
      <TemplateSlidePanel open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      <BrandingServiceIntakeModal
        open={intakeModal.open}
        serviceKey={intakeModal.serviceKey}
        onClose={() => setIntakeModal({ open: false, serviceKey: null })}
        onSubmit={handleIntakeSubmit}
        submitting={requestLoadingKey === intakeModal.serviceKey}
      />
      <BrandingAlertModal
        open={alertModal.open}
        kind={alertModal.kind}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
        confirmLabel={alertModal.confirmLabel}
        cancelLabel={alertModal.cancelLabel}
        hideCancel={alertModal.hideCancel}
        onConfirm={alertModal.onConfirm}
        onClose={closeAlertModal}
      />

      <div
        className="business-homepage-shell flex h-full min-h-0 flex-col overflow-x-hidden overflow-y-auto bg-[#f4f6f8] xl:overflow-hidden"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="business-homepage-ui flex h-full min-h-0 w-full flex-1 flex-col p-2.5 sm:p-3">
          {loading ? (
            <div className="flex flex-1 items-center justify-center gap-2 py-20 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#0077B6]" />
              <span className="text-sm">{copy.loading}</span>
            </div>
          ) : (
            <BusinessQuickActionsPageLayout onNavigate={handleNavigate}>
              <BrandingOverviewMain
                onNavigate={handleNavigate}
                onCardCta={handleCardCta}
                onConsultation={handleConsultation}
                requestLoadingKey={requestLoadingKey}
                copy={copy}
                servicePackages={servicePackages}
                hasCreatedLandingPages={hasCreatedLandingPages}
                onManageLandingPages={handleManageLandingPages}
              />
            </BusinessQuickActionsPageLayout>
          )}
        </div>
      </div>
    </>
  )
}

export default Branding
