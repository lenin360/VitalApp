const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const { OAuth2Client } = require('google-auth-library');
const { pool, testConnection } = require('./db');

const GOOGLE_CLIENT_ID = '691441001085-m589115m0oplaunqp33l74jkpc6j3vf0.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Permite usar cookies Secure detrás de proxies (por ejemplo, Heroku o NGROK)
app.set('trust proxy', 1);

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: false,       // false para desarrollo HTTP (cambiar a true en producción HTTPS)
    sameSite: 'strict',
};

function setSecureCookie(res, name, value, options = {}) {
    return res.cookie(name, value, { ...COOKIE_OPTIONS, ...options });
}

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "http:", "https:"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
    origin: ['http://localhost:8081', 'http://127.0.0.1:8081'],
    credentials: true,  // Permite enviar/recibir cookies entre orígenes
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Signature'],
}));
// Responder preflight OPTIONS globalmente (Express 5 / path-to-regexp v8)
app.options('/{*path}', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Necesario para leer y escribir cookies

// ============================================
// SESIONES EN MEMORIA (como en el ejemplo de clase)
// ============================================
const sessions = {};

const createSession = function(req, res, extraData = {}) {
    const userAgent = req.get('user-agent');
    const sessionId = crypto.randomBytes(16).toString('base64url');
    sessions[sessionId] = { userAgent, ...extraData };
    res.cookie('sessionId', sessionId, COOKIE_OPTIONS);
    console.log(' Sesión creada:', sessionId);
    return sessionId;
};

// ============================================
// PREVENCIÓN DE INYECCIONES (SQL + XSS)
// ============================================

// SQL Injection: PREVENIDA por queries parametrizadas con "?" en todo el backend.
// mysql2 nunca interpola valores directamente en el SQL — los envía como parámetros separados.

// XSS (JavaScript Injection): Escapar caracteres peligrosos en inputs del usuario.
function sanitizeInput(value) {
    if (typeof value !== 'string') return value;
    const sanitized = value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
        
    // Si el texto cambió, significa que tenía caracteres peligrosos
    if (sanitized !== value.trim()) {
        console.warn(`[ADVERTENCIA] [ALERTA DE SEGURIDAD] Se detectaron y neutralizaron caracteres peligrosos. Entrada original contenía inyección.`);
    }
    
    return sanitized;
}

// Middleware global: sanitiza automáticamente todos los campos del body
function sanitizeMiddleware(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeInput(req.body[key]);
            }
        }
    }
    next();
}

app.use(sanitizeMiddleware);

// ============================================
// MIDDLEWARE: VERIFICACIÓN DE INTEGRIDAD HMAC SHA-256
// ============================================
const HMAC_SECRET = process.env.HMAC_SECRET;

function verificarFirma(req, res, next) {
    // Solo verificar en métodos que envían cuerpo
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) return next();

    const firma = req.headers['x-signature'];

    if (!firma) {
        return res.status(400).json({
            success: false,
            message: 'Firma de seguridad ausente (X-Signature). Solicitud rechazada.'
        });
    }

    if (!HMAC_SECRET) {
        console.warn('[ADVERTENCIA] HMAC_SECRET no definida en .env. Saltando verificación.');
        return next();
    }

    // Calcular HMAC del cuerpo recibido
    const cuerpo = JSON.stringify(req.body);
    const firmaEsperada = crypto
        .createHmac('sha256', HMAC_SECRET)
        .update(cuerpo)
        .digest('hex');

    if (firma !== firmaEsperada) {
        console.warn('🚫 Firma inválida en:', req.path, '| recibida:', firma, '| esperada:', firmaEsperada);
        return res.status(400).json({
            success: false,
            message: 'Firma inválida. Los datos pueden haber sido manipulados.'
        });
    }

    next();
}

// Aplicar verificación de integridad a todas las rutas /api/*
app.use('/api', verificarFirma);

// Probar conexión
testConnection();

// Inicializar DB (Añadir columnas MFA si no existen)
async function initDB() {
    try {
        await pool.query('ALTER TABLE usuario ADD COLUMN mfa_secret VARCHAR(255) DEFAULT NULL');
        console.log(' Columna mfa_secret añadida a usuarios');
    } catch (e) { /* Ya existe */ }
    try {
        await pool.query('ALTER TABLE usuario ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE');
        console.log(' Columna mfa_enabled añadida a usuarios');
    } catch (e) { /* Ya existe */ }
}
initDB();

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
    console.log(' Login - Email:', email);

    if (!email || !password_hash) {
        return res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios' });
    }

    try {
        // Buscar usuario solo por email (la contraseña se verifica con bcrypt, no en SQL)
        const [rows] = await pool.query(
            `SELECT id_usuario, nombre, email, edad, rol, nivel_actividad,
                    condiciones_medicas, restricciones, password_hash, mfa_enabled
             FROM usuario
             WHERE email = ? AND cuenta_activa = 1`,
            [email]
        );

        if (rows.length === 0) {
            return res.json({ success: false, message: 'Correo o contraseña incorrectos' });
        }

        const usuario = rows[0];

        // Comparar la contraseña ingresada contra el hash guardado en la BD

        const hashCompatible = usuario.password_hash.replace(/^\$2y\$/, '$2b$');
        const passwordValida = await bcrypt.compare(password_hash, hashCompatible);

        if (!passwordValida) {
            return res.json({ success: false, message: 'Correo o contraseña incorrectos' });
        }

        // No devolver el hash al cliente
        const { password_hash: _, ...usuarioSinHash } = usuario;

        if (usuario.mfa_enabled) {
            console.log(' Login requiere MFA para:', email);
            createSession(req, res, { userId: usuario.id_usuario });
            return res.json({ success: true, requiresMfa: true, userId: usuario.id_usuario });
        }

        // Crear sesión con datos del usuario (igual que el ejemplo de clase)
        const sessionId = createSession(req, res, {
            userId: usuarioSinHash.id_usuario,
            email: usuarioSinHash.email,
            rol: usuarioSinHash.rol
        });
        console.log(' Login exitoso para:', email, '| sessionId:', sessionId);
        res.json({ success: true, user: usuarioSinHash });

    } catch (error) {
        console.error(' Error en login:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ============================================
// OAUTH2 REAL (SSO Google)
// ============================================
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    console.log(` OAUTH SSO Real - Verificando token de Google...`);

    if (!token) {
        return res.status(400).json({ success: false, message: 'Falta el token de Google' });
    }

    try {
        // Verificar criptográficamente el token con Google
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        const email = payload.email;
        const nombre = payload.name || 'Usuario Google';
        
        console.log(` Token válido. Email recibido de Google: ${email}`);

        // Buscar si el usuario ya existe
        const [rows] = await pool.query(
            `SELECT id_usuario, nombre, email, edad, rol, nivel_actividad,
                    condiciones_medicas, restricciones, password_hash, mfa_enabled
             FROM usuario
             WHERE email = ? AND cuenta_activa = 1`,
            [email]
        );

        let usuario = rows[0];

        // Si no existe, crearlo automáticamente (SSO Behavior)
        if (!usuario) {
            console.log(' Usuario nuevo vía Google SSO, creando cuenta:', email);
            const dummyPassword = crypto.randomBytes(32).toString('hex');
            const hash = await bcrypt.hash(dummyPassword, 10);
            
            const [result] = await pool.query(
                `INSERT INTO usuario (nombre, email, password_hash, fecha_nacimiento, peso)
                 VALUES (?, ?, ?, '2000-01-01', 70)`,
                [nombre, email, hash]
            );

            // Obtener el usuario recién creado
            const [newRows] = await pool.query('SELECT * FROM usuario WHERE id_usuario = ?', [result.insertId]);
            usuario = newRows[0];
        }

        // Iniciar sesión y generar sessionId
        const { password_hash: _, ...usuarioSinHash } = usuario;
        
        const sessionId = createSession(req, res, {
            userId: usuarioSinHash.id_usuario,
            email: usuarioSinHash.email,
            rol: usuarioSinHash.rol
        });
        
        console.log(` Login Google SSO exitoso para: ${email} | sessionId: ${sessionId}`);
        res.json({ success: true, user: usuarioSinHash, message: 'Autenticación con Google exitosa' });

    } catch (error) {
        console.error(' Error verificando token de Google:', error);
        res.status(401).json({ success: false, message: 'Token de Google inválido o expirado' });
    }
});

// ============================================
// MFA (MULTI-FACTOR AUTHENTICATION)
// ============================================

app.post('/api/mfa/setup', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'Falta userId' });

    try {
        const secret = speakeasy.generateSecret({ name: `VitalApp (${userId})` });

        await pool.query('UPDATE usuario SET mfa_secret = ? WHERE id_usuario = ?', [secret.base32, userId]);

        QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) return res.status(500).json({ success: false, message: 'Error al generar QR' });
            res.json({ success: true, secret: secret.base32, qrCode: data_url });
        });
    } catch (e) {
        console.error(' Error en MFA Setup:', e);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

app.post('/api/mfa/enable', async (req, res) => {
    const { userId, token } = req.body;
    if (!userId || !token) return res.status(400).json({ success: false, message: 'Faltan datos' });

    try {
        const [rows] = await pool.query('SELECT mfa_secret FROM usuario WHERE id_usuario = ?', [userId]);
        if (rows.length === 0 || !rows[0].mfa_secret) {
            return res.json({ success: false, message: 'MFA no configurado' });
        }

        const verified = speakeasy.totp.verify({
            secret: rows[0].mfa_secret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            await pool.query('UPDATE usuario SET mfa_enabled = 1 WHERE id_usuario = ?', [userId]);
            res.json({ success: true, message: 'MFA habilitado correctamente' });
        } else {
            res.json({ success: false, message: 'Token incorrecto' });
        }
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

app.post('/api/mfa/verify-login', async (req, res) => {
    const { userId, token } = req.body;

    try {
        const [rows] = await pool.query(
            `SELECT id_usuario, nombre, email, edad, rol, nivel_actividad,
                    condiciones_medicas, restricciones, mfa_secret, mfa_enabled
             FROM usuario
             WHERE id_usuario = ? AND cuenta_activa = 1`,
            [userId]
        );

        if (rows.length === 0) return res.json({ success: false, message: 'Usuario no encontrado' });

        const usuario = rows[0];

        if (!usuario.mfa_enabled) {
            return res.json({ success: false, message: 'MFA no está habilitado para este usuario' });
        }

        const verified = speakeasy.totp.verify({
            secret: usuario.mfa_secret,
            encoding: 'base32',
            token: token,
            window: 1 // Permitir ligero desfase de tiempo
        });

        if (verified) {
            const { mfa_secret, ...usuarioLimpio } = usuario;
            console.log(' MFA Login exitoso para ID:', userId);
            res.json({ success: true, user: usuarioLimpio });
        } else {
            res.json({ success: false, message: 'Código incorrecto' });
        }
    } catch (e) {
        console.error(' Error en MFA Verify Login:', e);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

app.post('/api/mfa/disable', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'Faltan datos' });

    try {
        await pool.query('UPDATE usuario SET mfa_enabled = 0, mfa_secret = NULL WHERE id_usuario = ?', [userId]);
        console.log(' MFA Deshabilitado para ID:', userId);
        res.json({ success: true, message: 'MFA deshabilitado correctamente' });
    } catch (e) {
        console.error(' Error al deshabilitar MFA:', e);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ============================================
// REGISTRO
// ============================================
app.post('/api/register', async (req, res) => {
    // 'edad' no se inserta: es columna VIRTUAL generada desde fecha_nacimiento
    const { nombre, email, password_hash, fecha_nacimiento, peso, altura, genero, telefono } = req.body;
    console.log(' Registro:', { nombre, email, fecha_nacimiento });

    if (!nombre || !email || !password_hash || !fecha_nacimiento || !peso) {
        return res.status(400).json({
            success: false,
            message: 'Los campos nombre, email, password_hash, fecha_nacimiento y peso son obligatorios'
        });
    }

    try {
        // Verificar si el email ya existe
        const [existing] = await pool.query(
            'SELECT id_usuario FROM usuario WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.json({ success: false, message: 'El email ya está registrado' });
        }

        // Hashear la contraseña con bcrypt antes de guardar ($2b$ compatible con Node.js)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password_hash, salt);

        const [result] = await pool.query(
            `INSERT INTO usuario
                (nombre, email, password_hash, fecha_nacimiento, peso, altura, genero, telefono)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, email, hashedPassword, fecha_nacimiento, peso, altura ?? null, genero ?? null, telefono ?? null]
        );

        console.log(' Usuario registrado ID:', result.insertId);
        setSecureCookie(res, 'userId', String(result.insertId));
        setSecureCookie(res, 'userRol', 'usuario');
        res.json({ success: true, id: result.insertId, message: 'Registro exitoso' });

    } catch (error) {
        console.error(' Error en registro:', error);
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
                    condiciones_medicas, restricciones, rol, mfa_enabled
             FROM usuario
             WHERE id_usuario = ? AND cuenta_activa = 1`,
            [id]
        );
        if (rows.length > 0) {
            res.json({ success: true, user: rows[0] });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error(' Error al obtener perfil:', error);
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
    console.log(' Actualizar perfil ID:', id);

    try {
        const [result] = await pool.query(
            `UPDATE usuario
             SET nombre = ?, email = ?, peso = ?, altura = ?, genero = ?,
                 telefono = ?, nivel_actividad = ?, condiciones_medicas = ?, restricciones = ?
             WHERE id_usuario = ?`,
            [nombre, email, peso, altura ?? null, genero ?? null,
                telefono ?? null, nivel_actividad ?? 'sedentario',
                condiciones_medicas ?? null, restricciones ?? null, id]
        );

        if (result.affectedRows > 0) {
            console.log(' Perfil actualizado');
            res.json({ success: true, message: 'Perfil actualizado correctamente' });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error(' Error al actualizar perfil:', error);
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
        console.error(' Error al obtener videos:', error);
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
            'SELECT edad, peso FROM usuario WHERE id_usuario = ? AND cuenta_activa = 1',
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
        console.error(' Error al obtener videos para usuario:', error);
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
        console.error(' Error al registrar ejercicio:', error);
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
        console.error(' Error al obtener historial:', error);
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
        console.error(' Error al obtener evolución:', error);
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
        console.error(' Error al registrar evolución:', error);
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
        console.error(' Error al obtener reportes:', error);
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
        console.error(' Error al obtener videos:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Agregar video
app.post('/api/admin/videos', async (req, res) => {
    const { nombre_video, descripcion, categoria, subcategoria, dificultad,
        duracion_min, link_video, url_miniatura, calorias_estimadas,
        edad_minima, edad_maxima, peso_maximo_recomendado, activo } = req.body;

    if (!nombre_video || !categoria || !dificultad || duracion_min === undefined || duracion_min === null || !link_video) {
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
        res.json({ success: true, id: result.insertId, message: 'Video agregado correctamente' });
    } catch (error) {
        console.error(' Error al agregar video:', error);
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
        console.error(' Error al editar video:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Borrar video
app.delete('/api/admin/videos/:id', async (req, res) => {
    const { id } = req.params;
    console.log('  DELETE video ID:', id);
    try {
        const [result] = await pool.query('DELETE FROM videos WHERE id_video = ?', [id]);
        console.log('Filas afectadas:', result.affectedRows);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Video eliminado correctamente' });
        } else {
            res.json({ success: false, message: 'Video no encontrado' });
        }
    } catch (error) {
        console.error(' Error al borrar video:', error);
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
        console.error(' Error al obtener configuraciones:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Agregar configuración
app.post('/api/admin/config-ejercicios', async (req, res) => {
    const { edad_min, edad_max, peso_min, peso_max, nivel_dificultad,
        condiciones_especiales, categoria_recomendada,
        max_minutos_diarios, dias_semana_recomendados } = req.body;

    if (edad_min === undefined || edad_max === undefined) {
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
        console.error(' Error al agregar configuración:', error);
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
        console.error(' Error al editar configuración:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Borrar configuración
app.delete('/api/admin/config-ejercicios/:id', async (req, res) => {
    const { id } = req.params;
    console.log('  DELETE config ID:', id);
    try {
        const [result] = await pool.query('DELETE FROM configuracion_ejercicios WHERE id_config = ?', [id]);
        console.log('Filas afectadas:', result.affectedRows);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Configuración eliminada correctamente' });
        } else {
            res.json({ success: false, message: 'Configuración no encontrada' });
        }
    } catch (error) {
        console.error(' Error al borrar configuración:', error);
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
             FROM usuario
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
            `UPDATE usuario SET
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
        console.error(' Error al editar usuario:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Borrar usuario
app.delete('/api/admin/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    console.log('  DELETE usuario ID:', id);
    try {
        const [result] = await pool.query('DELETE FROM usuario WHERE id_usuario = ?', [id]);
        console.log('Filas afectadas:', result.affectedRows);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Usuario eliminado correctamente' });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error(' Error al borrar usuario:', error);
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
        console.error(' Error al listar videos (admin):', error);
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
        console.error(' Error al crear video:', error);
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
        console.error(' Error al editar video:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Eliminar video — llama al SP sp_eliminar_video
app.post('/api/admin/videos/eliminar/:id', async (req, res) => {
    const { id } = req.params;
    console.log('  sp_eliminar_video ID:', id);
    try {
        const [[result]] = await pool.query('CALL sp_eliminar_video(?)', [id]);
        console.log('   filas_afectadas:', result.filas_afectadas);
        if (result.filas_afectadas > 0) {
            res.json({ success: true, message: 'Video eliminado correctamente' });
        } else {
            res.json({ success: false, message: 'Video no encontrado' });
        }
    } catch (error) {
        console.error(' Error al eliminar video:', error);
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
        console.error(' Error al listar config:', error);
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
        console.error(' Error al crear config:', error);
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
        console.error(' Error al editar config:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Eliminar config — llama al SP sp_eliminar_config
app.post('/api/admin/config-ejercicios/eliminar/:id', async (req, res) => {
    const { id } = req.params;
    console.log('  sp_eliminar_config ID:', id);
    try {
        const [[result]] = await pool.query('CALL sp_eliminar_config(?)', [id]);
        console.log('   filas_afectadas:', result.filas_afectadas);
        if (result.filas_afectadas > 0) {
            res.json({ success: true, message: 'Configuración eliminada correctamente' });
        } else {
            res.json({ success: false, message: 'Configuración no encontrada' });
        }
    } catch (error) {
        console.error(' Error al eliminar config:', error);
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
             FROM usuario ORDER BY id_usuario ASC`
        );
        res.json({ success: true, usuarios: rows });
    } catch (error) {
        console.error(' Error al listar usuarios (admin):', error);
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
            `UPDATE usuario SET
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
        console.error(' Error al editar usuario:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Eliminar usuario — llama al SP sp_eliminar_usuario
app.post('/api/admin/usuarios/eliminar/:id', async (req, res) => {
    const { id } = req.params;
    console.log('  sp_eliminar_usuario ID:', id);
    try {
        const [[result]] = await pool.query('CALL sp_eliminar_usuario(?)', [id]);
        console.log('   filas_afectadas:', result.filas_afectadas);
        if (result.filas_afectadas > 0) {
            res.json({ success: true, message: 'Usuario eliminado correctamente' });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// INICIAR SERVIDOR (HTTPS)
// ============================================
const sslOptions = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem')
};

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
        console.log(` Servidor HTTPS corriendo en puerto ${PORT}`);
        console.log(` Local:  https://localhost:${PORT}`);
        console.log(` Red:    https://192.168.100.14:${PORT}`);
        console.log(` Login:          POST /api/login`);
        console.log(` Registro:       POST /api/register`);
        console.log(` Ejercicios:      GET /api/exercises`);
        console.log(` Ejerc. usuario:  GET /api/exercises/user/:id`);
        console.log(`  Registrar ej.:  POST /api/ejercicio-realizado`);
        console.log(` Evolución:       GET /api/evolucion/:id_usuario`);
        console.log(` Reporte:         GET /api/reporte/:id_usuario`);
    });
} else {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(` Servidor HTTP corriendo en puerto ${PORT}`);
        console.log(` Local:  http://localhost:${PORT}`);
        console.log(` Red:    http://192.168.100.14:${PORT}`);
        console.log(` Login:          POST /api/login`);
        console.log(` Registro:       POST /api/register`);
        console.log(` Ejercicios:      GET /api/exercises`);
        console.log(` Ejerc. usuario:  GET /api/exercises/user/:id`);
        console.log(`  Registrar ej.:  POST /api/ejercicio-realizado`);
        console.log(` Evolución:       GET /api/evolucion/:id_usuario`);
        console.log(` Reporte:         GET /api/reporte/:id_usuario`);
    });
}
