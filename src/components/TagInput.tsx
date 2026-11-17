import { useState } from 'react';
import {
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  useColorScheme,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

interface TagInputProps {
  /** A már rögzített címkék */
  value: string[];
  onChange: (_tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder = 'Tags...' }: TagInputProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];

  const [draft, setDraft] = useState('');

  function commitInto(tags: string[], raw: string): string[] {
    const name = raw.trim();
    if (!name) return tags;

    const exists = tags.some(tag => tag.toLowerCase() === name.toLowerCase());
    // A tárolt érték a felhasználó által beírt kis-nagybetűzést tartja meg
    return exists ? tags : [...tags, name];
  }

  function commitDraft() {
    const next = commitInto(value, draft);
    setDraft('');
    if (next !== value) onChange(next);
  }

  function handleChangeText(text: string) {
    if (!text.includes(',')) {
      setDraft(text);
      return;
    }

    const parts = text.split(',');
    const remainder = parts.pop() ?? '';

    let next = value;
    for (const part of parts) {
      next = commitInto(next, part);
    }

    setDraft(remainder);
    if (next !== value) onChange(next);
  }

  function handleKeyPress(e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    if (e.nativeEvent.key !== 'Backspace' || draft !== '' || value.length === 0) return;
    onChange(value.slice(0, -1));
  }

  function removeTag(tag: string) {
    onChange(value.filter(item => item !== tag));
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={draft}
        onChangeText={handleChangeText}
        onSubmitEditing={commitDraft}
        onBlur={commitDraft}
        onKeyPress={handleKeyPress}
        blurOnSubmit={false}
        returnKeyType="done"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Címkék"
      />

      {/* Rögzített címkék chipként, törlő gombbal */}
      {value.length > 0 && (
        <View style={styles.chipRow}>
          {value.map(tag => (
            <View key={tag} style={[styles.chip, { borderColor: colors.backgroundSelected }]}>
              <ThemedText type="small">{tag}</ThemedText>
              <Pressable
                style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
                onPress={() => removeTag(tag)}
                hitSlop={Spacing.two}
                accessibilityRole="button"
                accessibilityLabel={`${tag} címke törlése`}
              >
                <ThemedText type="small" themeColor="textSecondary">
                  ×
                </ThemedText>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  input: {
    height: 36,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    borderWidth: 1,
  },
  remove: {
    paddingHorizontal: Spacing.half,
  },
  pressed: {
    opacity: 0.5,
  },
});
