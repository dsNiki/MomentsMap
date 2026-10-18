import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { LocationPickProvider } from '@/context/LocationPickContext';
import { PendingPhotoProvider } from '@/context/PendingPhotoContext';
import { PhotoProvider } from '@/context/PhotoContext';
import { seedCategories } from '@/db/categoryRepository';
import { initDatabase } from '@/db/database';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [databaseReady, setDatabaseReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => seedCategories())
      .then(() => {
        setDatabaseReady(true);
        SplashScreen.hideAsync();
      })
      .catch(() => {
        setDatabaseReady(true);
        SplashScreen.hideAsync();
      });
  }, []);

  if (!databaseReady) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PhotoProvider>
        <PendingPhotoProvider>
          <LocationPickProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="map" />
              <Stack.Screen name="list" />
              <Stack.Screen
                name="photo/add"
                options={{ presentation: 'transparentModal', animation: 'fade' }}
              />
              {/* Nem modális: a térkép modál konténerben nem rajzolódik ki Androidon */}
              <Stack.Screen name="photo/pick-location" options={{ presentation: 'card' }} />
              <Stack.Screen name="photo/[id]" options={{ presentation: 'card' }} />
            </Stack>
          </LocationPickProvider>
        </PendingPhotoProvider>
      </PhotoProvider>
    </ThemeProvider>
  );
}
