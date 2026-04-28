import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function EstadisticasScreen() {
    const router = useRouter();
    const [cargando, setCargando] = useState(true);
    const [estadisticas, setEstadisticas] = useState({
        totalEjercicios: 24,
        completados: 12,
        racha: 5,
        puntos: 450,
        progresoSemanal: [2, 3, 1, 4, 2, 3, 2],
        logros: [
            { id: 1, nombre: 'Primer paso', icono: '🌟', desbloqueado: true },
            { id: 2, nombre: '5 días seguidos', icono: '🔥', desbloqueado: true },
            { id: 3, nombre: '10 ejercicios', icono: '💪', desbloqueado: false },
        ]
    });

    useEffect(() => {
        setTimeout(() => setCargando(false), 500);
    }, []);

    const porcentajeCompletado = (estadisticas.completados / estadisticas.totalEjercicios) * 100;
    const diasSemana = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const maxProgreso = Math.max(...estadisticas.progresoSemanal, 1);

    if (cargando) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#4A90D9" />
                <Text style={styles.loadingText}>Cargando estadísticas...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Progreso</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.container}>
                <View style={styles.progressCard}>
                    <Text style={styles.progressTitle}>Progreso general</Text>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${porcentajeCompletado}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{estadisticas.completados} de {estadisticas.totalEjercicios} ejercicios</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statCardEmoji}>🔥</Text>
                        <Text style={styles.statCardNumber}>{estadisticas.racha}</Text>
                        <Text style={styles.statCardLabel}>Días seguidos</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statCardEmoji}>⭐</Text>
                        <Text style={styles.statCardNumber}>{estadisticas.puntos}</Text>
                        <Text style={styles.statCardLabel}>Puntos</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statCardEmoji}>✅</Text>
                        <Text style={styles.statCardNumber}>{estadisticas.completados}</Text>
                        <Text style={styles.statCardLabel}>Completados</Text>
                    </View>
                </View>

                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Actividad semanal</Text>
                    <View style={styles.barsContainer}>
                        {estadisticas.progresoSemanal.map((valor, index) => (
                            <View key={index} style={styles.barWrapper}>
                                <View style={styles.barContainer}>
                                    <View style={[styles.bar, { height: (valor / maxProgreso) * 80 }]} />
                                </View>
                                <Text style={styles.barLabel}>{diasSemana[index]}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.achievementsCard}>
                    <Text style={styles.achievementsTitle}>🏆 Logros</Text>
                    <View style={styles.achievementsGrid}>
                        {estadisticas.logros.map((logro) => (
                            <View key={logro.id} style={[styles.achievementItem, !logro.desbloqueado && styles.achievementLocked]}>
                                <Text style={styles.achievementIcon}>{logro.icono}</Text>
                                <Text style={[styles.achievementName, !logro.desbloqueado && styles.achievementNameLocked]}>
                                    {logro.nombre}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.bottomSpace} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
    container: { flex: 1 },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
    loadingText: { marginTop: 12, fontSize: 14, color: '#4A90D9' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
    backButton: { fontSize: 16, color: '#4A90D9', fontWeight: '500' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
    progressCard: { backgroundColor: '#FFFFFF', margin: 16, padding: 20, borderRadius: 12 },
    progressTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
    progressBarContainer: { height: 10, backgroundColor: '#E9ECEF', borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
    progressBar: { height: '100%', backgroundColor: '#4A90D9', borderRadius: 5 },
    progressText: { fontSize: 12, color: '#8E9AAE' },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: '#FFFFFF', marginHorizontal: 4, padding: 16, borderRadius: 12, alignItems: 'center' },
    statCardEmoji: { fontSize: 28, marginBottom: 6 },
    statCardNumber: { fontSize: 24, fontWeight: 'bold', color: '#4A90D9' },
    statCardLabel: { fontSize: 11, color: '#8E9AAE', marginTop: 4 },
    chartCard: { backgroundColor: '#FFFFFF', margin: 16, padding: 20, borderRadius: 12 },
    chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 20, textAlign: 'center' },
    barsContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
    barWrapper: { alignItems: 'center' },
    barContainer: { height: 100, justifyContent: 'flex-end', marginBottom: 8 },
    bar: { width: 30, backgroundColor: '#4A90D9', borderRadius: 6 },
    barLabel: { fontSize: 12, color: '#8E9AAE' },
    achievementsCard: { backgroundColor: '#FFFFFF', margin: 16, padding: 20, borderRadius: 12 },
    achievementsTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 16 },
    achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    achievementItem: { width: '48%', backgroundColor: '#F0F7FF', padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    achievementLocked: { backgroundColor: '#F8F9FA', opacity: 0.6 },
    achievementIcon: { fontSize: 24, marginRight: 10 },
    achievementName: { flex: 1, fontSize: 13, fontWeight: '500', color: '#2C3E50' },
    achievementNameLocked: { color: '#8E9AAE' },
    bottomSpace: { height: 30 },
});
