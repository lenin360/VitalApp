import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from './config';  // ← AGREGADO
import MenuInferior from './MenuInferior';

interface Ejercicio {
    id: number;
    nombre: string;
    descripcion: string;
    duracion: number;
    dificultad: string;
    categoria: string;
}

export default function EjerciciosScreen() {
    const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
    const [filtrados, setFiltrados] = useState<Ejercicio[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const router = useRouter();

    useEffect(() => {
        cargarEjercicios();
    }, []);

    useEffect(() => {
        if (busqueda.trim() === '') {
            setFiltrados(ejercicios);
        } else {
            const filtradosTemp = ejercicios.filter(e => 
                e.nombre.toLowerCase().includes(busqueda.toLowerCase())
            );
            setFiltrados(filtradosTemp);
        }
    }, [busqueda, ejercicios]);

    const cargarEjercicios = async () => {
        try {
            const response = await fetch(`${API_URL}/exercises`);  // ← CAMBIADO
            const data = await response.json();
            setEjercicios(data.exercises || []);
            setFiltrados(data.exercises || []);
        } catch (error) {
            console.error('Error:', error);
            // Datos de prueba si falla la conexión
            const datosPrueba = [
                { id: 1, nombre: 'Salto De Tijera', descripcion: 'Excelente ejercicio cardiovascular', duracion: 1800, dificultad: 'Normal', categoria: 'Cardio' },
                { id: 2, nombre: 'Toque al Tallón', descripcion: 'Fortalece piernas y glúteos', duracion: 900, dificultad: 'Fácil', categoria: 'Piernas' },
                { id: 3, nombre: 'Abdominal cruzado', descripcion: 'Trabaja los oblicuos', duracion: 1200, dificultad: 'Normal', categoria: 'Abdominales' },
                { id: 4, nombre: 'Escalada de Montaña', descripcion: 'Ejercicio completo de cuerpo', duracion: 600, dificultad: 'Difícil', categoria: 'Full Body' },
            ];
            setEjercicios(datosPrueba);
            setFiltrados(datosPrueba);
        } finally {
            setCargando(false);
        }
    };

    const verDetalle = (ejercicio: Ejercicio) => {
        router.push({
            pathname: '/detalle-ejercicio',
            params: {
                id: ejercicio.id.toString(),
                nombre: ejercicio.nombre,
                descripcion: ejercicio.descripcion || 'Sin descripción',
                duracion: ejercicio.duracion.toString(),
                dificultad: ejercicio.dificultad
            }
        });
    };

    if (cargando) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Cargando ejercicios...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Ejercicios</Text>
                <Text style={styles.headerSubtitle}>
                    {filtrados.length} ejercicios disponibles
                </Text>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar ejercicio..."
                    placeholderTextColor="#999"
                    value={busqueda}
                    onChangeText={setBusqueda}
                />
            </View>

            <ScrollView 
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {filtrados.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyEmoji}></Text>
                        <Text style={styles.emptyText}>No se encontraron ejercicios</Text>
                        <Text style={styles.emptySubtext}>Intenta con otra búsqueda</Text>
                    </View>
                ) : (
                    filtrados.map((ejercicio) => (
                        <TouchableOpacity 
                            key={ejercicio.id} 
                            style={styles.tarjetaEjercicio}
                            onPress={() => verDetalle(ejercicio)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.tarjetaHeader}>
                                <View style={styles.tarjetaIconContainer}>
                                    <Text style={styles.tarjetaIcon}></Text>
                                </View>
                                <View style={styles.tarjetaInfo}>
                                    <Text style={styles.ejercicioNombre}>{ejercicio.nombre}</Text>
                                    <Text style={styles.ejercicioDescripcion} numberOfLines={2}>
                                        {ejercicio.descripcion || 'Ejercicio para tu bienestar'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.ejercicioFooter}>
                                <View style={styles.footerItem}>
                                    <Text style={styles.footerIcon}></Text>
                                    <Text style={styles.footerText}>
                                        {Math.floor(ejercicio.duracion / 60)} min
                                    </Text>
                                </View>
                                <View style={styles.footerItem}>
                                    <Text style={styles.footerIcon}></Text>
                                    <Text style={styles.dificultad}>
                                        {ejercicio.dificultad || 'Normal'}
                                    </Text>
                                </View>
                                <View style={styles.footerItem}>
                                    <Text style={styles.footerIcon}></Text>
                                    <Text style={styles.footerText}>
                                        {ejercicio.categoria || 'General'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            <MenuInferior />
        </SafeAreaView>
    );
}

// Los estilos se quedan IGUAL, no los modifiqué
const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#F8F9FA' 
    },
    centeredContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#F8F9FA'
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: '#F8F9FA',
    },
    headerTitle: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: '#212529',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6C757D',
    },
    searchContainer: { 
        padding: 15,
    },
    searchInput: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 12, 
        paddingHorizontal: 16, 
        paddingVertical: 14, 
        fontSize: 16, 
        borderWidth: 1, 
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    container: { 
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 15,
        paddingBottom: 80,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
    },
    tarjetaEjercicio: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    tarjetaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    tarjetaIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    tarjetaIcon: {
        fontSize: 24,
    },
    tarjetaInfo: {
        flex: 1,
    },
    ejercicioNombre: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#212529', 
        marginBottom: 4,
    },
    ejercicioDescripcion: { 
        fontSize: 13, 
        color: '#6C757D', 
        lineHeight: 18,
    },
    ejercicioFooter: { 
        flexDirection: 'row', 
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerIcon: {
        fontSize: 14,
        marginRight: 4,
    },
    footerText: {
        fontSize: 12, 
        color: '#6C757D',
        fontWeight: '500',
    },
    dificultad: { 
        fontSize: 12, 
        color: '#4CAF50', 
        fontWeight: '600',
    },
});