import { useEffect, useMemo, useState } from 'react';
import apiService from '../../../services/api';

function initialsFromApplicant(applicant) {
  const raw = (applicant?.name || applicant?.email || '?').trim();
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
  }
  return raw.slice(0, 2).toUpperCase();
}

/** Ảnh đại diện từ CV mới nhất (nếu có), fallback chữ cái từ tên ứng viên. */
export function useCandidateHeaderAvatar(applicant, isAuthenticated, refreshKey = '') {
  const [avatarUrl, setAvatarUrl] = useState(null);

  const initials = useMemo(() => initialsFromApplicant(applicant), [applicant]);

  useEffect(() => {
    if (!isAuthenticated || !applicant?.id) {
      setAvatarUrl(null);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await apiService.getApplicantMyCVs();
        const cvs = res?.data?.cvs;
        if (cancelled || !Array.isArray(cvs) || cvs.length === 0) {
          if (!cancelled) setAvatarUrl(null);
          return;
        }
        const sorted = [...cvs].sort((a, b) => Number(b.id) - Number(a.id));
        const cvId = sorted[0]?.id;
        if (!cvId) {
          setAvatarUrl(null);
          return;
        }
        const url = await apiService.getApplicantCVFileUrl(cvId, 'avatarPhoto', 'view');
        if (!cancelled) setAvatarUrl(typeof url === 'string' && url ? url : null);
      } catch {
        if (!cancelled) setAvatarUrl(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, applicant?.id, refreshKey]);

  return { avatarUrl, initials };
}
