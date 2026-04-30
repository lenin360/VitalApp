import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from './config';


export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [nombre, setNombre] = useState('');
    const [edad, setEdad] = useState('');
    const [cargando, setCargando] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        console.log('========== INICIO DE LOGIN ==========');
        console.log('1. Valores ingresados:');
        console.log('   Email:', email);
        console.log('   Password:', password ? '******' : 'vacío');
        
        if (!email || !password) {
            console.log('2. Error: Campos vacíos');
            Alert.alert('Campos incompletos', 'Ingresa tu correo y contraseña');
            return;
        }

        console.log('2. Campos válidos, iniciando petición...');
        setCargando(true);
        
        try {
            const url = `${API_URL}/login`;
            console.log('3. URL de petición:', url);
            
            const body = JSON.stringify({ email, password });
            console.log('4. Body enviado:', body);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: body
            });
            
            console.log('5. Respuesta recibida - Status:', response.status);
            console.log('5. Respuesta - OK?', response.ok);
            
            const data = await response.json();
            console.log('6. Datos recibidos:', data);
            
            if (data.success) {
                console.log('7. ✅ LOGIN EXITOSO - Redirigiendo a /home');
                Alert.alert('¡Bienvenido!', `Hola ${data.user?.nombre || 'Usuario'}`);
                console.log('8. Ejecutando router.replace...');
                router.replace('/home');
                console.log('9. Router.replace ejecutado');
            } else {
                console.log('7. ❌ LOGIN FALLIDO - Mensaje:', data.message);
                Alert.alert('Error', data.message || 'Credenciales incorrectas');
            }
        } catch (error: any) {
            console.log('7. ❌ ERROR EN LA PETICIÓN:');
            console.log('   Mensaje:', error.message);
            console.log('   Error completo:', error);
            Alert.alert('Error de conexión', `No se pudo conectar con el servidor\n${error.message}`);
        } finally {
            console.log('8. Finalizando, cargando = false');
            setCargando(false);
        }
        console.log('========== FIN DE LOGIN ==========');
    };

    const handleRegister = async () => {
        console.log('========== INICIO DE REGISTRO ==========');
        console.log('1. Datos de registro:', { nombre, email, edad, password: password ? '***' : 'vacío' });
        
        if (!nombre || !email || !password || !edad) {
            console.log('2. Error: Campos incompletos');
            Alert.alert('Campos incompletos', 'Completa todos los campos');
            return;
        }

        console.log('2. Campos válidos, iniciando registro...');
        setCargando(true);
        
        try {
            const url = `${API_URL}/register`;
            console.log('3. URL:', url);
            
            const body = JSON.stringify({ nombre, email, password, edad: parseInt(edad) });
            console.log('4. Body:', body);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body
            });
            
            console.log('5. Status:', response.status);
            const data = await response.json();
            console.log('6. Respuesta:', data);
            
            if (data.success) {
                console.log('7. ✅ REGISTRO EXITOSO');
                Alert.alert('¡Registro exitoso!', 'Ahora puedes iniciar sesión');
                setIsRegistering(false);
                setNombre('');
                setEdad('');
                setPassword('');
            } else {
                console.log('7. ❌ REGISTRO FALLIDO:', data.message);
                Alert.alert('Error', data.message || 'No se pudo registrar');
            }
        } catch (error: any) {
            console.log('7. ❌ ERROR:', error.message);
            Alert.alert('Error de conexión', 'No se pudo conectar con el servidor');
        } finally {
            setCargando(false);
        }
        console.log('========== FIN DE REGISTRO ==========');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoText}>V</Text>
                        </View>
                        <Text style={styles.titulo}>Vital App</Text>
                        <Text style={styles.subtitulo}>Bienestar para tu vida</Text>
                    </View>

                    <View style={styles.formContainer}>
                        {isRegistering ? (
                            <>
                                <Text style={styles.label}>Nombre completo</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Tu nombre"
                                    value={nombre}
                                    onChangeText={setNombre}
                                />

                                <Text style={styles.label}>Edad</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="65"
                                    keyboardType="numeric"
                                    value={edad}
                                    onChangeText={setEdad}
                                />
                            </>
                        ) : null}

                        <Text style={styles.label}>Correo electrónico</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="tu@email.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <Text style={styles.label}>Contraseña</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        <TouchableOpacity 
                            style={[styles.loginButton, cargando && styles.loginButtonDisabled]}
                            onPress={isRegistering ? handleRegister : handleLogin}
                            disabled={cargando}
                        >
                            {cargando ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.loginButtonText}>
                                    {isRegistering ? 'Registrarse' : 'Iniciar sesión'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
                            <Text style={styles.switchText}>
                                {isRegistering 
                                    ? '¿Ya tienes cuenta? Inicia sesión' 
                                    : '¿No tienes cuenta? Regístrate'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 48 },
    logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    logoText: { fontSize: 48, fontWeight: 'bold', color: '#FFFFFF' },
    titulo: { fontSize: 32, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8 },
    subtitulo: { fontSize: 16, color: '#7F8C8D' },
    formContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24 },
    label: { fontSize: 14, fontWeight: '500', color: '#2C3E50', marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 20 },
    loginButton: { backgroundColor: '#4CAF50', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
    loginButtonDisabled: { opacity: 0.7 },
    loginButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
    switchText: { fontSize: 14, color: '#4CAF50', textAlign: 'center', marginTop: 8 },
});