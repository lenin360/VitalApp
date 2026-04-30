import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MenuInferior from './MenuInferior';

export default function PerfilScreen() {
    const router = useRouter();
    const [editando, setEditando] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [usuario, setUsuario] = useState({
        id: '',
        nombre: 'María González',
        email: 'maria@vitalapp.com',
        edad: '68',
        puntos: 450,
        ejerciciosCompletados: 12,
        rachaDias: 5
    });

    useEffect(() => {
        setTimeout(() => setCargando(false), 500);
    }, []);

    const guardarCambios = () => {
        setEditando(false);
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
    };

    const handleLogout = () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro de que quieres salir?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Salir', 
                    style: 'destructive',
                    onPress: () => router.replace('/login')
                }
            ]
        );
    };

    if (cargando) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#4A90D9" />
                <Text style={styles.loadingText}>Cargando perfil...</Text>
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
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Mi Perfil</Text>
                    <TouchableOpacity 
                        onPress={() => editando ? guardarCambios() : setEditando(true)}
                        style={styles.editButton}
                    >
                        <Ionicons 
                            name={editando ? 'checkmark-circle' : 'create-outline'} 
                            size={24} 
                            color="#4A90D9" 
                        />
                        <Text style={styles.editButtonText}>
                            {editando ? 'Guardar' : 'Editar'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {usuario.nombre.split(' ').map(n => n[0]).join('')}
                        </Text>
                    </View>
                    <Text style={styles.avatarName}>{usuario.nombre}</Text>
                    <Text style={styles.avatarEmail}>{usuario.email}</Text>
                </View>

                {/* Formulario */}
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Información personal</Text>
                    
                    <Text style={styles.label}>Nombre completo</Text>
                    <TextInput
                        style={[styles.input, !editando && styles.inputDisabled]}
                        value={usuario.nombre}
                        onChangeText={(text) => setUsuario({ ...usuario, nombre: text })}
                        editable={editando}
                        placeholder="Tu nombre completo"
                    />

                    <Text style={styles.label}>Correo electrónico</Text>
                    <TextInput
                        style={[styles.input, !editando && styles.inputDisabled]}
                        value={usuario.email}
                        onChangeText={(text) => setUsuario({ ...usuario, email: text })}
                        editable={editando}
                        keyboardType="email-address"
                        placeholder="tu@email.com"
                    />

                    <Text style={styles.label}>Edad</Text>
                    <TextInput
                        style={[styles.input, !editando && styles.inputDisabled]}
                        value={usuario.edad}
                        onChangeText={(text) => setUsuario({ ...usuario, edad: text })}
                        editable={editando}
                        keyboardType="numeric"
                        placeholder="65"
                    />
                </View>

                {/* Estadísticas */}
                <View style={styles.statsCard}>
                    <Text style={styles.statsTitle}>Mis estadísticas</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <View style={styles.statIconContainer}>
                                <Ionicons name="fitness" size={24} color="#4A90D9" />
                            </View>
                            <Text style={styles.statNumber}>{usuario.ejerciciosCompletados}</Text>
                            <Text style={styles.statLabel}>Ejercicios</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View style={styles.statIconContainer}>
                                <Ionicons name="flame" size={24} color="#FF6B35" />
                            </View>
                            <Text style={styles.statNumber}>{usuario.rachaDias}</Text>
                            <Text style={styles.statLabel}>Días seguidos</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View style={styles.statIconContainer}>
                                <Ionicons name="star" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.statNumber}>{usuario.puntos}</Text>
                            <Text style={styles.statLabel}>Puntos</Text>
                        </View>
                    </View>
                </View>

                {/* Configuración */}
                <View style={styles.settingsCard}>
                    <Text style={styles.settingsTitle}>Configuración</Text>
                    
                    <TouchableOpacity style={styles.settingItem}>
                        <Ionicons name="notifications-outline" size={22} color="#666" />
                        <Text style={styles.settingText}>Notificaciones</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.settingItem}>
                        <Ionicons name="moon-outline" size={22} color="#666" />
                        <Text style={styles.settingText}>Modo oscuro</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.settingItem}
                        onPress={() => router.push('/recordatorios')}
                    >
                        <Ionicons name="alarm-outline" size={22} color="#666" />
                        <Text style={styles.settingText}>Recordatorios</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                </View>

                {/* Botón cerrar sesión */}
                <TouchableOpacity 
                    style={styles.logoutButton} 
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
                </TouchableOpacity>
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
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingVertical: 20,
    },
    headerTitle: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: '#2C3E50' 
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF5FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    editButtonText: { 
        fontSize: 14, 
        color: '#4A90D9', 
        fontWeight: '600',
        marginLeft: 6,
    },
    avatarSection: { 
        alignItems: 'center', 
        marginBottom: 24,
    },
    avatar: { 
        width: 100, 
        height: 100, 
        borderRadius: 50, 
        backgroundColor: '#4A90D9', 
        justifyContent: 'center', 
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    avatarText: { 
        fontSize: 36, 
        fontWeight: 'bold', 
        color: '#FFFFFF' 
    },
    avatarName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 4,
    },
    avatarEmail: {
        fontSize: 14,
        color: '#8E9AAE',
    },
    formCard: { 
        backgroundColor: '#FFFFFF', 
        marginHorizontal: 20, 
        padding: 20, 
        borderRadius: 20, 
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    formTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 20,
    },
    label: { 
        fontSize: 13, 
        fontWeight: '600', 
        color: '#8E9AAE', 
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: { 
        borderWidth: 1, 
        borderColor: '#E9ECEF', 
        borderRadius: 12, 
        paddingHorizontal: 16, 
        paddingVertical: 14, 
        fontSize: 16, 
        marginBottom: 16, 
        backgroundColor: '#FFFFFF',
        color: '#2C3E50',
    },
    inputDisabled: { 
        backgroundColor: '#F8F9FA', 
        color: '#8E9AAE',
    },
    statsCard: { 
        backgroundColor: '#FFFFFF', 
        marginHorizontal: 20, 
        padding: 20, 
        borderRadius: 20, 
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    statsTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#2C3E50', 
        marginBottom: 20, 
        textAlign: 'center',
    },
    statsRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: { 
        alignItems: 'center',
        flex: 1,
    },
    statIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statNumber: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        color: '#2C3E50',
    },
    statLabel: { 
        fontSize: 11, 
        color: '#8E9AAE', 
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: 60,
        backgroundColor: '#E9ECEF',
    },
    settingsCard: { 
        backgroundColor: '#FFFFFF', 
        marginHorizontal: 20, 
        padding: 20, 
        borderRadius: 20, 
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    settingsTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#2C3E50', 
        marginBottom: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    settingText: {
        flex: 1,
        fontSize: 15,
        color: '#2C3E50',
        marginLeft: 12,
    },
    logoutButton: { 
        backgroundColor: '#D94A4A', 
        marginHorizontal: 20, 
        padding: 16, 
        borderRadius: 16, 
        alignItems: 'center', 
        marginBottom: 30,
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#D94A4A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    logoutButtonText: { 
        color: '#FFFFFF', 
        fontSize: 16, 
        fontWeight: '600',
        marginLeft: 8,
    },
});