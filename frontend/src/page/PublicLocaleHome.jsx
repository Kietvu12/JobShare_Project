import React from 'react';
import { Link, useParams } from 'react-router-dom';

/** Tạm thời sau khi gỡ shell React landing — chỉ giữ template nguồn. */
export default function PublicLocaleHome() {
  const { lang = 'vi' } = useParams();
  const copy =
    lang === 'en'
      ? {
          title: 'Workstation JobShare',
          body: 'Public marketing pages are being rebuilt from design templates.',
          login: 'Log in',
          register: 'Sign up',
          business: 'For companies',
        }
      : lang === 'ja'
        ? {
            title: 'Workstation JobShare',
            body: '公開マーケティングページはデザインテンプレートから再構築中です。',
            login: 'ログイン',
            register: '登録',
            business: '企業の方',
          }
        : {
            title: 'Workstation JobShare',
            body: 'Trang marketing public đang được tái triển khai từ template thiết kế.',
            login: 'Đăng nhập',
            register: 'Đăng ký',
            business: 'Doanh nghiệp',
          };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-white px-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-slate-900">{copy.title}</h1>
      <p className="max-w-md text-sm text-slate-600">{copy.body}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/login" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
          {copy.login}
        </Link>
        <Link to="/register" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          {copy.register}
        </Link>
        <Link to="/business/login" className="text-sm font-semibold text-red-600 underline-offset-2 hover:underline">
          {copy.business}
        </Link>
      </div>
    </div>
  );
}
