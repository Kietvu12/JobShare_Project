import React from 'react';
import JobShareTemplateLandingPage from '../JobShareTemplateLandingPage';

const seoMeta = {
  vi: {
    title: 'Trở thành Cộng tác viên JobShare | Hoa hồng lên đến 50% | Tuyển dụng kỹ sư Nhật Bản',
    description:
      'Đăng ký làm cộng tác viên Workstation JobShare. Giới thiệu ứng viên, nhận hoa hồng lên đến 50%. Cộng đồng cộng tác viên tuyển dụng kỹ sư Nhật Bản lớn nhất.',
    keywords:
      'cộng tác viên, cộng tác viên JobShare, hoa hồng tuyển dụng, giới thiệu ứng viên, tuyển dụng kỹ sư Nhật, JobShare, collaborator, việc làm Nhật Bản',
    ogTitle: 'Cộng tác viên JobShare | Hoa hồng lên đến 50%',
    ogDesc:
      'Trở thành cộng tác viên JobShare, giới thiệu ứng viên kỹ sư tại Nhật Bản và nhận hoa hồng hấp dẫn.',
  },
  en: {
    title: 'Become a JobShare Collaborator | Up to 50% Commission | Japan Engineer Recruitment',
    description:
      'Join Workstation JobShare as a collaborator. Refer candidates, earn up to 50% commission. The largest collaborator community for engineer recruitment in Japan.',
    keywords:
      'collaborator, JobShare collaborator, recruitment commission, refer candidates, Japan engineer recruitment, JobShare, Japan jobs',
    ogTitle: 'JobShare Collaborator | Earn Up to 50% Commission',
    ogDesc:
      'Become a JobShare collaborator, refer engineering candidates in Japan and earn attractive commissions.',
  },
  ja: {
    title: 'JobShareコラボレーターになる | 報酬最大50% | 日本エンジニア採用',
    description:
      'Workstation JobShareのコラボレーターに登録。候補者を紹介し、最大50%の報酬を獲得。日本最大級のエンジニア採用コラボレーターコミュニティ。',
    keywords:
      'コラボレーター, JobShare, 紹介報酬, 候補者紹介, エンジニア採用, 日本就職, 人材紹介',
    ogTitle: 'JobShareコラボレーター | 報酬最大50%',
    ogDesc:
      'JobShareコラボレーターになり、日本のエンジニア候補者を紹介して魅力的な報酬を獲得しましょう。',
  },
};

export default function Home() {
  return <JobShareTemplateLandingPage templateKey="collaborator-v3" seoMetaByLang={seoMeta} />;
}
