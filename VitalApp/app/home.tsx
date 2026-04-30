import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  SafeAreaView, Dimensions, Alert, RefreshControl
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuInferior from './MenuInferior';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState({
    exercises: 0,
    calories: 0,
    minutes: 0,
    weeklyGoal: 0,
    totalGoal: 3,
    challenge: '7X4'
  });
  const [peso, setPeso] = useState(58);
  const [nombreUsuario, setNombreUsuario] = useState('Usuario');
  const [refreshing, setRefreshing] = useState(false);
  const [completadosHoy, setCompletadosHoy] = useState(0);

  // Cargar datos cada vez que la pantalla tiene foco
  useFocusEffect(
    useCallback(() => {
      cargarDatosUsuario();
    }, [])
  );

  const cargarDatosUsuario = async () => {
    try {
      const statsGuardadas = await AsyncStorage.getItem('userStats');
      const pesoGuardado = await AsyncStorage.getItem('userWeight');
      const nombreGuardado = await AsyncStorage.getItem('userName');
      const completadosHoyGuardados = await AsyncStorage.getItem('completadosHoy');
      
      if (statsGuardadas) {
        const stats = JSON.parse(statsGuardadas);
        setWeeklyStats(stats);
        const porcentaje = stats.totalGoal > 0 
          ? Math.round((stats.weeklyGoal / stats.totalGoal) * 100) 
          : 0;
        setProgressPercentage(porcentaje);
      }
      if (pesoGuardado) setPeso(parseFloat(pesoGuardado));
      if (nombreGuardado) setNombreUsuario(nombreGuardado);
      if (completadosHoyGuardados) setCompletadosHoy(parseInt(completadosHoyGuardados));
    } catch (error) {
      console.log('Error cargando datos:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatosUsuario();
    setRefreshing(false);
  };

  // Guardar progreso cuando se completa un ejercicio
  const guardarProgreso = async () => {
    const nuevasStats = {
      ...weeklyStats,
      exercises: weeklyStats.exercises + 1,
      calories: weeklyStats.calories + 150,
      minutes: weeklyStats.minutes + 10,
      weeklyGoal: Math.min(weeklyStats.weeklyGoal + 1, weeklyStats.totalGoal)
    };
    
    const nuevoPorcentaje = nuevasStats.totalGoal > 0 
      ? Math.round((nuevasStats.weeklyGoal / nuevasStats.totalGoal) * 100) 
      : 0;
    
    const nuevosCompletados = completadosHoy + 1;
    
    setWeeklyStats(nuevasStats);
    setProgressPercentage(nuevoPorcentaje);
    setCompletadosHoy(nuevosCompletados);
    
    await AsyncStorage.setItem('userStats', JSON.stringify(nuevasStats));
    await AsyncStorage.setItem('completadosHoy', nuevosCompletados.toString());
    
    // Verificar si completó el objetivo
    if (nuevasStats.weeklyGoal >= nuevasStats.totalGoal) {
      setTimeout(() => {
        Alert.alert('🏆 ¡FELICIDADES!', '¡Has completado el objetivo semanal!');
      }, 500);
    }
  };

  // Reiniciar progreso (para pruebas)
  const reiniciarProgreso = async () => {
    const statsIniciales = {
      exercises: 0,
      calories: 0,
      minutes: 0,
      weeklyGoal: 0,
      totalGoal: 3,
      challenge: '7X4'
    };
    setWeeklyStats(statsIniciales);
    setProgressPercentage(0);
    setCompletadosHoy(0);
    await AsyncStorage.setItem('userStats', JSON.stringify(statsIniciales));
    await AsyncStorage.setItem('completadosHoy', '0');
    Alert.alert('✅ Progreso reiniciado', 'Empieza de nuevo');
  };

  const currentWorkout = {
    title: 'ABDOMINALES INTERMEDIO',
    time: '29 min - 21 ejercicios',
    exercises: [
      { name: 'Salto De Tijera', duration: '00:30', icon: '🏃‍♂️', color: '#FF6B6B' },
      { name: 'Toque al Tallón', duration: '2x', icon: '🦶', color: '#4ECDC4' },
      { name: 'Abdominal cruzado', duration: '2x', icon: '💪', color: '#45B7D1' },
      { name: 'Escalada de Montaña', duration: '2x', icon: '⛰️', color: '#96CEB4' }
    ]
  };

  const dailySchedule = [
    { day: 'Lun', date: '4', locked: false },
    { day: 'Mar', date: '6', locked: false },
    { day: 'Mié', date: '7', locked: false },
    { day: 'Jue', date: '8', active: true, locked: false },
    { day: 'Vie', date: '9', locked: true },
    { day: 'Sáb', date: '10', locked: true }
  ];

  const discoveryWorkouts = [
    { title: 'Elegido para ti', time: '20 min', intensity: 'Media', icon: '🎯', color: '#FF6B6B' },
    { title: 'HIT para quemar grasa', time: '15 min', intensity: 'Alta', icon: '🔥', color: '#FF8C42' },
    { title: 'Quemagrasas 5 IN SALTO', time: '25 min', intensity: 'Alta', icon: '⚡', color: '#FFD93D' },
    { title: 'Mantente en forma', time: '30 min', intensity: 'Baja', icon: '🧘', color: '#6BCB77' }
  ];

  // Navegación
  const irAEjercicios = () => router.push('/ejercicios');
  const irAEstadisticas = () => router.push('/estadisticas');
  const irAPerfil = () => router.push('/perfil');

  // Iniciar entrenamiento
  const iniciarEntrenamiento = () => {
    Alert.alert(
      '🏋️ Iniciar Entrenamiento',
      `¿Quieres comenzar "${currentWorkout.title}"?\n\n${currentWorkout.time}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Comenzar', 
          onPress: () => {
            guardarProgreso();
            Alert.alert('✅ ¡Excelente!', 'Has completado un entrenamiento.\n\nSigue así para alcanzar tu meta semanal.');
          }
        }
      ]
    );
  };

  // Ver detalle de ejercicio
  const verDetalleEjercicio = (ejercicio: any) => {
    router.push({
      pathname: '/detalle-ejercicio',
      params: {
        id: '1',
        nombre: ejercicio.name,
        descripcion: 'Ejercicio para tu rutina diaria de abdominales.',
        duracion: '60',
        dificultad: 'facil'
      }
    });
  };

  // Ver detalle de workout descubierto
  const verDetalleWorkout = (workout: any) => {
    Alert.alert(
      workout.title,
      `⏱️ Duración: ${workout.time}\n📊 Intensidad: ${workout.intensity}\n\nVe a la sección de Ejercicios para comenzar este entrenamiento.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir a Ejercicios', onPress: irAEjercicios }
      ]
    );
  };

  // Cambiar peso
  const cambiarPeso = () => {
    Alert.alert(
      '⚖️ Control de Peso',
      `Peso actual: ${peso} kg\n\n¿Qué deseas hacer?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Actualizar peso', 
          onPress: () => {
            const nuevoPeso = peso + 1;
            setPeso(nuevoPeso);
            AsyncStorage.setItem('userWeight', nuevoPeso.toString());
            Alert.alert('✅ Peso actualizado', `${nuevoPeso} kg registrado`);
          }
        },
        { text: 'Ver historial', onPress: irAEstadisticas }
      ]
    );
  };

  // Cerrar sesión
  const cerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Salir', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userSession');
            router.replace('/login');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />
        }
      >
        
        {/* Header con estadísticas */}
        <LinearGradient
          colors={['#FF6B35', '#FF8C42', '#FFA94D']}
          style={styles.headerStats}
        >
          <View style={styles.headerOverlay}>
            <TouchableOpacity style={styles.statCard} onPress={irAEjercicios} activeOpacity={0.7}>
              <View style={styles.statIconCircle}>
                <Ionicons name="fitness" size={20} color="#fff" />
              </View>
              <Text style={styles.statNumber}>{weeklyStats.exercises}</Text>
              <Text style={styles.statLabel}>EJERCICIOS</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statCard} onPress={irAEstadisticas} activeOpacity={0.7}>
              <View style={styles.statIconCircle}>
                <FontAwesome5 name="fire" size={18} color="#fff" />
              </View>
              <Text style={styles.statNumber}>{weeklyStats.calories}</Text>
              <Text style={styles.statLabel}>KCAL</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statCard} onPress={irAEstadisticas} activeOpacity={0.7}>
              <View style={styles.statIconCircle}>
                <Ionicons name="time" size={20} color="#fff" />
              </View>
              <Text style={styles.statNumber}>{weeklyStats.minutes}</Text>
              <Text style={styles.statLabel}>MINUTOS</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Banner */}
        <TouchableOpacity style={styles.motivationBanner} onPress={irAPerfil} activeOpacity={0.8}>
          <LinearGradient
            colors={['rgba(255,107,53,0.1)', 'rgba(255,140,66,0.05)']}
            style={styles.bannerGradient}
          >
            <View style={styles.bannerContent}>
              <Text style={styles.bannerEmoji}>💪</Text>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>¡Hola, {nombreUsuario}!</Text>
                <Text style={styles.bannerSubtitle}>
                  {completadosHoy > 0 
                    ? `Hoy has hecho ${completadosHoy} ejercicio(s)` 
                    : 'Cada día más cerca de tu meta'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Objetivo semanal */}
        <TouchableOpacity style={styles.weeklyGoal} onPress={irAEstadisticas} activeOpacity={0.8}>
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleContainer}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.goalTitle}>OBJETIVO DE LA SEMANA</Text>
            </View>
            <View style={styles.goalBadge}>
              <Text style={styles.goalProgress}>
                {weeklyStats.weeklyGoal}/{weeklyStats.totalGoal}
              </Text>
            </View>
          </View>
          <Text style={styles.challengeText}>DESAFÍO {weeklyStats.challenge}</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>TODO EL CUERPO DESAFIO 7X4</Text>
              <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={progressPercentage >= 100 ? ['#FFD700', '#FFA500'] : ['#4CAF50', '#45B7D1']}
                style={[styles.progressFill, { width: `${Math.min(progressPercentage, 100)}%` }]}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Día actual */}
        <View style={styles.daySection}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayNumber}>8°DÍA</Text>
            <TouchableOpacity style={styles.dayBadge} onPress={reiniciarProgreso}>
              <Ionicons name="refresh" size={14} color="#FF6B35" />
              <Text style={styles.dayBadgeText}>Reiniciar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.daySelector}>
            {dailySchedule.map((day, index) => (
              <View 
                key={index} 
                style={[
                  styles.dayButton, 
                  day.active && styles.activeDayButton,
                  day.locked && styles.lockedDayButton
                ]}
              >
                <Text style={[
                  styles.dayText, 
                  day.active && styles.activeDayText,
                  day.locked && styles.lockedDayText
                ]}>
                  {day.day}
                </Text>
                <Text style={[
                  styles.dateText, 
                  day.active && styles.activeDayText,
                  day.locked && styles.lockedDayText
                ]}>
                  {day.locked ? '🔒' : day.date}
                </Text>
              </View>
            ))}
          </View>
          <TouchableOpacity 
            style={styles.startButton} 
            activeOpacity={0.9}
            onPress={iniciarEntrenamiento}
          >
            <LinearGradient
              colors={['#28a745', '#20c997']}
              style={styles.gradientButton}
            >
              <Ionicons name="play-circle" size={22} color="#fff" />
              <Text style={styles.startButtonText}>INICIAR ENTRENAMIENTO</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Sección DESCUBRE */}
        <View style={styles.discoverSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>DESCUBRE</Text>
            <TouchableOpacity onPress={irAEjercicios}>
              <Text style={styles.seeAllText}>Ver todo</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>🔥 3 EJERCICIOS para perder grasa abdominal</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.discoverScroll}>
            {discoveryWorkouts.map((workout, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.discoverCard} 
                activeOpacity={0.8}
                onPress={() => verDetalleWorkout(workout)}
              >
                <LinearGradient
                  colors={[workout.color, workout.color + 'CC']}
                  style={styles.discoverCardHeader}
                >
                  <Text style={styles.cardEmoji}>{workout.icon}</Text>
                </LinearGradient>
                <View style={styles.discoverCardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{workout.title}</Text>
                  <View style={styles.cardInfoRow}>
                    <View style={styles.cardTimeBadge}>
                      <Ionicons name="time-outline" size={12} color="#666" />
                      <Text style={styles.cardTime}>{workout.time}</Text>
                    </View>
                    <View style={[styles.intensityBadge, { backgroundColor: workout.color + '20' }]}>
                      <Text style={[styles.cardIntensity, { color: workout.color }]}>{workout.intensity}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Ejercicios del día */}
        <View style={styles.todayWorkout}>
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutTitle}>{currentWorkout.title}</Text>
            <View style={styles.workoutBadge}>
              <Ionicons name="time" size={12} color="#FF6B35" />
              <Text style={styles.workoutInfo}>{currentWorkout.time}</Text>
            </View>
          </View>
          
          {currentWorkout.exercises.map((exercise, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.exerciseItem}
              onPress={() => verDetalleEjercicio(exercise)}
              activeOpacity={0.7}
            >
              <View style={[styles.exerciseIconCircle, { backgroundColor: exercise.color + '20' }]}>
                <Text style={styles.exerciseIcon}>{exercise.icon}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
              </View>
              <Text style={styles.exerciseDetail}>{exercise.duration}</Text>
              <Ionicons name="play-circle-outline" size={22} color="#FF6B35" />
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            style={styles.workoutStartButton} 
            activeOpacity={0.9}
            onPress={iniciarEntrenamiento}
          >
            <LinearGradient
              colors={['#FF6B35', '#FF8C42']}
              style={styles.gradientButton}
            >
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.workoutStartText}>Comenzar ejercicio</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Nike Brand */}
        <TouchableOpacity 
          style={styles.brandSection} 
          activeOpacity={0.8}
          onPress={() => Alert.alert('Nike', 'Visita Nike Factory Store Zaragoza\n\n¡Encuentra el calzado perfecto para tu entrenamiento!')}
        >
          <View style={styles.brandImageContainer}>
            <MaterialCommunityIcons name="shoe-sneaker" size={40} color="#FF6B35" />
          </View>
          <View style={styles.brandInfo}>
            <Text style={styles.brandText}>Visitar Nike</Text>
            <Text style={styles.brandSubtext}>Nike Factory Store Zaragoza</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        {/* Peso del usuario */}
        <TouchableOpacity 
          style={styles.userStats} 
          activeOpacity={0.9}
          onPress={cambiarPeso}
        >
          <View style={styles.weightHeader}>
            <MaterialCommunityIcons name="scale-bathroom" size={24} color="#FF6B35" />
            <Text style={styles.userStatTitle}>Control de Peso</Text>
          </View>
          <View style={styles.weightDisplay}>
            <View style={styles.weightCurrent}>
              <Text style={styles.weightNumber}>{peso}</Text>
              <Text style={styles.weightUnit}>kg</Text>
            </View>
            <View style={styles.weightHistory}>
              <Text style={styles.weightLabel}>Actual</Text>
              <Text style={styles.weightSubtext}>Toca para actualizar</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Botón cerrar sesión */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={cerrarSesion}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#D94A4A" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>

      <MenuInferior />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { paddingBottom: 80 },
  headerStats: {
    padding: 25, paddingTop: 40, marginHorizontal: 0, marginTop: 0,
    borderRadius: 0, borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  headerOverlay: { flexDirection: 'row', justifyContent: 'space-around' },
  statIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  statCard: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 10, color: '#fff', fontWeight: '700', opacity: 0.9, letterSpacing: 1, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 10, marginTop: 10, height: 50 },
  motivationBanner: {
    marginHorizontal: 15, marginTop: -20, marginBottom: 15, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
  },
  bannerGradient: { borderRadius: 20, padding: 15, backgroundColor: '#fff' },
  bannerContent: { flexDirection: 'row', alignItems: 'center' },
  bannerEmoji: { fontSize: 40, marginRight: 15 },
  bannerTextContainer: { flex: 1 },
  bannerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  bannerSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  weeklyGoal: {
    backgroundColor: '#fff', padding: 20, marginHorizontal: 15, marginBottom: 10, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  goalTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  goalBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  goalProgress: { fontSize: 14, color: '#FF6B35', fontWeight: '700' },
  challengeText: { fontSize: 28, fontWeight: 'bold', color: '#FF6B35', marginBottom: 15 },
  progressContainer: { marginTop: 10 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressText: { fontSize: 13, color: '#666', fontWeight: '500' },
  progressPercentage: { fontSize: 13, color: '#4CAF50', fontWeight: '700' },
  progressBar: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  daySection: {
    backgroundColor: '#fff', padding: 20, marginHorizontal: 15, marginBottom: 10, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  dayNumber: { fontSize: 48, fontWeight: 'bold', color: '#333' },
  dayBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, gap: 4 },
  dayBadgeText: { fontSize: 12, color: '#FF6B35', fontWeight: '700' },
  daySelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dayButton: { alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: '#f5f5f5', minWidth: 50 },
  activeDayButton: { backgroundColor: '#007bff' },
  lockedDayButton: { backgroundColor: '#e9ecef' },
  dayText: { fontSize: 11, color: '#666', fontWeight: '600', marginBottom: 4 },
  dateText: { fontSize: 15, color: '#333', fontWeight: '700' },
  activeDayText: { color: '#fff' },
  lockedDayText: { color: '#adb5bd' },
  startButton: { borderRadius: 25, overflow: 'hidden' },
  gradientButton: { padding: 15, borderRadius: 25, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  discoverSection: {
    padding: 20, backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 10, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  seeAllText: { fontSize: 14, color: '#FF6B35', fontWeight: '600' },
  sectionSubtitle: { fontSize: 15, color: '#666', fontWeight: '600', marginBottom: 15 },
  discoverScroll: { marginTop: 5 },
  discoverCard: {
    backgroundColor: '#fff', borderRadius: 20, marginRight: 15, width: 200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, overflow: 'hidden',
  },
  discoverCardHeader: { height: 80, justifyContent: 'center', alignItems: 'center' },
  cardEmoji: { fontSize: 36 },
  discoverCardBody: { padding: 15 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10, lineHeight: 20, height: 40 },
  cardInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardTime: { fontSize: 12, color: '#666', fontWeight: '500' },
  intensityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  cardIntensity: { fontSize: 11, fontWeight: '700' },
  todayWorkout: {
    backgroundColor: '#fff', padding: 20, marginHorizontal: 15, marginBottom: 10, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  workoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  workoutTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', flex: 1, letterSpacing: 0.5 },
  workoutBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 4, marginLeft: 10 },
  workoutInfo: { fontSize: 12, color: '#FF6B35', fontWeight: '600' },
  exerciseItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  exerciseIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  exerciseIcon: { fontSize: 20 },
  exerciseInfo: { flex: 1, marginLeft: 12 },
  exerciseName: { fontSize: 15, color: '#333', fontWeight: '500' },
  exerciseDetail: { fontSize: 14, color: '#666', marginRight: 10, fontWeight: '600' },
  workoutStartButton: { borderRadius: 25, overflow: 'hidden', marginTop: 20 },
  workoutStartText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  brandSection: {
    backgroundColor: '#fff', padding: 20, marginHorizontal: 15, marginBottom: 10, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
    borderLeftWidth: 4, borderLeftColor: '#FF6B35',
  },
  brandImageContainer: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  brandInfo: { flex: 1 },
  brandText: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 3 },
  brandSubtext: { fontSize: 12, color: '#666' },
  userStats: {
    backgroundColor: '#fff', padding: 20, marginHorizontal: 15, marginBottom: 10, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  weightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  userStatTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  weightDisplay: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  weightCurrent: { flexDirection: 'row', alignItems: 'flex-end', marginRight: 20 },
  weightNumber: { fontSize: 48, fontWeight: 'bold', color: '#333' },
  weightUnit: { fontSize: 16, color: '#666', marginBottom: 8, marginLeft: 4 },
  weightHistory: { flex: 1 },
  weightLabel: { fontSize: 14, color: '#4CAF50', fontWeight: '600' },
  weightSubtext: { fontSize: 12, color: '#666', marginTop: 2 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 15, marginBottom: 20, padding: 15, borderRadius: 15,
    backgroundColor: '#fff', gap: 8,
  },
  logoutText: { fontSize: 14, color: '#D94A4A', fontWeight: '600' },
});