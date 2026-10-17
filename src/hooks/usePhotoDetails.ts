import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { Photo } from '@/db/types';
import { getPhotoDetails } from '@/services/photoService';

interface UsePhotoDetailsResult {
  photo: Photo | null;
  loading: boolean;
  /** Igaz, ha a betöltés hibára futott vagy a fotó nem létezik */
  failed: boolean;
}

/**
 * Egy fotó betöltése a részletes adatlaphoz, címkékkel együtt.
 *
 * A képernyő fókuszba kerülésekor újratölt, így szerkesztés után
 * friss adatot mutat.
 */
export function usePhotoDetails(id: number | null): UsePhotoDetailsResult {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        if (id === null) {
          if (!cancelled) {
            setFailed(true);
            setLoading(false);
          }
          return;
        }

        try {
          const row = await getPhotoDetails(id);
          if (!cancelled) {
            setPhoto(row);
            setFailed(row === null);
          }
        } catch {
          if (!cancelled) setFailed(true);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [id]),
  );

  return { photo, loading, failed };
}
