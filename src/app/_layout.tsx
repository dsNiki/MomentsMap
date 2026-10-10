import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { PendingPhotoProvider } from '@/context/PendingPhotoContext';
import { seedCategories } from '@/db/categoryRepository';
import { initDatabase } from '@/db/database';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initDatabase()
      .then(() => seedCategories())
      .then(() => SplashScreen.hideAsync())
      .catch(err => {
        SplashScreen.hideAsync();
        throw err;
      });
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PendingPhotoProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="map" />
          <Stack.Screen name="list" />
          <Stack.Screen
            name="photo/add"
            options={{ presentation: 'transparentModal', animation: 'fade' }}
          />
          <Stack.Screen name="photo/[id]" options={{ presentation: 'card' }} />
        </Stack>
      </PendingPhotoProvider>
    </ThemeProvider>
  );
}
