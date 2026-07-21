import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { resolveCandidatePrefix, switchLocaleInPathname } from '../../../utils/localeRoutes';
import logoImage from '../../../assets/Login_files/logo-removebg-preview-C0FMBBYQ.png';
import { AUTH_FONT } from './CandidateAuthFormUi';

const languages = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

/**
 * Khung đăng nhập/đăng ký ứng viên — đồng bộ bố cục & màu với LoginPage.jsx
 */
export default function CandidateAuthShell({ formTitle, formSubtitle, leftLinks, children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const candidatePrefix = useMemo(() => resolveCandidatePrefix(pathname), [pathname]);

  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [isLanguageButtonHovered, setIsLanguageButtonHovered] = useState(false);
  const [hoveredLanguageItem, setHoveredLanguageItem] = useState(null);
  const languageMenuRef = useRef(null);

  const backHomeText =
    language === 'en' ? 'Back to home' : language === 'ja' ? 'ホームに戻る' : 'Quay lại trang chủ';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setShowLanguageMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    navigate(switchLocaleInPathname(pathname, lang));
    setShowLanguageMenu(false);
  };

  const activeLang = languages.find((lang) => lang.code === language);

  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center relative py-8"
      style={{ fontFamily: AUTH_FONT }}
    >
      <div className="fixed top-6 left-6 z-50">
        <div className="relative" ref={languageMenuRef}>
          <button
            type="button"
            onClick={() => setShowLanguageMenu((v) => !v)}
            onMouseEnter={() => setIsLanguageButtonHovered(true)}
            onMouseLeave={() => setIsLanguageButtonHovered(false)}
            className="border-2 rounded-lg px-4 py-2 flex items-center gap-2 shadow-md transition-colors"
            style={{
              fontFamily: AUTH_FONT,
              backgroundColor: isLanguageButtonHovered ? '#dc2626' : 'white',
              borderColor: '#dc2626',
            }}
          >
            <Globe
              className="text-xl transition-colors"
              style={{ color: isLanguageButtonHovered ? 'white' : '#1f2937' }}
            />
            <span
              className="text-sm font-medium transition-colors"
              style={{ color: isLanguageButtonHovered ? 'white' : '#1f2937' }}
            >
              {activeLang?.flag} {activeLang?.name}
            </span>
          </button>
          {showLanguageMenu && (
            <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  onMouseEnter={() => setHoveredLanguageItem(lang.code)}
                  onMouseLeave={() => setHoveredLanguageItem(null)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left transition-colors"
                  style={{
                    backgroundColor:
                      hoveredLanguageItem === lang.code
                        ? '#f9fafb'
                        : language === lang.code
                          ? '#fef2f2'
                          : 'transparent',
                    color: language === lang.code ? '#dc2626' : '#374151',
                  }}
                >
                  <span>{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.name}</span>
                  {language === lang.code && <span className="ml-auto text-red-600">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-5xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-black">
        <div className="flex flex-col lg:flex-row">
          <div
            className="bg-white p-8 lg:p-12 flex flex-col justify-center items-center lg:items-start lg:w-2/5 relative"
            style={{ fontFamily: AUTH_FONT }}
          >
            <Link
              to={candidatePrefix}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors mb-6 w-full justify-center lg:justify-start no-underline"
              style={{ fontFamily: AUTH_FONT }}
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              {backHomeText}
            </Link>

            <div className="mb-8 lg:mb-12 w-full">
              <div className="flex justify-center lg:justify-start mb-8">
                <img
                  alt="JobShare Logo"
                  className="h-20 lg:h-24 w-auto object-contain"
                  src={logoImage}
                />
              </div>
            </div>

            {leftLinks ? (
              <div className="space-y-3 w-full mt-auto">{leftLinks}</div>
            ) : null}
          </div>

          <div className="bg-white p-8 lg:p-12 flex-1 lg:w-3/5" style={{ fontFamily: AUTH_FONT }}>
            <div className="max-w-md mx-auto lg:mx-0">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2" style={{ fontFamily: AUTH_FONT }}>
                  {formTitle}
                </h2>
                {formSubtitle ? (
                  <p className="text-sm text-gray-500" style={{ fontFamily: AUTH_FONT }}>
                    {formSubtitle}
                  </p>
                ) : null}
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
