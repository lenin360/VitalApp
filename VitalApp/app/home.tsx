import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  SafeAreaView, Dimensions, Alert, RefreshControl, StatusBar, Platform, TextInput
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuInferior from './MenuInferior';
import { useTheme } from './components/useTheme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
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
    
    if (nuevasStats.weeklyGoal >= nuevasStats.totalGoal) {
      setTimeout(() => {
        Alert.alert('FELICIDADES', 'Has completado el objetivo semanal.');
      }, 500);
    }
  };

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
    Alert.alert('Progreso reiniciado', 'El contador ha vuelto a cero.');
  };

  // Rutinas del día - rotan según el día de la semana
  const allRoutines = [
    {
      title: 'RUTINA SUAVE MATUTINA',
      time: '25 min - 5 ejercicios',
      exercises: [
        { name: 'Respiración Diafragmática', duration: '05:00', icon: 'air', color: '#1E40AF' },
        { name: 'Círculos con Hombros', duration: '05:00', icon: 'refresh', color: '#0369A1' },
        { name: 'Estiramiento Lateral', duration: '05:00', icon: 'body', color: '#0F766E' },
        { name: 'Movimiento de Tobillos', duration: '05:00', icon: 'footsteps', color: '#047857' },
        { name: 'Rotación de Cuello', duration: '05:00', icon: 'person', color: '#6D28D9' }
      ]
    },
    {
      title: 'MOVILIDAD Y EQUILIBRIO',
      time: '20 min - 4 ejercicios',
      exercises: [
        { name: 'Marcha en el Lugar', duration: '05:00', icon: 'walk', color: '#0F766E' },
        { name: 'Equilibrio en un Pie', duration: '05:00', icon: 'accessibility', color: '#7C3AED' },
        { name: 'Sentadilla con Silla', duration: '05:00', icon: 'car', color: '#D97706' },
        { name: 'Estiramiento de Espalda', duration: '05:00', icon: 'fitness', color: '#059669' }
      ]
    },
    {
      title: 'FUERZA SUAVE',
      time: '20 min - 4 ejercicios',
      exercises: [
        { name: 'Elevación de Brazos', duration: '05:00', icon: 'barbell', color: '#2563EB' },
        { name: 'Extensión de Pierna', duration: '05:00', icon: 'fitness', color: '#BE123C' },
        { name: 'Press contra Pared', duration: '05:00', icon: 'body', color: '#0369A1' },
        { name: 'Curl de Bíceps', duration: '05:00', icon: 'barbell', color: '#7C3AED' }
      ]
    },
    {
      title: 'RELAJACIÓN ACTIVA',
      time: '15 min - 3 ejercicios',
      exercises: [
        { name: 'Respiración Profunda', duration: '05:00', icon: 'leaf', color: '#059669' },
        { name: 'Yoga en Silla', duration: '05:00', icon: 'body', color: '#0F766E' },
        { name: 'Meditación Guiada', duration: '05:00', icon: 'brain', color: '#6D28D9' }
      ]
    },
    {
      title: 'CARDIO LIGERO',
      time: '20 min - 4 ejercicios',
      exercises: [
        { name: 'Caminata en el Lugar', duration: '05:00', icon: 'walk', color: '#2563EB' },
        { name: 'Paso Lateral', duration: '05:00', icon: 'footsteps', color: '#0D9488' },
        { name: 'Rodillas Arriba', duration: '05:00', icon: 'fitness', color: '#D97706' },
        { name: 'Enfriamiento Suave', duration: '05:00', icon: 'leaf', color: '#059669' }
      ]
    }
  ];

  // Seleccionar rutina del día basada en el día de la semana
  const dayOfWeek = new Date().getDay();
  const currentWorkout = allRoutines[dayOfWeek % allRoutines.length];

  // Recomendados: las OTRAS rutinas que NO son la del día
  const allDiscoveryWorkouts = [
    { title: 'Despierta tu cuerpo', time: '15 min', intensity: 'Baja', icon: 'sunny', color: '#2563EB', desc: 'Activa tu cuerpo suavemente al despertar' },
    { title: 'Movilidad en silla', time: '20 min', intensity: 'Baja', icon: 'body', color: '#0D9488', desc: 'Ejercicios sentado para articulaciones' },
    { title: 'Prevención caídas', time: '10 min', intensity: 'Media', icon: 'shield-checkmark', color: '#D97706', desc: 'Mejora tu equilibrio y estabilidad' },
    { title: 'Respiración y calma', time: '15 min', intensity: 'Baja', icon: 'leaf', color: '#059669', desc: 'Técnicas de relajación y respiración' },
    { title: 'Fuerza suave brazos', time: '15 min', intensity: 'Media', icon: 'barbell', color: '#7C3AED', desc: 'Fortalece brazos y hombros sin riesgo' },
    { title: 'Circulación piernas', time: '20 min', intensity: 'Baja', icon: 'fitness', color: '#BE123C', desc: 'Activa la circulación en tus piernas' },
    { title: 'Flexibilidad total', time: '15 min', intensity: 'Baja', icon: 'body', color: '#0891B2', desc: 'Estiramientos completos para todo el cuerpo' },
    { title: 'Postura y columna', time: '10 min', intensity: 'Baja', icon: 'accessibility', color: '#4F46E5', desc: 'Corrige tu postura con ejercicios suaves' }
  ];

  // Rotar recomendados para que sean distintos cada día
  const startIdx = (dayOfWeek * 3) % allDiscoveryWorkouts.length;
  const discoveryWorkouts = [
    ...allDiscoveryWorkouts.slice(startIdx),
    ...allDiscoveryWorkouts.slice(0, startIdx)
  ].slice(0, 4);

  // Calendario dinámico basado en la semana actual
  const today = new Date();
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dailySchedule = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + 1 + i); // Lun a Sáb
    return {
      day: dayNames[d.getDay()],
      date: d.getDate().toString(),
      active: d.toDateString() === today.toDateString(),
      locked: d > today
    };
  });

  const irAEjercicios = () => router.push('/ejercicios');
  const irAEstadisticas = () => router.push('/estadisticas');
  const irAPerfil = () => router.push('/perfil');

  const iniciarEntrenamiento = async () => {
    // Registrar progreso y navegar al primer ejercicio de la rutina
    await guardarProgreso();
    const primerEjercicio = currentWorkout.exercises[0];
    router.push({
      pathname: '/detalle-ejercicio',
      params: {
        id: '1',
        nombre: primerEjercicio.name,
        descripcion: `Parte de la rutina: ${currentWorkout.title}`,
        duracion: '300',
        dificultad: 'Fácil',
        routine: JSON.stringify(currentWorkout),
        index: '0'
      }
    });
  };

  const verDetalleEjercicio = (ejercicio: any) => {
    router.push({
      pathname: '/detalle-ejercicio',
      params: {
        id: '1',
        nombre: ejercicio.name,
        descripcion: `Ejercicio de la rutina ${currentWorkout.title}. Diseñado para cuidar tus articulaciones.`,
        duracion: '300',
        dificultad: 'Fácil'
      }
    });
  };

  const verDetalleWorkout = (workout: any) => {
    router.push({
      pathname: '/detalle-ejercicio',
      params: {
        id: '1',
        nombre: workout.title,
        descripcion: workout.desc || 'Rutina recomendada especialmente para ti.',
        duracion: (parseInt(workout.time) * 60).toString(),
        dificultad: workout.intensity === 'Media' ? 'Normal' : 'Fácil'
      }
    });
  };

  const cambiarPeso = async (cambio: number) => {
    const nuevoPeso = peso + cambio;
    if (nuevoPeso > 0 && nuevoPeso < 300) {
      setPeso(nuevoPeso);
      await AsyncStorage.setItem('userWeight', nuevoPeso.toString());
    }
  };

  const cerrarSesion = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Deseas salir de la aplicación?')) {
        await AsyncStorage.removeItem('userSession');
        router.replace('/login');
      }
    } else {
      Alert.alert(
        'Cerrar sesión',
        '¿Deseas salir de la aplicación?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Sí, Salir', 
            style: 'destructive',
            onPress: async () => {
              await AsyncStorage.removeItem('userSession');
              router.replace('/login');
            }
          }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.gradientStart} />
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.bg }]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
        }
      >
        
        {/* Header Premium */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.headerStats}
        >
          <View style={styles.headerTitleRow}>
             <View>
               <Text style={styles.headerWelcomeText}>Hola, {nombreUsuario}</Text>
               <Text style={styles.headerGreetingSub}>Inicia tu jornada de bienestar hoy</Text>
             </View>
             <TouchableOpacity onPress={irAPerfil} style={styles.profileAvatar}>
                <Ionicons name="person" size={24} color="#FFFFFF" />
             </TouchableOpacity>
          </View>

          <View style={[styles.headerOverlay, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.statCard} onPress={irAEstadisticas} activeOpacity={0.8}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.settingIconBg }]}>
                <Ionicons name="fitness" size={28} color={colors.isDark ? '#60A5FA' : '#1E3A8A'} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{weeklyStats.exercises}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>EJERCICIOS</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statCard} onPress={irAEstadisticas} activeOpacity={0.8}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.isDark ? '#78350F' : '#FEF3C7' }]}>
                <FontAwesome5 name="fire" size={24} color={colors.isDark ? '#FBBF24' : '#D97706'} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{weeklyStats.calories}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>KCAL</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statCard} onPress={irAEstadisticas} activeOpacity={0.8}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.isDark ? '#064E3B' : '#F0FDF4' }]}>
                <Ionicons name="time" size={28} color={colors.isDark ? '#34D399' : '#059669'} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{weeklyStats.minutes}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>MINUTOS</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Banner de Motivación */}
        <TouchableOpacity style={[styles.motivationBanner, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={irAEstadisticas} activeOpacity={0.9}>
          <View style={styles.bannerContent}>
            <View style={[styles.bannerIconContainer, colors.isDark && { backgroundColor: '#78350F' }]}>
               <Ionicons name="stats-chart" size={32} color="#D97706" />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={[styles.bannerTitle, { color: colors.text }]}>Tu progreso diario</Text>
              <Text style={[styles.bannerSubtitle, { color: colors.textSecondary }]}>
                {completadosHoy > 0 
                  ? `Has completado ${completadosHoy} actividad(es) hoy. ¡Sigue así!` 
                  : 'Una pequeña caminata hace una gran diferencia.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={28} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* Objetivo semanal */}
        <TouchableOpacity style={[styles.weeklyGoal, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={irAEstadisticas} activeOpacity={0.9}>
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleContainer}>
              <Ionicons name="trophy" size={24} color="#D97706" />
              <Text style={[styles.goalTitle, { color: colors.text }]}>Meta Semanal</Text>
            </View>
            <View style={[styles.goalBadge, colors.isDark && { backgroundColor: '#1E3A8A' }]}>
              <Text style={styles.goalProgress}>
                {weeklyStats.weeklyGoal} de {weeklyStats.totalGoal}
              </Text>
            </View>
          </View>
          <Text style={[styles.challengeText, { color: colors.text }]}>Desafío {weeklyStats.challenge}</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>Progreso Total</Text>
              <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
            </View>
            <View style={[styles.progressBar, colors.isDark && { backgroundColor: '#334155' }]}>
              <LinearGradient
                colors={progressPercentage >= 100 ? ['#059669', '#10B981'] : ['#2563EB', '#60A5FA']}
                style={[styles.progressFill, { width: `${Math.min(progressPercentage, 100)}%` }]}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Plan del Día */}
        <View style={[styles.daySection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.dayHeader}>
            <Text style={[styles.dayNumber, { color: colors.text }]}>Día {today.getDate()}</Text>
            <TouchableOpacity style={[styles.dayBadge, colors.isDark && { backgroundColor: '#334155' }]} onPress={reiniciarProgreso}>
              <Ionicons name="refresh" size={18} color={colors.textSecondary} />
              <Text style={[styles.dayBadgeText, { color: colors.textSecondary }]}>Reiniciar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.daySelector}>
            {dailySchedule.map((day, index) => (
              <View 
                key={index} 
                style={[
                  styles.dayButton, 
                  { backgroundColor: colors.isDark ? '#334155' : '#F8FAFC', borderColor: colors.isDark ? '#475569' : '#F1F5F9' },
                  day.active && styles.activeDayButton,
                  day.locked && [styles.lockedDayButton, colors.isDark && { backgroundColor: '#1E293B' }]
                ]}
              >
                <Text style={[
                  styles.dayText, 
                  { color: colors.textSecondary },
                  day.active && styles.activeDayText,
                  day.locked && styles.lockedDayText
                ]}>
                  {day.day}
                </Text>
                <Text style={[
                  styles.dateText, 
                  { color: colors.text },
                  day.active && styles.activeDayText,
                  day.locked && styles.lockedDayText
                ]}>
                  {day.locked ? (
                    <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
                  ) : day.date}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sección Descubre */}
        <View style={[styles.discoverSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recomendados para ti</Text>
            <TouchableOpacity onPress={irAEjercicios}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Rutinas adaptadas a tu ritmo</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.discoverScroll}>
            {discoveryWorkouts.map((workout, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.discoverCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} 
                activeOpacity={0.9}
                onPress={() => verDetalleWorkout(workout)}
              >
                <View style={[styles.discoverCardHeader, { backgroundColor: workout.color + '15' }]}>
                  <Ionicons name={workout.icon as any} size={40} color={workout.color} />
                </View>
                <View style={styles.discoverCardBody}>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{workout.title}</Text>
                  <View style={styles.cardInfoRow}>
                    <View style={styles.cardTimeBadge}>
                      <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.cardTime, { color: colors.textSecondary }]}>{workout.time}</Text>
                    </View>
                    <View style={[styles.intensityBadge, { backgroundColor: workout.color + '15' }]}>
                      <Text style={[styles.cardIntensity, { color: workout.color }]}>{workout.intensity}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Rutina del Día */}
        <View style={[styles.todayWorkout, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.workoutHeader}>
            <Text style={[styles.workoutTitle, { color: colors.text }]}>{currentWorkout.title}</Text>
            <View style={[styles.workoutBadge, colors.isDark && { backgroundColor: '#1E3A8A' }]}>
              <Ionicons name="time" size={16} color="#60A5FA" />
              <Text style={styles.workoutInfo}>{currentWorkout.time}</Text>
            </View>
          </View>
          
          {currentWorkout.exercises.map((exercise, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.exerciseItem, { borderBottomColor: colors.isDark ? '#334155' : '#F1F5F9' }]}
              onPress={() => verDetalleEjercicio(exercise)}
              activeOpacity={0.8}
            >
              <View style={[styles.exerciseIconCircle, { backgroundColor: exercise.color + '15' }]}>
                <Ionicons name={exercise.icon as any} size={24} color={exercise.color} />
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
                <Text style={[styles.exerciseDetail, { color: colors.textSecondary }]}>{exercise.duration}</Text>
              </View>
              <Ionicons name="chevron-forward-circle" size={32} color={colors.isDark ? '#475569' : '#CBD5E1'} />
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            style={styles.workoutStartButton} 
            activeOpacity={0.9}
            onPress={iniciarEntrenamiento}
          >
            <LinearGradient
              colors={['#059669', '#10B981']}
              style={styles.gradientButton}
            >
              <Ionicons name="play" size={28} color="#fff" />
              <Text style={styles.workoutStartText}>Iniciar Rutina Completa</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Peso del usuario */}
        <View style={[styles.userStats, { backgroundColor: colors.card, borderColor: colors.cardBorder, padding: 24 }]}>
          <View style={styles.weightHeader}>
            <MaterialCommunityIcons name="scale-bathroom" size={32} color="#0EA5E9" />
            <Text style={[styles.userStatTitle, { color: colors.text }]}>Control de Peso</Text>
          </View>
          <View style={[styles.weightDisplay, { justifyContent: 'space-between', marginTop: 16 }]}>
            <TouchableOpacity onPress={() => cambiarPeso(-1)} style={[styles.weightBtn, colors.isDark && { backgroundColor: '#334155' }]}>
               <Ionicons name="remove" size={32} color={colors.isDark ? '#F1F5F9' : '#FFFFFF'} />
            </TouchableOpacity>
            
            <View style={styles.weightCurrent}>
              <TextInput 
                style={[styles.weightNumber, { color: colors.isDark ? '#38BDF8' : '#0EA5E9' }]}
                value={peso === 0 ? '' : peso.toString()}
                onChangeText={async (text) => {
                   if (text === '') {
                      setPeso(0);
                      return;
                   }
                   const num = parseInt(text);
                   if (!isNaN(num) && num > 0 && num < 300) {
                      setPeso(num);
                      await AsyncStorage.setItem('userWeight', num.toString());
                   }
                }}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={[styles.weightUnit, { color: colors.textSecondary }]}>kg</Text>
            </View>
            
            <TouchableOpacity onPress={() => cambiarPeso(1)} style={[styles.weightBtn, colors.isDark && { backgroundColor: '#334155' }]}>
               <Ionicons name="add" size={32} color={colors.isDark ? '#F1F5F9' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón cerrar sesión */}
        <TouchableOpacity 
          style={[styles.logoutButton, colors.isDark && { backgroundColor: '#371717', borderColor: '#7F1D1D' }]} 
          onPress={cerrarSesion}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={24} color="#DC2626" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>

      <MenuInferior />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 100 },
  headerStats: {
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  headerTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24
  },
  headerWelcomeText: {
    fontSize: 28, fontWeight: '800', color: '#FFFFFF'
  },
  headerGreetingSub: {
    fontSize: 16, color: '#DBEAFE', fontWeight: '500', marginTop: 4
  },
  profileAvatar: {
    backgroundColor: 'rgba(255,255,255,0.2)', width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#60A5FA'
  },
  profileAvatarText: { fontSize: 24 },
  headerOverlay: { 
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF',
    borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 5
  },
  statIconCircle: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  statCard: { alignItems: 'center', width: '30%' },
  statNumber: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  statLabel: { fontSize: 13, color: '#64748B', fontWeight: '700', marginTop: 4 },
  motivationBanner: {
    marginHorizontal: 20, marginTop: -20, marginBottom: 20, borderRadius: 24,
    backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: '#F1F5F9'
  },
  bannerContent: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  bannerIconContainer: {
    backgroundColor: '#FEF3C7', width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center', marginRight: 16
  },
  bannerEmoji: { fontSize: 32 },
  bannerTextContainer: { flex: 1 },
  bannerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  bannerSubtitle: { fontSize: 16, color: '#475569', lineHeight: 22 },
  weeklyGoal: {
    backgroundColor: '#FFFFFF', padding: 24, marginHorizontal: 20, marginBottom: 16, borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    borderWidth: 1, borderColor: '#E2E8F0'
  },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  goalTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  goalBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  goalProgress: { fontSize: 16, color: '#2563EB', fontWeight: '800' },
  challengeText: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 20 },
  progressContainer: { marginTop: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressText: { fontSize: 16, color: '#64748B', fontWeight: '600' },
  progressPercentage: { fontSize: 16, color: '#059669', fontWeight: '800' },
  progressBar: { height: 12, backgroundColor: '#F1F5F9', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6 },
  daySection: {
    backgroundColor: '#FFFFFF', padding: 24, marginHorizontal: 20, marginBottom: 16, borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    borderWidth: 1, borderColor: '#E2E8F0'
  },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  dayNumber: { fontSize: 32, fontWeight: '900', color: '#1E293B' },
  dayBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6 },
  dayBadgeText: { fontSize: 16, color: '#475569', fontWeight: '700' },
  daySelector: { flexDirection: 'row', justifyContent: 'space-between' },
  dayButton: { alignItems: 'center', paddingVertical: 12, borderRadius: 16, backgroundColor: '#F8FAFC', width: '15%', borderWidth: 1, borderColor: '#F1F5F9' },
  activeDayButton: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  lockedDayButton: { backgroundColor: '#F1F5F9', opacity: 0.6 },
  dayText: { fontSize: 14, color: '#64748B', fontWeight: '700', marginBottom: 6 },
  dateText: { fontSize: 18, color: '#1E293B', fontWeight: '800' },
  activeDayText: { color: '#FFFFFF' },
  lockedDayText: { color: '#94A3B8' },
  discoverSection: {
    padding: 24, backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 16, borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    borderWidth: 1, borderColor: '#E2E8F0'
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  seeAllText: { fontSize: 16, color: '#2563EB', fontWeight: '700' },
  sectionSubtitle: { fontSize: 16, color: '#64748B', fontWeight: '500', marginBottom: 20 },
  discoverScroll: { overflow: 'visible' },
  discoverCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, marginRight: 16, width: 220,
    borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden'
  },
  discoverCardHeader: { height: 90, justifyContent: 'center', alignItems: 'center' },
  cardEmoji: { fontSize: 48 },
  discoverCardBody: { padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 12, height: 46 },
  cardInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTime: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  intensityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  cardIntensity: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  todayWorkout: {
    backgroundColor: '#FFFFFF', padding: 24, marginHorizontal: 20, marginBottom: 16, borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    borderWidth: 1, borderColor: '#E2E8F0'
  },
  workoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  workoutTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', flex: 1 },
  workoutBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 6, marginLeft: 12 },
  workoutInfo: { fontSize: 14, color: '#2563EB', fontWeight: '700' },
  exerciseItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  exerciseIconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  exerciseIcon: { fontSize: 24 },
  exerciseInfo: { flex: 1, marginLeft: 16 },
  exerciseName: { fontSize: 18, color: '#1E293B', fontWeight: '700', marginBottom: 4 },
  exerciseDetail: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  workoutStartButton: { borderRadius: 24, overflow: 'hidden', marginTop: 24 },
  gradientButton: { padding: 20, borderRadius: 24, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  workoutStartText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  userStats: {
    backgroundColor: '#FFFFFF', padding: 24, marginHorizontal: 20, marginBottom: 20, borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    borderWidth: 1, borderColor: '#E2E8F0'
  },
  weightHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  userStatTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  weightDisplay: { flexDirection: 'row', alignItems: 'center' },
  weightCurrent: { flexDirection: 'row', alignItems: 'baseline', marginRight: 24 },
  weightNumber: { fontSize: 48, fontWeight: '900', color: '#0EA5E9' },
  weightUnit: { fontSize: 20, color: '#64748B', marginLeft: 6, fontWeight: '600' },
  weightHistory: { flex: 1 },
  weightLabel: { fontSize: 16, color: '#1E293B', fontWeight: '700', marginBottom: 4 },
  weightSubtext: { fontSize: 14, color: '#64748B' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, marginBottom: 24, padding: 20, borderRadius: 24,
    backgroundColor: '#FEF2F2', gap: 10, borderWidth: 1, borderColor: '#FEE2E2'
  },
  logoutText: { fontSize: 18, color: '#DC2626', fontWeight: '800' },
  weightBtn: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#0EA5E9',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
});