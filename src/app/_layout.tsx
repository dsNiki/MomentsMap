import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { initDatabase } from '@/db/database';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initDatabase()
      .then(() => SplashScreen.hideAsync())
      .catch(err => {
        // Az adatbázis inicializálása sikertelen – az app megjelenítéséhez mégis elrejtjük a splash screent
        SplashScreen.hideAsync();
        throw err;
      });
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="map" />
        <Stack.Screen name="list" />
        <Stack.Screen name="photo/add" options={{ presentation: 'modal' }} />
        <Stack.Screen name="photo/[id]" options={{ presentation: 'card' }} />
      </Stack>
    </ThemeProvider>
  );
}
