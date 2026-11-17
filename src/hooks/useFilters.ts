// useFilters – FilterContext elérése és szűrési műveletek

import { useMemo } from 'react';

import { useFilterContext } from '@/context/FilterContext';
import { Photo } from '@/db/types';
import { usePhotos } from '@/hooks/usePhotos';
import { applyFilters } from '@/services/filterService';
import { filterByPolygon, filterByRadius } from '@/services/geoService';


export function useFilters() {
  const filters = useFilterContext();
  const { photos, loading, failed } = usePhotos();
  const { query, categoryId, dateFrom, dateTo, radiusCenter, radiusMeters, polygon } = filters;

  const filteredPhotos = useMemo<Photo[]>(() => {
    let result = applyFilters(photos, { query, categoryId, dateFrom, dateTo });

    if (radiusCenter !== null && radiusMeters !== null) {
      result = filterByRadius(result, radiusCenter, radiusMeters);
    }

    if (polygon !== null && polygon.length >= 3) {
      result = filterByPolygon(result, polygon);
    }

    return result;
  }, [photos, query, categoryId, dateFrom, dateTo, radiusCenter, radiusMeters, polygon]);

  return { ...filters, filteredPhotos, loading, failed };
}
