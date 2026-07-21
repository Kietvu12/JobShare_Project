import { useEffect, useMemo, useState } from 'react';
import apiService from '../services/api';
import { useLanguage } from '../context/LanguageContext';

function readStoredBusinessUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function pickLocalized(user, base, language) {
  if (!user) return '';
  const vi = user[base];
  if (language === 'en') return user[`${base}En`] || vi || '';
  if (language === 'ja') return user[`${base}Jp`] || vi || '';
  return vi || '';
}

export function getNameInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'B';
  return parts
    .slice(-2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function useBusinessUser() {
  const { language } = useLanguage();
  const [user, setUser] = useState(() => readStoredBusinessUser());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
      if (!token || userType !== 'business') return;

      try {
        const res = await apiService.getBusinessProfile();
        if (mounted && res?.data?.business) {
          setUser(res.data.business);
          localStorage.setItem('user', JSON.stringify(res.data.business));
        }
      } catch {
        const stored = readStoredBusinessUser();
        if (mounted && stored) setUser(stored);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const display = useMemo(() => {
    const companyName = pickLocalized(user, 'companyName', language) || user?.companyName || '';
    const contactName = pickLocalized(user, 'contactName', language) || user?.contactName || '';
    const contactTitle = pickLocalized(user, 'contactTitle', language) || user?.contactTitle || '';
    return {
      companyName,
      contactName,
      contactTitle,
      email: user?.email || user?.contactEmail || '',
      credit: Number(user?.credit) || 0,
      initials: getNameInitials(contactName),
      companyInitial: (companyName.charAt(0) || 'B').toUpperCase(),
    };
  }, [user, language]);

  return { user, ...display };
}

export default useBusinessUser;
