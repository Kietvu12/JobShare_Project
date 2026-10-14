import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function AboutUsView() {
  const { language } = useLanguage();
  const title = language === 'en' ? 'About Us' : language === 'ja' ? '私たちについて' : 'Về chúng tôi';
  const body =
    language === 'en'
      ? 'Content will be restored from the landing template.'
      : language === 'ja'
        ? 'コンテンツはランディングテンプレートから復元予定です。'
        : 'Nội dung sẽ được khôi phục từ template landing.';

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-4 text-slate-600">{body}</p>
    </div>
  );
}
