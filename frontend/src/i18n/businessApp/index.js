import { commonI18n } from './common.js';
import { homepageExtrasI18n } from './homepageExtras.js';
import { jobsI18n } from './jobs.js';
import { scoutI18n } from './scout.js';
import { billingI18n } from './billing.js';
import { messagesI18n } from './messages.js';
import { applicationsI18n } from './applications.js';
import { jdBuilderI18n } from './jdBuilder.js';
import { candidatesI18n } from './candidates.js';
import { brandingI18n } from './branding.js';

export const BUSINESS_APP_LANGUAGES = [
  { code: 'vi', short: 'VI', label: 'Tiếng Việt' },
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'ja', short: 'JA', label: '日本語' },
];

const baseCopy = {
  vi: {
    layout: {
      language: 'Ngôn ngữ',
      switchLanguage: 'Đổi ngôn ngữ',
    },
    homepage: {
      greeting: (name) => `Xin chào, ${name}`,
      subtitle: 'JobShare giúp doanh nghiệp tìm kiếm, tiếp cận và quản lý ứng viên hiệu quả.',
      suitableFor: 'Phù hợp:',
      openCard: (title) => `Mở ${title}`,
      painPoint: 'Vấn đề',
      solution: 'Giải pháp',
      features: 'Tính năng',
      consultTitle: 'Không chắc giải pháp nào phù hợp?',
      consultBody: 'JobShare tư vấn miễn phí cho doanh nghiệp của bạn.',
      consultCta: 'Nhận tư vấn ngay',
      notifications: 'Thông báo',
      viewAll: 'Xem tất cả',
      noNotifications: 'Không có thông báo.',
      newsInsights: 'Tin tức & Insights',
      quickActions: 'Thao tác nhanh',
      ...homepageExtrasI18n.vi,
    },
    quickActions: {
      createJd: {
        title: 'Tạo JD mới nhanh chóng',
        desc: 'Tạo job description bằng AI trên JobShare',
      },
      scout: {
        title: 'Tìm kiếm ứng viên phù hợp nhất với JD của bạn',
        desc: 'Scout trong kho ứng viên chất lượng',
      },
      wsSupport: {
        title: 'Gửi yêu cầu hỗ trợ tuyển dụng cho Work Station',
        desc: 'Trao đổi & nhờ WS hỗ trợ tuyển dụng',
      },
      guide: {
        title: 'Xem hướng dẫn sử dụng',
        desc: 'Tài liệu và best practice trên nền tảng',
      },
    },
    time: {
      justNow: 'Vừa xong',
      minutesAgo: (n) => `${n} phút trước`,
      hoursAgo: (n) => `${n} giờ trước`,
      daysAgo: (n) => `${n} ngày trước`,
    },
    common: commonI18n.vi,
    jobs: jobsI18n.vi,
    scout: scoutI18n.vi,
    billing: billingI18n.vi,
    messages: messagesI18n.vi,
    applications: applicationsI18n.vi,
    jdBuilder: jdBuilderI18n.vi,
    candidates: candidatesI18n.vi,
    branding: brandingI18n.vi,
  },
  en: {
    layout: {
      language: 'Language',
      switchLanguage: 'Change language',
    },
    homepage: {
      greeting: (name) => `Hello, ${name}`,
      subtitle: 'JobShare helps your company find, engage, and manage candidates efficiently.',
      suitableFor: 'Best for:',
      openCard: (title) => `Open ${title}`,
      painPoint: 'Challenge',
      solution: 'Solution',
      features: 'Features',
      consultTitle: 'Not sure which solution fits?',
      consultBody: 'JobShare offers free consultation for your hiring needs.',
      consultCta: 'Get free consultation',
      notifications: 'Notifications',
      viewAll: 'View all',
      noNotifications: 'No notifications.',
      newsInsights: 'News & Insights',
      quickActions: 'Quick actions',
      ...homepageExtrasI18n.en,
    },
    quickActions: {
      createJd: {
        title: 'Create a new JD quickly',
        desc: 'Build job descriptions with AI on JobShare',
      },
      scout: {
        title: 'Find candidates that match your JD',
        desc: 'Scout from our quality talent pool',
      },
      wsSupport: {
        title: 'Request hiring support from Work Station',
        desc: 'Chat and ask WS for recruitment help',
      },
      guide: {
        title: 'View usage guide',
        desc: 'Docs and best practices on the platform',
      },
    },
    time: {
      justNow: 'Just now',
      minutesAgo: (n) => `${n} min ago`,
      hoursAgo: (n) => `${n} hr ago`,
      daysAgo: (n) => `${n} day${n === 1 ? '' : 's'} ago`,
    },
    common: commonI18n.en,
    jobs: jobsI18n.en,
    scout: scoutI18n.en,
    billing: billingI18n.en,
    messages: messagesI18n.en,
    applications: applicationsI18n.en,
    jdBuilder: jdBuilderI18n.en,
    candidates: candidatesI18n.en,
    branding: brandingI18n.en,
  },
  ja: {
    layout: {
      language: '言語',
      switchLanguage: '言語を変更',
    },
    homepage: {
      greeting: (name) => `${name} さん、こんにちは`,
      subtitle: 'JobShareは採用・候補者管理を効率化するプラットフォームです。',
      suitableFor: 'こんな企業向け:',
      openCard: (title) => `${title}を開く`,
      painPoint: '課題',
      solution: 'ソリューション',
      features: '機能',
      consultTitle: 'どのサービスが最適かお悩みですか？',
      consultBody: 'JobShareが無料でご相談に応じます。',
      consultCta: '無料相談を受ける',
      notifications: '通知',
      viewAll: 'すべて見る',
      noNotifications: '通知はありません。',
      newsInsights: 'ニュース & Insights',
      quickActions: 'クイック操作',
      ...homepageExtrasI18n.ja,
    },
    quickActions: {
      createJd: {
        title: 'JDを素早く作成',
        desc: 'JobShareのAIで求人票を作成',
      },
      scout: {
        title: 'JDに合う候補者を検索',
        desc: '質の高い候補者DBからスカウト',
      },
      wsSupport: {
        title: 'Work Stationに採用支援を依頼',
        desc: 'WSとチャットで採用を相談',
      },
      guide: {
        title: '使い方ガイドを見る',
        desc: 'ドキュメントとベストプラクティス',
      },
    },
    time: {
      justNow: 'たった今',
      minutesAgo: (n) => `${n}分前`,
      hoursAgo: (n) => `${n}時間前`,
      daysAgo: (n) => `${n}日前`,
    },
    common: commonI18n.ja,
    jobs: jobsI18n.ja,
    scout: scoutI18n.ja,
    billing: billingI18n.ja,
    messages: messagesI18n.ja,
    applications: applicationsI18n.ja,
    jdBuilder: jdBuilderI18n.ja,
    candidates: candidatesI18n.ja,
    branding: brandingI18n.ja,
  },
};

export const businessAppI18n = baseCopy;

export function getBusinessAppCopy(language) {
  return businessAppI18n[language] || businessAppI18n.vi;
}

export function formatBusinessRelativeTime(ts, language = 'vi') {
  const t = getBusinessAppCopy(language).time;
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return t.justNow;
  if (mins < 60) return t.minutesAgo(mins);
  if (hours < 24) return t.hoursAgo(hours);
  return t.daysAgo(days);
}

export function getHomepageSolutionCards(language) {
  return getBusinessAppCopy(language).homepage.solutionCards;
}

export function getHomepageNews(language) {
  return getBusinessAppCopy(language).homepage.news;
}

export function formatJobSalary(job, language = 'vi') {
  const c = getBusinessAppCopy(language).common;
  const locale = language === 'ja' ? 'ja-JP' : language === 'en' ? 'en-US' : 'vi-VN';
  const min = job?.salaryMin ?? job?.salary_min;
  const max = job?.salaryMax ?? job?.salary_max;
  const unit = job?.salaryUnit || job?.salary_unit || 'JPY';
  if (min == null && max == null) return c.negotiable;
  if (min != null && max != null) {
    return `${Number(min).toLocaleString(locale)} – ${Number(max).toLocaleString(locale)} ${unit}`;
  }
  if (min != null) return c.salaryFrom(Number(min).toLocaleString(locale), unit);
  return c.salaryTo(Number(max).toLocaleString(locale), unit);
}

export * from './jobs.js';
export * from './scout.js';
export * from './billing.js';
export * from './messages.js';
export * from './applications.js';
export * from './jdBuilder.js';
export * from './branding.js';
export * from './knowledgeHub.js';
export * from './scoutWorkspace.js';
export * from './candidates.js';
