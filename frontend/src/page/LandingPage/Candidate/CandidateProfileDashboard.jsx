import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, FileText, Home, User } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import NominationsPageContent from '../../../component/Shared/NominationsPageContent';
import CandidateProfileDetail from './CandidateProfileDetail';
import { useCandidateHeaderAvatar } from '../../../landing/candidates/hooks/useCandidateHeaderAvatar';

const COPY = {
  vi: {
    overview: 'Tổng quan',
    navProfile: 'Hồ sơ của tôi',
    navApplications: 'Đơn ứng tuyển',
    account: 'Tài khoản',
    navHome: 'Trang chủ',
    navGuide: 'Hướng dẫn sử dụng',
  },
  en: {
    overview: 'Overview',
    navProfile: 'My profile',
    navApplications: 'Applications',
    account: 'Account',
    navHome: 'Home',
    navGuide: 'Usage guide',
  },
  ja: {
    overview: '概要',
    navProfile: 'マイプロフィール',
    navApplications: '応募状況',
    account: 'アカウント',
    navHome: 'ホーム',
    navGuide: '使い方ガイド',
  },
};

function displayName(applicant, handle) {
  return (applicant?.name || '').trim() || applicant?.email || '—';
}

function formatHandle(applicant) {
  const email = (applicant?.email || '').trim();
  if (email.includes('@')) {
    return `@${email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 24)}`;
  }
  if (applicant?.id) return `@user-${applicant.id}`;
  return '@candidate';
}

const navBtnClass = (active) =>
  `profile-nav flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
    active ? 'is-active bg-neutral-100 text-neutral-900' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
  }`;

export default function CandidateProfileDashboard({
  applicant,
  myCvId,
  prefix,
  activeSection,
  onSectionChange,
  onEditProfile,
  onOpenGuide,
}) {
  const { language } = useLanguage();
  const t = COPY[language] || COPY.vi;
  const handle = useMemo(() => formatHandle(applicant), [applicant]);
  const name = useMemo(() => displayName(applicant, handle), [applicant, handle]);
  const { avatarUrl, initials } = useCandidateHeaderAvatar(applicant, true, myCvId);

  return (
    <div className="candidate-profile-dashboard w-full">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
        <aside className="profile-side w-full shrink-0 rounded-xl border border-neutral-200 bg-white lg:sticky lg:top-[calc(var(--jobshare-role-bar-height,0px)+100px)] lg:w-[248px] lg:self-start">
          <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="profile-side-avatar shrink-0" />
            ) : (
              <span
                className="profile-side-avatar-fallback flex shrink-0 items-center justify-center bg-[#fce7e9] text-[#ed212f]"
                aria-hidden
              >
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <p className="profile-side-name truncate">{name}</p>
              <p className="profile-side-handle truncate">{handle}</p>
            </div>
          </div>

          <nav className="profile-side-nav space-y-5 p-3" aria-label={t.overview}>
            <div className="profile-side-group">
              <p className="profile-side-label mb-1.5 px-3">{t.overview}</p>
              <div className="profile-side-links space-y-0.5">
                <button
                  type="button"
                  className={navBtnClass(activeSection === 'profile')}
                  onClick={() => onSectionChange('profile')}
                >
                  <User aria-hidden />
                  {t.navProfile}
                </button>
                <button
                  type="button"
                  className={navBtnClass(activeSection === 'applications')}
                  onClick={() => onSectionChange('applications')}
                >
                  <Briefcase aria-hidden />
                  {t.navApplications}
                </button>
              </div>
            </div>
            <div className="profile-side-group">
              <p className="profile-side-label mb-1.5 px-3">{t.account}</p>
              <div className="profile-side-links space-y-0.5">
                <Link to={prefix} className={navBtnClass(false)}>
                  <Home aria-hidden />
                  {t.navHome}
                </Link>
                {typeof onOpenGuide === 'function' ? (
                  <button type="button" className={navBtnClass(false)} onClick={onOpenGuide}>
                    <FileText aria-hidden />
                    {t.navGuide}
                  </button>
                ) : null}
              </div>
            </div>
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          {activeSection === 'applications' ? (
            <div className="candidate-profile-embed wjs-app-surface min-h-[480px] overflow-x-auto rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
              <NominationsPageContent variant="applicant" embeddedPrefix={prefix} />
            </div>
          ) : (
            <div className="candidate-profile-embed wjs-app-surface min-w-0">
              <CandidateProfileDetail
                myCvId={myCvId}
                applicant={applicant}
                onEditProfile={onEditProfile}
                onOpenApplications={() => onSectionChange('applications')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
