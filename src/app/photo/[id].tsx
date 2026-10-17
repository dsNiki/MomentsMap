import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { Photo } from '@/db/types';
import { usePhotoDetails } from '@/hooks/usePhotoDetails';
import { usePhotos } from '@/hooks/usePhotos';
import { formatDate, MISSING } from '@/utils/formatDate';

export default function PhotoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const photoId = id && /^\d+$/.test(id) ? Number(id) : null;

  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];

  const { photo, loading, failed } = usePhotoDetails(photoId);
  const { deletePhoto } = usePhotos();
  const [deleting, setDeleting] = useState(false);

  const hasCoordinates = photo?.latitude != null && photo?.longitude != null;

  function handleShowOnMap() {
    if (!photo || !hasCoordinates) return;

    router.push({
      pathname: '/map',
      params: {
        focusId: String(photo.id),
        latitude: String(photo.latitude),
        longitude: String(photo.longitude),
      },
    });
  }

  function handleExport() {
    Alert.alert('Export', 'A metaadat-export még nem elérhető.');
  }

  /** Törlés megerősítéssel (FK-26, NFK-10) */
  function handleDelete() {
    if (!photo || deleting) return;

    Alert.alert(
      'Fotó törlése',
      'Biztosan törlöd ezt a fényképet? Az eredeti képfájl a galériában megmarad.',
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deletePhoto(photo.id);
              router.back();
            } catch {
              Alert.alert('Törlés sikertelen', 'A fotó törlése nem sikerült. Próbáld újra.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="default" themeColor="textSecondary">
            Details
          </ThemedText>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Bezárás"
          >
            <ThemedText type="default" style={styles.closeButton}>
              ✕ Close
            </ThemedText>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.textSecondary} />
          </View>
        ) : failed || !photo ? (
          <EmptyState
            icon="⚠️"
            title="A fénykép nem található"
            description="Lehet, hogy törölve lett."
            actionLabel="Vissza"
            onAction={() => router.back()}
          />
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {/* Nagy előnézet */}
              <Image
                source={{ uri: photo.uri }}
                style={[styles.preview, { backgroundColor: colors.backgroundElement }]}
                contentFit="cover"
                accessibilityLabel={photo.title ?? 'Fénykép'}
              />

              {/* Cím */}
              <ThemedText type="default" style={styles.title}>
                {photo.title?.trim() || 'Névtelen fénykép'}
              </ThemedText>

              {/* Technikai adatok két hasábban */}
              <View style={styles.metaGrid}>
                <View style={styles.metaColumn}>
                  <MetaText>{formatDate(photo.created_at)}</MetaText>
                  <MetaText>{formatResolution(photo)}</MetaText>
                  <MetaText>{formatCoordinates(photo)}</MetaText>
                </View>
                <View style={[styles.metaColumn, styles.metaColumnRight]}>
                  <MetaText>{formatCameraSettings(photo)}</MetaText>
                  <MetaText>{formatBearing(photo)}</MetaText>
                </View>
              </View>

              {/* Leírás */}
              {photo.description?.trim() ? (
                <ThemedText type="small" style={styles.description}>
                  {photo.description}
                </ThemedText>
              ) : null}

              {/* Címkék */}
              {photo.tags && photo.tags.length > 0 ? (
                <View style={styles.tagRow}>
                  {photo.tags.map(tag => (
                    <View
                      key={tag.id}
                      style={[styles.tagChip, { borderColor: colors.backgroundSelected }]}
                    >
                      <ThemedText type="small">{tag.name}</ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>

            {/* Műveletek */}
            <View style={styles.bottomBar}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: colors.backgroundElement },
                  !hasCoordinates && styles.actionDisabled,
                  pressed && hasCoordinates && styles.pressed,
                ]}
                onPress={handleShowOnMap}
                disabled={!hasCoordinates}
                accessibilityRole="button"
                accessibilityLabel="Megjelenítés a térképen"
                accessibilityState={{ disabled: !hasCoordinates }}
              >
                <ThemedText type="small" style={styles.actionLabel}>
                  Show on map
                </ThemedText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: colors.backgroundElement },
                  pressed && styles.pressed,
                ]}
                onPress={handleExport}
                accessibilityRole="button"
                accessibilityLabel="Metaadatok exportálása"
              >
                <ThemedText type="small" style={styles.actionLabel}>
                  Export
                </ThemedText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.deleteButton,
                  pressed && styles.pressed,
                ]}
                onPress={handleDelete}
                disabled={deleting}
                accessibilityRole="button"
                accessibilityLabel="Fénykép törlése"
                accessibilityState={{ disabled: deleting, busy: deleting }}
              >
                <ThemedText type="small" style={[styles.actionLabel, styles.deleteLabel]}>
                  {deleting ? '...' : 'Delete'}
                </ThemedText>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

/** Egy sor a technikai adatok közül, másodlagos színnel */
function MetaText({ children }: { children: React.ReactNode }) {
  return (
    <ThemedText type="small" themeColor="textSecondary">
      {children}
    </ThemedText>
  );
}

// --- Formázó segédfüggvények ---

function formatResolution(photo: Photo): string {
  if (!photo.width || !photo.height) return MISSING;
  return `${photo.width}x${photo.height} px`;
}

function formatCoordinates(photo: Photo): string {
  if (photo.latitude == null || photo.longitude == null) return 'Nincs helyadat';
  return `${photo.latitude.toFixed(6)}, ${photo.longitude.toFixed(6)}`;
}

function formatCameraSettings(photo: Photo): string {
  const parts: string[] = [];
  if (photo.aperture != null) parts.push(`f/${photo.aperture}`);
  if (photo.shutter_speed) parts.push(`${photo.shutter_speed}s`);
  if (photo.iso != null) parts.push(`ISO${photo.iso}`);

  return parts.length > 0 ? parts.join(', ') : MISSING;
}

function formatBearing(photo: Photo): string {
  if (photo.bearing == null) return MISSING;
  return `${photo.bearing}° irány`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  closeButton: {
    color: '#208AEF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Spacing.two,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 18,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  metaColumn: {
    flex: 1,
    gap: Spacing.one,
  },
  metaColumnRight: {
    alignItems: 'flex-end',
  },
  description: {
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tagChip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    borderWidth: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionDisabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
  actionLabel: {
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#3C3C3E',
  },
  deleteLabel: {
    color: '#ffffff',
  },
});
