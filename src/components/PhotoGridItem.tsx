import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { Photo } from '@/db/types';

interface PhotoGridItemProps {
  photo: Photo;
  /** Az elem oldalhossza képpontban – a rács számolja ki */
  size: number;
}

/** A rácsos lista egy eleme: négyzetes bélyegkép, megnyomásra a részletes adatlap */
export function PhotoGridItem({ photo, size }: PhotoGridItemProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { width: size, height: size, backgroundColor: colors.backgroundElement },
        pressed && styles.pressed,
      ]}
      onPress={() => router.push(`/photo/${photo.id}`)}
      accessibilityRole="button"
      accessibilityLabel={photo.title ? `Fotó: ${photo.title}` : 'Fotó megnyitása'}
    >
      <Image
        source={{ uri: photo.uri }}
        style={styles.image}
        contentFit="cover"
        // Újrahasznosított elemeknél a kulcs megakadályozza a régi kép felvillanását
        recyclingKey={String(photo.id)}
        transition={150}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.7,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
