// Adatmodellek – az SQLite táblák TypeScript reprezentációi

export interface Photo {
  id: number;
  uri: string;
  title: string | null;
  description: string | null;
  created_at: string | null; // ISO 8601
  latitude: number | null;
  longitude: number | null;
  bearing: number | null;
  width: number | null;
  height: number | null;
  aperture: number | null;
  shutter_speed: string | null;
  iso: number | null;
  category_id: number | null;
  added_at: string; // ISO 8601, automatikusan kitöltve
  tags?: Tag[];
}

export interface Tag {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

// INSERT-hez: id és added_at nélkül
export type NewPhoto = Omit<Photo, 'id' | 'added_at' | 'tags'>;
