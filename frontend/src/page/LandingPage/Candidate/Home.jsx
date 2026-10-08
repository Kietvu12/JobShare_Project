import React from 'react';
import JobShareTemplateLandingPage from '../JobShareTemplateLandingPage';

const seoMeta = {
  vi: {
    title: 'Tìm việc kỹ sư tại Nhật Bản | Workstation JobShare - Tạo CV bằng AI',
    description:
      'Nền tảng tuyển dụng thông minh cho người nước ngoài tại Nhật Bản. Tìm việc làm kỹ sư, tạo CV chuẩn Nhật bằng AI, theo dõi ứng tuyển minh bạch. Hoàn toàn miễn phí!',
    keywords:
      'việc làm Nhật Bản, tuyển dụng kỹ sư, tìm việc Nhật, CV AI, hồ sơ ứng viên, JobShare, việc làm kỹ sư Nhật Bản, tạo CV chuẩn Nhật',
    ogTitle: 'Workstation JobShare | Tìm việc kỹ sư tại Nhật Bản',
    ogDesc:
      'Nền tảng kết nối việc làm kỹ sư Nhật Bản. Tạo CV chuẩn bằng AI, theo dõi ứng tuyển minh bạch.',
  },
  en: {
    title: 'Engineering Jobs in Japan | Workstation JobShare - AI-Powered CV Builder',
    description:
      'Smart recruitment platform for foreign nationals in Japan. Find engineering jobs, build Japan-standard CVs with AI, and track your applications transparently. Completely free!',
    keywords:
      'Japan jobs, engineering jobs Japan, job search Japan, AI CV builder, JobShare, recruitment platform, foreign workers Japan',
    ogTitle: 'Workstation JobShare | Engineering Jobs in Japan',
    ogDesc:
      'Find engineering jobs in Japan and build professional CVs with AI. Free job matching platform for foreign nationals.',
  },
  ja: {
    title: '日本のエンジニア求人 | Workstation JobShare - AIで履歴書作成',
    description:
      '外国人向けスマート採用プラットフォーム。日本のエンジニア求人検索、AI履歴書作成、応募状況の透明な管理。完全無料！',
    keywords:
      'エンジニア求人, 日本就職, 外国人求人, AI履歴書, JobShare, 求人検索, 日本で働く, 履歴書作成',
    ogTitle: 'Workstation JobShare | 日本のエンジニア求人プラットフォーム',
    ogDesc:
      '日本のエンジニア求人を検索し、AIでプロ品質の履歴書を作成。外国人向け無料求人マッチング。',
  },
};

export default function Home() {
  return <JobShareTemplateLandingPage templateKey="candidate-v1_1" seoMetaByLang={seoMeta} />;
}
