import { Modal, Pressable, StyleSheet, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { usePhotoPicker } from '@/hooks/usePhotoPicker';

interface PhotoPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Dialog címe – alapértelmezés: "New Photo" */
  title?: string;
  /** Egyedi kezelők (pl. kép cseréje a szerkesztőben); ha nincs megadva, a szerkesztőt nyitja meg */
  onCamera?: () => Promise<void> | void;
  onGallery?: () => Promise<void> | void;
}

export function PhotoPickerSheet({
  visible,
  onClose,
  title = 'New Photo',
  onCamera,
  onGallery,
}: PhotoPickerSheetProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];
  const { openCamera, openGallery } = usePhotoPicker();

  async function handleCamera() {
    onClose();
    await (onCamera ?? openCamera)();
  }

  async function handleGallery() {
    onClose();
    await (onGallery ?? openGallery)();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Félig áttetsző overlay – megnyomva bezárja */}
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Dialog kártya – megnyomás ne terjedjen az overlay-re */}
        <Pressable style={[styles.dialog, { backgroundColor: colors.background }]}>
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>

          <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
            You can choose an existing image from your gallery or take one with the camera.
          </ThemedText>

          {/* Camera + Gallery gombok */}
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.backgroundElement },
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleCamera}
              accessibilityRole="button"
              accessibilityLabel="Kamera megnyitása"
            >
              <ThemedText type="small" style={styles.actionLabel}>
                Camera
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.backgroundElement },
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleGallery}
              accessibilityRole="button"
              accessibilityLabel="Galéria megnyitása"
            >
              <ThemedText type="small" style={styles.actionLabel}>
                Gallery
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  dialog: {
    width: '100%',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
    // Megakadályozza, hogy a kártya megnyomása bezárja a modalt
    pointerEvents: 'box-none',
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  actionLabel: {
    fontWeight: '600',
  },
});
