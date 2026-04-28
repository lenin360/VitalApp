import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
    const [ejercicios, setEjercicios] = useState([]);
    const [consejo, setConsejo] = useState('');
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const router = useRouter();

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/exercises');
            const data = await response.json();
            setEjercicios(data.exercises || []);
            
            const tipResponse = await fetch('http://localhost:5000/api/tips');
            const tipData = await tipResponse.json();
            setConsejo(tipData.tip || 'Mantén una rutina constante');
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setCargando(false);
        }
    };

    const onRefresh = async () => {
        setRefrescando(true);
        await cargarDatos();
        setRefrescando(false);
    };

    const handleLogout = () => {
        router.replace('/login');
    };

    if (cargando) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90D9" />
                <Text style={styles.loadingText}>Cargando Vital App...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView 
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} colors={['#4A90D9']} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Buenos días</Text>
                        <Text style={styles.userName}>María González</Text>
                    </View>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Salir</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.progressCard}>
                    <Text style={styles.progressTitle}>Ejercicios disponibles</Text>
                    <View style={styles.progressStats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{ejercicios.length}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Completados</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Racha</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.navSection}>
                    <Text style={styles.sectionTitle}>Navegación rápida</Text>
                    <View style={styles.navGrid}>
                        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/ejercicios')}>
                            <View style={[styles.navIconContainer, { backgroundColor: '#4A90D9' }]}>
                                <Text style={styles.navIcon}>📋</Text>
                            </View>
                            <Text style={styles.navText}>Ejercicios</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/perfil')}>
                            <View style={[styles.navIconContainer, { backgroundColor: '#4CAF50' }]}>
                                <Text style={styles.navIcon}>👤</Text>
                            </View>
                            <Text style={styles.navText}>Perfil</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/estadisticas')}>
                            <View style={[styles.navIconContainer, { backgroundColor: '#FF9800' }]}>
                                <Text style={styles.navIcon}>📊</Text>
                            </View>
                            <Text style={styles.navText}>Progreso</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/recordatorios')}>
                            <View style={[styles.navIconContainer, { backgroundColor: '#9C27B0' }]}>
                                <Text style={styles.navIcon}>⏰</Text>
                            </View>
                            <Text style={styles.navText}>Recordatorios</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Ejercicios recomendados</Text>
                        <TouchableOpacity onPress={() => router.push('/ejercicios')}>
                            <Text style={styles.verTodos}>Ver todos →</Text>
                        </TouchableOpacity>
                    </View>

                    {ejercicios.slice(0, 3).map((ejercicio) => (
                        <TouchableOpacity 
                            key={ejercicio.id} 
                            style={styles.exerciseCard}
                            onPress={() => router.push({
                                pathname: '/detalle-ejercicio',
                                params: {
                                    id: ejercicio.id.toString(),
                                    nombre: ejercicio.nombre,
                                    descripcion: ejercicio.descripcion || '',
                                    duracion: ejercicio.duracion.toString(),
                                    dificultad: ejercicio.dificultad
                                }
                            })}
                        >
                            <Text style={styles.exerciseName}>{ejercicio.nombre}</Text>
                            <Text style={styles.exerciseDescription} numberOfLines={2}>
                                {ejercicio.descripcion || 'Ejercicio para tu bienestar'}
                            </Text>
                            <Text style={styles.exerciseDuration}>⏱️ {Math.floor(ejercicio.duracion / 60)} minutos</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.tipCard}>
                    <Text style={styles.tipTitle}>Consejo del día</Text>
                    <Text style={styles.tipText}>{consejo}</Text>
                </View>

                <View style={styles.bottomSpace} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
    loadingText: { marginTop: 12, fontSize: 16, color: '#4A90D9' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: '#FFFFFF' },
    greeting: { fontSize: 14, color: '#8E9AAE' },
    userName: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50', marginTop: 4 },
    logoutButton: { backgroundColor: '#D94A4A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    logoutButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
    progressCard: { backgroundColor: '#FFFFFF', margin: 16, padding: 20, borderRadius: 16 },
    progressTitle: { fontSize: 16, fontWeight: '600', color: '#2C3E50', marginBottom: 16 },
    progressStats: { flexDirection: 'row', justifyContent: 'space-around' },
    statItem: { alignItems: 'center' },
    statNumber: { fontSize: 28, fontWeight: 'bold', color: '#4A90D9' },
    statLabel: { fontSize: 12, color: '#8E9AAE', marginTop: 4 },
    navSection: { paddingHorizontal: 16, marginBottom: 24 },
    navGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    navButton: { width: '23%', backgroundColor: '#FFFFFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    navIconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    navIcon: { fontSize: 24 },
    navText: { fontSize: 12, fontWeight: '500', color: '#2C3E50' },
    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
    verTodos: { fontSize: 14, color: '#4A90D9', fontWeight: '500' },
    exerciseCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
    exerciseName: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8 },
    exerciseDescription: { fontSize: 14, color: '#8E9AAE', marginBottom: 8, lineHeight: 20 },
    exerciseDuration: { fontSize: 12, color: '#8E9AAE' },
    tipCard: { backgroundColor: '#F0F7FF', marginHorizontal: 16, marginBottom: 20, padding: 20, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#4A90D9' },
    tipTitle: { fontSize: 14, fontWeight: '600', color: '#4A90D9', marginBottom: 8 },
    tipText: { fontSize: 14, color: '#5A6E8A', lineHeight: 22 },
    bottomSpace: { height: 30 },
});
