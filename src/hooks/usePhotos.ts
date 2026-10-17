import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getAllPhotos } from '@/db/photoRepository';
import { Photo } from '@/db/types';

interface UsePhotosResult {
  photos: Photo[];
  loading: boolean;
  /** Igaz, ha a betöltés hibára futott (pl. adatbázis-hiba) */
  failed: boolean;
}

/**
 * A mentett fotók betöltése az adatbázisból.
 *
 * A képernyő fókuszba kerülésekor újratölt, így egy új fotó mentése után
 * a lista azonnal friss adatot mutat.
 */
export function usePhotos(): UsePhotosResult {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        try {
          const rows = await getAllPhotos();
          if (!cancelled) {
            setPhotos(rows);
            setFailed(false);
          }
        } catch {
          if (!cancelled) setFailed(true);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      // A képernyő elhagyásakor a még futó betöltés eredményét eldobjuk
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return { photos, loading, failed };
}
