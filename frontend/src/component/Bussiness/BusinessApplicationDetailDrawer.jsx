import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, MessageSquare, User, X } from 'lucide-react'
import apiService from '../../services/api'
import NominationChat from '../Chat/NominationChat'
import ScoutCandidateProfilePanel from './ScoutCandidateProfilePanel'
import { isApplicationProfileOnly } from '../../utils/businessApplicationSource'

import { BUSINESS_UI_FONT } from '../../utils/businessUiFont'

const BRAND = '#0077B6'

function resolveInitialDrawerTab(app) {
  if (!app) return 'chat'
  if (isApplicationProfileOnly(app)) return 'profile'
  if (app.canViewFullProfile) return 'profile'
  return 'chat'
}

function getProfilePanelMeta(app) {
  if (app?.sourceType === 'scout_credit') {
    return {
      accessLabel: 'Hồ sơ đầy đủ (Scout Credit)',
      accessLabelColor: BRAND,
      footerNote: null,
    }
  }
  if (app?.sourceType === 'scout_performance') {
    return {
      accessLabel: 'Hồ sơ Scout Performance',
      accessLabelColor: '#f59e0b',
      footerNote: 'Thông tin liên hệ ẩn theo chính sách Scout Performance.',
    }
  }
  return {
    accessLabel: 'Hồ sơ đầy đủ (tiến cử Sàn CTV)',
    accessLabelColor: BRAND,
    footerNote: app?.candidateProfile?.scoutStillLocked
      ? 'Doanh nghiệp xem được hồ sơ nhờ tiến cử Sàn CTV. Trên Scout vẫn hiển thị khóa cho đến khi mở bằng credit.'
      : null,
  }
}

function buildProfileCandidate(app, profile) {
  if (!profile) return null
  return {
    ...profile,
    name: profile.name || app?.candidateName,
    isUnlocked: true,
  }
}

async function hydrateApplicationProfile(app) {
  if (!app?.id) return app
  const needsProfile = isApplicationProfileOnly(app) || app.canViewFullProfile
  if (!needsProfile || app.candidateProfile) {
    return {
      ...app,
      canViewFullProfile: Boolean(app.canViewFullProfile || isApplicationProfileOnly(app)),
    }
  }

  try {
    const cvRes = await apiService.getBusinessApplicationCv(app.id)
    const cv = cvRes?.data?.cv
    if (cvRes?.success && cv) {
      return {
        ...app,
        canViewFullProfile: true,
        candidateProfile: {
          ...cv,
          isUnlocked: true,
        },
      }
    }
  } catch {
    // keep application row data
  }

  return {
    ...app,
    canViewFullProfile: Boolean(app.canViewFullProfile || isApplicationProfileOnly(app)),
  }
}

export default function BusinessApplicationDetailDrawer({
  open,
  application: applicationProp,
  onClose,
  onStatusUpdated,
}) {
  const [selectedApp, setSelectedApp] = useState(applicationProp || null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerTab, setDrawerTab] = useState('chat')

  const profileOnly = useMemo(
    () => isApplicationProfileOnly(selectedApp),
    [selectedApp],
  )

  const showProfileView = profileOnly || Boolean(selectedApp?.canViewFullProfile)
  const showChatTab = !profileOnly && selectedApp?.hasNominationChat !== false

  const profileMeta = useMemo(() => getProfilePanelMeta(selectedApp), [selectedApp])
  const profileCandidate = useMemo(
    () => buildProfileCandidate(selectedApp, selectedApp?.candidateProfile),
    [selectedApp],
  )

  const loadApplicationDetail = useCallback(async (appId) => {
    if (!appId) return
    setDrawerLoading(true)
    try {
      const res = await apiService.getBusinessApplicationById(appId)
      if (res?.success && res.data?.application) {
        const hydrated = await hydrateApplicationProfile(res.data.application)
        setSelectedApp(hydrated)
        setDrawerTab(resolveInitialDrawerTab(hydrated))
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

    let mounted = true
    const boot = async () => {
      setDrawerLoading(true)
      setSelectedApp(applicationProp)
      setDrawerTab(resolveInitialDrawerTab(applicationProp))

      try {
        const res = await apiService.getBusinessApplicationById(applicationProp.id)
        let nextApp = res?.success && res.data?.application
          ? res.data.application
          : applicationProp
        nextApp = await hydrateApplicationProfile(nextApp)
        if (mounted) {
          setSelectedApp(nextApp)
          setDrawerTab(resolveInitialDrawerTab(nextApp))
        }
      } catch {
        if (mounted) {
          const fallback = await hydrateApplicationProfile(applicationProp)
          setSelectedApp(fallback)
          setDrawerTab(resolveInitialDrawerTab(fallback))
        }
      } finally {
        if (mounted) setDrawerLoading(false)
      }
    }

    boot()
    return () => { mounted = false }
  }, [open, applicationProp])

  const handleStatusUpdated = useCallback(() => {
    if (selectedApp?.id) loadApplicationDetail(selectedApp.id)
    onStatusUpdated?.()
  }, [selectedApp?.id, loadApplicationDetail, onStatusUpdated])

  if (!open || !selectedApp) return null

  const activeTab = profileOnly ? 'profile' : drawerTab

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

        {showProfileView && showChatTab && (
          <div className="flex shrink-0 border-b border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setDrawerTab('profile')}
              className={`biz-ui-body flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 font-semibold transition-colors ${
                activeTab === 'profile' ? 'border-[#0077B6] text-[#0077B6]' : 'border-transparent text-slate-500'
              }`}
            >
              <User className="h-3.5 w-3.5" /> Hồ sơ ứng viên
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('chat')}
              className={`biz-ui-body flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 font-semibold transition-colors ${
                activeTab === 'chat' ? 'border-[#0077B6] text-[#0077B6]' : 'border-transparent text-slate-500'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Chat 3 bên
            </button>
          </div>
        )}

        {profileOnly && (
          <div className="biz-ui-caption shrink-0 border-b border-slate-100 bg-slate-50 px-4 py-2 text-slate-600">
            Hồ sơ mở qua {selectedApp.sourceLabel} — không có chat 3 bên trên đơn này.
          </div>
        )}

        {drawerLoading && (
          <div className="biz-ui-caption flex items-center gap-2 border-b border-slate-100 bg-[#e8f4fa]/40 px-4 py-2 text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0077B6]" /> Đang tải hồ sơ...
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {activeTab === 'profile' && showProfileView ? (
            <div className="flex-1 overflow-y-auto p-3 business-homepage-scroll">
              {drawerLoading && !profileCandidate ? (
                <div className="biz-ui-body flex items-center justify-center gap-2 py-12 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-[#0077B6]" /> Đang tải hồ sơ...
                </div>
              ) : (
                <ScoutCandidateProfilePanel
                  candidate={profileCandidate}
                  treatAsUnlocked
                  accessLabel={profileMeta.accessLabel}
                  accessLabelColor={profileMeta.accessLabelColor}
                  footerNote={profileMeta.footerNote}
                />
              )}
            </div>
          ) : showChatTab ? (
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
          ) : (
            <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-xs text-slate-400">
              Không có nội dung hiển thị.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
