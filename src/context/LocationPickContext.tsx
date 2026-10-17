import { createContext, useCallback, useContext, useMemo, useRef } from 'react';

import { Coordinate } from '@/components/LocationPicker';

export interface LocationPickRequest {
  /** Kezdeti pont, ahova a térkép pozicionál (null = alapértelmezett nézet) */
  initial: Coordinate | null;
  /** A kijelölt pont átadása a kérés indítójának */
  onPicked: (_coordinate: Coordinate) => void;
}

interface LocationPickContextValue {
  setRequest: (_request: LocationPickRequest | null) => void;
  getRequest: () => LocationPickRequest | null;
}

const LocationPickContext = createContext<LocationPickContextValue | null>(null);

/**
 * Átadja a térképes pontválasztó képernyőnek a kezdeti koordinátát,
 * és visszacsatolja a kiválasztott pontot a kérés indítójához.
 *
 * Ref-et használ state helyett: a kérés nem jelenik meg a felületen,
 * így nincs szükség újrarenderelésre.
 */
export function LocationPickProvider({ children }: { children: React.ReactNode }) {
  const requestRef = useRef<LocationPickRequest | null>(null);

  const setRequest = useCallback((request: LocationPickRequest | null) => {
    requestRef.current = request;
  }, []);

  const getRequest = useCallback(() => requestRef.current, []);

  const value = useMemo(() => ({ setRequest, getRequest }), [setRequest, getRequest]);

  return <LocationPickContext.Provider value={value}>{children}</LocationPickContext.Provider>;
}

export function useLocationPick(): LocationPickContextValue {
  const ctx = useContext(LocationPickContext);
  if (!ctx) {
    throw new Error('useLocationPick must be used within a LocationPickProvider');
  }
  return ctx;
}
