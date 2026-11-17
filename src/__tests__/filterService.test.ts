// filterService unit tesztek – filterByText, filterByCategory, filterByDateRange

import { Photo } from '@/db/types';
import {
  applyFilters,
  filterByCategory,
  filterByDateRange,
  filterByText,
} from '@/services/filterService';

let nextId = 1;

function makePhoto(overrides: Partial<Photo> = {}): Photo {
  return {
    id: nextId++,
    uri: 'file:///photo.jpg',
    title: null,
    description: null,
    created_at: null,
    latitude: null,
    longitude: null,
    bearing: null,
    width: null,
    height: null,
    aperture: null,
    shutter_speed: null,
    iso: null,
    category_id: null,
    added_at: '2024-01-01T00:00:00',
    ...overrides,
  };
}

const ids = (photos: Photo[]) => photos.map(p => p.id);

describe('filterService', () => {
  describe('filterByText', () => {
    const sunset = makePhoto({ title: 'Naplemente', description: null, tags: [] });
    const lake = makePhoto({ title: null, description: 'Balaton partján', tags: [] });
    const tagged = makePhoto({ title: 'Kirándulás', tags: [{ id: 1, name: 'Hegyek' }] });
    const noTags = makePhoto({ title: 'Város éjjel' });
    const photos = [sunset, lake, tagged, noTags];

    it('matches the title', () => {
      expect(ids(filterByText(photos, 'naplemente'))).toEqual([sunset.id]);
    });

    it('matches the description', () => {
      expect(ids(filterByText(photos, 'balaton'))).toEqual([lake.id]);
    });

    it('matches a tag name', () => {
      expect(ids(filterByText(photos, 'hegy'))).toEqual([tagged.id]);
    });

    it('is case-insensitive', () => {
      expect(ids(filterByText(photos, 'NAPLEMENTE'))).toEqual([sunset.id]);
      expect(ids(filterByText(photos, 'hEgYeK'))).toEqual([tagged.id]);
    });

    it('returns the input as-is for an empty or whitespace-only query', () => {
      expect(filterByText(photos, '')).toBe(photos);
      expect(filterByText(photos, '   \t ')).toBe(photos);
    });

    it('requires every word to match some field (AND)', () => {
      expect(ids(filterByText(photos, '  kirándulás   hegyek '))).toEqual([tagged.id]);
      expect(filterByText(photos, 'kirándulás balaton')).toEqual([]);
    });

    it('handles photos without a tags field', () => {
      expect(ids(filterByText(photos, 'város'))).toEqual([noTags.id]);
      expect(filterByText([noTags], 'hegyek')).toEqual([]);
    });
  });

  describe('filterByCategory', () => {
    const a = makePhoto({ category_id: 1 });
    const b = makePhoto({ category_id: 2 });
    const none = makePhoto({ category_id: null });
    const photos = [a, b, none];

    it('returns the input as-is when categoryId is null', () => {
      expect(filterByCategory(photos, null)).toBe(photos);
    });

    it('keeps only photos with the given category', () => {
      expect(ids(filterByCategory(photos, 2))).toEqual([b.id]);
      expect(filterByCategory(photos, 99)).toEqual([]);
    });
  });

  describe('filterByDateRange', () => {
    const jan1 = makePhoto({ created_at: '2024-01-01T10:00:00' });
    const jan15 = makePhoto({ created_at: '2024-01-15T12:00:00' });
    const jan31Late = makePhoto({ created_at: '2024-01-31T23:30:00' });
    const noDate = makePhoto({ created_at: null });
    const photos = [jan1, jan15, jan31Late, noDate];

    it('includes both bounds', () => {
      const result = filterByDateRange(photos, '2024-01-01T10:00:00', '2024-01-15T12:00:00');
      expect(ids(result)).toEqual([jan1.id, jan15.id]);
    });

    it('supports an open-ended from or to bound', () => {
      expect(ids(filterByDateRange(photos, '2024-01-10T00:00:00', null))).toEqual([
        jan15.id,
        jan31Late.id,
      ]);
      expect(ids(filterByDateRange(photos, null, '2024-01-10T00:00:00'))).toEqual([jan1.id]);
    });

    it('excludes null created_at when a bound is set', () => {
      expect(ids(filterByDateRange(photos, '2000-01-01T00:00:00', null))).not.toContain(noDate.id);
      expect(ids(filterByDateRange(photos, null, '2100-01-01T00:00:00'))).not.toContain(noDate.id);
    });

    it('returns the input as-is (including null created_at) when no bound is set', () => {
      const result = filterByDateRange(photos, null, null);
      expect(result).toBe(photos);
      expect(ids(result)).toContain(noDate.id);
    });

    it('treats a date-only to bound as covering the whole day', () => {
      expect(ids(filterByDateRange(photos, null, '2024-01-31'))).toEqual([
        jan1.id,
        jan15.id,
        jan31Late.id,
      ]);
      expect(ids(filterByDateRange(photos, null, '2024-01-30'))).toEqual([jan1.id, jan15.id]);
    });
  });

  describe('applyFilters', () => {
    it('combines category, date range and text filters', () => {
      const match = makePhoto({
        category_id: 1,
        created_at: '2024-05-10T09:00:00',
        title: 'Tavaszi erdő',
      });
      const wrongCategory = makePhoto({
        category_id: 2,
        created_at: '2024-05-10T09:00:00',
        title: 'Tavaszi erdő',
      });
      const wrongDate = makePhoto({
        category_id: 1,
        created_at: '2023-05-10T09:00:00',
        title: 'Tavaszi erdő',
      });
      const wrongText = makePhoto({
        category_id: 1,
        created_at: '2024-05-10T09:00:00',
        title: 'Téli tó',
      });

      const result = applyFilters([match, wrongCategory, wrongDate, wrongText], {
        query: 'erdő',
        categoryId: 1,
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      });
      expect(ids(result)).toEqual([match.id]);
    });
  });

  it('does not mutate its inputs', () => {
    const photos = [
      makePhoto({ title: 'B', category_id: 1, created_at: '2024-02-01T00:00:00', tags: [] }),
      makePhoto({ title: 'A', category_id: 2, created_at: null }),
    ];
    const snapshot = JSON.parse(JSON.stringify(photos));

    filterByText(photos, 'a');
    filterByCategory(photos, 1);
    filterByDateRange(photos, '2024-01-01', '2024-12-31');
    applyFilters(photos, { query: 'b', categoryId: 1, dateFrom: null, dateTo: '2024-12-31' });

    expect(photos).toEqual(snapshot);
  });
});
