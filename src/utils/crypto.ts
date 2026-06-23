import CryptoJS from 'crypto-js';

// Secure salt key for local encryption
const ENCRYPTION_KEY = 'passport-secure-salt-2026';

/**
 * Encrypts data (object, array, or string) to a secure AES cipher.
 */
export function encryptData(data: any): string {
  try {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(stringData, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return typeof data === 'string' ? data : JSON.stringify(data);
  }
}

/**
 * Decrypts a secure AES cipher back to its original object, array, or string.
 * Supports transparent fallback to standard JSON parsing for backwards compatibility with unencrypted legacy data.
 */
export function decryptData(encryptedString: string | null): any {
  if (!encryptedString || encryptedString.trim() === '') return null;
  try {
    // Attempt AES decryption
    const bytes = CryptoJS.AES.decrypt(encryptedString, ENCRYPTION_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      // If decryption yields empty string, it might be unencrypted legacy JSON
      try {
        return JSON.parse(encryptedString);
      } catch {
        return encryptedString;
      }
    }

    try {
      return JSON.parse(decryptedText);
    } catch {
      return decryptedText;
    }
  } catch (error) {
    // Fallback: If ciphertext decryption fails, try parsing it as unencrypted legacy data
    try {
      return JSON.parse(encryptedString);
    } catch {
      return encryptedString;
    }
  }
}
