import { Directory, File, Paths } from 'expo-file-system';

import { getAllCategories } from '@/db/categoryRepository';
import { getConnection } from '@/db/database';
import { deletePhoto, getAllPhotos, getPhotoById, insertPhoto } from '@/db/photoRepository';
import {
  addTagToPhoto,
  getAllPhotoTags,
  getTagsForPhoto,
  insertTagIfNotExists,
} from '@/db/tagRepository';
import { Photo, Tag } from '@/db/types';
import { ExifData } from '@/services/exifService';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

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
  const storedUri = persistImage(input.uri);

  const db = getConnection();
  let photoId = 0;

  try {
    await db.withTransactionAsync(async () => {
      photoId = await insertPhoto({
        uri: storedUri,
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
  } catch (err) {
    deleteImage(storedUri);
    throw err;
  }

  return photoId;
}


export async function getPhotos(): Promise<Photo[]> {
  const [photos, photoTags] = await Promise.all([getAllPhotos(), getAllPhotoTags()]);

  const tagsByPhoto = new Map<number, Tag[]>();
  for (const { photo_id, id, name } of photoTags) {
    const list = tagsByPhoto.get(photo_id);
    if (list) list.push({ id, name });
    else tagsByPhoto.set(photo_id, [{ id, name }]);
  }

  return photos.map(photo => ({ ...photo, tags: tagsByPhoto.get(photo.id) ?? [] }));
}

export async function getPhotoDetails(id: number): Promise<Photo | null> {
  const photo = await getPhotoById(id);
  if (!photo) return null;

  const tags = await getTagsForPhoto(id);
  return { ...photo, tags };
}

export async function removePhoto(id: number): Promise<void> {
  const photo = await getPhotoById(id);
  await deletePhoto(id);
  if (photo) deleteImage(photo.uri);
}

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

function photoDirectory(): Directory {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ idempotent: true, intermediates: true });
  return dir;
}

function persistImage(sourceUri: string): string {
  const source = new File(sourceUri);
  const extension = source.extension || '.jpg';
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;
  const target = new File(photoDirectory(), name);
  source.copySync(target);
  return target.uri;
}

function deleteImage(uri: string): void {
  try {
    if (!uri.startsWith(photoDirectory().uri)) return;
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // A hiányzó vagy már törölt fájl nem hiba
  }
}
