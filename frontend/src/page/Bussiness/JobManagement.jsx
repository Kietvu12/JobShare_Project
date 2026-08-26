import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus, Search, MoreHorizontal, LayoutList, LayoutGrid,
  Briefcase,
  Copy, Pause, XCircle, Eye, Pencil, Loader2, ChevronDown, RotateCcw,
  Trash2,
} from 'lucide-react'
import nothingIllustration from '../../assets/Nothing.png'
import FilterSelectDropdown from '../../component/Shared/FilterSelectDropdown'
import apiService from '../../services/api'
import useBusinessUser from '../../hooks/useBusinessUser'
import useBusinessAppCopy from '../../hooks/useBusinessAppCopy'
import { useLanguage } from '../../context/LanguageContext'
import {
  formatJobSalary,
  getDateLocale,
  getJobDateFilterOptions,
  getJobRowMenuItems,
  getJobSortOptions,
  getJobStatusFilterOptions,
  getJobStatusMeta,
  getJobStatusTabs,
  getLocalizedJobTitle,
  getRecruitmentLabel,
} from '../../i18n/businessAppI18n'
import {
  importLegacyJobBuilderThreadsFromLocalStorage,
  listJobBuilderThreads,
  deleteJobBuilderThread,
} from '../../utils/jobBuilderThreadStorage'

const BUSINESS_JOBS_FONT =
  "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"

const JD_NAVY = '#0f2744'
const JD_NAVY_MID = '#1e3a5f'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const ROW_ICON_VARIANTS = [
  { bg: 'bg-sky-100', text: 'text-sky-600' },
  { bg: 'bg-violet-100', text: 'text-violet-600' },
  { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { bg: 'bg-amber-100', text: 'text-amber-600' },
  { bg: 'bg-rose-100', text: 'text-rose-600' },
]

const INTERVIEW_STATUSES = new Set([7, 8, 9])
const HIRED_STATUSES = new Set([14, 15])

const EMPTY_JOB_STATS = { candidates: 0, referrals: 0, interviews: 0, hired: 0 }

const FILTER_SELECT_CLASS =
  'w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-[#0077B6]/40'

function buildJobStatsMap(applications = []) {
  const map = {}
  applications.forEach((app) => {
    const jobId = String(app?.jobId ?? app?.job_id ?? '')
    if (!jobId) return
    if (!map[jobId]) {
      map[jobId] = { candidateIds: new Set(), referrals: 0, interviews: 0, hired: 0 }
    }
    const bucket = map[jobId]
    bucket.referrals += 1
    const cvId = app?.cvId ?? app?.cv_id ?? app?.cvStorageId
    if (cvId != null) bucket.candidateIds.add(String(cvId))
    const status = Number(app?.status)
    if (INTERVIEW_STATUSES.has(status)) bucket.interviews += 1
    if (HIRED_STATUSES.has(status)) bucket.hired += 1
  })
  const result = {}
  Object.entries(map).forEach(([jobId, bucket]) => {
    result[jobId] = {
      candidates: bucket.candidateIds.size,
      referrals: bucket.referrals,
      interviews: bucket.interviews,
      hired: bucket.hired,
    }
  })
  return result
}

function getJobStats(job, statsMap) {
  const fromApps = statsMap[String(job.id)] || EMPTY_JOB_STATS
  const referrals = Math.max(fromApps.referrals, Number(job.applicationCount) || 0)
  return {
    candidates: fromApps.candidates,
    referrals,
    interviews: fromApps.interviews,
    hired: fromApps.hired,
  }
}

function getRowIconVariant(jobId) {
  const n = Number(jobId) || 0
  return ROW_ICON_VARIANTS[n % ROW_ICON_VARIANTS.length]
}

function JobTableHeader({ jobsCopy, allSelected, onToggleAll, hasItems }) {
  return (
    <thead>
      <tr className="border-b border-slate-200 bg-white text-left text-[10px] font-semibold uppercase tracking-wide text-[#0077B6]">
        <th className="w-10 px-3 py-3">
          <input
            type="checkbox"
            checked={allSelected}
            disabled={!hasItems}
            onChange={onToggleAll}
            aria-label={jobsCopy.table.selectAll}
            className="h-3.5 w-3.5 rounded border-slate-300 text-[#0077B6] focus:ring-[#0077B6]/30"
          />
        </th>
        <th className="px-3 py-3">{jobsCopy.table.name}</th>
        <th className="px-3 py-3">{jobsCopy.table.salary}</th>
        <th className="px-3 py-3">{jobsCopy.table.status}</th>
        <th className="px-3 py-3">{jobsCopy.table.location}</th>
        <th className="px-3 py-3">{jobsCopy.table.referrals}</th>
        <th className="px-3 py-3">{jobsCopy.table.updated}</th>
        <th className="w-28 px-3 py-3 text-right">{jobsCopy.table.actions}</th>
      </tr>
    </thead>
  )
}

function JobTableRowActions({ job, menuItems, commonCopy, onMenuAction }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const overflowMenuItems = menuItems.filter((item) => !['edit', 'delete'].includes(item.id))

  return (
    <div className="flex items-center justify-end gap-0.5">
      <button
        type="button"
        onClick={() => onMenuAction('edit', job)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0077B6]/10 text-[#0077B6] opacity-0 transition group-hover:opacity-100 hover:bg-[#0077B6]/20"
        aria-label={menuItems.find((item) => item.id === 'edit')?.label}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onMenuAction('delete', job)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
        aria-label={menuItems.find((item) => item.id === 'delete')?.label}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={commonCopy.actions}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen ? (
          <JobRowMenu
            job={job}
            menuItems={overflowMenuItems}
            closeMenuLabel={commonCopy.closeMenu}
            onClose={() => setMenuOpen(false)}
            onAction={(action) => {
              setMenuOpen(false)
              onMenuAction(action, job)
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

function JobTableRow({
  job,
  stats,
  selected,
  onToggleSelect,
  onOpen,
  onMenuAction,
  language,
  jobsCopy,
  commonCopy,
  menuItems,
}) {
  const statusMeta = getJobStatusMeta(job.status, language)
  const title = getJobTitle(job, language)
  const iconVariant = getRowIconVariant(job.id)
  const metrics = stats || EMPTY_JOB_STATS
  const dateLocale = getDateLocale(language)

  return (
    <tr
      className="group cursor-pointer border-b border-slate-100 transition hover:bg-slate-50/90"
      onClick={() => onOpen(job.id)}
    >
      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(job.id)}
          aria-label={jobsCopy.table.selectRow}
          className="h-3.5 w-3.5 rounded border-slate-300 text-[#0077B6] focus:ring-[#0077B6]/30"
        />
      </td>
      <td className="px-3 py-3">
        <div className="flex min-w-[180px] items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconVariant.bg} ${iconVariant.text}`}>
            <Briefcase className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
            <p className="truncate text-xs text-slate-500">{getJobCode(job)}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <p className="text-sm font-semibold text-slate-900">{formatJobSalary(job, language)}</p>
        <p className="text-xs text-slate-500">{getRecruitmentLabel(job, language)}</p>
      </td>
      <td className="px-3 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
          <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} />
          {statusMeta.label}
        </span>
      </td>
      <td className="max-w-[160px] truncate px-3 py-3 text-sm text-slate-700">{getJobLocation(job)}</td>
      <td className="px-3 py-3">
        <p className="text-sm font-semibold text-slate-900">{metrics.referrals}</p>
        <p className="text-xs text-slate-500">{jobsCopy.metrics.referrals}</p>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">
        {formatDate(job.updatedAt || job.updated_at, dateLocale)}
      </td>
      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <JobTableRowActions
          job={job}
          menuItems={menuItems}
          commonCopy={commonCopy}
          onMenuAction={onMenuAction}
        />
      </td>
    </tr>
  )
}

function DraftTableRow({ thread, onOpen, onDelete, jobsCopy, commonCopy, language }) {
  const dateLocale = getDateLocale(language)
  const title = thread.title || jobsCopy.draft.defaultTitle

  return (
    <tr
      className="group cursor-pointer border-b border-slate-100 bg-amber-50/40 transition hover:bg-amber-50/70"
      onClick={() => onOpen(thread.id)}
    >
      <td className="px-3 py-3" />
      <td className="px-3 py-3">
        <div className="flex min-w-[180px] items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Briefcase className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                {jobsCopy.draft.badge}
              </span>
            </div>
            <p className="truncate text-xs text-slate-500">{jobsCopy.draft.hint}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-sm text-slate-400">—</td>
      <td className="px-3 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          {jobsCopy.status.draft}
        </span>
      </td>
      <td className="px-3 py-3 text-sm text-slate-400">—</td>
      <td className="px-3 py-3 text-sm text-slate-400">—</td>
      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">
        {formatDate(thread.updatedAt, dateLocale)}
      </td>
      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            onClick={() => onDelete(thread)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
            aria-label={jobsCopy.menu.delete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <span className="inline-flex h-8 w-8 items-center justify-center text-slate-300">
            <MoreHorizontal className="h-4 w-4" />
          </span>
        </div>
      </td>
    </tr>
  )
}

function JobListPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  paginationCopy,
  embedded = false,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageNumbers = useMemo(() => {
    const maxVisible = 6
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    let startPage = Math.max(1, safePage - 2)
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)
    startPage = Math.max(1, endPage - maxVisible + 1)
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
  }, [safePage, totalPages])

  if (totalItems === 0) return null

  return (
    <div
      className={
        embedded
          ? 'flex shrink-0 flex-col gap-2 border-t border-slate-100 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between lg:px-4'
          : 'flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between lg:px-4'
      }
    >
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label={paginationCopy.perPage}
            className="appearance-none rounded-full border border-slate-200 bg-white py-1 pl-3 pr-7 text-xs font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-[#0077B6]/40"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{paginationCopy.itemsCount(size)}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
        </div>
        <span className="text-xs text-slate-500">{paginationCopy.perPage}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label={paginationCopy.prevPage}
          className="rounded-full bg-[#0077B6]/10 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-[#0077B6]/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {paginationCopy.previous}
        </button>

        <div className="flex items-center gap-0.5">
          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === safePage ? 'page' : undefined}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                p === safePage
                  ? 'border border-slate-300 bg-white text-slate-900 shadow-sm'
                  : 'bg-[#0077B6]/10 text-slate-700 hover:bg-[#0077B6]/15'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label={paginationCopy.nextPage}
          className="rounded-full bg-[#0077B6]/10 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-[#0077B6]/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {paginationCopy.next}
        </button>
      </div>
    </div>
  )
}

function getJobCategoryId(job) {
  return String(job?.jobCategoryId ?? job?.job_category_id ?? job?.category?.id ?? '')
}

function getJobCategoryName(job) {
  const cat = job?.category || job?.jobCategory
  return cat?.name || cat?.nameEn || cat?.nameJp || ''
}

function jobMatchesDateFilter(job, dateFilter) {
  if (!dateFilter) return true
  const updated = new Date(job?.updatedAt || job?.updated_at || 0)
  if (Number.isNaN(updated.getTime())) return false
  const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return updated.getTime() >= cutoff
}

function JobFilterField({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-0.5 block text-[10px] font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function formatDate(value, locale = 'vi-VN') {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(locale)
}

function getJobLocation(job) {
  return job?.interviewLocation
    || job?.interview_location
    || job?.workLocation
    || job?.work_location
    || job?.location
    || '—'
}

function getJobTitle(job, language = 'vi') {
  return getLocalizedJobTitle(job, language)
}

function getJobCode(job) {
  return job?.jobCode || job?.job_code || job?.jobNumber || job?.job_number || `JD-${job?.id}`
}

const jobListStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .business-jobs-list-shell {
    height: 100%;
    min-height: 0;
    font-family: ${BUSINESS_JOBS_FONT};
    background: #f4f6f8;
    --jobs-zoom: 1;
  }
  @media (min-width: 1024px) and (max-width: 1279px) {
    .business-jobs-list-shell { --jobs-zoom: 0.9; }
  }
  @media (min-width: 1280px) and (max-width: 1535px) {
    .business-jobs-list-shell { --jobs-zoom: 0.86; }
  }
  @media (min-width: 1024px) and (max-height: 760px) {
    .business-jobs-list-shell { --jobs-zoom: 0.78; }
  }
  @media (min-width: 1024px) and (min-height: 761px) and (max-height: 860px) {
    .business-jobs-list-shell { --jobs-zoom: 0.84; }
  }
  .business-jobs-ui {
    zoom: var(--jobs-zoom);
  }
  @supports not (zoom: 1) {
    .business-jobs-ui {
      transform: scale(var(--jobs-zoom));
      transform-origin: top left;
      width: calc(100% / var(--jobs-zoom));
      height: calc(100% / var(--jobs-zoom));
    }
  }
  .business-jobs-list-scroll::-webkit-scrollbar { width: 4px; }
  .business-jobs-list-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  .business-jobs-table thead th {
    white-space: nowrap;
  }
  .business-jobs-table tbody tr:last-child td {
    border-bottom: none;
  }
  @media (min-width: 1024px) and (max-width: 1535px) {
    .business-jobs-tabs {
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
      max-width: 100%;
      padding-bottom: 1px;
    }
    .business-jobs-tabs::-webkit-scrollbar { display: none; }
    .business-jobs-tabs button { white-space: nowrap; flex-shrink: 0; }
    .business-jobs-toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }
    .business-jobs-toolbar-controls {
      justify-content: space-between;
    }
    .business-jobs-metric-col {
      min-width: 48px;
    }
    .business-jobs-row-compact .business-jobs-row-meta {
      gap: 0.375rem 0.625rem;
    }
  }
`

const MENU_ICONS = {
  view: Eye,
  edit: Pencil,
  duplicate: Copy,
  pause: Pause,
  close: XCircle,
  delete: Trash2,
}

function JobRowMenu({ job, onClose, onAction, menuItems, closeMenuLabel }) {
  const items = menuItems.filter((item) => !item.hiddenStatus?.(job.status))

  return (
    <>
      <button type="button" className="fixed inset-0 z-30 cursor-default" aria-label={closeMenuLabel} onClick={onClose} />
      <div className="absolute right-0 top-full z-40 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
        {items.map(({ id, label, danger }) => {
          const Icon = MENU_ICONS[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => onAction(id)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs ${
                danger
                  ? 'text-rose-600 hover:bg-rose-50'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {Icon ? (
                <Icon className={`h-3.5 w-3.5 shrink-0 ${danger ? 'text-rose-500' : 'text-slate-400'}`} />
              ) : null}
              {label}
            </button>
          )
        })}
      </div>
    </>
  )
}

function JobGridCard({
  job,
  stats,
  onOpen,
  onMenuAction,
  language,
  jobsCopy,
  commonCopy,
  menuItems,
}) {
  const statusMeta = getJobStatusMeta(job.status, language)
  const title = getJobTitle(job, language)
  const iconVariant = getRowIconVariant(job.id)
  const metrics = stats || EMPTY_JOB_STATS
  const dateLocale = getDateLocale(language)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(job.id)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(job.id)}
      className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 transition hover:border-[#0077B6]/25 hover:bg-[#f8fbfd] sm:p-4"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconVariant.bg} ${iconVariant.text}`}>
          <Briefcase className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs text-slate-500">{getJobCode(job)}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} />
            {statusMeta.label}
          </span>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <JobTableRowActions
            job={job}
            menuItems={menuItems}
            commonCopy={commonCopy}
            onMenuAction={onMenuAction}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-center sm:grid-cols-4">
        {[
          [metrics.candidates, jobsCopy.metrics.candidates],
          [metrics.referrals, jobsCopy.metrics.referrals],
          [metrics.interviews, jobsCopy.metrics.interviews],
          [metrics.hired, jobsCopy.metrics.hired],
        ].map(([value, label]) => (
          <div key={label}>
            <p className="text-base font-bold text-[#0077B6]">{value}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400">
        {commonCopy.updatedAt(formatDate(job.updatedAt || job.updated_at, dateLocale))}
      </p>
    </div>
  )
}

function JobGridDraftCard({ thread, onOpen, onDelete, jobsCopy, commonCopy, language }) {
  const dateLocale = getDateLocale(language)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(thread.id)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(thread.id)}
      className="group flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-3 transition hover:border-amber-300 sm:p-4"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Briefcase className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-900">{thread.title || jobsCopy.draft.defaultTitle}</h3>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{jobsCopy.draft.badge}</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">{jobsCopy.draft.hint}</p>
        <p className="mt-1 text-[10px] text-slate-400">{commonCopy.updatedAt(formatDate(thread.updatedAt, dateLocale))}</p>
      </div>
      <div className="shrink-0 self-center" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onDelete(thread)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
          aria-label={jobsCopy.menu.delete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

const JobManagement = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user: businessUser } = useBusinessUser()
  const { language } = useLanguage()
  const copy = useBusinessAppCopy()
  const jobsCopy = copy.jobs
  const commonCopy = copy.common
  const statusTabs = useMemo(() => getJobStatusTabs(language), [language])
  const sortOptions = useMemo(() => getJobSortOptions(language), [language])
  const statusFilterOptions = useMemo(() => getJobStatusFilterOptions(language), [language])
  const dateFilterOptions = useMemo(() => getJobDateFilterOptions(language), [language])
  const menuItems = useMemo(() => getJobRowMenuItems(jobsCopy), [jobsCopy])
  const dateLocale = getDateLocale(language)

  const [jobs, setJobs] = useState([])
  const [draftThreads, setDraftThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '')
  const [statusTab, setStatusTab] = useState(searchParams.get('tab') || 'all')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '')
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '')
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || '')
  const [sortBy, setSortBy] = useState('updated')
  const [viewMode, setViewMode] = useState('list')
  const [jobStatsMap, setJobStatsMap] = useState({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedJobIds, setSelectedJobIds] = useState(() => new Set())
  const searchTimerRef = useRef(null)

  const loadApplicationStats = useCallback(async () => {
    try {
      const all = []
      let currentPage = 1
      let totalPages = 1
      do {
        const res = await apiService.getBusinessApplications({ page: currentPage, limit: 100 })
        if (!res?.success) break
        all.push(...(res.data?.applications || []))
        totalPages = res.data?.pagination?.totalPages || 0
        currentPage += 1
      } while (currentPage <= totalPages)
      setJobStatsMap(buildJobStatsMap(all))
    } catch {
      setJobStatsMap({})
    }
  }, [])

  const loadJobs = useCallback(async (search = '') => {
    setLoading(true)
    try {
      const all = []
      let page = 1
      let totalPages = 1
      do {
        const res = await apiService.getBusinessJobs({
          page,
          limit: 50,
          search: search || undefined,
        })
        if (!res?.success) break
        all.push(...(res.data?.jobs || []))
        totalPages = res.data?.pagination?.totalPages || 0
        page += 1
      } while (page <= totalPages)
      setJobs(all)
    } catch (err) {
      console.error(err)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDraftThreads = useCallback(async () => {
    try {
      await importLegacyJobBuilderThreadsFromLocalStorage()
      const threads = await listJobBuilderThreads()
      setDraftThreads(threads.filter((t) => !t.jobId))
    } catch {
      setDraftThreads([])
    }
  }, [])

  useEffect(() => {
    if (!businessUser?.id) return
    loadDraftThreads()
    loadApplicationStats()
  }, [businessUser?.id, loadDraftThreads, loadApplicationStats])

  useEffect(() => {
    if (!businessUser?.id) return
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      loadJobs(searchInput.trim())
      const next = new URLSearchParams()
      if (statusTab !== 'all') next.set('tab', statusTab)
      if (searchInput.trim()) next.set('search', searchInput.trim())
      if (categoryFilter) next.set('category', categoryFilter)
      if (locationFilter) next.set('location', locationFilter)
      if (dateFilter) next.set('date', dateFilter)
      setSearchParams(next, { replace: true })
    }, 350)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [searchInput, businessUser?.id, loadJobs, setSearchParams, statusTab, categoryFilter, locationFilter, dateFilter])

  const categoryOptions = useMemo(() => {
    const map = new Map()
    jobs.forEach((job) => {
      const id = getJobCategoryId(job)
      if (!id) return
      const label = getJobCategoryName(job) || `Ngành #${id}`
      map.set(id, label)
    })
    return [
      { value: '', label: 'Tất cả ngành nghề' },
      ...Array.from(map.entries())
        .sort((a, b) => a[1].localeCompare(b[1], 'vi'))
        .map(([value, label]) => ({ value, label })),
    ]
  }, [jobs])

  const locationOptions = useMemo(() => {
    const set = new Set()
    jobs.forEach((job) => {
      const loc = getJobLocation(job)
      if (loc && loc !== '—') set.add(loc)
    })
    return [
      { value: '', label: jobsCopy.filters.allLocation },
      ...Array.from(set)
        .sort((a, b) => a.localeCompare(b, dateLocale))
        .map((loc) => ({ value: loc, label: loc })),
    ]
  }, [jobs, jobsCopy.filters.allLocation, dateLocale])

  const tabCounts = useMemo(() => {
    const counts = { all: jobs.length, recruiting: 0, draft: 0, paused: 0, closed: 0 }
    jobs.forEach((job) => {
      const s = Number(job.status)
      if (s === 1) counts.recruiting += 1
      if (s === 0) counts.draft += 1
      if (s === 2 || s === 3) counts.closed += 1
    })
    counts.draft += draftThreads.length
    return counts
  }, [jobs, draftThreads])

  const filteredJobs = useMemo(() => {
    const tab = statusTabs.find((t) => t.id === statusTab)
    let list = jobs
    if (tab?.statuses?.length) {
      list = list.filter((job) => tab.statuses.includes(Number(job.status)))
    } else if (statusTab === 'paused') {
      list = []
    }
    if (categoryFilter) {
      list = list.filter((job) => getJobCategoryId(job) === String(categoryFilter))
    }
    if (locationFilter) {
      list = list.filter((job) => getJobLocation(job) === locationFilter)
    }
    if (dateFilter) {
      list = list.filter((job) => jobMatchesDateFilter(job, dateFilter))
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'title') {
        return getJobTitle(a, language).localeCompare(getJobTitle(b, language), dateLocale)
      }
      if (sortBy === 'created') {
        return new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)
      }
      return new Date(b.updatedAt || b.updated_at || 0) - new Date(a.updatedAt || a.updated_at || 0)
    })
  }, [jobs, sortBy, statusTab, categoryFilter, locationFilter, dateFilter, statusTabs, dateLocale])

  const showDraftThreads = statusTab === 'all' || statusTab === 'draft'

  const listItems = useMemo(() => {
    const items = []
    if (showDraftThreads) {
      draftThreads.forEach((thread) => items.push({ type: 'draft', thread }))
    }
    filteredJobs.forEach((job) => items.push({ type: 'job', job }))
    return items
  }, [showDraftThreads, draftThreads, filteredJobs])

  const totalListItems = listItems.length
  const totalPages = Math.max(1, Math.ceil(totalListItems / pageSize))
  const safePage = Math.min(page, totalPages)

  const pagedListItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return listItems.slice(start, start + pageSize)
  }, [listItems, pageSize, safePage])

  const pagedJobIds = useMemo(
    () => pagedListItems.filter((item) => item.type === 'job').map((item) => String(item.job.id)),
    [pagedListItems],
  )

  const allPagedJobsSelected = pagedJobIds.length > 0 && pagedJobIds.every((id) => selectedJobIds.has(id))

  const toggleSelectJob = (jobId) => {
    const id = String(jobId)
    setSelectedJobIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllPagedJobs = () => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev)
      if (allPagedJobsSelected) {
        pagedJobIds.forEach((id) => next.delete(id))
      } else {
        pagedJobIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  useEffect(() => {
    setPage(1)
  }, [searchInput, statusTab, categoryFilter, locationFilter, dateFilter, sortBy, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const handleStatusTab = (tabId) => {
    setStatusTab(tabId)
  }

  const handleStatusFilterChange = (value) => {
    setStatusTab(value || 'all')
  }

  const openJobDetail = (jobId) => {
    navigate(`/business/jobs/${jobId}`)
  }

  const openDraftThread = (threadId) => {
    navigate(`/business/jobs/create?threadId=${encodeURIComponent(threadId)}`)
  }

  const handleDeleteDraftThread = async (thread) => {
    const title = thread.title || jobsCopy.draft.defaultTitle
    if (!window.confirm(jobsCopy.alerts.draftDeleteConfirm(title))) return
    try {
      await deleteJobBuilderThread(thread.id)
      await loadDraftThreads()
    } catch {
      window.alert(jobsCopy.alerts.draftDeleteFailed)
    }
  }

  const handleMenuAction = async (action, job) => {
    if (action === 'view') {
      openJobDetail(job.id)
      return
    }
    if (action === 'edit') {
      navigate(`/business/jobs/${job.id}/edit`)
      return
    }
    if (action === 'pause') {
      try {
        const res = await apiService.updateBusinessJob(job.id, { status: 0 })
        if (res?.success) loadJobs(searchInput.trim())
        else window.alert(res?.message || jobsCopy.alerts.pauseFailed)
      } catch {
        window.alert(jobsCopy.alerts.pauseFailed)
      }
      return
    }
    if (action === 'close') {
      if (!window.confirm(jobsCopy.alerts.closeConfirm(getJobTitle(job, language)))) return
      try {
        const res = await apiService.updateBusinessJob(job.id, { status: 2 })
        if (res?.success) loadJobs(searchInput.trim())
        else window.alert(res?.message || jobsCopy.alerts.closeFailed)
      } catch {
        window.alert(jobsCopy.alerts.closeFailed)
      }
      return
    }
    if (action === 'delete') {
      if (!window.confirm(jobsCopy.alerts.deleteConfirm(getJobTitle(job, language)))) return
      try {
        const res = await apiService.deleteBusinessJob(job.id)
        if (res?.success) {
          loadJobs(searchInput.trim())
          loadApplicationStats()
        } else {
          window.alert(res?.message || jobsCopy.alerts.deleteFailed)
        }
      } catch {
        window.alert(jobsCopy.alerts.deleteFailed)
      }
    }
  }

  const clearFilters = () => {
    setSearchInput('')
    setStatusTab('all')
    setCategoryFilter('')
    setLocationFilter('')
    setDateFilter('')
    setPage(1)
    setSearchParams({}, { replace: true })
    loadJobs('')
  }

  const hasActiveFilters = Boolean(
    searchInput.trim()
    || statusTab !== 'all'
    || categoryFilter
    || locationFilter
    || dateFilter,
  )

  return (
    <>
      <style>{jobListStyles}</style>
      <div className="business-jobs-list-shell flex h-full min-h-0 flex-col overflow-hidden">
        <div className="business-jobs-ui flex h-full min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 space-y-2 p-3 lg:px-4 lg:pt-3 lg:pb-2">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-base font-bold text-slate-900 lg:text-lg">{jobsCopy.title}</h1>
              <p className="mt-0.5 text-[11px] text-slate-500 lg:text-xs">
                {jobsCopy.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/business/jobs/create')}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-95"
              style={{ backgroundColor: JD_NAVY_MID }}
            >
              <Plus className="h-3.5 w-3.5" />
              {jobsCopy.createJd}
            </button>
          </header>

          <div className="rounded-xl border border-slate-200/90 bg-white p-2 shadow-sm lg:p-2.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex flex-1 items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={jobsCopy.searchPlaceholder}
                  className="min-w-0 flex-1 bg-transparent pr-7 text-xs text-slate-800 outline-none placeholder:text-slate-400"
                />
                <Search className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="h-3 w-3" />
                {commonCopy.clearFilters}
              </button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 xl:grid-cols-4">
              <JobFilterField label={jobsCopy.filters.status}>
                <FilterSelectDropdown
                  value={statusTab}
                  onChange={handleStatusFilterChange}
                  options={statusFilterOptions}
                  placeholder={jobsCopy.filters.allStatus}
                  className={FILTER_SELECT_CLASS}
                  maxPanelHeight={220}
                />
              </JobFilterField>
              <JobFilterField label={jobsCopy.filters.category}>
                <FilterSelectDropdown
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={categoryOptions}
                  placeholder={jobsCopy.filters.allCategory}
                  searchable
                  searchPlaceholder={jobsCopy.filters.searchCategory}
                  className={FILTER_SELECT_CLASS}
                  maxPanelHeight={240}
                />
              </JobFilterField>
              <JobFilterField label={jobsCopy.filters.location}>
                <FilterSelectDropdown
                  value={locationFilter}
                  onChange={setLocationFilter}
                  options={locationOptions}
                  placeholder={jobsCopy.filters.allLocation}
                  searchable
                  searchPlaceholder={jobsCopy.filters.searchLocation}
                  className={FILTER_SELECT_CLASS}
                  maxPanelHeight={240}
                />
              </JobFilterField>
              <JobFilterField label={jobsCopy.filters.date}>
                <FilterSelectDropdown
                  value={dateFilter}
                  onChange={setDateFilter}
                  options={dateFilterOptions}
                  placeholder={jobsCopy.filters.allTime}
                  className={FILTER_SELECT_CLASS}
                  maxPanelHeight={200}
                />
              </JobFilterField>
            </div>

            <div className="business-jobs-toolbar mt-2 flex flex-wrap items-end justify-between gap-2 border-t border-slate-100 pt-2 2xl:flex-row">
              <div className="business-jobs-tabs flex flex-wrap gap-3">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleStatusTab(tab.id)}
                    className={`border-b-2 pb-1 text-[10px] font-semibold transition lg:text-[11px] ${
                      statusTab === tab.id
                        ? 'border-[#0077B6] text-[#0077B6]'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label} ({tabCounts[tab.id] ?? 0})
                  </button>
                ))}
              </div>
              <div className="business-jobs-toolbar-controls flex items-center gap-1.5">
                <div className="relative flex items-center gap-1.5">
                  <span className="whitespace-nowrap text-[10px] font-medium text-slate-500">{commonCopy.sortLabel}</span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none rounded-lg border border-slate-200 bg-white py-1 pl-2 pr-6 text-[10px] font-medium text-slate-700 outline-none"
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div className="flex rounded-lg border border-slate-200 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`rounded-md p-1 ${viewMode === 'list' ? 'bg-[#0077B6] text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    aria-label={commonCopy.listView}
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-md p-1 ${viewMode === 'grid' ? 'bg-[#0077B6] text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    aria-label={commonCopy.gridView}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 lg:px-4">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#0077B6]" />
            </div>
          ) : totalListItems === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200/90 bg-white px-5 py-8 text-center">
              <img
                src={nothingIllustration}
                alt=""
                className="mb-3 w-full max-w-[200px] object-contain"
                draggable={false}
              />
              <p className="max-w-md text-xs font-medium leading-relaxed text-slate-700">
                {jobsCopy.empty.title}
              </p>
              <p className="mt-1 max-w-md text-[11px] leading-relaxed text-slate-500">
                {jobsCopy.empty.hint}
              </p>
              <button
                type="button"
                onClick={() => navigate('/business/jobs/create')}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-95"
                style={{ backgroundColor: JD_NAVY_MID }}
              >
                <Plus className="h-3.5 w-3.5" />
                {jobsCopy.createJd}
              </button>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
              {viewMode === 'grid' ? (
                <div className="business-jobs-list-scroll grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto p-2 md:grid-cols-2 lg:p-3">
                  {pagedListItems.map((item) => (
                    item.type === 'draft' ? (
                      <JobGridDraftCard
                        key={item.thread.id}
                        thread={item.thread}
                        onOpen={openDraftThread}
                        onDelete={handleDeleteDraftThread}
                        jobsCopy={jobsCopy}
                        commonCopy={commonCopy}
                        language={language}
                      />
                    ) : (
                      <JobGridCard
                        key={item.job.id}
                        job={item.job}
                        stats={getJobStats(item.job, jobStatsMap)}
                        onOpen={openJobDetail}
                        onMenuAction={handleMenuAction}
                        language={language}
                        jobsCopy={jobsCopy}
                        commonCopy={commonCopy}
                        menuItems={menuItems}
                      />
                    )
                  ))}
                </div>
              ) : (
                <div className="business-jobs-list-scroll min-h-0 flex-1 overflow-y-auto">
                  <div className="overflow-x-auto">
                    <table className="business-jobs-table w-full min-w-[960px] border-collapse">
                      <JobTableHeader
                        jobsCopy={jobsCopy}
                        allSelected={allPagedJobsSelected}
                        onToggleAll={toggleSelectAllPagedJobs}
                        hasItems={pagedJobIds.length > 0}
                      />
                      <tbody>
                        {pagedListItems.map((item) => (
                          item.type === 'draft' ? (
                            <DraftTableRow
                              key={item.thread.id}
                              thread={item.thread}
                              onOpen={openDraftThread}
                              onDelete={handleDeleteDraftThread}
                              jobsCopy={jobsCopy}
                              commonCopy={commonCopy}
                              language={language}
                            />
                          ) : (
                            <JobTableRow
                              key={item.job.id}
                              job={item.job}
                              stats={getJobStats(item.job, jobStatsMap)}
                              selected={selectedJobIds.has(String(item.job.id))}
                              onToggleSelect={toggleSelectJob}
                              onOpen={openJobDetail}
                              onMenuAction={handleMenuAction}
                              language={language}
                              jobsCopy={jobsCopy}
                              commonCopy={commonCopy}
                              menuItems={menuItems}
                            />
                          )
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <JobListPagination
                embedded
                page={safePage}
                pageSize={pageSize}
                totalItems={totalListItems}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size)
                  setPage(1)
                }}
                paginationCopy={commonCopy.pagination}
              />
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  )
}

export default JobManagement
