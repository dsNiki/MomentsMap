import { getConnection } from '@/db/database';
import { Tag } from '@/db/types';

/**
 * Visszaadja a tag id-jét, ha már létezik ilyen névvel;
 * ha nem, létrehozza és az új rekord id-jét adja vissza.
 * A névegyezés kis-nagybetű érzéketlen.
 */
export async function insertTagIfNotExists(name: string): Promise<number> {
  const db = getConnection();

  const trimmed = name.trim();

  // INSERT OR IGNORE: ha már létezik, nem dob hibát
  await db.runAsync('INSERT OR IGNORE INTO tags (name) VALUES (?)', trimmed);

  // Akár most jött létre, akár korábban, lekérjük az id-t
  const tag = await db.getFirstAsync<{ id: number }>('SELECT id FROM tags WHERE name = ?', trimmed);

  if (!tag) {
    throw new Error(`Nem sikerült létrehozni vagy megtalálni a(z) "${trimmed}" címkét.`);
  }

  return tag.id;
}

/**
 * Visszaadja egy fotóhoz tartozó összes címkét.
 */
export async function getTagsForPhoto(photoId: number): Promise<Tag[]> {
  const db = getConnection();

  return db.getAllAsync<Tag>(
    `SELECT t.id, t.name
     FROM tags t
     INNER JOIN photo_tags pt ON pt.tag_id = t.id
     WHERE pt.photo_id = ?
     ORDER BY t.name ASC`,
    photoId,
  );
}

/**
 * Létrehozza a fotó–tag kapcsolatot.
 * Ha a kapcsolat már létezik, nem dob hibát.
 * Ez garantálja, hogy egy tag nem kerülhet kétszer ugyanahhoz a fotóhoz.
 */
export async function addTagToPhoto(photoId: number, tagId: number): Promise<void> {
  const db = getConnection();
  await db.runAsync(
    'INSERT OR IGNORE INTO photo_tags (photo_id, tag_id) VALUES (?, ?)',
    photoId,
    tagId,
  );
}

/**
 * Törli a fotó–tag kapcsolatot.
 * Magát a tag rekordot nem érinti.
 */
export async function removeTagFromPhoto(photoId: number, tagId: number): Promise<void> {
  const db = getConnection();
  await db.runAsync('DELETE FROM photo_tags WHERE photo_id = ? AND tag_id = ?', photoId, tagId);
}
