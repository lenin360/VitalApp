import React from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

// Ocultar advertencia de dependencias de terceros en la consola del navegador
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('props.pointerEvents is deprecated')) {
    return;
  }
  originalConsoleError(...args);
};

const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('props.pointerEvents is deprecated')) {
    return;
  }
  originalConsoleWarn(...args);
};

// Importar pantallas
import InicioScreen from './src/pantallas/InicioScreen';
import EjerciciosScreen from './src/pantallas/EjerciciosScreen';
import DetalleEjercicioScreen from './src/pantallas/DetalleEjercicioScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#4CAF50" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#4CAF50' },
            headerTintColor: 'white',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen 
            name="Inicio" 
            component={InicioScreen} 
            options={{ title: 'Vital App' }}
          />
          <Stack.Screen 
            name="Ejercicios" 
            component={EjerciciosScreen} 
            options={{ title: 'Mis Ejercicios' }}
          />
          <Stack.Screen 
            name="DetalleEjercicio" 
            component={DetalleEjercicioScreen} 
            options={{ title: 'Detalle del Ejercicio' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}