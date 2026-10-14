import React, { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveBusinessLandingBase } from './businessLandingBase';

const BusinessLandingContext = createContext({ basePath: '/landing/business' });

export function BusinessLandingProvider({ children, basePath }) {
  const value = useMemo(() => ({ basePath }), [basePath]);
  return (
    <BusinessLandingContext.Provider value={value}>
      {children}
    </BusinessLandingContext.Provider>
  );
}

export function useBusinessLandingBase() {
  return useContext(BusinessLandingContext).basePath;
}

export function useResolvedBusinessLandingBase() {
  const { pathname } = useLocation();
  return resolveBusinessLandingBase(pathname);
}
