import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              VitalApp — Configuración de API URL                 ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  Prioridad de detección:                                         ║
 * ║  1. EXPO_PUBLIC_API_URL (del .env.local — túnel público)         ║
 * ║  2. IP automática del servidor de desarrollo (red local)         ║
 * ║  3. localhost (solo para web/emulador)                           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
const getApiUrl = (): string => {
  // ── 1. URL del túnel público (cuando usas start-all.ps1) ──────────
  // Expo carga automáticamente las variables EXPO_PUBLIC_* del .env.local
  const tunnelUrl = process.env.EXPO_PUBLIC_API_URL;
  if (tunnelUrl && tunnelUrl.startsWith('http')) {
    console.log('🌐 Usando túnel público:', tunnelUrl);
    return tunnelUrl;
  }

  // ── 2. En Web, localhost funciona mejor con HTTP en desarrollo ─────
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  // ── 3. En celular: detectar IP del servidor automáticamente ────────
  // Expo expone la IP de la máquina de desarrollo en Constants
  try {
    const debuggerHost =
      Constants.expoConfig?.hostUri ??
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
      (Constants as any).manifest?.debuggerHost;

    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      const url = `http://${ip}:5000/api`;
      console.log('📡 Usando IP automática del servidor:', url);
      return url;
    }
  } catch {
    // Ignorar errores de detección
  }

  // ── 4. Fallback: localhost ─────────────────────────────────────────
  console.warn('⚠️  Usando localhost como fallback (puede no funcionar en celular)');
  return 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();
