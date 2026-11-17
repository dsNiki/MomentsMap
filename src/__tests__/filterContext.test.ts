// filterContext unit tesztek – a filterReducer állapotátmenetei

import { FilterState, filterReducer } from '@/context/FilterContext';
import { Coordinate } from '@/services/geoService';

const initialState: FilterState = {
  query: '',
  categoryId: null,
  dateFrom: null,
  dateTo: null,
  radiusCenter: null,
  radiusMeters: null,
  polygon: null,
};

const center: Coordinate = { latitude: 47.5, longitude: 19.05 };

const triangle: Coordinate[] = [
  { latitude: 47, longitude: 19 },
  { latitude: 48, longitude: 19 },
  { latitude: 48, longitude: 20 },
];

describe('filterReducer', () => {
  it('sets the query', () => {
    const next = filterReducer(initialState, { type: 'SET_QUERY', query: 'naplemente' });
    expect(next.query).toBe('naplemente');
    expect(next.categoryId).toBeNull();
  });

  it('sets the category', () => {
    const next = filterReducer(initialState, { type: 'SET_CATEGORY', categoryId: 3 });
    expect(next.categoryId).toBe(3);
  });

  it('clears the category when null is given', () => {
    const withCategory = filterReducer(initialState, { type: 'SET_CATEGORY', categoryId: 3 });
    const next = filterReducer(withCategory, { type: 'SET_CATEGORY', categoryId: null });
    expect(next.categoryId).toBeNull();
  });

  it('sets both ends of the date range', () => {
    const next = filterReducer(initialState, {
      type: 'SET_DATE_RANGE',
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
    });
    expect(next.dateFrom).toBe('2024-01-01');
    expect(next.dateTo).toBe('2024-12-31');
  });

  it('sets the radius center and distance', () => {
    const next = filterReducer(initialState, { type: 'SET_RADIUS', center, meters: 1500 });
    expect(next.radiusCenter).toEqual(center);
    expect(next.radiusMeters).toBe(1500);
  });

  it('sets the polygon', () => {
    const next = filterReducer(initialState, { type: 'SET_POLYGON', polygon: triangle });
    expect(next.polygon).toEqual(triangle);
  });

  it('keeps the other fields untouched when one is set', () => {
    const withQuery = filterReducer(initialState, { type: 'SET_QUERY', query: 'balaton' });
    const next = filterReducer(withQuery, { type: 'SET_CATEGORY', categoryId: 7 });
    expect(next.query).toBe('balaton');
    expect(next.categoryId).toBe(7);
  });

  it('resets every field on CLEAR', () => {
    let state = filterReducer(initialState, { type: 'SET_QUERY', query: 'balaton' });
    state = filterReducer(state, { type: 'SET_CATEGORY', categoryId: 2 });
    state = filterReducer(state, {
      type: 'SET_DATE_RANGE',
      dateFrom: '2024-01-01',
      dateTo: '2024-02-01',
    });
    state = filterReducer(state, { type: 'SET_RADIUS', center, meters: 800 });
    state = filterReducer(state, { type: 'SET_POLYGON', polygon: triangle });

    expect(filterReducer(state, { type: 'CLEAR' })).toEqual(initialState);
  });

  it('does not mutate the state it is given', () => {
    const state: FilterState = { ...initialState };
    const snapshot = JSON.stringify(state);

    filterReducer(state, { type: 'SET_QUERY', query: 'hegyek' });
    filterReducer(state, { type: 'SET_CATEGORY', categoryId: 1 });
    filterReducer(state, { type: 'SET_DATE_RANGE', dateFrom: '2024-01-01', dateTo: null });
    filterReducer(state, { type: 'SET_RADIUS', center, meters: 500 });
    filterReducer(state, { type: 'SET_POLYGON', polygon: triangle });
    filterReducer(state, { type: 'CLEAR' });

    expect(JSON.stringify(state)).toBe(snapshot);
  });
});
