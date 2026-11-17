// photoService unit tesztek – csak a tiszta segédfüggvények: parseTags, parseCoordinate, parseDateTime

import {
  parseCoordinate,
  parseDateTime,
  parseTags,
  ValidationError,
} from '@/services/photoService';

describe('photoService', () => {
  describe('parseTags', () => {
    it('splits on commas and trims the parts', () => {
      expect(parseTags('hegyek, tó ,  naplemente')).toEqual(['hegyek', 'tó', 'naplemente']);
    });

    it('drops empty parts', () => {
      expect(parseTags('hegyek,,  , tó,')).toEqual(['hegyek', 'tó']);
    });

    it('dedupes case-insensitively and keeps the first casing', () => {
      expect(parseTags('Hegyek, hegyek, HEGYEK, Tó')).toEqual(['Hegyek', 'Tó']);
    });

    it('returns an empty array for an empty or whitespace-only string', () => {
      expect(parseTags('')).toEqual([]);
      expect(parseTags('  ,  ')).toEqual([]);
    });
  });

  describe('parseCoordinate', () => {
    it('parses a valid value', () => {
      expect(parseCoordinate('47.5', -90, 90, 'szélességi fok')).toBe(47.5);
      expect(parseCoordinate(' -17.25 ', -180, 180, 'hosszúsági fok')).toBe(-17.25);
    });

    it('returns null for an empty or whitespace-only string', () => {
      expect(parseCoordinate('', -90, 90, 'szélességi fok')).toBeNull();
      expect(parseCoordinate('   ', -90, 90, 'szélességi fok')).toBeNull();
    });

    it('accepts a comma as the decimal separator', () => {
      expect(parseCoordinate('47,5', -90, 90, 'szélességi fok')).toBe(47.5);
    });

    it('accepts the range bounds', () => {
      expect(parseCoordinate('-90', -90, 90, 'szélességi fok')).toBe(-90);
      expect(parseCoordinate('90', -90, 90, 'szélességi fok')).toBe(90);
    });

    it('throws ValidationError for an out-of-range value', () => {
      expect(() => parseCoordinate('90.1', -90, 90, 'szélességi fok')).toThrow(ValidationError);
      expect(() => parseCoordinate('-200', -180, 180, 'hosszúsági fok')).toThrow(ValidationError);
    });

    it('throws ValidationError for a non-numeric value', () => {
      expect(() => parseCoordinate('abc', -90, 90, 'szélességi fok')).toThrow(ValidationError);
    });

    it('names the label and the bounds in the error message', () => {
      expect(() => parseCoordinate('abc', -90, 90, 'szélességi fok')).toThrow(
        'Érvénytelen szélességi fok: -90 és 90 közötti szám szükséges.',
      );
    });
  });

  describe('parseDateTime', () => {
    it('passes a valid ISO timestamp through', () => {
      expect(parseDateTime('2024-05-10T09:00:00')).toBe('2024-05-10T09:00:00');
    });

    it('trims the value', () => {
      expect(parseDateTime('  2024-05-10T09:00:00  ')).toBe('2024-05-10T09:00:00');
    });

    it('returns null for an empty or whitespace-only string', () => {
      expect(parseDateTime('')).toBeNull();
      expect(parseDateTime('   ')).toBeNull();
    });

    it('throws ValidationError for an unparsable value', () => {
      expect(() => parseDateTime('nem egy dátum')).toThrow(ValidationError);
      expect(() => parseDateTime('2024-13-45T99:99:99')).toThrow(ValidationError);
    });
  });
});
