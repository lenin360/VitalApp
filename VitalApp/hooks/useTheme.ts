import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
    bg: string;
    card: string;
    cardBorder: string;
    text: string;
    textSecondary: string;
    inputBg: string;
    inputBorder: string;
    inputText: string;
    inputDisabledBg: string;
    statusBarStyle: 'light-content' | 'dark-content';
    gradientStart: string;
    gradientEnd: string;
    settingIconBg: string;
    isDark: boolean;
}

const lightColors: ThemeColors = {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    text: '#1E293B',
    textSecondary: '#64748B',
    inputBg: '#FFFFFF',
    inputBorder: '#CBD5E1',
    inputText: '#1E293B',
    inputDisabledBg: '#F8FAFC',
    statusBarStyle: 'light-content',
    gradientStart: '#1E3A8A',
    gradientEnd: '#2563EB',
    settingIconBg: '#EFF6FF',
    isDark: false,
};

const darkColors: ThemeColors = {
    bg: '#0F172A',
    card: '#1E293B',
    cardBorder: '#334155',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    inputBg: '#334155',
    inputBorder: '#475569',
    inputText: '#F1F5F9',
    inputDisabledBg: '#1E293B',
    statusBarStyle: 'light-content',
    gradientStart: '#0F172A',
    gradientEnd: '#1E3A8A',
    settingIconBg: '#1E3A8A',
    isDark: true,
};

export function useTheme() {
    const [temaOscuro, setTemaOscuro] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const loadTheme = async () => {
                const saved = await AsyncStorage.getItem('darkMode');
                if (saved !== null) {
                    setTemaOscuro(saved === 'true');
                }
            };
            loadTheme();
        }, [])
    );

    const colors: ThemeColors = temaOscuro ? darkColors : lightColors;

    const toggleTheme = async (value: boolean) => {
        setTemaOscuro(value);
        await AsyncStorage.setItem('darkMode', value.toString());
    };

    return { temaOscuro, colors, toggleTheme };
}
