import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    SafeAreaView
} from 'react-native';
import { apiService } from '../servicios/api';
import TarjetaEjercicio from '../componentes/TarjetaEjercicio';
import Cargando from '../componentes/Cargando';

export default function EjerciciosScreen({ navigation }) {
    const [ejercicios, setEjercicios] = useState([]);
    const [ejerciciosFiltrados, setEjerciciosFiltrados] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos');

    const categorias = [
        { id: 'todos', nombre: 'Todos', icono: '📋' },
        { id: 'respiracion', nombre: 'Respiración', icono: '🌬️' },
        { id: 'estiramiento', nombre: 'Estiramiento', icono: '🤸' },
        { id: 'fortalecimiento', nombre: 'Fortalecimiento', icono: '💪' },
        { id: 'equilibrio', nombre: 'Equilibrio', icono: '⚖️' },
    ];

    useEffect(() => {
        cargarEjercicios();
    }, []);

    useEffect(() => {
        filtrarEjercicios();
    }, [busqueda, categoriaSeleccionada, ejercicios]);

    const cargarEjercicios = async () => {
        try {
            const response = await apiService.getExercises();
            setEjercicios(response.data.exercises || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setCargando(false);
        }
    };

    const filtrarEjercicios = () => {
        let filtrados = [...ejercicios];

        // Filtrar por categoría
        if (categoriaSeleccionada !== 'todos') {
            filtrados = filtrados.filter(e => 
                (e.categoria || e.category) === categoriaSeleccionada
            );
        }

        // Filtrar por búsqueda
        if (busqueda.trim()) {
            filtrados = filtrados.filter(e =>
                (e.nombre || e.name).toLowerCase().includes(busqueda.toLowerCase()) ||
                (e.descripcion || e.description || '').toLowerCase().includes(busqueda.toLowerCase())
            );
        }

        setEjerciciosFiltrados(filtrados);
    };

    if (cargando) {
        return <Cargando texto="Cargando ejercicios..." />;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                {/* Buscador */}
                <View style={styles.buscadorContainer}>
                    <TextInput
                        style={styles.buscador}
                        placeholder="🔍 Buscar ejercicios..."
                        placeholderTextColor="#999"
                        value={busqueda}
                        onChangeText={setBusqueda}
                    />
                </View>

                {/* Categorías */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriasContainer}
                >
                    {categorias.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoriaBoton,
                                categoriaSeleccionada === cat.id && styles.categoriaBotonActivo
                            ]}
                            onPress={() => setCategoriaSeleccionada(cat.id)}
                        >
                            <Text style={styles.categoriaIcono}>{cat.icono}</Text>
                            <Text style={[
                                styles.categoriaTexto,
                                categoriaSeleccionada === cat.id && styles.categoriaTextoActivo
                            ]}>
                                {cat.nombre}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Lista de ejercicios */}
                <View style={styles.listaContainer}>
                    <Text style={styles.contador}>
                        {ejerciciosFiltrados.length} ejercicios encontrados
                    </Text>
                    
                    {ejerciciosFiltrados.length > 0 ? (
                        ejerciciosFiltrados.map((ejercicio) => (
                            <TarjetaEjercicio
                                key={ejercicio.id}
                                ejercicio={ejercicio}
                                onPress={() => navigation.navigate('DetalleEjercicio', { ejercicio })}
                            />
                        ))
                    ) : (
                        <View style={styles.sinResultados}>
                            <Text style={styles.sinResultadosEmoji}>😢</Text>
                            <Text style={styles.sinResultadosTexto}>
                                No se encontraron ejercicios
                            </Text>
                            <Text style={styles.sinResultadosSubtexto}>
                                Intenta con otra búsqueda o categoría
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
    },
    buscadorContainer: {
        padding: 15,
    },
    buscador: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        fontSize: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    categoriasContainer: {
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    categoriaBoton: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        marginRight: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    categoriaBotonActivo: {
        backgroundColor: '#4CAF50',
    },
    categoriaIcono: {
        fontSize: 20,
        marginRight: 5,
    },
    categoriaTexto: {
        fontSize: 14,
        color: '#333',
    },
    categoriaTextoActivo: {
        color: 'white',
    },
    listaContainer: {
        padding: 15,
    },
    contador: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    sinResultados: {
        alignItems: 'center',
        padding: 40,
    },
    sinResultadosEmoji: {
        fontSize: 50,
        marginBottom: 15,
    },
    sinResultadosTexto: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
    },
    sinResultadosSubtexto: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 5,
    },
});