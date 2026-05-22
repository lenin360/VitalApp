/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║         VitalApp — fetchSeguro con HMAC SHA-256                  ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  Envuelve el fetch nativo para añadir automáticamente la         ║
 * ║  cabecera X-Signature (HMAC-SHA256) a todas las peticiones       ║
 * ║  POST, PUT y DELETE, garantizando la integridad de los datos.    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clave compartida con el backend (debe coincidir con HMAC_SECRET en .env)
const HMAC_SECRET = 'VitalApp_HMAC_K3y_S3cur@2024!xZ9qPm';

// ── Implementación pura de HMAC-SHA256 (sin librerías externas) ──────────────
// Usa la Web Crypto API disponible en React Native >= 0.74 y todos los navegadores modernos

async function hmacSha256(secret: string, message: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── fetchSeguro ────────────────────────────────────────────────────────────────
/**
 * Reemplazo de fetch() que agrega automáticamente el header X-Signature
 * en métodos POST, PUT y DELETE para garantizar la integridad del payload.
 *
 * Uso idéntico al fetch nativo:
 *   const res = await fetchSeguro(`${API_URL}/login`, { method: 'POST', body: JSON.stringify({...}) });
 */
export async function fetchSeguro(url: string, options: RequestInit = {}): Promise<Response> {
    const metodo = (options.method || 'GET').toUpperCase();
    const necesitaFirma = ['POST', 'PUT', 'DELETE'].includes(metodo);

    let headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    // 1. Inyectar JWT
    try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    } catch (e) {}

    // 2. CSRF & HMAC
    if (necesitaFirma) {
        // CSRF Token Check
        try {
            let csrf = await AsyncStorage.getItem('csrfToken');
            if (!csrf) {
                const baseUrl = url.substring(0, url.indexOf('/api')) + '/api';
                const csrfRes = await fetch(`${baseUrl}/csrf-token`);
                const csrfData = await csrfRes.json();
                if (csrfData.success) {
                    csrf = csrfData.csrfToken;
                    await AsyncStorage.setItem('csrfToken', csrf!);
                }
            }
            if (csrf) {
                headers['X-CSRF-Token'] = csrf;
            }
        } catch (e) {
            console.warn('⚠️ No se pudo obtener CSRF Token:', e);
        }

        const cuerpo = options.body as string || '{}';
        try {
            const firma = await hmacSha256(HMAC_SECRET, cuerpo);
            headers['X-Signature'] = firma;
        } catch (e) {
            console.warn('⚠️ No se pudo calcular firma HMAC:', e);
        }
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });
    
    // Si da error de CSRF (403), lo limpiamos para forzar su renovación
    if (response.status === 403) {
        try {
            const clone = response.clone();
            const data = await clone.json();
            if (data.message && data.message.includes('CSRF')) {
                await AsyncStorage.removeItem('csrfToken');
            }
        } catch (e) {}
    }
    
    return response;
}
