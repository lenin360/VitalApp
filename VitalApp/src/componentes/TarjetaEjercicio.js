import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function TarjetaEjercicio({ ejercicio, onPress }) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.iconContainer}>
                <Text style={styles.iconEmoji}>{ejercicio.icono || '🏃'}</Text>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.title} numberOfLines={2}>
                    {ejercicio.nombre || ejercicio.name}
                </Text>
                <Text style={styles.category}>
                    {ejercicio.categoria || ejercicio.category || 'General'}
                </Text>
                <View style={styles.metaContainer}>
                    <View style={styles.metaBadge}>
                        <Text style={styles.metaText}>⏱️ {Math.floor((ejercicio.duracion || ejercicio.duration_seconds || 0) / 60)} min</Text>
                    </View>
                    <View style={styles.metaBadge}>
                        <Text style={styles.metaText}>📊 {ejercicio.dificultad || ejercicio.difficulty || 'Fácil'}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.arrowContainer}>
                <Text style={styles.arrow}>➔</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    iconContainer: {
        backgroundColor: '#EFF6FF',
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconEmoji: {
        fontSize: 40,
    },
    infoContainer: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
        lineHeight: 26,
    },
    category: {
        fontSize: 16,
        color: '#2563EB',
        fontWeight: '700',
        marginBottom: 10,
        textTransform: 'capitalize',
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    metaBadge: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    metaText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '600',
    },
    arrowContainer: {
        paddingLeft: 12,
        justifyContent: 'center',
    },
    arrow: {
        fontSize: 24,
        color: '#CBD5E1',
        fontWeight: 'bold',
    }
});
