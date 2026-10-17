import { useState } from 'react';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import MapView, {
  MapPressEvent,
  Marker,
  MarkerDragStartEndEvent,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  /** Kezdeti pont – ha van korábbi koordináta, oda pozicionál és markert tesz */
  initialCoordinate?: Coordinate | null;
  /** Megszakítás: a hívó nem módosítja a korábbi helyadatot */
  onCancel: () => void;
  /** Megerősítés: a kijelölt pont átadása a hívónak */
  onConfirm: (_coordinate: Coordinate) => void;
}

/** Budapest – kezdő nézet, ha nincs korábbi koordináta */
const FALLBACK_REGION = {
  latitude: 47.4979,
  longitude: 19.0402,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

/**
 * Térképes pontválasztó felület.
 *
 * Saját Stack képernyőn renderelődik (lásd app/photo/pick-location.tsx).
 * Szándékosan nem modálban: Androidon a Google Maps nézet natív modál
 * konténerben nem rajzolja ki a térképet, csak üres felület látszik.
 */
export function LocationPicker({ initialCoordinate, onCancel, onConfirm }: LocationPickerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];
  const insets = useSafeAreaInsets();

  // A kijelölt pont; null amíg a felhasználó nem koppintott és nem volt kezdőérték
  const [selected, setSelected] = useState<Coordinate | null>(initialCoordinate ?? null);

  // A térkép kezdő nézete: a kapott koordináta köré szűk, egyébként országos
  const initialRegion = initialCoordinate
    ? { ...initialCoordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : FALLBACK_REGION;

  function handleMapPress(event: MapPressEvent) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelected({ latitude, longitude });
  }

  function handleMarkerDragEnd(event: MarkerDragStartEndEvent) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelected({ latitude, longitude });
  }

  function handleConfirm() {
    if (!selected) return; // Confirm csak kijelölt ponttal aktív
    onConfirm(selected);
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
        <ThemedText type="smallBold">Pick location</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Térkép */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onPress={handleMapPress}
      >
        {selected && (
          <Marker
            coordinate={selected}
            draggable
            onDragEnd={handleMarkerDragEnd}
            title="Kijelölt hely"
          />
        )}
      </MapView>

      {/* Alsó sáv: kijelölt koordináta + Confirm */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.readout}>
          {selected ? (
            <ThemedText type="small">
              {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
            </ThemedText>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              Koppints a térképre a hely kijelöléséhez
            </ThemedText>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.confirmButton,
            !selected && styles.confirmButtonDisabled,
            pressed && selected && { opacity: 0.7 },
          ]}
          onPress={handleConfirm}
          disabled={!selected}
          accessibilityRole="button"
          accessibilityLabel="Hely megerősítése"
          accessibilityState={{ disabled: !selected }}
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
