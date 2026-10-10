import * as SQLite from 'expo-sqlite';

const DB_NAME = 'momentsmap.db';

// Singleton kapcsolat – az app teljes élettartama alatt egy példány él
let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Visszaadja az adatbázis-kapcsolatot.
 * Mindig az initDatabase() után hívd.
 */
export function getConnection(): SQLite.SQLiteDatabase {
  if (!_db) {
    throw new Error('Az adatbázis nincs inicializálva. Hívd előbb az initDatabase()-t.');
  }
  return _db;
}

/**
 * Megnyitja az adatbázist és létrehozza a táblákat, ha még nem léteznek.
 * Az alkalmazás indításakor egyszer hívandó (pl. _layout.tsx-ben).
 */
export async function initDatabase(): Promise<void> {
  if (_db) return; // már inicializálva

  _db = await SQLite.openDatabaseAsync(DB_NAME);

  // WAL mód: jobb írási teljesítmény, biztonságosabb konkurens hozzáférés
  // Foreign key support: kötelező explicit engedélyezni SQLite-ban
  await _db.execAsync('PRAGMA journal_mode = WAL;');
  await _db.execAsync('PRAGMA foreign_keys = ON;');

  await _db.execAsync(`
    -- Kategóriák tábla
    CREATE TABLE IF NOT EXISTS categories (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT    NOT NULL UNIQUE
    );

    -- Fotók tábla
    CREATE TABLE IF NOT EXISTS photos (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      uri           TEXT    NOT NULL,
      title         TEXT,
      description   TEXT,
      created_at    TEXT,
      latitude      REAL,
      longitude     REAL,
      bearing       REAL,
      width         INTEGER,
      height        INTEGER,
      aperture      REAL,
      shutter_speed TEXT,
      iso           INTEGER,
      category_id   INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      added_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    -- Címkék tábla
    CREATE TABLE IF NOT EXISTS tags (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT    NOT NULL UNIQUE
    );

    -- Fotó–Címke kapcsolótábla
    CREATE TABLE IF NOT EXISTS photo_tags (
      photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
      tag_id   INTEGER NOT NULL REFERENCES tags(id)   ON DELETE CASCADE,
      PRIMARY KEY (photo_id, tag_id)
    );
  `);
}
