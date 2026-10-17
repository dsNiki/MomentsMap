import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

import { Photo } from '@/db/types';
import { getPhotos } from '@/services/photoService';

export interface PhotoState {
  photos: Photo[];
  /** Igaz az első betöltés befejezéséig */
  loading: boolean;
  /** Igaz, ha a betöltés hibára futott (pl. adatbázis-hiba) */
  failed: boolean;
}

export type PhotoAction =
  | { type: 'UPDATE_PHOTOS'; photos: Photo[] }
  | { type: 'DELETE_PHOTO'; id: number }
  | { type: 'LOAD_FAILED' };

const initialState: PhotoState = {
  photos: [],
  loading: true,
  failed: false,
};

export function photoReducer(state: PhotoState, action: PhotoAction): PhotoState {
  switch (action.type) {
    case 'UPDATE_PHOTOS':
      return { photos: action.photos, loading: false, failed: false };

    case 'DELETE_PHOTO':
      // Csak a helyi állapotból távolítjuk el; az adatbázis-műveletet a hívó végzi
      return { ...state, photos: state.photos.filter(photo => photo.id !== action.id) };

    case 'LOAD_FAILED':
      return { ...state, loading: false, failed: true };

    default:
      return state;
  }
}

interface PhotoContextValue extends PhotoState {
  dispatch: (_action: PhotoAction) => void;
  /** Újratölti a fotólistát az adatbázisból */
  loadPhotos: () => Promise<void>;
}

const PhotoContext = createContext<PhotoContextValue | null>(null);

/**
 * A fényképek globális állapota.
 *
 * Azért globális, hogy a lista, a térkép és a részletes adatlap ugyanazt a
 * listát lássa, és egy törlés vagy mentés mindhol egyszerre érvényesüljön.
 */
export function PhotoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(photoReducer, initialState);

  const loadPhotos = useCallback(async () => {
    try {
      const photos = await getPhotos();
      dispatch({ type: 'UPDATE_PHOTOS', photos });
    } catch {
      dispatch({ type: 'LOAD_FAILED' });
    }
  }, []);

  const value = useMemo(() => ({ ...state, dispatch, loadPhotos }), [state, dispatch, loadPhotos]);

  return <PhotoContext.Provider value={value}>{children}</PhotoContext.Provider>;
}

export function usePhotoContext(): PhotoContextValue {
  const ctx = useContext(PhotoContext);
  if (!ctx) {
    throw new Error('usePhotoContext must be used within a PhotoProvider');
  }
  return ctx;
}
