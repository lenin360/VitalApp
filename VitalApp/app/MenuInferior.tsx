import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from './components/useTheme';

export default function MenuInferior() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const isDesktop = width >= 768;

  const menuItems = [
    { 
      name: 'Inicio', 
      path: '/home', 
      icon: (color: string, focused: boolean) => (
        <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
      )
    },
    { 
      name: 'Ejercicios', 
      path: '/ejercicios', 
      icon: (color: string, focused: boolean) => (
        <MaterialCommunityIcons name="dumbbell" size={24} color={color} />
      )
    },
    { 
      name: 'Estadísticas', 
      path: '/estadisticas', 
      icon: (color: string, focused: boolean) => (
        <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={24} color={color} />
      )
    },
    { 
      name: 'Perfil', 
      path: '/perfil', 
      icon: (color: string, focused: boolean) => (
        <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
      )
    },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <View style={[styles.container, isDesktop && styles.desktopContainer, { backgroundColor: colors.card, borderTopColor: colors.cardBorder }]}>
      {menuItems.map((item, index) => {
        const active = isActive(item.path);
        const color = active ? (colors.isDark ? '#60A5FA' : '#2563EB') : colors.textSecondary;
        
        return (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.replace(item.path as any)}
          >
            {item.icon(color, active)}
            <Text style={[styles.menuText, { color }]}>
              {item.name}
            </Text>
            {active && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Este será sobreescrito por el style prop
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0', // Este será sobreescrito por el style prop
    paddingBottom: Platform.OS === 'ios' ? 25 : 12,
    paddingTop: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  desktopContainer: {
    maxWidth: 500,
    alignSelf: 'center',
    borderRadius: 30,
    marginBottom: 24,
    marginHorizontal: 20,
    left: '50%',
    right: 'auto',
    transform: [{ translateX: -250 }],
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 15,
    position: 'relative',
  },
  menuText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  activeIndicator: {
    position: 'absolute',
    top: -12,
    width: 24,
    height: 4,
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
});