import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Download, GraduationCap, MapPin, Pencil, Send } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import apiService from '../../../services/api';
import { formatPhoneForDisplay } from '../../../utils/cvPhoneUtils';
import { formatEducationPeriodJa, formatWorkExperiencePeriodJa } from '../../../utils/cvJapanesePeriod';
import { getJobCategoryDisplayName, getLocalizedDesiredPositionText } from '../../../utils/jobCategoryDisplay';
import { downloadBlobAsFile } from '../../../utils/safeFileDownload';

const COPY = {
  vi: {
    editProfile: 'Sửa hồ sơ',
    downloadCv: 'Tải CV',
    downloading: 'Đang tải…',
    downloadError: 'Không tải được CV. Vui lòng thử lại.',
    personalTitle: 'Thông tin cá nhân',
    activityTitle: 'Tổng quan hoạt động',
    recentTitle: 'Hoạt động gần đây',
    email: 'Email',
    phone: 'Số điện thoại',
    address: 'Địa chỉ',
    birthDate: 'Ngày sinh',
    residence: 'Tư cách lưu trú',
    japanese: 'Trình độ tiếng Nhật',
    desiredRole: 'Vị trí mong muốn',
    desiredSalary: 'Lương mong muốn',
    jobCategory: 'Ngành nghề',
    kana: 'Tên furigana',
    gender: 'Giới tính',
    age: 'Tuổi',
    postalCode: 'Mã bưu điện',
    currentSalary: 'Lương hiện tại',
    desiredLocation: 'Nơi làm việc mong muốn',
    desiredStart: 'Thời điểm có thể vào làm',
    skills: 'Kỹ năng',
    certificates: 'Chứng chỉ',
    educationTitle: 'Học vấn',
    workTitle: 'Kinh nghiệm làm việc',
    summaryTitle: 'Giới thiệu',
    applications: 'Đơn ứng tuyển',
    workHistory: 'Kinh nghiệm',
    education: 'Học vấn',
    experienceMeta: 'Kinh nghiệm',
    emptyActivity: 'Chưa có hoạt động nào.',
    loading: 'Đang tải hồ sơ…',
    loadError: 'Không tải được hồ sơ.',
    years: 'năm',
  },
  en: {
    editProfile: 'Edit profile',
    downloadCv: 'Download CV',
    downloading: 'Downloading…',
    downloadError: 'Could not download the CV. Please try again.',
    personalTitle: 'Personal information',
    activityTitle: 'Activity overview',
    recentTitle: 'Recent activity',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    birthDate: 'Date of birth',
    residence: 'Residence status',
    japanese: 'Japanese level',
    desiredRole: 'Desired position',
    desiredSalary: 'Desired salary',
    jobCategory: 'Job category',
    kana: 'Furigana',
    gender: 'Gender',
    age: 'Age',
    postalCode: 'Postal code',
    currentSalary: 'Current salary',
    desiredLocation: 'Preferred location',
    desiredStart: 'Available to start',
    skills: 'Skills',
    certificates: 'Certificates',
    educationTitle: 'Education',
    workTitle: 'Work experience',
    summaryTitle: 'Introduction',
    applications: 'Applications',
    workHistory: 'Work history',
    education: 'Education',
    experienceMeta: 'Experience',
    emptyActivity: 'No recent activity yet.',
    loading: 'Loading profile…',
    loadError: 'Could not load this profile.',
    years: 'years',
  },
  ja: {
    editProfile: 'プロフィールを編集',
    downloadCv: 'CVをダウンロード',
    downloading: 'ダウンロード中…',
    downloadError: 'CVをダウンロードできませんでした。もう一度お試しください。',
    personalTitle: '個人情報',
    activityTitle: 'アクティビティ',
    recentTitle: '最近の活動',
    email: 'メール',
    phone: '電話番号',
    address: '住所',
    birthDate: '生年月日',
    residence: '在留資格',
    japanese: '日本語レベル',
    desiredRole: '希望職種',
    desiredSalary: '希望年収',
    jobCategory: '職種',
    kana: 'ふりがな',
    gender: '性別',
    age: '年齢',
    postalCode: '郵便番号',
    currentSalary: '現在の年収',
    desiredLocation: '希望勤務地',
    desiredStart: '入社可能時期',
    skills: 'スキル',
    certificates: '資格',
    educationTitle: '学歴',
    workTitle: '職歴',
    summaryTitle: '自己紹介',
    applications: '応募',
    workHistory: '職歴',
    education: '学歴',
    experienceMeta: '経験',
    emptyActivity: '最近の活動はまだありません。',
    loading: 'プロフィールを読み込み中…',
    loadError: 'プロフィールを読み込めませんでした。',
    years: '年',
  },
};

const RESIDENCE = [
  { value: '3', vi: 'Visa du học', en: 'Student visa', ja: '留学' },
  { value: '1', vi: 'Visa kỹ sư / tri thức nhân văn / nghiệp vụ quốc tế', en: 'Engineer / Specialist in Humanities / International Services', ja: '技術・人文知識・国際業務' },
  { value: '2', vi: 'Visa kỹ năng đặc định', en: 'Specified skilled worker', ja: '特定技能' },
  { value: '9', vi: 'Visa kỹ năng', en: 'Skilled worker', ja: '技能' },
  { value: '8', vi: 'Visa lao động trình độ cao', en: 'Highly skilled professional', ja: '高度専門職' },
  { value: '12', vi: 'Visa chuyển công tác nội bộ', en: 'Intra-company transferee', ja: '企業内転勤' },
  { value: '13', vi: 'Visa biểu diễn / giải trí', en: 'Entertainer', ja: '興行' },
  { value: '14', vi: 'Visa thực tập sinh kỹ năng', en: 'Technical intern', ja: '技能実習' },
  { value: '10', vi: 'Visa gia đình', en: 'Dependent visa', ja: '家族滞在' },
  { value: '5', vi: 'Visa vợ/chồng người Nhật', en: 'Spouse or child of Japanese national', ja: '日本人の配偶者等' },
  { value: '15', vi: 'Visa vợ/chồng người vĩnh trú', en: 'Spouse or child of permanent resident', ja: '永住者の配偶者等' },
  { value: '6', vi: 'Visa cư trú dài hạn', en: 'Long-term resident', ja: '定住者' },
  { value: '4', vi: 'Visa vĩnh trú', en: 'Permanent resident', ja: '永住者' },
  { value: '11', vi: 'Visa ngắn hạn', en: 'Temporary visitor', ja: '短期滞在' },
  { value: '7', vi: 'Không yêu cầu', en: 'Not required', ja: '不要' },
];

function pick(language, row) {
  if (language === 'en') return row.en;
  if (language === 'ja') return row.ja;
  return row.vi;
}

function toList(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return toList(JSON.parse(value));
    } catch {
      return [];
    }
  }
  if (typeof value === 'object') {
    const shokumu = Array.isArray(value.shokumu_job_history) ? value.shokumu_job_history : [];
    const rirekisho = Array.isArray(value.rirekisho_work_history) ? value.rirekisho_work_history : [];
    if (shokumu.length || rirekisho.length) return [...shokumu, ...rirekisho];
  }
  return [];
}

function formatBirthDate(value, language) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const locale = language === 'en' ? 'en-US' : language === 'ja' ? 'ja-JP' : 'vi-VN';
  return date.toLocaleDateString(locale);
}

function formatRelative(value, language) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return pick(language, { vi: 'Hôm nay', en: 'Today', ja: '今日' });
  if (days === 1) return pick(language, { vi: 'Hôm qua', en: 'Yesterday', ja: '昨日' });
  if (days < 7) return pick(language, { vi: `${days} ngày trước`, en: `${days} days ago`, ja: `${days}日前` });
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return pick(language, { vi: `${weeks} tuần trước`, en: `${weeks} week${weeks > 1 ? 's' : ''} ago`, ja: `${weeks}週間前` });
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return pick(language, { vi: `${months} tháng trước`, en: `${months} month${months > 1 ? 's' : ''} ago`, ja: `${months}か月前` });
  }
  const years = Math.floor(days / 365);
  return pick(language, { vi: `${years} năm trước`, en: `${years} year${years > 1 ? 's' : ''} ago`, ja: `${years}年前` });
}

function residenceLabel(value, language) {
  const key = String(value ?? '').trim();
  if (!key) return '—';
  const row = RESIDENCE.find((item) => item.value === key);
  return row ? pick(language, row) : key;
}

function japaneseLevel(candidate) {
  const raw = String(candidate?.jpLevel || candidate?.japaneseLevel || candidate?.jlptLevel || '').trim();
  if (!raw) return '—';
  return /^N\d+/i.test(raw) ? raw.toUpperCase() : `N${raw}`;
}

function salaryLabel(candidate) {
  if (candidate?.desiredSalary) return String(candidate.desiredSalary);
  if (candidate?.desiredIncome != null && candidate.desiredIncome !== '') return `${candidate.desiredIncome}万円`;
  return '—';
}

function experienceLabel(candidate, yearsWord) {
  const raw = candidate?.experienceYears || candidate?.yearsOfExperience || candidate?.experienceYear || candidate?.workExperienceYears;
  const text = String(raw ?? '').trim();
  if (!text) return '—';
  if (/年|năm|year/i.test(text)) return text;
  return `${text} ${yearsWord}`;
}

function handleFrom(applicant, email) {
  const source = (email || applicant?.email || '').trim();
  if (source.includes('@')) {
    return `@${source.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 24)}`;
  }
  if (applicant?.id) return `@user-${applicant.id}`;
  return '';
}

function filled(value) {
  const text = String(value ?? '').trim();
  return text && text !== '—' ? text : '';
}

function genderLabel(value, language) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (raw === '1' || raw === '男' || raw.toLowerCase() === 'male') {
    return pick(language, { vi: 'Nam', en: 'Male', ja: '男性' });
  }
  if (raw === '2' || raw === '女' || raw.toLowerCase() === 'female') {
    return pick(language, { vi: 'Nữ', en: 'Female', ja: '女性' });
  }
  return raw;
}

function ageFromBirth(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const month = now.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < date.getDate())) age -= 1;
  return age > 0 && age < 120 ? String(age) : '';
}

function InfoRow({ label, value, href }) {
  const text = filled(value);
  if (!text) return null;
  return (
    <div className="border-b border-neutral-100 py-2.5 last:border-b-0">
      <p className="profile-label">{label}</p>
      {href ? (
        <a href={href} className="profile-value mt-0.5 block break-all hover:text-[#ed212f]">
          {text}
        </a>
      ) : (
        <p className="profile-value mt-0.5 whitespace-pre-wrap break-words">{text}</p>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center rounded-xl border border-neutral-200 px-2 py-3 text-center">
      <span className="text-neutral-500">{icon}</span>
      <p className="profile-stat-label mt-2">{label}</p>
      <p className="profile-stat-value mt-1">{value}</p>
    </div>
  );
}

export default function CandidateProfileDetail({ myCvId, applicant, onEditProfile, onOpenApplications }) {
  const { language } = useLanguage();
  const t = COPY[language] || COPY.vi;
  const [cv, setCv] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!myCvId) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [cvRes, appRes] = await Promise.all([
          apiService.getApplicantMyCVById(myCvId),
          apiService.getApplicantJobApplications({ limit: 8, sortBy: 'applied_at', sortOrder: 'DESC' }).catch(() => null),
        ]);
        if (cancelled) return;
        if (cvRes?.success && cvRes.data?.cv) {
          setCv(cvRes.data.cv);
        } else {
          setCv(null);
          setError(cvRes?.message || t.loadError);
        }
        const rows = appRes?.data?.jobApplications;
        setApplications(Array.isArray(rows) ? rows : []);
      } catch (err) {
        if (!cancelled) {
          setCv(null);
          setError(err?.message || t.loadError);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [myCvId, t.loadError]);

  const workItems = useMemo(() => toList(cv?.workExperiences), [cv]);

  const downloadCv = async () => {
    if (!cv?.id || downloading) return;
    setDownloading(true);
    try {
      const { blob, filename } = await apiService.downloadApplicantCVZip(cv.id, 'template', 'all');
      downloadBlobAsFile(blob, filename || 'cv.zip');
    } catch (err) {
      console.error(err);
      window.alert(t.downloadError);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-neutral-200 bg-white text-sm text-neutral-500">
        {t.loading}
      </div>
    );
  }

  if (!cv) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 text-sm text-neutral-600">
        {error || t.loadError}
      </div>
    );
  }

  const name = (cv.name || cv.fullName || applicant?.name || '').trim() || '—';
  const kana = (cv.furigana || cv.nameKana || cv.name_furigana || '').trim();
  const email = (cv.email || applicant?.email || '').trim();
  const phone = formatPhoneForDisplay(cv.phone);
  const address = (cv.addressCurrent || cv.address || '').trim();
  const location = address || (cv.desiredWorkLocation || cv.desiredLocation || '').trim();
  const role = getLocalizedDesiredPositionText(cv.desiredPosition, language);
  const category = getJobCategoryDisplayName(cv, language);
  const experience = experienceLabel(cv, t.years);
  const handle = handleFrom(applicant, email);
  const skills = (cv.technicalSkills || cv.technical_skills || '').trim();
  const certificateNames = toList(cv.certificates)
    .map((item) => (typeof item === 'string' ? item : item?.name || item?.certificate_name || ''))
    .map((item) => String(item).trim())
    .filter(Boolean);
  const educationItems = toList(cv.educations)
    .map((edu) => {
      const content = edu?.content || [edu?.school_name, edu?.major].filter(Boolean).join(' · ');
      const period = formatEducationPeriodJa(edu);
      return { title: content || '—', time: period && period !== '—' ? period : '' };
    })
    .filter((item) => item.title !== '—');
  const workRows = workItems
    .map((work) => ({
      title: work.company_name || work.companyName || '—',
      time: formatWorkExperiencePeriodJa(work),
      detail: work.description || work.department_role || work.business_purpose || '',
    }))
    .filter((item) => item.title !== '—');
  const summary = [cv.careerSummary, cv.strengths, cv.motivation].map((item) => String(item || '').trim()).filter(Boolean).join('\n\n');
  const currentSalary = cv.currentSalary || (cv.currentIncome != null && cv.currentIncome !== '' ? `${cv.currentIncome}万円` : '');
  const desiredLocation = (cv.desiredWorkLocation || cv.desiredLocation || '').trim();
  const desiredStart = (cv.nyushaTime || cv.desiredStartDate || '').trim();
  const age = ageFromBirth(cv.birthDate);
  const recent = applications.length
    ? applications.slice(0, 8).map((app) => {
        const job = app.job || {};
        const title = (language === 'en' ? job.titleEn || job.title_en : language === 'ja' ? job.titleJp || job.title_jp : job.title || job.titleVi)
          || job.title
          || app.jobTitle
          || '—';
        const company = app.recruitingCompanyName || app.companyName || job.companyName || '';
        return {
          id: app.id,
          title: company ? `${title} · ${company}` : title,
          time: formatRelative(app.appliedAt || app.applied_at || app.createdAt || app.created_at, language),
        };
      })
    : workItems.slice(0, 8).map((work, index) => ({
        id: `work-${index}`,
        title: work.company_name || work.companyName || '—',
        time: formatWorkExperiencePeriodJa(work),
      }));

  return (
    <article className="candidate-profile-detail overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="profile-banner" aria-hidden>
        <div className="absolute inset-0 bg-[#9ec3e4]" />
        <div
          className="absolute inset-x-0 bottom-0 h-[62%] bg-[#6d8798]"
          style={{ clipPath: 'polygon(0 62%, 16% 34%, 30% 52%, 46% 14%, 61% 44%, 76% 10%, 100% 48%, 100% 100%, 0 100%)' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[40%] bg-[#415566]"
          style={{ clipPath: 'polygon(0 72%, 20% 40%, 38% 64%, 55% 26%, 72% 54%, 100% 32%, 100% 100%, 0 100%)' }}
        />
      </div>

      <div className="profile-identity">
        <div className="profile-avatar-slot">
          <ProfileAvatar cv={cv} applicant={applicant} name={name} />
        </div>
        <div className="profile-identity-copy">
          <p className="profile-name">{name}</p>
          {kana ? <p className="profile-handle">{kana}</p> : null}
          {handle ? <p className="profile-handle">{handle}</p> : null}
        </div>
        <div className="profile-actions">
          <button
            type="button"
            onClick={downloadCv}
            disabled={downloading}
            className="profile-edit inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-800 shadow-sm hover:border-neutral-300"
          >
            <Download aria-hidden />
            <span>{downloading ? t.downloading : t.downloadCv}</span>
          </button>
          <button
            type="button"
            onClick={onEditProfile}
            className="profile-edit inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-800 shadow-sm hover:border-neutral-300"
          >
            <Pencil aria-hidden />
            <span>{t.editProfile}</span>
          </button>
        </div>
      </div>

      <div className="profile-meta mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-5">
        {location ? (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin aria-hidden />
            <span>{location}</span>
          </span>
        ) : null}
        <span>
          {t.applications}: {applications.length}
        </span>
        {filled(experience) ? (
          <span>
            {t.experienceMeta}: {experience}
          </span>
        ) : null}
      </div>

      <div className="profile-columns mt-5 grid gap-4 px-4 pb-5 sm:px-5 lg:grid-cols-2">
        <section className="rounded-xl border border-neutral-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="profile-section-title">{t.personalTitle}</p>
            <button type="button" onClick={onEditProfile} className="text-neutral-400 hover:text-neutral-700" aria-label={t.editProfile}>
              <Pencil aria-hidden />
            </button>
          </div>
          <div className="mt-1">
            <InfoRow label={t.kana} value={kana} />
            <InfoRow label={t.gender} value={genderLabel(cv.gender, language)} />
            <InfoRow label={t.email} value={email} href={email ? `mailto:${email}` : ''} />
            <InfoRow label={t.phone} value={phone} href={phone ? `tel:${phone}` : ''} />
            <InfoRow label={t.birthDate} value={cv.birthDate ? formatBirthDate(cv.birthDate, language) : ''} />
            <InfoRow label={t.age} value={age} />
            <InfoRow label={t.postalCode} value={cv.postalCode || cv.postal_code} />
            <InfoRow label={t.address} value={address} />
            <InfoRow
              label={t.residence}
              value={residenceLabel(cv.jpResidenceStatus || cv.residenceStatus || cv.residence_status || cv.visaStatus, language)}
            />
            <InfoRow label={t.japanese} value={japaneseLevel(cv)} />
            <InfoRow label={t.jobCategory} value={category} />
            <InfoRow label={t.desiredRole} value={role} />
            <InfoRow label={t.desiredLocation} value={desiredLocation} />
            <InfoRow label={t.currentSalary} value={currentSalary} />
            <InfoRow label={t.desiredSalary} value={salaryLabel(cv)} />
            <InfoRow label={t.desiredStart} value={desiredStart} />
            <InfoRow label={t.experienceMeta} value={experience} />
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-neutral-200 px-4 py-4">
            <p className="profile-section-title">{t.activityTitle}</p>
            <div className="profile-stats mt-3 flex gap-2">
              <StatCard icon={<Send aria-hidden />} label={t.applications} value={String(applications.length)} />
              <StatCard icon={<Briefcase aria-hidden />} label={t.workHistory} value={String(workRows.length)} />
              <StatCard icon={<GraduationCap aria-hidden />} label={t.education} value={String(educationItems.length)} />
            </div>
          </section>

          {skills || certificateNames.length ? (
            <section className="rounded-xl border border-neutral-200 px-4 py-3">
              <p className="profile-section-title">{t.skills}</p>
              <InfoRow label={t.skills} value={skills} />
              <InfoRow label={t.certificates} value={certificateNames.join(', ')} />
            </section>
          ) : null}

          {educationItems.length ? (
            <RecordList title={t.educationTitle} items={educationItems} />
          ) : null}

          {workRows.length ? (
            <RecordList title={t.workTitle} items={workRows} />
          ) : null}

          {summary ? (
            <section className="rounded-xl border border-neutral-200 px-4 py-3">
              <p className="profile-section-title">{t.summaryTitle}</p>
              <p className="profile-value mt-2 whitespace-pre-wrap">{summary}</p>
            </section>
          ) : null}

          <section className="rounded-xl border border-neutral-200 px-4 py-3">
            <p className="profile-section-title">{t.recentTitle}</p>
            {recent.length === 0 ? (
              <p className="profile-label mt-3">{t.emptyActivity}</p>
            ) : (
              <ul className="mt-1">
                {recent.map((item) => (
                  <li key={item.id} className="border-b border-neutral-100 last:border-b-0">
                    <button
                      type="button"
                      onClick={applications.length && onOpenApplications ? onOpenApplications : undefined}
                      className="profile-record-head flex w-full items-start justify-between gap-3 py-2.5 text-left"
                    >
                      <span className="profile-activity min-w-0">{item.title}</span>
                      <span className="profile-time shrink-0">{item.time}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </article>
  );
}

function RecordList({ title, items }) {
  return (
    <section className="rounded-xl border border-neutral-200 px-4 py-3">
      <p className="profile-section-title">{title}</p>
      <ul className="mt-1">
        {items.map((item, index) => (
          <li key={`${item.title}-${index}`} className="border-b border-neutral-100 py-2.5 last:border-b-0">
            <div className="profile-record-head flex items-start justify-between gap-3">
              <p className="profile-value min-w-0">{item.title}</p>
              {item.time ? <p className="profile-time shrink-0">{item.time}</p> : null}
            </div>
            {item.detail && item.detail !== '—' ? <p className="profile-label mt-1 whitespace-pre-wrap">{item.detail}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProfileAvatar({ cv, applicant, name }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!cv?.id) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const next = await apiService.getApplicantCVFileUrl(cv.id, 'avatarPhoto', 'view');
        if (!cancelled) setUrl(typeof next === 'string' ? next : '');
      } catch {
        if (!cancelled) setUrl('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cv?.id]);

  const initials = (name || applicant?.email || '?').trim().slice(0, 1).toUpperCase();

  return url ? (
    <img
      src={url}
      alt=""
      className="profile-avatar border-4 border-white shadow-sm"
    />
  ) : (
    <span className="profile-avatar-fallback flex items-center justify-center border-4 border-white bg-[#f3f4f6] text-neutral-500 shadow-sm">
      {initials}
    </span>
  );
}
