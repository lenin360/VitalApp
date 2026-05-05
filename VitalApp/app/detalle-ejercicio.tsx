import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Alert,
    Modal,
    ActivityIndicator,
    StatusBar,
    Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from './components/useTheme';
import VideoPlayer from './components/VideoPlayer';

const { width } = Dimensions.get('window');

export default function DetalleEjercicioScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { colors, temaOscuro } = useTheme();
    const [completado, setCompletado] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [segundosVistos, setSegundosVistos] = useState(0);

    const TIEMPO_MINIMO = 20; // Segundos mínimos para completar

    // Soporte para seguimiento de tiempo en Web
    useEffect(() => {
        let interval: any;
        if (Platform.OS === 'web' && !cargando) {
            interval = setInterval(() => {
                setSegundosVistos(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [cargando]);

    // Parsing params for routine support
    const routineData = params.routine ? JSON.parse(params.routine as string) : null;
    const currentIndex = params.index ? parseInt(params.index as string) : 0;

    const ejercicio = {
        id: params.id,
        nombre: params.nombre || 'Ejercicio',
        descripcion: params.descripcion,
        duracion: parseInt(params.duracion as string) || 60,
        dificultad: params.dificultad || 'Normal'
    };

    const irAlSiguiente = () => {
        // Verificar si se ha visto lo suficiente antes de avanzar automáticamente
        if (segundosVistos < TIEMPO_MINIMO) {
            console.log('Video terminado demasiado pronto, no se avanza automáticamente');
            return;
        }

        if (routineData && currentIndex < routineData.exercises.length - 1) {
            const nextIndex = currentIndex + 1;
            const nextExercise = routineData.exercises[nextIndex];
            router.replace({
                pathname: '/detalle-ejercicio',
                params: {
                    id: (nextIndex + 1).toString(),
                    nombre: nextExercise.name,
                    descripcion: `Parte de la rutina: ${routineData.title}`,
                    duracion: '300',
                    dificultad: 'Fácil',
                    routine: JSON.stringify(routineData),
                    index: nextIndex.toString()
                }
            });
        } else {
            router.back();
        }
    };

    const handleCompletar = async () => {
        if (segundosVistos < TIEMPO_MINIMO) {
            Alert.alert(
                'Tiempo insuficiente', 
                `Para asegurar la efectividad del ejercicio, se requiere una duración mínima de ${TIEMPO_MINIMO} segundos.`,
                [{ text: 'Entendido' }]
            );
            return;
        }

        setCompletado(true);
        try {
            // Actualizar estadísticas en AsyncStorage
            const statsStr = await AsyncStorage.getItem('userStats');
            const stats = statsStr ? JSON.parse(statsStr) : {
                exercises: 0, calories: 0, minutes: 0,
                weeklyGoal: 0, totalGoal: 3, challenge: '7X4'
            };

            const duracionMin = Math.floor(ejercicio.duracion / 60);
            const caloriasEstimadas = duracionMin * 3; // ~3 cal/min for light exercise

            stats.exercises += 1;
            stats.calories += caloriasEstimadas;
            stats.minutes += duracionMin;
            stats.weeklyGoal = Math.min(stats.weeklyGoal + 1, stats.totalGoal);

            await AsyncStorage.setItem('userStats', JSON.stringify(stats));

            // Actualizar completados hoy
            const hoyStr = await AsyncStorage.getItem('completadosHoy');
            const hoy = parseInt(hoyStr || '0') + 1;
            await AsyncStorage.setItem('completadosHoy', hoy.toString());

            // Actualizar historial semanal
            const historialStr = await AsyncStorage.getItem('weeklyHistory');
            let historial = historialStr ? JSON.parse(historialStr) : [0, 0, 0, 0, 0, 0, 0];
            const dayIndex = new Date().getDay();
            historial[dayIndex] = hoy;
            await AsyncStorage.setItem('weeklyHistory', JSON.stringify(historial));

            // Actualizar racha
            const lastDateStr = await AsyncStorage.getItem('lastExerciseDate');
            const today = new Date().toDateString();
            if (lastDateStr !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const rachaStr = await AsyncStorage.getItem('streakDays');
                let racha = parseInt(rachaStr || '0');
                if (lastDateStr === yesterday.toDateString()) {
                    racha += 1;
                } else {
                    racha = 1;
                }
                await AsyncStorage.setItem('streakDays', racha.toString());
                await AsyncStorage.setItem('lastExerciseDate', today);
            }
        } catch (error) {
            console.log('Error guardando progreso:', error);
        }

        const isLast = routineData ? currentIndex === routineData.exercises.length - 1 : true;

        Alert.alert(
            'Registro guardado', 
            isLast ? 'Has finalizado la rutina. El progreso ha sido guardado correctamente.' : 'Ejercicio finalizado. ¿Desea continuar con el siguiente?', 
            [
                { text: isLast ? 'Volver' : 'Continuar', onPress: irAlSiguiente }
            ]
        );
    };

    // Búsqueda inteligente de videos reales de ejercicios en español en YouTube
    const getYouTubeId = (nombre: string) => {
        // Normalizamos quitando acentos y mayúsculas para evitar errores
        const n = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        if (n.includes('respiracion')) return 'sr__uvpVWCE';
        if (n.includes('cuello')) return 'HKbeLfkdhec';
        if (n.includes('marcha')) return 'SG_IuD0g2yo';
        if (n.includes('hombro')) return 'eE3XzQv6-Wc';
        if (n.includes('extension') || n.includes('pierna')) return 'buDC4qUuTFk';
        if (n.includes('elevacion') || n.includes('brazo')) return 'DsriajXRFJ4';
        if (n.includes('tobillo')) return '_HCnd3AGM3I';
        if (n.includes('estiramiento')) return 'eE3XzQv6-Wc';
        
        // Video de gimnasia en silla extremadamente suave en español por defecto
        return '_HCnd3AGM3I'; 
    };
    
    const videoId = getYouTubeId(ejercicio.nombre as string);

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.bg} />
            
            {/* Cabecera pegajosa */}
            <View style={[styles.topHeader, { backgroundColor: colors.bg, borderBottomColor: colors.cardBorder, borderBottomWidth: 1 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.topHeaderTitle, { color: colors.text }]} numberOfLines={1}>{ejercicio.nombre}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Reproductor de Video */}
                <View style={styles.videoCard}>
                    <View style={styles.videoContainer}>
                        <TouchableOpacity 
                            style={styles.fullscreenBtn}
                            onPress={() => setModalVisible(true)}
                        >
                            <Ionicons name="expand" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                        
                        {Platform.OS === 'web' ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                onLoad={() => setCargando(false)}
                            />
                        ) : (
                            <VideoPlayer 
                                videoId={videoId} 
                                onEnd={irAlSiguiente} 
                                onProgress={(segundos) => setSegundosVistos(segundos)}
                                onReady={() => setCargando(false)}
                            />
                        )}

                        {cargando && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color="#3B82F6" />
                                <Text style={styles.loadingText}>Cargando tu video...</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Info Principal */}
                <View style={styles.heroSection}>
                    <Text style={[styles.heroTitle, { color: colors.text }]}>{ejercicio.nombre}</Text>
                    
                    <View style={styles.badgesRow}>
                        <View style={[styles.badge, { backgroundColor: colors.settingIconBg }]}>
                            <Ionicons name="time" size={20} color={colors.isDark ? '#60A5FA' : '#2563EB'} />
                            <Text style={[styles.badgeText, { color: colors.isDark ? '#60A5FA' : '#2563EB' }]}>{Math.floor(ejercicio.duracion / 60)} min</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: colors.isDark ? '#064E3B' : '#F0FDF4' }]}>
                            <Ionicons name="bar-chart" size={20} color={colors.isDark ? '#34D399' : '#16A34A'} />
                            <Text style={[styles.badgeText, { color: colors.isDark ? '#34D399' : '#16A34A' }]}>{ejercicio.dificultad}</Text>
                        </View>
                    </View>
                </View>

                {/* Métricas rápidas */}
                <View style={styles.metricsGrid}>
                    <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.metricValue, { color: colors.isDark ? '#60A5FA' : '#1E3A8A' }]}>12</Text>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Veces realizado</Text>
                    </View>
                    <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.metricValue, { color: colors.isDark ? '#60A5FA' : '#1E3A8A' }]}>45</Text>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Calorías (est.)</Text>
                    </View>
                </View>

                {/* Descripción */}
                <View style={[styles.contentSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="information-circle" size={28} color="#2563EB" />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>¿De qué trata?</Text>
                    </View>
                    <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                        {ejercicio.descripcion || 'Este ejercicio está cuidadosamente diseñado para cuidar tus articulaciones y mejorar tu calidad de vida diaria.'}
                    </Text>
                </View>

                {/* Paso a paso */}
                <View style={[styles.contentSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="list" size={28} color="#2563EB" />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Instrucciones paso a paso</Text>
                    </View>
                    
                    <View style={styles.stepsContainer}>
                        {[
                            'Busca un espacio cómodo y seguro donde puedas moverte sin obstáculos.',
                            'Sigue los movimientos del instructor en el video a tu propio ritmo.',
                            'Respira profundamente y no contengas la respiración.',
                            'Si sientes fatiga extrema, pausa el video y descansa.'
                        ].map((paso, index) => (
                            <View key={index} style={styles.stepItem}>
                                <View style={[styles.stepNumberCircle, { backgroundColor: colors.settingIconBg }]}>
                                    <Text style={[styles.stepNumberText, { color: colors.isDark ? '#60A5FA' : '#2563EB' }]}>{index + 1}</Text>
                                </View>
                                <Text style={[styles.stepText, { color: colors.textSecondary }]}>{paso}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Precauciones (Alerta amigable) */}
                <View style={[styles.warningCard, colors.isDark && { backgroundColor: '#451a03', borderColor: '#92400e' }]}>
                    <View style={styles.warningHeader}>
                        <Ionicons name="warning" size={28} color="#D97706" />
                        <Text style={[styles.warningTitle, colors.isDark && { color: '#fbbf24' }]}>Precaución Importante</Text>
                    </View>
                    <Text style={[styles.warningText, colors.isDark && { color: '#fcd34d' }]}>
                        Si en algún momento sientes dolor agudo o mareos, detén el ejercicio inmediatamente. Siempre escucha a tu cuerpo.
                    </Text>
                </View>

                {/* Botones de acción */}
                <TouchableOpacity 
                    style={[
                        styles.mainButton, 
                        completado && styles.mainButtonSuccess,
                        (!completado && segundosVistos < TIEMPO_MINIMO) && { opacity: 0.7 }
                    ]}
                    onPress={handleCompletar}
                    disabled={completado}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={completado ? ['#059669', '#10B981'] : (segundosVistos < TIEMPO_MINIMO ? ['#64748B', '#94A3B8'] : [colors.gradientStart, colors.gradientEnd])}
                        style={styles.buttonGradient}
                    >
                        <Ionicons 
                            name={completado ? "checkmark-circle" : (segundosVistos < TIEMPO_MINIMO ? "time-outline" : (routineData ? "arrow-forward-circle" : "checkmark-done-circle"))} 
                            size={28} 
                            color="#FFFFFF" 
                        />
                        <Text style={styles.mainButtonText}>
                            {completado 
                                ? 'Ejercicio completado' 
                                : segundosVistos < TIEMPO_MINIMO 
                                    ? `Tiempo restante (${TIEMPO_MINIMO - segundosVistos}s)`
                                    : (routineData ? 'Siguiente ejercicio' : 'Marcar como completado')
                            }
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>

            {/* Modal de Video Pantalla Completa */}
            <Modal
                visible={modalVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={styles.fullscreenContainer}>
                    <TouchableOpacity 
                        style={styles.closeFullscreenBtn}
                        onPress={() => setModalVisible(false)}
                    >
                        <Ionicons name="close" size={32} color="#FFFFFF" />
                    </TouchableOpacity>
                    {Platform.OS === 'web' ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}?playsinline=1`}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <WebView
                            style={styles.fullscreenVideo}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            allowsFullscreenVideo={true}
                            source={{ uri: `https://www.youtube.com/embed/${videoId}?playsinline=1` }}
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#F8FAFC',
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    topHeaderTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
        flex: 1,
        textAlign: 'center',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    videoCard: {
        marginHorizontal: 20,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#000000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: 24,
    },
    videoContainer: {
        width: '100%',
        height: width * 0.55,
        position: 'relative',
    },
    video: {
        flex: 1,
    },
    fullscreenBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 12,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    loadingText: {
        marginTop: 12,
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '600',
    },
    heroSection: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 16,
        lineHeight: 38,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 12,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        gap: 8,
    },
    badgeText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2563EB',
    },
    metricsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 16,
        marginBottom: 24,
    },
    metricCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    metricValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1E3A8A',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
    contentSection: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        padding: 24,
        borderRadius: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
    },
    sectionText: {
        fontSize: 18,
        color: '#475569',
        lineHeight: 28,
        fontWeight: '400',
    },
    stepsContainer: {
        marginTop: 8,
    },
    stepItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    stepNumberCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        marginTop: 2,
    },
    stepNumberText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2563EB',
    },
    stepText: {
        flex: 1,
        fontSize: 18,
        color: '#475569',
        lineHeight: 28,
    },
    warningCard: {
        backgroundColor: '#FFFBEB',
        marginHorizontal: 20,
        padding: 24,
        borderRadius: 24,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#FEF3C7',
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    warningTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#B45309',
    },
    warningText: {
        fontSize: 17,
        color: '#92400E',
        lineHeight: 26,
        fontWeight: '500',
    },
    mainButton: {
        marginHorizontal: 20,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 6,
    },
    mainButtonSuccess: {
        shadowColor: '#059669',
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 24,
        gap: 12,
    },
    mainButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
    },
    fullscreenContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    fullscreenVideo: {
        flex: 1,
    },
    closeFullscreenBtn: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 12,
        borderRadius: 20,
    },
});