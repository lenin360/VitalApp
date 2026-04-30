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
import { LinearGradient } from 'expo-linear-gradient';
import MenuInferior from './MenuInferior';
const { width } = Dimensions.get('window');

export default function EstadisticasScreen() {
    const router = useRouter();
    const [cargando, setCargando] = useState(true);
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('semana');
    const [estadisticas, setEstadisticas] = useState({
        totalEjercicios: 24,
        completados: 12,
        racha: 5,
        puntos: 450,
        progresoSemanal: [2, 3, 1, 4, 2, 3, 2],
        logros: [
            { id: 1, nombre: 'Primer paso', icono: '', desbloqueado: true },
            { id: 2, nombre: '5 días seguidos', icono: '', desbloqueado: true },
            { id: 3, nombre: '10 ejercicios', icono: '', desbloqueado: false },
            { id: 4, nombre: 'Maestro', icono: '', desbloqueado: false },
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
            <ScrollView 
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header con gradiente */}
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.headerGradient}
                >
                    <Text style={styles.headerTitle}>Mi Progreso</Text>
                    <Text style={styles.headerSubtitle}>Sigue avanzando cada día</Text>
                    
                    {/* Selector de período */}
                    <View style={styles.periodSelector}>
                        {['semana', 'mes', 'año'].map((periodo) => (
                            <TouchableOpacity
                                key={periodo}
                                style={[
                                    styles.periodButton,
                                    periodoSeleccionado === periodo && styles.periodButtonActive
                                ]}
                                onPress={() => setPeriodoSeleccionado(periodo)}
                            >
                                <Text style={[
                                    styles.periodText,
                                    periodoSeleccionado === periodo && styles.periodTextActive
                                ]}>
                                    {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </LinearGradient>

                {/* Tarjeta de progreso general */}
                <View style={styles.progressCard}>
                    <Text style={styles.progressTitle}>Progreso general</Text>
                    <View style={styles.progressBarContainer}>
                        <LinearGradient
                            colors={['#4A90D9', '#357ABD']}
                            style={[styles.progressBar, { width: `${porcentajeCompletado}%` }]}
                        />
                    </View>
                    <View style={styles.progressFooter}>
                        <Text style={styles.progressText}>
                            {estadisticas.completados} de {estadisticas.totalEjercicios} ejercicios
                        </Text>
                        <Text style={styles.progressPercentage}>
                            {Math.round(porcentajeCompletado)}%
                        </Text>
                    </View>
                </View>

                {/* Grid de estadísticas rápidas */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statEmoji}></Text>
                        <Text style={styles.statNumber}>{estadisticas.racha}</Text>
                        <Text style={styles.statLabel}>Días seguidos</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statEmoji}></Text>
                        <Text style={styles.statNumber}>{estadisticas.puntos}</Text>
                        <Text style={styles.statLabel}>Puntos totales</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statEmoji}></Text>
                        <Text style={styles.statNumber}>{estadisticas.completados}</Text>
                        <Text style={styles.statLabel}>Completados</Text>
                    </View>
                </View>

                {/* Gráfico de actividad semanal */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Actividad semanal</Text>
                    <View style={styles.barsContainer}>
                        {estadisticas.progresoSemanal.map((valor, index) => (
                            <View key={index} style={styles.barWrapper}>
                                <Text style={styles.barValue}>
                                    {valor > 0 ? valor : ''}
                                </Text>
                                <View style={styles.barOuterContainer}>
                                    <LinearGradient
                                        colors={['#4A90D9', '#667eea']}
                                        style={[
                                            styles.bar,
                                            { height: (valor / maxProgreso) * 100 }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.barLabel}>{diasSemana[index]}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Logros */}
                <View style={styles.achievementsCard}>
                    <Text style={styles.achievementsTitle}> Logros</Text>
                    <View style={styles.achievementsGrid}>
                        {estadisticas.logros.map((logro) => (
                            <View 
                                key={logro.id} 
                                style={[
                                    styles.achievementItem, 
                                    !logro.desbloqueado && styles.achievementLocked
                                ]}
                            >
                                <Text style={styles.achievementIcon}>{logro.icono}</Text>
                                <Text style={[
                                    styles.achievementName, 
                                    !logro.desbloqueado && styles.achievementNameLocked
                                ]}>
                                    {logro.nombre}
                                </Text>
                                {logro.desbloqueado && (
                                    <Text style={styles.achievementCheck}>✓</Text>
                                )}
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <MenuInferior />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#F5F7FA' 
    },
    container: { 
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 80,
    },
    centeredContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#F5F7FA' 
    },
    loadingText: { 
        marginTop: 12, 
        fontSize: 14, 
        color: '#4A90D9' 
    },
    headerGradient: {
        padding: 25,
        paddingTop: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
    },
    headerTitle: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: '#FFFFFF',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 20,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 25,
        padding: 4,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 25,
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: '#FFFFFF',
    },
    periodText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    periodTextActive: {
        color: '#667eea',
        fontWeight: '600',
    },
    progressCard: { 
        backgroundColor: '#FFFFFF', 
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20, 
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    progressTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#2C3E50', 
        marginBottom: 16,
    },
    progressBarContainer: { 
        height: 12, 
        backgroundColor: '#E9ECEF', 
        borderRadius: 6, 
        overflow: 'hidden', 
        marginBottom: 12,
    },
    progressBar: { 
        height: '100%', 
        borderRadius: 6,
    },
    progressFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressText: { 
        fontSize: 13, 
        color: '#8E9AAE',
    },
    progressPercentage: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4A90D9',
    },
    statsGrid: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        marginBottom: 16,
    },
    statCard: { 
        flex: 1, 
        backgroundColor: '#FFFFFF', 
        marginHorizontal: 4, 
        padding: 16, 
        borderRadius: 16, 
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    statEmoji: { 
        fontSize: 28, 
        marginBottom: 6,
    },
    statNumber: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        color: '#4A90D9',
    },
    statLabel: { 
        fontSize: 10, 
        color: '#8E9AAE', 
        marginTop: 4,
        textAlign: 'center',
    },
    chartCard: { 
        backgroundColor: '#FFFFFF', 
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20, 
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    chartTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#2C3E50', 
        marginBottom: 20, 
        textAlign: 'center',
    },
    barsContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        alignItems: 'flex-end',
    },
    barWrapper: { 
        alignItems: 'center',
    },
    barValue: {
        fontSize: 11,
        color: '#8E9AAE',
        marginBottom: 6,
        fontWeight: '500',
    },
    barOuterContainer: { 
        height: 120, 
        justifyContent: 'flex-end', 
        marginBottom: 8,
    },
    bar: { 
        width: 32, 
        borderRadius: 8,
        minHeight: 4,
    },
    barLabel: { 
        fontSize: 12, 
        color: '#8E9AAE',
        fontWeight: '500',
    },
    achievementsCard: { 
        backgroundColor: '#FFFFFF', 
        marginHorizontal: 16,
        marginBottom: 20,
        padding: 20, 
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    achievementsTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#2C3E50', 
        marginBottom: 16,
    },
    achievementsGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between',
    },
    achievementItem: { 
        width: '48%', 
        backgroundColor: '#F0F7FF', 
        padding: 12, 
        borderRadius: 12, 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 10,
    },
    achievementLocked: { 
        backgroundColor: '#F8F9FA', 
        opacity: 0.6,
    },
    achievementIcon: { 
        fontSize: 24, 
        marginRight: 10,
    },
    achievementName: { 
        flex: 1, 
        fontSize: 12, 
        fontWeight: '500', 
        color: '#2C3E50',
    },
    achievementNameLocked: { 
        color: '#8E9AAE',
    },
    achievementCheck: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
});