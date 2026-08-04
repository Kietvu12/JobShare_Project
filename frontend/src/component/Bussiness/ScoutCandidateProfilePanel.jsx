import React, { useMemo } from 'react'
import { BadgeCheck, X } from 'lucide-react'
import { highlightSearchText } from '../../utils/searchTextHighlight'
import {
  normalizeScoutCertificates,
  normalizeScoutEducations,
  normalizeScoutWorkExperiences,
  normalizeScoutWorkExperiencesTier2,
  getScoutResidenceStatusLabel,
  formatScoutGender,
  formatScoutYesNo,
  formatScoutDate,
  formatScoutIncome,
  formatScoutExperienceYears,
  getScoutSkillTags,
  getScoutPrSummary,
  getScoutApproximateAgeLabel,
  getScoutAvailabilityLabel,
  formatScoutJlptSummary,
  isScoutWorkExperienceAnonymized,
} from '../../utils/scoutCandidateDisplay'

const ICON_SM = { width: 10, height: 10 }
const ANONYMOUS_AVATAR = 'https://api.dicebear.com/7.x/shapes/svg?seed=scout-anonymous'

function getDisplayName(candidate, isUnlocked) {
  if (!candidate) return 'Ứng viên ẩn danh'
  if (isUnlocked && candidate.name) return candidate.name
  return candidate.anonymousName || 'Ứng viên ẩn danh'
}

function AvatarCircle({ candidate, size = 36, unlocked }) {
  const isUnlocked = unlocked ?? candidate?.isUnlocked
  const seed = isUnlocked ? (candidate?.name || 'user') : `anon-${candidate?.id || 'x'}`
  const src = isUnlocked && candidate?.avatarPhotoPath
    ? candidate.avatarPhotoPath
    : `${ANONYMOUS_AVATAR}&seed=${encodeURIComponent(String(seed))}`

  return (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', background: '#e2e8f0' }}
      onError={(e) => {
        e.currentTarget.src = `${ANONYMOUS_AVATAR}&seed=fallback`
      }}
    />
  )
}

function ScoutDetailGrid({ children }) {
  return (
    <div className="scout-detail-body text-slate-500" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {children}
    </div>
  )
}

function ScoutDetailField({ label, value, hl }) {
  if (value == null || value === '' || value === '—') return null
  return (
    <div>
      <div style={{ color: '#94a3b8', marginBottom: 1 }}>{label}</div>
      <div style={{ fontWeight: 600, color: '#1e293b' }}>{hl(value)}</div>
    </div>
  )
}

function ScoutSectionTitle({ children }) {
  return (
    <div className="scout-detail-title text-slate-800" style={{ marginBottom: 6, marginTop: 10 }}>
      {children}
    </div>
  )
}

/**
 * Panel chi tiết ứng viên Scout — Tier 1 (list) + Tier 2 (preview ẩn danh) + Tier 3 (sau unlock).
 */
export default function ScoutCandidateProfilePanel({
  candidate,
  highlightQuery = '',
  onClose = null,
  treatAsUnlocked = false,
  hideContact = false,
  accessLabel = 'Hồ sơ đã mở — thông tin đầy đủ',
  accessLabelColor = '#047857',
  footerNote = null,
  showLockedHint = false,
  className = '',
}) {
  const isUnlocked = treatAsUnlocked || Boolean(candidate?.isUnlocked)
  const shouldHideContact = hideContact || candidate?.hideContact || candidate?.isPerformancePartial

  const hl = useMemo(
    () => (text) => highlightSearchText(text, highlightQuery),
    [highlightQuery],
  )

  if (!candidate) {
    return (
      <div className={`scout-detail-body rounded-xl border border-slate-100 bg-white text-center text-slate-400 ${className}`} style={{ padding: 20 }}>
        Chưa có dữ liệu hồ sơ
      </div>
    )
  }

  const skills = getScoutSkillTags(candidate)
  const prSummary = getScoutPrSummary(candidate)
  const educations = normalizeScoutEducations(candidate.educations)
  const certificates = normalizeScoutCertificates(candidate.certificates)
  const approximateAge = getScoutApproximateAgeLabel(candidate)
  const availability = getScoutAvailabilityLabel(candidate)
  const residenceLabel = getScoutResidenceStatusLabel(candidate.jpResidenceStatus)
  const position = candidate.desiredPosition || candidate.jobCategory?.name || '—'

  const workExperiences = isUnlocked
    ? normalizeScoutWorkExperiences(candidate.workExperiences)
    : normalizeScoutWorkExperiencesTier2(candidate.workExperiences)

  const contactRows = [
    ['Email', candidate.email],
    ['SĐT', candidate.phone],
    ['Furigana', candidate.furigana],
    ['Ngày sinh', formatScoutDate(candidate.birthDate)],
    ['Giới tính', formatScoutGender(candidate.gender)],
    ['Địa chỉ hiện tại', candidate.addressCurrent],
    ['Địa chỉ gốc', candidate.addressOrigin],
    ['Mã bưu điện', candidate.postalCode],
  ].filter(([label, v]) => {
    if (shouldHideContact && (label === 'Email' || label === 'SĐT')) return false
    return v && v !== '—'
  })

  const visaRows = [
    ['Tư cách lưu trú', residenceLabel],
    ['Ngày hết hạn visa', formatScoutDate(candidate.visaExpirationDate)],
    ['Nơi cư trú hiện tại', candidate.currentResidence],
    ['Quốc gia khác', candidate.otherCountry],
    ['Hộ chiếu', formatScoutYesNo(candidate.passport)],
  ].filter(([, v]) => v && v !== '—')

  return (
    <div className={`rounded-xl border border-slate-100 bg-white ${className}`} style={{ padding: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <AvatarCircle candidate={candidate} size={40} unlocked={isUnlocked} />
          {isUnlocked && (
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#10b981', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <BadgeCheck {...ICON_SM} color="#fff" aria-hidden />
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="scout-detail-title text-slate-800">{hl(getDisplayName(candidate, isUnlocked))}</div>
          <div className="scout-detail-body text-slate-500">
            {hl(position)}
            {isUnlocked && candidate.code ? (
              <span style={{ color: '#94a3b8' }}> · {candidate.code}</span>
            ) : null}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{ width: 18, height: 18, borderRadius: 3, border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Đóng"
          >
            <X {...ICON_SM} aria-hidden />
          </button>
        )}
      </div>

      {/* Tier 1 — lặp lại thông tin từ list card */}
      <ScoutDetailGrid>
        <ScoutDetailField label="Kinh nghiệm" value={formatScoutExperienceYears(candidate.experienceYears)} hl={hl} />
        <ScoutDetailField label="Địa điểm mong muốn" value={candidate.desiredWorkLocation} hl={hl} />
        <ScoutDetailField label="Mức lương mong muốn" value={formatScoutIncome(candidate.desiredIncome)} hl={hl} />
        <ScoutDetailField label="JLPT / Ngoại ngữ" value={formatScoutJlptSummary(candidate)} hl={hl} />
      </ScoutDetailGrid>

      {/* Tier 2 — preview ẩn danh trước unlock */}
      {!isUnlocked && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
          <ScoutSectionTitle>Thông tin preview (ẩn danh)</ScoutSectionTitle>
          <ScoutDetailGrid>
            <ScoutDetailField label="Độ tuổi (khoảng)" value={approximateAge} hl={hl} />
            <ScoutDetailField label="Sẵn sàng nhập công ty" value={availability} hl={hl} />
            <ScoutDetailField label="Tư cách lưu trú" value={residenceLabel !== '—' ? residenceLabel : null} hl={hl} />
          </ScoutDetailGrid>

          {educations.length > 0 && (
            <>
              <ScoutSectionTitle>Học vấn</ScoutSectionTitle>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {educations.map((edu, i) => (
                  <li key={i} className="scout-detail-body text-slate-600" style={{ paddingLeft: 8, borderLeft: '2px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{hl(edu.period)}</span>
                    {' — '}
                    {hl(edu.content)}
                  </li>
                ))}
              </ul>
            </>
          )}

          {certificates.length > 0 && (
            <>
              <ScoutSectionTitle>Chứng chỉ</ScoutSectionTitle>
              <div className="flex flex-wrap gap-1">
                {certificates.map((cert, i) => (
                  <span key={i} className="scout-detail-body rounded-lg bg-blue-50 px-2 py-0.5 text-blue-700">
                    {hl(`${cert.name}${cert.year ? ` (${cert.year})` : ''}`)}
                  </span>
                ))}
              </div>
            </>
          )}

          {workExperiences.length > 0 && (
            <>
              <ScoutSectionTitle>Kinh nghiệm làm việc (ẩn danh)</ScoutSectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {workExperiences.map((work, i) => (
                  <div key={i} style={{ padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div className="scout-detail-title text-slate-800">{hl(work.role)}</div>
                    <div className="scout-detail-body text-slate-600" style={{ marginTop: 2 }}>{hl(work.companyTypeLabel)}</div>
                    <div className="scout-detail-caption text-slate-500" style={{ marginTop: 2 }}>{hl(work.period)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {prSummary && (
        <div style={{ marginTop: 8, padding: 8, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div className="scout-detail-caption text-slate-400" style={{ marginBottom: 4 }}>PR / Giới thiệu</div>
          <div className="scout-detail-body text-slate-600" style={{ lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
            {hl(prSummary)}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div className="scout-detail-caption text-slate-400" style={{ marginBottom: 4 }}>Kỹ năng</div>
          <div className="flex flex-wrap gap-1">
            {skills.map((skill) => (
              <span key={skill} className="scout-detail-body rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-600">
                {hl(skill)}
              </span>
            ))}
          </div>
        </div>
      )}

      {highlightQuery && Array.isArray(candidate.searchSnippets) && candidate.searchSnippets.length > 0 && (
        <div style={{ marginTop: 8, padding: 8, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
          <div className="scout-detail-caption font-semibold text-amber-800" style={{ marginBottom: 4 }}>Khớp từ khóa</div>
          {candidate.searchSnippets.map((snippet) => (
            <div key={snippet} className="scout-detail-body text-slate-600" style={{ lineHeight: 1.45 }}>
              {hl(snippet)}
            </div>
          ))}
        </div>
      )}

      {/* Tier 3 — sau unlock */}
      {isUnlocked && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
          <div className="scout-detail-title" style={{ color: accessLabelColor, marginBottom: 6 }}>
            {accessLabel}
          </div>

          {contactRows.length > 0 && (
            <>
              <ScoutSectionTitle>Liên hệ & cá nhân</ScoutSectionTitle>
              <ScoutDetailGrid>
                {contactRows.map(([label, value]) => (
                  <ScoutDetailField key={label} label={label} value={value} hl={hl} />
                ))}
              </ScoutDetailGrid>
            </>
          )}

          {visaRows.length > 0 && (
            <>
              <ScoutSectionTitle>Visa & cư trú</ScoutSectionTitle>
              <ScoutDetailGrid>
                {visaRows.map(([label, value]) => (
                  <ScoutDetailField key={label} label={label} value={value} hl={hl} />
                ))}
              </ScoutDetailGrid>
            </>
          )}

          {(candidate.currentIncome != null || candidate.desiredIncome != null) && (
            <>
              <ScoutSectionTitle>Lương</ScoutSectionTitle>
              <ScoutDetailGrid>
                <ScoutDetailField label="Lương hiện tại" value={formatScoutIncome(candidate.currentIncome)} hl={hl} />
                <ScoutDetailField label="Lương mong muốn" value={formatScoutIncome(candidate.desiredIncome)} hl={hl} />
              </ScoutDetailGrid>
            </>
          )}

          {isUnlocked && educations.length > 0 && (
            <>
              <ScoutSectionTitle>Học vấn</ScoutSectionTitle>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {educations.map((edu, i) => (
                  <li key={i} className="scout-detail-body text-slate-600" style={{ paddingLeft: 8, borderLeft: '2px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{hl(edu.period)}</span>
                    {' — '}
                    {hl(edu.content)}
                  </li>
                ))}
              </ul>
            </>
          )}

          {workExperiences.length > 0 && !isScoutWorkExperienceAnonymized(workExperiences[0]) && (
            <>
              <ScoutSectionTitle>Lịch sử công việc</ScoutSectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {workExperiences.map((work, i) => (
                  <div key={i} style={{ padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div className="scout-detail-title text-slate-800">{hl(work.companyName)}</div>
                    <div className="scout-detail-caption text-slate-500" style={{ marginTop: 2 }}>{hl(work.period)}</div>
                    <div className="scout-detail-body text-slate-600" style={{ marginTop: 4, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                      {hl(work.description)}
                    </div>
                    {work.projects?.length > 0 && (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {work.projects.map((project, pIdx) => (
                          <div key={pIdx} className="scout-detail-body text-slate-600" style={{ padding: 4, borderRadius: 4, background: 'white', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{hl(project.name)}</div>
                            {hl([project.role, project.period, project.tools].filter(Boolean).join(' · '))}
                            {project.description ? (
                              <div style={{ marginTop: 2, lineHeight: 1.35 }}>{hl(project.description)}</div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {certificates.length > 0 && isUnlocked && (
            <>
              <ScoutSectionTitle>Chứng chỉ</ScoutSectionTitle>
              <div className="flex flex-wrap gap-1">
                {certificates.map((cert, i) => (
                  <span key={i} className="scout-detail-body rounded-lg bg-blue-50 px-2 py-0.5 text-blue-700">
                    {hl(`${cert.name}${cert.year ? ` (${cert.year})` : ''}`)}
                  </span>
                ))}
              </div>
            </>
          )}

          {candidate.motivation && (
            <>
              <ScoutSectionTitle>Động lực</ScoutSectionTitle>
              <div className="scout-detail-body text-slate-600" style={{ lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{hl(candidate.motivation)}</div>
            </>
          )}
        </div>
      )}

      {showLockedHint && !isUnlocked && (
        <div className="rounded-lg bg-indigo-50" style={{ padding: 8, marginTop: 8, border: '1px solid #e0e7ff' }}>
          <div className="scout-detail-body text-indigo-600" style={{ lineHeight: 1.35 }}>
            Hồ sơ đang ẩn danh. Mở bằng credit để xem tên thật, email, SĐT, địa chỉ và tên công ty cụ thể.
          </div>
        </div>
      )}

      {footerNote && (
        <div className="scout-detail-body text-slate-500" style={{ marginTop: 8, padding: 8, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', lineHeight: 1.4 }}>
          {footerNote}
        </div>
      )}
    </div>
  )
}
