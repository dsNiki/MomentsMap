import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Coordinate } from '@/components/LocationPicker';
import { PhotoPickerSheet } from '@/components/PhotoPickerSheet';
import { ThemedText } from '@/components/themed-text';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { Colors, Spacing } from '@/constants/theme';
import { useLocationPick } from '@/context/LocationPickContext';
import { PendingPhoto, usePendingPhoto } from '@/context/PendingPhotoContext';
import { pickFromCamera, pickFromGallery } from '@/hooks/usePhotoPicker';
import { savePhoto, ValidationError } from '@/services/photoService';

export default function AddPhotoScreen() {
  const { pendingPhoto, setPendingPhoto } = usePendingPhoto();
  const { setRequest } = useLocationPick();

  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];
  const insets = useSafeAreaInsets();

  // Szerkesztőfelület állapota – EXIF adatokkal előtöltve (lazy initial state)
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(() =>
    pendingPhoto?.exif.latitude != null ? String(pendingPhoto.exif.latitude) : '',
  );
  const [longitude, setLongitude] = useState(() =>
    pendingPhoto?.exif.longitude != null ? String(pendingPhoto.exif.longitude) : '',
  );
  const [time, setTime] = useState(() => pendingPhoto?.exif.createdAt ?? '');
  const [changePickerOpen, setChangePickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const aspectRatio =
    pendingPhoto && pendingPhoto.width > 0 && pendingPhoto.height > 0
      ? pendingPhoto.width / pendingPhoto.height
      : 1;

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.backgroundElement, color: colors.text },
  ];

  function handleClose() {
    setPendingPhoto(null);
    router.back();
  }

  /** A beírt koordináták érvényes pontként, vagy null – a térkép kezdő nézetéhez */
  function currentCoordinate(): Coordinate | null {
    const lat = Number(latitude.trim().replace(',', '.'));
    const lon = Number(longitude.trim().replace(',', '.'));

    const valid =
      latitude.trim() !== '' &&
      longitude.trim() !== '' &&
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180;

    return valid ? { latitude: lat, longitude: lon } : null;
  }

  /** Térképes pontválasztó megnyitása saját képernyőn */
  function openMapPicker() {
    setRequest({
      initial: currentCoordinate(),
      onPicked: coordinate => {
        setLatitude(coordinate.latitude.toFixed(6));
        setLongitude(coordinate.longitude.toFixed(6));
      },
    });
    router.push('/photo/pick-location');
  }

  /** Új kép kiválasztása a szerkesztőn belül; a kitöltött szöveges mezők megmaradnak */
  async function replacePhoto(pick: () => Promise<PendingPhoto | null>) {
    const photo = await pick();
    if (!photo) return; // megszakítva – a régi kép marad

    setPendingPhoto(photo);
    // Az új kép EXIF-adatai felülírják a hely- és időmezőket
    setLatitude(photo.exif.latitude != null ? String(photo.exif.latitude) : '');
    setLongitude(photo.exif.longitude != null ? String(photo.exif.longitude) : '');
    setTime(photo.exif.createdAt ?? '');
  }

  async function handleSave() {
    if (!pendingPhoto || saving) return;

    setSaving(true);
    try {
      await savePhoto({
        uri: pendingPhoto.uri,
        width: pendingPhoto.width,
        height: pendingPhoto.height,
        exif: pendingPhoto.exif,
        title,
        description,
        category,
        tags,
        latitude,
        longitude,
        time,
      });
      setPendingPhoto(null);
      router.back();
    } catch (err) {
      // Validációs hiba: konkrét üzenet; egyéb (adatbázis) hiba: általános üzenet (NFK-24)
      let message =
        err instanceof ValidationError ? err.message : 'A fotó mentése nem sikerült. Próbáld újra.';
      // Fejlesztői buildben a technikai részletet is megmutatjuk a hibakereséshez
      if (__DEV__ && !(err instanceof ValidationError)) {
        message += `\n\n[dev] ${err instanceof Error ? err.message : String(err)}`;
      }
      Alert.alert('Mentés sikertelen', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      {/* Backdrop – a felső üres rész, megnyomva bezár */}
      <Pressable style={styles.backdrop} onPress={handleClose} accessibilityLabel="Bezárás" />

      {/* Alulról felugró kártya */}
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.background, paddingBottom: insets.bottom + Spacing.two },
        ]}
      >
        {/* Húzócsík */}
        <View style={[styles.handle, { backgroundColor: colors.backgroundSelected }]} />

        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="default" themeColor="textSecondary">
            Details
          </ThemedText>
          <Pressable onPress={handleClose} accessibilityRole="button" accessibilityLabel="Bezárás">
            <ThemedText type="default" style={styles.closeButton}>
              ✕ Close
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Kép + cím/tag/kategória sor */}
          <View style={styles.topRow}>
            <View style={[styles.imageBox, { backgroundColor: colors.backgroundElement }]}>
              {pendingPhoto ? (
                <Image
                  source={{ uri: pendingPhoto.uri }}
                  style={[styles.image, { aspectRatio }]}
                  contentFit="cover"
                  accessibilityLabel="Kiválasztott fotó"
                />
              ) : (
                <ThemedText type="default" style={styles.imagePlaceholder}>
                  🖼️
                </ThemedText>
              )}
            </View>

            <View style={styles.metaColumn}>
              <TextInput
                style={inputStyle}
                placeholder="Title..."
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
                accessibilityLabel="Cím"
              />
              <TextInput
                style={inputStyle}
                placeholder="Tags, comma separated..."
                placeholderTextColor={colors.textSecondary}
                value={tags}
                onChangeText={setTags}
                accessibilityLabel="Címkék"
              />
              {/* Kategória lenyíló választó */}
              <Pressable
                style={[styles.categoryRow, { backgroundColor: colors.backgroundElement }]}
                onPress={() => setCategoryOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Kategória választása"
              >
                <ThemedText
                  type="small"
                  themeColor={category ? 'text' : 'textSecondary'}
                  numberOfLines={1}
                >
                  {category ?? 'Category'}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  ▼
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Leírás */}
          <TextInput
            style={[inputStyle, styles.descriptionInput]}
            placeholder="Description..."
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="Leírás"
          />

          {/* Helyszín */}
          <View style={styles.locationHeader}>
            <ThemedText type="small" themeColor="textSecondary">
              Location
            </ThemedText>
            <Pressable
              onPress={openMapPicker}
              accessibilityRole="button"
              accessibilityLabel="Hely kijelölése térképen"
            >
              <ThemedText type="small" style={styles.pickOnMapLabel}>
                Pick on map
              </ThemedText>
            </Pressable>
          </View>
          <View style={styles.locationRow}>
            <TextInput
              style={[inputStyle, styles.locationInput]}
              placeholder="Latitude"
              placeholderTextColor={colors.textSecondary}
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="decimal-pad"
              accessibilityLabel="Szélességi fok"
            />
            <ThemedText type="default" themeColor="textSecondary">
              —
            </ThemedText>
            <TextInput
              style={[inputStyle, styles.locationInput]}
              placeholder="Longitude"
              placeholderTextColor={colors.textSecondary}
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="decimal-pad"
              accessibilityLabel="Hosszúsági fok"
            />
          </View>

          {/* Időpont */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
            Time
          </ThemedText>
          <TextInput
            style={inputStyle}
            placeholder="YYYY-MM-DDTHH:MM:SS"
            placeholderTextColor={colors.textSecondary}
            value={time}
            onChangeText={setTime}
            accessibilityLabel="Készítés ideje"
          />
        </ScrollView>

        {/* Alsó gombok */}
        <View style={styles.bottomBar}>
          <Pressable
            style={({ pressed }) => [
              styles.bottomButton,
              { backgroundColor: colors.backgroundElement },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setChangePickerOpen(true)}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Kép cseréje"
          >
            <ThemedText type="small" style={styles.bottomButtonLabel}>
              Change photo
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.bottomButton,
              styles.saveButton,
              (pressed || saving) && { opacity: 0.7 },
            ]}
            onPress={handleSave}
            disabled={saving || !pendingPhoto}
            accessibilityRole="button"
            accessibilityLabel="Fotó mentése"
            accessibilityState={{ disabled: saving || !pendingPhoto, busy: saving }}
          >
            <ThemedText type="small" style={[styles.bottomButtonLabel, styles.saveButtonLabel]}>
              {saving ? 'Saving...' : 'Save photo'}
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Kategória dropdown modal */}
      <Modal
        visible={categoryOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryOpen(false)}
      >
        <Pressable style={styles.dropdownBackdrop} onPress={() => setCategoryOpen(false)}>
          <View style={[styles.dropdownCard, { backgroundColor: colors.background }]}>
            <ScrollView>
              {DEFAULT_CATEGORIES.map(cat => (
                <Pressable
                  key={cat}
                  style={({ pressed }) => [
                    styles.dropdownItem,
                    cat === category && { backgroundColor: colors.backgroundSelected },
                    pressed && { backgroundColor: colors.backgroundElement },
                  ]}
                  onPress={() => {
                    setCategory(cat);
                    setCategoryOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={cat}
                >
                  <ThemedText type="default">{cat}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Kép cseréje: Camera / Gallery választó, a szerkesztőn belül marad */}
      <PhotoPickerSheet
        visible={changePickerOpen}
        onClose={() => setChangePickerOpen(false)}
        title="Change Photo"
        onCamera={() => replacePhoto(pickFromCamera)}
        onGallery={() => replacePhoto(pickFromGallery)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingTop: Spacing.two,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  closeButton: {
    color: '#208AEF',
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  topRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  imageBox: {
    width: 100,
    height: 100,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    fontSize: 32,
  },
  metaColumn: {
    flex: 1,
    gap: Spacing.two,
  },
  input: {
    height: 36,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    fontSize: 14,
  },
  categoryRow: {
    height: 36,
    borderRadius: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  descriptionInput: {
    height: 88,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  fieldLabel: {
    marginBottom: -Spacing.one,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -Spacing.one,
  },
  pickOnMapLabel: {
    color: '#208AEF',
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  locationInput: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  bottomButton: {
    flex: 1,
    height: 44,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#3C3C3E',
  },
  bottomButtonLabel: {
    fontWeight: '600',
  },
  saveButtonLabel: {
    color: '#ffffff',
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  dropdownCard: {
    width: '100%',
    maxHeight: '60%',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
  },
  dropdownItem: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
});
