// formatDate – dátum formázó segédfüggvények

/** Hiányzó vagy érvénytelen értékek egységes jelölése a felületen */
export const MISSING = '—';

/**
 * ISO 8601 dátum → "ÉÉÉÉ.HH.NN" alak.
 * Érvénytelen vagy hiányzó érték esetén a MISSING jelölést adja.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return MISSING;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return MISSING;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
}

/**
 * ISO 8601 dátum → "ÉÉÉÉ.HH.NN ÓÓ:PP" alak.
 * Érvénytelen vagy hiányzó érték esetén a MISSING jelölést adja.
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return MISSING;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return MISSING;

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${formatDate(iso)} ${hours}:${minutes}`;
}
