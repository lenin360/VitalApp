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
    ScrollView,
    StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [nombre, setNombre] = useState('');
    const [edad, setEdad] = useState('');
    const [peso, setPeso] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [cargando, setCargando] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        console.log('========== INICIO DE LOGIN ==========');
        console.log('1. Valores ingresados:');
        console.log('   Email:', email);
        console.log('   Password:', password ? '******' : 'vacío');
        
        if (!email || !password) {
            console.log('2. Error: Campos vacíos');
            Alert.alert('Faltan datos', 'Por favor ingresa tu correo y contraseña para continuar.');
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
                console.log('7. ✅ LOGIN EXITOSO - Guardando datos y redirigiendo');
                // Guardar datos del usuario en AsyncStorage para uso en toda la app
                await AsyncStorage.setItem('userId', data.user.id.toString());
                await AsyncStorage.setItem('userName', data.user.nombre || '');
                await AsyncStorage.setItem('userEmail', data.user.email || '');
                await AsyncStorage.setItem('userAge', (data.user.edad || '').toString());
                await AsyncStorage.setItem('userWeight', (data.user.peso || '').toString());
                await AsyncStorage.setItem('userGender', data.user.genero || '');
                router.replace('/home');
                console.log('9. Router.replace ejecutado');
            } else {
                console.log('7. ❌ LOGIN FALLIDO - Mensaje:', data.message);
                Alert.alert('Acceso denegado', data.message || 'El correo o la contraseña no son correctos.');
            }
        } catch (error: any) {
            console.log('7. ❌ ERROR EN LA PETICIÓN:');
            console.log('   Mensaje:', error.message);
            console.log('   Error completo:', error);
            Alert.alert('Error de conexión', `No pudimos conectarnos. Verifica tu internet e intenta de nuevo.\n${error.message}`);
        } finally {
            console.log('8. Finalizando, cargando = false');
            setCargando(false);
        }
        console.log('========== FIN DE LOGIN ==========');
    };

    const handleRegister = async () => {
        console.log('========== INICIO DE REGISTRO ==========');
        console.log('1. Datos de registro:', { nombre, email, edad, password: password ? '***' : 'vacío' });
        
        if (!nombre || !email || !password || !fechaNacimiento || !peso) {
            console.log('2. Error: Campos incompletos');
            Alert.alert('Faltan datos', 'Por favor completa todos los campos (incluyendo peso y fecha de nacimiento) para crear tu cuenta.');
            return;
        }

        console.log('2. Campos válidos, iniciando registro...');
        setCargando(true);
        
        try {
            const url = `${API_URL}/register`;
            console.log('3. URL:', url);
            
            const body = JSON.stringify({ 
                nombre, 
                email, 
                password, 
                fecha_nacimiento: fechaNacimiento, 
                peso: parseFloat(peso),
                genero: 'Otro' // Por defecto
            });
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
                Alert.alert('¡Cuenta creada!', 'Bienvenido a VitalApp. Ahora puedes iniciar sesión con tu correo y contraseña.', [{ text: 'Continuar' }]);
                setIsRegistering(false);
                setNombre('');
                setEdad('');
                setPeso('');
                setFechaNacimiento('');
                setPassword('');
            } else {
                console.log('7. ❌ REGISTRO FALLIDO:', data.message);
                Alert.alert('Error al registrar', data.message || 'No se pudo crear la cuenta.');
            }
        } catch (error: any) {
            console.log('7. ❌ ERROR:', error.message);
            Alert.alert('Error de conexión', 'No pudimos conectarnos. Verifica tu internet e intenta de nuevo.');
        } finally {
            setCargando(false);
        }
        console.log('========== FIN DE REGISTRO ==========');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
            <LinearGradient
                colors={['#1E3A8A', '#2563EB', '#F8FAFC']}
                locations={[0, 0.4, 0.4]}
                style={styles.gradientBackground}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <ScrollView 
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.header}>
                            <View style={styles.logoCircle}>
                                <Ionicons name="fitness" size={48} color="#2563EB" />
                            </View>
                            <Text style={styles.titulo}>VitalApp</Text>
                            <Text style={styles.subtitulo}>Tu bienestar, cada día</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <Text style={styles.formTitle}>
                                {isRegistering ? 'Crear Cuenta Nueva' : 'Inicia Sesión'}
                            </Text>

                            {isRegistering && (
                                <>
                                    <Text style={styles.label}>Nombre completo</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ej: Juan Pérez"
                                            placeholderTextColor="#94A3B8"
                                            value={nombre}
                                            onChangeText={setNombre}
                                        />
                                    </View>

                                    <Text style={styles.label}>Fecha de Nacimiento</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="calendar-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="AAAA-MM-DD (Ej: 1955-05-20)"
                                            placeholderTextColor="#94A3B8"
                                            value={fechaNacimiento}
                                            onChangeText={setFechaNacimiento}
                                        />
                                    </View>

                                    <Text style={styles.label}>Peso (kg)</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="fitness-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ej: 75.5"
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="numeric"
                                            value={peso}
                                            onChangeText={setPeso}
                                        />
                                    </View>
                                </>
                            )}

                            <Text style={styles.label}>Correo electrónico</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="tu@correo.com"
                                    placeholderTextColor="#94A3B8"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <Text style={styles.label}>Contraseña</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#94A3B8"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>

                            <TouchableOpacity 
                                style={[styles.mainButton, cargando && styles.mainButtonDisabled]}
                                onPress={isRegistering ? handleRegister : handleLogin}
                                disabled={cargando}
                                activeOpacity={0.8}
                            >
                                {cargando ? (
                                    <ActivityIndicator color="#FFFFFF" size="large" />
                                ) : (
                                    <Text style={styles.mainButtonText}>
                                        {isRegistering ? 'Crear mi cuenta' : 'Entrar'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.switchContainer}
                                onPress={() => setIsRegistering(!isRegistering)}
                                activeOpacity={0.6}
                            >
                                <Text style={styles.switchText}>
                                    {isRegistering 
                                        ? '¿Ya tienes cuenta?' 
                                        : '¿Eres nuevo aquí?'}
                                </Text>
                                <Text style={styles.switchTextBold}>
                                    {isRegistering 
                                        ? ' Inicia sesión' 
                                        : ' Regístrate gratis'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#1E3A8A' 
    },
    gradientBackground: {
        flex: 1,
    },
    container: { 
        flex: 1,
    },
    scrollContent: { 
        flexGrow: 1, 
        paddingHorizontal: 24, 
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: { 
        alignItems: 'center', 
        marginBottom: 40,
    },
    logoCircle: { 
        width: 100, 
        height: 100, 
        borderRadius: 50, 
        backgroundColor: '#FFFFFF', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 16,
            },
            android: {
                elevation: 10,
            },
            web: {
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
            }
        }),
    },
    titulo: { 
        fontSize: 42, 
        fontWeight: '900', 
        color: '#FFFFFF', 
        marginBottom: 8,
        letterSpacing: 1,
    },
    subtitulo: { 
        fontSize: 18, 
        color: '#DBEAFE',
        fontWeight: '500',
    },
    formContainer: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 32, 
        padding: 30,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
            }
        }),
    },
    formTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 24,
        textAlign: 'center',
    },
    label: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: '#475569', 
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        marginBottom: 20,
        paddingHorizontal: 16,
        height: 60,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: { 
        flex: 1,
        fontSize: 18,
        color: '#1E293B',
        fontWeight: '500',
        height: '100%',
    },
    mainButton: { 
        backgroundColor: '#2563EB', 
        borderRadius: 16, 
        height: 64,
        justifyContent: 'center',
        alignItems: 'center', 
        marginTop: 12,
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#2563EB',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
            },
            android: {
                elevation: 6,
            },
            web: {
                boxShadow: '0 8px 12px rgba(37, 99, 235, 0.3)',
            }
        }),
    },
    mainButtonDisabled: { 
        backgroundColor: '#94A3B8',
        shadowOpacity: 0,
        elevation: 0,
    },
    mainButtonText: { 
        fontSize: 20, 
        fontWeight: '800', 
        color: '#FFFFFF',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
    },
    switchText: { 
        fontSize: 16, 
        color: '#64748B', 
        fontWeight: '500',
    },
    switchTextBold: {
        fontSize: 16,
        color: '#2563EB',
        fontWeight: '800',
    }
});