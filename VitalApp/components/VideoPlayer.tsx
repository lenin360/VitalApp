import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text, Linking, TouchableOpacity } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface VideoPlayerProps {
    videoId: string;      // El ID del video de YouTube (ej: "dQw4w9WgXcQ")
    playing?: boolean;    // Si está reproduciendo o no
    onEnd?: () => void;   // Callback cuando termina el video
    onProgress?: (seconds: number) => void; // Callback con el tiempo actual
    onReady?: () => void; // Callback cuando el video está listo
}

export default function VideoPlayer({ videoId, playing = true, onEnd, onProgress, onReady }: VideoPlayerProps) {
    // Extraer ID si se pasa una URL completa
    const getCleanId = (id: string) => {
        if (!id) return '';
        const trimmedId = id.trim();
        if (trimmedId.length === 11) return trimmedId;

        // Manejar varios formatos de URL de YouTube
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = trimmedId.match(regExp);
        if (match && match[2].length === 11) {
            return match[2];
        }

        // Fallback para IDs que podrían tener parámetros pegados
        if (trimmedId.includes('v=')) return trimmedId.split('v=')[1].split('&')[0].substring(0, 11);
        if (trimmedId.includes('youtu.be/')) return trimmedId.split('youtu.be/')[1].split('?')[0].substring(0, 11);
        if (trimmedId.includes('embed/')) return trimmedId.split('embed/')[1].split('?')[0].substring(0, 11);

        return trimmedId;
    };

    const cleanId = getCleanId(videoId);
    const playerRef = useRef<any>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);

    const onReadyInternal = useCallback(() => {
        console.log('Video listo:', cleanId);
        setCargando(false);
        if (onReady) onReady();
    }, [onReady, cleanId]);

    const onError = useCallback((e: any) => {
        console.error('Error en video (' + cleanId + ') code:', e);
        // YouTube API error codes: 2, 5, 100, 101, 150
        // Ignoramos errores menores para no romper la UI si el video puede reproducirse
        const errCode = String(e);
        if (cleanId.length !== 11 || errCode === '150' || errCode === '101' || errCode === '100') {
            setError(true);
        }
        setCargando(false);
    }, [cleanId]);

    const onStateChange = useCallback((state: string) => {
        console.log('Estado del video:', state);
        if (state === 'ended' && onEnd) {
            console.log('Video terminado, llamando a onEnd');
            onEnd();
        }
    }, [onEnd]);

    // Monitorear progreso cada segundo si está reproduciendo
    useEffect(() => {
        let interval: any;
        if (playing && !cargando && !error) {
            interval = setInterval(async () => {
                if (playerRef.current && onProgress) {
                    try {
                        const currentTime = await playerRef.current.getCurrentTime();
                        onProgress(currentTime);
                    } catch (e) {
                        // Ignorar errores silenciosamente
                    }
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [playing, cargando, error, onProgress]);

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color="#FF3B30" />
                <Text style={styles.errorText}>Video no disponible</Text>
                <Text style={styles.errorSubtext}>ID: {cleanId || videoId}</Text>

                <TouchableOpacity
                    style={styles.openYoutubeBtn}
                    onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${cleanId || videoId}`)}
                >
                    <Ionicons name="logo-youtube" size={20} color="#FFFFFF" />
                    <Text style={styles.openYoutubeText}>Ver en YouTube</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {cargando && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF3B30" />
                    <Text style={styles.loadingText}>Cargando video...</Text>
                </View>
            )}
            <YoutubePlayer
                ref={playerRef}
                height={220}
                width={width}
                videoId={cleanId}
                play={playing}
                forceAndroidAutoplay={true}
                baseUrl="https://www.youtube.com"
                onReady={onReadyInternal}
                onError={onError}
                onChangeState={onStateChange}
                volume={50}
                playbackRate={1}
                webViewProps={{
                    allowsFullscreenVideo: true,
                    androidLayerType: 'hardware',
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#000000',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        zIndex: 10,
    },
    loadingText: {
        marginTop: 10,
        color: '#FFFFFF',
        fontSize: 14,
    },
    errorContainer: {
        height: 220,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 16,
        marginBottom: 8,
    },
    errorSubtext: {
        color: '#AAAAAA',
        fontSize: 12,
        marginBottom: 16,
    },
    openYoutubeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF0000',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    openYoutubeText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
});
