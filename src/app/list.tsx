import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ViewToggle } from '@/components/ViewToggle';
import { Spacing } from '@/constants/theme';

export default function ListScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ViewToggle />
        </View>

        {/* Placeholder – fotólista ide kerül */}
        <View style={styles.placeholder}>
          <ThemedText type="title" style={styles.placeholderText}>
            📋
          </ThemedText>
          <ThemedText type="default" style={styles.placeholderText}>
            Lista nézet
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
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
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
