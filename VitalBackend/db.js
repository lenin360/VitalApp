const mysql = require('mysql2');
require('dotenv').config();

// Crear pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vitalapp',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convertir a promesas para usar async/await
const promisePool = pool.promise();

// Probar conexión
const testConnection = async () => {
    try {
        const [rows] = await promisePool.query('SELECT 1');
        console.log('✅ Conectado a MySQL correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión a MySQL:', error.message);
        return false;
    }
};

module.exports = { pool: promisePool, testConnection };