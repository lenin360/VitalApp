import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              VitalApp — Configuración de API URL               ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  Prioridad de detección:                                       ║
 * ║  1. EXPO_PUBLIC_API_URL (del .env.local)                       ║
 * ║  2. Backend online en Render                                   ║
 * ║  3. IP automática del servidor (desarrollo local)              ║
 * ║  4. Fallback online                                            ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

const ONLINE_API = 'https://vitalapp-pw8k.onrender.com/api';

const getApiUrl = (): string => {
  // ── 1. Variable pública personalizada ────────────────────────────
  const tunnelUrl = process.env.EXPO_PUBLIC_API_URL;

  if (tunnelUrl && tunnelUrl.startsWith('http')) {
    console.log('🌐 Usando API personalizada:', tunnelUrl);
    return tunnelUrl;
  }

  // ── 2. Web usa backend online ────────────────────────────────────
  if (Platform.OS === 'web') {
    console.log('🌍 Usando backend online (Render)');
    return ONLINE_API;
  }

  // ── 3. Intentar detectar IP local automáticamente ────────────────
  try {
    const debuggerHost =
      Constants.expoConfig?.hostUri ??
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
      (Constants as any).manifest?.debuggerHost;

    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      const localUrl = `http://${ip}:5000/api`;

      console.log('📡 Usando servidor local:', localUrl);

      return localUrl;
    }
  } catch {
    // Ignorar errores
  }

  // ── 4. Fallback: backend online ──────────────────────────────────
  console.warn('⚠️ Usando backend online como fallback');

  return ONLINE_API;
};

export const API_URL = getApiUrl();