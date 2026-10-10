import { getConnection } from '@/db/database';
import { NewPhoto, Photo } from '@/db/types';

// Frissíthető mezők – id, added_at és tags nem módosítható ezen a rétegen
export type PhotoUpdate = Partial<Omit<Photo, 'id' | 'added_at' | 'tags'>>;

/**
 * Új fotórekord mentése.
 * @returns Az új rekord generált id-je.
 */
export async function insertPhoto(photo: NewPhoto): Promise<number> {
  const db = getConnection();

  const result = await db.runAsync(
    `INSERT INTO photos
       (uri, title, description, created_at,
        latitude, longitude, bearing,
        width, height, aperture, shutter_speed, iso, category_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    photo.uri,
    photo.title ?? null,
    photo.description ?? null,
    photo.created_at ?? null,
    photo.latitude ?? null,
    photo.longitude ?? null,
    photo.bearing ?? null,
    photo.width ?? null,
    photo.height ?? null,
    photo.aperture ?? null,
    photo.shutter_speed ?? null,
    photo.iso ?? null,
    photo.category_id ?? null,
  );

  return result.lastInsertRowId;
}

/**
 * Az összes fotórekord lekérdezése, hozzáadás ideje szerint csökkenő sorrendben.
 */
export async function getAllPhotos(): Promise<Photo[]> {
  const db = getConnection();
  return db.getAllAsync<Photo>('SELECT * FROM photos ORDER BY added_at DESC');
}

/**
 * Egy fotórekord lekérdezése id alapján.
 * @returns A fotó, vagy null ha nem létezik.
 */
export async function getPhotoById(id: number): Promise<Photo | null> {
  const db = getConnection();
  return db.getFirstAsync<Photo>('SELECT * FROM photos WHERE id = ?', id);
}

/**
 * Egy fotórekord metaadatainak frissítése.
 * Csak a `data`-ban megadott mezők módosulnak.
 */
export async function updatePhoto(id: number, data: PhotoUpdate): Promise<void> {
  const db = getConnection();

  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  const setClauses = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([, v]) => v ?? null);

  await db.runAsync(`UPDATE photos SET ${setClauses} WHERE id = ?`, ...values, id);
}

/**
 * Egy fotórekord törlése.
 * A kapcsolódó photo_tags sorok ON DELETE CASCADE miatt automatikusan törlődnek.
 */
export async function deletePhoto(id: number): Promise<void> {
  const db = getConnection();
  await db.runAsync('DELETE FROM photos WHERE id = ?', id);
}
