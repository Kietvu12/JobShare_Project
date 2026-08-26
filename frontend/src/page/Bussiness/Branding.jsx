import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus,
  Bookmark,
  BarChart3,
  Users,
  TrendingUp,
  Loader2,
  Check,
  ArrowUpRight,
  Sparkles,
  Megaphone,
  CalendarDays,
  Building2,
} from 'lucide-react'
import apiService from '../../services/api'
import TemplateSlidePanel from '../../component/BusinessBranding/TemplateSlidePanel'
import BrandingAlertModal from '../../component/BusinessBranding/BrandingAlertModal'
import BrandingServiceIntakeModal from '../../component/BusinessBranding/BrandingServiceIntakeModal'
import { getBillingServiceKeyFromIntake } from '../../utils/serviceRequestNoteDisplay'
import { getServiceByKey } from '../../utils/businessServiceRequestCatalog'
import { isCompanyBuilderContent } from '../../utils/companyLandingPageSchema'
import { HomepageSidebar } from './Homepage'
import { useLanguage } from '../../context/LanguageContext'
import {
  getBrandingCopy,
  getBrandingServicePackages,
  getLandingPageStatusMeta,
  formatBrandingDate,
} from '../../i18n/businessAppI18n'
import { getLocalizedJobTitle } from '../../i18n/businessApp/jdBuilder'

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
  @media (min-width: 1280px) and (max-width: 1679px) {
    .branding-service-cards-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 1680px) {
    .branding-service-cards-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
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

function ServiceCardCtaButton({ cta, isOnDark, disabled, onClick }) {
  const isYellow = cta.variant === 'yellow'
  const whiteClass = isOnDark
    ? 'bg-white text-[#0077B6] hover:bg-white/90'
    : 'border border-slate-200 bg-white text-slate-800 hover:border-[#0077B6]/25 hover:bg-slate-50'
  const yellowClass = isOnDark
    ? 'border border-[#fde68a]/80 bg-[#fef9c3] text-slate-900 hover:bg-[#fde68a]'
    : 'border border-[#fde68a] bg-[#fef9c3] text-slate-800 hover:bg-[#fde68a]'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-[2.75rem] w-full items-center gap-2 rounded-lg px-2.5 text-left text-[10px] font-semibold leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[3rem] sm:text-[11px] 2xl:h-12 ${
        isYellow ? yellowClass : whiteClass
      }`}
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

function formatDate(value, language) {
  return formatBrandingDate(value, language)
}

function BrandingServiceCard({ card, onCta, loadingKey, copy }) {
  const isOnDark = card.variant === 'primary'
  const surface = CARD_SURFACE[card.variant] || CARD_SURFACE.neutral
  const DecoIcon = PACKAGE_ICONS[card.id] || Sparkles
  const busy = Boolean(loadingKey && (loadingKey === card.serviceKey || loadingKey === card.id))
  const primaryCta = card.ctas?.[0]

  const bodyClass = isOnDark ? 'text-white/95' : 'text-slate-600'
  const mutedClass = isOnDark ? 'text-white/85' : 'text-slate-500'

  return (
    <article
      className={`biz-hp-solution-card ${isOnDark ? 'biz-hp-solution-card--dark' : ''} relative grid h-full min-h-[260px] grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-[1.25rem] p-3 sm:p-3.5 xl:min-h-[280px] 2xl:min-h-[300px] 2xl:p-4 ${surface}`}
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
          {card.deliveryBadge ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide sm:text-[10px] ${
                card.deliveryBadge.type === 'self_service'
                  ? isOnDark
                    ? 'bg-emerald-400/25 text-emerald-100'
                    : 'bg-emerald-100 text-emerald-800'
                  : isOnDark
                    ? 'bg-white/15 text-white/90'
                    : 'bg-amber-100 text-amber-800'
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

      <div className="relative z-10 mt-3 flex min-h-0 flex-col">
        <h4 className={`shrink-0 text-xs font-bold sm:text-[13px] ${isOnDark ? 'text-white' : 'text-[#0077B6]'}`}>
          {copy.featuresHeading}
        </h4>
        <ul className={`mt-2 flex min-h-0 flex-1 flex-col gap-2 text-[11px] leading-snug sm:text-xs ${bodyClass}`}>
          {card.features.map((line) => (
            <li key={line} className="flex gap-2">
              <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isOnDark ? 'text-white' : 'text-[#0077B6]'}`} strokeWidth={2.5} />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={`relative z-10 mt-3 shrink-0 border-t pt-3 ${isOnDark ? 'border-white/20' : 'border-slate-200/80'}`}>
        <h4 className={`text-xs font-bold sm:text-[13px] ${isOnDark ? 'text-white' : 'text-[#0077B6]'}`}>{copy.suitableHeading}</h4>
        <p className={`mt-1.5 min-h-[2.25rem] text-[10px] leading-snug sm:min-h-[2.75rem] sm:text-[11px] 2xl:text-xs ${bodyClass}`}>{card.suitableFor}</p>
        <div className="mt-2 grid grid-cols-1 gap-1.5">
          {(card.ctas || []).map((cta) => (
            <ServiceCardCtaButton
              key={cta.action}
              cta={cta}
              isOnDark={isOnDark}
              disabled={busy}
              onClick={() => onCta(card, cta)}
            />
          ))}
        </div>
      </div>
    </article>
  )
}

function BrandingOverviewMain({ onNavigate, onCardCta, onConsultation, requestLoadingKey, copy, servicePackages }) {
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
            <BrandingServiceCard card={card} onCta={onCardCta} loadingKey={requestLoadingKey} copy={copy} />
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

function BrandingStatsSection({
  copy,
  language,
  statCards,
  statsEmpty,
  hasPublishedPage,
  displayPages,
  activities,
  setShowCreate,
  openEditor,
  copyPublicLink,
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-bold text-slate-900 sm:text-base">{copy.statsSectionTitle}</h2>

      {statsEmpty && !hasPublishedPage ? (
        <div className="rounded-xl border border-dashed border-[#0077B6]/35 bg-[#e8f4fa]/60 px-4 py-4 text-center sm:text-left">
          <p className="text-xs font-semibold text-slate-800 sm:text-sm">
            {copy.statsEmptyTitle}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
            {copy.statsEmptyBody}
          </p>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0077B6] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#006399]"
          >
            <Plus className="h-3.5 w-3.5" />
            {copy.statsEmptyCta}
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {statCards.map((s, i) => {
          const Icon = s.icon
          const accent = i === 0
          return (
            <div
              key={i}
              className={`rounded-xl border p-3 shadow-sm ${accent ? 'border-[#cce5f0]/80 bg-[#e8f4fa]' : 'border-slate-200/90 bg-white'}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: accent ? 'rgba(0,119,182,0.12)' : `${s.color}20` }}>
                  <Icon className="h-4 w-4" style={{ color: accent ? BRAND : s.color }} />
                </div>
                <span className="text-[10px] font-medium leading-snug text-slate-500 sm:text-xs">{s.label}</span>
              </div>
              <div className="text-xl font-bold tabular-nums text-slate-800">{s.value}</div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-2 lg:grid-cols-[220px_1fr] lg:items-stretch">
        <div className="flex min-h-[280px] flex-col rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:min-h-[320px] lg:h-full">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ background: 'rgba(0,119,182,0.12)' }}
            >
              <Building2 className="h-5 w-5" style={{ color: BRAND }} strokeWidth={2} />
            </div>
            <h2 className="mb-1.5 text-xs font-bold text-slate-800">{copy.companyPageTitle}</h2>
            <p className="text-[10px] leading-snug text-slate-500">{copy.companyPageDesc}</p>
          </div>
          {hasPublishedPage ? (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-4 flex w-full shrink-0 items-center justify-center gap-1 rounded-lg bg-[#0077B6] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#006399]"
            >
              <Plus className="h-3.5 w-3.5" />
              {copy.create}
            </button>
          ) : null}
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 sm:text-sm">{copy.allLandingPages}</h2>
            <button type="button" onClick={() => setShowCreate(true)} className="text-[10px] font-semibold text-[#0077B6] hover:text-[#006399] sm:text-xs">
              {copy.createNew}
            </button>
          </div>

          {displayPages.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">{copy.noLandingPages}</div>
          ) : (
            <div className="overflow-x-auto business-homepage-scroll">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-400">
                    <th className="px-2 py-2 text-left font-semibold">{copy.tableName}</th>
                    <th className="px-2 py-2 text-left font-semibold">{copy.tableType}</th>
                    <th className="px-2 py-2 text-center font-semibold">{copy.tableViews}</th>
                    <th className="px-2 py-2 text-center font-semibold">{copy.tableForms}</th>
                    <th className="px-2 py-2 font-semibold">{copy.tableStatus}</th>
                    <th className="px-2 py-2 text-right font-semibold">{copy.tableActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayPages.map((p) => {
                    const st = getLandingPageStatusMeta(p.status, language)
                    const typeLabel = (p.builderType === 'company' || isCompanyBuilderContent(p.content))
                      ? copy.pageTypeCompany
                      : (getLocalizedJobTitle(p.job, language) || p.job?.jobCode || copy.pageTypeRecruitment)
                    return (
                      <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-2 py-2 font-semibold text-slate-800">{p.title}</td>
                        <td className="px-2 py-2 text-slate-500">{typeLabel}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-slate-600">{p.viewsCount}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-slate-600">{p.formSubmissionsCount}</td>
                        <td className="px-2 py-2">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: st.color, background: st.bg }}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            <button type="button" onClick={() => openEditor(p)} className="rounded-md bg-[#e8f4fa] px-2 py-1 text-[10px] font-semibold text-[#0077B6] hover:bg-[#cce5f0]">{copy.edit}</button>
                            {p.status === 1 && (
                              <>
                                <button type="button" onClick={() => copyPublicLink(p)} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200">{copy.copyLink}</button>
                                <a href={p.publicPath} target="_blank" rel="noreferrer" className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 no-underline hover:bg-slate-200">{copy.view}</a>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
        <h2 className="mb-3 text-xs font-bold text-[#0077B6]">{copy.recentActivity}</h2>
        {activities.length === 0 ? (
          <div className="text-xs text-slate-400">{copy.noActivity}</div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {activities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex-1 text-xs text-slate-700">{a.message}</div>
                <div className="shrink-0 whitespace-nowrap text-[10px] text-slate-400">{formatDate(a.createdAt, language)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BrandingUnifiedMain({
  copy,
  language,
  onNavigate,
  servicePackages,
  onCardCta,
  onConsultation,
  requestLoadingKey,
  statCards,
  statsEmpty,
  hasPublishedPage,
  displayPages,
  activities,
  setShowCreate,
  openEditor,
  copyPublicLink,
}) {
  return (
    <div className="flex min-h-0 flex-col gap-4 pb-2">
      <BrandingOverviewMain
        onNavigate={onNavigate}
        onCardCta={onCardCta}
        onConsultation={onConsultation}
        requestLoadingKey={requestLoadingKey}
        copy={copy}
        servicePackages={servicePackages}
      />
      <BrandingStatsSection
        copy={copy}
        language={language}
        statCards={statCards}
        statsEmpty={statsEmpty}
        hasPublishedPage={hasPublishedPage}
        displayPages={displayPages}
        activities={activities}
        setShowCreate={setShowCreate}
        openEditor={openEditor}
        copyPublicLink={copyPublicLink}
      />
    </div>
  )
}

const Branding = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { language } = useLanguage()
  const copy = useMemo(() => getBrandingCopy(language), [language])
  const servicePackages = useMemo(() => getBrandingServicePackages(language), [language])
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  const [landingPages, setLandingPages] = useState([])
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [dashRes, listRes] = await Promise.all([
        apiService.getBusinessLandingPageDashboard(),
        apiService.getBusinessLandingPages({ page: 1, limit: 20 }),
      ])
      if (dashRes?.success) setDashboard(dashRes.data)
      if (listRes?.success) setLandingPages(listRes.data?.landingPages || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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

  const stats = dashboard?.stats || {}
  const activities = dashboard?.activities || []

  const statCards = useMemo(() => [
    { icon: Bookmark, value: stats.views || 0, label: copy.statViews, color: BRAND },
    { icon: BarChart3, value: stats.formSubmissions || 0, label: copy.statForms, color: '#d97706' },
    { icon: Users, value: stats.candidates || 0, label: copy.statCandidates, color: '#0d9488' },
    { icon: TrendingUp, value: `${stats.conversionRate || 0}%`, label: copy.statConversion, color: '#059669' },
  ], [stats.views, stats.formSubmissions, stats.candidates, stats.conversionRate, copy])

  const statsEmpty = !loading
    && (stats.views || 0) === 0
    && (stats.formSubmissions || 0) === 0
    && (stats.conversionRate || 0) === 0

  const hasPublishedPage = !loading && landingPages.some((p) => Number(p.status) === 1)

  const handleCreated = () => {
    loadData()
  }

  const openEditor = (p) => {
    const path = isCompanyBuilderContent(p.content) || p.builderType === 'company'
      ? `/business/saiyo/pages/${p.id}/build`
      : `/business/saiyo/pages/${p.id}/edit`
    window.open(`${window.location.origin}${path}`, '_blank', 'noopener,noreferrer')
  }

  const copyPublicLink = (lp) => {
    const url = `${window.location.origin}${lp.publicPath || `/lp/${lp.slug}`}`
    navigator.clipboard.writeText(url)
    openNoticeModal(copy.alerts.copyTitle, copy.alerts.copyMessage, 'success')
  }

  const handleNavigate = useMemo(() => (path) => navigate(path), [navigate])

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
            <div className="grid h-full min-h-0 flex-1 grid-cols-1 items-stretch gap-2.5 xl:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] xl:gap-3 xl:overflow-hidden">
              <div className="business-homepage-scroll scrollbar-hide flex min-h-0 flex-col overflow-y-auto xl:h-full xl:pr-0.5">
                <BrandingUnifiedMain
                  copy={copy}
                  language={language}
                  onNavigate={handleNavigate}
                  servicePackages={servicePackages}
                  onCardCta={handleCardCta}
                  onConsultation={handleConsultation}
                  requestLoadingKey={requestLoadingKey}
                  statCards={statCards}
                  statsEmpty={statsEmpty}
                  hasPublishedPage={hasPublishedPage}
                  displayPages={landingPages}
                  activities={activities}
                  setShowCreate={setShowCreate}
                  openEditor={openEditor}
                  copyPublicLink={copyPublicLink}
                />
              </div>

              <div className="business-homepage-scroll scrollbar-hide flex h-full min-h-0 flex-col overflow-y-auto xl:pr-0.5">
                <HomepageSidebar onNavigate={handleNavigate} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Branding
