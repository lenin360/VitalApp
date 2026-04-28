import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    TextInput
} from 'react-native';
import { useRouter } from 'expo-router';

interface Ejercicio {
    id: number;
    nombre: string;
    descripcion: string;
    duracion: number;
    dificultad: string;
    categoria: string;
}

export default function EjerciciosScreen() {
    const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
    const [filtrados, setFiltrados] = useState<Ejercicio[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const router = useRouter();

    useEffect(() => {
        cargarEjercicios();
    }, []);

    useEffect(() => {
        if (busqueda.trim() === '') {
            setFiltrados(ejercicios);
        } else {
            const filtradosTemp = ejercicios.filter(e => 
                e.nombre.toLowerCase().includes(busqueda.toLowerCase())
            );
            setFiltrados(filtradosTemp);
        }
    }, [busqueda, ejercicios]);

    const cargarEjercicios = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/exercises');
            const data = await response.json();
            setEjercicios(data.exercises || []);
            setFiltrados(data.exercises || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setCargando(false);
        }
    };

    const verDetalle = (ejercicio: Ejercicio) => {
        router.push({
            pathname: '/detalle-ejercicio',
            params: {
                id: ejercicio.id.toString(),
                nombre: ejercicio.nombre,
                descripcion: ejercicio.descripcion || 'Sin descripción',
                duracion: ejercicio.duracion.toString(),
                dificultad: ejercicio.dificultad
            }
        });
    };

    if (cargando) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ejercicios</Text>
                <View style={{ width: 50 }} />
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar ejercicio..."
                    value={busqueda}
                    onChangeText={setBusqueda}
                />
            </View>

            <ScrollView style={styles.container}>
                {filtrados.map((ejercicio) => (
                    <TouchableOpacity 
                        key={ejercicio.id} 
                        style={styles.tarjetaEjercicio}
                        onPress={() => verDetalle(ejercicio)}
                    >
                        <Text style={styles.ejercicioNombre}>{ejercicio.nombre}</Text>
                        <Text style={styles.ejercicioDescripcion} numberOfLines={2}>
                            {ejercicio.descripcion || 'Ejercicio para tu bienestar'}
                        </Text>
                        <View style={styles.ejercicioFooter}>
                            <Text style={styles.duracion}>⏱️ {Math.floor(ejercicio.duracion / 60)} min</Text>
                            <Text style={styles.dificultad}>{ejercicio.dificultad}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
    backButton: { fontSize: 16, color: '#4CAF50' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#212529' },
    searchContainer: { padding: 15 },
    searchInput: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0' },
    container: { flex: 1, paddingHorizontal: 15 },
    tarjetaEjercicio: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
    ejercicioNombre: { fontSize: 16, fontWeight: 'bold', color: '#212529', marginBottom: 8 },
    ejercicioDescripcion: { fontSize: 14, color: '#6C757D', marginBottom: 12, lineHeight: 20 },
    ejercicioFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    duracion: { fontSize: 12, color: '#6C757D' },
    dificultad: { fontSize: 12, color: '#4CAF50', fontWeight: '500' },
});