const mysql = require('mysql2/promise');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
require('dotenv').config();

// Cambio este correo por el del usuario con el que hacemos la prueba 
const EMAIL_A_PROBAR = 'admin@vitalapp.com';

async function setupMFA() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'vitalapp_db'
        });

        console.log(`Buscando usuario con email: ${EMAIL_A_PROBAR}...`);
        const [rows] = await connection.query('SELECT id_usuario FROM usuario WHERE email = ?', [EMAIL_A_PROBAR]);

        if (rows.length === 0) {
            console.log(' Usuario no encontrado. Por favor, edita este script y pon un correo que exista en tu BD.');
            process.exit(1);
        }

        const userId = rows[0].id_usuario;

        // 1. Generar secreto
        const secret = speakeasy.generateSecret({ name: `VitalApp (${EMAIL_A_PROBAR})` });

        // 2. Guardar en Base de Datos y habilitar MFA
        await connection.query(
            'UPDATE usuario SET mfa_secret = ?, mfa_enabled = 1 WHERE id_usuario = ?',
            [secret.base32, userId]
        );

        console.log('\n MFA Habilitado con éxito en la base de datos para este usuario.');
        console.log(' Tu código secreto manual es:', secret.base32);

        // 3. Generar Código QR en la terminal
        QRCode.toString(secret.otpauth_url, { type: 'terminal' }, function (err, url) {
            console.log('\n PASOS PARA LA DEMOSTRACIÓN:');
            console.log('1. Escanea este código QR con Google Authenticator o Microsoft Authenticator desde tu celular.');
            console.log(url);
            console.log('2. Ve a tu aplicación VitalApp, intenta iniciar sesión con este correo y su contraseña.');
            console.log('3. La aplicación te pedirá el código de 6 dígitos que aparece en tu Authenticator.');
            process.exit(0);
        });

    } catch (error) {
        console.error(' Error:', error.message);
        process.exit(1);
    }
}

setupMFA();
