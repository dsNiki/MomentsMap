import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { Colors, Spacing } from '@/constants/theme';
import { Photo } from '@/db/types';

interface PhotoMarkerProps {
  photo: Photo;
  selected?: boolean;
  onPress: (_photo: Photo) => void;
}

export function PhotoMarker({ photo, selected = false, onPress }: PhotoMarkerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];
  const [imageLoaded, setImageLoaded] = useState(false);

  if (photo.latitude == null || photo.longitude == null) return null;

  return (
    <Marker
      coordinate={{ latitude: photo.latitude, longitude: photo.longitude }}
      onPress={() => onPress(photo)}
      tracksViewChanges={!imageLoaded}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colors.backgroundElement, borderColor: colors.background },
          selected && styles.selected,
        ]}
      >
        <Image
          source={{ uri: photo.uri }}
          style={styles.image}
          contentFit="cover"
          recyclingKey={String(photo.id)}
          onLoadEnd={() => setImageLoaded(true)}
        />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: Spacing.two,
    borderWidth: 2,
    overflow: 'hidden',
  },
  selected: {
    borderColor: '#E53935',
    borderWidth: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
