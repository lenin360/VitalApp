import { Stack } from 'expo-router';
import { useWindowDimensions, Platform } from 'react-native';
import { useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import GlobalNotification from '../components/GlobalNotification';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    ::-webkit-scrollbar {
      width: 8px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.6);
      border-radius: 10px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(148, 163, 184, 0.9);
    }
    
    /* Scrollbar for light backgrounds (like the main page) */
    html {
      --scrollbar-color: rgba(0, 0, 0, 0.2);
      --scrollbar-hover: rgba(0, 0, 0, 0.3);
    }
  `;
  document.head.appendChild(style);
}

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { colors } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log(
        '%c¡DETENTE!',
        'color: red; font-size: 50px; font-weight: bold; text-shadow: 1px 1px 2px black;'
      );
      console.log(
        '%c¡CUIDA TU CUENTA!',
        'color: #dc2626; font-size: 32px; font-weight: bold; background-color: #facc15; border: 8px solid #3730a3; border-radius: 12px; padding: 10px 20px; font-family: monospace;'
      );
      console.log(
        '%cSi usas esta consola, podrían robarte tu\ncuenta y datos personales.\nNo introduzcas códigos o scripts que no\ncomprendas.',
        'color: #ef4444; font-size: 16px; font-family: monospace;'
      );
    }
  }, []);

  return (
    <>
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: {
          maxWidth: '100%',
          alignSelf: 'center',
          width: '100%',
          backgroundColor: colors ? colors.bg : '#FFFFFF',
        }
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="login" 
        options={{
          contentStyle: {
            maxWidth: '100%',
            width: '100%',
            alignSelf: 'stretch',
          }
        }}
      />
      <Stack.Screen name="home" />
      <Stack.Screen name="ejercicios" />
      <Stack.Screen name="estadisticas" />
      <Stack.Screen name="perfil" />
      <Stack.Screen name="detalle-ejercicio" />
      <Stack.Screen name="recordatorios" />
      <Stack.Screen 
        name="modal" 
        options={{ presentation: 'modal' }} 
      />
    </Stack>
    <GlobalNotification />
    </>
  );
}