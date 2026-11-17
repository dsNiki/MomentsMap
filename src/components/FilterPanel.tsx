// FilterPanel – alulról felugró szűrőpanel (kategória + dátum intervallum + rádiusz)

import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAreaPick } from '@/context/AreaPickContext';
import { useLocationPick } from '@/context/LocationPickContext';
import { getAllCategories } from '@/db/categoryRepository';
import { Category } from '@/db/types';
import { useFilters } from '@/hooks/useFilters';

const DEFAULT_RADIUS_M = 500;

const RADIUS_PRESETS: { meters: number; label: string }[] = [
  { meters: 250, label: '250 m' },
  { meters: 500, label: '500 m' },
  { meters: 1000, label: '1 km' },
  { meters: 5000, label: '5 km' },
];

export function FilterPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];
  const insets = useSafeAreaInsets();

  const {
    categoryId,
    setCategory,
    dateFrom,
    dateTo,
    setDateRange,
    radiusCenter,
    radiusMeters,
    setRadius,
    polygon,
    setPolygon,
    clearFilters,
    isFiltering,
    filteredPhotos,
  } = useFilters();

  const { setRequest } = useLocationPick();
  const { setRequest: setAreaRequest } = useAreaPick();

  const [categories, setCategories] = useState<Category[]>([]);
  const categoriesLoaded = useRef(false);

  useEffect(() => {
    if (!visible || categoriesLoaded.current) return;

    let active = true;
    categoriesLoaded.current = true;

    getAllCategories()
      .then(rows => {
        if (active) setCategories(rows);
      })
      .catch(() => {
        // Hibát elnyelünk – üres listával működik tovább a panel
        if (active) setCategories([]);
      });

    return () => {
      active = false;
    };
  }, [visible]);

  function handleCategoryPress(id: number) {
    setCategory(categoryId === id ? null : id);
  }

  function openMapPicker() {
    onClose();

    setRequest({
      initial: radiusCenter,
      onPicked: coordinate => setRadius(coordinate, radiusMeters ?? DEFAULT_RADIUS_M),
    });
    router.push('/photo/pick-location');
  }

  function openAreaPicker() {
    onClose();

    setAreaRequest({
      initial: polygon,
      onPicked: setPolygon,
    });
    router.push('/photo/pick-area');
  }

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.backgroundElement, color: colors.text },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Backdrop – a felső üres rész, megnyomva bezár */}
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Bezárás"
        />

        {/* Alulról felugró kártya */}
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.background, paddingBottom: insets.bottom + Spacing.two },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.backgroundSelected }]} />

          <View style={styles.header}>
            <ThemedText type="default" themeColor="textSecondary">
              Filters
            </ThemedText>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Bezárás">
              <ThemedText type="default" style={styles.closeButton}>
                ✕ Close
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Kategória szűrő – chipek */}
            <ThemedText type="small" themeColor="textSecondary">
              Category
            </ThemedText>
            <View style={styles.chipRow}>
              {categories.map(category => {
                const selected = categoryId === category.id;
                return (
                  <Pressable
                    key={category.id}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: selected
                          ? colors.backgroundSelected
                          : colors.backgroundElement,
                      },
                      pressed && styles.pressed,
                    ]}
                    onPress={() => handleCategoryPress(category.id)}
                    accessibilityRole="button"
                    accessibilityLabel={category.name}
                    accessibilityState={{ selected }}
                  >
                    <ThemedText type="small">{category.name}</ThemedText>
                  </Pressable>
                );
              })}
            </View>

            {/* Dátum intervallum – egy későbbi issue-ban natív dátumválasztó lesz helyette */}
            <ThemedText type="small" themeColor="textSecondary">
              Date range
            </ThemedText>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <ThemedText type="small" themeColor="textSecondary">
                  From
                </ThemedText>
                <TextInput
                  style={inputStyle}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  value={dateFrom ?? ''}
                  onChangeText={text => setDateRange(text || null, dateTo)}
                  autoCorrect={false}
                  autoCapitalize="none"
                  accessibilityLabel="Dátum ettől"
                />
              </View>
              <View style={styles.dateField}>
                <ThemedText type="small" themeColor="textSecondary">
                  To
                </ThemedText>
                <TextInput
                  style={inputStyle}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  value={dateTo ?? ''}
                  onChangeText={text => setDateRange(dateFrom, text || null)}
                  autoCorrect={false}
                  autoCapitalize="none"
                  accessibilityLabel="Dátum eddig"
                />
              </View>
            </View>

            {/* Helyszín – középpont a térképes pontválasztóval, rádiusz chipekkel */}
            <ThemedText type="small" themeColor="textSecondary">
              Location
            </ThemedText>

            {radiusCenter ? (
              <ThemedText type="small">
                {radiusCenter.latitude.toFixed(5)}, {radiusCenter.longitude.toFixed(5)}
              </ThemedText>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                No center selected yet
              </ThemedText>
            )}

            <Pressable
              onPress={openMapPicker}
              accessibilityRole="button"
              accessibilityLabel="Középpont kijelölése térképen"
            >
              <ThemedText type="small" style={styles.pickOnMapLabel}>
                Pick center on map
              </ThemedText>
            </Pressable>

            {/* Rádiusz csak középponttal együtt értelmes */}
            {radiusCenter !== null && (
              <>
                <View style={styles.chipRow}>
                  {RADIUS_PRESETS.map(preset => {
                    const selected = radiusMeters === preset.meters;
                    return (
                      <Pressable
                        key={preset.meters}
                        style={({ pressed }) => [
                          styles.chip,
                          {
                            backgroundColor: selected
                              ? colors.backgroundSelected
                              : colors.backgroundElement,
                          },
                          pressed && styles.pressed,
                        ]}
                        onPress={() => setRadius(radiusCenter, preset.meters)}
                        accessibilityRole="button"
                        accessibilityLabel={preset.label}
                        accessibilityState={{ selected }}
                      >
                        <ThemedText type="small">{preset.label}</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  onPress={() => setRadius(null, null)}
                  accessibilityRole="button"
                  accessibilityLabel="Helyszűrő törlése"
                >
                  <ThemedText type="small" style={styles.pickOnMapLabel}>
                    Clear location
                  </ThemedText>
                </Pressable>
              </>
            )}

            {/* Terület – szabadon rajzolt poligon a térképes területválasztóval */}
            <ThemedText type="small" themeColor="textSecondary">
              Area
            </ThemedText>

            {polygon && polygon.length > 0 ? (
              <ThemedText type="small">Area with {polygon.length} points</ThemedText>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                No area selected yet
              </ThemedText>
            )}

            <Pressable
              onPress={openAreaPicker}
              accessibilityRole="button"
              accessibilityLabel="Terület kijelölése térképen"
            >
              <ThemedText type="small" style={styles.pickOnMapLabel}>
                Select area on map
              </ThemedText>
            </Pressable>

            {polygon !== null && polygon.length > 0 && (
              <Pressable
                onPress={() => setPolygon(null)}
                accessibilityRole="button"
                accessibilityLabel="Területszűrő törlése"
              >
                <ThemedText type="small" style={styles.pickOnMapLabel}>
                  Clear area
                </ThemedText>
              </Pressable>
            )}

            {/* Találatok száma */}
            <ThemedText type="small" themeColor="textSecondary">
              {filteredPhotos.length} photo matches
            </ThemedText>
          </ScrollView>

          {/* Alsó gombok */}
          <View style={styles.bottomBar}>
            <Pressable
              style={({ pressed }) => [
                styles.bottomButton,
                { backgroundColor: colors.backgroundElement },
                !isFiltering && styles.inactive,
                pressed && styles.pressed,
              ]}
              onPress={clearFilters}
              accessibilityRole="button"
              accessibilityLabel="Szűrők törlése"
            >
              <ThemedText type="small" style={styles.bottomButtonLabel}>
                Clear filters
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.bottomButton,
                styles.doneButton,
                pressed && styles.pressed,
              ]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Szűrés kész"
            >
              <ThemedText type="small" style={[styles.bottomButtonLabel, styles.doneButtonLabel]}>
                Done
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingTop: Spacing.two,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  closeButton: {
    color: '#208AEF',
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  pickOnMapLabel: {
    color: '#208AEF',
    fontWeight: '600',
  },
  dateField: {
    flex: 1,
    gap: Spacing.one,
  },
  input: {
    height: 36,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  inactive: {
    opacity: 0.5,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  bottomButton: {
    flex: 1,
    height: 44,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: '#3C3C3E',
  },
  bottomButtonLabel: {
    fontWeight: '600',
  },
  doneButtonLabel: {
    color: '#ffffff',
  },
});
