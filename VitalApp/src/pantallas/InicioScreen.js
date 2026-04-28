import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Alert
} from 'react-native';
import { apiService } from '../servicios/api';
import TarjetaEjercicio from '../componentes/TarjetaEjercicio';
import ConsejoDia from '../componentes/ConsejoDia';
import Cargando from '../componentes/Cargando';

export default function InicioScreen({ navigation }) {
    const [ejercicios, setEjercicios] = useState([]);
    const [consejo, setConsejo] = useState('');
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const resEjercicios = await apiService.getExercises();
            setEjercicios(resEjercicios.data.exercises || []);
            
            const resConsejo = await apiService.getDailyTip();
            setConsejo(resConsejo.data.tip || 'Mantente activo cada día');
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', 'No se pudo conectar con el servidor');
        } finally {
            setCargando(false);
        }
    };

    if (cargando) {
        return <Cargando texto="Cargando Vital App..." />;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.titulo}>💪 Vital App</Text>
                    <Text style={styles.subtitulo}>Ejercicios para tu bienestar</Text>
                </View>

                {/* Tarjeta de bienvenida */}
                <View style={styles.tarjetaBienvenida}>
                    <Text style={styles.tituloBienvenida}>¡Bienvenido/a!</Text>
                    <Text style={styles.textoBienvenida}>
                        Realiza ejercicios suaves y mejora tu calidad de vida
                    </Text>
                </View>

                {/* Ejercicios destacados */}
                <View style={styles.seccion}>
                    <Text style={styles.tituloSeccion}>📋 Ejercicios de Hoy</Text>
                    {ejercicios.slice(0, 3).map((ejercicio) => (
                        <TarjetaEjercicio
                            key={ejercicio.id}
                            ejercicio={ejercicio}
                            onPress={() => navigation.navigate('DetalleEjercicio', { ejercicio })}
                        />
                    ))}
                    <TouchableOpacity 
                        style={styles.botonVerMas}
                        onPress={() => navigation.navigate('Ejercicios')}
                    >
                        <Text style={styles.textoBoton}>Ver todos los ejercicios →</Text>
                    </TouchableOpacity>
                </View>

                {/* Botones rápidos */}
                <View style={styles.botonesRapidos}>
                    <TouchableOpacity 
                        style={styles.botonRapido}
                        onPress={() => navigation.navigate('Ejercicios')}
                    >
                        <Text style={styles.emojiBoton}>🎯</Text>
                        <Text style={styles.textoBotonRapido}>Ejercicios</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.botonRapido}
                        onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
                    >
                        <Text style={styles.emojiBoton}>📊</Text>
                        <Text style={styles.textoBotonRapido}>Progreso</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.botonRapido}
                        onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
                    >
                        <Text style={styles.emojiBoton}>👤</Text>
                        <Text style={styles.textoBotonRapido}>Perfil</Text>
                    </TouchableOpacity>
                </View>

                {/* Consejo del día */}
                <ConsejoDia consejo={consejo} />
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
        paddingTop: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    titulo: {
        fontSize: 34,
        fontWeight: 'bold',
        color: 'white',
    },
    subtitulo: {
        fontSize: 18,
        color: 'white',
        marginTop: 5,
        opacity: 0.9,
    },
    tarjetaBienvenida: {
        backgroundColor: 'white',
        margin: 20,
        padding: 25,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    tituloBienvenida: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
    },
    textoBienvenida: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 24,
    },
    seccion: {
        marginHorizontal: 20,
        marginBottom: 20,
    },
    tituloSeccion: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    botonVerMas: {
        alignItems: 'center',
        marginTop: 5,
    },
    textoBoton: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: '600',
    },
    botonesRapidos: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: 20,
        marginBottom: 20,
    },
    botonRapido: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        width: '30%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    emojiBoton: {
        fontSize: 32,
        marginBottom: 5,
    },
    textoBotonRapido: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
});