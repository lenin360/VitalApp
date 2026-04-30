import { Stack } from 'expo-router';
import { useWindowDimensions } from 'react-native';

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: {
          maxWidth: isDesktop ? 1200 : '100%',
          alignSelf: 'center',
          width: '100%',
        }
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
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
  );
}