import { useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../../../../context/LanguageContext';
import contentVi from '../../../../../../assets/JobShare_Business_Price_V6/integration/content-vi.html?raw';
import './jobshare-business-v6.css';
import './jobshare-business-v6.js';

const META = {
  title: 'JobShare Business | Tuyển đúng nhân sự. Chủ động cách tuyển.',
  description:
    'Nền tảng tuyển dụng nhân sự Đông Nam Á dành cho doanh nghiệp Nhật. Tự tìm ứng viên, giao Workstation hỗ trợ hoặc nhận tiến cử từ mạng lưới tuyển dụng — cùng quản lý trên JobShare Business.',
};

function measureHostHeaderOffset() {
  const header = document.querySelector('.header');
  if (!header) return 120;
  return Math.ceil(header.getBoundingClientRect().height);
}

export default function JobShareBusinessV6() {
  const containerRef = useRef(null);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const registerHref = useMemo(() => `/business/register?lang=${language}`, [language]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = META.title;
  }, []);

  useEffect(() => {
    const root = containerRef.current?.querySelector('.jsb6');
    if (!root || !window.JobShareBusinessV6?.init) return undefined;

    const headerOffset = measureHostHeaderOffset();
    const cleanup = window.JobShareBusinessV6.init(root, {
      headerOffset,
      registerHref,
      onRegister: () => navigate(registerHref),
    });

    const onResize = () => {
      root.style.setProperty('--host-header-offset', `${measureHostHeaderOffset()}px`);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (typeof cleanup === 'function') cleanup();
    };
  }, [navigate, registerHref]);

  return (
    <article
      className="jobshare-business-v6-root"
      style={{ width: '100%', maxWidth: 'none', margin: 0, padding: 0, overflow: 'hidden' }}
    >
      <Helmet>
        <title>{META.title}</title>
        <meta name="description" content={META.description} />
      </Helmet>
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: contentVi }} />
    </article>
  );
}
