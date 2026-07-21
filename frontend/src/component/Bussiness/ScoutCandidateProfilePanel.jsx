import React, { useMemo } from 'react'
import { BadgeCheck, X } from 'lucide-react'
import { highlightSearchText } from '../../utils/searchTextHighlight'
import {
  normalizeScoutCertificates,
  normalizeScoutEducations,
  normalizeScoutWorkExperiences,
  getScoutResidenceStatusLabel,
  formatScoutGender,
  formatScoutYesNo,
  formatScoutDate,
  formatScoutIncome,
} from '../../utils/scoutCandidateDisplay'

const ICON_SM = { width: 10, height: 10 }
const ANONYMOUS_AVATAR = 'https://api.dicebear.com/7.x/shapes/svg?seed=scout-anonymous'

function formatExperienceYears(years) {
  const n = Number(years)
  if (!Number.isFinite(n) || n <= 0) return '—'
  return `${n} năm`
}

function getSkillTags(candidate) {
  const raw = candidate?.technicalSkills
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String)
  if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim()
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String)
      } catch {
        // fall through
      }
    }
    return trimmed.split(/[,;|/]/).map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function getDisplayName(candidate) {
  if (!candidate) return 'Ứng viên ẩn danh'
  if (candidate.isUnlocked && candidate.name) return candidate.name
  if (candidate.name) return candidate.name
  return candidate.anonymousName || 'Ứng viên ẩn danh'
}

function getPrSummary(candidate) {
  return (
    candidate?.scoutPublicSummary ||
    candidate?.careerSummary ||
    candidate?.strengths ||
    ''
  )
}

function AvatarCircle({ candidate, size = 36, unlocked }) {
  const name = getDisplayName(candidate)
  const isUnlocked = unlocked ?? candidate?.isUnlocked
  const seed = isUnlocked ? name : `anon-${candidate?.id || 'x'}`
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

/**
 * Panel chi tiết ứng viên — cùng bố cục với Scout.jsx (cột phải sau khi mở hồ sơ).
 */
export default function ScoutCandidateProfilePanel({
  candidate,
  highlightQuery = '',
  onClose = null,
  treatAsUnlocked = false,
  accessLabel = 'Hồ sơ đã mở — thông tin đầy đủ',
  accessLabelColor = '#047857',
  footerNote = null,
  showLockedHint = false,
  className = '',
}) {
  const isUnlocked = treatAsUnlocked || Boolean(candidate?.isUnlocked)

  const hl = useMemo(
    () => (text) => highlightSearchText(text, highlightQuery),
    [highlightQuery],
  )

  const sectionTitleStyle = { fontSize: 9, fontWeight: 700, color: '#1e293b', marginBottom: 6, marginTop: 10 }
  const labelStyle = { fontSize: 8, color: '#94a3b8' }
  const valueStyle = { fontSize: 9, fontWeight: 600, color: '#1e293b', wordBreak: 'break-word' }

  if (!candidate) {
    return (
      <div className={`bg-white rounded-xl border border-slate-100 text-center ${className}`} style={{ padding: 20, fontSize: 10, color: '#94a3b8' }}>
        Chưa có dữ liệu hồ sơ
      </div>
    )
  }

  const educations = normalizeScoutEducations(candidate.educations)
  const workExperiences = normalizeScoutWorkExperiences(candidate.workExperiences)
  const certificates = normalizeScoutCertificates(candidate.certificates)
  const skills = getSkillTags(candidate)
  const prSummary = getPrSummary(candidate)

  const contactRows = [
    ['Email', candidate.email],
    ['SĐT', candidate.phone],
    ['Furigana', candidate.furigana],
    ['Ngày sinh', formatScoutDate(candidate.birthDate)],
    ['Giới tính', formatScoutGender(candidate.gender)],
    ['Địa chỉ hiện tại', candidate.addressCurrent],
    ['Địa chỉ gốc', candidate.addressOrigin],
    ['Mã bưu điện', candidate.postalCode],
  ].filter(([, v]) => v && v !== '—')

  const visaRows = [
    ['Tư cách lưu trú', getScoutResidenceStatusLabel(candidate.jpResidenceStatus)],
    ['Ngày hết hạn visa', formatScoutDate(candidate.visaExpirationDate)],
    ['Nơi cư trú hiện tại', candidate.currentResidence],
    ['Quốc gia khác', candidate.otherCountry],
    ['Hộ chiếu', formatScoutYesNo(candidate.passport)],
  ].filter(([, v]) => v && v !== '—')

  return (
    <div className={`bg-white rounded-xl border border-slate-100 ${className}`} style={{ padding: 10 }}>
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
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{hl(getDisplayName(candidate))}</div>
          {isUnlocked && (
            <div style={{ fontSize: 9, color: '#64748b' }}>
              {hl(candidate.desiredPosition || candidate.jobCategory?.name || '—')}
              {candidate.code ? (
                <span style={{ color: '#94a3b8' }}> · {candidate.code}</span>
              ) : null}
            </div>
          )}
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

      <div style={{ fontSize: 8, color: '#64748b', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {isUnlocked ? (
          <>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 1 }}>Kinh nghiệm</div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{hl(formatExperienceYears(candidate.experienceYears))}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 1 }}>Địa điểm</div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{hl(candidate.desiredWorkLocation || '—')}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 1 }}>Mức lương mong muốn</div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{hl(candidate.desiredIncome || '—')}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 1 }}>JLPT / Ngoại ngữ</div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>
                {hl([candidate.jlptLevel, candidate.jpConversationLevel, candidate.enConversationLevel].filter(Boolean).join(' · ') || '—')}
              </div>
            </div>
          </>
        ) : (
          <div style={{ gridColumn: '1 / -1', fontSize: 8, color: '#64748b' }}>
            Chỉ hiển thị PR và kỹ năng. Mở bằng credit để xem đầy đủ thông tin.
          </div>
        )}
      </div>

      {prSummary && (
        <div style={{ marginTop: 8, padding: 8, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 4 }}>PR / Giới thiệu</div>
          <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
            {hl(prSummary)}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 4 }}>Kỹ năng</div>
          <div className="flex flex-wrap gap-1">
            {skills.map((skill) => (
              <span key={skill} style={{ fontSize: 7, fontWeight: 500, color: '#3b82f6', background: '#eff6ff', borderRadius: 10, padding: '2px 6px' }}>
                {hl(skill)}
              </span>
            ))}
          </div>
        </div>
      )}

      {highlightQuery && Array.isArray(candidate.searchSnippets) && candidate.searchSnippets.length > 0 && (
        <div style={{ marginTop: 8, padding: 8, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
          <div style={{ fontSize: 8, color: '#92400e', marginBottom: 4, fontWeight: 600 }}>Khớp từ khóa</div>
          {candidate.searchSnippets.map((snippet) => (
            <div key={snippet} style={{ fontSize: 8, color: '#475569', lineHeight: 1.45 }}>
              {hl(snippet)}
            </div>
          ))}
        </div>
      )}

      {isUnlocked && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: accessLabelColor, marginBottom: 6 }}>
            {accessLabel}
          </div>

          {contactRows.length > 0 && (
            <>
              <div style={sectionTitleStyle}>Liên hệ & cá nhân</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {contactRows.map(([label, value]) => (
                  <div key={label}>
                    <div style={labelStyle}>{label}</div>
                    <div style={valueStyle}>{hl(value)}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {visaRows.length > 0 && (
            <>
              <div style={sectionTitleStyle}>Visa & cư trú</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {visaRows.map(([label, value]) => (
                  <div key={label}>
                    <div style={labelStyle}>{label}</div>
                    <div style={valueStyle}>{hl(value)}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {(candidate.currentIncome != null || candidate.desiredIncome != null) && (
            <>
              <div style={sectionTitleStyle}>Lương</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div>
                  <div style={labelStyle}>Lương hiện tại</div>
                  <div style={valueStyle}>{hl(formatScoutIncome(candidate.currentIncome))}</div>
                </div>
                <div>
                  <div style={labelStyle}>Lương mong muốn</div>
                  <div style={valueStyle}>{hl(formatScoutIncome(candidate.desiredIncome))}</div>
                </div>
              </div>
            </>
          )}

          <div style={sectionTitleStyle}>Học vấn</div>
          {educations.length === 0 ? (
            <div style={{ fontSize: 8, color: '#94a3b8' }}>Chưa có thông tin học vấn</div>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {educations.map((edu, i) => (
                <li key={i} style={{ fontSize: 8, color: '#475569', paddingLeft: 8, borderLeft: '2px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{hl(edu.period)}</span>
                  {' — '}
                  {hl(edu.content)}
                </li>
              ))}
            </ul>
          )}

          <div style={sectionTitleStyle}>Lịch sử công việc</div>
          {workExperiences.length === 0 ? (
            <div style={{ fontSize: 8, color: '#94a3b8' }}>Chưa có kinh nghiệm làm việc</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {workExperiences.map((work, i) => (
                <div key={i} style={{ padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b' }}>{hl(work.companyName)}</div>
                  <div style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{hl(work.period)}</div>
                  <div style={{ fontSize: 8, color: '#475569', marginTop: 4, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                    {hl(work.description)}
                  </div>
                  {work.projects?.length > 0 && (
                    <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {work.projects.map((project, pIdx) => (
                        <div key={pIdx} style={{ fontSize: 8, color: '#475569', padding: 4, borderRadius: 4, background: 'white', border: '1px solid #e2e8f0' }}>
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
          )}

          {certificates.length > 0 && (
            <>
              <div style={sectionTitleStyle}>Chứng chỉ</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {certificates.map((cert, i) => (
                  <span key={i} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 8, background: '#eff6ff', color: '#1d4ed8' }}>
                    {hl(`${cert.name}${cert.year ? ` (${cert.year})` : ''}`)}
                  </span>
                ))}
              </div>
            </>
          )}

          {candidate.motivation && (
            <>
              <div style={sectionTitleStyle}>Động lực</div>
              <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{hl(candidate.motivation)}</div>
            </>
          )}
        </div>
      )}

      {showLockedHint && !isUnlocked && (
        <div className="bg-indigo-50 rounded-lg" style={{ padding: 8, marginTop: 8, border: '1px solid #e0e7ff' }}>
          <div style={{ fontSize: 8, color: '#4f46e5', lineHeight: 1.3 }}>
            Bạn chỉ thấy PR và kỹ năng. Dùng credit để xem email, SĐT và thông tin cá nhân đầy đủ.
          </div>
        </div>
      )}

      {footerNote && (
        <div style={{ marginTop: 8, padding: 8, fontSize: 8, color: '#64748b', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', lineHeight: 1.4 }}>
          {footerNote}
        </div>
      )}
    </div>
  )
}
