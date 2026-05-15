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
    // --- Login ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [cargando, setCargando] = useState(false);

    // --- Registro: campos de la tabla `usuario` ---
    const [nombre, setNombre] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [peso, setPeso] = useState('');
    const [altura, setAltura] = useState('');
    const [genero, setGenero] = useState<'M' | 'F' | 'Otro'>('Otro');   // enum BD: M, F, Otro
    const [telefono, setTelefono] = useState('');
    const [nivelActividad, setNivelActividad] = useState<'sedentario' | 'ligero' | 'moderado' | 'activo'>('sedentario');
    const [condicionesMedicas, setCondicionesMedicas] = useState('');
    const [restricciones, setRestricciones] = useState('');

    const router = useRouter();

    // -----------------------------------------------
    // LOGIN
    // -----------------------------------------------
    const handleLogin = async () => {
        console.log('========== INICIO DE LOGIN ==========');

        if (!email || !password) {
            Alert.alert('Faltan datos', 'Por favor ingresa tu correo y contraseña para continuar.');
            return;
        }

        setCargando(true);

        try {
            const url = `${API_URL}/login`;
            // El campo en la BD y en el backend se llama password_hash
            const body = JSON.stringify({ email, password_hash: password });
            console.log('Petición a:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body
            });

            const data = await response.json();
            console.log('Respuesta:', data);

            if (data.success) {
                const user = data.user;
                // La PK en la BD es id_usuario, no id
                await AsyncStorage.setItem('userId',    user.id_usuario.toString());
                await AsyncStorage.setItem('userName',  user.nombre   || '');
                await AsyncStorage.setItem('userEmail', user.email    || '');
                await AsyncStorage.setItem('userAge',   (user.edad    ?? '').toString());
                await AsyncStorage.setItem('userRol',   user.rol      || 'usuario');
                // Redirigir según rol: admin → pantalla de administrador
                router.replace(user.rol === 'admin' ? '/admin' : '/home');
            } else {
                Alert.alert('Acceso denegado', data.message || 'El correo o la contraseña no son correctos.');
            }
        } catch (error: any) {
            console.error('Error en login:', error.message);
            Alert.alert('Error de conexión', `No pudimos conectarnos. Verifica tu internet e intenta de nuevo.\n${error.message}`);
        } finally {
            setCargando(false);
        }
        console.log('========== FIN DE LOGIN ==========');
    };

    // -----------------------------------------------
    // REGISTRO
    // -----------------------------------------------
    const handleRegister = async () => {
        console.log('========== INICIO DE REGISTRO ==========');

        // Campos obligatorios según la BD (NOT NULL sin DEFAULT)
        if (!nombre || !email || !password || !fechaNacimiento || !peso) {
            Alert.alert('Faltan datos', 'Nombre, correo, contraseña, fecha de nacimiento y peso son obligatorios.');
            return;
        }

        // Validar formato fecha AAAA-MM-DD
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(fechaNacimiento)) {
            Alert.alert('Fecha inválida', 'Usa el formato AAAA-MM-DD, por ejemplo: 1955-05-20');
            return;
        }

        setCargando(true);

        try {
            const url = `${API_URL}/register`;
            const body = JSON.stringify({
                nombre,
                email,
                password_hash: password,              // campo real en la BD
                fecha_nacimiento: fechaNacimiento,
                peso: parseFloat(peso),
                altura: altura ? parseFloat(altura) : null,
                genero,                               // enum: 'M' | 'F' | 'Otro'
                telefono: telefono || null,
                nivel_actividad: nivelActividad,      // enum: sedentario | ligero | moderado | activo
                condiciones_medicas: condicionesMedicas || null,
                restricciones: restricciones || null,
                // 'edad' NO se envía: columna VIRTUAL generada desde fecha_nacimiento
            });
            console.log('Petición a:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body
            });

            const data = await response.json();
            console.log('Respuesta:', data);

            if (data.success) {
                Alert.alert(
                    '¡Cuenta creada!',
                    'Bienvenido a VitalApp. Ahora puedes iniciar sesión con tu correo y contraseña.',
                    [{ text: 'Continuar' }]
                );
                // Limpiar formulario y volver a login
                setIsRegistering(false);
                setNombre('');
                setFechaNacimiento('');
                setPeso('');
                setAltura('');
                setGenero('Otro');
                setTelefono('');
                setNivelActividad('sedentario');
                setCondicionesMedicas('');
                setRestricciones('');
                setPassword('');
                setEmail('');
            } else {
                Alert.alert('Error al registrar', data.message || 'No se pudo crear la cuenta.');
            }
        } catch (error: any) {
            console.error('Error en registro:', error.message);
            Alert.alert('Error de conexión', 'No pudimos conectarnos. Verifica tu internet e intenta de nuevo.');
        } finally {
            setCargando(false);
        }
        console.log('========== FIN DE REGISTRO ==========');
    };

    // -----------------------------------------------
    // RENDER
    // -----------------------------------------------
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
                        {/* CABECERA */}
                        <View style={styles.header}>
                            <View style={styles.logoCircle}>
                                <Ionicons name="fitness" size={48} color="#2563EB" />
                            </View>
                            <Text style={styles.titulo}>VitalApp</Text>
                            <Text style={styles.subtitulo}>Tu bienestar, cada día</Text>
                        </View>

                        {/* FORMULARIO */}
                        <View style={styles.formContainer}>
                            <Text style={styles.formTitle}>
                                {isRegistering ? 'Crear Cuenta Nueva' : 'Inicia Sesión'}
                            </Text>

                            {/* Campos exclusivos del registro */}
                            {isRegistering && (
                                <>
                                    {/* NOMBRE */}
                                    <Text style={styles.label}>Nombre completo *</Text>
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

                                    {/* FECHA DE NACIMIENTO */}
                                    <Text style={styles.label}>Fecha de nacimiento *</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="calendar-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="AAAA-MM-DD  (Ej: 1955-05-20)"
                                            placeholderTextColor="#94A3B8"
                                            value={fechaNacimiento}
                                            onChangeText={setFechaNacimiento}
                                        />
                                    </View>

                                    {/* PESO */}
                                    <Text style={styles.label}>Peso (kg) *</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="barbell-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ej: 75.5"
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="numeric"
                                            value={peso}
                                            onChangeText={setPeso}
                                        />
                                    </View>

                                    {/* ALTURA */}
                                    <Text style={styles.label}>Altura (m)</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="resize-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ej: 1.70"
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="numeric"
                                            value={altura}
                                            onChangeText={setAltura}
                                        />
                                    </View>

                                    {/* GÉNERO — enum: M, F, Otro */}
                                    <Text style={styles.label}>Género</Text>
                                    <View style={styles.selectorRow}>
                                        {(['M', 'F', 'Otro'] as const).map(op => (
                                            <TouchableOpacity
                                                key={op}
                                                style={[styles.selectorBtn, genero === op && styles.selectorBtnActive]}
                                                onPress={() => setGenero(op)}
                                            >
                                                <Text style={[styles.selectorTxt, genero === op && styles.selectorTxtActive]}>
                                                    {op === 'M' ? 'Masculino' : op === 'F' ? 'Femenino' : 'Otro'}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* TELÉFONO */}
                                    <Text style={styles.label}>Teléfono</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ej: 312 123 4567"
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="phone-pad"
                                            value={telefono}
                                            onChangeText={setTelefono}
                                        />
                                    </View>

                                    {/* NIVEL DE ACTIVIDAD — enum: sedentario, ligero, moderado, activo */}
                                    <Text style={styles.label}>Nivel de actividad</Text>
                                    <View style={styles.selectorRow}>
                                        {(['sedentario', 'ligero', 'moderado', 'activo'] as const).map(op => (
                                            <TouchableOpacity
                                                key={op}
                                                style={[styles.selectorBtn, nivelActividad === op && styles.selectorBtnActive]}
                                                onPress={() => setNivelActividad(op)}
                                            >
                                                <Text style={[styles.selectorTxt, nivelActividad === op && styles.selectorTxtActive]}>
                                                    {op.charAt(0).toUpperCase() + op.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* CONDICIONES MÉDICAS */}
                                    <Text style={styles.label}>Condiciones médicas</Text>
                                    <View style={[styles.inputContainer, styles.inputMultiline]}>
                                        <Ionicons name="medkit-outline" size={20} color="#64748B" style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: 18 }]} />
                                        <TextInput
                                            style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 14 }]}
                                            placeholder="Ej: Diabetes, Hipertensión…"
                                            placeholderTextColor="#94A3B8"
                                            multiline
                                            value={condicionesMedicas}
                                            onChangeText={setCondicionesMedicas}
                                        />
                                    </View>

                                    {/* RESTRICCIONES */}
                                    <Text style={styles.label}>Restricciones físicas</Text>
                                    <View style={[styles.inputContainer, styles.inputMultiline]}>
                                        <Ionicons name="warning-outline" size={20} color="#64748B" style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: 18 }]} />
                                        <TextInput
                                            style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 14 }]}
                                            placeholder="Ej: No puede levantar peso, rodilla operada…"
                                            placeholderTextColor="#94A3B8"
                                            multiline
                                            value={restricciones}
                                            onChangeText={setRestricciones}
                                        />
                                    </View>
                                </>
                            )}

                            {/* Campos comunes */}
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

                            {/* Botón principal */}
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

                            {/* Cambiar entre login / registro */}
                            <TouchableOpacity
                                style={styles.switchContainer}
                                onPress={() => setIsRegistering(!isRegistering)}
                                activeOpacity={0.6}
                            >
                                <Text style={styles.switchText}>
                                    {isRegistering ? '¿Ya tienes cuenta?' : '¿Eres nuevo aquí?'}
                                </Text>
                                <Text style={styles.switchTextBold}>
                                    {isRegistering ? ' Inicia sesión' : ' Regístrate gratis'}
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
            android: { elevation: 10 },
            web: { boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }
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
            android: { elevation: 8 },
            web: { boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }
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
            android: { elevation: 6 },
            web: { boxShadow: '0 8px 12px rgba(37,99,235,0.3)' }
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
    },
    selectorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    selectorBtn: {
        flex: 1,
        minWidth: 70,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
    },
    selectorBtnActive: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF',
    },
    selectorTxt: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    selectorTxtActive: {
        color: '#2563EB',
    },
    inputMultiline: {
        height: 'auto',
        minHeight: 60,
        alignItems: 'flex-start',
        paddingVertical: 0,
    },
});
