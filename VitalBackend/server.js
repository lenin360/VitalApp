const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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
    const { email, password } = req.body;
    console.log('📝 Login intent:', email);
    
    try {
        // En la nueva base: tabla 'usuario', columna 'id_usuario' y 'password_hash'
        const [rows] = await pool.query(
            'SELECT id_usuario as id, nombre, email, edad, rol, password_hash, peso, genero FROM usuario WHERE email = ? AND cuenta_activa = 1',
            [email]
        );
        
        if (rows.length > 0) {
            const user = rows[0];
            
            // Comparar contraseña con el hash
            const isMatch = await bcrypt.compare(password, user.password_hash);
            
            if (isMatch) {
                // Quitamos el hash antes de enviar al frontend
                delete user.password_hash;
                console.log('[INFO] Login exitoso:', user.nombre);
                res.json({ success: true, user });
            } else {
                res.json({ success: false, message: 'Contraseña incorrecta' });
            }
        } else {
            res.json({ success: false, message: 'Correo no encontrado o cuenta inactiva' });
        }
    } catch (error) {
        console.error('[ERROR] Error en Login:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ============================================
// REGISTRO
// ============================================
app.post('/api/register', async (req, res) => {
    // Nota: La nueva base exige fecha_nacimiento y peso
    const { nombre, email, password, fecha_nacimiento, peso, genero } = req.body;
    
    if (!nombre || !email || !password || !fecha_nacimiento || !peso) {
        return res.status(400).json({ 
            success: false, 
            message: 'Nombre, email, contraseña, fecha de nacimiento y peso son obligatorios' 
        });
    }
    
    try {
        const [existing] = await pool.query('SELECT id_usuario FROM usuario WHERE email = ?', [email]);
        
        if (existing.length > 0) {
            return res.json({ success: false, message: 'El email ya está registrado' });
        }
        
        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        // Insertar en la tabla 'usuario'
        const [result] = await pool.query(
            'INSERT INTO usuario (nombre, email, password_hash, fecha_nacimiento, peso, genero, rol, cuenta_activa) VALUES (?, ?, ?, ?, ?, ?, "usuario", 1)',
            [nombre, email, password_hash, fecha_nacimiento, peso, genero || 'Otro']
        );
        
        console.log('[INFO] Nuevo usuario registrado ID:', result.insertId);
        res.json({ success: true, id: result.insertId, message: 'Registro exitoso' });
        
    } catch (error) {
        console.error('[ERROR] Error en Registro:', error);
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
            'SELECT id_usuario as id, nombre, email, edad, rol, peso, altura, genero, telefono, nivel_actividad, condiciones_medicas FROM usuario WHERE id_usuario = ?',
            [id]
        );
        if (rows.length > 0) {
            res.json({ success: true, user: rows[0] });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ============================================
// ACTUALIZAR PERFIL DE USUARIO
// ============================================
app.put('/api/user/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email, peso, altura, telefono, nivel_actividad } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE usuario SET nombre = ?, email = ?, peso = ?, altura = ?, telefono = ?, nivel_actividad = ? WHERE id_usuario = ?',
            [nombre, email, peso, altura, telefono, nivel_actividad, id]
        );

        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Perfil actualizado correctamente' });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('[ERROR] Error al actualizar:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// EJERCICIOS (Mapeado a la tabla 'videos')
// ============================================
app.get('/api/exercises', async (req, res) => {
  try {
    // Mapeamos los nombres de la tabla 'videos' a lo que el frontend espera
    const [rows] = await pool.query(`
      SELECT 
        id_video as id, 
        nombre_video as nombre, 
        descripcion, 
        categoria, 
        subcategoria,
        dificultad,
        (duracion_min * 60) as duracion,
        link_video as url, 
        url_miniatura as thumbnail,
        calorias_estimadas as calorias
      FROM videos 
      WHERE activo = 1
    `);
    res.json({ exercises: rows });
  } catch (error) {
    console.error('Error al obtener ejercicios:', error);
    res.status(500).json({ error: 'Error al obtener ejercicios' });
  }
});

// ============================================
// CONSEJOS (Si la tabla no existe en la base nueva, devolvemos uno genérico)
// ============================================
app.get('/api/tips', async (req, res) => {
  try {
    // La nueva base no parece tener tabla de consejos, así que usamos datos estáticos por ahora
    const tips = [
      'Mantente hidratado durante todo el día.',
      'Realiza estiramientos suaves al despertar.',
      'Camina al menos 15 minutos diarios.',
      'Consume frutas y verduras de temporada.'
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    res.json({ tip });
  } catch (error) {
    res.json({ tip: 'Mantente activo y saludable' });
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[INFO] Servidor actualizado corriendo en puerto ${PORT}`);
});