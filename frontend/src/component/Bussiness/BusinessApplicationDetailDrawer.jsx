import React, { useCallback, useEffect, useState } from 'react'
import { Loader2, MessageSquare, User, X } from 'lucide-react'
import apiService from '../../services/api'
import NominationChat from '../Chat/NominationChat'
import ScoutCandidateProfilePanel from './ScoutCandidateProfilePanel'

import { BUSINESS_UI_FONT } from '../../utils/businessUiFont'

const BRAND = '#0077B6'

export default function BusinessApplicationDetailDrawer({
  open,
  application: applicationProp,
  onClose,
  onStatusUpdated,
}) {
  const [selectedApp, setSelectedApp] = useState(applicationProp || null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerTab, setDrawerTab] = useState('chat')

  const loadApplicationDetail = useCallback(async (appId) => {
    if (!appId) return
    setDrawerLoading(true)
    try {
      const res = await apiService.getBusinessApplicationById(appId)
      if (res?.success && res.data?.application) {
        setSelectedApp(res.data.application)
        setDrawerTab(res.data.application.canViewFullProfile ? 'profile' : 'chat')
      }
    } catch {
      // keep list row data
    } finally {
      setDrawerLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open || !applicationProp?.id) {
      if (!open) {
        setSelectedApp(null)
        setDrawerTab('chat')
      }
      return
    }
    setSelectedApp(applicationProp)
    setDrawerTab(
      applicationProp.canViewFullProfile || applicationProp.sourceType === 'ctv_marketplace'
        ? 'profile'
        : 'chat',
    )
    loadApplicationDetail(applicationProp.id)
  }, [open, applicationProp, loadApplicationDetail])

  const handleStatusUpdated = useCallback(() => {
    if (selectedApp?.id) loadApplicationDetail(selectedApp.id)
    onStatusUpdated?.()
  }, [selectedApp?.id, loadApplicationDetail, onStatusUpdated])

  if (!open || !selectedApp) return null

  return (
    <div
      className="fixed inset-0 z-50 flex bg-slate-900/40 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="business-app-ui ml-auto flex h-full flex-col border-l border-slate-200 bg-white shadow-2xl"
        style={{ width: 'min(100vw, 560px)', fontFamily: BUSINESS_UI_FONT }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-[#f4f6f8]/50 px-4 py-3">
          <div>
            <div className="biz-ui-body font-bold text-slate-800">{selectedApp.candidateName}</div>
            <div className="biz-ui-caption mt-0.5 text-slate-500">
              {selectedApp.jobTitle} ({selectedApp.jobCode || '—'}) · {selectedApp.sourceLabel}
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {selectedApp.canViewFullProfile && (
          <div className="flex shrink-0 border-b border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setDrawerTab('profile')}
              className={`biz-ui-body flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 font-semibold transition-colors ${
                drawerTab === 'profile' ? 'border-[#0077B6] text-[#0077B6]' : 'border-transparent text-slate-500'
              }`}
            >
              <User className="h-3.5 w-3.5" /> Hồ sơ ứng viên
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('chat')}
              className={`biz-ui-body flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 font-semibold transition-colors ${
                drawerTab === 'chat' ? 'border-[#0077B6] text-[#0077B6]' : 'border-transparent text-slate-500'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Chat 3 bên
            </button>
          </div>
        )}

        {drawerLoading && (
          <div className="biz-ui-caption flex items-center gap-2 border-b border-slate-100 bg-[#e8f4fa]/40 px-4 py-2 text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0077B6]" /> Đang tải hồ sơ...
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {drawerTab === 'profile' && selectedApp.canViewFullProfile ? (
            <div className="flex-1 overflow-y-auto p-3 business-homepage-scroll">
              {drawerLoading && !selectedApp.candidateProfile ? (
                <div className="biz-ui-body flex items-center justify-center gap-2 py-12 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-[#0077B6]" /> Đang tải hồ sơ...
                </div>
              ) : (
                <ScoutCandidateProfilePanel
                  candidate={selectedApp.candidateProfile ? {
                    ...selectedApp.candidateProfile,
                    name: selectedApp.candidateProfile.name || selectedApp.candidateName,
                    isUnlocked: true,
                  } : null}
                  treatAsUnlocked
                  accessLabel="Hồ sơ đầy đủ (tiến cử Sàn CTV)"
                  accessLabelColor={BRAND}
                  footerNote={selectedApp.candidateProfile?.scoutStillLocked
                    ? 'Doanh nghiệp xem được hồ sơ nhờ tiến cử Sàn CTV. Trên Scout vẫn hiển thị khóa cho đến khi mở bằng credit.'
                    : null}
                />
              )}
            </div>
          ) : (
            <NominationChat
              jobApplicationId={selectedApp.id}
              userType="business"
              currentStatus={selectedApp.status}
              cvStorageId={selectedApp.cvStorageId || selectedApp.cvId || null}
              introCandidateName={selectedApp.candidateName || '—'}
              introJobTitle={selectedApp.jobTitle || '—'}
              mobileHeaderName={selectedApp.candidateName || 'Chat 3 bên'}
              mobileHeaderAvatar={(selectedApp.candidateName || '?').charAt(0).toUpperCase()}
              onStatusUpdated={handleStatusUpdated}
            />
          )}
        </div>
      </div>
    </div>
  )
}
