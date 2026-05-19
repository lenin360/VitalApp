const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
}));
// Responder preflight OPTIONS globalmente (Express 5 / path-to-regexp v8)
app.options('/{*path}', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Probar conexión
testConnection();

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Vital App Backend funcionando correctamente',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// LOGIN
// ============================================
app.post('/api/login', async (req, res) => {
    const { email, password_hash } = req.body;
    console.log('📝 Login - Email:', email);

    if (!email || !password_hash) {
        return res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios' });
    }

    try {
        // Buscar usuario solo por email (la contraseña se verifica con bcrypt, no en SQL)
        const [rows] = await pool.query(
            `SELECT id_usuario, nombre, email, edad, rol, nivel_actividad,
                    condiciones_medicas, restricciones, password_hash
             FROM usuarios
             WHERE email = ? AND cuenta_activa = 1`,
            [email]
        );

        if (rows.length === 0) {
            return res.json({ success: false, message: 'Correo o contraseña incorrectos' });
        }

        const usuario = rows[0];

        // Comparar la contraseña ingresada contra el hash guardado en la BD
        // Compatible tanto con hashes $2y$ (PHP) como $2b$ (Node.js)
        const hashCompatible = usuario.password_hash.replace(/^\$2y\$/, '$2b$');
        const passwordValida = await bcrypt.compare(password_hash, hashCompatible);

        if (!passwordValida) {
            return res.json({ success: false, message: 'Correo o contraseña incorrectos' });
        }

        // No devolver el hash al cliente
        const { password_hash: _, ...usuarioSinHash } = usuario;
        console.log('[INFO] Login exitoso para:', email);
        res.json({ success: true, user: usuarioSinHash });

    } catch (error) {
        console.error('[ERROR] Error en login:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ============================================
// REGISTRO
// ============================================
app.post('/api/register', async (req, res) => {
    // 'edad' no se inserta: es columna VIRTUAL generada desde fecha_nacimiento
    const { nombre, email, password_hash, fecha_nacimiento, peso, altura, genero, telefono } = req.body;
    console.log('📝 Registro:', { nombre, email, fecha_nacimiento });

    if (!nombre || !email || !password_hash || !fecha_nacimiento || !peso) {
        return res.status(400).json({
            success: false,
            message: 'Los campos nombre, email, password_hash, fecha_nacimiento y peso son obligatorios'
        });
    }

    try {
        // Verificar si el email ya existe
        const [existing] = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.json({ success: false, message: 'El email ya está registrado' });
        }

        // Hashear la contraseña con bcrypt antes de guardar ($2b$ compatible con Node.js)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password_hash, salt);

        const [result] = await pool.query(
            `INSERT INTO usuarios
                (nombre, email, password_hash, fecha_nacimiento, peso, altura, genero, telefono)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, email, hashedPassword, fecha_nacimiento, peso, altura ?? null, genero ?? null, telefono ?? null]
        );

        console.log('[INFO] Usuario registrado ID:', result.insertId);
        res.json({ success: true, id: result.insertId, message: 'Registro exitoso' });

    } catch (error) {
        console.error('[ERROR] Error en registro:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// OBTENER PERFIL DE USUARIO
// ============================================
app.get('/api/user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT id_usuario, nombre, email, edad, peso, altura, genero,
                    telefono, fecha_registro, nivel_actividad,
                    condiciones_medicas, restricciones, rol
             FROM usuarios
             WHERE id_usuario = ? AND cuenta_activa = 1`,
            [id]
        );
        if (rows.length > 0) {
            res.json({ success: true, user: rows[0] });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('[ERROR] Error al obtener perfil:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ============================================
// ACTUALIZAR PERFIL DE USUARIO
// ============================================
app.put('/api/user/:id', async (req, res) => {
    const { id } = req.params;
    // 'edad' es columna VIRTUAL (no editable). Se actualiza fecha_nacimiento si se desea cambiar la edad.
    const { nombre, email, peso, altura, genero, telefono, nivel_actividad, condiciones_medicas, restricciones } = req.body;
    console.log('📝 Actualizar perfil ID:', id);

    try {
        const [result] = await pool.query(
            `UPDATE usuarios
             SET nombre = ?, email = ?, peso = ?, altura = ?, genero = ?,
                 telefono = ?, nivel_actividad = ?, condiciones_medicas = ?, restricciones = ?
             WHERE id_usuario = ?`,
            [nombre, email, peso, altura ?? null, genero ?? null,
             telefono ?? null, nivel_actividad ?? 'sedentario',
             condiciones_medicas ?? null, restricciones ?? null, id]
        );

        if (result.affectedRows > 0) {
            console.log('[INFO] Perfil actualizado');
            res.json({ success: true, message: 'Perfil actualizado correctamente' });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('[ERROR] Error al actualizar perfil:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// VIDEOS / EJERCICIOS
// (La tabla en BD se llama 'videos', no 'ejercicios')
// ============================================
app.get('/api/exercises', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id_video, nombre_video, descripcion, categoria, subcategoria,
                    dificultad, duracion_min, link_video, url_miniatura,
                    calorias_estimadas, edad_minima, edad_maxima, peso_maximo_recomendado
             FROM videos
             WHERE activo = 1`
        );
        res.json({ success: true, exercises: rows });
    } catch (error) {
        console.error('[ERROR] Error al obtener videos:', error);
        res.status(500).json({ success: false, error: 'Error al obtener ejercicios' });
    }
});

// ============================================
// VIDEOS FILTRADOS POR USUARIO
// Devuelve los videos adecuados según edad y peso del usuario
// ============================================
app.get('/api/exercises/user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [users] = await pool.query(
            'SELECT edad, peso FROM usuarios WHERE id_usuario = ? AND cuenta_activa = 1',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const { edad, peso } = users[0];

        const [rows] = await pool.query(
            `SELECT id_video, nombre_video, descripcion, categoria, subcategoria,
                    dificultad, duracion_min, link_video, url_miniatura,
                    calorias_estimadas, edad_minima, edad_maxima, peso_maximo_recomendado
             FROM videos
             WHERE activo = 1
               AND edad_minima <= ?
               AND edad_maxima >= ?
               AND (peso_maximo_recomendado IS NULL OR peso_maximo_recomendado >= ?)
             ORDER BY dificultad ASC`,
            [edad, edad, peso]
        );

        res.json({ success: true, exercises: rows });
    } catch (error) {
        console.error('[ERROR] Error al obtener videos para usuario:', error);
        res.status(500).json({ success: false, error: 'Error al obtener ejercicios' });
    }
});

// ============================================
// REGISTRAR EJERCICIO REALIZADO
// ============================================
app.post('/api/ejercicio-realizado', async (req, res) => {
    const { id_usuario, id_video, duracion_segundos, calorias_quemadas, nivel_esfuerzo, completado, comentarios } = req.body;

    if (!id_usuario || !id_video) {
        return res.status(400).json({ success: false, message: 'id_usuario e id_video son obligatorios' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO ejercicio_realizado
                (id_usuario, id_video, duracion_segundos, calorias_quemadas, nivel_esfuerzo, completado, comentarios)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id_usuario, id_video, duracion_segundos ?? null, calorias_quemadas ?? null,
             nivel_esfuerzo ?? null, completado ?? 1, comentarios ?? null]
        );
        res.json({ success: true, id: result.insertId, message: 'Ejercicio registrado correctamente' });
    } catch (error) {
        console.error('[ERROR] Error al registrar ejercicio:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// HISTORIAL DE EJERCICIOS DE UN USUARIO
// ============================================
app.get('/api/ejercicio-realizado/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT er.id_ejercicio, v.nombre_video, v.categoria, v.dificultad,
                    er.fecha_hora_inicio, er.fecha_hora_fin, er.duracion_segundos,
                    er.calorias_quemadas, er.nivel_esfuerzo, er.completado, er.comentarios
             FROM ejercicio_realizado er
             JOIN videos v ON er.id_video = v.id_video
             WHERE er.id_usuario = ?
             ORDER BY er.fecha_hora_inicio DESC`,
            [id_usuario]
        );
        res.json({ success: true, historial: rows });
    } catch (error) {
        console.error('[ERROR] Error al obtener historial:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ============================================
// EVOLUCIÓN DEL USUARIO
// ============================================
app.get('/api/evolucion/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT id_evolucion, fecha_registro, peso, presion_arterial_sistolica,
                    presion_arterial_diastolica, frecuencia_cardiaca_reposo,
                    flexibilidad_cm, fuerza_prensalon_kg, equilibrio_segundos, notas
             FROM evolucion_usuario
             WHERE id_usuario = ?
             ORDER BY fecha_registro DESC`,
            [id_usuario]
        );
        res.json({ success: true, evolucion: rows });
    } catch (error) {
        console.error('[ERROR] Error al obtener evolución:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

app.post('/api/evolucion', async (req, res) => {
    const { id_usuario, fecha_registro, peso, presion_arterial_sistolica,
            presion_arterial_diastolica, frecuencia_cardiaca_reposo,
            flexibilidad_cm, fuerza_prensalon_kg, equilibrio_segundos, notas } = req.body;

    if (!id_usuario || !fecha_registro) {
        return res.status(400).json({ success: false, message: 'id_usuario y fecha_registro son obligatorios' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO evolucion_usuario
                (id_usuario, fecha_registro, peso, presion_arterial_sistolica,
                 presion_arterial_diastolica, frecuencia_cardiaca_reposo,
                 flexibilidad_cm, fuerza_prensalon_kg, equilibrio_segundos, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id_usuario, fecha_registro, peso ?? null, presion_arterial_sistolica ?? null,
             presion_arterial_diastolica ?? null, frecuencia_cardiaca_reposo ?? null,
             flexibilidad_cm ?? null, fuerza_prensalon_kg ?? null, equilibrio_segundos ?? null, notas ?? null]
        );
        res.json({ success: true, id: result.insertId, message: 'Evolución registrada correctamente' });
    } catch (error) {
        console.error('[ERROR] Error al registrar evolución:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// REPORTE SEMANAL
// ============================================
app.get('/api/reporte/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT id_reporte, fecha_inicio_semana, fecha_fin_semana, total_ejercicios,
                    total_minutos, total_calorias, dias_activos, promedio_esfuerzo,
                    progreso_fisico, observaciones, fecha_generacion
             FROM reporte_semanal
             WHERE id_usuario = ?
             ORDER BY fecha_generacion DESC`,
            [id_usuario]
        );
        res.json({ success: true, reportes: rows });
    } catch (error) {
        console.error('[ERROR] Error al obtener reportes:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ============================================
// ADMIN — VIDEOS
// ============================================

// Obtener todos los videos (incluyendo inactivos para el admin)
app.get('/api/admin/videos', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id_video, nombre_video, descripcion, categoria, subcategoria,
                    dificultad, duracion_min, link_video, url_miniatura,
                    calorias_estimadas, edad_minima, edad_maxima,
                    peso_maximo_recomendado, fecha_creacion, activo
             FROM videos
             ORDER BY id_video DESC`
        );
        res.json({ success: true, videos: rows });
    } catch (error) {
        console.error('[ERROR] Error al obtener videos:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Agregar video
app.post('/api/admin/videos', async (req, res) => {
    const { nombre_video, descripcion, categoria, subcategoria, dificultad,
            duracion_min, link_video, url_miniatura, calorias_estimadas,
            edad_minima, edad_maxima, peso_maximo_recomendado } = req.body;

    if (!nombre_video || !categoria || !dificultad || !duracion_min || !link_video) {
        return res.status(400).json({ success: false, message: 'nombre_video, categoria, dificultad, duracion_min y link_video son obligatorios' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO videos
                (nombre_video, descripcion, categoria, subcategoria, dificultad,
                 duracion_min, link_video, url_miniatura, calorias_estimadas,
                 edad_minima, edad_maxima, peso_maximo_recomendado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre_video, descripcion ?? null, categoria, subcategoria ?? null,
             dificultad, duracion_min, link_video, url_miniatura ?? null,
             calorias_estimadas ?? null, edad_minima ?? 60, edad_maxima ?? 100,
             peso_maximo_recomendado ?? null]
        );
        res.json({ success: true, id: result.insertId, message: 'Video agregado correctamente' });
    } catch (error) {
        console.error('[ERROR] Error al agregar video:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Editar video
app.put('/api/admin/videos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_video, descripcion, categoria, subcategoria, dificultad,
            duracion_min, link_video, url_miniatura, calorias_estimadas,
            edad_minima, edad_maxima, peso_maximo_recomendado, activo } = req.body;
    try {
        const [result] = await pool.query(
            `UPDATE videos SET
                nombre_video = ?, descripcion = ?, categoria = ?, subcategoria = ?,
                dificultad = ?, duracion_min = ?, link_video = ?, url_miniatura = ?,
                calorias_estimadas = ?, edad_minima = ?, edad_maxima = ?,
                peso_maximo_recomendado = ?, activo = ?
             WHERE id_video = ?`,
            [nombre_video, descripcion ?? null, categoria, subcategoria ?? null,
             dificultad, duracion_min, link_video, url_miniatura ?? null,
             calorias_estimadas ?? null, edad_minima ?? 60, edad_maxima ?? 100,
             peso_maximo_recomendado ?? null, activo ?? 1, id]
        );
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Video actualizado correctamente' });
        } else {
            res.json({ success: false, message: 'Video no encontrado' });
        }
    } catch (error) {
        console.error('[ERROR] Error al editar video:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Borrar video
app.delete('/api/admin/videos/:id', async (req, res) => {
    const { id } = req.params;
    console.log('🗑️  DELETE video ID:', id);
    try {
        const [result] = await pool.query('DELETE FROM videos WHERE id_video = ?', [id]);
        console.log('Filas afectadas:', result.affectedRows);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Video eliminado correctamente' });
        } else {
            res.json({ success: false, message: 'Video no encontrado' });
        }
    } catch (error) {
        console.error('[ERROR] Error al borrar video:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ADMIN — CONFIGURACIÓN DE EJERCICIOS
// ============================================

// Obtener todas las configuraciones
app.get('/api/admin/config-ejercicios', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id_config, edad_min, edad_max, peso_min, peso_max,
                    nivel_dificultad, condiciones_especiales, categoria_recomendada,
                    max_minutos_diarios, dias_semana_recomendados
             FROM configuracion_ejercicios
             ORDER BY id_config ASC`
        );
        res.json({ success: true, configuraciones: rows });
    } catch (error) {
        console.error('[ERROR] Error al obtener configuraciones:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Agregar configuración
app.post('/api/admin/config-ejercicios', async (req, res) => {
    const { edad_min, edad_max, peso_min, peso_max, nivel_dificultad,
            condiciones_especiales, categoria_recomendada,
            max_minutos_diarios, dias_semana_recomendados } = req.body;

    if (!edad_min || !edad_max) {
        return res.status(400).json({ success: false, message: 'edad_min y edad_max son obligatorios' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO configuracion_ejercicios
                (edad_min, edad_max, peso_min, peso_max, nivel_dificultad,
                 condiciones_especiales, categoria_recomendada,
                 max_minutos_diarios, dias_semana_recomendados)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [edad_min, edad_max, peso_min ?? null, peso_max ?? null,
             nivel_dificultad ?? null, condiciones_especiales ?? null,
             categoria_recomendada ?? null,
             max_minutos_diarios ?? 30, dias_semana_recomendados ?? 3]
        );
        res.json({ success: true, id: result.insertId, message: 'Configuración agregada correctamente' });
    } catch (error) {
        console.error('[ERROR] Error al agregar configuración:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Editar configuración
app.put('/api/admin/config-ejercicios/:id', async (req, res) => {
    const { id } = req.params;
    const { edad_min, edad_max, peso_min, peso_max, nivel_dificultad,
            condiciones_especiales, categoria_recomendada,
            max_minutos_diarios, dias_semana_recomendados } = req.body;
    try {
        const [result] = await pool.query(
            `UPDATE configuracion_ejercicios SET
                edad_min = ?, edad_max = ?, peso_min = ?, peso_max = ?,
                nivel_dificultad = ?, condiciones_especiales = ?,
                categoria_recomendada = ?, max_minutos_diarios = ?,
                dias_semana_recomendados = ?
             WHERE id_config = ?`,
            [edad_min, edad_max, peso_min ?? null, peso_max ?? null,
             nivel_dificultad ?? null, condiciones_especiales ?? null,
             categoria_recomendada ?? null,
             max_minutos_diarios ?? 30, dias_semana_recomendados ?? 3, id]
        );
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Configuración actualizada correctamente' });
        } else {
            res.json({ success: false, message: 'Configuración no encontrada' });
        }
    } catch (error) {
        console.error('[ERROR] Error al editar configuración:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Borrar configuración
app.delete('/api/admin/config-ejercicios/:id', async (req, res) => {
    const { id } = req.params;
    console.log('🗑️  DELETE config ID:', id);
    try {
        const [result] = await pool.query('DELETE FROM configuracion_ejercicios WHERE id_config = ?', [id]);
        console.log('Filas afectadas:', result.affectedRows);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Configuración eliminada correctamente' });
        } else {
            res.json({ success: false, message: 'Configuración no encontrada' });
        }
    } catch (error) {
        console.error('[ERROR] Error al borrar configuración:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ADMIN — USUARIOS
// ============================================

// Obtener todos los usuarios (sin exponer password_hash)
app.get('/api/admin/usuarios', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id_usuario, nombre, fecha_nacimiento, edad, peso, altura,
                    genero, email, rol, cuenta_activa, telefono, fecha_registro,
                    nivel_actividad, condiciones_medicas, restricciones
             FROM usuarios
             ORDER BY id_usuario ASC`
        );
        res.json({ success: true, usuarios: rows });
    } catch (error) {
        console.error('[ERROR] Error al obtener usuarios:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Editar usuario (admin puede cambiar cualquier campo excepto password_hash)
app.put('/api/admin/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email, peso, altura, genero, telefono, rol,
            cuenta_activa, nivel_actividad, condiciones_medicas, restricciones } = req.body;
    try {
        const [result] = await pool.query(
            `UPDATE usuarios SET
                nombre = ?, email = ?, peso = ?, altura = ?, genero = ?,
                telefono = ?, rol = ?, cuenta_activa = ?,
                nivel_actividad = ?, condiciones_medicas = ?, restricciones = ?
             WHERE id_usuario = ?`,
            [nombre, email, peso, altura ?? null, genero ?? null,
             telefono ?? null, rol ?? 'usuario', cuenta_activa ?? 1,
             nivel_actividad ?? 'sedentario', condiciones_medicas ?? null,
             restricciones ?? null, id]
        );
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Usuario actualizado correctamente' });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('[ERROR] Error al editar usuario:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Borrar usuario
app.delete('/api/admin/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    console.log('🗑️  DELETE usuario ID:', id);
    try {
        const [result] = await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
        console.log('Filas afectadas:', result.affectedRows);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Usuario eliminado correctamente' });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('[ERROR] Error al borrar usuario:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// TIPS (tabla no existe en BD — respuesta estática)
// ============================================
app.get('/api/tips', (req, res) => {
    const tips = [
        'Mantente hidratado durante el ejercicio.',
        'Respira profundo antes de comenzar cada sesión.',
        'Descansa al menos un día entre sesiones intensas.',
        'Escucha a tu cuerpo y no fuerces el movimiento.',
        'La constancia es más importante que la intensidad.'
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    res.json({ tip });
});

// ============================================
// ADMIN — VIDEOS
// ============================================

// Listar todos (incluye inactivos para el admin)
app.get('/api/admin/videos', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id_video, nombre_video, descripcion, categoria, subcategoria,
                    dificultad, duracion_min, link_video, url_miniatura,
                    calorias_estimadas, edad_minima, edad_maxima,
                    peso_maximo_recomendado, activo
             FROM videos ORDER BY id_video DESC`
        );
        res.json({ success: true, videos: rows });
    } catch (error) {
        console.error('[ERROR] Error al listar videos (admin):', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Crear video
app.post('/api/admin/videos', async (req, res) => {
    const { nombre_video, descripcion, categoria, subcategoria, dificultad,
            duracion_min, link_video, url_miniatura, calorias_estimadas,
            edad_minima, edad_maxima, peso_maximo_recomendado, activo } = req.body;

    if (!nombre_video || !categoria || !dificultad || !duracion_min || !link_video) {
        return res.status(400).json({ success: false, message: 'nombre_video, categoria, dificultad, duracion_min y link_video son obligatorios' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO videos
                (nombre_video, descripcion, categoria, subcategoria, dificultad,
                 duracion_min, link_video, url_miniatura, calorias_estimadas,
                 edad_minima, edad_maxima, peso_maximo_recomendado, activo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre_video, descripcion ?? null, categoria, subcategoria ?? null,
             dificultad, duracion_min, link_video, url_miniatura ?? null,
             calorias_estimadas ?? null, edad_minima ?? 60, edad_maxima ?? 100,
             peso_maximo_recomendado ?? null, activo ?? 1]
        );
        res.json({ success: true, id: result.insertId, message: 'Video creado correctamente' });
    } catch (error) {
        console.error('[ERROR] Error al crear video:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Editar video
app.put('/api/admin/videos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_video, descripcion, categoria, subcategoria, dificultad,
            duracion_min, link_video, url_miniatura, calorias_estimadas,
            edad_minima, edad_maxima, peso_maximo_recomendado, activo } = req.body;
    try {
        const [result] = await pool.query(
            `UPDATE videos SET
                nombre_video = ?, descripcion = ?, categoria = ?, subcategoria = ?,
                dificultad = ?, duracion_min = ?, link_video = ?, url_miniatura = ?,
                calorias_estimadas = ?, edad_minima = ?, edad_maxima = ?,
                peso_maximo_recomendado = ?, activo = ?
             WHERE id_video = ?`,
            [nombre_video, descripcion ?? null, categoria, subcategoria ?? null,
             dificultad, duracion_min, link_video, url_miniatura ?? null,
             calorias_estimadas ?? null, edad_minima ?? 60, edad_maxima ?? 100,
             peso_maximo_recomendado ?? null, activo ?? 1, id]
        );
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Video actualizado correctamente' });
        } else {
            res.json({ success: false, message: 'Video no encontrado' });
        }
    } catch (error) {
        console.error('[ERROR] Error al editar video:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Eliminar video — llama al SP sp_eliminar_video
app.post('/api/admin/videos/eliminar/:id', async (req, res) => {
    const { id } = req.params;
    console.log('🗑️  sp_eliminar_video ID:', id);
    try {
        const [[result]] = await pool.query('CALL sp_eliminar_video(?)', [id]);
        console.log('   filas_afectadas:', result.filas_afectadas);
        if (result.filas_afectadas > 0) {
            res.json({ success: true, message: 'Video eliminado correctamente' });
        } else {
            res.json({ success: false, message: 'Video no encontrado' });
        }
    } catch (error) {
        console.error('[ERROR] Error al eliminar video:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ADMIN — CONFIGURACION_EJERCICIOS
// ============================================

app.get('/api/admin/config-ejercicios', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id_config, edad_min, edad_max, peso_min, peso_max,
                    nivel_dificultad, condiciones_especiales, categoria_recomendada,
                    max_minutos_diarios, dias_semana_recomendados
             FROM configuracion_ejercicios ORDER BY id_config ASC`
        );
        res.json({ success: true, configuraciones: rows });
    } catch (error) {
        console.error('[ERROR] Error al listar config:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/admin/config-ejercicios', async (req, res) => {
    const { edad_min, edad_max, peso_min, peso_max, nivel_dificultad,
            condiciones_especiales, categoria_recomendada,
            max_minutos_diarios, dias_semana_recomendados } = req.body;

    if (!edad_min || !edad_max) {
        return res.status(400).json({ success: false, message: 'edad_min y edad_max son obligatorios' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO configuracion_ejercicios
                (edad_min, edad_max, peso_min, peso_max, nivel_dificultad,
                 condiciones_especiales, categoria_recomendada,
                 max_minutos_diarios, dias_semana_recomendados)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [edad_min, edad_max, peso_min ?? null, peso_max ?? null,
             nivel_dificultad ?? 'baja', condiciones_especiales ?? null,
             categoria_recomendada ?? null, max_minutos_diarios ?? 30,
             dias_semana_recomendados ?? 3]
        );
        res.json({ success: true, id: result.insertId, message: 'Configuración creada correctamente' });
    } catch (error) {
        console.error('[ERROR] Error al crear config:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/admin/config-ejercicios/:id', async (req, res) => {
    const { id } = req.params;
    const { edad_min, edad_max, peso_min, peso_max, nivel_dificultad,
            condiciones_especiales, categoria_recomendada,
            max_minutos_diarios, dias_semana_recomendados } = req.body;
    try {
        const [result] = await pool.query(
            `UPDATE configuracion_ejercicios SET
                edad_min = ?, edad_max = ?, peso_min = ?, peso_max = ?,
                nivel_dificultad = ?, condiciones_especiales = ?,
                categoria_recomendada = ?, max_minutos_diarios = ?,
                dias_semana_recomendados = ?
             WHERE id_config = ?`,
            [edad_min, edad_max, peso_min ?? null, peso_max ?? null,
             nivel_dificultad ?? 'baja', condiciones_especiales ?? null,
             categoria_recomendada ?? null, max_minutos_diarios ?? 30,
             dias_semana_recomendados ?? 3, id]
        );
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Configuración actualizada correctamente' });
        } else {
            res.json({ success: false, message: 'Configuración no encontrada' });
        }
    } catch (error) {
        console.error('[ERROR] Error al editar config:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Eliminar config — llama al SP sp_eliminar_config
app.post('/api/admin/config-ejercicios/eliminar/:id', async (req, res) => {
    const { id } = req.params;
    console.log('🗑️  sp_eliminar_config ID:', id);
    try {
        const [[result]] = await pool.query('CALL sp_eliminar_config(?)', [id]);
        console.log('   filas_afectadas:', result.filas_afectadas);
        if (result.filas_afectadas > 0) {
            res.json({ success: true, message: 'Configuración eliminada correctamente' });
        } else {
            res.json({ success: false, message: 'Configuración no encontrada' });
        }
    } catch (error) {
        console.error('[ERROR] Error al eliminar config:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ADMIN — USUARIOS
// ============================================

// Listar todos los usuarios (sin exponer password_hash)
app.get('/api/admin/usuarios', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id_usuario, nombre, email, edad, peso, altura, genero,
                    telefono, rol, cuenta_activa, fecha_registro,
                    nivel_actividad, condiciones_medicas, restricciones
             FROM usuarios ORDER BY id_usuario ASC`
        );
        res.json({ success: true, usuarios: rows });
    } catch (error) {
        console.error('[ERROR] Error al listar usuarios (admin):', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Editar usuario (admin puede cambiar rol y cuenta_activa)
app.put('/api/admin/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email, peso, altura, genero, telefono,
            rol, cuenta_activa, nivel_actividad,
            condiciones_medicas, restricciones } = req.body;
    try {
        const [result] = await pool.query(
            `UPDATE usuarios SET
                nombre = ?, email = ?, peso = ?, altura = ?, genero = ?,
                telefono = ?, rol = ?, cuenta_activa = ?, nivel_actividad = ?,
                condiciones_medicas = ?, restricciones = ?
             WHERE id_usuario = ?`,
            [nombre, email, peso, altura ?? null, genero ?? null,
             telefono ?? null, rol ?? 'usuario', cuenta_activa ?? 1,
             nivel_actividad ?? 'sedentario', condiciones_medicas ?? null,
             restricciones ?? null, id]
        );
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Usuario actualizado correctamente' });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('[ERROR] Error al editar usuario:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Eliminar usuario — llama al SP sp_eliminar_usuario
app.post('/api/admin/usuarios/eliminar/:id', async (req, res) => {
    const { id } = req.params;
    console.log('🗑️  sp_eliminar_usuario ID:', id);
    try {
        const [[result]] = await pool.query('CALL sp_eliminar_usuario(?)', [id]);
        console.log('   filas_afectadas:', result.filas_afectadas);
        if (result.filas_afectadas > 0) {
            res.json({ success: true, message: 'Usuario eliminado correctamente' });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('[ERROR] Error al eliminar usuario:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[INFO] Servidor corriendo en puerto ${PORT}`);
    console.log(`📍 Local:  http://localhost:${PORT}`);
    console.log(`📍 Red:    http://192.168.100.14:${PORT}`);
    console.log(`🔐 Login:          POST /api/login`);
    console.log(`📝 Registro:       POST /api/register`);
    console.log(`📋 Ejercicios:      GET /api/exercises`);
    console.log(`🎯 Ejerc. usuario:  GET /api/exercises/user/:id`);
    console.log(`✍️  Registrar ej.:  POST /api/ejercicio-realizado`);
    console.log(`📈 Evolución:       GET /api/evolucion/:id_usuario`);
    console.log(`📊 Reporte:         GET /api/reporte/:id_usuario`);
});
