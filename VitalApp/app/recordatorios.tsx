import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Switch,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';

export default function RecordatoriosScreen() {
    const router = useRouter();
    const [cargando, setCargando] = useState(true);
    const [notificacionesActivas, setNotificacionesActivas] = useState(true);
    const [recordatorios, setRecordatorios] = useState([
        { id: 1, hora: '09:00', activo: true, dias: ['L', 'M', 'M', 'J', 'V'] },
        { id: 2, hora: '18:00', activo: true, dias: ['L', 'M', 'M', 'J', 'V'] },
    ]);

    useEffect(() => {
        setTimeout(() => setCargando(false), 500);
    }, []);

    const toggleRecordatorio = (id: number) => {
        setRecordatorios(prev => prev.map(r =>
            r.id === id ? { ...r, activo: !r.activo } : r
        ));
    };

    const agregarRecordatorio = () => {
        Alert.alert('Nuevo recordatorio', 'Próximamente podrás agregar más horarios');
    };

    if (cargando) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#4A90D9" />
                <Text style={styles.loadingText}>Cargando recordatorios...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Recordatorios</Text>
                <TouchableOpacity onPress={agregarRecordatorio}>
                    <Text style={styles.addButton}>+ Agregar</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.container}>
                <View style={styles.globalCard}>
                    <View>
                        <Text style={styles.globalTitle}>Notificaciones</Text>
                        <Text style={styles.globalSubtitle}>Recibir recordatorios diarios</Text>
                    </View>
                    <Switch
                        value={notificacionesActivas}
                        onValueChange={setNotificacionesActivas}
                        trackColor={{ false: '#E9ECEF', true: '#4A90D9' }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                <Text style={styles.sectionTitle}>Horarios programados</Text>
                
                {recordatorios.map((recordatorio) => (
                    <View key={recordatorio.id} style={styles.reminderCard}>
                        <View style={styles.reminderInfo}>
                            <Text style={styles.reminderTime}>⏰ {recordatorio.hora}</Text>
                            <View style={styles.diasContainer}>
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((dia) => (
                                    <View key={dia} style={[
                                        styles.diaBadge,
                                        recordatorio.dias.includes(dia) && styles.diaBadgeActive
                                    ]}>
                                        <Text style={[
                                            styles.diaText,
                                            recordatorio.dias.includes(dia) && styles.diaTextActive
                                        ]}>{dia}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                        <Switch
                            value={recordatorio.activo}
                            onValueChange={() => toggleRecordatorio(recordatorio.id)}
                            trackColor={{ false: '#E9ECEF', true: '#4A90D9' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                ))}

                <View style={styles.motivationCard}>
                    <Text style={styles.motivationTitle}>💪 Consejo Vital</Text>
                    <Text style={styles.motivationText}>
                        La constancia es la clave del éxito. Establece horarios fijos para tus ejercicios.
                    </Text>
                </View>

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
    addButton: { fontSize: 16, color: '#4A90D9', fontWeight: '500' },
    globalCard: { backgroundColor: '#FFFFFF', margin: 16, padding: 20, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    globalTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
    globalSubtitle: { fontSize: 12, color: '#8E9AAE', marginTop: 4 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#2C3E50', marginHorizontal: 16, marginBottom: 12 },
    reminderCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reminderInfo: { flex: 1 },
    reminderTime: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8 },
    diasContainer: { flexDirection: 'row', gap: 8 },
    diaBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', marginRight: 6 },
    diaBadgeActive: { backgroundColor: '#4A90D9' },
    diaText: { fontSize: 12, color: '#8E9AAE' },
    diaTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
    motivationCard: { backgroundColor: '#F0F7FF', margin: 16, padding: 20, borderRadius: 12, marginTop: 24 },
    motivationTitle: { fontSize: 16, fontWeight: 'bold', color: '#4A90D9', marginBottom: 8 },
    motivationText: { fontSize: 14, color: '#5A6E8A', lineHeight: 22 },
    bottomSpace: { height: 30 },
});
