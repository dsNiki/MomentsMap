// filterService – szöveges, kategória, dátum és térbeli szűrés

import { Photo } from '@/db/types';

/** A listanézet szűrőfeltételei */
export interface FilterCriteria {
  query: string;
  categoryId: number | null;
  dateFrom: string | null;
  dateTo: string | null;
}


const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;


export function filterByText(photos: Photo[], query: string): Photo[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return photos;

  return photos.filter(photo => {
    const fields = [
      photo.title ?? '',
      photo.description ?? '',
      ...(photo.tags ?? []).map(t => t.name),
    ].map(f => f.toLowerCase());

    return words.every(word => fields.some(field => field.includes(word)));
  });
}


export function filterByCategory(photos: Photo[], categoryId: number | null): Photo[] {
  if (categoryId === null) return photos;
  return photos.filter(photo => photo.category_id === categoryId);
}


export function filterByDateRange(
  photos: Photo[],
  from: string | null,
  to: string | null,
): Photo[] {
  if (from === null && to === null) return photos;

  const fromMs = from === null ? null : parseBound(from, false);
  const toMs = to === null ? null : parseBound(to, true);

  return photos.filter(photo => {
    if (photo.created_at === null) return false;
    const time = Date.parse(photo.created_at);
    if (Number.isNaN(time)) return false;
    if (fromMs !== null && time < fromMs) return false;
    if (toMs !== null && time > toMs) return false;
    return true;
  });
}


export function applyFilters(photos: Photo[], criteria: FilterCriteria): Photo[] {
  const byCategory = filterByCategory(photos, criteria.categoryId);
  const byDate = filterByDateRange(byCategory, criteria.dateFrom, criteria.dateTo);
  return filterByText(byDate, criteria.query);
}

function parseBound(value: string, endOfDay: boolean): number {
  if (value.length === 10 && DATE_ONLY.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return endOfDay
      ? new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
      : new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  }
  return Date.parse(value);
}
