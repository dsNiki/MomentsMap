import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePendingPhoto } from '@/context/PendingPhotoContext';

export default function AddPhotoScreen() {
  const { pendingPhoto, setPendingPhoto } = usePendingPhoto();

  const aspectRatio =
    pendingPhoto && pendingPhoto.width > 0 && pendingPhoto.height > 0
      ? pendingPhoto.width / pendingPhoto.height
      : 4 / 3;

  function handleClose() {
    setPendingPhoto(null); // takarítás bezáráskor
    router.back();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleClose} accessibilityRole="button" accessibilityLabel="Bezárás">
            <ThemedText type="default" style={styles.closeButton}>
              Bezárás
            </ThemedText>
          </Pressable>
          <ThemedText type="smallBold">Fotó hozzáadása</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Képelőnézet vagy placeholder */}
        {pendingPhoto ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: pendingPhoto.uri }}
              style={[styles.preview, { aspectRatio }]}
              contentFit="cover"
              accessibilityLabel="Kiválasztott fotó előnézete"
            />
          </View>
        ) : (
          <View style={styles.placeholder}>
            <ThemedText type="title" style={styles.placeholderText}>
              📷
            </ThemedText>
            <ThemedText type="default" style={styles.placeholderText}>
              Nem érkezett fénykép
            </ThemedText>
          </View>
        )}

        {/* Placeholder – metaadat form ide kerül */}
        <View style={styles.formPlaceholder}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.placeholderText}>
            Metaadat szerkesztő – hamarosan
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
    minWidth: 60,
  },
  headerSpacer: {
    minWidth: 60,
  },
  previewContainer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  preview: {
    width: '100%',
    borderRadius: Spacing.three,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  formPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  placeholderText: {
    textAlign: 'center',
  },
});
