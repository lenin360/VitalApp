import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    StatusBar,
    Switch
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuInferior from './MenuInferior';
import { API_URL } from './config';
import { useTheme } from './components/useTheme';

export default function PerfilScreen() {
    const router = useRouter();
    const [editando, setEditando] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [usuario, setUsuario] = useState({
        id: '',
        nombre: '',
        email: '',
        edad: '',
        puntos: 0,
        ejerciciosCompletados: 0,
        rachaDias: 0
    });
    const { colors, temaOscuro, toggleTheme } = useTheme();
    const [notificaciones, setNotificaciones] = useState(true);
    const [mostrarMensaje, setMostrarMensaje] = useState('');
    const [mensajeError, setMensajeError] = useState('');

    // Cargar datos cada vez que la pantalla tiene foco
    useFocusEffect(
        useCallback(() => {
            cargarDatos();
        }, [])
    );

    const cargarDatos = async () => {
        try {
            setCargando(true);
            // Cargar datos de usuario de AsyncStorage
            const id = await AsyncStorage.getItem('userId');
            const nombre = await AsyncStorage.getItem('userName');
            const email = await AsyncStorage.getItem('userEmail');
            const edad = await AsyncStorage.getItem('userAge');
            const puntos = await AsyncStorage.getItem('userPoints');

            // Cargar estadísticas reales
            const statsStr = await AsyncStorage.getItem('userStats');
            const rachaStr = await AsyncStorage.getItem('streakDays');
            const stats = statsStr ? JSON.parse(statsStr) : null;

            // Cargar preferencias
            const temaGuardado = await AsyncStorage.getItem('darkMode');
            const notifGuardadas = await AsyncStorage.getItem('notifications');

            setUsuario({
                id: id || '',
                nombre: nombre || 'Usuario',
                email: email || '',
                edad: edad || '',
                puntos: parseInt(puntos || '0'),
                ejerciciosCompletados: stats ? stats.exercises : 0,
                rachaDias: parseInt(rachaStr || '0')
            });

            if (notifGuardadas !== null) setNotificaciones(notifGuardadas === 'true');
        } catch (error) {
            console.log('Error cargando datos del perfil:', error);
        } finally {
            setCargando(false);
        }
    };

    const guardarCambios = async () => {
        if (!usuario.nombre.trim()) {
            setMensajeError('El nombre no puede estar vacío');
            setTimeout(() => setMensajeError(''), 3000);
            return;
        }

        setGuardando(true);
        try {
            // Guardar en AsyncStorage primero (siempre funciona)
            await AsyncStorage.setItem('userName', usuario.nombre);
            await AsyncStorage.setItem('userEmail', usuario.email);
            await AsyncStorage.setItem('userAge', usuario.edad);

            // Intentar guardar en el backend
            if (usuario.id) {
                try {
                    const response = await fetch(`${API_URL}/user/${usuario.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            nombre: usuario.nombre,
                            email: usuario.email,
                            edad: parseInt(usuario.edad) || 0
                        })
                    });
                    const data = await response.json();
                    if (!data.success) {
                        console.log('Backend update warning:', data.message);
                    }
                } catch (backendError) {
                    console.log('Backend no disponible, datos guardados localmente');
                }
            }

            setEditando(false);
            setMostrarMensaje('Perfil guardado correctamente.');
            setTimeout(() => setMostrarMensaje(''), 3000);
        } catch (error) {
            console.error('Error guardando perfil:', error);
            setMensajeError('Error al guardar los cambios');
            setTimeout(() => setMensajeError(''), 3000);
        } finally {
            setGuardando(false);
        }
    };

    const toggleTemaOscuro = async (valor: boolean) => {
        await toggleTheme(valor);
    };

    const toggleNotificaciones = async (valor: boolean) => {
        setNotificaciones(valor);
        await AsyncStorage.setItem('notifications', valor.toString());
    };

    const handleLogout = () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Desea finalizar la sesión actual?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Confirmar', 
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.removeItem('userId');
                        await AsyncStorage.removeItem('userSession');
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    // Eliminado el objeto colors local ya que usamos el del hook useTheme

    if (cargando) {
        return (
            <View style={[styles.centeredContainer, { backgroundColor: colors.bg }]}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={[styles.loadingText, { color: colors.text }]}>Cargando tu perfil...</Text>
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
                {/* Header Premium y Avatar */}
                <LinearGradient
                    colors={temaOscuro ? ['#0F172A', '#1E3A8A'] : ['#1E3A8A', '#2563EB']}
                    style={styles.headerGradient}
                >
                    <View style={styles.headerTop}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <TouchableOpacity onPress={() => router.push('/home')} style={{marginRight: 16}}>
                                <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Mi Perfil</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => editando ? guardarCambios() : setEditando(true)}
                            style={styles.editButton}
                            activeOpacity={0.8}
                            disabled={guardando}
                        >
                            {guardando ? (
                                <ActivityIndicator size="small" color="#2563EB" />
                            ) : (
                                <>
                                    <Ionicons 
                                        name={editando ? 'checkmark-circle' : 'create'} 
                                        size={20} 
                                        color={editando ? "#10B981" : "#1E3A8A"} 
                                    />
                                    <Text style={[styles.editButtonText, editando && { color: '#10B981' }]}>
                                        {editando ? 'Guardar' : 'Editar'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {usuario.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </Text>
                            </View>
                            {editando && (
                                <View style={styles.avatarEditBadge}>
                                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                                </View>
                            )}
                        </View>
                        <Text style={styles.avatarName}>{usuario.nombre}</Text>
                        <Text style={styles.avatarEmail}>{usuario.email || 'Sin correo'}</Text>
                    </View>
                </LinearGradient>
                
                {/* Mensajes de feedback */}
                {mostrarMensaje !== '' && (
                    <View style={{ backgroundColor: '#D1FAE5', padding: 12, marginHorizontal: 20, marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: '#10B981', alignItems: 'center' }}>
                        <Text style={{ color: '#065F46', fontWeight: 'bold' }}>{mostrarMensaje}</Text>
                    </View>
                )}
                {mensajeError !== '' && (
                    <View style={{ backgroundColor: '#FEE2E2', padding: 12, marginHorizontal: 20, marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444', alignItems: 'center' }}>
                        <Text style={{ color: '#991B1B', fontWeight: 'bold' }}>{mensajeError}</Text>
                    </View>
                )}

                {/* Estadísticas Resumidas */}
                <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: colors.text }]}>{usuario.ejerciciosCompletados}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rutinas</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: '#D97706' }]}>{usuario.rachaDias}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Días (Racha)</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: '#059669' }]}>{usuario.puntos}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Puntos</Text>
                        </View>
                    </View>
                </View>

                {/* Información Personal */}
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Información Personal</Text>
                    
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Nombre completo</Text>
                        <TextInput
                            style={[
                                styles.input, 
                                { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText },
                                !editando && { backgroundColor: colors.inputDisabledBg, color: colors.textSecondary }
                            ]}
                            value={usuario.nombre}
                            onChangeText={(text) => setUsuario({ ...usuario, nombre: text })}
                            editable={editando}
                            placeholder="Tu nombre completo"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Correo electrónico</Text>
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText },
                                !editando && { backgroundColor: colors.inputDisabledBg, color: colors.textSecondary }
                            ]}
                            value={usuario.email}
                            onChangeText={(text) => setUsuario({ ...usuario, email: text })}
                            editable={editando}
                            keyboardType="email-address"
                            placeholder="tu@email.com"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Edad (Años)</Text>
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText },
                                !editando && { backgroundColor: colors.inputDisabledBg, color: colors.textSecondary }
                            ]}
                            value={usuario.edad}
                            onChangeText={(text) => setUsuario({ ...usuario, edad: text })}
                            editable={editando}
                            keyboardType="numeric"
                            placeholder="65"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>
                </View>

                {/* Ajustes */}
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Ajustes de la App</Text>
                    
                    <View style={styles.settingItem}>
                        <View style={[styles.settingIcon, { backgroundColor: temaOscuro ? '#1E3A8A' : '#EFF6FF' }]}>
                            <Ionicons name="notifications" size={24} color="#2563EB" />
                        </View>
                        <Text style={[styles.settingText, { color: colors.text }]}>Notificaciones</Text>
                        <Switch 
                            value={notificaciones}
                            onValueChange={toggleNotificaciones}
                            trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                            thumbColor={notificaciones ? '#2563EB' : '#F8FAFC'}
                        />
                    </View>
                    
                    <View style={styles.settingItem}>
                        <View style={[styles.settingIcon, { backgroundColor: temaOscuro ? '#581C87' : '#F3E8FF' }]}>
                            <Ionicons name="moon" size={24} color="#9333EA" />
                        </View>
                        <Text style={[styles.settingText, { color: colors.text }]}>Tema Oscuro</Text>
                        <Switch 
                            value={temaOscuro}
                            onValueChange={toggleTemaOscuro}
                            trackColor={{ false: '#CBD5E1', true: '#D8B4FE' }}
                            thumbColor={temaOscuro ? '#9333EA' : '#F8FAFC'}
                        />
                    </View>
                    
                    <TouchableOpacity 
                        style={[styles.settingItem, { borderBottomWidth: 0 }]}
                        onPress={() => router.push('/recordatorios')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.settingIcon, { backgroundColor: temaOscuro ? '#78350F' : '#FEF3C7' }]}>
                            <Ionicons name="alarm" size={24} color="#D97706" />
                        </View>
                        <Text style={[styles.settingText, { color: colors.text }]}>Recordatorios de Ejercicio</Text>
                        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Cerrar Sesión */}
                <TouchableOpacity 
                    style={[styles.logoutButton, temaOscuro && { backgroundColor: '#371717', borderColor: '#7F1D1D' }]} 
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out" size={24} color="#DC2626" />
                    <Text style={styles.logoutButtonText}>Cerrar Sesión Segura</Text>
                </TouchableOpacity>

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
    container: { 
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
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
        color: '#1E293B' 
    },
    headerGradient: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 24,
    },
    headerTop: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
    },
    headerTitle: { 
        fontSize: 32, 
        fontWeight: '900', 
        color: '#FFFFFF' 
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        minWidth: 100,
        justifyContent: 'center',
    },
    editButtonText: { 
        fontSize: 16, 
        color: '#1E3A8A', 
        fontWeight: '800',
        marginLeft: 8,
    },
    avatarSection: { 
        alignItems: 'center', 
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: { 
        width: 120, 
        height: 120, 
        borderRadius: 60, 
        backgroundColor: '#FFFFFF', 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#93C5FD',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    avatarText: { 
        fontSize: 48, 
        fontWeight: '900', 
        color: '#1E3A8A' 
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#1E3A8A',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    avatarName: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    avatarEmail: {
        fontSize: 16,
        color: '#DBEAFE',
        fontWeight: '500',
    },
    statsCard: { 
        backgroundColor: '#FFFFFF', 
        marginHorizontal: 20, 
        padding: 24, 
        borderRadius: 24, 
        marginTop: -30,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statsRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statItem: { 
        alignItems: 'center',
        flex: 1,
    },
    statNumber: { 
        fontSize: 28, 
        fontWeight: '900', 
        color: '#1E293B',
        marginBottom: 4,
    },
    statLabel: { 
        fontSize: 14, 
        color: '#64748B', 
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E2E8F0',
    },
    sectionCard: { 
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
    sectionTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: { 
        fontSize: 15, 
        fontWeight: '700', 
        color: '#475569', 
        marginBottom: 8,
    },
    input: { 
        borderWidth: 1, 
        borderColor: '#CBD5E1', 
        borderRadius: 16, 
        paddingHorizontal: 20, 
        paddingVertical: 16, 
        fontSize: 18, 
        backgroundColor: '#FFFFFF',
        color: '#1E293B',
        fontWeight: '500',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    settingIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingText: {
        flex: 1,
        fontSize: 18,
        color: '#1E293B',
        fontWeight: '600',
    },
    logoutButton: { 
        backgroundColor: '#FEF2F2', 
        marginHorizontal: 20, 
        padding: 20, 
        borderRadius: 20, 
        alignItems: 'center', 
        marginBottom: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FECACA',
    },
    logoutButtonText: { 
        color: '#DC2626', 
        fontSize: 18, 
        fontWeight: '800',
        marginLeft: 12,
    },
});