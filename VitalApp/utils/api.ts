/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║         VitalApp — fetchSeguro con HMAC SHA-256                  ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  Envuelve el fetch nativo para añadir automáticamente la         ║
 * ║  cabecera X-Signature (HMAC-SHA256) a todas las peticiones       ║
 * ║  POST, PUT y DELETE, garantizando la integridad de los datos.    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

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

    if (necesitaFirma) {
        const cuerpo = options.body as string || '{}';
        try {
            const firma = await hmacSha256(HMAC_SECRET, cuerpo);
            headers['X-Signature'] = firma;
        } catch (e) {
            console.warn('⚠️ No se pudo calcular firma HMAC:', e);
        }
    }

    return fetch(url, {
        ...options,
        credentials: 'include', // Envía y recibe cookies en peticiones cross-origin
        headers,
    });
}
