import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useRouter } from 'expo-router';

interface Recordatorio {
    id: number;
    hora: string;
    activo: boolean;
    dias: string[];
    label: string;
}

export default function GlobalNotification() {
    const [visible, setVisible] = useState(false);
    const [currentReminder, setCurrentReminder] = useState<Recordatorio | null>(null);
    const { colors } = useTheme();
    const router = useRouter();
    const slideAnim = useRef(new Animated.Value(-200)).current;

    useEffect(() => {
        let lastTriggered = '';

        const checkReminders = async () => {
            try {
                const notifEnabled = await AsyncStorage.getItem('notifications');
                if (notifEnabled === 'false') return;

                const stored = await AsyncStorage.getItem('recordatorios');
                if (!stored) return;
                
                const recordatorios: Recordatorio[] = JSON.parse(stored);
                const now = new Date();
                const currentHour = now.getHours().toString().padStart(2, '0');
                const currentMinute = now.getMinutes().toString().padStart(2, '0');
                const timeString = `${currentHour}:${currentMinute}`;

                // Evitar que suene 2 veces en el mismo minuto
                if (lastTriggered === timeString) return;

                const diasMap = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
                const currentDay = diasMap[now.getDay()];

                for (let r of recordatorios) {
                    if (r.activo && r.hora === timeString && r.dias.includes(currentDay)) {
                        lastTriggered = timeString;
                        setCurrentReminder(r);
                        showNotification();
                        playSound();
                        break;
                    }
                }
            } catch (e) {
                console.log('Error checking reminders:', e);
            }
        };

        const interval = setInterval(checkReminders, 10000); // Revisar cada 10 segundos
        return () => clearInterval(interval);
    }, []);

    const showNotification = () => {
        setVisible(true);
        Animated.spring(slideAnim, {
            toValue: 40,
            useNativeDriver: true,
            bounciness: 12
        }).start();

        // Ocultar automáticamente después de 15 segundos
        setTimeout(() => {
            hideNotification();
        }, 15000);
    };

    const hideNotification = () => {
        Animated.timing(slideAnim, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setVisible(false));
    };

    const playSound = async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg' }
            );
            await sound.playAsync();
        } catch (e) {
            console.log('Error playing sound', e);
        }
    };

    const handlePress = () => {
        hideNotification();
        router.push('/ejercicios');
    };

    if (!visible || !currentReminder) return null;

    return (
        <View style={styles.container} pointerEvents="box-none">
            <Animated.View style={[
                styles.card, 
                { 
                    backgroundColor: colors.card, 
                    borderColor: colors.cardBorder,
                    transform: [{ translateY: slideAnim }]
                }
            ]}>
                <View style={styles.iconContainer}>
                    <Ionicons name="notifications" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.content}>
                    <Text style={[styles.title, { color: colors.text }]}>¡Es hora de moverse!</Text>
                    <Text style={[styles.time, { color: colors.textSecondary }]}>
                        {currentReminder.hora} • {currentReminder.label}
                    </Text>
                </View>
                <TouchableOpacity style={styles.actionBtn} onPress={handlePress}>
                    <Text style={styles.actionText}>¡Vamos!</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeBtn} onPress={hideNotification}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        zIndex: 9999,
        elevation: 9999,
    },
    card: {
        position: 'absolute',
        top: 0,
        width: '90%',
        maxWidth: 500,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
            android: { elevation: 10 },
            web: { boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)' }
        })
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 4,
    },
    time: {
        fontSize: 13,
        fontWeight: '500',
    },
    actionBtn: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        marginRight: 8,
    },
    actionText: {
        color: '#2563EB',
        fontWeight: '700',
        fontSize: 14,
    },
    closeBtn: {
        padding: 4,
    }
});
