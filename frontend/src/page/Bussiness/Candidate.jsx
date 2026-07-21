import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, ChevronRight, MoreHorizontal, Phone, Mail, Loader2, BadgeCheck,
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
} from '../../utils/scoutCandidateDisplay'

const ICON_SM = { width: 10, height: 10 }
const ANONYMOUS_AVATAR = 'https://api.dicebear.com/7.x/shapes/svg?seed=scout-unlocked'
const PAGE_SIZE = 20

const scrollbarStyle = `
  .candidate-scrollbar::-webkit-scrollbar { width: 6px; }
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

function AvatarCircle({ candidate, size = 28 }) {
  const name = getScoutDisplayName(candidate)
  const src = candidate?.avatarPhotoPath
    ? candidate.avatarPhotoPath
    : `${ANONYMOUS_AVATAR}&seed=${encodeURIComponent(String(name || candidate?.id || 'x'))}`

  return (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: '#e2e8f0' }}
      onError={(e) => {
        e.currentTarget.src = `${ANONYMOUS_AVATAR}&seed=fallback`
      }}
    />
  )
}

function CandidateList({
  candidates,
  loading,
  selected,
  onSelect,
  searchInput,
  onSearchChange,
  total,
  page,
  totalPages,
  onPageChange,
}) {
  const pageStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="bg-white rounded-xl border border-slate-100 h-full flex flex-col" style={{ minHeight: 0 }}>
      <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
          Hồ sơ ứng viên đã mở Scout
        </h2>
        <div className="flex items-center gap-1" style={{ marginBottom: 6 }}>
          <div className="flex items-center gap-1 bg-slate-50 rounded-lg flex-1" style={{ padding: '4px 6px' }}>
            <Search style={{ width: 10, height: 10, color: '#94a3b8', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Tìm kiếm ứng viên..."
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent outline-none w-full"
              style={{ fontSize: 9, color: '#475569' }}
            />
          </div>
        </div>
        <div style={{ fontSize: 8, color: '#64748b' }}>Tổng: {total}</div>
      </div>

      <div className="flex-1 overflow-y-auto candidate-scrollbar" style={{ padding: '6px', minHeight: 0 }}>
        {loading ? (
          <div className="flex items-center justify-center gap-2" style={{ padding: 20, fontSize: 9, color: '#64748b' }}>
            <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
            Đang tải...
          </div>
        ) : candidates.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', fontSize: 9, color: '#94a3b8' }}>
            Chưa có ứng viên nào được mở Scout.
            <div style={{ marginTop: 8 }}>
              <Link to="/business/scout" style={{ fontSize: 9, color: '#3b82f6', fontWeight: 600 }}>
                Tìm ứng viên trên Scout →
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 4 }}>
            {candidates.map((c) => {
              const pipeline = getScoutPipelineMeta(c.pipelineStatus)
              const source = getScoutUnlockSourceMeta(c.unlockType)
              return (
                <div
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  style={{
                    padding: '8px',
                    borderRadius: 6,
                    border: selected === c.id ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                    background: selected === c.id ? '#eff6ff' : '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AvatarCircle candidate={c} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getScoutDisplayName(c)}
                      </div>
                      <div style={{ fontSize: 8, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.desiredPosition || c.jobCategory?.name || '—'}
                      </div>
                      <div style={{ fontSize: 7, color: source.color, fontWeight: 500, marginTop: 1 }}>
                        ● {source.label}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 7,
                        fontWeight: 600,
                        color: pipeline.color,
                        background: pipeline.bg,
                        borderRadius: 20,
                        padding: '1px 4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {pipeline.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 7, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
                    {formatListDate(c.unlockedAt)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100" style={{ padding: '6px 8px', background: '#f8fafc' }}>
          <span style={{ fontSize: 8, color: '#94a3b8' }}>
            {pageStart}-{pageEnd}/{total}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              style={{
                width: 20, height: 20, borderRadius: 3, border: '1px solid #e2e8f0',
                background: 'white', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                color: '#94a3b8', fontSize: 8, opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              ‹
            </button>
            <span style={{ fontSize: 8, color: '#64748b', padding: '0 4px' }}>{page}/{totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              style={{
                width: 20, height: 20, borderRadius: 3, border: '1px solid #e2e8f0',
                background: 'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                color: '#94a3b8', fontSize: 8, opacity: page >= totalPages ? 0.5 : 1,
              }}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CandidateDetail({ candidate, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 text-center" style={{ padding: 24, fontSize: 10, color: '#64748b' }}>
        <Loader2 style={{ width: 14, height: 14, margin: '0 auto 8px' }} className="animate-spin" />
        Đang tải chi tiết...
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 text-center" style={{ padding: 24, fontSize: 10, color: '#94a3b8' }}>
        Chọn ứng viên để xem chi tiết
      </div>
    )
  }

  const source = getScoutUnlockSourceMeta(candidate.unlockType)
  const skills = getScoutSkillTags(candidate)
  const educations = normalizeScoutEducations(candidate.educations)
  const workExperiences = normalizeScoutWorkExperiences(candidate.workExperiences)
  const certificates = normalizeScoutCertificates(candidate.certificates)

  const infoRows = [
    ['Email', candidate.email],
    ['Phone', candidate.phone],
    ['Furigana', candidate.furigana],
    ['Ngày sinh', formatScoutDate(candidate.birthDate)],
    ['Giới tính', formatScoutGender(candidate.gender)],
    ['Địa điểm mong muốn', candidate.desiredWorkLocation],
    ['Kinh nghiệm', formatScoutExperienceYears(candidate.experienceYears)],
    ['Vị trí mong muốn', candidate.desiredPosition || candidate.jobCategory?.name],
    ['Mức lương mong muốn', candidate.desiredIncome || '—'],
    ['JLPT / Ngoại ngữ', [candidate.jlptLevel, candidate.jpConversationLevel, candidate.enConversationLevel].filter(Boolean).join(' · ') || '—'],
  ].filter(([, value]) => value && value !== '—')

  return (
    <div className="flex flex-col gap-2 candidate-scrollbar" style={{ minHeight: 0 }}>
      <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <AvatarCircle candidate={candidate} size={50} />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#10b981', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <BadgeCheck {...ICON_SM} color="#fff" aria-hidden />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
              {getScoutDisplayName(candidate)}
            </div>
            <div style={{ fontSize: 9, color: '#64748b', marginBottom: 3 }}>
              {candidate.desiredPosition || candidate.jobCategory?.name || '—'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, color: '#94a3b8' }}>
              {formatScoutAgeGender(candidate)}
              {candidate.desiredWorkLocation ? ` | ${candidate.desiredWorkLocation}` : ''}
            </div>
            <div style={{ fontSize: 8, color: source.color, fontWeight: 600, marginTop: 3 }}>
              Nguồn: {source.label} · Mở ngày {formatListDate(candidate.unlockedAt)}
            </div>
            {candidate.code ? (
              <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 2 }}>Mã CV: {candidate.code}</div>
            ) : null}
          </div>
          <button type="button" style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MoreHorizontal style={{ width: 10, height: 10 }} />
          </button>
        </div>
      </div>

      {getScoutPrSummary(candidate) && (
        <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px' }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>PR / Giới thiệu</h3>
          <p style={{ fontSize: 8, color: '#475569', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
            {getScoutPrSummary(candidate)}
          </p>
        </div>
      )}

      {infoRows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px' }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Thông tin cá nhân</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {infoRows.map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 9, fontWeight: 500, color: '#1e293b', wordBreak: 'break-word' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px' }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Kỹ năng</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {skills.map((skill) => (
              <div key={skill} style={{ fontSize: 8, fontWeight: 600, color: '#3b82f6', background: '#eff6ff', borderRadius: 12, padding: '3px 8px' }}>
                {skill}
              </div>
            ))}
          </div>
        </div>
      )}

      {educations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px' }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Học vấn</h3>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {educations.map((edu, i) => (
              <li key={i} style={{ fontSize: 8, color: '#475569', paddingLeft: 8, borderLeft: '2px solid #e2e8f0' }}>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{edu.period}</span>
                {' — '}
                {edu.content}
              </li>
            ))}
          </ul>
        </div>
      )}

      {workExperiences.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px' }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Lịch sử công việc</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {workExperiences.map((work, i) => (
              <div key={i} style={{ padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b' }}>{work.companyName}</div>
                <div style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{work.period}</div>
                {work.description !== '—' && (
                  <div style={{ fontSize: 8, color: '#475569', marginTop: 4, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                    {work.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {certificates.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px' }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Chứng chỉ</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {certificates.map((cert, i) => (
              <div key={i} style={{ fontSize: 8, color: '#475569', background: '#f8fafc', borderRadius: 8, padding: '4px 8px', border: '1px solid #e2e8f0' }}>
                {cert.name}{cert.year ? ` (${cert.year})` : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {(candidate.jpResidenceStatus || candidate.visaExpirationDate || candidate.currentResidence) && (
        <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px' }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Visa & cư trú</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['Tư cách lưu trú', getScoutResidenceStatusLabel(candidate.jpResidenceStatus)],
              ['Ngày hết hạn visa', formatScoutDate(candidate.visaExpirationDate)],
              ['Nơi cư trú hiện tại', candidate.currentResidence],
              ['Hộ chiếu', formatScoutYesNo(candidate.passport)],
            ].filter(([, value]) => value && value !== '—').map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 9, fontWeight: 500, color: '#1e293b' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(candidate.currentIncome != null || candidate.desiredIncome != null) && (
        <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px' }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Lương</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 2 }}>Lương hiện tại</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b' }}>{formatScoutIncome(candidate.currentIncome)}</div>
            </div>
            <div>
              <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 2 }}>Lương mong muốn</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b' }}>{formatScoutIncome(candidate.desiredIncome)}</div>
            </div>
          </div>
        </div>
      )}

      {candidate.motivation && (
        <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px' }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Động lực</h3>
          <p style={{ fontSize: 8, color: '#475569', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{candidate.motivation}</p>
        </div>
      )}
    </div>
  )
}

function CandidateSidebar({ candidate }) {
  if (!candidate) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 text-center" style={{ padding: 16, fontSize: 9, color: '#94a3b8' }}>
        Chưa chọn ứng viên
      </div>
    )
  }

  const pipeline = getScoutPipelineMeta(candidate.pipelineStatus)
  const source = getScoutUnlockSourceMeta(candidate.unlockType)

  const timeline = [
    {
      date: formatListDate(candidate.unlockedAt),
      action: `Mở hồ sơ Scout (${source.label})`,
    },
    ...(candidate.savedAt && candidate.savedAt !== candidate.unlockedAt
      ? [{ date: formatListDate(candidate.savedAt), action: 'Thêm vào hồ sơ ứng viên' }]
      : []),
  ]

  return (
    <div className="flex flex-col gap-2 candidate-scrollbar" style={{ minHeight: 0 }}>
      <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px' }}>
        <h3 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Trạng thái</h3>
        <div
          style={{
            width: '100%',
            fontSize: 9,
            padding: '5px 6px',
            borderRadius: 4,
            border: '1px solid #e2e8f0',
            color: pipeline.color,
            background: pipeline.bg,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          {pipeline.label}
        </div>
        <div style={{ fontSize: 8, color: '#94a3b8' }}>
          Chi phí mở: {candidate.creditCost ?? '—'} credit
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px' }}>
        <h3 style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Hành trình</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {timeline.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 7, fontWeight: 600, color: '#4f46e5' }}>
                ●
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 8, color: '#475569', fontWeight: 500 }}>{item.action}</div>
                <div style={{ fontSize: 7, color: '#94a3b8', marginTop: 1 }}>{item.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px' }}>
        {candidate.phone ? (
          <a
            href={`tel:${candidate.phone}`}
            style={{
              width: '100%', fontSize: 9, fontWeight: 600, color: 'white', background: '#3b82f6',
              border: 'none', borderRadius: 4, padding: '6px', cursor: 'pointer', marginBottom: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none',
            }}
          >
            <Phone style={{ width: 9, height: 9 }} />
            Gọi {candidate.phone}
          </a>
        ) : (
          <button type="button" disabled style={{ width: '100%', fontSize: 9, fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', border: 'none', borderRadius: 4, padding: '6px', marginBottom: 6 }}>
            Không có SĐT
          </button>
        )}
        {candidate.email ? (
          <a
            href={`mailto:${candidate.email}`}
            style={{
              width: '100%', fontSize: 9, fontWeight: 600, color: '#3b82f6', background: 'white',
              border: '1px solid #3b82f6', borderRadius: 4, padding: '6px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none',
            }}
          >
            <Mail style={{ width: 9, height: 9 }} />
            Email
          </a>
        ) : (
          <button type="button" disabled style={{ width: '100%', fontSize: 9, fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, padding: '6px' }}>
            Không có email
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-100" style={{ padding: '10px' }}>
        <Link
          to="/business/scout"
          style={{
            fontSize: 8, fontWeight: 600, color: '#3b82f6', textDecoration: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          Tìm thêm trên Scout
          <ChevronRight style={{ width: 9, height: 9 }} />
        </Link>
      </div>
    </div>
  )
}

const Candidate = () => {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 })
  const [selectedId, setSelectedId] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  const loadList = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await apiService.getBusinessScoutUnlockedCandidates({
        page,
        limit: PAGE_SIZE,
        search: searchQuery || undefined,
        sortBy: 'unlockedAt',
        sortOrder: 'DESC',
      })
      if (res?.success && res.data) {
        const list = res.data.candidates || []
        setCandidates(list)
        setPagination(res.data.pagination || { total: 0, totalPages: 0 })
        setSelectedId((prev) => {
          if (prev && list.some((c) => c.id === prev)) return prev
          return list[0]?.id ?? null
        })
      } else {
        setCandidates([])
        setError(res?.message || 'Không tải được danh sách ứng viên')
      }
    } catch (e) {
      console.error(e)
      setCandidates([])
      setError('Không tải được danh sách ứng viên')
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null)
      return
    }
    let mounted = true
    const loadDetail = async () => {
      try {
        setDetailLoading(true)
        const res = await apiService.getBusinessScoutUnlockedCandidateById(selectedId)
        if (!mounted) return
        if (res?.success && res.data?.candidate) {
          setSelectedDetail(res.data.candidate)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setDetailLoading(false)
      }
    }
    loadDetail()
    return () => { mounted = false }
  }, [selectedId])

  const selectedCand = useMemo(() => {
    if (selectedDetail) return selectedDetail
    return candidates.find((c) => c.id === selectedId) || null
  }, [selectedDetail, candidates, selectedId])

  const totalPages = pagination.totalPages || 0
  const totalItems = pagination.total || 0

  return (
    <>
      <style>{scrollbarStyle}</style>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        {error && (
          <div style={{ margin: '8px 12px 0', padding: '8px 10px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 9, color: '#b91c1c' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 220px', gap: 12, flex: 1, overflow: 'hidden', padding: 12 }}>
          <div style={{ height: '100%', overflowY: 'auto', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }} className="candidate-scrollbar">
            <CandidateList
              candidates={candidates}
              loading={loading}
              selected={selectedId}
              onSelect={setSelectedId}
              searchInput={searchInput}
              onSearchChange={setSearchInput}
              total={totalItems}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>

          <div style={{ height: '100%', overflowY: 'auto' }} className="candidate-scrollbar">
            <CandidateDetail candidate={selectedCand} loading={detailLoading && !selectedCand} />
          </div>

          <div style={{ height: '100%', overflowY: 'auto' }} className="candidate-scrollbar">
            <CandidateSidebar candidate={selectedCand} />
          </div>
        </div>
      </div>
    </>
  )
}

export default Candidate
