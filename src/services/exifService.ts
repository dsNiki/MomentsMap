/**
 * exifService – EXIF metaadatok kiolvasása és normalizálása.
 *
 * Az expo-image-picker az `exif: true` opcióval egy nyers EXIF objektumot
 * ad vissza az ImagePickerAsset.exif mezőben. Ez a service azt normalizálja
 * típusbiztos ExifData struktúrává.
 */

export interface ExifData {
  /** Készítési dátum ISO 8601 formátumban, pl. "2024-06-15T14:32:00" – vagy null ha nem érhető el */
  createdAt: string | null;
  /** Szélességi fok (WGS84), pl. 47.4979 – vagy null */
  latitude: number | null;
  /** Hosszúsági fok (WGS84), pl. 19.0402 – vagy null */
  longitude: number | null;
  /** Mágneses irányszög fokban (0–360), pl. 270.5 – vagy null */
  bearing: number | null;
  /** Rekeszérték (f-szám), pl. 1.8 – vagy null */
  aperture: number | null;
  /** Záridő törtrészként, pl. "1/120" – vagy null */
  shutterSpeed: string | null;
  /** ISO érzékenység, pl. 100 – vagy null */
  iso: number | null;
}

/** Üres (minden null) ExifData – ha nincs EXIF vagy hiba történt */
export const EMPTY_EXIF: ExifData = {
  createdAt: null,
  latitude: null,
  longitude: null,
  bearing: null,
  aperture: null,
  shutterSpeed: null,
  iso: null,
};

/**
 * Normalizálja az expo-image-picker által visszaadott nyers EXIF objektumot.
 *
 * @param rawExif - Az ImagePickerAsset.exif értéke (Record<string, any> | null | undefined)
 * @returns Normalizált ExifData struktúra; hiányzó mezők null-ok
 */
export function readExif(rawExif: Record<string, unknown> | null | undefined): ExifData {
  if (!rawExif || typeof rawExif !== 'object') {
    return EMPTY_EXIF;
  }

  return {
    createdAt: parseDateTime(rawExif),
    latitude: parseLatitude(rawExif),
    longitude: parseLongitude(rawExif),
    bearing: parseBearing(rawExif),
    aperture: parseAperture(rawExif),
    shutterSpeed: parseShutterSpeed(rawExif),
    iso: parseIso(rawExif),
  };
}

// --- Segédfüggvények ---

/**
 * EXIF dátum formátum: "YYYY:MM:DD HH:MM:SS" → ISO 8601 "YYYY-MM-DDTHH:MM:SS"
 * Visszaesési sorrend: DateTimeOriginal → DateTimeDigitized → DateTime
 */
function parseDateTime(exif: Record<string, unknown>): string | null {
  const raw =
    (exif['DateTimeOriginal'] as string | undefined) ??
    (exif['DateTimeDigitized'] as string | undefined) ??
    (exif['DateTime'] as string | undefined);

  if (!raw || typeof raw !== 'string') return null;

  // "2024:06:15 14:32:00" → "2024-06-15T14:32:00"
  const normalized = raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3').replace(' ', 'T');

  // Érvényesség-ellenőrzés
  if (isNaN(Date.parse(normalized))) return null;

  return normalized;
}

/**
 * GPS szélességi fok: GPSLatitude tömb [fok, perc, másodperc] + GPSLatitudeRef ("N"/"S")
 */
function parseLatitude(exif: Record<string, unknown>): number | null {
  const coords = exif['GPSLatitude'];
  const ref = exif['GPSLatitudeRef'];

  const decimal = dmsToDecimal(coords);
  if (decimal === null) return null;

  return ref === 'S' ? -decimal : decimal;
}

/**
 * GPS hosszúsági fok: GPSLongitude tömb [fok, perc, másodperc] + GPSLongitudeRef ("E"/"W")
 */
function parseLongitude(exif: Record<string, unknown>): number | null {
  const coords = exif['GPSLongitude'];
  const ref = exif['GPSLongitudeRef'];

  const decimal = dmsToDecimal(coords);
  if (decimal === null) return null;

  return ref === 'W' ? -decimal : decimal;
}

/**
 * GPS irányszög: GPSImgDirection (fokban) + GPSImgDirectionRef ("T"=igaz észak / "M"=mágneses)
 * Az alkalmazás az igaz északtól mért szöget tárolja.
 */
function parseBearing(exif: Record<string, unknown>): number | null {
  const bearing = exif['GPSImgDirection'];
  if (bearing === null || bearing === undefined) return null;

  const value = typeof bearing === 'number' ? bearing : parseFloat(String(bearing));
  if (isNaN(value)) return null;

  return Math.round(value * 100) / 100; // 2 tizedesjegy pontossággal
}

function parseAperture(exif: Record<string, unknown>): number | null {
  // FNumber: f-szám közvetlen értékként (pl. 1.8) vagy törtként (pl. [9, 5] = 9/5)
  const fn = exif['FNumber'];
  if (fn === null || fn === undefined) return null;

  if (typeof fn === 'number') return Math.round(fn * 100) / 100;
  if (Array.isArray(fn) && fn.length === 2 && fn[1] !== 0) {
    return Math.round((fn[0] / fn[1]) * 100) / 100;
  }
  const parsed = parseFloat(String(fn));
  return isNaN(parsed) ? null : Math.round(parsed * 100) / 100;
}

function parseShutterSpeed(exif: Record<string, unknown>): string | null {
  // ExposureTime: törtszám pl. 0.008333 (= 1/120) vagy tömb [1, 120]
  const et = exif['ExposureTime'];
  if (et === null || et === undefined) return null;

  if (Array.isArray(et) && et.length === 2 && et[1] !== 0) {
    // Egyszerűsítjük: ha a számláló 1, "1/N" formátum
    if (et[0] === 1) return `1/${et[1]}`;
    const gcd = greatestCommonDivisor(Math.abs(et[0]), Math.abs(et[1]));
    return `${et[0] / gcd}/${et[1] / gcd}`;
  }
  if (typeof et === 'number' && et > 0) {
    if (et >= 1) return `${et}s`;
    const denominator = Math.round(1 / et);
    return `1/${denominator}`;
  }
  return null;
}

function parseIso(exif: Record<string, unknown>): number | null {
  const iso = exif['ISOSpeedRatings'] ?? exif['PhotographicSensitivity'];
  if (iso === null || iso === undefined) return null;

  // Néha tömb formában érkezik
  const value = Array.isArray(iso) ? iso[0] : iso;
  const parsed = typeof value === 'number' ? value : parseInt(String(value), 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * DMS (fok, perc, másodperc) → decimális fok konverzió.
 * A tömb elemei lehetnek számok vagy [számláló, nevező] törtpárok.
 */
function dmsToDecimal(dms: unknown): number | null {
  if (!Array.isArray(dms) || dms.length < 3) return null;

  function toFloat(v: unknown): number {
    if (typeof v === 'number') return v;
    if (Array.isArray(v) && v.length === 2 && v[1] !== 0) return v[0] / v[1];
    return parseFloat(String(v));
  }

  const degrees = toFloat(dms[0]);
  const minutes = toFloat(dms[1]);
  const seconds = toFloat(dms[2]);

  if (isNaN(degrees) || isNaN(minutes) || isNaN(seconds)) return null;

  return degrees + minutes / 60 + seconds / 3600;
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}
