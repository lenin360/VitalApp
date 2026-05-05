import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    TextInput,
    StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from './config';
import MenuInferior from './MenuInferior';
import { useTheme } from './components/useTheme';

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
    const { colors } = useTheme();

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
            const response = await fetch(`${API_URL}/exercises`);
            const data = await response.json();
            setEjercicios(data.exercises || []);
            setFiltrados(data.exercises || []);
        } catch (error) {
            console.error('Error:', error);
            // Datos de prueba premium
            const datosPrueba = [
                { id: 1, nombre: 'Salto De Tijera', descripcion: 'Excelente ejercicio cardiovascular para despertar el cuerpo', duracion: 1800, dificultad: 'Normal', categoria: 'Cardio' },
                { id: 2, nombre: 'Toque al Talón', descripcion: 'Fortalece piernas y glúteos suavemente', duracion: 900, dificultad: 'Fácil', categoria: 'Piernas' },
                { id: 3, nombre: 'Abdominal Cruzado', descripcion: 'Trabaja el núcleo y mejora la postura', duracion: 1200, dificultad: 'Normal', categoria: 'Abdominales' },
                { id: 4, nombre: 'Escalada Lenta', descripcion: 'Ejercicio completo para mantener la movilidad', duracion: 600, dificultad: 'Moderado', categoria: 'Movilidad' },
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

    const getCategoryIcon = (categoria: string) => {
        switch(categoria.toLowerCase()) {
            case 'cardio': return 'heart-outline';
            case 'piernas': return 'walk-outline';
            case 'abdominales': return 'body-outline';
            default: return 'fitness-outline';
        }
    };

    if (cargando) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Preparando tus rutinas...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.gradientStart} />
            
            {/* Cabecera Premium */}
            <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={styles.headerGradient}
            >
                <View style={styles.headerTop}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <TouchableOpacity onPress={() => router.push('/home')} style={{marginRight: 16}}>
                            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Explorar</Text>
                    </View>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{filtrados.length} rutinas</Text>
                    </View>
                </View>
                <Text style={styles.headerSubtitle}>Encuentra el ejercicio ideal para ti hoy</Text>
                
                <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                    <Ionicons name="search" size={24} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Buscar por nombre..."
                        placeholderTextColor={colors.textSecondary}
                        value={busqueda}
                        onChangeText={setBusqueda}
                        clearButtonMode="while-editing"
                    />
                </View>
            </LinearGradient>

            <ScrollView 
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {filtrados.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="search-outline" size={60} color="#94A3B8" />
                        </View>
                        <Text style={styles.emptyText}>No encontramos nada</Text>
                        <Text style={styles.emptySubtext}>Prueba buscando con otras palabras</Text>
                    </View>
                ) : (
                    filtrados.map((ejercicio, index) => (
                        <TouchableOpacity 
                            key={ejercicio.id} 
                            style={[styles.tarjetaEjercicio, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                            onPress={() => verDetalle(ejercicio)}
                            activeOpacity={0.9}
                        >
                            <View style={styles.tarjetaHeader}>
                                <View style={[styles.tarjetaIconContainer, { backgroundColor: colors.settingIconBg }]}>
                                    <Ionicons 
                                        name={getCategoryIcon(ejercicio.categoria)} 
                                        size={32} 
                                        color={colors.isDark ? '#60A5FA' : '#2563EB'} 
                                    />
                                </View>
                                <View style={styles.tarjetaInfo}>
                                    <Text style={[styles.ejercicioNombre, { color: colors.text }]} numberOfLines={1}>{ejercicio.nombre}</Text>
                                    <Text style={[styles.ejercicioDescripcion, { color: colors.textSecondary }]} numberOfLines={2}>
                                        {ejercicio.descripcion}
                                    </Text>
                                </View>
                            </View>
                            
                            <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

                            <View style={styles.ejercicioFooter}>
                                <View style={[styles.footerBadge, { backgroundColor: colors.bg }]}>
                                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                                        {Math.floor(ejercicio.duracion / 60)} min
                                    </Text>
                                </View>
                                <View style={[styles.footerBadge, { backgroundColor: colors.bg }]}>
                                    <Ionicons name="bar-chart-outline" size={16} color={colors.isDark ? '#60A5FA' : '#2563EB'} />
                                    <Text style={[styles.dificultad, { color: colors.isDark ? '#60A5FA' : '#2563EB' }]}>
                                        {ejercicio.dificultad}
                                    </Text>
                                </View>
                                <View style={[styles.footerBadge, { backgroundColor: colors.bg }]}>
                                    <Ionicons name="pricetag-outline" size={16} color={colors.textSecondary} />
                                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                                        {ejercicio.categoria}
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

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#F8FAFC' 
    },
    centeredContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#F8FAFC'
    },
    loadingText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
    },
    headerGradient: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerTitle: { 
        fontSize: 36, 
        fontWeight: '900', 
        color: '#FFFFFF',
    },
    countBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    countText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 18,
        color: '#DBEAFE',
        marginBottom: 24,
        fontWeight: '500',
    },
    searchContainer: { 
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 20,
        height: 60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: { 
        flex: 1,
        fontSize: 18, 
        color: '#1E293B',
        fontWeight: '500',
        height: '100%',
    },
    container: { 
        flex: 1,
        marginTop: 16,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 16,
        color: '#64748B',
    },
    tarjetaEjercicio: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 24, 
        padding: 20, 
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    tarjetaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tarjetaIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    tarjetaInfo: {
        flex: 1,
    },
    ejercicioNombre: { 
        fontSize: 20, 
        fontWeight: '800', 
        color: '#1E293B', 
        marginBottom: 6,
    },
    ejercicioDescripcion: { 
        fontSize: 15, 
        color: '#64748B', 
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },
    ejercicioFooter: { 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        gap: 6,
    },
    footerText: {
        fontSize: 14, 
        color: '#475569',
        fontWeight: '600',
    },
    dificultad: { 
        fontSize: 14, 
        fontWeight: '700',
    },
});