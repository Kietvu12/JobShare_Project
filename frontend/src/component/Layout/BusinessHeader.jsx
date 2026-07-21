import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Bell, Mail, HelpCircle, MoreVertical, LogOut, Settings } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import apiService from '../../services/api';

const I18N = {
  vi: {
    notifications: 'Thông báo',
    messages: 'Tin nhắn',
    help: 'Trợ giúp',
    settings: 'Cài đặt',
    logout: 'Đăng xuất',
  },
  en: {
    notifications: 'Notifications',
    messages: 'Messages',
    help: 'Help',
    settings: 'Settings',
    logout: 'Log Out',
  },
  ja: {
    notifications: '通知',
    messages: 'メッセージ',
    help: 'ヘルプ',
    settings: '設定',
    logout: 'ログアウト',
  },
};

const BusinessHeader = ({ businessUser }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = I18N[language] || I18N.vi;
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const companyDropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  const {
    companyName = '',
    contactName = '',
    contactTitle = '',
    initials = 'B',
    companyInitial = 'B',
  } = businessUser || {};

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
        setCompanyDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await apiService.logoutBusiness();
    } catch {
      // ignore — still clear local session
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    setUserMenuOpen(false);
    navigate('/business/login', { replace: true });
  };

  return (
    <header className="bg-white border-b border-gray-200 px-2 lg:px-4 py-1.5 lg:py-2 flex items-center justify-between sticky top-0 z-40 h-10 lg:h-12">
      {/* Left Section - Company Selector */}
      <div className="relative" ref={companyDropdownRef}>
        <button
          type="button"
          onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
          className="flex items-center gap-1 px-1.5 lg:px-2 py-0.5 rounded-md hover:bg-gray-100 transition-colors text-gray-900 font-semibold text-[11px] lg:text-xs"
        >
          <div className="w-4 h-4 lg:w-5 lg:h-5 bg-blue-600 rounded-sm flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[8px] lg:text-[9px] font-bold">{companyInitial}</span>
          </div>
          <span className="hidden sm:inline max-w-[80px] lg:max-w-none truncate">{companyName || '—'}</span>
          <ChevronDown className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-gray-500 flex-shrink-0" />
        </button>

        {companyDropdownOpen && companyName && (
          <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px] lg:min-w-[180px] z-50">
            <div className="p-1 space-y-0.5">
              <button
                type="button"
                className="w-full text-left px-1.5 lg:px-2 py-1 lg:py-1.5 rounded-md hover:bg-blue-50 text-[10px] lg:text-xs font-medium text-gray-900 flex items-center gap-1.5"
              >
                <div className="w-3.5 h-3.5 lg:w-4 lg:h-4 bg-blue-600 rounded-sm flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[7px] lg:text-[8px] font-bold">{companyInitial}</span>
                </div>
                <span className="truncate">{companyName}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Section - Actions & User */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className="relative p-1 lg:p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          title={t.notifications}
        >
          <Bell className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-gray-600" />
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[7px] font-bold w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-full flex items-center justify-center">
            9
          </span>
        </button>

        <button
          type="button"
          className="relative p-1 lg:p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          title={t.messages}
        >
          <Mail className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-gray-600" />
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[7px] font-bold w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        <button
          type="button"
          className="p-1 lg:p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          title={t.help}
        >
          <HelpCircle className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-gray-600" />
        </button>

        <div className="h-5 lg:h-6 border-l border-gray-300 mx-0.5 lg:mx-1"></div>

        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-0.5 lg:gap-1 px-0.5 lg:px-1 py-0.5 lg:py-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            {contactName ? (
              <div className="h-6 w-6 lg:h-7 lg:w-7 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-[9px] lg:text-xs font-bold flex-shrink-0">
                {initials}
              </div>
            ) : (
              <div className="h-6 w-6 lg:h-7 lg:w-7 bg-slate-200 rounded-full flex-shrink-0" />
            )}
            <div className="text-left hidden sm:block min-w-0">
              <p className="text-[9px] lg:text-xs font-semibold text-gray-900 truncate">{contactName || '—'}</p>
              <p className="text-[8px] lg:text-[9px] text-gray-600 truncate">{contactTitle || '—'}</p>
            </div>
            <MoreVertical className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-gray-500 flex-shrink-0" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[140px] lg:min-w-[160px] z-50">
              <div className="p-1 space-y-0.5">
                <div className="px-1.5 lg:px-2 py-1 lg:py-1.5 border-b border-gray-200">
                  <p className="text-[9px] lg:text-xs font-semibold text-gray-900 truncate">{contactName || '—'}</p>
                  <p className="text-[8px] lg:text-[9px] text-gray-600 truncate">{contactTitle || '—'}</p>
                </div>

                <button
                  type="button"
                  className="w-full text-left px-1.5 lg:px-2 py-1 lg:py-1.5 rounded-md hover:bg-gray-50 text-[9px] lg:text-xs text-gray-700 flex items-center gap-1"
                >
                  <Settings className="h-3 w-3 lg:h-3.5 lg:w-3.5 flex-shrink-0" />
                  <span className="truncate">{t.settings}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-1.5 lg:px-2 py-1 lg:py-1.5 rounded-md hover:bg-gray-50 text-[9px] lg:text-xs text-red-600 flex items-center gap-1"
                >
                  <LogOut className="h-3 w-3 lg:h-3.5 lg:w-3.5 flex-shrink-0" />
                  <span className="truncate">{t.logout}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default BusinessHeader;
