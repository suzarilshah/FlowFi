/**
 * Secure Data Encryption Utility
 * Provides client-side encryption for sensitive business data
 */

// Simple encryption key (in production, this should be managed server-side)
const ENCRYPTION_KEY = 'FlowFi-Secure-Key-2024-Business-Data-Protection';

/**
 * Simple encryption function for demonstration purposes
 * In production, use proper cryptographic libraries and server-side encryption
 */
export function encryptData(data: any): string {
  try {
    const jsonString = JSON.stringify(data);
    
    // Simple XOR encryption for demonstration
    let encrypted = '';
    for (let i = 0; i < jsonString.length; i++) {
      const charCode = jsonString.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      encrypted += String.fromCharCode(charCode);
    }
    
    // Convert to base64 for storage
    return btoa(encrypted);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Simple decryption function
 */
export function decryptData(encryptedData: string): any {
  try {
    // Decode from base64
    const decoded = atob(encryptedData);
    
    // Simple XOR decryption
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      decrypted += String.fromCharCode(charCode);
    }
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Secure local storage with encryption
 */
export function saveEncryptedData(key: string, data: any): void {
  try {
    const encrypted = encryptData(data);
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Failed to save encrypted data:', error);
    throw new Error('Failed to save data securely');
  }
}

/**
 * Load and decrypt data from local storage
 */
export function loadEncryptedData(key: string): any {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) {
      return null;
    }
    return decryptData(encrypted);
  } catch (error) {
    console.error('Failed to load encrypted data:', error);
    return null;
  }
}

/**
 * Clear encrypted data from local storage
 */
export function clearEncryptedData(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear encrypted data:', error);
  }
}

/**
 * Generate secure hash for data integrity
 */
export function generateDataHash(data: any): string {
  try {
    const jsonString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  } catch (error) {
    console.error('Failed to generate hash:', error);
    return '';
  }
}

/**
 * Validate data integrity using hash
 */
export function validateDataIntegrity(data: any, expectedHash: string): boolean {
  try {
    const actualHash = generateDataHash(data);
    return actualHash === expectedHash;
  } catch (error) {
    console.error('Failed to validate data integrity:', error);
    return false;
  }
}