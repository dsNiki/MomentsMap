const fs = require('fs');
const path = require('path');

/**
 * Egy változó kiolvasása a projekt .env fájljából.
 *
 * Azért olvassuk be kézzel, hogy ne függjünk attól, mikor tölti be a
 * környezeti változókat az Expo CLI az app konfiguráció kiértékeléséhez.
 */
function readFromEnvFile(name) {
  const envPath = path.resolve(__dirname, '.env');
  if (!fs.existsSync(envPath)) return undefined;

  const content = fs.readFileSync(envPath, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator === -1) continue;

    if (line.slice(0, separator).trim() !== name) continue;

    // Az esetleges idézőjeleket levágjuk az értékről
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, '');

    return value || undefined;
  }
  return undefined;
}

/**
 * Dinamikus app konfiguráció.
 *
 * Az app.json statikus értékeit kapja meg `config`-ként, és kiegészíti a
 * react-native-maps plugin Android Google Maps API kulcsával. A kulcs
 * környezeti változóból vagy a .env fájlból jön, így nem kerül
 * verziókövetésbe.
 */
module.exports = ({ config }) => {
  const androidGoogleMapsApiKey =
    process.env.GOOGLE_MAPS_API_KEY_ANDROID || readFromEnvFile('GOOGLE_MAPS_API_KEY_ANDROID');

  if (!androidGoogleMapsApiKey) {
    // Kulcs nélkül nem kerül bele a natív manifestbe, és a térkép üres marad
    console.warn(
      '[app.config] GOOGLE_MAPS_API_KEY_ANDROID nincs beállítva – a térkép nem fog betölteni.',
    );
  }

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ...(androidGoogleMapsApiKey ? [['react-native-maps', { androidGoogleMapsApiKey }]] : []),
    ],
  };
};
