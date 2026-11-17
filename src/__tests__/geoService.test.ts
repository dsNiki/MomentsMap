// geoService unit tesztek – haversineDistance, filterByRadius, isPointInPolygon, filterByPolygon

import { Photo } from '@/db/types';
import {
  Coordinate,
  filterByPolygon,
  filterByRadius,
  haversineDistance,
  isPointInPolygon,
} from '@/services/geoService';

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

const BUDAPEST: Coordinate = { latitude: 47.4979, longitude: 19.0402 };
const VIENNA: Coordinate = { latitude: 48.2082, longitude: 16.3738 };

// Négyzet: lat 0..2, lon 0..2
const SQUARE: Coordinate[] = [
  { latitude: 0, longitude: 0 },
  { latitude: 0, longitude: 2 },
  { latitude: 2, longitude: 2 },
  { latitude: 2, longitude: 0 },
];

// L alakú konkáv poligon: a bevágás a lat 1..3 / lon 1..3 tartomány
const L_SHAPE: Coordinate[] = [
  { latitude: 0, longitude: 0 },
  { latitude: 0, longitude: 3 },
  { latitude: 1, longitude: 3 },
  { latitude: 1, longitude: 1 },
  { latitude: 3, longitude: 1 },
  { latitude: 3, longitude: 0 },
];

describe('geoService', () => {
  describe('haversineDistance', () => {
    it('azonos pontok távolsága nulla', () => {
      expect(
        haversineDistance(
          BUDAPEST.latitude,
          BUDAPEST.longitude,
          BUDAPEST.latitude,
          BUDAPEST.longitude,
        ),
      ).toBeCloseTo(0, 6);
    });

    it('Budapest–Bécs távolság kb. 214 km (1% tűréssel)', () => {
      const expected = 214000;
      const actual = haversineDistance(
        BUDAPEST.latitude,
        BUDAPEST.longitude,
        VIENNA.latitude,
        VIENNA.longitude,
      );
      expect(Math.abs(actual - expected)).toBeLessThanOrEqual(expected * 0.01);
    });

    it('szimmetrikus: a→b megegyezik b→a-val', () => {
      const ab = haversineDistance(
        BUDAPEST.latitude,
        BUDAPEST.longitude,
        VIENNA.latitude,
        VIENNA.longitude,
      );
      const ba = haversineDistance(
        VIENNA.latitude,
        VIENNA.longitude,
        BUDAPEST.latitude,
        BUDAPEST.longitude,
      );
      expect(ab).toBeCloseTo(ba, 6);
    });

    it('negatív koordinátákkal is helyes (déli/nyugati félteke)', () => {
      // Rio de Janeiro – Buenos Aires, kb. 1968 km
      const actual = haversineDistance(-22.9068, -43.1729, -34.6037, -58.3816);
      expect(actual).toBeGreaterThan(1900000);
      expect(actual).toBeLessThan(2050000);
    });
  });

  describe('filterByRadius', () => {
    it('a körön belüli képet megtartja, a kívülit kizárja', () => {
      const inside = makePhoto({ latitude: 47.498, longitude: 19.041 });
      const outside = makePhoto({
        latitude: VIENNA.latitude,
        longitude: VIENNA.longitude,
      });

      const result = filterByRadius([inside, outside], BUDAPEST, 1000);

      expect(ids(result)).toEqual([inside.id]);
    });

    it('a pontosan a határon lévő kép bent van', () => {
      const photo = makePhoto({ latitude: 47.5079, longitude: 19.0402 });
      const exactRadius = haversineDistance(
        BUDAPEST.latitude,
        BUDAPEST.longitude,
        photo.latitude!,
        photo.longitude!,
      );

      const result = filterByRadius([photo], BUDAPEST, exactRadius);

      expect(ids(result)).toEqual([photo.id]);
    });

    it('a koordináta nélküli képeket kizárja', () => {
      const noLat = makePhoto({ latitude: null, longitude: 19.0402 });
      const noLon = makePhoto({ latitude: 47.4979, longitude: null });
      const neither = makePhoto();

      const result = filterByRadius([noLat, noLon, neither], BUDAPEST, 100000);

      expect(result).toEqual([]);
    });

    it('nem módosítja a bemenetet', () => {
      const photos = [
        makePhoto({ latitude: 47.498, longitude: 19.041 }),
        makePhoto({ latitude: VIENNA.latitude, longitude: VIENNA.longitude }),
      ];
      const snapshot = JSON.parse(JSON.stringify(photos));

      filterByRadius(photos, BUDAPEST, 1000);

      expect(photos).toEqual(snapshot);
    });
  });

  describe('isPointInPolygon', () => {
    it('a négyzeten belüli pont bent van', () => {
      expect(isPointInPolygon({ latitude: 1, longitude: 1 }, SQUARE)).toBe(true);
    });

    it('a négyzeten kívüli pont kint van', () => {
      expect(isPointInPolygon({ latitude: 5, longitude: 5 }, SQUARE)).toBe(false);
    });

    it('háromnál kevesebb csúcs esetén false', () => {
      expect(isPointInPolygon({ latitude: 1, longitude: 1 }, [])).toBe(false);
      expect(isPointInPolygon({ latitude: 1, longitude: 1 }, [{ latitude: 0, longitude: 0 }])).toBe(
        false,
      );
      expect(
        isPointInPolygon({ latitude: 1, longitude: 1 }, [
          { latitude: 0, longitude: 0 },
          { latitude: 2, longitude: 2 },
        ]),
      ).toBe(false);
    });

    it('a csúcsra eső pont bent van', () => {
      expect(isPointInPolygon({ latitude: 0, longitude: 0 }, SQUARE)).toBe(true);
      expect(isPointInPolygon({ latitude: 2, longitude: 2 }, SQUARE)).toBe(true);
    });

    it('az élre eső pont bent van', () => {
      expect(isPointInPolygon({ latitude: 0, longitude: 1 }, SQUARE)).toBe(true);
      expect(isPointInPolygon({ latitude: 1, longitude: 2 }, SQUARE)).toBe(true);
    });

    it('konkáv (L alakú) poligon: a bevágásban kint, a száron bent', () => {
      expect(isPointInPolygon({ latitude: 2, longitude: 2 }, L_SHAPE)).toBe(false);
      expect(isPointInPolygon({ latitude: 2.5, longitude: 0.5 }, L_SHAPE)).toBe(true);
      expect(isPointInPolygon({ latitude: 0.5, longitude: 2.5 }, L_SHAPE)).toBe(true);
    });
  });

  describe('filterByPolygon', () => {
    it('a poligonon belüli képeket tartja meg', () => {
      const inside = makePhoto({ latitude: 1, longitude: 1 });
      const outside = makePhoto({ latitude: 5, longitude: 5 });

      const result = filterByPolygon([inside, outside], SQUARE);

      expect(ids(result)).toEqual([inside.id]);
    });

    it('a koordináta nélküli képeket kizárja', () => {
      const noLat = makePhoto({ latitude: null, longitude: 1 });
      const noLon = makePhoto({ latitude: 1, longitude: null });

      expect(filterByPolygon([noLat, noLon], SQUARE)).toEqual([]);
    });

    it('háromnál kevesebb csúcs esetén üres eredmény', () => {
      const photo = makePhoto({ latitude: 1, longitude: 1 });

      expect(filterByPolygon([photo], [])).toEqual([]);
      expect(
        filterByPolygon(
          [photo],
          [
            { latitude: 0, longitude: 0 },
            { latitude: 2, longitude: 2 },
          ],
        ),
      ).toEqual([]);
    });

    it('nem módosítja a bemenetet', () => {
      const photos = [
        makePhoto({ latitude: 1, longitude: 1 }),
        makePhoto({ latitude: 5, longitude: 5 }),
      ];
      const snapshot = JSON.parse(JSON.stringify(photos));

      filterByPolygon(photos, SQUARE);

      expect(photos).toEqual(snapshot);
    });
  });
});
