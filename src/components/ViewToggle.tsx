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
        style={[styles.button, isMap && styles.buttonActive]}
        onPress={() => router.replace('/map')}
        accessibilityRole="button"
        accessibilityLabel="Térkép nézet"
        accessibilityState={{ selected: isMap }}
      >
        <ThemedText
          type="small"
          style={[styles.label, { color: isMap ? colors.background : colors.text }]}
        >
          Map
        </ThemedText>
      </Pressable>

      <Pressable
        style={[styles.button, isList && styles.buttonActive]}
        onPress={() => router.replace('/list')}
        accessibilityRole="button"
        accessibilityLabel="Lista nézet"
        accessibilityState={{ selected: isList }}
      >
        <ThemedText
          type="small"
          style={[styles.label, { color: isList ? colors.background : colors.text }]}
        >
          List
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Spacing.five,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  button: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  buttonActive: {
    backgroundColor: '#3C3C3E', // sötét aktív pill – light és dark módban is jól néz ki
  },
  label: {
    fontWeight: '600',
  },
});
