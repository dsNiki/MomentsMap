import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PhotoGridItem } from '@/components/PhotoGridItem';
import { PhotoPickerSheet } from '@/components/PhotoPickerSheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ViewToggle } from '@/components/ViewToggle';
import { Colors, Spacing } from '@/constants/theme';
import { usePhotos } from '@/hooks/usePhotos';

const COLUMNS = 3;

export default function ListScreen() {
  const [pickerVisible, setPickerVisible] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];
  const { width } = useWindowDimensions();

  const { photos, loading, failed } = usePhotos();

  // Fix elemszélesség, hogy az utolsó, nem teli sor elemei se nyúljanak meg
  const itemSize = (width - 2 * Spacing.three - (COLUMNS - 1) * Spacing.two) / COLUMNS;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header: Search + Toggle */}
        <View style={styles.header}>
          <TextInput
            style={[
              styles.searchBar,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            placeholder="Search..."
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Keresés"
          />
          <ViewToggle />
        </View>

        {/* Fotórács */}
        <View style={styles.content}>
          <ThemedText type="smallBold" style={styles.resultsTitle}>
            Results
          </ThemedText>
          <View style={[styles.titleRule, { backgroundColor: colors.backgroundSelected }]} />

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.textSecondary} />
            </View>
          ) : failed ? (
            <EmptyState
              icon="⚠️"
              title="A fotók betöltése nem sikerült"
              description="Lépj ki a nézetből és gyere vissza az újrapróbálkozáshoz."
            />
          ) : (
            <FlatList
              data={photos}
              keyExtractor={item => String(item.id)}
              numColumns={COLUMNS}
              renderItem={({ item }) => <PhotoGridItem photo={item} size={itemSize} />}
              columnWrapperStyle={styles.row}
              contentContainerStyle={photos.length === 0 ? styles.emptyContent : styles.gridContent}
              ListEmptyComponent={
                <EmptyState
                  icon="🖼️"
                  title="Még nincs mentett fénykép"
                  description="Adj hozzá egy fényképet a kamerával vagy a galériából."
                  actionLabel="Fénykép hozzáadása"
                  onAction={() => setPickerVisible(true)}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Alsó sáv: Filters + kameraikon */}
        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.filtersButton, { backgroundColor: colors.backgroundElement }]}
            accessibilityRole="button"
            accessibilityLabel="Szűrők"
          >
            <ThemedText type="small">Filters</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.cameraButton, { backgroundColor: colors.backgroundElement }]}
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Fotó hozzáadása"
          >
            <ThemedText type="default" style={styles.cameraIcon}>
              📷
            </ThemedText>
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  resultsTitle: {
    fontSize: 18,
  },
  titleRule: {
    height: 1,
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    gap: Spacing.two,
  },
  gridContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  emptyContent: {
    flexGrow: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    paddingTop: Spacing.one,
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
    fontSize: 20,
    lineHeight: 24,
  },
});
