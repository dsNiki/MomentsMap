import { formatDate, MISSING } from '@/utils/formatDate';

describe('sanity', () => {
  it('returns MISSING for null input', () => {
    expect(formatDate(null)).toBe(MISSING);
  });

  it('formats an ISO date as YYYY.MM.DD', () => {
    expect(formatDate('2024-06-15T14:32:00')).toBe('2024.06.15');
  });
});
