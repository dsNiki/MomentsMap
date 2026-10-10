import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useContext } from 'react';
import { Alert } from 'react-native';

import { PendingPhotoContext } from '@/context/PendingPhotoContext';

export type PickerSource = 'camera' | 'gallery';

/**
 * Kamera és galéria hozzáférés egységes kezelése.
 * A kiválasztott kép URI-ját Context-ben tárolja (nem route paraméterben),
 * majd a /photo/add képernyőre navigál.
 */
export function usePhotoPicker() {
  const ctx = useContext(PendingPhotoContext);

  function storePendingAndNavigate(asset: ImagePicker.ImagePickerAsset) {
    if (ctx) {
      ctx.setPendingPhoto({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });
    }
    router.push('/photo/add');
  }

  async function openCamera(): Promise<void> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      if (!permission.canAskAgain) {
        Alert.alert(
          'Kameraengedély szükséges',
          'A kameraengedély meg lett tagadva. Az eszköz beállításaiban engedélyezheted.',
        );
      }
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
      exif: true,
    });

    if (result.canceled) return;

    storePendingAndNavigate(result.assets[0]);
  }

  async function openGallery(): Promise<void> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      if (!permission.canAskAgain) {
        Alert.alert(
          'Galériaengedély szükséges',
          'A galériaengedély meg lett tagadva. Az eszköz beállításaiban engedélyezheted.',
        );
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      exif: true,
    });

    if (result.canceled) return;

    storePendingAndNavigate(result.assets[0]);
  }

  return { openCamera, openGallery };
}
