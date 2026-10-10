import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function AddPhotoScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Bezárás"
          >
            <ThemedText type="default" style={styles.closeButton}>
              Bezárás
            </ThemedText>
          </Pressable>
          <ThemedText type="smallBold">Fotó hozzáadása</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Placeholder – fotó hozzáadás form ide kerül */}
        <View style={styles.placeholder}>
          <ThemedText type="title" style={styles.placeholderText}>
            📷
          </ThemedText>
          <ThemedText type="default" style={styles.placeholderText}>
            Új fotó hozzáadása
          </ThemedText>
        </View>
      </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  closeButton: {
    color: '#208AEF',
  },
  headerSpacer: {
    width: 60,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  placeholderText: {
    textAlign: 'center',
  },
});
