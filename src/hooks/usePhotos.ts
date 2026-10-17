import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { usePhotoContext } from '@/context/PhotoContext';
import { Photo } from '@/db/types';
import { removePhoto as removePhotoRecord } from '@/services/photoService';

interface UsePhotosResult {
  photos: Photo[];
  loading: boolean;
  failed: boolean;
  /** Kézi újratöltés az adatbázisból */
  reload: () => Promise<void>;
  /** Fotó törlése az adatbázisból és a globális állapotból */
  deletePhoto: (_id: number) => Promise<void>;
}

/**
 * A fotólista elérése a globális állapotból.
 *
 * A képernyő fókuszba kerülésekor újratölt, így egy új fotó mentése után
 * a lista azonnal friss adatot mutat.
 */
export function usePhotos(): UsePhotosResult {
  const { photos, loading, failed, loadPhotos, dispatch } = usePhotoContext();

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [loadPhotos]),
  );

  const deletePhoto = useCallback(
    async (id: number) => {
      await removePhotoRecord(id);
      dispatch({ type: 'DELETE_PHOTO', id });
    },
    [dispatch],
  );

  return { photos, loading, failed, reload: loadPhotos, deletePhoto };
}
