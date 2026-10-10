import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { getConnection } from '@/db/database';
import { Category } from '@/db/types';

/**
 * Visszaadja az összes kategóriát névsorrendben.
 */
export async function getAllCategories(): Promise<Category[]> {
  const db = getConnection();
  return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY name ASC');
}

/**
 * Betölti az előre definiált kategóriákat az adatbázisba.
 * INSERT OR IGNORE: ha már léteznek, nem fut le újra, így biztonságosan
 * hívható minden alkalmazásindításkor.
 */
export async function seedCategories(): Promise<void> {
  const db = getConnection();

  for (const name of DEFAULT_CATEGORIES) {
    await db.runAsync('INSERT OR IGNORE INTO categories (name) VALUES (?)', name);
  }
}
