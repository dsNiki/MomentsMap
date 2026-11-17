// geoService – Haversine távolságszámítás és pont-poligon algoritmus

import { Photo } from '@/db/types';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_M = 6371000;

const EPSILON = 1e-9;


export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}


export function filterByRadius(photos: Photo[], center: Coordinate, radiusMeters: number): Photo[] {
  return photos.filter(photo => {
    if (photo.latitude === null || photo.longitude === null) return false;
    const distance = haversineDistance(
      center.latitude,
      center.longitude,
      photo.latitude,
      photo.longitude,
    );
    return distance <= radiusMeters;
  });
}


export function isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
  if (polygon.length < 3) return false;

  // Határvizsgálat: él vagy csúcs esetén azonnal bent
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (isOnSegment(point, polygon[j], polygon[i])) return true;
  }

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i].latitude;
    const xi = polygon[i].longitude;
    const yj = polygon[j].latitude;
    const xj = polygon[j].longitude;

    const intersects =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}


export function filterByPolygon(photos: Photo[], polygon: Coordinate[]): Photo[] {
  if (polygon.length < 3) return [];

  return photos.filter(photo => {
    if (photo.latitude === null || photo.longitude === null) return false;
    return isPointInPolygon({ latitude: photo.latitude, longitude: photo.longitude }, polygon);
  });
}


function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function isOnSegment(point: Coordinate, a: Coordinate, b: Coordinate): boolean {
  const cross =
    (b.longitude - a.longitude) * (point.latitude - a.latitude) -
    (b.latitude - a.latitude) * (point.longitude - a.longitude);

  if (Math.abs(cross) > EPSILON) return false;

  const withinLat =
    point.latitude >= Math.min(a.latitude, b.latitude) - EPSILON &&
    point.latitude <= Math.max(a.latitude, b.latitude) + EPSILON;
  const withinLon =
    point.longitude >= Math.min(a.longitude, b.longitude) - EPSILON &&
    point.longitude <= Math.max(a.longitude, b.longitude) + EPSILON;

  return withinLat && withinLon;
}
