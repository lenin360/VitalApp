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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        router.replace('/login');
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Perfil</Text>
                <TouchableOpacity onPress={() => editando ? guardarCambios() : setEditando(true)}>
                    <Text style={styles.editButton}>{editando ? 'Guardar' : 'Editar'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.container}>
                <View style={styles.avatarSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>MG</Text>
                    </View>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.label}>Nombre completo</Text>
                    <TextInput
                        style={[styles.input, !editando && styles.inputDisabled]}
                        value={usuario.nombre}
                        onChangeText={(text) => setUsuario({ ...usuario, nombre: text })}
                        editable={editando}
                    />

                    <Text style={styles.label}>Correo electrónico</Text>
                    <TextInput
                        style={[styles.input, !editando && styles.inputDisabled]}
                        value={usuario.email}
                        onChangeText={(text) => setUsuario({ ...usuario, email: text })}
                        editable={editando}
                        keyboardType="email-address"
                    />

                    <Text style={styles.label}>Edad</Text>
                    <TextInput
                        style={[styles.input, !editando && styles.inputDisabled]}
                        value={usuario.edad}
                        onChangeText={(text) => setUsuario({ ...usuario, edad: text })}
                        editable={editando}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.statsCard}>
                    <Text style={styles.statsTitle}>Mis estadísticas</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{usuario.ejerciciosCompletados}</Text>
                            <Text style={styles.statLabel}>Ejercicios</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{usuario.rachaDias}</Text>
                            <Text style={styles.statLabel}>Días seguidos</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{usuario.puntos}</Text>
                            <Text style={styles.statLabel}>Puntos</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
                </TouchableOpacity>

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
    editButton: { fontSize: 16, color: '#4A90D9', fontWeight: '500' },
    avatarSection: { alignItems: 'center', marginTop: 24, marginBottom: 20 },
    avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#4A90D9', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF' },
    formCard: { backgroundColor: '#FFFFFF', marginHorizontal: 20, padding: 20, borderRadius: 12, marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '500', color: '#2C3E50', marginBottom: 6 },
    input: { borderWidth: 1, borderColor: '#E9ECEF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16, backgroundColor: '#FFFFFF' },
    inputDisabled: { backgroundColor: '#F8F9FA', color: '#8E9AAE' },
    statsCard: { backgroundColor: '#FFFFFF', marginHorizontal: 20, padding: 20, borderRadius: 12, marginBottom: 16 },
    statsTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 16, textAlign: 'center' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    statItem: { alignItems: 'center' },
    statNumber: { fontSize: 26, fontWeight: 'bold', color: '#4A90D9' },
    statLabel: { fontSize: 12, color: '#8E9AAE', marginTop: 5 },
    logoutButton: { backgroundColor: '#D94A4A', marginHorizontal: 20, padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 30, marginTop: 8 },
    logoutButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    bottomSpace: { height: 30 },
});
