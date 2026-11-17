// FilterContext – szűrési állapot kezelése (tagek, kategória, dátum, geo)

import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

import { Coordinate } from '@/services/geoService';

export interface FilterState {
  query: string;
  categoryId: number | null;
  dateFrom: string | null;
  dateTo: string | null;
  radiusCenter: Coordinate | null;
  radiusMeters: number | null;
  polygon: Coordinate[] | null;
}

export type FilterAction =
  | { type: 'SET_QUERY'; query: string }
  | { type: 'SET_CATEGORY'; categoryId: number | null }
  | { type: 'SET_DATE_RANGE'; dateFrom: string | null; dateTo: string | null }
  | { type: 'SET_RADIUS'; center: Coordinate | null; meters: number | null }
  | { type: 'SET_POLYGON'; polygon: Coordinate[] | null }
  | { type: 'CLEAR' };

const initialState: FilterState = {
  query: '',
  categoryId: null,
  dateFrom: null,
  dateTo: null,
  radiusCenter: null,
  radiusMeters: null,
  polygon: null,
};

export function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.query };

    case 'SET_CATEGORY':
      return { ...state, categoryId: action.categoryId };

    case 'SET_DATE_RANGE':
      return { ...state, dateFrom: action.dateFrom, dateTo: action.dateTo };

    case 'SET_RADIUS':
      return { ...state, radiusCenter: action.center, radiusMeters: action.meters };

    case 'SET_POLYGON':
      return { ...state, polygon: action.polygon };

    case 'CLEAR':
      return initialState;

    default:
      return state;
  }
}

interface FilterContextValue extends FilterState {
  setQuery: (_query: string) => void;
  setCategory: (_categoryId: number | null) => void;
  setDateRange: (_from: string | null, _to: string | null) => void;
  setRadius: (_center: Coordinate | null, _meters: number | null) => void;
  setPolygon: (_polygon: Coordinate[] | null) => void;
  clearFilters: () => void;
  /** Igaz, ha legalább egy szűrő aktív */
  isFiltering: boolean;
}

const FilterContext = createContext<FilterContextValue | null>(null);


export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(filterReducer, initialState);

  const setQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_QUERY', query });
  }, []);

  const setCategory = useCallback((categoryId: number | null) => {
    dispatch({ type: 'SET_CATEGORY', categoryId });
  }, []);

  const setDateRange = useCallback((from: string | null, to: string | null) => {
    dispatch({ type: 'SET_DATE_RANGE', dateFrom: from, dateTo: to });
  }, []);

  const setRadius = useCallback((center: Coordinate | null, meters: number | null) => {
    dispatch({ type: 'SET_RADIUS', center, meters });
  }, []);

  const setPolygon = useCallback((polygon: Coordinate[] | null) => {
    dispatch({ type: 'SET_POLYGON', polygon });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const isFiltering =
    state.query.trim() !== '' ||
    state.categoryId !== null ||
    state.dateFrom !== null ||
    state.dateTo !== null ||
    state.radiusCenter !== null ||
    state.radiusMeters !== null ||
    state.polygon !== null;

  const value = useMemo(
    () => ({
      ...state,
      setQuery,
      setCategory,
      setDateRange,
      setRadius,
      setPolygon,
      clearFilters,
      isFiltering,
    }),
    [state, setQuery, setCategory, setDateRange, setRadius, setPolygon, clearFilters, isFiltering],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilterContext(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return ctx;
}
