import { useState } from 'react';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import MapView, {
  MapPressEvent,
  Marker,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { Coordinate } from '@/services/geoService';

interface AreaPickerProps {
  initialPolygon?: Coordinate[] | null;
  onCancel: () => void;
  onConfirm: (_polygon: Coordinate[]) => void;
}

const FALLBACK_REGION = {
  latitude: 47.4979,
  longitude: 19.0402,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const MIN_POLYGON_POINTS = 3;


export function AreaPicker({ initialPolygon, onCancel, onConfirm }: AreaPickerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];
  const insets = useSafeAreaInsets();

  const [points, setPoints] = useState<Coordinate[]>(initialPolygon ?? []);

  const initialRegion =
    initialPolygon && initialPolygon.length > 0
      ? {
          latitude:
            initialPolygon.reduce((sum, point) => sum + point.latitude, 0) / initialPolygon.length,
          longitude:
            initialPolygon.reduce((sum, point) => sum + point.longitude, 0) / initialPolygon.length,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
      : FALLBACK_REGION;

  const canConfirm = points.length >= MIN_POLYGON_POINTS;

  function handleMapPress(event: MapPressEvent) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPoints(current => [...current, { latitude, longitude }]);
  }

  function handleUndo() {
    setPoints(current => current.slice(0, -1));
  }

  function handleClear() {
    setPoints([]);
  }

  function handleConfirm() {
    if (!canConfirm) return; // Confirm csak legalább három ponttal aktív
    onConfirm(points);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel="Mégse">
          <ThemedText type="default" style={styles.cancelLabel}>
            Cancel
          </ThemedText>
        </Pressable>
        <ThemedText type="smallBold">Select area</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Térkép */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onPress={handleMapPress}
      >
        {points.map((point, index) => (
          <Marker
            key={`${point.latitude},${point.longitude},${index}`}
            coordinate={point}
            anchor={{ x: 0.5, y: 0.5 }}
            title={`${index + 1}. pont`}
          >
            <View style={styles.pointBadge}>
              <ThemedText type="small" style={styles.pointBadgeLabel}>
                {index + 1}
              </ThemedText>
            </View>
          </Marker>
        ))}

        {/* Három pont alatt még nincs terület, de a szakasz jelzi a haladást */}
        {points.length === 2 && (
          <Polyline coordinates={points} strokeWidth={2} strokeColor="#E53935" />
        )}

        {points.length >= MIN_POLYGON_POINTS && (
          <Polygon
            coordinates={points}
            strokeWidth={2}
            strokeColor="#E53935"
            fillColor="rgba(229, 57, 53, 0.2)"
          />
        )}
      </MapView>

      {/* Alsó sáv: Undo / Clear / kijelölés állapota + Confirm */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.two }]}>
        {points.length > 0 && (
          <>
            <Pressable
              onPress={handleUndo}
              accessibilityRole="button"
              accessibilityLabel="Utolsó pont visszavonása"
            >
              <ThemedText type="small" style={styles.actionLabel}>
                Undo
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={handleClear}
              accessibilityRole="button"
              accessibilityLabel="Terület törlése"
            >
              <ThemedText type="small" style={styles.actionLabel}>
                Clear
              </ThemedText>
            </Pressable>
          </>
        )}

        <View style={styles.readout}>
          {canConfirm ? (
            <ThemedText type="small">{points.length} points</ThemedText>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              {points.length} points – koppints legalább 3 pontot a térképen
            </ThemedText>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.confirmButton,
            !canConfirm && styles.confirmButtonDisabled,
            pressed && canConfirm && { opacity: 0.7 },
          ]}
          onPress={handleConfirm}
          disabled={!canConfirm}
          accessibilityRole="button"
          accessibilityLabel="Terület megerősítése"
          accessibilityState={{ disabled: !canConfirm }}
        >
          <ThemedText type="small" style={styles.confirmLabel}>
            Confirm
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  cancelLabel: {
    color: '#208AEF',
    minWidth: 60,
  },
  headerSpacer: {
    minWidth: 60,
  },
  map: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  actionLabel: {
    color: '#208AEF',
    fontWeight: '600',
  },
  pointBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointBadgeLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
  readout: {
    flex: 1,
  },
  confirmButton: {
    height: 44,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
    backgroundColor: '#3C3C3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
