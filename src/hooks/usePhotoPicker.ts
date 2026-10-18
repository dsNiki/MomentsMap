import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useContext } from 'react';
import { Alert } from 'react-native';

import { PendingPhoto, PendingPhotoContext } from '@/context/PendingPhotoContext';
import { readExif } from '@/services/exifService';
import { Coordinate, getCurrentCoordinates } from '@/services/locationService';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 1,
  exif: true,
};

function toPendingPhoto(
  asset: ImagePicker.ImagePickerAsset,
  deviceLocation: Coordinate | null = null,
): PendingPhoto {
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    exif: readExif(asset.exif as Record<string, unknown> | null | undefined),
    deviceLocation,
  };
}

/** Kamera megnyitása engedélykéréssel. Megszakítás vagy elutasítás esetén null. */
export async function pickFromCamera(): Promise<PendingPhoto | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Kameraengedély szükséges',
      permission.canAskAgain
        ? 'Fénykép készítéséhez engedélyezd a kamera használatát.'
        : 'A kameraengedély meg lett tagadva. Az eszköz beállításaiban engedélyezheted.',
    );
    return null;
  }

  const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
  if (result.canceled) return null;

  const asset = result.assets[0];
  const exif = readExif(asset.exif as Record<string, unknown> | null | undefined);
  const needsLocation = exif.latitude == null || exif.longitude == null;
  const deviceLocation = needsLocation ? await getCurrentCoordinates() : null;

  return toPendingPhoto(asset, deviceLocation);
}

/** Galéria megnyitása engedélykéréssel. Megszakítás vagy elutasítás esetén null. */
export async function pickFromGallery(): Promise<PendingPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Galériaengedély szükséges',
      permission.canAskAgain
        ? 'Kép kiválasztásához engedélyezd a galéria elérését.'
        : 'A galériaengedély meg lett tagadva. Az eszköz beállításaiban engedélyezheted.',
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  return result.canceled ? null : toPendingPhoto(result.assets[0]);
}

/**
 * Főképernyőkhöz: kiválasztás után a képet Context-be teszi és megnyitja a szerkesztőt.
 */
export function usePhotoPicker() {
  const ctx = useContext(PendingPhotoContext);

  async function openWith(pick: () => Promise<PendingPhoto | null>) {
    const photo = await pick();
    if (!photo) return; // megszakítva vagy engedély megtagadva
    ctx?.setPendingPhoto(photo);
    router.push('/photo/add');
  }

  return {
    openCamera: () => openWith(pickFromCamera),
    openGallery: () => openWith(pickFromGallery),
  };
}
