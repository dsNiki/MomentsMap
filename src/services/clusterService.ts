import { Region } from 'react-native-maps';

import { Photo } from '@/db/types';

export interface PhotoMarkerData {
  type: 'photo';
  key: string;
  latitude: number;
  longitude: number;
  photo: Photo;
}

export interface ClusterMarkerData {
  type: 'cluster';
  key: string;
  latitude: number;
  longitude: number;
  count: number;
  photos: Photo[];
}

export type MarkerData = PhotoMarkerData | ClusterMarkerData;

interface LocatedPhoto {
  photo: Photo;
  latitude: number;
  longitude: number;
}

const GRID_CELLS = 8;
const MIN_CELL_SIZE = 0.00001;
const DEFAULT_PADDING = 1.6;
const DEFAULT_MIN_DELTA = 0.005;

export function locatedPhotos(photos: Photo[]): LocatedPhoto[] {
  const result: LocatedPhoto[] = [];

  for (const photo of photos) {
    if (photo.latitude != null && photo.longitude != null) {
      result.push({ photo, latitude: photo.latitude, longitude: photo.longitude });
    }
  }
  return result;
}

export function prepareMarkers(photos: Photo[], region: Region): MarkerData[] {
  const located = locatedPhotos(photos);
  if (located.length === 0) return [];

  const cellLatitude = Math.max(region.latitudeDelta / GRID_CELLS, MIN_CELL_SIZE);
  const cellLongitude = Math.max(region.longitudeDelta / GRID_CELLS, MIN_CELL_SIZE);

  const groups = new Map<string, LocatedPhoto[]>();

  for (const item of located) {
    const row = Math.floor(item.latitude / cellLatitude);
    const column = Math.floor(item.longitude / cellLongitude);
    const cellKey = `${row}:${column}`;

    const group = groups.get(cellKey);
    if (group) {
      group.push(item);
    } else {
      groups.set(cellKey, [item]);
    }
  }

  const markers: MarkerData[] = [];

  for (const [cellKey, group] of groups) {
    if (group.length === 1) {
      const single = group[0];
      markers.push({
        type: 'photo',
        key: `photo-${single.photo.id}`,
        latitude: single.latitude,
        longitude: single.longitude,
        photo: single.photo,
      });
      continue;
    }

    markers.push({
      type: 'cluster',
      key: `cluster-${cellKey}-${group.length}`,
      latitude: average(group.map(item => item.latitude)),
      longitude: average(group.map(item => item.longitude)),
      count: group.length,
      photos: group.map(item => item.photo),
    });
  }

  return markers;
}

export function boundsRegion(
  photos: Photo[],
  fallback: Region,
  padding = DEFAULT_PADDING,
  minDelta = DEFAULT_MIN_DELTA,
): Region {
  const located = locatedPhotos(photos);
  if (located.length === 0) return fallback;

  const latitudes = located.map(item => item.latitude);
  const longitudes = located.map(item => item.longitude);

  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max((maxLatitude - minLatitude) * padding, minDelta),
    longitudeDelta: Math.max((maxLongitude - minLongitude) * padding, minDelta),
  };
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
