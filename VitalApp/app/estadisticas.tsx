import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    Platform
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuInferior from '../components/MenuInferior';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

export default function EstadisticasScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const [cargando, setCargando] = useState(true);
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('semana');
    const [estadisticas, setEstadisticas] = useState({
        totalEjercicios: 0,
        completados: 0,
        racha: 0,
        puntos: 0,
        calorias: 0,
        minutos: 0,
        progresoSemanal: [0, 0, 0, 0, 0, 0, 0],
        logros: [
            { id: 1, nombre: 'Primer paso', icono: '🌟', desbloqueado: false, condicion: 1 },
            { id: 2, nombre: '5 días seguidos', icono: '🔥', desbloqueado: false, condicion: 5 },
            { id: 3, nombre: '10 ejercicios', icono: '🎯', desbloqueado: false, condicion: 10 },
            { id: 4, nombre: '25 ejercicios', icono: '💎', desbloqueado: false, condicion: 25 },
            { id: 5, nombre: '50 ejercicios', icono: '👑', desbloqueado: false, condicion: 50 },
        ]
    });

    // Cargar datos cada vez que la pantalla tiene foco
    useFocusEffect(
        useCallback(() => {
            cargarEstadisticas();
        }, [])
    );

    const cargarEstadisticas = async () => {
        try {
            setCargando(true);

            // Leer progreso real desde AsyncStorage
            const statsStr = await AsyncStorage.getItem('userStats');
            const puntosStr = await AsyncStorage.getItem('userPoints');
            const completadosHoyStr = await AsyncStorage.getItem('completadosHoy');
            const historialStr = await AsyncStorage.getItem('weeklyHistory');
            const rachaStr = await AsyncStorage.getItem('streakDays');

            const stats = statsStr ? JSON.parse(statsStr) : null;
            const puntos = parseInt(puntosStr || '0');
            const completadosHoy = parseInt(completadosHoyStr || '0');

            // Historial semanal: guardamos un array de 7 días
            let progresoSemanal = [0, 0, 0, 0, 0, 0, 0];
            if (historialStr) {
                try {
                    const historial = JSON.parse(historialStr);
                    progresoSemanal = historial;
                } catch (e) {
                    console.log('Error parsing weekly history');
                }
            }

            // Si hay stats del home, usarlos para actualizar el día actual en el historial
            if (stats && completadosHoy > 0) {
                const dayIndex = new Date().getDay(); // 0=Dom, 1=Lun...
                progresoSemanal[dayIndex] = completadosHoy;
                await AsyncStorage.setItem('weeklyHistory', JSON.stringify(progresoSemanal));
            }

            const totalEjercicios = stats ? stats.exercises : 0;
            const racha = parseInt(rachaStr || '0');
            const calorias = stats ? stats.calories : 0;
            const minutos = stats ? stats.minutes : 0;

            // Meta: totalGoal es la meta semanal, weeklyGoal es lo logrado
            const metaTotal = stats ? (stats.totalGoal || 3) : 3;
            const hydrationStr = await AsyncStorage.getItem('userHydration');
            const hydration = parseInt(hydrationStr || '0');

            // Calcular logros dinámicamente
            const logrosActualizados = [
                { id: 1, nombre: 'Primer paso', icono: '🌟', desbloqueado: totalEjercicios >= 1, condicion: 1, tipo: 'ejercicios' },
                { id: 2, nombre: '5 días seguidos', icono: '🔥', desbloqueado: racha >= 5, condicion: 5, tipo: 'racha' },
                { id: 3, nombre: '10 ejercicios', icono: '🎯', desbloqueado: totalEjercicios >= 10, condicion: 10, tipo: 'ejercicios' },
                { id: 4, nombre: '25 ejercicios', icono: '💎', desbloqueado: totalEjercicios >= 25, condicion: 25, tipo: 'ejercicios' },
                { id: 5, nombre: '50 ejercicios', icono: '👑', desbloqueado: totalEjercicios >= 50, condicion: 50, tipo: 'ejercicios' },
                { id: 6, nombre: 'Hidratación Ideal', icono: '💧', desbloqueado: hydration >= 8, condicion: 8, tipo: 'hidratación' },
                { id: 7, nombre: 'Maestro del Bienestar', icono: '🏆', desbloqueado: totalEjercicios >= 100, condicion: 100, tipo: 'ejercicios' },
                { id: 8, nombre: 'Racha Dorada', icono: '✨', desbloqueado: racha >= 15, condicion: 15, tipo: 'racha' },
                { id: 9, nombre: 'Súper Atleta', icono: '⚡', desbloqueado: totalEjercicios >= 75, condicion: 75, tipo: 'ejercicios' },
            ];

            setEstadisticas({
                totalEjercicios: Math.max(metaTotal, totalEjercicios),
                completados: totalEjercicios,
                racha,
                puntos: puntos + (totalEjercicios * 10) + (hydration * 5),
                calorias,
                minutos,
                progresoSemanal,
                logros: logrosActualizados
            });

        } catch (error) {
            console.log('Error cargando estadísticas:', error);
        } finally {
            setCargando(false);
        }
    };

    // Calcular racha dinámica: actualizar al entrar
    const actualizarRacha = async () => {
        try {
            const lastDateStr = await AsyncStorage.getItem('lastExerciseDate');
            const rachaStr = await AsyncStorage.getItem('streakDays');
            const today = new Date().toDateString();

            if (lastDateStr === today) return; // Ya contó hoy

            const completadosHoy = await AsyncStorage.getItem('completadosHoy');
            if (parseInt(completadosHoy || '0') > 0) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                let racha = parseInt(rachaStr || '0');
                if (lastDateStr === yesterday.toDateString()) {
                    racha += 1; // Día consecutivo
                } else if (lastDateStr !== today) {
                    racha = 1; // Reinicia racha
                }

                await AsyncStorage.setItem('streakDays', racha.toString());
                await AsyncStorage.setItem('lastExerciseDate', today);
            }
        } catch (error) {
            console.log('Error actualizando racha:', error);
        }
    };

    const porcentajeCompletado = estadisticas.totalEjercicios > 0
        ? Math.min((estadisticas.completados / estadisticas.totalEjercicios) * 100, 100)
        : 0;
    const diasSemana = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const maxProgreso = Math.max(...estadisticas.progresoSemanal, 1);

    if (cargando) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Cargando tu progreso...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.gradientStart} />
            <ScrollView 
                style={[styles.container, { backgroundColor: colors.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Premium */}
                <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    style={styles.headerGradient}
                >
                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                        <TouchableOpacity onPress={() => router.push('/home')} style={{marginRight: 16}}>
                            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, {marginBottom: 0}]}>Mi Progreso</Text>
                    </View>
                    <Text style={styles.headerSubtitle}>Sigue avanzando cada día, estás haciendo un gran trabajo.</Text>
                    
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
                                activeOpacity={0.8}
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

                {/* Tarjeta de Progreso General */}
                <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={styles.progressHeader}>
                        <View style={styles.visualIndicator}>
                            <Ionicons name="heart" size={32} color="#EF4444" />
                            <View style={styles.pulseContainer}>
                                <View style={styles.pulse} />
                            </View>
                        </View>
                        <View style={{flex: 1, marginLeft: 16}}>
                            <Text style={[styles.progressTitle, { color: colors.text }]}>Estado de Meta</Text>
                            <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>Sigue así, vas muy bien</Text>
                        </View>
                        <View style={styles.percentageCircle}>
                            <Text style={styles.percentageText}>{Math.round(porcentajeCompletado)}%</Text>
                        </View>
                    </View>
                    
                    <View style={styles.progressBarContainer}>
                        <LinearGradient
                            colors={porcentajeCompletado >= 100 ? ['#059669', '#10B981'] : ['#2563EB', '#60A5FA']}
                            style={[styles.progressBar, { width: `${Math.min(porcentajeCompletado, 100)}%` }]}
                        />
                    </View>
                </View>

                {/* Grid de estadísticas rápidas */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrapper, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="flame" size={32} color="#D97706" />
                        </View>
                        <Text style={styles.statNumber}>{estadisticas.racha}</Text>
                        <Text style={styles.statLabel}>Días Seguidos</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrapper, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="star" size={32} color="#2563EB" />
                        </View>
                        <Text style={styles.statNumber}>{estadisticas.puntos}</Text>
                        <Text style={styles.statLabel}>Puntos Totales</Text>
                    </View>
                </View>

                {/* Stats extra */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrapper, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="fitness" size={32} color="#DC2626" />
                        </View>
                        <Text style={styles.statNumber}>{estadisticas.calorias}</Text>
                        <Text style={styles.statLabel}>Calorías</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrapper, { backgroundColor: '#F0FDF4' }]}>
                            <Ionicons name="time" size={32} color="#16A34A" />
                        </View>
                        <Text style={styles.statNumber}>{estadisticas.minutos}</Text>
                        <Text style={styles.statLabel}>Minutos</Text>
                    </View>
                </View>

                {/* Gráfico de actividad semanal */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Ionicons name="bar-chart" size={24} color="#1E293B" />
                        <Text style={styles.chartTitle}>Actividad Semanal</Text>
                    </View>
                    
                    {estadisticas.progresoSemanal.every(v => v === 0) ? (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <Ionicons name="analytics-outline" size={48} color="#CBD5E1" />
                            <Text style={{ color: '#94A3B8', fontSize: 16, marginTop: 12, fontWeight: '600' }}>
                                Completa ejercicios para ver tu gráfico
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.barsContainer}>
                            {estadisticas.progresoSemanal.map((valor, index) => (
                                <View key={index} style={styles.barWrapper}>
                                    <Text style={styles.barValue}>
                                        {valor > 0 ? valor : ''}
                                    </Text>
                                    <View style={styles.barOuterContainer}>
                                        <View style={[
                                            styles.bar,
                                            { height: `${Math.max((valor / maxProgreso) * 100, 5)}%`, backgroundColor: valor > 0 ? '#2563EB' : '#E2E8F0' }
                                        ]} />
                                    </View>
                                    <Text style={[styles.barLabel, valor > 0 && styles.barLabelActive]}>
                                        {diasSemana[index]}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Logros */}
                <View style={styles.achievementsCard}>
                    <View style={styles.achievementsHeader}>
                        <Ionicons name="trophy" size={24} color="#D97706" />
                        <Text style={styles.achievementsTitle}>Mis Logros</Text>
                        <View style={styles.achievementCount}>
                            <Text style={styles.achievementCountText}>
                                {estadisticas.logros.filter(l => l.desbloqueado).length}/{estadisticas.logros.length}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.achievementsGrid}>
                        {estadisticas.logros.map((logro) => (
                            <View 
                                key={logro.id} 
                                style={[
                                    styles.achievementItem, 
                                    !logro.desbloqueado && styles.achievementLocked
                                ]}
                            >
                                <View style={[styles.achievementIconCircle, !logro.desbloqueado && styles.achievementIconCircleLocked]}>
                                    <Text style={styles.achievementIcon}>{logro.icono}</Text>
                                </View>
                                <View style={styles.achievementInfo}>
                                    <Text style={[
                                        styles.achievementName, 
                                        !logro.desbloqueado && styles.achievementNameLocked
                                    ]}>
                                        {logro.nombre}
                                    </Text>
                                    <Text style={styles.achievementStatus}>
                                        {logro.desbloqueado ? '✅ Desbloqueado' : `Meta: ${logro.condicion} ${logro.tipo === 'ejercicios' ? 'ejercicios' : (logro.tipo === 'racha' ? 'días seguidos' : 'vasos de agua')}`}
                                    </Text>
                                </View>
                                {logro.desbloqueado && (
                                    <Ionicons name="checkmark-circle" size={28} color="#16A34A" />
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
    safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
    container: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    loadingText: { marginTop: 16, fontSize: 18, fontWeight: '600', color: '#1E293B' },
    headerGradient: {
        paddingHorizontal: 24, paddingTop: 30, paddingBottom: 40,
        borderBottomLeftRadius: 32, borderBottomRightRadius: 32, marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#1E3A8A',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: '0 8px 16px rgba(30, 58, 138, 0.15)',
            }
        }),
    },
    headerTitle: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', marginBottom: 8 },
    headerSubtitle: { fontSize: 18, color: '#DBEAFE', marginBottom: 28, fontWeight: '500', lineHeight: 24 },
    periodSelector: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 6 },
    periodButton: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
    periodButtonActive: { 
        backgroundColor: '#FFFFFF', 
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }
        })
    },
    periodText: { fontSize: 16, color: '#DBEAFE', fontWeight: '600' },
    periodTextActive: { color: '#1E3A8A', fontWeight: '800' },
    progressCard: {
        backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 20, padding: 24, borderRadius: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            }
        }),
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    progressTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginBottom: 4 },
    progressSubtitle: { fontSize: 16, color: '#64748B', fontWeight: '500' },
    percentageCircle: { backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    percentageText: { fontSize: 18, fontWeight: '800', color: '#2563EB' },
    progressBarContainer: { height: 16, backgroundColor: '#F1F5F9', borderRadius: 8, overflow: 'hidden', marginBottom: 16 },
    progressBar: { height: '100%', borderRadius: 8 },
    progressFooter: { flexDirection: 'row', alignItems: 'baseline' },
  progressTextDark: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  progressTextLight: { fontSize: 16, color: '#64748B', fontWeight: '600' },
  visualIndicator: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  pulseContainer: { position: 'absolute', width: '100%', height: '100%', borderRadius: 30, borderWidth: 2, borderColor: '#EF4444', opacity: 0.3 },
  pulse: { width: '100%', height: '100%', borderRadius: 30, backgroundColor: '#EF4444', opacity: 0.1 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20, gap: 16 },
    statCard: {
        flex: 1, backgroundColor: '#FFFFFF', padding: 24, borderRadius: 24, alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            }
        }),
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    statIconWrapper: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    statNumber: { fontSize: 36, fontWeight: '900', color: '#1E293B', marginBottom: 4 },
    statLabel: { fontSize: 15, color: '#64748B', fontWeight: '600', textAlign: 'center' },
    chartCard: { 
        backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 20, padding: 24, borderRadius: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            }
        }),
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    chartHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
    chartTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
    barsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 8 },
    barWrapper: { alignItems: 'center' },
    barValue: { fontSize: 16, color: '#1E293B', marginBottom: 8, fontWeight: '800' },
    barOuterContainer: { height: 140, justifyContent: 'flex-end', marginBottom: 12, width: 32, backgroundColor: '#F8FAFC', borderRadius: 16 },
    bar: { width: '100%', borderRadius: 16 },
    barLabel: { fontSize: 15, color: '#94A3B8', fontWeight: '700' },
    barLabelActive: { color: '#1E293B' },
    achievementsCard: { 
        backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 24, padding: 24, borderRadius: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            }
        }),
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    achievementsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
    achievementsTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', flex: 1 },
    achievementCount: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    achievementCountText: { fontSize: 14, fontWeight: '800', color: '#D97706' },
    achievementsGrid: { flexDirection: 'column' },
    achievementItem: { 
        backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 12,
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    achievementLocked: { backgroundColor: '#FFFFFF', opacity: 0.7 },
    achievementIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    achievementIconCircleLocked: { backgroundColor: '#F1F5F9' },
    achievementIcon: { fontSize: 28 },
    achievementInfo: { flex: 1 },
    achievementName: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    achievementNameLocked: { color: '#64748B' },
    achievementStatus: { fontSize: 14, color: '#64748B', fontWeight: '500' },
});