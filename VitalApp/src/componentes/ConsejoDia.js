import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ConsejoDia({ consejo }) {
    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.icon}>💡</Text>
                <Text style={styles.title}>Consejo del Día</Text>
            </View>
            <Text style={styles.text}>{consejo}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF7ED',
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 20,
        padding: 24,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#FDBA74',
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 4,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    icon: {
        fontSize: 32,
        marginRight: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#9A3412',
    },
    text: {
        fontSize: 18,
        color: '#C2410C',
        lineHeight: 28,
        fontWeight: '500',
    }
});
