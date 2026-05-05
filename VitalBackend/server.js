const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
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
    console.log('📝 Login - Email:', email);
    
    try {
        const [rows] = await pool.query(
            'SELECT id, nombre, email, edad, puntos FROM usuarios WHERE email = ? AND password = ?',
            [email, password]
        );
        
        if (rows.length > 0) {
            res.json({ success: true, user: rows[0] });
        } else {
            res.json({ success: false, message: 'Correo o contraseña incorrectos' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ============================================
// REGISTRO
// ============================================
app.post('/api/register', async (req, res) => {
    const { nombre, email, password, edad } = req.body;
    console.log('📝 Registro:', { nombre, email, edad });
    
    if (!nombre || !email || !password || !edad) {
        return res.status(400).json({ 
            success: false, 
            message: 'Todos los campos son obligatorios' 
        });
    }
    
    try {
        const [existing] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        
        if (existing.length > 0) {
            return res.json({ success: false, message: 'El email ya está registrado' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, edad, puntos) VALUES (?, ?, ?, ?, 0)',
            [nombre, email, password, edad]
        );
        
        console.log('[INFO] Usuario registrado ID:', result.insertId);
        res.json({ success: true, id: result.insertId, message: 'Registro exitoso' });
        
    } catch (error) {
        console.error('[ERROR] Error:', error);
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
            'SELECT id, nombre, email, edad, puntos FROM usuarios WHERE id = ?',
            [id]
        );
        if (rows.length > 0) {
            res.json({ success: true, user: rows[0] });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ============================================
// ACTUALIZAR PERFIL DE USUARIO
// ============================================
app.put('/api/user/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email, edad } = req.body;
    console.log('📝 Actualizar perfil ID:', id, { nombre, email, edad });

    try {
        const [result] = await pool.query(
            'UPDATE usuarios SET nombre = ?, email = ?, edad = ? WHERE id = ?',
            [nombre, email, edad, id]
        );

        if (result.affectedRows > 0) {
            console.log('[INFO] Perfil actualizado');
            res.json({ success: true, message: 'Perfil actualizado correctamente' });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('[ERROR] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// EJERCICIOS
// ============================================
app.get('/api/exercises', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ejercicios WHERE activo = 1');
    res.json({ exercises: rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener ejercicios' });
  }
});

// ============================================
// CONSEJOS
// ============================================
app.get('/api/tips', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT mensaje as tip FROM consejos WHERE activo = 1 ORDER BY RAND() LIMIT 1');
    const tip = rows[0]?.tip || 'Mantente hidratado';
    res.json({ tip });
  } catch (error) {
    res.json({ tip: 'Mantente hidratado' });
  }
});

// ============================================
// INICIAR SERVIDOR (ESCUCHA EN TODAS LAS INTERFACES)
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[INFO] Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📍 Red: http://192.168.100.14:${PORT}`);
  console.log(`🔐 Login: POST /api/login`);
  console.log(`📝 Registro: POST /api/register`);
  console.log(`📋 Ejercicios: GET /api/exercises`);
});