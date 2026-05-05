import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function Cargando({ texto = "Cargando..." }) {
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.text}>{texto}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    text: {
        marginTop: 20,
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    }
});
