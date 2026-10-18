import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PhotoMarker } from '@/components/PhotoMarker';
import { PhotoPickerSheet } from '@/components/PhotoPickerSheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ViewToggle } from '@/components/ViewToggle';
import { Colors, Spacing } from '@/constants/theme';
import { Photo } from '@/db/types';
import { usePhotos } from '@/hooks/usePhotos';

const FALLBACK_REGION: Region = {
  latitude: 47.4979,
  longitude: 19.0402,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

function hasCoordinates(photo: Photo): boolean {
  return photo.latitude != null && photo.longitude != null;
}

function regionForPhotos(photos: Photo[]): Region {
  if (photos.length === 0) return FALLBACK_REGION;

  const latitudes = photos.map(p => p.latitude as number);
  const longitudes = photos.map(p => p.longitude as number);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.01),
    longitudeDelta: Math.max((maxLon - minLon) * 1.5, 0.01),
  };
}

export default function MapScreen() {
  const [pickerVisible, setPickerVisible] = useState(false);

  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];

  const { focusId, latitude, longitude } = useLocalSearchParams<{
    focusId?: string;
    latitude?: string;
    longitude?: string;
  }>();

  const { photos, loading } = usePhotos();
  const geotagged = photos.filter(hasCoordinates);

  const mapRef = useRef<MapView | null>(null);
  const didFit = useRef(false);

  const focusLat = latitude ? Number(latitude) : NaN;
  const focusLon = longitude ? Number(longitude) : NaN;
  const hasFocus = Number.isFinite(focusLat) && Number.isFinite(focusLon);

  const initialRegion: Region = hasFocus
    ? { latitude: focusLat, longitude: focusLon, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : FALLBACK_REGION;

  useEffect(() => {
    if (hasFocus || didFit.current || geotagged.length === 0) return;

    didFit.current = true;
    mapRef.current?.animateToRegion(regionForPhotos(geotagged), 400);
  }, [geotagged, hasFocus]);

  const showEmptyOverlay = !loading && geotagged.length === 0;

  return (
    <ThemedView style={styles.container}>
      <Image
        source={require('@/assets/images/background_map.png')}
        style={styles.background}
        contentFit="cover"
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TextInput
            style={[
              styles.searchBar,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            placeholder="Search..."
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Search"
          />
          <ViewToggle />
        </View>

        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
          >
            {geotagged.map(photo => (
              <PhotoMarker
                key={photo.id}
                photo={photo}
                selected={focusId === String(photo.id)}
                onPress={() => router.push(`/photo/${photo.id}`)}
              />
            ))}
          </MapView>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={colors.textSecondary} />
            </View>
          )}

          {showEmptyOverlay && (
            <View style={styles.emptyOverlay} pointerEvents="box-none">
              <View style={[styles.emptyCard, { backgroundColor: colors.background }]}>
                <ThemedText type="small" style={styles.emptyTitle}>
                  No photos with coordinates
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                  Add a photo, or set a location for a saved photo.
                </ThemedText>
                <Pressable
                  style={({ pressed }) => [
                    styles.emptyAction,
                    { backgroundColor: colors.backgroundElement },
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setPickerVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Add photo"
                >
                  <ThemedText type="small" style={styles.emptyActionLabel}>
                    Add photo
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.filtersButton, { backgroundColor: colors.backgroundElement }]}
            accessibilityRole="button"
            accessibilityLabel="Filters"
          >
            <ThemedText type="small">Filters</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.cameraButton, { backgroundColor: colors.backgroundElement }]}
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Add photo"
          >
            <Image
              source={require('@/assets/images/camera_icon.png')}
              style={styles.cameraIcon}
              contentFit="contain"
              tintColor={colors.text}
            />
          </Pressable>
        </View>
      </SafeAreaView>

      <PhotoPickerSheet visible={pickerVisible} onClose={() => setPickerVisible(false)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.18,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  searchBar: {
    flex: 1,
    height: 36,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  mapWrapper: {
    flex: 1,
    marginHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
  },
  emptyOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  emptyCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
    alignItems: 'center',
  },
  emptyTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
  },
  emptyActionLabel: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  filtersButton: {
    flex: 1,
    height: 44,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    width: 24,
    height: 24,
  },
});
