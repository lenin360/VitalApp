import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    SafeAreaView
} from 'react-native';

export default function DetalleEjercicioScreen({ route, navigation }) {
    const { ejercicio } = route.params;
    const [completado, setCompletado] = useState(false);

    const duracionMinutos = Math.floor((ejercicio.duracion || ejercicio.duration_seconds || 0) / 60);
    const segundosRestantes = (ejercicio.duracion || ejercicio.duration_seconds || 0) % 60;

    const marcarCompletado = () => {
        setCompletado(true);
        Alert.alert(
            '¡Felicidades! 🎉',
            'Has completado este ejercicio. ¡Sigue así!',
            [
                { 
                    text: 'Ver más ejercicios', 
                    onPress: () => navigation.navigate('Ejercicios')
                },
                { text: 'Volver', style: 'cancel' }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                {/* Icono y nombre */}
                <View style={styles.header}>
                    <Text style={styles.emojiGrande}>🏃‍♂️</Text>
                    <Text style={styles.titulo}>{ejercicio.nombre || ejercicio.name}</Text>
                </View>

                {/* Información principal */}
                <View style={styles.infoContainer}>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoEmoji}>⏱️</Text>
                        <Text style={styles.infoValor}>{duracionMinutos}:{segundosRestantes.toString().padStart(2, '0')}</Text>
                        <Text style={styles.infoLabel}>minutos</Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoEmoji}>📊</Text>
                        <Text style={styles.infoValor}>{ejercicio.dificultad || ejercicio.difficulty || 'Fácil'}</Text>
                        <Text style={styles.infoLabel}>dificultad</Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoEmoji}>🏷️</Text>
                        <Text style={styles.infoValor}>{ejercicio.categoria || ejercicio.category || 'General'}</Text>
                        <Text style={styles.infoLabel}>categoría</Text>
                    </View>
                </View>

                {/* Descripción */}
                <View style={styles.seccion}>
                    <Text style={styles.seccionTitulo}>📝 Descripción</Text>
                    <Text style={styles.seccionTexto}>
                        {ejercicio.descripcion || ejercicio.description || 'Sin descripción disponible'}
                    </Text>
                </View>

                {/* Instrucciones */}
                <View style={styles.seccion}>
                    <Text style={styles.seccionTitulo}>📖 Instrucciones</Text>
                    <Text style={styles.seccionTexto}>
                        {ejercicio.instrucciones || ejercicio.instructions || 
                            '1. Siéntate o párate cómodamente\n2. Sigue las indicaciones\n3. Respira profundamente\n4. Realiza el movimiento suavemente\n5. Descansa si sientes fatiga'}
                    </Text>
                </View>

                {/* Beneficios */}
                <View style={styles.seccion}>
                    <Text style={styles.seccionTitulo}>✨ Beneficios</Text>
                    <Text style={styles.seccionTexto}>
                        {ejercicio.beneficios || 'Mejora tu movilidad y bienestar general'}
                    </Text>
                </View>

                {/* Precauciones */}
                <View style={[styles.seccion, styles.seccionPrecaucion]}>
                    <Text style={styles.seccionTituloPrecaucion}>⚠️ Precauciones</Text>
                    <Text style={styles.seccionTextoPrecaucion}>
                        {ejercicio.precauciones || 
                            '• Escucha a tu cuerpo\n• No forces los movimientos\n• Si sientes dolor, detente\n• Consulta a tu médico antes de empezar'}
                    </Text>
                </View>

                {/* Botón completar */}
                <TouchableOpacity 
                    style={[styles.botonCompletar, completado && styles.botonCompletado]}
                    onPress={marcarCompletado}
                    disabled={completado}
                >
                    <Text style={styles.botonCompletarTexto}>
                        {completado ? '✓ ¡Completado!' : '✔️ Marcar como completado'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
    },
    header: {
        backgroundColor: '#4CAF50',
        padding: 30,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    emojiGrande: {
        fontSize: 60,
        marginBottom: 10,
    },
    titulo: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: -30,
        marginHorizontal: 20,
    },
    infoCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        minWidth: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoEmoji: {
        fontSize: 28,
        marginBottom: 5,
    },
    infoValor: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 3,
    },
    seccion: {
        backgroundColor: 'white',
        margin: 15,
        marginBottom: 5,
        padding: 18,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    seccionTitulo: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    seccionTexto: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
    },
    seccionPrecaucion: {
        backgroundColor: '#FFF3E0',
        borderWidth: 1,
        borderColor: '#FF9800',
    },
    seccionTituloPrecaucion: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#E65100',
        marginBottom: 10,
    },
    seccionTextoPrecaucion: {
        fontSize: 16,
        color: '#BF360C',
        lineHeight: 24,
    },
    botonCompletar: {
        backgroundColor: '#4CAF50',
        margin: 20,
        marginTop: 10,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 30,
    },
    botonCompletado: {
        backgroundColor: '#9E9E9E',
    },
    botonCompletarTexto: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});