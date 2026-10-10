import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

export function ViewToggle() {
  const pathname = usePathname();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];

  const isMap = pathname === '/map';
  const isList = pathname === '/list';

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundElement }]}>
      <Pressable
        style={[styles.button, isMap && { backgroundColor: colors.background }]}
        onPress={() => router.replace('/map')}
        accessibilityRole="button"
        accessibilityLabel="Térkép nézet"
        accessibilityState={{ selected: isMap }}
      >
        <ThemedText
          type="small"
          style={[styles.label, { color: isMap ? colors.text : colors.textSecondary }]}
        >
          Térkép
        </ThemedText>
      </Pressable>

      <Pressable
        style={[styles.button, isList && { backgroundColor: colors.background }]}
        onPress={() => router.replace('/list')}
        accessibilityRole="button"
        accessibilityLabel="Lista nézet"
        accessibilityState={{ selected: isList }}
      >
        <ThemedText
          type="small"
          style={[styles.label, { color: isList ? colors.text : colors.textSecondary }]}
        >
          Lista
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Spacing.four,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  button: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  label: {
    fontWeight: '600',
  },
});
