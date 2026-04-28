import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <ScrollView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}> Vital App</Text>
        <Text style={styles.subtitle}>Ejercicios para tu bienestar</Text>
      </View>

      {/* Tarjeta de bienvenida */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeText}>¡Bienvenido/a!</Text>
        <Text style={styles.messageText}>
          Realiza ejercicios suaves y mejora tu calidad de vida
        </Text>
      </View>

      {/* Botones principales */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>📋 Ejercicios de Hoy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>📊 Mi Progreso</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>⏰ Recordatorios</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>🏆 Mis Logros</Text>
        </TouchableOpacity>
      </View>

      {/* Consejo del día */}
      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Consejo del día</Text>
        <Text style={styles.tipText}>
          Recuerda mantenerte hidratado antes y después de hacer ejercicio
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 30,
    paddingTop: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    marginTop: 5,
  },
  welcomeCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  buttonContainer: {
    marginHorizontal: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tipCard: {
    backgroundColor: '#E8F5E9',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    marginBottom: 40,
  },
  tipTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
});