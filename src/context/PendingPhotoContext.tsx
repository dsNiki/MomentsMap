import { createContext, useContext, useState } from 'react';

export interface PendingPhoto {
  uri: string;
  width: number;
  height: number;
}

interface PendingPhotoContextValue {
  pendingPhoto: PendingPhoto | null;
  setPendingPhoto: (_photo: PendingPhoto | null) => void;
}

const PendingPhotoContext = createContext<PendingPhotoContextValue | null>(null);

export { PendingPhotoContext };

export function PendingPhotoProvider({ children }: { children: React.ReactNode }) {
  const [pendingPhoto, setPendingPhoto] = useState<PendingPhoto | null>(null);

  return (
    <PendingPhotoContext.Provider value={{ pendingPhoto, setPendingPhoto }}>
      {children}
    </PendingPhotoContext.Provider>
  );
}

export function usePendingPhoto(): PendingPhotoContextValue {
  const ctx = useContext(PendingPhotoContext);
  if (!ctx) {
    throw new Error('usePendingPhoto must be used within a PendingPhotoProvider');
  }
  return ctx;
}
