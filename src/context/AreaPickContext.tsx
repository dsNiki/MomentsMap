import { createContext, useCallback, useContext, useMemo, useRef } from 'react';

import { Coordinate } from '@/services/geoService';

export interface AreaPickRequest {
  initial: Coordinate[] | null;
  onPicked: (_polygon: Coordinate[]) => void;
}

interface AreaPickContextValue {
  setRequest: (_request: AreaPickRequest | null) => void;
  getRequest: () => AreaPickRequest | null;
}

const AreaPickContext = createContext<AreaPickContextValue | null>(null);

export function AreaPickProvider({ children }: { children: React.ReactNode }) {
  const requestRef = useRef<AreaPickRequest | null>(null);

  const setRequest = useCallback((request: AreaPickRequest | null) => {
    requestRef.current = request;
  }, []);

  const getRequest = useCallback(() => requestRef.current, []);

  const value = useMemo(() => ({ setRequest, getRequest }), [setRequest, getRequest]);

  return <AreaPickContext.Provider value={value}>{children}</AreaPickContext.Provider>;
}

export function useAreaPick(): AreaPickContextValue {
  const ctx = useContext(AreaPickContext);
  if (!ctx) {
    throw new Error('useAreaPick must be used within a AreaPickProvider');
  }
  return ctx;
}
