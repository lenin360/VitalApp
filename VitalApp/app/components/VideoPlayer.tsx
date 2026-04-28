import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width } = Dimensions.get('window');

interface VideoPlayerProps {
    videoId: string;      // El ID del video de YouTube (ej: "dQw4w9WgXcQ")
    playing?: boolean;    // Si está reproduciendo o no
}

export default function VideoPlayer({ videoId, playing = true }: VideoPlayerProps) {
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);

    const onReady = useCallback(() => {
        console.log('✅ Video listo');
        setCargando(false);
    }, []);

    const onError = useCallback((e: any) => {
        console.error('❌ Error en video:', e);
        setError(true);
        setCargando(false);
    }, []);

    const onStateChange = useCallback((state: string) => {
        console.log('Estado del video:', state);
        if (state === 'ended') {
            console.log('Video terminado');
        }
    }, []);

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ No se pudo cargar el video</Text>
                <Text style={styles.errorSubtext}>Video ID: {videoId}</Text>
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
                height={220}
                width={width}
                videoId={videoId}
                play={playing}
                onReady={onReady}
                onError={onError}
                onChangeState={onStateChange}
                volume={50}
                playbackRate={1}
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
    },
});