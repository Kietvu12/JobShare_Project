import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ChevronRight, MoreHorizontal, Phone, Mail, Loader2, BadgeCheck, MessageSquare,
  Copy, ArrowLeft,
} from 'lucide-react'
import apiService from '../../services/api'
import {
  normalizeScoutCertificates,
  normalizeScoutEducations,
  normalizeScoutWorkExperiences,
  getScoutResidenceStatusLabel,
  formatScoutGender,
  formatScoutYesNo,
  formatScoutDate,
  formatScoutIncome,
  formatScoutExperienceYears,
  getScoutSkillTags,
  getScoutDisplayName,
  getScoutPrSummary,
  formatScoutAgeGender,
  getScoutPipelineMeta,
  getScoutUnlockSourceMeta,
  getScoutPerformanceRequestMeta,
  getScoutPerformanceExploreMeta,
  SCOUT_PERFORMANCE_REQUEST_STATUS_LABELS,
} from '../../utils/scoutCandidateDisplay'

const ANONYMOUS_AVATAR = 'https://api.dicebear.com/7.x/shapes/svg?seed=scout-unlocked'
const BRAND = '#0077B6'
const PAGE_FONT = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif"

function isScoutPerformanceUnlock(candidate) {
  return candidate?.unlockType === 'scout_performance'
}

const detailPageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
  .business-candidates-ui {
    line-height: 1.45;
    color: #334155;
    --cand-gap: 10px;
    --cand-side-col: minmax(168px, 200px);
    --cand-radius: 12px;
    --cand-fs-2xs: 8px;
    --cand-fs-xs: 9px;
    --cand-fs-sm: 10px;
    --cand-fs-md: 11px;
    --cand-fs-lg: 12px;
    --cand-icon: 12px;
    --cand-avatar-list: 28px;
    --cand-avatar-profile: 40px;
  }
  @media (min-width: 1536px) {
    .business-candidates-ui {
      --cand-fs-2xs: 9px;
      --cand-fs-xs: 10px;
      --cand-fs-sm: 11px;
      --cand-fs-md: 12px;
      --cand-fs-lg: 13px;
      --cand-icon: 13px;
      --cand-avatar-list: 32px;
      --cand-avatar-profile: 44px;
    }
  }
  @media (max-height: 900px) and (min-width: 1024px) {
    .business-candidates-ui {
      --cand-fs-2xs: 7px;
      --cand-fs-xs: 8px;
      --cand-fs-sm: 9px;
      --cand-fs-md: 10px;
      --cand-fs-lg: 11px;
      --cand-icon: 11px;
      --cand-avatar-list: 26px;
      --cand-avatar-profile: 36px;
    }
  }
  .business-candidates-ui .cand-fs-2xs { font-size: var(--cand-fs-2xs); line-height: 1.4; }
  .business-candidates-ui .cand-fs-xs { font-size: var(--cand-fs-xs); line-height: 1.45; }
  .business-candidates-ui .cand-fs-sm { font-size: var(--cand-fs-sm); line-height: 1.45; }
  .business-candidates-ui .cand-fs-md { font-size: var(--cand-fs-md); line-height: 1.4; }
  .business-candidates-ui .cand-fs-lg { font-size: var(--cand-fs-lg); line-height: 1.35; }
  .business-candidates-ui .cand-icon {
    width: var(--cand-icon);
    height: var(--cand-icon);
    flex-shrink: 0;
  }
  .business-candidates-detail-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--cand-gap);
    min-height: 0;
  }
  @media (min-width: 1280px) {
    .business-candidates-detail-grid.has-sidebar {
      grid-template-columns: minmax(0, 1fr) var(--cand-side-col);
    }
  }
  .business-candidates-ui .cand-surface {
    border-radius: var(--cand-radius);
    padding: 10px;
  }
  .business-candidates-ui .cand-metrics {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--cand-gap);
  }
  @media (min-width: 1440px) {
    .business-candidates-ui .cand-metrics {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  .candidate-scrollbar::-webkit-scrollbar { width: 4px; }
  .candidate-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .candidate-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .candidate-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .candidate-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
`

function formatListDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('vi-VN')
  } catch {
    return '—'
  }
}

function AvatarCircle({ candidate, size }) {
  const name = getScoutDisplayName(candidate)
  const resolvedSize = size ?? 28
  const src = candidate?.avatarPhotoPath
    ? candidate.avatarPhotoPath
    : `${ANONYMOUS_AVATAR}&seed=${encodeURIComponent(String(name || candidate?.id || 'x'))}`

  return (
    <img
      src={src}
      alt=""
      style={{ width: resolvedSize, height: resolvedSize, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: '#e2e8f0' }}
      onError={(e) => {
        e.currentTarget.src = `${ANONYMOUS_AVATAR}&seed=fallback`
      }}
    />
  )
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="cand-surface border border-slate-200/80 bg-white shadow-sm">
      <p className="cand-fs-xs font-medium text-slate-500">{label}</p>
      <p className="cand-fs-md mt-0.5 font-bold tracking-tight text-slate-900">{value}</p>
      {sub ? <p className="cand-fs-2xs mt-0.5 text-slate-400">{sub}</p> : null}
    </div>
  )
}

function DetailField({ label, value }) {
  if (!value || value === '—') return null
  return (
    <div>
      <p className="cand-fs-xs font-medium text-slate-400">{label}</p>
      <p className="cand-fs-sm mt-0.5 font-medium text-slate-900 [overflow-wrap:anywhere]">{value}</p>
    </div>
  )
}

function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`cand-surface border border-slate-200/80 bg-white shadow-sm ${className}`}>
      {title ? <h3 className="cand-fs-sm mb-2 font-bold text-slate-900">{title}</h3> : null}
      {children}
    </div>
  )
}

function CandidateDetail({ candidate, loading }) {
  if (loading) {
    return (
      <div className="cand-fs-sm cand-surface flex flex-col items-center justify-center border border-slate-200/80 bg-white py-12 text-slate-500 shadow-sm">
        <Loader2 className="cand-icon mb-2 animate-spin" />
        Đang tải chi tiết...
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="cand-fs-sm cand-surface flex flex-col items-center justify-center border border-dashed border-slate-200 bg-white py-12 text-slate-500 shadow-sm">
        Chọn ứng viên ở danh sách bên trái để xem hồ sơ
      </div>
    )
  }

  const source = getScoutUnlockSourceMeta(candidate.unlockType)
  const pipeline = getScoutPipelineMeta(candidate.pipelineStatus)
  const skills = getScoutSkillTags(candidate)
  const educations = normalizeScoutEducations(candidate.educations)
  const workExperiences = normalizeScoutWorkExperiences(candidate.workExperiences)
  const certificates = normalizeScoutCertificates(candidate.certificates)
  const perfReq = candidate.performanceRequest
  const perfStatusMeta = perfReq?.status ? getScoutPerformanceRequestMeta(perfReq.status) : null

  const copyCode = () => {
    if (candidate.code && navigator.clipboard) {
      navigator.clipboard.writeText(String(candidate.code)).catch(() => {})
    }
  }

  const isPerformanceUnlock = isScoutPerformanceUnlock(candidate)

  const overviewMetrics = isPerformanceUnlock
    ? [
        { label: 'Trạng thái tiếp cận', value: pipeline.label, sub: 'Pipeline' },
        {
          label: 'Yêu cầu WS',
          value: perfStatusMeta?.label || '—',
          sub: perfReq?.recommendationCount ? `${perfReq.recommendationCount} gợi ý` : undefined,
        },
        { label: 'Kinh nghiệm', value: formatScoutExperienceYears(candidate.experienceYears), sub: 'Tổng quan' },
        { label: 'Mở hồ sơ', value: formatListDate(candidate.unlockedAt), sub: source.label },
      ]
    : [
        { label: 'Trạng thái tiếp cận', value: pipeline.label, sub: 'Pipeline' },
        { label: 'Credit đã dùng', value: candidate.creditCost != null ? String(candidate.creditCost) : '—', sub: 'Scout Credit' },
        { label: 'Kinh nghiệm', value: formatScoutExperienceYears(candidate.experienceYears), sub: 'Tổng quan' },
        { label: 'Mở hồ sơ', value: formatListDate(candidate.unlockedAt), sub: source.label },
      ]

  return (
    <div className="candidate-scrollbar flex min-h-0 flex-col gap-3 pb-1">
      <div className="cand-surface border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <AvatarCircle candidate={candidate} size={40} />
            <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white">
              <BadgeCheck className="h-2 w-2" aria-hidden />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="cand-fs-lg font-bold text-slate-900">{getScoutDisplayName(candidate)}</h2>
              <span
                className="cand-fs-xs rounded-full px-1.5 py-0.5 font-semibold"
                style={{ color: pipeline.color, background: pipeline.bg }}
              >
                {pipeline.label}
              </span>
            </div>
            <p className="cand-fs-sm mt-0.5 text-slate-500">
              {candidate.desiredPosition || candidate.jobCategory?.name || '—'}
            </p>
            <p className="cand-fs-xs mt-0.5 text-slate-400">
              {formatScoutAgeGender(candidate)}
              {candidate.desiredWorkLocation ? ` · ${candidate.desiredWorkLocation}` : ''}
            </p>
            <p className="cand-fs-xs mt-1 font-medium" style={{ color: source.color }}>
              {source.label} · Mở {formatListDate(candidate.unlockedAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-start gap-1.5">
            <span
              className="cand-fs-xs rounded-full border border-slate-200 px-1.5 py-0.5 font-semibold"
              style={{ color: source.color, background: `${source.color}12` }}
            >
              {source.label}
            </span>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50"
              aria-label="Thêm"
            >
              <MoreHorizontal className="cand-icon" />
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between px-0.5">
          <h3 className="cand-fs-sm font-bold text-slate-900">Tổng quan</h3>
        </div>
        <div className="cand-metrics">
          {overviewMetrics.map((m) => (
            <MetricCard key={m.label} label={m.label} value={m.value} sub={m.sub} />
          ))}
        </div>
      </div>

      <div className="cand-surface border border-slate-200/80 bg-white shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h3 className="cand-fs-sm font-bold text-slate-900">Thông tin hồ sơ</h3>
            <span className="cand-fs-2xs rounded-full bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
              Đã mở
            </span>
          </div>
          {candidate.code ? (
            <button
              type="button"
              onClick={copyCode}
              className="cand-fs-xs inline-flex items-center gap-1 font-medium text-slate-500 hover:text-slate-800"
            >
              Mã CV: {candidate.code}
              <Copy className="cand-icon" />
            </button>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label="Email" value={candidate.email} />
          <DetailField label="Số điện thoại" value={candidate.phone} />
          <DetailField label="Furigana" value={candidate.furigana} />
          <DetailField label="Ngày sinh" value={formatScoutDate(candidate.birthDate)} />
          <DetailField label="Giới tính" value={formatScoutGender(candidate.gender)} />
          <DetailField label="Địa điểm mong muốn" value={candidate.desiredWorkLocation} />
          <DetailField label="Kinh nghiệm" value={formatScoutExperienceYears(candidate.experienceYears)} />
          <DetailField label="Vị trí mong muốn" value={candidate.desiredPosition || candidate.jobCategory?.name} />
          <DetailField label="Mức lương mong muốn" value={candidate.desiredIncome} />
          <DetailField
            label="JLPT / Ngoại ngữ"
            value={[candidate.jlptLevel, candidate.jpConversationLevel, candidate.enConversationLevel].filter(Boolean).join(' · ') || null}
          />
        </div>
      </div>

      {getScoutPrSummary(candidate) && (
        <SectionCard title="PR / Giới thiệu">
          <p className="cand-fs-sm whitespace-pre-wrap leading-relaxed text-slate-600">
            {getScoutPrSummary(candidate)}
          </p>
        </SectionCard>
      )}

      {skills.length > 0 && (
        <SectionCard title="Kỹ năng">
          <p className="cand-fs-sm leading-relaxed text-slate-600">
            {skills.join(' · ')}
          </p>
        </SectionCard>
      )}

      {educations.length > 0 && (
        <SectionCard title="Học vấn">
          <ul className="flex flex-col gap-2">
            {educations.map((edu, i) => (
              <li key={i} className="cand-fs-sm border-l-2 border-slate-200 pl-2 text-slate-600">
                <span className="font-semibold text-slate-900">{edu.period}</span>
                {' — '}
                {edu.content}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {workExperiences.length > 0 && (
        <SectionCard title="Lịch sử công việc">
          <div className="flex flex-col gap-2">
            {workExperiences.map((work, i) => (
              <div key={i} className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                <div className="cand-fs-sm font-bold text-slate-900">{work.companyName}</div>
                <div className="cand-fs-xs mt-0.5 text-slate-500">{work.period}</div>
                {work.description !== '—' && (
                  <div className="cand-fs-sm mt-1 whitespace-pre-wrap leading-relaxed text-slate-600">
                    {work.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {certificates.length > 0 && (
        <SectionCard title="Chứng chỉ">
          <div className="flex flex-wrap gap-1.5">
            {certificates.map((cert, i) => (
              <div key={i} className="cand-fs-xs rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-600">
                {cert.name}{cert.year ? ` (${cert.year})` : ''}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {(candidate.jpResidenceStatus || candidate.visaExpirationDate || candidate.currentResidence) && (
        <SectionCard title="Visa & cư trú">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailField label="Tư cách lưu trú" value={getScoutResidenceStatusLabel(candidate.jpResidenceStatus)} />
            <DetailField label="Ngày hết hạn visa" value={formatScoutDate(candidate.visaExpirationDate)} />
            <DetailField label="Nơi cư trú hiện tại" value={candidate.currentResidence} />
            <DetailField label="Hộ chiếu" value={formatScoutYesNo(candidate.passport)} />
          </div>
        </SectionCard>
      )}

      {(candidate.currentIncome != null || candidate.desiredIncome != null) && (
        <SectionCard title="Lương">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailField label="Lương hiện tại" value={formatScoutIncome(candidate.currentIncome)} />
            <DetailField label="Lương mong muốn" value={formatScoutIncome(candidate.desiredIncome)} />
          </div>
        </SectionCard>
      )}

      {candidate.motivation && (
        <SectionCard title="Động lực">
          <p className="cand-fs-sm whitespace-pre-wrap leading-relaxed text-slate-600">{candidate.motivation}</p>
        </SectionCard>
      )}
    </div>
  )
}

function CandidateSidebar({
  candidate,
  exploreSubmitting,
  onExploreStatus,
}) {
  if (!candidate) {
    return null
  }

  const pipeline = getScoutPipelineMeta(candidate.pipelineStatus)
  const source = getScoutUnlockSourceMeta(candidate.unlockType)
  const isPerformanceUnlock = isScoutPerformanceUnlock(candidate)
  const perfReq = candidate.performanceRequest
  const perfStatusMeta = perfReq?.status ? getScoutPerformanceRequestMeta(perfReq.status) : null
  const exploreMeta = perfReq?.businessExploreStatus
    ? getScoutPerformanceExploreMeta(perfReq.businessExploreStatus)
    : null
  const canSetExplore = perfReq?.status === 'approved' && !perfReq?.businessExploreStatus

  const timeline = [
    {
      date: formatListDate(candidate.unlockedAt),
      action: `Mở hồ sơ Scout (${source.label})`,
    },
    ...(candidate.savedAt && candidate.savedAt !== candidate.unlockedAt
      ? [{ date: formatListDate(candidate.savedAt), action: 'Thêm vào hồ sơ ứng viên' }]
      : []),
    ...(perfReq?.requestedAt
      ? [{
        date: formatListDate(perfReq.requestedAt),
        action: `Yêu cầu Scout Performance (${SCOUT_PERFORMANCE_REQUEST_STATUS_LABELS[perfReq.status] || perfReq.status})`,
      }]
      : []),
    ...(perfReq?.handledAt
      ? [{ date: formatListDate(perfReq.handledAt), action: 'WS xử lý yêu cầu' }]
      : []),
    ...(perfReq?.businessExploreStatus === 'interested'
      ? [{ date: '—', action: 'DN xác nhận quan tâm — WS đang hỗ trợ liên hệ' }]
      : []),
    ...(perfReq?.wantsSimilarCandidates
      ? [{ date: '—', action: 'WS đang tìm thêm ứng viên tương tự' }]
      : []),
  ]

  return (
    <div className="candidate-scrollbar flex min-h-0 flex-col gap-3">
      {isPerformanceUnlock && (
        <div className="cand-surface border border-violet-100 bg-white shadow-sm">
          <h3 className="cand-fs-sm mb-2 font-bold text-slate-900">Scout Performance · WS</h3>
          {!perfReq ? (
            <p className="cand-fs-xs text-slate-400">
              Chưa có yêu cầu WS gắn với hồ sơ này.
            </p>
          ) : (
            <>
              {perfStatusMeta && (
                <div
                  className="cand-fs-xs mb-1.5 w-full rounded border border-slate-200 px-1.5 py-1 font-semibold"
                  style={{ color: perfStatusMeta.color, background: perfStatusMeta.bg }}
                >
                  Yêu cầu: {perfStatusMeta.label}
                  {perfReq.recommendationCount > 0 ? ` · ${perfReq.recommendationCount} gợi ý` : ''}
                </div>
              )}
              {exploreMeta ? (
                <div
                  className="cand-fs-xs mb-1.5 w-full rounded border border-slate-200 px-1.5 py-1 font-semibold"
                  style={{ color: exploreMeta.color, background: exploreMeta.bg }}
                >
                  Làm việc với WS: {exploreMeta.label}
                </div>
              ) : perfReq.wantsSimilarCandidates ? (
                <div className="cand-fs-2xs mb-1.5 font-semibold text-violet-600">
                  WS đang tìm ứng viên tương tự cho bạn
                </div>
              ) : perfReq.status === 'pending' ? (
                <div className="cand-fs-2xs mb-1.5 text-amber-600">
                  WS đang xem xét yêu cầu của bạn
                </div>
              ) : null}
              {canSetExplore && (
                <div className="mb-1.5">
                  <p className="cand-fs-2xs mb-1.5 text-slate-600">
                    WS có gợi ý phù hợp. Bạn có muốn WS hỗ trợ thêm về ứng viên này?
                  </p>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={exploreSubmitting}
                      onClick={() => onExploreStatus?.(perfReq.id, 'interested')}
                      className="cand-fs-xs w-full rounded bg-indigo-600 px-2 py-1.5 font-semibold text-white disabled:opacity-70"
                    >
                      Có — WS hỗ trợ liên hệ
                    </button>
                    <button
                      type="button"
                      disabled={exploreSubmitting}
                      onClick={() => onExploreStatus?.(perfReq.id, 'declined')}
                      className="cand-fs-xs w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 font-semibold text-slate-600 disabled:opacity-70"
                    >
                      Không, cảm ơn
                    </button>
                  </div>
                </div>
              )}
              <Link
                to={perfReq.id ? `/business/scout?performanceRequestId=${perfReq.id}` : '/business/scout'}
                className="cand-fs-2xs mb-1 flex items-center justify-between font-semibold text-[#0077B6]"
              >
                Xem gợi ý trên Scout
                <ChevronRight className="cand-icon" />
              </Link>
              <Link
                to="/business/messages?tab=ws"
                className="cand-fs-2xs flex items-center gap-1 font-semibold text-violet-600"
              >
                <MessageSquare className="cand-icon" />
                Chat với WS
              </Link>
            </>
          )}
        </div>
      )}

      <div className="cand-surface border border-slate-200/80 bg-white shadow-sm">
        <h3 className="cand-fs-sm mb-2 font-bold text-slate-900">
          {isPerformanceUnlock ? 'Trạng thái tiếp cận' : 'Trạng thái'}
        </h3>
        <div
          className="cand-fs-sm mb-1 w-full rounded-md border border-slate-200 px-2 py-1 font-semibold"
          style={{ color: pipeline.color, background: pipeline.bg }}
        >
          {pipeline.label}
        </div>
        <p className="cand-fs-xs text-slate-400">
          {isPerformanceUnlock ? 'Gói Scout Performance · Phí 20% khi tuyển thành công' : `Chi phí mở: ${candidate.creditCost ?? '—'} credit`}
        </p>
      </div>

      <div className="cand-surface border border-slate-200/80 bg-white shadow-sm">
        <h3 className="cand-fs-sm mb-2 font-bold text-slate-900">Hoạt động</h3>
        <div className="flex flex-col gap-1.5">
          {timeline.map((item, i) => (
            <div key={i} className="flex gap-2">
              <div
                className="cand-fs-2xs flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-bold text-white"
                style={{ background: BRAND }}
              >
                ●
              </div>
              <div className="min-w-0 flex-1">
                <div className="cand-fs-sm font-medium text-slate-700">{item.action}</div>
                <div className="cand-fs-xs mt-0.5 text-slate-400">{item.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!isPerformanceUnlock && (
      <div className="cand-surface border border-slate-200/80 bg-white shadow-sm">
        {candidate.phone ? (
          <a
            href={`tel:${candidate.phone}`}
            className="cand-fs-sm mb-1 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 font-semibold text-white"
            style={{ background: BRAND }}
          >
            <Phone className="cand-icon" />
            Gọi {candidate.phone}
          </a>
        ) : (
          <button type="button" disabled className="cand-fs-sm mb-1 w-full rounded-lg bg-slate-100 py-1.5 font-semibold text-slate-400">
            Không có SĐT
          </button>
        )}
        {candidate.email ? (
          <a
            href={`mailto:${candidate.email}`}
            className="cand-fs-sm flex w-full items-center justify-center gap-1 rounded-lg border py-1.5 font-semibold"
            style={{ borderColor: BRAND, color: BRAND }}
          >
            <Mail className="cand-icon" />
            Email
          </a>
        ) : (
          <button type="button" disabled className="cand-fs-sm w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 font-semibold text-slate-400">
            Không có email
          </button>
        )}
      </div>
      )}

      <div className="cand-surface border border-slate-200/80 bg-white shadow-sm">
        <Link
          to="/business/scout"
          className="cand-fs-sm flex items-center justify-between font-semibold hover:opacity-80"
          style={{ color: BRAND }}
        >
          Tìm thêm trên Scout
          <ChevronRight className="cand-icon" />
        </Link>
      </div>
    </div>
  )
}

export default function BusinessUnlockedCandidateDetail() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const numericCandidateId = parseInt(candidateId, 10)

  const [candidate, setCandidate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exploreSubmitting, setExploreSubmitting] = useState(false)

  const backToListUrl = useMemo(() => {
    const params = new URLSearchParams()
    const list = searchParams.get('list')
    const search = searchParams.get('search')
    if (list && list !== 'all') params.set('list', list)
    if (search) params.set('search', search)
    const qs = params.toString()
    return `/business/candidates${qs ? `?${qs}` : ''}`
  }, [searchParams])

  const patchPerformanceExplore = useCallback((cvId, requestId, action) => {
    setCandidate((prev) => {
      if (!prev || prev.id !== cvId) return prev
      return {
        ...prev,
        performanceRequest: {
          ...(prev.performanceRequest || {}),
          id: requestId,
          businessExploreStatus: action,
        },
      }
    })
  }, [])

  const handlePerformanceExplore = useCallback(async (requestId, action) => {
    if (!requestId) return
    setExploreSubmitting(true)
    try {
      const res = await apiService.setBusinessScoutPerformanceExplore(requestId, action)
      if (res?.success && numericCandidateId) {
        patchPerformanceExplore(numericCandidateId, requestId, action)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setExploreSubmitting(false)
    }
  }, [patchPerformanceExplore, numericCandidateId])

  useEffect(() => {
    if (!numericCandidateId || Number.isNaN(numericCandidateId)) {
      setError('ID ứng viên không hợp lệ')
      setCandidate(null)
      setLoading(false)
      return
    }

    let mounted = true

    const loadDetail = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await apiService.getBusinessScoutUnlockedCandidateById(numericCandidateId)
        if (!mounted) return
        if (res?.success && res.data?.candidate) {
          setCandidate(res.data.candidate)
        } else {
          setCandidate(null)
          setError(res?.message || 'Không tìm thấy hồ sơ ứng viên')
        }
      } catch (e) {
        console.error(e)
        if (mounted) {
          setCandidate(null)
          setError('Không tải được hồ sơ ứng viên')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadDetail()
    return () => { mounted = false }
  }, [numericCandidateId])

  return (
    <>
      <style>{detailPageStyles}</style>
      <div
        className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f4f6f8]"
        style={{ fontFamily: PAGE_FONT }}
      >
        <div className="w-full shrink-0 border-b border-slate-200/80 bg-white px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={() => navigate(backToListUrl)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại danh sách
          </button>
        </div>

        <div className="candidate-scrollbar min-h-0 flex-1 overflow-y-auto p-2 lg:p-3">
          <div className="business-candidates-ui mx-auto w-full max-w-[1600px]">
            {loading ? (
              <CandidateDetail candidate={null} loading />
            ) : error || !candidate ? (
              <div className="cand-surface flex flex-col items-center justify-center border border-slate-200/80 bg-white px-6 py-12 text-center shadow-sm">
                <p className="cand-fs-sm font-semibold text-slate-800">
                  {error || 'Không tìm thấy hồ sơ ứng viên'}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(backToListUrl)}
                  className="cand-fs-sm mt-4 rounded-lg px-4 py-2 font-semibold text-white hover:opacity-95"
                  style={{ background: BRAND }}
                >
                  Quay lại danh sách
                </button>
              </div>
            ) : (
              <div className="business-candidates-detail-grid has-sidebar">
                <CandidateDetail candidate={candidate} loading={false} />
                <CandidateSidebar
                  candidate={candidate}
                  exploreSubmitting={exploreSubmitting}
                  onExploreStatus={handlePerformanceExplore}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
