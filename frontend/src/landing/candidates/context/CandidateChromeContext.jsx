import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';

const CandidateChromeContext = createContext(null);

export function CandidateChromeProvider({ children }) {
  const contactRef = useRef(null);

  const openContact = useCallback(() => {
    contactRef.current?.showModal?.();
  }, []);

  const value = useMemo(() => ({ openContact, contactRef }), [openContact]);

  return <CandidateChromeContext.Provider value={value}>{children}</CandidateChromeContext.Provider>;
}

export function useCandidateChrome() {
  const ctx = useContext(CandidateChromeContext);
  if (!ctx) throw new Error('useCandidateChrome must be used within CandidateChromeProvider');
  return ctx;
}
