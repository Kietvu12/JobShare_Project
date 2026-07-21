import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronRight, Plus, Loader2, X } from 'lucide-react'
import apiService from '../../services/api'
import NominationChat from '../../component/Chat/NominationChat'
import JobCommissionEditor, { validateCommissionForMarketplace } from '../../component/Bussiness/JobCommissionEditor'
import { isPersistableJobValue } from '../../utils/jobCommissionUi'

const scrollbarStyle = `
  .ctv-scrollbar::-webkit-scrollbar { width: 4px; }
  .ctv-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .ctv-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .ctv-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .ctv-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
`

function formatDateShort(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('vi-VN')
  } catch {
    return '—'
  }
}

function buildCommissionSeedFromJob(job) {
  const rows = Array.isArray(job?.jobValues) ? job.jobValues : [];
  const types = [];
  const valuesByType = {};
  const seenTypes = new Set();
  rows.forEach((jv) => {
    const type = jv?.type || jv?.Type;
    const valueRef = jv?.valueRef || jv?.value_ref || jv?.Value;
    const typeId = type?.id ?? jv?.typeId ?? jv?.type_id;
    if (!typeId) return;
    if (type && !seenTypes.has(typeId)) {
      seenTypes.add(typeId);
      types.push(type);
    }
    if (valueRef?.id) {
      if (!valuesByType[typeId]) valuesByType[typeId] = [];
      if (!valuesByType[typeId].some((v) => v.id === valueRef.id)) {
        valuesByType[typeId].push(valueRef);
      }
    }
  });
  return { types, valuesByType };
}

function CreateListingModal({ open, onClose, onCreated, initialJobId = '' }) {
  const [jobs, setJobs] = useState([])
  const [jobId, setJobId] = useState('')
  const [jobCommissionType, setJobCommissionType] = useState('fixed')
  const [jobValues, setJobValues] = useState([])
  const [commissionSeed, setCommissionSeed] = useState({ types: [], valuesByType: {} })
  const [headcount, setHeadcount] = useState(1)
  const [requirements, setRequirements] = useState('')
  const [recruitmentDeadline, setRecruitmentDeadline] = useState('')
  const [creating, setCreating] = useState(false)
  const [loadingJob, setLoadingJob] = useState(false)

  useEffect(() => {
    if (!open) return
    let mounted = true
    apiService.getBusinessJobs({ page: 1, limit: 50, status: 1 }).then((res) => {
      if (mounted && res?.success) setJobs(res.data?.jobs || res.data?.items || [])
    })
    return () => { mounted = false }
  }, [open])

  useEffect(() => {
    if (!open) return
    setJobId(initialJobId ? String(initialJobId) : '')
    setJobCommissionType('fixed')
    setJobValues([])
    setHeadcount(1)
    setRequirements('')
    setRecruitmentDeadline('')
  }, [open, initialJobId])

  useEffect(() => {
    if (!jobId) {
      setJobCommissionType('fixed')
      setJobValues([])
      setCommissionSeed({ types: [], valuesByType: {} })
      return
    }
    let mounted = true
    setLoadingJob(true)
    apiService.getBusinessJobById(jobId).then((res) => {
      if (!mounted) return
      const job = res?.data?.job || res?.data
      setJobCommissionType(job?.jobCommissionType || job?.job_commission_type || 'fixed')
      setCommissionSeed(buildCommissionSeedFromJob(job))
      const rows = Array.isArray(job?.jobValues) ? job.jobValues : []
      setJobValues(
        rows.length
          ? rows.map((jv) => ({
              typeId: jv.typeId ?? jv.type_id ?? '',
              valueId: jv.valueId ?? jv.value_id ?? '',
              value: jv.value ?? '',
              isRequired: !!jv.isRequired,
              viewOnCollaborator: jv.viewOnCollaborator || jv.view_on_collaborator || '',
            }))
          : [{ typeId: '', valueId: '', value: '', isRequired: false, viewOnCollaborator: '' }],
      )
      if (job?.deadline && !recruitmentDeadline) {
        const d = String(job.deadline).slice(0, 10)
        setRecruitmentDeadline(d)
      }
    }).catch(() => {
      if (mounted) {
        setJobValues([{ typeId: '', valueId: '', value: '', isRequired: false, viewOnCollaborator: '' }])
      }
    }).finally(() => {
      if (mounted) setLoadingJob(false)
    })
    return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  const handleCreate = async (submitAfter) => {
    if (!jobId) { alert('Chọn JD'); return }
    const commissionError = validateCommissionForMarketplace(jobCommissionType, jobValues)
    if (commissionError) { alert(commissionError); return }
    setCreating(true)
    try {
      const res = await apiService.createBusinessCandidateSharingListing({
        jobId: Number(jobId),
        headcount: Number(headcount) || 1,
        requirements: requirements.trim() || null,
        recruitmentDeadline: recruitmentDeadline || null,
        jobCommissionType,
        jobValues: jobValues.filter(isPersistableJobValue).map((jv) => ({
          typeId: jv.typeId ? Number(jv.typeId) : null,
          valueId: jv.valueId ? Number(jv.valueId) : null,
          value: jv.value != null && String(jv.value).trim() !== '' ? String(jv.value).trim() : null,
          isRequired: !!jv.isRequired,
          viewOnCollaborator: jv.viewOnCollaborator || null,
        })),
      })
      if (res?.success && res.data?.listing) {
        if (submitAfter) {
          await apiService.submitBusinessCandidateSharingListing(res.data.listing.id)
        }
        onCreated()
        onClose()
      } else {
        alert(res?.message || 'Tạo thất bại')
      }
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Tạo thất bại')
    } finally {
      setCreating(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-bold">Đưa job lên sàn CTV</h3>
          <button type="button" onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="p-4 space-y-3 text-sm">
          <div>
            <label className="text-xs font-semibold text-slate-600">Chọn JD</label>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm">
              <option value="">-- Chọn việc làm --</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} ({j.jobCode})</option>)}
            </select>
          </div>
          {jobId && (
            loadingJob ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải cài đặt phí...
              </div>
            ) : (
              <JobCommissionEditor
                jobCommissionType={jobCommissionType}
                onCommissionTypeChange={setJobCommissionType}
                jobValues={jobValues}
                onJobValuesChange={setJobValues}
                seedTypes={commissionSeed.types}
                seedValuesByType={commissionSeed.valuesByType}
              />
            )
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-600">Số lượng tuyển</label>
              <input type="number" min={1} value={headcount} onChange={(e) => setHeadcount(e.target.value)} className="w-full mt-1 border rounded-lg px-2 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Hạn tuyển</label>
              <input type="date" value={recruitmentDeadline} onChange={(e) => setRecruitmentDeadline(e.target.value)} className="w-full mt-1 border rounded-lg px-2 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Điều kiện tuyển bổ sung</label>
            <textarea rows={3} value={requirements} onChange={(e) => setRequirements(e.target.value)} className="w-full mt-1 border rounded-lg px-2 py-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <button type="button" onClick={onClose} className="text-xs px-3 py-2 border rounded-lg">Hủy</button>
          <button type="button" disabled={creating} onClick={() => handleCreate(false)} className="text-xs px-3 py-2 border rounded-lg">Lưu nháp</button>
          <button type="button" disabled={creating} onClick={() => handleCreate(true)} className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white">
            {creating ? 'Đang gửi...' : 'Gửi WS duyệt'}
          </button>
        </div>
      </div>
    </div>
  )
}

const statusColor = (s) => {
  if (s === 'Đang chạy') return { bg: '#d1fae5', color: '#059669' }
  if (s === 'Chờ WS duyệt') return { bg: '#fef9c3', color: '#d97706' }
  if (s === 'Tạm dừng') return { bg: '#f1f5f9', color: '#64748b' }
  if (s === 'Đã đóng') return { bg: '#fee2e2', color: '#dc2626' }
  if (s === 'Mới gửi') return { bg: '#dbeafe', color: '#2563eb' }
  if (s === 'Đang xử lý') return { bg: '#ede9fe', color: '#7c3aed' }
  return { bg: '#f1f5f9', color: '#64748b' }
}

const Avatar = ({ id, size = 24, bg = '#e0e7ff', color = '#4f46e5' }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
    {id}
  </div>
)

const VALID_TABS = ['jobs', 'nominations', 'candidates', 'costs']

const CandidateSharing = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlTab = searchParams.get('tab')
  const urlNominationId = searchParams.get('nominationId')
  const urlListingId = searchParams.get('listingId')
  const urlJobId = searchParams.get('jobId')
  const urlCreate = searchParams.get('create')

  const [tab, setTab] = useState(() => (
    urlTab && VALID_TABS.includes(urlTab) ? urlTab : 'jobs'
  ))
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [listings, setListings] = useState([])
  const [nominations, setNominations] = useState([])
  const [settlements, setSettlements] = useState([])
  const [selectedNomination, setSelectedNomination] = useState(null)
  const [showCreate, setShowCreate] = useState(() => urlCreate === '1' || !!urlJobId)
  const [createJobId, setCreateJobId] = useState(() => urlJobId || '')

  useEffect(() => {
    if (urlCreate === '1' || urlJobId) {
      setShowCreate(true)
      if (urlJobId) setCreateJobId(String(urlJobId))
    }
  }, [urlCreate, urlJobId])

  const closeCreateModal = () => {
    setShowCreate(false)
    if (urlCreate || urlJobId) {
      const next = new URLSearchParams(searchParams)
      next.delete('create')
      next.delete('jobId')
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
      const [dashRes, listRes, nomRes, setRes] = await Promise.all([
        apiService.getBusinessCandidateSharingDashboard(),
        apiService.getBusinessCandidateSharingListings({ page: 1, limit: 50 }),
        apiService.getBusinessCandidateSharingNominations(nomParams),
        apiService.getBusinessCandidateSharingSettlements({ page: 1, limit: 5 }),
      ])
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
      { label: 'Job đã đăng sàn', value: s.totalListings ?? 0, change: `${s.activeOnMarket ?? 0} đang chạy`, changeColor: '#64748b', linkLabel: 'Xem tất cả' },
      { label: 'Đơn tiến cử', value: s.totalNominations ?? 0, change: `${s.totalInterests ?? 0} CTV quan tâm`, changeColor: '#10b981', linkLabel: 'Xem chi tiết' },
      { label: 'Ứng viên đang xử lý', value: s.pipelineCandidates ?? 0, change: null, changeColor: '#3b82f6', linkLabel: 'Xem chi tiết' },
      { label: 'Tuyển thành công', value: s.hired ?? 0, change: s.pendingApproval ? `${s.pendingApproval} chờ duyệt` : null, changeColor: '#10b981', linkLabel: 'Xem báo cáo' },
    ]
  }, [stats])

  const jobsData = useMemo(() => listings.map((l) => ({
    id: l.id,
    title: l.job?.title || '—',
    code: l.job?.jobCode || '—',
    ctvPayment: l.feeLabel,
    status: l.statusLabel,
    ctvCount: l.interestCount,
    candidateCount: l.nominationsCount,
    deadline: formatDateShort(l.recruitmentDeadline || l.job?.deadline),
    raw: l,
  })), [listings])

  const nominationsData = useMemo(() => nominations.map((n) => ({
    nominationId: n.id,
    id: (n.candidateName || '?').charAt(0).toUpperCase(),
    name: n.candidateName,
    subName: n.candidateSub ? `(${n.candidateSub})` : '',
    position: n.jobTitle,
    posCode: n.jobCode,
    ctv: n.ctvName,
    rating: n.matchScore,
    date: formatDateShort(n.appliedAt),
    status: n.statusLabel,
    statusCode: n.status,
    cvStorageId: n.cvStorageId,
    raw: n,
  })), [nominations])

  const tabs = [
    { key: 'jobs', label: 'Job trên sàn' },
    { key: 'nominations', label: 'Đơn tiến cử' },
    { key: 'candidates', label: 'Ứng viên' },
    { key: 'costs', label: 'Thanh toán & chia phí' },
  ]

  return (
    <>
      <style>{scrollbarStyle}</style>
      <CreateListingModal
        open={showCreate}
        onClose={closeCreateModal}
        onCreated={loadData}
        initialJobId={createJobId}
      />
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 11 }}>

        {loading ? (
          <div className="flex items-center justify-center flex-1 gap-2 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" /> Đang tải sàn CTV...
          </div>
        ) : (
        <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px 14px 0', background: '#fff' }}>
          <button type="button" onClick={() => setShowCreate(true)} style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: '#3b82f6', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus style={{ width: 10, height: 10 }} /> Đưa job lên sàn
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '7px 14px', background: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          {statCards.map((card, i) => (
            <div key={i} style={{ padding: '7px 10px', background: '#f8fafc', borderRadius: 7, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 8, color: '#64748b', fontWeight: 500, marginBottom: 2 }}>{card.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', lineHeight: 1.1, marginBottom: 2 }}>{card.value}</div>
              {card.change && (
                <div style={{ fontSize: 8, color: card.changeColor, fontWeight: 600, marginBottom: 3 }}>
                  {card.changeColor === '#10b981' ? '↑ ' : ''}{card.change}
                </div>
              )}
              <div style={{ fontSize: 8, color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
                {card.linkLabel} <ChevronRight style={{ width: 8, height: 8 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0, padding: '0 14px' }}>
          <div style={{ display: 'flex', gap: 20 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                fontSize: 10, fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? '#3b82f6' : '#64748b',
                padding: '7px 0', borderBottom: tab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
                background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Two-column layout — each col scrolls independently */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 10, padding: '10px 14px' }}>

          {/* LEFT COLUMN — scrollable */}
          <div className="ctv-scrollbar" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Jobs Table */}
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>Job đang đăng trên sàn</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: '#3b82f6', background: '#eff6ff', borderRadius: 20, padding: '1px 6px' }}>{jobsData.length}</span>
                </div>
                <span style={{ fontSize: 8, color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 5, padding: '2px 7px', cursor: 'pointer' }}>Trạng thái: Tất cả ▾</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 8, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Vị trí tuyển dụng', 'Phí thưởng CTV\n(theo JD)', 'Trạng thái', 'CTV', 'Đơn', 'Hạn tuyển', ''].map((h, i) => (
                        <th key={i} style={{ padding: '6px 10px', textAlign: i >= 2 ? 'center' : 'left', fontWeight: 600, color: '#64748b', whiteSpace: 'pre-line', fontSize: 8 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobsData.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Chưa có job trên sàn. Bấm &quot;Đưa job lên sàn&quot; để bắt đầu.</td></tr>
                    ) : jobsData.map(job => {
                      const sc = statusColor(job.status)
                      return (
                        <tr key={job.id} style={{ borderTop: '1px solid #f1f5f9', background: '#fff' }}>
                          <td style={{ padding: '6px 10px' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 9 }}>{job.title}</div>
                            <div style={{ fontSize: 7, color: '#94a3b8' }}>({job.code})</div>
                          </td>
                          <td style={{ padding: '6px 10px', fontSize: 7, color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{job.ctvPayment}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                            <span style={{ fontSize: 7, fontWeight: 600, color: sc.color, background: sc.bg, borderRadius: 20, padding: '1px 6px', whiteSpace: 'nowrap' }}>{job.status}</span>
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'center', color: '#475569', fontWeight: 600, fontSize: 9 }}>{job.ctvCount ?? '-'}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'center', color: '#475569', fontWeight: 600, fontSize: 9 }}>{job.candidateCount ?? '-'}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'center', color: '#475569', fontSize: 7 }}>{job.deadline}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'center' }} />
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '6px 12px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 8, color: '#3b82f6', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                  Xem tất cả job <ChevronRight style={{ width: 8, height: 8 }} />
                </span>
              </div>
            </div>

            {/* Đơn tiến cử mới */}
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>Đơn tiến cử mới</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#3b82f6', background: '#eff6ff', borderRadius: 20, padding: '1px 6px' }}>{nominationsData.length}</span>
              </div>
              <table style={{ width: '100%', fontSize: 8, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['Ứng viên được tiến cử', 'Vị trí', 'CTV tiến cử', 'Ngày tiến cử', 'Trạng thái', 'Thao tác'].map((h, i) => (
                      <th key={i} style={{ padding: '6px 10px', textAlign: i >= 3 ? 'center' : 'left', fontWeight: 600, color: '#64748b', fontSize: 8 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nominationsData.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Chưa có đơn tiến cử</td></tr>
                  ) : nominationsData.map((n) => {
                    const sc = statusColor(n.status)
                    const sel = String(selectedNomination?.id) === String(n.nominationId)
                    return (
                      <tr
                        key={n.nominationId}
                        style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer', background: sel ? '#f0f7ff' : '#fff' }}
                        onClick={() => setSelectedNomination(n.raw)}
                      >
                        <td style={{ padding: '6px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Avatar id={n.id} size={22} />
                            <div>
                              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 9 }}>{n.name}</div>
                              <div style={{ fontSize: 7, color: '#94a3b8' }}>{n.subName}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 9 }}>{n.position}</div>
                          <div style={{ fontSize: 7, color: '#94a3b8' }}>({n.posCode})</div>
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 9 }}>{n.ctv}</div>
                          <div style={{ fontSize: 7, color: '#f59e0b', fontWeight: 700 }}>{n.rating != null ? `★ ${n.rating}` : ''}</div>
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', color: '#475569', fontSize: 7 }}>{n.date}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                          <span style={{ fontSize: 7, fontWeight: 600, color: sc.color, background: sc.bg, borderRadius: 20, padding: '1px 6px' }}>{n.status}</span>
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }} />
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div style={{ padding: '6px 12px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 8, color: '#3b82f6', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                  Xem tất cả đơn tiến cử <ChevronRight style={{ width: 8, height: 8 }} />
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — scrollable */}
          <div className="ctv-scrollbar" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Trao đổi 3 bên — NominationChat (DN + WS + CTV) */}
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', flexShrink: 0, minHeight: 420, display: 'flex', flexDirection: 'column' }}>
              {selectedNomination ? (
                <NominationChat
                  jobApplicationId={selectedNomination.id}
                  userType="business"
                  currentStatus={selectedNomination.status}
                  introCandidateName={selectedNomination.candidateName || '—'}
                  introJobTitle={selectedNomination.jobTitle || '—'}
                  mobileHeaderName={selectedNomination.candidateName || 'Chat 3 bên'}
                  mobileHeaderAvatar={(selectedNomination.candidateName || '?').charAt(0).toUpperCase()}
                />
              ) : (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 10 }}>
                  Chọn đơn tiến cử để trao đổi với CTV và WS
                </div>
              )}
            </div>

            {/* Thanh toán & chia phí */}
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>Thanh toán & chia phí</span>
                <span style={{ fontSize: 8, color: '#3b82f6', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                  Xem tất cả <ChevronRight style={{ width: 8, height: 8 }} />
                </span>
              </div>
              <div style={{ padding: '10px 12px' }}>
                {settlements.length === 0 ? (
                  <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', padding: 12 }}>Chưa có giao dịch thanh toán</div>
                ) : settlements.slice(0, 1).map((set) => (
                  <div key={set.id}>
                <span style={{ fontSize: 7, fontWeight: 700, color: set.status === 'paid' ? '#059669' : '#d97706', background: set.status === 'paid' ? '#d1fae5' : '#fef3c7', borderRadius: 20, padding: '2px 7px' }}>{set.statusLabel}</span>
                <div style={{ marginTop: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#1e293b' }}>{set.candidateName}</div>
                  <div style={{ fontSize: 7, color: '#64748b' }}>{set.jobTitle} ({set.jobCode})</div>
                </div>
                <div>
                  <div style={{ fontSize: 7, color: '#64748b', fontWeight: 500, marginBottom: 2 }}>Doanh nghiệp trả cho WS</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#1e293b' }}>{Number(set.totalAmountBusiness || 0).toLocaleString('vi-VN')}đ</div>
                </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '6px 12px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 8, color: '#3b82f6', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                  Xem tất cả giao dịch <ChevronRight style={{ width: 8, height: 8 }} />
                </span>
              </div>
            </div>

            {/* Cách hoạt động */}
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>Cách hoạt động</span>
              </div>
              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  'Chọn job (phí thưởng lấy từ JD đã cài)',
                  'Gửi đề xuất cho WS duyệt',
                  'Sau khi WS duyệt — job hiện trên sàn cho CTV',
                  'CTV tiến cử ứng viên',
                  'Tuyển thành công → Thanh toán & chia phí',
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <div style={{ width: 15, height: 15, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: '#3b82f6', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 8, color: '#475569', lineHeight: 1.4 }}>{step}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '6px 12px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 8, color: '#3b82f6', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                  Xem hướng dẫn chi tiết <ChevronRight style={{ width: 8, height: 8 }} />
                </span>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </>
  )
}

export default CandidateSharing