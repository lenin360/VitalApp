import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, TextInput, Alert, ActivityIndicator,
    Modal, StatusBar, RefreshControl, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Seccion = 'videos' | 'config' | 'usuarios';

interface Video {
    id_video: number;
    nombre_video: string;
    descripcion: string;
    categoria: string;
    subcategoria: string;
    dificultad: 'baja' | 'media' | 'alta';
    duracion_min: number;
    link_video: string;
    url_miniatura: string;
    calorias_estimadas: number;
    edad_minima: number;
    edad_maxima: number;
    peso_maximo_recomendado: number;
    activo: number;
}

interface ConfigEjercicio {
    id_config: number;
    edad_min: number;
    edad_max: number;
    peso_min: number | null;
    peso_max: number | null;
    nivel_dificultad: 'baja' | 'media' | 'alta' | '';
    condiciones_especiales: string;
    categoria_recomendada: string;
    max_minutos_diarios: number;
    dias_semana_recomendados: number;
}

interface Usuario {
    id_usuario: number;
    nombre: string;
    email: string;
    edad: number;
    peso: number;
    altura: number;
    genero: 'M' | 'F' | 'Otro';
    telefono: string;
    rol: 'usuario' | 'admin';
    cuenta_activa: number;
    nivel_actividad: string;
    condiciones_medicas: string;
    restricciones: string;
    fecha_registro: string;
}

// ─── Formularios vacíos ───────────────────────────────────────────────────────

const VIDEO_VACIO: Omit<Video, 'id_video'> = {
    nombre_video: '', descripcion: '', categoria: '', subcategoria: '',
    dificultad: 'baja', duracion_min: 0, link_video: '', url_miniatura: '',
    calorias_estimadas: 0, edad_minima: 60, edad_maxima: 100,
    peso_maximo_recomendado: 0, activo: 1,
};

const CONFIG_VACIA: Omit<ConfigEjercicio, 'id_config'> = {
    edad_min: 60, edad_max: 80, peso_min: null, peso_max: null,
    nivel_dificultad: 'baja', condiciones_especiales: '',
    categoria_recomendada: '', max_minutos_diarios: 30, dias_semana_recomendados: 3,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const api = async (path: string, method = 'GET', body?: object) => {
    const url = `${API_URL}${path}`;
    const opts: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (method === 'POST' || method === 'PUT') {
        opts.body = JSON.stringify(body ?? {});
    }
    const res = await fetch(url, opts);
    return res.json();
};

// ─── Componente campo del formulario ─────────────────────────────────────────

const Campo = ({
    label, value, onChangeText, keyboardType = 'default', multiline = false, placeholder = ''
}: {
    label: string; value: string; onChangeText: (t: string) => void;
    keyboardType?: any; multiline?: boolean; placeholder?: string;
}) => (
    <View style={s.campoWrap}>
        <Text style={s.campoLabel}>{label}</Text>
        <TextInput
            style={[s.campoInput, multiline && s.campoInputMulti]}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            multiline={multiline}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
        />
    </View>
);

// Selector de opciones tipo chip
const Selector = ({ label, opciones, valor, onSelect }: {
    label: string; opciones: string[]; valor: string;
    onSelect: (v: string) => void;
}) => (
    <View style={s.campoWrap}>
        <Text style={s.campoLabel}>{label}</Text>
        <View style={s.chipRow}>
            {opciones.map(op => (
                <TouchableOpacity
                    key={op}
                    style={[s.chip, valor === op && s.chipActivo]}
                    onPress={() => onSelect(op)}
                >
                    <Text style={[s.chipTxt, valor === op && s.chipTxtActivo]}>
                        {op.charAt(0).toUpperCase() + op.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

// ─── Modal genérico ───────────────────────────────────────────────────────────

const ModalForm = ({ visible, titulo, onClose, onGuardar, cargando, children }: {
    visible: boolean; titulo: string; onClose: () => void;
    onGuardar: () => void; cargando: boolean; children: React.ReactNode;
}) => (
    <Modal visible={visible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
            <View style={s.modalCard}>
                <View style={s.modalHeader}>
                    <Text style={s.modalTitulo}>{titulo}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close-circle" size={28} color="#64748B" />
                    </TouchableOpacity>
                </View>
                <ScrollView style={s.modalScroll} showsVerticalScrollIndicator={false}>
                    {children}
                </ScrollView>
                <TouchableOpacity
                    style={[s.btnGuardar, cargando && s.btnDeshabilitado]}
                    onPress={onGuardar}
                    disabled={cargando}
                >
                    {cargando
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={s.btnGuardarTxt}>Guardar cambios</Text>
                    }
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

// ═══════════════════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function AdminScreen() {
    const router = useRouter();
    const [seccion, setSeccion] = useState<Seccion>('videos');
    const [cargando, setCargando] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Datos
    const [videos, setVideos] = useState<Video[]>([]);
    const [configs, setConfigs] = useState<ConfigEjercicio[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);

    // Modales
    const [modalVideo, setModalVideo] = useState(false);
    const [modalConfig, setModalConfig] = useState(false);
    const [modalUsuario, setModalUsuario] = useState(false);

    // Item en edición (null = nuevo)
    const [videoEdit, setVideoEdit] = useState<Video | null>(null);
    const [configEdit, setConfigEdit] = useState<ConfigEjercicio | null>(null);
    const [usuarioEdit, setUsuarioEdit] = useState<Usuario | null>(null);

    // Formularios
    const [fVideo, setFVideo] = useState<Omit<Video, 'id_video'>>(VIDEO_VACIO);
    const [fConfig, setFConfig] = useState<Omit<ConfigEjercicio, 'id_config'>>(CONFIG_VACIA);
    const [fUsuario, setFUsuario] = useState<Partial<Usuario>>({});

    // ── Verificar rol admin ────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            const rol = await AsyncStorage.getItem('userRol');
            if (rol !== 'admin') {
                Alert.alert('Acceso denegado', 'Esta sección es solo para administradores.');
                router.replace('/home');
            }
        })();
    }, []);

    // ── Carga de datos ─────────────────────────────────────────────────────────
    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            if (seccion === 'videos') {
                const d = await api('/admin/videos');
                if (d.success) setVideos(d.videos);
            } else if (seccion === 'config') {
                const d = await api('/admin/config-ejercicios');
                if (d.success) setConfigs(d.configuraciones);
            } else {
                const d = await api('/admin/usuarios');
                if (d.success) setUsuarios(d.usuarios);
            }
        } catch (e) {
            Alert.alert('Error', 'No se pudo cargar la información.');
        } finally {
            setCargando(false);
            setRefreshing(false);
        }
    }, [seccion]);

    useEffect(() => { cargar(); }, [cargar]);

    // ── CONFIG — acciones ──────────────────────────────────────────────────────
    const mostrarAlerta = (titulo: string, mensaje: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${titulo}\n${mensaje}`);
        } else {
            Alert.alert(titulo, mensaje);
        }
    };

    const abrirNuevoVideo = () => {
        setVideoEdit(null);
        setFVideo(VIDEO_VACIO);
        setModalVideo(true);
    };

    const abrirEditarVideo = (v: Video) => {
        setVideoEdit(v);
        setFVideo({ ...v });
        setModalVideo(true);
    };

    const guardarVideo = async () => {
        if (!fVideo.nombre_video || !fVideo.categoria || !fVideo.link_video || fVideo.duracion_min === undefined || fVideo.duracion_min === null) {
            mostrarAlerta('Faltan datos', 'Nombre, categoría, duración y link son obligatorios.');
            return;
        }
        setCargando(true);
        try {
            const d = videoEdit
                ? await api(`/admin/videos/${videoEdit.id_video}`, 'PUT', fVideo)
                : await api('/admin/videos', 'POST', fVideo);
            if (d.success) {
                setModalVideo(false);
                cargar();
            } else {
                mostrarAlerta('Error', d.message);
            }
        } catch { mostrarAlerta('Error', 'No se pudo guardar.'); }
        finally { setCargando(false); }
    };

    const confirmarEliminacion = (titulo: string, mensaje: string, onConfirm: () => void) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`${titulo}\n${mensaje}`)) {
                onConfirm();
            }
        } else {
            Alert.alert(titulo, mensaje, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: onConfirm }
            ]);
        }
    };

    const eliminarVideo = (v: Video) => {
        confirmarEliminacion('Eliminar video', `¿Eliminar "${v.nombre_video}"?`, async () => {
            setCargando(true);
            try {
                const d = await api(`/admin/videos/${v.id_video}`, 'DELETE');
                if (d.success) { Alert.alert('', 'Video eliminado.'); cargar(); }
                else Alert.alert('Error', d.message);
            } catch (e: any) {
                Alert.alert('Error', e.message);
            } finally { setCargando(false); }
        });
    };

    // ── CONFIG — acciones ──────────────────────────────────────────────────────
    const abrirNuevaConfig = () => {
        setConfigEdit(null);
        setFConfig(CONFIG_VACIA);
        setModalConfig(true);
    };

    const abrirEditarConfig = (c: ConfigEjercicio) => {
        setConfigEdit(c);
        setFConfig({ ...c });
        setModalConfig(true);
    };

    const guardarConfig = async () => {
        if (fConfig.edad_min === undefined || fConfig.edad_max === undefined) {
            mostrarAlerta('Faltan datos', 'Edad mínima y máxima son obligatorias.');
            return;
        }
        setCargando(true);
        try {
            const d = configEdit
                ? await api(`/admin/config-ejercicios/${configEdit.id_config}`, 'PUT', fConfig)
                : await api('/admin/config-ejercicios', 'POST', fConfig);
            if (d.success) { setModalConfig(false); cargar(); }
            else mostrarAlerta('Error', d.message);
        } catch { mostrarAlerta('Error', 'No se pudo guardar.'); }
        finally { setCargando(false); }
    };

    const eliminarConfig = (c: ConfigEjercicio) => {
        confirmarEliminacion('Eliminar configuración', `¿Eliminar config #${c.id_config}?`, async () => {
            setCargando(true);
            try {
                const d = await api(`/admin/config-ejercicios/${c.id_config}`, 'DELETE');
                if (d.success) { Alert.alert('', 'Configuración eliminada.'); cargar(); }
                else Alert.alert('Error', d.message);
            } catch (e: any) {
                Alert.alert('Error', e.message);
            } finally { setCargando(false); }
        });
    };

    // ── USUARIOS — acciones ────────────────────────────────────────────────────
    const abrirEditarUsuario = (u: Usuario) => {
        setUsuarioEdit(u);
        setFUsuario({ ...u });
        setModalUsuario(true);
    };

    const guardarUsuario = async () => {
        if (!fUsuario.nombre || !fUsuario.email) {
            mostrarAlerta('Faltan datos', 'Nombre y email son obligatorios.');
            return;
        }
        setCargando(true);
        try {
            const d = await api(`/admin/usuarios/${usuarioEdit?.id_usuario}`, 'PUT', fUsuario);
            if (d.success) { setModalUsuario(false); cargar(); }
            else mostrarAlerta('Error', d.message);
        } catch { mostrarAlerta('Error', 'No se pudo guardar.'); }
        finally { setCargando(false); }
    };

    const eliminarUsuario = (u: Usuario) => {
        confirmarEliminacion('Eliminar usuario', `¿Eliminar a "${u.nombre}"?\nSe eliminarán también sus ejercicios y rutinas.`, async () => {
            setCargando(true);
            try {
                const d = await api(`/admin/usuarios/${u.id_usuario}`, 'DELETE');
                if (d.success) { Alert.alert('', `Usuario "${u.nombre}" eliminado.`); cargar(); }
                else Alert.alert('Error', d.message);
            } catch (e: any) {
                Alert.alert('Error', e.message);
            } finally { setCargando(false); }
        });
    };

    // ── Badges ────────────────────────────────────────────────────────────────
    const colorDificultad: Record<string, string> = {
        baja: '#10B981', media: '#F59E0B', alta: '#EF4444'
    };

    // ═════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═════════════════════════════════════════════════════════════════════════
    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

            {/* ── Header ── */}
            <View style={s.header}>
                <View>
                    <Text style={s.headerSub}>Panel de control</Text>
                    <Text style={s.headerTitulo}>Administrador</Text>
                </View>
                <TouchableOpacity
                    style={s.btnCerrar}
                    onPress={async () => {
                        await Promise.all([
                            AsyncStorage.removeItem('userId'),
                            AsyncStorage.removeItem('userName'),
                            AsyncStorage.removeItem('userEmail'),
                            AsyncStorage.removeItem('userAge'),
                            AsyncStorage.removeItem('userRol'),
                            AsyncStorage.removeItem('userWeight'),
                        ]);
                        router.replace('/login');
                    }}
                >
                    <Ionicons name="log-out-outline" size={22} color="#F87171" />
                    <Text style={s.btnCerrarTxt}>Salir</Text>
                </TouchableOpacity>
            </View>

            {/* ── Tabs de sección ── */}
            <View style={s.tabs}>
                {([
                    { key: 'videos', label: 'Videos', icon: 'play-circle-outline' },
                    { key: 'config', label: 'Configs', icon: 'settings-outline' },
                    { key: 'usuarios', label: 'Usuarios', icon: 'people-outline' },
                ] as { key: Seccion; label: string; icon: any }[]).map(t => (
                    <TouchableOpacity
                        key={t.key}
                        style={[s.tab, seccion === t.key && s.tabActivo]}
                        onPress={() => setSeccion(t.key)}
                    >
                        <Ionicons
                            name={t.icon}
                            size={18}
                            color={seccion === t.key ? '#2563EB' : '#94A3B8'}
                        />
                        <Text style={[s.tabTxt, seccion === t.key && s.tabTxtActivo]}>
                            {t.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── Botón agregar (no en usuarios) ── */}
            {seccion !== 'usuarios' && (
                <TouchableOpacity
                    style={s.btnAgregar}
                    onPress={seccion === 'videos' ? abrirNuevoVideo : abrirNuevaConfig}
                >
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={s.btnAgregarTxt}>
                        {seccion === 'videos' ? 'Nuevo video' : 'Nueva configuración'}
                    </Text>
                </TouchableOpacity>
            )}

            {/* ── Lista principal ── */}
            {cargando && !refreshing
                ? <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
                : (
                    <ScrollView
                        contentContainerStyle={s.lista}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} />
                        }
                    >
                        {/* ─── VIDEOS ─── */}
                        {seccion === 'videos' && videos.map(v => (
                            <View key={v.id_video} style={s.tarjeta}>
                                <View style={s.tarjetaTop}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.tarjetaTitulo} numberOfLines={1}>{v.nombre_video}</Text>
                                        <Text style={s.tarjetaSub}>{v.categoria}{v.subcategoria ? ` · ${v.subcategoria}` : ''}</Text>
                                    </View>
                                    <View style={[s.badge, { backgroundColor: colorDificultad[v.dificultad] + '22' }]}>
                                        <Text style={[s.badgeTxt, { color: colorDificultad[v.dificultad] }]}>
                                            {v.dificultad}
                                        </Text>
                                    </View>
                                </View>
                                <View style={s.tarjetaMeta}>
                                    <View style={s.metaItem}>
                                        <Ionicons name="time-outline" size={13} color="#94A3B8" />
                                        <Text style={s.metaTxt}>{v.duracion_min} min</Text>
                                    </View>
                                    <View style={s.metaItem}>
                                        <Ionicons name="flame-outline" size={13} color="#94A3B8" />
                                        <Text style={s.metaTxt}>{v.calorias_estimadas ?? '—'} kcal</Text>
                                    </View>
                                    <View style={s.metaItem}>
                                        <Ionicons name="person-outline" size={13} color="#94A3B8" />
                                        <Text style={s.metaTxt}>{v.edad_minima}–{v.edad_maxima} años</Text>
                                    </View>
                                    <View style={[s.metaItem, { marginLeft: 'auto' }]}>
                                        <Ionicons
                                            name={v.activo ? 'checkmark-circle' : 'close-circle'}
                                            size={14}
                                            color={v.activo ? '#10B981' : '#EF4444'}
                                        />
                                        <Text style={[s.metaTxt, { color: v.activo ? '#10B981' : '#EF4444' }]}>
                                            {v.activo ? 'Activo' : 'Inactivo'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={s.tarjetaAcciones}>
                                    <TouchableOpacity style={s.btnEditar} onPress={() => abrirEditarVideo(v)}>
                                        <Ionicons name="pencil-outline" size={15} color="#2563EB" />
                                        <Text style={s.btnEditarTxt}>Editar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.btnEliminar} onPress={() => eliminarVideo(v)}>
                                        <Ionicons name="trash-outline" size={15} color="#EF4444" />
                                        <Text style={s.btnEliminarTxt}>Eliminar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        {/* ─── CONFIGS ─── */}
                        {seccion === 'config' && configs.map(c => (
                            <View key={c.id_config} style={s.tarjeta}>
                                <View style={s.tarjetaTop}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.tarjetaTitulo}>Config #{c.id_config}</Text>
                                        <Text style={s.tarjetaSub}>{c.categoria_recomendada || 'Sin categoría'}</Text>
                                    </View>
                                    {c.nivel_dificultad ? (
                                        <View style={[s.badge, { backgroundColor: (colorDificultad[c.nivel_dificultad] ?? '#94A3B8') + '22' }]}>
                                            <Text style={[s.badgeTxt, { color: colorDificultad[c.nivel_dificultad] ?? '#64748B' }]}>
                                                {c.nivel_dificultad}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                                <View style={s.tarjetaMeta}>
                                    <View style={s.metaItem}>
                                        <Ionicons name="person-outline" size={13} color="#94A3B8" />
                                        <Text style={s.metaTxt}>{c.edad_min}–{c.edad_max} años</Text>
                                    </View>
                                    {c.peso_min != null && (
                                        <View style={s.metaItem}>
                                            <Ionicons name="barbell-outline" size={13} color="#94A3B8" />
                                            <Text style={s.metaTxt}>{c.peso_min}–{c.peso_max} kg</Text>
                                        </View>
                                    )}
                                    <View style={s.metaItem}>
                                        <Ionicons name="time-outline" size={13} color="#94A3B8" />
                                        <Text style={s.metaTxt}>{c.max_minutos_diarios} min/día</Text>
                                    </View>
                                    <View style={s.metaItem}>
                                        <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
                                        <Text style={s.metaTxt}>{c.dias_semana_recomendados} días/sem</Text>
                                    </View>
                                </View>
                                {c.condiciones_especiales ? (
                                    <Text style={s.condicionTxt} numberOfLines={2}>
                                         {c.condiciones_especiales}
                                    </Text>
                                ) : null}
                                <View style={s.tarjetaAcciones}>
                                    <TouchableOpacity style={s.btnEditar} onPress={() => abrirEditarConfig(c)}>
                                        <Ionicons name="pencil-outline" size={15} color="#2563EB" />
                                        <Text style={s.btnEditarTxt}>Editar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.btnEliminar} onPress={() => eliminarConfig(c)}>
                                        <Ionicons name="trash-outline" size={15} color="#EF4444" />
                                        <Text style={s.btnEliminarTxt}>Eliminar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        {/* ─── USUARIOS ─── */}
                        {seccion === 'usuarios' && usuarios.map(u => (
                            <View key={u.id_usuario} style={s.tarjeta}>
                                <View style={s.tarjetaTop}>
                                    <View style={s.avatar}>
                                        <Text style={s.avatarTxt}>{u.nombre.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={s.tarjetaTitulo}>{u.nombre}</Text>
                                        <Text style={s.tarjetaSub}>{u.email}</Text>
                                    </View>
                                    <View style={[s.badge, {
                                        backgroundColor: u.rol === 'admin' ? '#7C3AED22' : '#2563EB22'
                                    }]}>
                                        <Text style={[s.badgeTxt, {
                                            color: u.rol === 'admin' ? '#7C3AED' : '#2563EB'
                                        }]}>{u.rol}</Text>
                                    </View>
                                </View>
                                <View style={s.tarjetaMeta}>
                                    <View style={s.metaItem}>
                                        <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
                                        <Text style={s.metaTxt}>{u.edad ?? '?'} años</Text>
                                    </View>
                                    <View style={s.metaItem}>
                                        <Ionicons name="barbell-outline" size={13} color="#94A3B8" />
                                        <Text style={s.metaTxt}>{u.peso} kg</Text>
                                    </View>
                                    <View style={s.metaItem}>
                                        <Ionicons name="fitness-outline" size={13} color="#94A3B8" />
                                        <Text style={s.metaTxt}>{u.nivel_actividad}</Text>
                                    </View>
                                    <View style={[s.metaItem, { marginLeft: 'auto' }]}>
                                        <Ionicons
                                            name={u.cuenta_activa ? 'checkmark-circle' : 'close-circle'}
                                            size={14}
                                            color={u.cuenta_activa ? '#10B981' : '#EF4444'}
                                        />
                                        <Text style={[s.metaTxt, { color: u.cuenta_activa ? '#10B981' : '#EF4444' }]}>
                                            {u.cuenta_activa ? 'Activo' : 'Inactivo'}
                                        </Text>
                                    </View>
                                </View>
                                {u.condiciones_medicas ? (
                                    <Text style={s.condicionTxt} numberOfLines={1}>
                                         {u.condiciones_medicas}
                                    </Text>
                                ) : null}
                                <View style={s.tarjetaAcciones}>
                                    <TouchableOpacity style={s.btnEditar} onPress={() => abrirEditarUsuario(u)}>
                                        <Ionicons name="pencil-outline" size={15} color="#2563EB" />
                                        <Text style={s.btnEditarTxt}>Editar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.btnEliminar} onPress={() => eliminarUsuario(u)}>
                                        <Ionicons name="trash-outline" size={15} color="#EF4444" />
                                        <Text style={s.btnEliminarTxt}>Eliminar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        {/* Empty state */}
                        {seccion === 'videos' && videos.length === 0 && !cargando && (
                            <View style={s.emptyState}>
                                <Ionicons name="play-circle-outline" size={48} color="#CBD5E1" />
                                <Text style={s.emptyTxt}>No hay videos registrados</Text>
                            </View>
                        )}
                        {seccion === 'config' && configs.length === 0 && !cargando && (
                            <View style={s.emptyState}>
                                <Ionicons name="settings-outline" size={48} color="#CBD5E1" />
                                <Text style={s.emptyTxt}>No hay configuraciones registradas</Text>
                            </View>
                        )}
                        {seccion === 'usuarios' && usuarios.length === 0 && !cargando && (
                            <View style={s.emptyState}>
                                <Ionicons name="people-outline" size={48} color="#CBD5E1" />
                                <Text style={s.emptyTxt}>No hay usuarios registrados</Text>
                            </View>
                        )}
                    </ScrollView>
                )
            }

            {/* ══════════════════════════════════════════════════
                MODAL — VIDEO
            ══════════════════════════════════════════════════ */}
            <ModalForm
                visible={modalVideo}
                titulo={videoEdit ? 'Editar video' : 'Nuevo video'}
                onClose={() => setModalVideo(false)}
                onGuardar={guardarVideo}
                cargando={cargando}
            >
                <Campo label="Nombre del video *" value={fVideo.nombre_video}
                    onChangeText={t => setFVideo(p => ({ ...p, nombre_video: t }))} />
                <Campo label="Descripción" value={fVideo.descripcion} multiline
                    onChangeText={t => setFVideo(p => ({ ...p, descripcion: t }))} />
                <Campo label="Categoría *" value={fVideo.categoria}
                    placeholder="Cardio, Fuerza, Flexibilidad…"
                    onChangeText={t => setFVideo(p => ({ ...p, categoria: t }))} />
                <Campo label="Subcategoría" value={fVideo.subcategoria}
                    onChangeText={t => setFVideo(p => ({ ...p, subcategoria: t }))} />
                <Selector
                    label="Dificultad"
                    opciones={['baja', 'media', 'alta']}
                    valor={fVideo.dificultad}
                    onSelect={v => setFVideo(p => ({ ...p, dificultad: v as any }))}
                />
                <Campo label="Duración (minutos) *" value={fVideo.duracion_min.toString()}
                    keyboardType="numeric"
                    onChangeText={t => setFVideo(p => ({ ...p, duracion_min: parseInt(t) || 0 }))} />
                <Campo label="Link del video (YouTube) *" value={fVideo.link_video}
                    placeholder="https://www.youtube.com/watch?v=..."
                    onChangeText={t => setFVideo(p => ({ ...p, link_video: t }))} />
                <Campo label="URL miniatura" value={fVideo.url_miniatura}
                    placeholder="https://img.youtube.com/vi/.../hqdefault.jpg"
                    onChangeText={t => setFVideo(p => ({ ...p, url_miniatura: t }))} />
                <Campo label="Calorías estimadas" value={fVideo.calorias_estimadas?.toString() ?? ''}
                    keyboardType="numeric"
                    onChangeText={t => setFVideo(p => ({ ...p, calorias_estimadas: parseInt(t) || 0 }))} />
                <Campo label="Edad mínima" value={fVideo.edad_minima.toString()}
                    keyboardType="numeric"
                    onChangeText={t => setFVideo(p => ({ ...p, edad_minima: parseInt(t) || 60 }))} />
                <Campo label="Edad máxima" value={fVideo.edad_maxima.toString()}
                    keyboardType="numeric"
                    onChangeText={t => setFVideo(p => ({ ...p, edad_maxima: parseInt(t) || 100 }))} />
                <Campo label="Peso máximo recomendado (kg)" value={fVideo.peso_maximo_recomendado?.toString() ?? ''}
                    keyboardType="numeric"
                    onChangeText={t => setFVideo(p => ({ ...p, peso_maximo_recomendado: parseFloat(t) || 0 }))} />
                <Selector
                    label="Estado"
                    opciones={['1', '0']}
                    valor={fVideo.activo.toString()}
                    onSelect={v => setFVideo(p => ({ ...p, activo: parseInt(v) }))}
                />
            </ModalForm>

            {/* ══════════════════════════════════════════════════
                MODAL — CONFIGURACIÓN EJERCICIOS
            ══════════════════════════════════════════════════ */}
            <ModalForm
                visible={modalConfig}
                titulo={configEdit ? 'Editar configuración' : 'Nueva configuración'}
                onClose={() => setModalConfig(false)}
                onGuardar={guardarConfig}
                cargando={cargando}
            >
                <Campo label="Edad mínima *" value={fConfig.edad_min.toString()}
                    keyboardType="numeric"
                    onChangeText={t => setFConfig(p => ({ ...p, edad_min: parseInt(t) || 0 }))} />
                <Campo label="Edad máxima *" value={fConfig.edad_max.toString()}
                    keyboardType="numeric"
                    onChangeText={t => setFConfig(p => ({ ...p, edad_max: parseInt(t) || 0 }))} />
                <Campo label="Peso mínimo (kg)" value={fConfig.peso_min?.toString() ?? ''}
                    keyboardType="numeric" placeholder="Dejar vacío si no aplica"
                    onChangeText={t => setFConfig(p => ({ ...p, peso_min: t ? parseFloat(t) : null }))} />
                <Campo label="Peso máximo (kg)" value={fConfig.peso_max?.toString() ?? ''}
                    keyboardType="numeric" placeholder="Dejar vacío si no aplica"
                    onChangeText={t => setFConfig(p => ({ ...p, peso_max: t ? parseFloat(t) : null }))} />
                <Selector
                    label="Nivel de dificultad"
                    opciones={['baja', 'media', 'alta']}
                    valor={fConfig.nivel_dificultad ?? ''}
                    onSelect={v => setFConfig(p => ({ ...p, nivel_dificultad: v as any }))}
                />
                <Campo label="Condiciones especiales" value={fConfig.condiciones_especiales} multiline
                    placeholder="Ej: Diabetes, Osteoporosis…"
                    onChangeText={t => setFConfig(p => ({ ...p, condiciones_especiales: t }))} />
                <Campo label="Categoría recomendada" value={fConfig.categoria_recomendada}
                    placeholder="Ej: Cardio, Fuerza, Equilibrio…"
                    onChangeText={t => setFConfig(p => ({ ...p, categoria_recomendada: t }))} />
                <Campo label="Máx. minutos diarios" value={fConfig.max_minutos_diarios.toString()}
                    keyboardType="numeric"
                    onChangeText={t => setFConfig(p => ({ ...p, max_minutos_diarios: parseInt(t) || 30 }))} />
                <Campo label="Días por semana recomendados" value={fConfig.dias_semana_recomendados.toString()}
                    keyboardType="numeric"
                    onChangeText={t => setFConfig(p => ({ ...p, dias_semana_recomendados: parseInt(t) || 3 }))} />
            </ModalForm>

            {/* ══════════════════════════════════════════════════
                MODAL — USUARIO
            ══════════════════════════════════════════════════ */}
            <ModalForm
                visible={modalUsuario}
                titulo="Editar usuario"
                onClose={() => setModalUsuario(false)}
                onGuardar={guardarUsuario}
                cargando={cargando}
            >
                <Campo label="Nombre *" value={fUsuario.nombre ?? ''}
                    onChangeText={t => setFUsuario(p => ({ ...p, nombre: t }))} />
                <Campo label="Email *" value={fUsuario.email ?? ''}
                    keyboardType="email-address"
                    onChangeText={t => setFUsuario(p => ({ ...p, email: t }))} />
                <Campo label="Peso (kg)" value={fUsuario.peso?.toString() ?? ''}
                    keyboardType="numeric"
                    onChangeText={t => setFUsuario(p => ({ ...p, peso: parseFloat(t) || 0 }))} />
                <Campo label="Altura (m)" value={fUsuario.altura?.toString() ?? ''}
                    keyboardType="numeric"
                    onChangeText={t => setFUsuario(p => ({ ...p, altura: parseFloat(t) || 0 }))} />
                <Selector
                    label="Género"
                    opciones={['M', 'F', 'Otro']}
                    valor={fUsuario.genero ?? 'Otro'}
                    onSelect={v => setFUsuario(p => ({ ...p, genero: v as any }))}
                />
                <Campo label="Teléfono" value={fUsuario.telefono ?? ''}
                    keyboardType="phone-pad"
                    onChangeText={t => setFUsuario(p => ({ ...p, telefono: t }))} />
                <Selector
                    label="Rol"
                    opciones={['usuario', 'admin']}
                    valor={fUsuario.rol ?? 'usuario'}
                    onSelect={v => setFUsuario(p => ({ ...p, rol: v as any }))}
                />
                <Selector
                    label="Cuenta activa"
                    opciones={['1', '0']}
                    valor={fUsuario.cuenta_activa?.toString() ?? '1'}
                    onSelect={v => setFUsuario(p => ({ ...p, cuenta_activa: parseInt(v) }))}
                />
                <Selector
                    label="Nivel de actividad"
                    opciones={['sedentario', 'ligero', 'moderado', 'activo']}
                    valor={fUsuario.nivel_actividad ?? 'sedentario'}
                    onSelect={v => setFUsuario(p => ({ ...p, nivel_actividad: v }))}
                />
                <Campo label="Condiciones médicas" value={fUsuario.condiciones_medicas ?? ''} multiline
                    onChangeText={t => setFUsuario(p => ({ ...p, condiciones_medicas: t }))} />
                <Campo label="Restricciones físicas" value={fUsuario.restricciones ?? ''} multiline
                    onChangeText={t => setFUsuario(p => ({ ...p, restricciones: t }))} />
            </ModalForm>
        </SafeAreaView>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F1F5F9' },

    // Header
    header: {
        backgroundColor: '#0F172A',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 16 : 12,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerSub: { fontSize: 12, color: '#64748B', fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
    headerTitulo: { fontSize: 22, color: '#F8FAFC', fontWeight: '800' },
    btnCerrar: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
    btnCerrarTxt: { color: '#F87171', fontSize: 14, fontWeight: '700' },

    // Tabs
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tab: {
        flex: 1, paddingVertical: 14,
        alignItems: 'center', flexDirection: 'row',
        justifyContent: 'center', gap: 6,
    },
    tabActivo: { borderBottomWidth: 2, borderBottomColor: '#2563EB' },
    tabTxt: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
    tabTxtActivo: { color: '#2563EB' },

    // Botón agregar
    btnAgregar: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#2563EB', margin: 16, borderRadius: 14,
        paddingVertical: 13, paddingHorizontal: 20,
        ...Platform.select({
            ios: { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
            android: { elevation: 4 },
        }),
    },
    btnAgregarTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // Lista
    lista: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },

    // Tarjeta
    tarjeta: {
        backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    tarjetaTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    tarjetaTitulo: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
    tarjetaSub: { fontSize: 13, color: '#64748B', fontWeight: '500' },

    // Badge dificultad/rol
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeTxt: { fontSize: 12, fontWeight: '700' },

    // Meta info
    tarjetaMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaTxt: { fontSize: 12, color: '#64748B', fontWeight: '500' },

    // Condiciones
    condicionTxt: { fontSize: 12, color: '#475569', marginBottom: 8, fontStyle: 'italic' },

    // Avatar usuario
    avatar: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: '#2563EB22', justifyContent: 'center', alignItems: 'center',
    },
    avatarTxt: { fontSize: 18, fontWeight: '800', color: '#2563EB' },

    // Acciones tarjeta
    tarjetaAcciones: { flexDirection: 'row', gap: 10, marginTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
    btnEditar: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EFF6FF', borderRadius: 10, paddingVertical: 8 },
    btnEditarTxt: { color: '#2563EB', fontSize: 13, fontWeight: '700' },
    btnEliminar: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: 10, paddingVertical: 8 },
    btnEliminarTxt: { color: '#EF4444', fontSize: 13, fontWeight: '700' },

    // Empty state
    emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyTxt: { color: '#94A3B8', fontSize: 16, fontWeight: '600' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        maxHeight: '90%', paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    modalTitulo: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    modalScroll: { paddingHorizontal: 20, paddingTop: 8 },

    // Guardar
    btnGuardar: {
        backgroundColor: '#2563EB', marginHorizontal: 20, marginTop: 16,
        borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    },
    btnDeshabilitado: { backgroundColor: '#94A3B8' },
    btnGuardarTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

    // Campos formulario
    campoWrap: { marginBottom: 16 },
    campoLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6 },
    campoInput: {
        borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 10,
        fontSize: 15, color: '#0F172A', backgroundColor: '#F8FAFC',
    },
    campoInputMulti: { height: 80, textAlignVertical: 'top', paddingTop: 10 },

    // Chips selector
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC',
    },
    chipActivo: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
    chipTxt: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    chipTxtActivo: { color: '#2563EB' },
});
