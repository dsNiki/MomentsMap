import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

interface EmptyStateProps {
  /** Nagy, dekoratív ikon (emoji) */
  icon?: string;
  title: string;
  description?: string;
  /** Elsődleges művelet; ha nincs megadva, a gomb nem jelenik meg */
  actionLabel?: string;
  onAction?: () => void;
}

/** Üres állapot: nincs találat vagy nincs még adat */
export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];

  return (
    <View style={styles.container}>
      {icon && <ThemedText style={styles.icon}>{icon}</ThemedText>}

      <ThemedText type="default" style={styles.title}>
        {title}
      </ThemedText>

      {description && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
          {description}
        </ThemedText>
      )}

      {actionLabel && onAction && (
        <Pressable
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: colors.backgroundElement },
            pressed && styles.pressed,
          ]}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <ThemedText type="small" style={styles.actionLabel}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  icon: {
    fontSize: 48,
    lineHeight: 56,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
  action: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
  },
  pressed: {
    opacity: 0.7,
  },
  actionLabel: {
    fontWeight: '600',
  },
});
