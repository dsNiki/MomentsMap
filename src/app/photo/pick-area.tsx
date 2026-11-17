import { router } from 'expo-router';

import { AreaPicker } from '@/components/AreaPicker';
import { useAreaPick } from '@/context/AreaPickContext';
import { Coordinate } from '@/services/geoService';

export default function PickAreaScreen() {
  const { getRequest, setRequest } = useAreaPick();
  const request = getRequest();

  function handleConfirm(polygon: Coordinate[]) {
    request?.onPicked(polygon);
    setRequest(null);
    router.back();
  }

  function handleCancel() {
    setRequest(null);
    router.back();
  }

  return (
    <AreaPicker
      initialPolygon={request?.initial ?? null}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    />
  );
}
