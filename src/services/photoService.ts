// photoService – fotókezelés belépési pontja (validálás + mentés több táblába)

import { getAllCategories } from '@/db/categoryRepository';
import { getConnection } from '@/db/database';
import { deletePhoto, getAllPhotos, getPhotoById, insertPhoto } from '@/db/photoRepository';
import { addTagToPhoto, getTagsForPhoto, insertTagIfNotExists } from '@/db/tagRepository';
import { Photo } from '@/db/types';
import { ExifData } from '@/services/exifService';

/** Felhasználónak megjeleníthető validációs hiba */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** A szerkesztőfelületről érkező nyers adatok (szöveges mezők, ahogy a felhasználó beírta) */
export interface SavePhotoInput {
  uri: string;
  width: number;
  height: number;
  exif: ExifData;
  title: string;
  description: string;
  category: string | null;
  tags: string;
  latitude: string;
  longitude: string;
  time: string;
}

/**
 * Validálja és elmenti a fotót a hozzá tartozó címkékkel együtt, egy tranzakcióban.
 *
 * A rétegek összekapcsolása:
 * - exifService: a technikai mezők (irány, rekesz, záridő, ISO) az `input.exif`-ből
 *   jönnek, amit a kép kiválasztásakor olvastunk ki. A hely és az idő a
 *   szerkesztőfelület mezőiből származik, hogy a felhasználói módosítás felülírja
 *   az EXIF-értéket.
 * - photoRepository: a fotórekord beszúrása
 * - tagRepository: a címkék létrehozása és hozzárendelése
 * - categoryRepository: a kategória név szerinti feloldása
 *
 * @returns Az új fotórekord id-je
 * @throws ValidationError ha valamelyik mező érvénytelen
 */
export async function savePhoto(input: SavePhotoInput): Promise<number> {
  const latitude = parseCoordinate(input.latitude, -90, 90, 'szélességi fok');
  const longitude = parseCoordinate(input.longitude, -180, 180, 'hosszúsági fok');

  // A koordinátapár csak együtt értelmes
  if ((latitude === null) !== (longitude === null)) {
    throw new ValidationError('A helyszínhez a szélességi és a hosszúsági fokot is meg kell adni.');
  }

  const createdAt = parseDateTime(input.time);
  const tagNames = parseTags(input.tags);
  const categoryId = await resolveCategoryId(input.category);

  const db = getConnection();
  let photoId = 0;

  // Tranzakció: ha a címkék mentése elszáll, a fotórekord sem marad félkész állapotban
  await db.withTransactionAsync(async () => {
    photoId = await insertPhoto({
      uri: input.uri,
      title: emptyToNull(input.title),
      description: emptyToNull(input.description),
      created_at: createdAt,
      latitude,
      longitude,
      bearing: input.exif.bearing,
      width: input.width > 0 ? input.width : null,
      height: input.height > 0 ? input.height : null,
      aperture: input.exif.aperture,
      shutter_speed: input.exif.shutterSpeed,
      iso: input.exif.iso,
      category_id: categoryId,
    });

    for (const name of tagNames) {
      const tagId = await insertTagIfNotExists(name);
      await addTagToPhoto(photoId, tagId);
    }
  });

  return photoId;
}

/** Az összes mentett fotó, a legutóbb hozzáadott elöl. */
export async function getPhotos(): Promise<Photo[]> {
  return getAllPhotos();
}

/**
 * Egy fotó a hozzá tartozó címkékkel együtt – a részletes adatlaphoz.
 * @returns A fotó, vagy null ha nem létezik.
 */
export async function getPhotoDetails(id: number): Promise<Photo | null> {
  const photo = await getPhotoById(id);
  if (!photo) return null;

  const tags = await getTagsForPhoto(id);
  return { ...photo, tags };
}

/**
 * Fotórekord törlése.
 *
 * A kapcsolódó címkekapcsolatokat az adatbázis ON DELETE CASCADE kezeli.
 * Az eredeti képfájlt szándékosan nem törli a készülék galériájából
 * (FK-27, NFK-19).
 */
export async function removePhoto(id: number): Promise<void> {
  await deletePhoto(id);
}

// --- Segédfüggvények (exportálva az egységtesztekhez) ---

/** Vesszővel elválasztott címkék → egyedi, levágott nevek (kis-nagybetű érzéketlen duplikátumszűrés) */
export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of raw.split(',')) {
    const name = part.trim();
    const key = name.toLowerCase();
    if (name && !seen.has(key)) {
      seen.add(key);
      result.push(name);
    }
  }
  return result;
}

/** Üres szöveg → null; érvénytelen vagy tartományon kívüli szám → ValidationError */
export function parseCoordinate(
  raw: string,
  min: number,
  max: number,
  label: string,
): number | null {
  const trimmed = raw.trim().replace(',', '.');
  if (!trimmed) return null;

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new ValidationError(`Érvénytelen ${label}: ${min} és ${max} közötti szám szükséges.`);
  }
  return value;
}

/** Üres szöveg → null; érvénytelen dátum → ValidationError */
export function parseDateTime(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (Number.isNaN(Date.parse(trimmed))) {
    throw new ValidationError('Érvénytelen időpont. Formátum: ÉÉÉÉ-HH-NNTÓÓ:PP:MM');
  }
  return trimmed;
}

async function resolveCategoryId(name: string | null): Promise<number | null> {
  if (!name) return null;
  const categories = await getAllCategories();
  return categories.find(c => c.name === name)?.id ?? null;
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
