import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search, SlidersHorizontal, ChevronRight, ChevronLeft,
  UserCheck, X, Unlock, Users, Check, BadgeCheck, Loader2,
} from 'lucide-react'
import apiService from '../../services/api'
import useBusinessUser from '../../hooks/useBusinessUser'
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
import { highlightSearchText } from '../../utils/searchTextHighlight'

const ICON_SM = { width: 10, height: 10 }
const ICON_MD = { width: 12, height: 12 }

const scrollbarStyle = `
  .scout-scrollbar::-webkit-scrollbar { width: 6px; }
  .scout-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .scout-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .scout-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .scout-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
  .scout-search-highlight {
    background-color: #fef08a !important;
    color: #92400e !important;
    padding: 0 2px;
    border-radius: 2px;
    font-weight: 600;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }
`

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

function getVisibleSkills(candidate, highlightQuery) {
  const skills = getSkillTags(candidate)
  if (highlightQuery) return { skills, hiddenCount: 0 }
  return {
    skills: skills.slice(0, 2),
    hiddenCount: Math.max(0, skills.length - 2),
  }
}

function getDisplayName(candidate) {
  if (!candidate) return 'Ứng viên ẩn danh'
  if (candidate.isUnlocked && candidate.name) return candidate.name
  return candidate.anonymousName || candidate.name || 'Ứng viên ẩn danh'
}

function getPrSummary(candidate) {
  return (
    candidate?.scoutPublicSummary ||
    candidate?.careerSummary ||
    candidate?.strengths ||
    ''
  )
}

function AvatarCircle({ candidate, size = 36 }) {
  const name = getDisplayName(candidate)
  const seed = candidate?.isUnlocked ? name : `anon-${candidate?.id || 'x'}`
  const src = candidate?.isUnlocked && candidate?.avatarPhotoPath
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

const Scout = () => {
  const { credit: userCredit, user, companyName } = useBusinessUser()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 })
  const [selectedId, setSelectedId] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [credit, setCredit] = useState(userCredit || 0)
  const [scoutCreditCost, setScoutCreditCost] = useState(5)
  const [unlocking, setUnlocking] = useState(false)
  const [performanceRequesting, setPerformanceRequesting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setCredit(userCredit || 0)
  }, [userCredit])

  const loadList = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await apiService.getBusinessScoutCandidates({
        page,
        limit,
        search: searchQuery || undefined,
        sortBy: 'scoutListedAt',
        sortOrder: 'DESC',
      })
      if (res?.success && res.data) {
        const list = res.data.candidates || []
        setCandidates(list)
        setPagination(res.data.pagination || { total: 0, totalPages: 0 })
        if (typeof res.data.scoutCreditCost === 'number') {
          setScoutCreditCost(res.data.scoutCreditCost)
        }
        if (typeof res.data.credit === 'number') {
          setCredit(res.data.credit)
        }
        if (list.length > 0) {
          setSelectedId((prev) => {
            if (prev && list.some((c) => c.id === prev)) return prev
            return list[0].id
          })
        } else {
          setSelectedId(null)
          setSelectedDetail(null)
        }
      } else {
        setCandidates([])
        setError(res?.message || 'Không tải được danh sách Scout')
      }
    } catch (e) {
      console.error(e)
      setCandidates([])
      setError('Không tải được danh sách Scout')
    } finally {
      setLoading(false)
    }
  }, [page, limit, searchQuery])

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
        const res = await apiService.getBusinessScoutCandidateById(selectedId, {
          search: searchQuery || undefined,
        })
        if (!mounted) return
        if (res?.success && res.data?.candidate) {
          setSelectedDetail(res.data.candidate)
          if (typeof res.data.scoutCreditCost === 'number') {
            setScoutCreditCost(res.data.scoutCreditCost)
          }
          if (typeof res.data.credit === 'number') {
            setCredit(res.data.credit)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setDetailLoading(false)
      }
    }
    loadDetail()
    return () => { mounted = false }
  }, [selectedId, searchQuery])

  const selectedCand = useMemo(() => {
    if (selectedDetail) return selectedDetail
    return candidates.find((c) => c.id === selectedId) || null
  }, [selectedDetail, candidates, selectedId])

  const patchCandidateUnlocked = (cvId, fullCandidate) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === cvId ? { ...c, ...fullCandidate, isUnlocked: true } : c)),
    )
    setSelectedDetail(fullCandidate)
  }

  const handlePerformanceRequest = async () => {
    if (!selectedCand?.id || selectedCand.isUnlocked || selectedCand.performanceRequest) return
    const name = getDisplayName(selectedCand)
    if (!window.confirm(`Gửi yêu cầu Scout Performance để Admin/CTV mở liên hệ ứng viên "${name}"?\n\nKhông tốn credit — phí thành công 20% chỉ tính khi tuyển thành công.`)) return

    setPerformanceRequesting(true)
    try {
      const res = await apiService.createBusinessScoutPerformanceRequest(selectedCand.id, {
        message: `Yêu cầu Scout Performance từ ${companyName || 'doanh nghiệp'}`,
      })
      if (res?.success) {
        const perf = res.data?.request
        setSelectedDetail((prev) => (prev ? {
          ...prev,
          performanceRequest: perf
            ? { id: perf.id, status: perf.status, requestedAt: perf.requestedAt, message: perf.message }
            : { status: 'pending' },
        } : prev))
        setCandidates((prev) => prev.map((c) => (
          c.id === selectedCand.id
            ? {
              ...c,
              performanceRequest: perf
                ? { id: perf.id, status: perf.status, requestedAt: perf.requestedAt }
                : { status: 'pending' },
            }
            : c
        )))
        alert(res.message || 'Đã gửi yêu cầu Scout Performance')
      } else {
        alert(res?.message || 'Gửi yêu cầu thất bại')
      }
    } catch (e) {
      console.error(e)
      alert('Gửi yêu cầu thất bại')
    } finally {
      setPerformanceRequesting(false)
    }
  }

  const handleUnlock = async () => {
    if (!selectedCand?.id || selectedCand.isUnlocked) return
    if (credit < scoutCreditCost) {
      alert(`Số credit không đủ. Cần ${scoutCreditCost} credit, hiện có ${credit}.`)
      return
    }
    const name = getDisplayName(selectedCand)
    if (!window.confirm(`Dùng ${scoutCreditCost} credit để mở liên hệ ứng viên "${name}"?`)) return

    setUnlocking(true)
    try {
      const res = await apiService.unlockBusinessScoutCandidate(selectedCand.id)
      if (res?.success && res.data?.candidate) {
        patchCandidateUnlocked(selectedCand.id, res.data.candidate)
        if (typeof res.data.credit === 'number') {
          setCredit(res.data.credit)
          if (user) {
            localStorage.setItem('user', JSON.stringify({ ...user, credit: res.data.credit }))
          }
        }
        alert(res.message || 'Đã mở hồ sơ thành công')
      } else {
        alert(res?.message || 'Mở hồ sơ thất bại')
      }
    } catch (e) {
      console.error(e)
      alert('Mở hồ sơ thất bại')
    } finally {
      setUnlocking(false)
    }
  }

  const totalPages = pagination.totalPages || 0
  const totalItems = pagination.total || 0

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = []
    if (page <= 4) {
      for (let i = 1; i <= 5; i += 1) pages.push(i)
    } else if (page >= totalPages - 3) {
      for (let i = totalPages - 4; i <= totalPages; i += 1) pages.push(i)
    } else {
      for (let i = page - 2; i <= page + 2; i += 1) pages.push(i)
    }
    return pages
  }, [page, totalPages])

  const highlightQuery = useMemo(
    () => (searchInput.trim() || searchQuery.trim()),
    [searchInput, searchQuery],
  )

  const hl = (text) => highlightSearchText(text, highlightQuery)

  const sectionTitleStyle = { fontSize: 9, fontWeight: 700, color: '#1e293b', marginBottom: 6, marginTop: 10 }
  const labelStyle = { fontSize: 8, color: '#94a3b8' }
  const valueStyle = { fontSize: 9, fontWeight: 600, color: '#1e293b', wordBreak: 'break-word' }

  const renderUnlockedProfile = () => {
    if (!selectedCand?.isUnlocked) return null

    const educations = normalizeScoutEducations(selectedCand.educations)
    const workExperiences = normalizeScoutWorkExperiences(selectedCand.workExperiences)
    const certificates = normalizeScoutCertificates(selectedCand.certificates)

    const contactRows = [
      ['Email', selectedCand.email],
      ['SĐT', selectedCand.phone],
      ['Furigana', selectedCand.furigana],
      ['Ngày sinh', formatScoutDate(selectedCand.birthDate)],
      ['Giới tính', formatScoutGender(selectedCand.gender)],
      ['Địa chỉ hiện tại', selectedCand.addressCurrent],
      ['Địa chỉ gốc', selectedCand.addressOrigin],
      ['Mã bưu điện', selectedCand.postalCode],
    ].filter(([, v]) => v && v !== '—')

    const visaRows = [
      ['Tư cách lưu trú', getScoutResidenceStatusLabel(selectedCand.jpResidenceStatus)],
      ['Ngày hết hạn visa', formatScoutDate(selectedCand.visaExpirationDate)],
      ['Nơi cư trú hiện tại', selectedCand.currentResidence],
      ['Quốc gia khác', selectedCand.otherCountry],
      ['Hộ chiếu', formatScoutYesNo(selectedCand.passport)],
    ].filter(([, v]) => v && v !== '—')

    return (
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#047857', marginBottom: 6 }}>
          Hồ sơ đã mở — thông tin đầy đủ
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

        {(selectedCand.currentIncome != null || selectedCand.desiredIncome != null) && (
          <>
            <div style={sectionTitleStyle}>Lương</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div>
                <div style={labelStyle}>Lương hiện tại</div>
                <div style={valueStyle}>{hl(formatScoutIncome(selectedCand.currentIncome))}</div>
              </div>
              <div>
                <div style={labelStyle}>Lương mong muốn</div>
                <div style={valueStyle}>{hl(formatScoutIncome(selectedCand.desiredIncome))}</div>
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

        {selectedCand.motivation && (
          <>
            <div style={sectionTitleStyle}>Động lực</div>
            <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{hl(selectedCand.motivation)}</div>
          </>
        )}
      </div>
    )
  }

  return (
    <>
      <style>{scrollbarStyle}</style>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12, flex: 1, overflow: 'hidden', padding: 12 }}>
          <div className="flex flex-col gap-2 scout-scrollbar" style={{ minHeight: 0, overflowY: 'auto' }}>
            <div className="bg-white rounded-xl border border-slate-100" style={{ padding: 10 }}>
              <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg" style={{ padding: '5px 8px', marginBottom: 8 }}>
                <Search {...ICON_SM} color="#94a3b8" style={{ flexShrink: 0 }} aria-hidden />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Nhập từ khóa (vd: React Developer, Sales...)"
                  className="bg-transparent outline-none w-full"
                  style={{ fontSize: 9, color: '#475569' }}
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 8 }}>
                <button type="button" style={{ fontSize: 9, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'default', padding: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SlidersHorizontal {...ICON_SM} aria-hidden />
                  Credit: {credit} · Mở hồ sơ: {scoutCreditCost} credit
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div style={{ fontSize: 9, fontWeight: 600, color: '#1e293b' }}>
                  {loading ? 'Đang tải...' : `${totalItems.toLocaleString('vi-VN')} ứng viên trên Scout`}
                </div>
                <div style={{ fontSize: 8, color: '#64748b' }}>{companyName || ''}</div>
              </div>
              {error && (
                <div style={{ fontSize: 8, color: '#dc2626', marginTop: 4 }}>{error}</div>
              )}
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} className="scout-scrollbar">
              {loading ? (
                <div className="bg-white rounded-xl border border-slate-100 flex items-center justify-center" style={{ padding: 24, color: '#64748b', fontSize: 10 }}>
                  <Loader2 className="animate-spin mr-2" width={14} height={14} />
                  Đang tải danh sách...
                </div>
              ) : candidates.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 text-center" style={{ padding: 24, color: '#64748b', fontSize: 10 }}>
                  Chưa có hồ sơ nào trên sàn Scout
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {candidates.map((c) => {
                    const { skills: visibleSkills, hiddenCount: more } = getVisibleSkills(c, highlightQuery)
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          border: selectedId === c.id ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                          background: selectedId === c.id ? '#eff6ff' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <AvatarCircle candidate={c} size={36} />
                            {c.isUnlocked && (
                              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#10b981', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <BadgeCheck {...ICON_SM} color="#fff" aria-hidden />
                              </div>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b' }}>{hl(getDisplayName(c))}</div>
                            {c.isUnlocked ? (
                              <>
                                <div style={{ fontSize: 9, color: '#64748b' }}>{hl(c.desiredPosition || c.jobCategory?.name || '—')}</div>
                                <div className="flex items-center flex-wrap gap-x-2 gap-y-1" style={{ marginTop: 4, fontSize: 8, color: '#94a3b8' }}>
                                  <span>{hl(formatExperienceYears(c.experienceYears))}</span>
                                  <span>•</span>
                                  <span>{hl(c.desiredWorkLocation || '—')}</span>
                                </div>
                                <div style={{ fontSize: 8, color: '#1e293b', fontWeight: 600, marginTop: 3 }}>
                                  {hl(c.desiredIncome || '—')}
                                </div>
                              </>
                            ) : null}
                            {getPrSummary(c) && (
                              <div style={{ fontSize: 8, color: '#64748b', marginTop: 4, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {hl(getPrSummary(c))}
                              </div>
                            )}
                            {highlightQuery && Array.isArray(c.searchSnippets) && c.searchSnippets.length > 0 && (
                              <div style={{ fontSize: 8, color: '#475569', marginTop: 4, lineHeight: 1.35, padding: '4px 6px', background: '#fffbeb', borderRadius: 6, border: '1px solid #fde68a' }}>
                                {c.searchSnippets.map((snippet) => (
                                  <div key={snippet}>{hl(snippet)}</div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center flex-wrap gap-1" style={{ marginTop: 4 }}>
                              {visibleSkills.map((skill) => (
                                <span key={skill} style={{ fontSize: 7, fontWeight: 500, color: '#3b82f6', background: '#eff6ff', borderRadius: 10, padding: '1px 5px' }}>
                                  {hl(skill)}
                                </span>
                              ))}
                              {more > 0 && (
                                <span style={{ fontSize: 7, color: '#94a3b8', background: '#f1f5f9', borderRadius: 10, padding: '1px 5px' }}>
                                  +{more}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            <ChevronRight {...ICON_SM} color="#cbd5e1" aria-hidden />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="bg-white rounded-xl border border-slate-100 flex items-center justify-between" style={{ padding: '8px 12px' }}>
                <span style={{ fontSize: 8, color: '#94a3b8' }}>Hiển thị {limit} / trang</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    style={{ width: 18, height: 18, borderRadius: 2, border: '1px solid #e2e8f0', background: 'white', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-label="Trang trước"
                  >
                    <ChevronLeft {...ICON_SM} aria-hidden />
                  </button>
                  {pageNumbers.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 2,
                        background: page === p ? '#3b82f6' : 'white',
                        color: page === p ? 'white' : '#64748b',
                        border: page === p ? 'none' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        fontSize: 8,
                        fontWeight: 600,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  {totalPages > 7 && page < totalPages - 3 && (
                    <>
                      <span style={{ fontSize: 8, color: '#94a3b8' }}>...</span>
                      <button type="button" onClick={() => setPage(totalPages)} style={{ fontSize: 8, color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 2, width: 18, height: 18, background: 'white' }}>
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    style={{ width: 18, height: 18, borderRadius: 2, border: '1px solid #e2e8f0', background: 'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-label="Trang sau"
                  >
                    <ChevronRight {...ICON_SM} aria-hidden />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 scout-scrollbar" style={{ minHeight: 0, overflowY: 'auto' }}>
            {!selectedCand ? (
              <div className="bg-white rounded-xl border border-slate-100 text-center" style={{ padding: 20, fontSize: 10, color: '#94a3b8' }}>
                Chọn ứng viên để xem chi tiết
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl border border-slate-100" style={{ padding: 10 }}>
                  {detailLoading && (
                    <div style={{ fontSize: 8, color: '#64748b', marginBottom: 6 }}>Đang tải chi tiết...</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <AvatarCircle candidate={selectedCand} size={40} />
                      {selectedCand.isUnlocked && (
                        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#10b981', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                          <BadgeCheck {...ICON_SM} color="#fff" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{hl(getDisplayName(selectedCand))}</div>
                      {selectedCand.isUnlocked && (
                        <div style={{ fontSize: 9, color: '#64748b' }}>{hl(selectedCand.desiredPosition || selectedCand.jobCategory?.name || '—')}</div>
                      )}
                    </div>
                    <button type="button" onClick={() => setSelectedId(null)} style={{ width: 18, height: 18, borderRadius: 3, border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Đóng">
                      <X {...ICON_SM} aria-hidden />
                    </button>
                  </div>

                  <div style={{ fontSize: 8, color: '#64748b', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {selectedCand.isUnlocked ? (
                      <>
                        <div>
                          <div style={{ color: '#94a3b8', marginBottom: 1 }}>Kinh nghiệm</div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{hl(formatExperienceYears(selectedCand.experienceYears))}</div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', marginBottom: 1 }}>Địa điểm</div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{hl(selectedCand.desiredWorkLocation || '—')}</div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', marginBottom: 1 }}>Mức lương mong muốn</div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{hl(selectedCand.desiredIncome || '—')}</div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', marginBottom: 1 }}>JLPT / Ngoại ngữ</div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>
                            {hl([selectedCand.jlptLevel, selectedCand.jpConversationLevel, selectedCand.enConversationLevel].filter(Boolean).join(' · ') || '—')}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ gridColumn: '1 / -1', fontSize: 8, color: '#64748b' }}>
                        Chỉ hiển thị PR và kỹ năng. Mở bằng credit để xem đầy đủ thông tin.
                      </div>
                    )}
                  </div>

                  {getPrSummary(selectedCand) && (
                    <div style={{ marginTop: 8, padding: 8, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 4 }}>PR / Giới thiệu</div>
                      <div style={{ fontSize: 8, color: '#475569', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                        {hl(getPrSummary(selectedCand))}
                      </div>
                    </div>
                  )}

                  {getSkillTags(selectedCand).length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 4 }}>Kỹ năng</div>
                      <div className="flex flex-wrap gap-1">
                        {getSkillTags(selectedCand).map((skill) => (
                          <span key={skill} style={{ fontSize: 7, fontWeight: 500, color: '#3b82f6', background: '#eff6ff', borderRadius: 10, padding: '2px 6px' }}>
                            {hl(skill)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {highlightQuery && Array.isArray(selectedCand.searchSnippets) && selectedCand.searchSnippets.length > 0 && (
                    <div style={{ marginTop: 8, padding: 8, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                      <div style={{ fontSize: 8, color: '#92400e', marginBottom: 4, fontWeight: 600 }}>Khớp từ khóa</div>
                      {selectedCand.searchSnippets.map((snippet) => (
                        <div key={snippet} style={{ fontSize: 8, color: '#475569', lineHeight: 1.45 }}>
                          {hl(snippet)}
                        </div>
                      ))}
                    </div>
                  )}

                  {renderUnlockedProfile()}

                  {!selectedCand.isUnlocked && (
                    <div className="bg-indigo-50 rounded-lg" style={{ padding: 8, marginTop: 8, border: '1px solid #e0e7ff' }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: '#4f46e5', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <UserCheck {...ICON_MD} aria-hidden />
                        Thông tin liên hệ đang ẩn
                      </div>
                      <div style={{ fontSize: 8, color: '#4f46e5', lineHeight: 1.3 }}>
                        Bạn chỉ thấy PR và kỹ năng. Dùng credit để xem email, SĐT và thông tin cá nhân đầy đủ.
                      </div>
                    </div>
                  )}
                </div>

                {!selectedCand.isUnlocked && (
                  <div className="bg-white rounded-xl border border-slate-100" style={{ padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                        <Unlock {...ICON_MD} color="#8b5cf6" aria-hidden />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>Mở liên hệ bằng Credit</div>
                        <div style={{ fontSize: 8, color: '#64748b' }}>Credit hiện có: {credit}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{scoutCreditCost}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>credit</div>
                    </div>

                    <button
                      type="button"
                      onClick={handleUnlock}
                      disabled={unlocking || credit < scoutCreditCost}
                      style={{ width: '100%', fontSize: 9, fontWeight: 600, color: 'white', background: unlocking || credit < scoutCreditCost ? '#c4b5fd' : '#8b5cf6', border: 'none', borderRadius: 6, padding: '7px', cursor: unlocking || credit < scoutCreditCost ? 'not-allowed' : 'pointer', marginBottom: 6 }}
                    >
                      {unlocking ? 'Đang mở...' : 'Mở liên hệ ứng viên'}
                    </button>

                    <div style={{ fontSize: 7, color: '#94a3b8', textAlign: 'center' }}>
                      Sau khi mở sẽ hiển thị email, SĐT và thông tin liên hệ
                    </div>
                  </div>
                )}

                {selectedCand.isUnlocked && (
                  <div className="bg-white rounded-xl border border-emerald-100" style={{ padding: 10, background: '#ecfdf5' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Check {...ICON_MD} color="#047857" aria-hidden />
                      {selectedCand.unlockType === 'scout_performance'
                        ? 'Đã mở hồ sơ bằng Scout Performance'
                        : 'Đã mở hồ sơ bằng Scout Credit'}
                    </div>
                  </div>
                )}

                {!selectedCand.isUnlocked && selectedCand.performanceRequest?.status === 'pending' && (
                  <div className="bg-white rounded-xl border border-amber-200" style={{ padding: 10, background: '#fffbeb' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#b45309', marginBottom: 4 }}>
                      Đã gửi yêu cầu Scout Performance
                    </div>
                    <div style={{ fontSize: 8, color: '#92400e', lineHeight: 1.35 }}>
                      Admin/CTV đang xử lý. Bạn sẽ nhận thông báo khi hồ sơ được mở.
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-slate-100" style={{ padding: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                      <Users {...ICON_MD} color="#3b82f6" aria-hidden />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>Scout Performance</div>
                      <div style={{ fontSize: 8, color: '#64748b' }}>Admin/CTV mở hồ sơ — WS tiếp cận ứng viên</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#10b981' }}>20%</div>
                    <div style={{ fontSize: 8, color: '#64748b' }}>phí thành công (chỉ tính khi tuyển thành công)</div>
                  </div>

                  <button
                    type="button"
                    disabled={performanceRequesting || selectedCand.isUnlocked || selectedCand.performanceRequest?.status === 'pending'}
                    onClick={handlePerformanceRequest}
                    style={{
                      width: '100%', fontSize: 9, fontWeight: 600, color: 'white',
                      background: performanceRequesting || selectedCand.isUnlocked || selectedCand.performanceRequest?.status === 'pending' ? '#94a3b8' : '#3b82f6',
                      border: 'none', borderRadius: 6, padding: '7px', cursor: performanceRequesting || selectedCand.isUnlocked || selectedCand.performanceRequest?.status === 'pending' ? 'not-allowed' : 'pointer', marginBottom: 6,
                    }}
                  >
                    {performanceRequesting
                      ? 'Đang gửi...'
                      : selectedCand.performanceRequest?.status === 'pending'
                        ? 'Đã gửi yêu cầu'
                        : 'Gửi yêu cầu Scout Performance'}
                  </button>

                  <div className="flex flex-col" style={{ gap: 3 }}>
                    {[
                      'Không tốn credit',
                      'Admin/CTV duyệt và mở hồ sơ',
                      'Chỉ phát sinh phí khi thành công',
                    ].map((item) => (
                      <div key={item} style={{ fontSize: 7, color: '#10b981', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Check {...ICON_SM} color="#10b981" aria-hidden />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: 'center', paddingTop: 8, borderTop: '1px solid #e2e8f0', marginTop: 'auto' }}>
                  <button type="button" disabled style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8', background: 'none', border: 'none', cursor: 'not-allowed' }}>
                    Lưu ứng viên (sắp ra mắt)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Scout
