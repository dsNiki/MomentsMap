import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { ClusterMarkerData } from '@/services/clusterService';

interface ClusterMarkerProps {
  cluster: ClusterMarkerData;
  onPress: (_cluster: ClusterMarkerData) => void;
}

export function ClusterMarker({ cluster, onPress }: ClusterMarkerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];
  const [imageLoaded, setImageLoaded] = useState(false);

  const cover = cluster.photos[0];

  return (
    <Marker
      coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
      onPress={() => onPress(cluster)}
      tracksViewChanges={!imageLoaded}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.wrapper}>
        <View
          style={[
            styles.thumbnail,
            { backgroundColor: colors.backgroundElement, borderColor: colors.background },
          ]}
        >
          <Image
            source={{ uri: cover.uri }}
            style={styles.image}
            contentFit="cover"
            recyclingKey={String(cover.id)}
            onLoadEnd={() => setImageLoaded(true)}
          />
        </View>

        <View style={[styles.badge, { borderColor: colors.background }]}>
          <ThemedText style={styles.badgeText}>{cluster.count}</ThemedText>
        </View>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: Spacing.two,
    borderWidth: 2,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
});
