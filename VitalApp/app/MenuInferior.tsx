import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function MenuInferior() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
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
    <View style={[styles.container, isDesktop && styles.desktopContainer]}>
      {menuItems.map((item, index) => {
        const active = isActive(item.path);
        const color = active ? '#FF6B35' : '#999999';
        
        return (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.replace(item.path)}
          >
            {item.icon(color, active)}
            <Text style={[styles.menuText, { color }]}>
              {item.name}
            </Text>
            {active && <View style={styles.activeIndicator} />}
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingBottom: Platform.OS === 'ios' ? 25 : 8,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  desktopContainer: {
    maxWidth: 500,
    alignSelf: 'center',
    borderRadius: 25,
    marginBottom: 20,
    marginHorizontal: 20,
    left: '50%',
    right: 'auto',
    transform: [{ translateX: -250 }],
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 15,
    position: 'relative',
  },
  menuText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 3,
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
});