const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

// 32-byte key for AES-256
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY 
    ? Buffer.from(process.env.DB_ENCRYPTION_KEY, 'hex') 
    : crypto.createHash('sha256').update('vitalapp_fallback_secure_key_123!').digest();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts text using AES-256-GCM
 * @param {string} text Plaintext to encrypt
 * @returns {string|null} Format: iv:authTag:encryptedText (all in hex), or null if text is falsy
 */
function encryptText(text) {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag().toString('hex');
        
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
        console.error('Encryption Error:', error);
        return text; // Fallback to raw text if error occurs
    }
}

/**
 * Decrypts text using AES-256-GCM
 * @param {string} encryptedData Format: iv:authTag:encryptedText
 * @returns {string} Plaintext, or original text if decryption fails (e.g. legacy plaintext data)
 */
function decryptText(encryptedData) {
    if (!encryptedData || typeof encryptedData !== 'string') return encryptedData;
    
    const parts = encryptedData.split(':');
    // If it doesn't match our exact 3-part encrypted format, it's likely legacy plaintext.
    if (parts.length !== 3) return encryptedData;

    try {
        const [ivHex, authTagHex, encryptedHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        
        if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
            return encryptedData; // Not our encrypted format
        }

        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        // console.error('Decryption Error (fallback to plaintext):', error.message);
        return encryptedData; // Safely return raw text if it was legacy data or corrupted
    }
}

module.exports = {
    encryptText,
    decryptText
};
