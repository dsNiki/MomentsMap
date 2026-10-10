import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PhotoPickerSheet } from '@/components/PhotoPickerSheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ViewToggle } from '@/components/ViewToggle';
import { Colors, Spacing } from '@/constants/theme';

export default function ListScreen() {
  const [pickerVisible, setPickerVisible] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];

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

        {/* Lista placeholder – ide kerül a fotórács */}
        <View style={styles.content}>
          <ThemedText type="smallBold" style={styles.resultsTitle}>
            Results
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.placeholderText}>
            Lista nézet
          </ThemedText>
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
    marginBottom: Spacing.two,
  },
  placeholderText: {
    textAlign: 'center',
    marginTop: Spacing.five,
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
