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
    Platform,
    Linking
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';
import VideoPlayer from '../components/VideoPlayer';
import { getVideoIdForExercise } from '../constants/exercises';

const { width } = Dimensions.get('window');

export default function DetalleEjercicioScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { colors, temaOscuro } = useTheme();
    const [completado, setCompletado] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [segundosVistos, setSegundosVistos] = useState(0);



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
        id: params.id as string,
        nombre: (params.nombre as string) || 'Ejercicio',
        descripcion: params.descripcion as string,
        duracion: parseInt(params.duracion as string) || 60,
        dificultad: (params.dificultad as string) || 'Normal',
        url: decodeURIComponent((params.url as string) || '')
    };

    // Anti-trampa: requiere ver al menos 1/3 de la duración real del video
    const TIEMPO_MINIMO = Math.max(15, Math.floor(ejercicio.duracion / 3));

    const [celebrationVisible, setCelebrationVisible] = useState(false);

    const irAlSiguiente = () => {
        if (segundosVistos < TIEMPO_MINIMO) {
            console.log('Video terminado demasiado pronto, no se avanza automáticamente');
            return;
        }

        if (routineData && currentIndex < routineData.exercises.length - 1) {
            const nextIndex = currentIndex + 1;
            const nextExercise = routineData.exercises[nextIndex];
            const nextVideoId = nextExercise.url || getVideoIdForExercise(nextExercise.name);
            router.replace({
                pathname: '/detalle-ejercicio',
                params: {
                    id: (nextIndex + 1).toString(),
                    nombre: nextExercise.name,
                    descripcion: `Parte de la rutina: ${routineData.title}`,
                    duracion: '300',
                    dificultad: 'Fácil',
                    url: encodeURIComponent(nextVideoId),
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
        setCelebrationVisible(true);
        
        // El modal de celebración se encargará de avanzar o volver
    };

    const getYouTubeId = (url: string) => {
        if (!url) return null;
        const cleanUrl = url.trim();
        if (cleanUrl.length === 11) return cleanUrl;
        
        // Expresión regular robusta para varios formatos
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = cleanUrl.match(regExp);
        if (match && match[2].length === 11) {
            return match[2];
        }
        
        // Fallback manual si el regex falla
        if (cleanUrl.includes('v=')) return cleanUrl.split('v=')[1].split('&')[0].substring(0, 11);
        if (cleanUrl.includes('youtu.be/')) return cleanUrl.split('youtu.be/')[1].split('?')[0].substring(0, 11);
        if (cleanUrl.includes('embed/')) return cleanUrl.split('embed/')[1].split('?')[0].substring(0, 11);
        
        return null;
    };

    const videoId = getYouTubeId(ejercicio.url) || getVideoIdForExercise(ejercicio.nombre);

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
                
                {/* Reproductor de Video Adaptable */}
                <View style={styles.videoCard}>
                    <View style={styles.videoContainer}>
                        <VideoPlayer 
                            videoId={videoId || ''} 
                            onEnd={irAlSiguiente} 
                            onProgress={(segundos) => setSegundosVistos(segundos)}
                            onReady={() => setCargando(false)}
                        />

                        {cargando && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color="#3B82F6" />
                                <Text style={styles.loadingText}>Cargando tu video...</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Botón de fallback por si el video no carga */}
                <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: -10, marginBottom: 20, gap: 8 }}
                    onPress={() => {
                        if (typeof window !== 'undefined') {
                            window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
                        } else {
                            Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
                        }
                    }}
                >
                    <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 14, textDecorationLine: 'underline' }}>
                        ¿Problemas con el video? Ábrelo en YouTube
                    </Text>
                </TouchableOpacity>

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

                {/* Métricas dinámicas reales */}
                <View style={styles.metricsGrid}>
                    <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.metricValue, { color: colors.isDark ? '#60A5FA' : '#1E3A8A' }]}>
                            {ejercicio.duracion >= 60 
                                ? `${Math.floor(ejercicio.duracion / 60)}:${String(ejercicio.duracion % 60).padStart(2, '0')}`
                                : `${ejercicio.duracion}s`}
                        </Text>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Duración</Text>
                    </View>
                    <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.metricValue, { color: colors.isDark ? '#60A5FA' : '#1E3A8A' }]}>
                            {Math.max(5, Math.floor(ejercicio.duracion / 60) * 4)}
                        </Text>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Cal. estimadas</Text>
                    </View>
                    <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.metricValue, { color: colors.isDark ? '#34D399' : '#059669', fontSize: 18 }]}>
                            {Math.floor(TIEMPO_MINIMO / 60) > 0 
                                ? `${Math.floor(TIEMPO_MINIMO / 60)}:${String(TIEMPO_MINIMO % 60).padStart(2, '0')}`
                                : `${TIEMPO_MINIMO}s`}
                        </Text>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Mín. requerido</Text>
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

                {/* Paso a paso - Dinámico por tipo de ejercicio */}
                <View style={[styles.contentSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="list" size={28} color="#2563EB" />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Instrucciones paso a paso</Text>
                    </View>
                    
                    <View style={styles.stepsContainer}>
                        {(() => {
                            const n = (ejercicio.nombre || '').toLowerCase();
                            let pasos = [
                                'Busca un espacio cómodo y seguro donde puedas moverte sin obstáculos.',
                                'Sigue los movimientos del instructor en el video a tu propio ritmo.',
                                'Respira profundamente y no contengas la respiración.',
                                'Si sientes fatiga extrema, pausa el video y descansa.'
                            ];
                            if (n.includes('respiraci') || n.includes('diafragm') || n.includes('meditaci')) {
                                pasos = [
                                    'Siéntate cómodamente con la espalda recta y los pies apoyados en el suelo.',
                                    'Inhala lentamente por la nariz durante 4 segundos, llenando el abdomen.',
                                    'Mantén el aire 2 segundos y exhala suavemente por la boca durante 6 segundos.',
                                    'Repite el ciclo sin forzar. La calma llega con la práctica constante.'
                                ];
                            } else if (n.includes('hombro') || n.includes('círculo') || n.includes('circulo') || n.includes('cuello')) {
                                pasos = [
                                    'Siéntate o párate con la espalda recta y los hombros relajados.',
                                    'Realiza círculos lentos con los hombros hacia atrás, luego hacia adelante.',
                                    'Mueve la cabeza suavemente de lado a lado sin forzar el cuello.',
                                    'Si sientes tensión excesiva, reduce el rango de movimiento.'
                                ];
                            } else if (n.includes('estiramiento') || n.includes('lateral') || n.includes('espalda') || n.includes('relaj')) {
                                pasos = [
                                    'Colócate en una posición cómoda, de pie o sentado.',
                                    'Realiza el estiramiento suavemente, sin rebotes ni movimientos bruscos.',
                                    'Mantén cada posición entre 15 y 30 segundos respirando con calma.',
                                    'Nunca estires hasta sentir dolor; la sensación debe ser de tensión leve.'
                                ];
                            } else if (n.includes('caminata') || n.includes('marcha') || n.includes('paso') || n.includes('tobillo')) {
                                pasos = [
                                    'Párate cerca de una silla o pared por si necesitas apoyo.',
                                    'Levanta las rodillas de forma alternada a un ritmo cómodo para ti.',
                                    'Mantén la espalda erguida y los brazos moviéndose con naturalidad.',
                                    'Regula tu velocidad según tu nivel de energía del día.'
                                ];
                            } else if (n.includes('equilibrio') || n.includes('sentadilla')) {
                                pasos = [
                                    'Párate frente a una silla robusta que puedas sujetar si pierdes el equilibrio.',
                                    'Levanta un pie lentamente y mantén la posición el mayor tiempo posible.',
                                    'Cambia de pie y repite. Con el tiempo irás mejorando la estabilidad.',
                                    'No te frustres si al inicio es difícil; el equilibrio mejora con práctica.'
                                ];
                            } else if (n.includes('yoga') || n.includes('meditaci')) {
                                pasos = [
                                    'Prepara un espacio tranquilo y sin distracciones.',
                                    'Sigue las posturas del video a tu propio ritmo, sin competir.',
                                    'La respiración es clave: inhala al estirarte, exhala al relajarte.',
                                    'Termina la sesión con unos minutos de quietud y gratitud.'
                                ];
                            } else if (n.includes('brazo') || n.includes('biceps') || n.includes('bíceps') || n.includes('pesas') || n.includes('curl') || n.includes('press') || n.includes('elevaci')) {
                                pasos = [
                                    'Usa pesas ligeras (0.5 a 1 kg). Si no tienes, usa botellas de agua.',
                                    'Mantén los codos pegados al cuerpo durante todo el movimiento.',
                                    'Sube el peso en 2 segundos y bájalo en 4 segundos de forma controlada.',
                                    'Descansa 30 segundos entre cada serie. La forma es más importante que el peso.'
                                ];
                            }
                            return pasos.map((paso, index) => (
                                <View key={index} style={styles.stepItem}>
                                    <View style={[styles.stepNumberCircle, { backgroundColor: colors.settingIconBg }]}>
                                        <Text style={[styles.stepNumberText, { color: colors.isDark ? '#60A5FA' : '#2563EB' }]}>{index + 1}</Text>
                                    </View>
                                    <Text style={[styles.stepText, { color: colors.textSecondary }]}>{paso}</Text>
                                </View>
                            ));
                        })()}
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

            {/* Modal de Celebración - NUEVO */}
            <Modal
                visible={celebrationVisible}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.celebrationOverlay}>
                    <View style={[styles.celebrationCard, { backgroundColor: colors.card }]}>
                        <LinearGradient
                            colors={['#059669', '#10B981']}
                            style={styles.celebrationHeader}
                        >
                            <Ionicons name="trophy" size={80} color="#FFFFFF" />
                        </LinearGradient>
                        
                        <View style={styles.celebrationContent}>
                            <Text style={[styles.celebrationTitle, { color: colors.text }]}>¡Excelente Trabajo!</Text>
                            <Text style={[styles.celebrationSubtitle, { color: colors.textSecondary }]}>
                                Has completado: {ejercicio.nombre}
                            </Text>
                            
                            <View style={styles.statsRow}>
                                <View style={styles.miniStat}>
                                    <Text style={styles.miniStatValue}>+{Math.floor(ejercicio.duracion / 60)}</Text>
                                    <Text style={styles.miniStatLabel}>Min</Text>
                                </View>
                                <View style={styles.miniStat}>
                                    <Text style={styles.miniStatValue}>+{Math.max(5, Math.floor(ejercicio.duracion / 60) * 4)}</Text>
                                    <Text style={styles.miniStatLabel}>Kcal</Text>
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={styles.continueButton}
                                onPress={() => {
                                    setCelebrationVisible(false);
                                    irAlSiguiente();
                                }}
                            >
                                <Text style={styles.continueButtonText}>
                                    {routineData && currentIndex < routineData.exercises.length - 1 
                                        ? 'Siguiente Ejercicio' 
                                        : 'Finalizar Rutina'}
                                </Text>
                                <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
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
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
            }
        }),
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
    celebrationOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    celebrationCard: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 32,
        overflow: 'hidden',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    celebrationHeader: {
        width: '100%',
        paddingVertical: 40,
        alignItems: 'center',
    },
    celebrationContent: {
        padding: 32,
        alignItems: 'center',
        width: '100%',
    },
    celebrationTitle: {
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8,
    },
    celebrationSubtitle: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 32,
        marginBottom: 32,
    },
    miniStat: {
        alignItems: 'center',
    },
    miniStatValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#059669',
    },
    miniStatLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '700',
    },
    continueButton: {
        backgroundColor: '#059669',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 20,
        width: '100%',
        gap: 12,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    mainButton: {
        marginHorizontal: 20,
        borderRadius: 24,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#2563EB',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 16,
            },
            android: {
                elevation: 6,
            },
            web: {
                boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)',
            }
        }),
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