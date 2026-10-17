import { router } from 'expo-router';

import { Coordinate, LocationPicker } from '@/components/LocationPicker';
import { useLocationPick } from '@/context/LocationPickContext';

/**
 * Térképes pontválasztó képernyő.
 *
 * Normál (nem modális) Stack képernyő, mert Androidon a Google Maps nézet
 * modál konténerben nem rajzolódik ki.
 */
export default function PickLocationScreen() {
  const { getRequest, setRequest } = useLocationPick();
  const request = getRequest();

  function handleConfirm(coordinate: Coordinate) {
    request?.onPicked(coordinate);
    setRequest(null);
    router.back();
  }

  function handleCancel() {
    // Megszakítás: a kérés indítója nem kap értéket, a korábbi helyadat marad
    setRequest(null);
    router.back();
  }

  return (
    <LocationPicker
      initialCoordinate={request?.initial ?? null}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    />
  );
}
