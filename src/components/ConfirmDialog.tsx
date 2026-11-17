import { Modal, Pressable, StyleSheet, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Mégse',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {/* Félig áttetsző overlay – megnyomva elveti */}
      <Pressable style={styles.overlay} onPress={onCancel}>
        {/* Dialog kártya – megnyomás ne terjedjen az overlay-re */}
        <Pressable style={[styles.dialog, { backgroundColor: colors.background }]}>
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>

          {message ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
              {message}
            </ThemedText>
          ) : null}

          {/* Mégse + megerősítés */}
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.backgroundElement },
                pressed && styles.pressed,
              ]}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <ThemedText type="small" style={styles.actionLabel}>
                {cancelLabel}
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                destructive
                  ? styles.destructiveButton
                  : { backgroundColor: colors.backgroundElement },
                pressed && styles.pressed,
              ]}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <ThemedText
                type="small"
                style={[styles.actionLabel, destructive && styles.destructiveLabel]}
              >
                {confirmLabel}
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
  message: {
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
  pressed: {
    opacity: 0.7,
  },
  actionLabel: {
    fontWeight: '600',
  },
  destructiveButton: {
    backgroundColor: '#E53935',
  },
  destructiveLabel: {
    color: '#ffffff',
  },
});
