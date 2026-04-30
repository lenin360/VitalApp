import React, { useState, useRef } from 'react';
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
    ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

export default function DetalleEjercicioScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const [completado, setCompletado] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [cargando, setCargando] = useState(true);

    const ejercicio = {
        id: params.id,
        nombre: params.nombre,
        descripcion: params.descripcion,
        duracion: parseInt(params.duracion as string) || 60,
        dificultad: params.dificultad
    };

    const handleCompletar = () => {
        setCompletado(true);
        Alert.alert('¡Felicidades!', 'Has completado este ejercicio');
    };

    // Videos por tipo de ejercicio
    const videosPorEjercicio: { [key: string]: string } = {
        'Respiración Profunda': '9kR6V8R5L5k',
        'Rotación de Cuello': 'qR0nB3xJ7WY',
        'Elevación de Brazos': 'X7mP2LdK9H8',
        'Caminata en el Lugar': 'FpR3tG6yJ9U',
        'Equilibrio': 'D2aVz8HrW4K',
    };
    const videoId = videosPorEjercicio[ejercicio.nombre as string] || '9kR6V8R5L5k';

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                
                {/* Header con breadcrumb (navegación) */}
                <View style={styles.breadcrumb}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.breadcrumbLink}>← Volver a ejercicios</Text>
                    </TouchableOpacity>
                    <Text style={styles.breadcrumbSeparator}> / </Text>
                    <Text style={styles.breadcrumbActive}>{ejercicio.nombre}</Text>
                </View>

                {/* Tarjeta del video (card estilo Bootstrap) */}
                <View style={styles.cardVideo}>
                    <View style={styles.videoContainer}>
                        <TouchableOpacity 
                            style={styles.fullscreenButton}
                            onPress={() => setModalVisible(true)}
                        >
                            <Text style={styles.fullscreenButtonText}>⛶</Text>
                        </TouchableOpacity>
                        <WebView
                            style={styles.video}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            allowsFullscreenVideo={true}
                            source={{ uri: `https://www.youtube.com/embed/${videoId}` }}
                            onLoadStart={() => setCargando(true)}
                            onLoadEnd={() => setCargando(false)}
                        />
                        {cargando && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color="#0d6efd" />
                                <Text style={styles.loadingText}>Cargando video...</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Título y meta información */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>{ejercicio.nombre}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.badgeInfo}>
                            <Text style={styles.badgeInfoText}>⏱️ {Math.floor(ejercicio.duracion / 60)} minutos</Text>
                        </View>
                        <View style={[
                            styles.badgeDifficulty,
                            ejercicio.dificultad === 'facil' && styles.badgeFacil,
                            ejercicio.dificultad === 'medio' && styles.badgeMedio,
                            ejercicio.dificultad === 'moderado' && styles.badgeModerado
                        ]}>
                            <Text style={styles.badgeDifficultyText}>
                                {ejercicio.dificultad === 'facil' ? 'Fácil' : 
                                 ejercicio.dificultad === 'medio' ? 'Intermedio' : 'Moderado'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Grid de información (3 columnas estilo Bootstrap) */}
                <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoCardEmoji}></Text>
                            <Text style={styles.infoCardNumber}>12</Text>
                            <Text style={styles.infoCardLabel}>veces realizado</Text>
                        </View>
                    </View>
                    <View style={styles.gridCol}>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoCardEmoji}></Text>
                            <Text style={styles.infoCardNumber}>45</Text>
                            <Text style={styles.infoCardLabel}>me gusta</Text>
                        </View>
                    </View>
                    <View style={styles.gridCol}>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoCardEmoji}></Text>
                            <Text style={styles.infoCardNumber}>4.8</Text>
                            <Text style={styles.infoCardLabel}>calificación</Text>
                        </View>
                    </View>
                </View>

                {/* Descripción (card estilo Bootstrap) */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}> Descripción</Text>
                    <Text style={styles.cardText}>
                        {ejercicio.descripcion || 'Ejercicio diseñado especialmente para adultos mayores. Mejora tu movilidad y bienestar general.'}
                    </Text>
                </View>

                {/* Instrucciones (card estilo Bootstrap) */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}> Instrucciones paso a paso</Text>
                    <View style={styles.instructionsList}>
                        <View style={styles.instructionItem}>
                            <View style={styles.instructionNumber}><Text style={styles.instructionNumberText}>1</Text></View>
                            <Text style={styles.instructionText}>Busca un espacio cómodo y seguro</Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <View style={styles.instructionNumber}><Text style={styles.instructionNumberText}>2</Text></View>
                            <Text style={styles.instructionText}>Sigue los movimientos del video</Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <View style={styles.instructionNumber}><Text style={styles.instructionNumberText}>3</Text></View>
                            <Text style={styles.instructionText}>Respira profundamente durante el ejercicio</Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <View style={styles.instructionNumber}><Text style={styles.instructionNumberText}>4</Text></View>
                            <Text style={styles.instructionText}>Si sientes fatiga, descansa unos minutos</Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <View style={styles.instructionNumber}><Text style={styles.instructionNumberText}>5</Text></View>
                            <Text style={styles.instructionText}>Al terminar, estira suavemente</Text>
                        </View>
                    </View>
                </View>

                {/* Beneficios (card estilo Bootstrap) */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}> Beneficios</Text>
                    <View style={styles.benefitsGrid}>
                        <View style={styles.benefitItem}>
                            <Text style={styles.benefitIcon}>✓</Text>
                            <Text style={styles.benefitText}>Mejora tu movilidad</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Text style={styles.benefitIcon}>✓</Text>
                            <Text style={styles.benefitText}>Fortalece tu cuerpo</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Text style={styles.benefitIcon}>✓</Text>
                            <Text style={styles.benefitText}>Aumenta tu energía</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Text style={styles.benefitIcon}>✓</Text>
                            <Text style={styles.benefitText}>Reduce el estrés</Text>
                        </View>
                    </View>
                </View>

                {/* Precauciones (card con borde de advertencia) */}
                <View style={[styles.card, styles.cardWarning]}>
                    <Text style={styles.cardTitleWarning}> Precauciones</Text>
                    <Text style={styles.cardTextWarning}>
                        Si sientes dolor o molestia durante el ejercicio, detente inmediatamente y consulta con tu médico.
                    </Text>
                </View>

                {/* Botón de completar */}
                <TouchableOpacity 
                    style={[styles.btnPrimary, completado && styles.btnSuccess]}
                    onPress={handleCompletar}
                    disabled={completado}
                >
                    <Text style={styles.btnPrimaryText}>
                        {completado ? '✓ Ejercicio completado' : '✔️ Marcar como completado'}
                    </Text>
                </TouchableOpacity>

                {/* Botón secundario para compartir */}
                <TouchableOpacity style={styles.btnSecondary}>
                    <Text style={styles.btnSecondaryText}> Compartir progreso</Text>
                </TouchableOpacity>

                <View style={styles.bottomSpace} />
            </ScrollView>

            {/* Modal pantalla completa */}
            <Modal
                visible={modalVisible}
                transparent={false}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={styles.fullscreenContainer}>
                    <TouchableOpacity 
                        style={styles.closeFullscreen}
                        onPress={() => setModalVisible(false)}
                    >
                        <Text style={styles.closeFullscreenText}>✕</Text>
                    </TouchableOpacity>
                    <WebView
                        style={styles.fullscreenVideo}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowsFullscreenVideo={true}
                        source={{ uri: `https://www.youtube.com/embed/${videoId}` }}
                    />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    // Breadcrumb (navegación)
    breadcrumb: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        flexWrap: 'wrap',
    },
    breadcrumbLink: {
        fontSize: 14,
        color: '#0d6efd',
        fontWeight: '500',
    },
    breadcrumbSeparator: {
        fontSize: 14,
        color: '#6c757d',
    },
    breadcrumbActive: {
        fontSize: 14,
        color: '#6c757d',
    },
    // Tarjeta de video
    cardVideo: {
        backgroundColor: '#000000',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    videoContainer: {
        width: '100%',
        height: 220,
        backgroundColor: '#000',
        position: 'relative',
    },
    video: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#fff',
        fontSize: 14,
    },
    fullscreenButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Título
    titleSection: {
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    badgeInfo: {
        backgroundColor: '#e9ecef',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeInfoText: {
        fontSize: 13,
        color: '#495057',
    },
    badgeDifficulty: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeFacil: {
        backgroundColor: '#d1e7dd',
    },
    badgeMedio: {
        backgroundColor: '#fff3cd',
    },
    badgeModerado: {
        backgroundColor: '#f8d7da',
    },
    badgeDifficultyText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#212529',
    },
    // Grid 3 columnas
    gridRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
        marginBottom: 16,
    },
    gridCol: {
        width: '33.333%',
        paddingHorizontal: 8,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    infoCardEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    infoCardNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0d6efd',
    },
    infoCardLabel: {
        fontSize: 11,
        color: '#6c757d',
    },
    // Cards generales
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 12,
    },
    cardText: {
        fontSize: 14,
        color: '#495057',
        lineHeight: 22,
    },
    // Instrucciones con números
    instructionsList: {
        marginTop: 4,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    instructionNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#0d6efd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    instructionNumberText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        color: '#495057',
    },
    // Beneficios en grid 2 columnas
    benefitsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    benefitItem: {
        width: '50%',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    benefitIcon: {
                fontSize: 16,
        color: '#198754',
        marginRight: 8,
        fontWeight: 'bold',
    },
    benefitText: {
        fontSize: 14,
        color: '#495057',
    },
    // Card de advertencia
    cardWarning: {
        backgroundColor: '#fff3cd',
        borderWidth: 1,
        borderColor: '#ffecb5',
    },
    cardTitleWarning: {
        fontSize: 16,
        fontWeight: '600',
        color: '#856404',
        marginBottom: 8,
    },
    cardTextWarning: {
        fontSize: 14,
        color: '#856404',
        lineHeight: 22,
    },
    // Botones estilo Bootstrap
    btnPrimary: {
        backgroundColor: '#0d6efd',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 12,
    },
    btnPrimaryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    btnSuccess: {
        backgroundColor: '#198754',
    },
    btnSecondary: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#0d6efd',
    },
    btnSecondaryText: {
        color: '#0d6efd',
        fontSize: 15,
        fontWeight: '500',
    },
    bottomSpace: {
        height: 20,
    },
    // Pantalla completa
    fullscreenContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    fullscreenVideo: {
        flex: 1,
    },
    closeFullscreen: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeFullscreenText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
});