import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';

const CollaboratorChromeContext = createContext(null);

export function CollaboratorChromeProvider({ children }) {
  const contactRef = useRef(null);

  const openContact = useCallback(() => {
    contactRef.current?.showModal?.();
  }, []);

  const value = useMemo(() => ({ openContact, contactRef }), [openContact]);

  return <CollaboratorChromeContext.Provider value={value}>{children}</CollaboratorChromeContext.Provider>;
}

export function useCollaboratorChrome() {
  const ctx = useContext(CollaboratorChromeContext);
  if (!ctx) throw new Error('useCollaboratorChrome must be used within CollaboratorChromeProvider');
  return ctx;
}
