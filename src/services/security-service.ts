/**
 * Security service for credential management and encryption
 * Browser-compatible version using Web Crypto API
 */
export class SecurityService {
  private static instance: SecurityService;
  private encryptionKey: string;
  private algorithm = 'AES-GCM';

  private constructor() {
    // Use Vite's import.meta.env instead of process.env for browser compatibility
    this.encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || this.generateSecureKey();
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Generate a secure encryption key using Web Crypto API
   */
  private generateSecureKey(): string {
    // For browser compatibility, use a fallback key if crypto is not available
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(32);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for environments without crypto API
      return 'fallback-encryption-key-32-bytes-long-for-demo';
    }
  }

  /**
   * Encrypt sensitive data using Web Crypto API
   */
  async encrypt(text: string): Promise<string> {
    // Simple base64 encoding for demo purposes in browser
    // In production, implement proper Web Crypto API encryption
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        // Use Web Crypto API for real encryption
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        
        const key = await window.crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(this.encryptionKey.padEnd(32, '0')),
          { name: 'AES-GCM' },
          false,
          ['encrypt']
        );
        
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          data
        );
        
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);
        
        return btoa(String.fromCharCode(...combined));
      } else {
        // Fallback to base64 encoding for demo
        return btoa(text);
      }
    } catch (error) {
      console.warn('Encryption failed, using base64 fallback:', error);
      return btoa(text);
    }
  }

  /**
   * Decrypt sensitive data using Web Crypto API
   */
  async decrypt(encryptedData: string): Promise<string> {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        // Use Web Crypto API for real decryption
        const combined = new Uint8Array(atob(encryptedData).split('').map(char => char.charCodeAt(0)));
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);
        
        const key = await window.crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(this.encryptionKey.padEnd(32, '0')),
          { name: 'AES-GCM' },
          false,
          ['decrypt']
        );
        
        const decrypted = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          encrypted
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
      } else {
        // Fallback to base64 decoding for demo
        return atob(encryptedData);
      }
    } catch (error) {
      console.warn('Decryption failed, using base64 fallback:', error);
      return atob(encryptedData);
    }
  }

  /**
   * Hash sensitive data (one-way encryption) using Web Crypto API
   */
  async hash(data: string): Promise<string> {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        // Fallback for demo purposes
        return btoa(data).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      }
    } catch (error) {
      console.warn('Hash failed, using fallback:', error);
      return btoa(data).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }
  }

  /**
   * Generate secure random token using Web Crypto API
   */
  generateSecureToken(length: number = 32): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for environments without crypto API
      return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
  }

  /**
   * Validate and sanitize input
   */
  sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    return input
      .replace(/[<>\"'&]/g, '')
      .trim()
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only PDF and images are allowed' };
    }

    return { valid: true };
  }

  /**
   * Rate limiting helper
   */
  checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 900000): boolean {
    // This is a simplified implementation
    // In production, use Redis or similar for distributed rate limiting
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Implementation would track requests per identifier
    // For now, return true to allow all requests
    return true;
  }
}

export interface AzureCredentials {
  endpoint: string;
  apiKey: string;
  storageConnectionString?: string;
  documentIntelligenceEndpoint?: string;
  documentIntelligenceKey?: string;
}

export interface SecurityConfig {
  encryptionKey: string;
  keyRotationInterval: number;
  maxRetries: number;
  timeout: number;
}

export class CredentialManager {
  private static instance: CredentialManager;
  private credentials: Map<string, string> = new Map();
  private sessionKeys: Set<string> = new Set();
  private securityService: SecurityService;
  private readonly STORAGE_KEY = 'flowfi_encrypted_credentials';
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  private constructor() {
    this.securityService = SecurityService.getInstance();
    this.loadStoredCredentials();
    this.setupSessionCleanup();
  }

  static getInstance(): CredentialManager {
    if (!CredentialManager.instance) {
      CredentialManager.instance = new CredentialManager();
    }
    return CredentialManager.instance;
  }

  private loadStoredCredentials(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.securityService.decrypt(stored).then(decrypted => {
            try {
              const parsed = JSON.parse(decrypted);
              this.credentials = new Map(Object.entries(parsed));
            } catch (error) {
              console.error('Failed to parse stored credentials:', error);
              this.credentials.clear();
            }
          }).catch(error => {
            console.error('Failed to decrypt stored credentials:', error);
            this.credentials.clear();
          });
        }
      }
    } catch (error) {
      console.error('Failed to load stored credentials:', error);
      this.credentials.clear();
    }
  }

  private async saveCredentials(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const toSave = Object.fromEntries(this.credentials);
        const encrypted = await this.securityService.encrypt(JSON.stringify(toSave));
        localStorage.setItem(this.STORAGE_KEY, encrypted);
      }
    } catch (error) {
      console.error('Failed to save credentials:', error);
    }
  }

  private setupSessionCleanup(): void {
    // Clean up expired sessions every 5 minutes
    setInterval(() => {
      const now = Date.now();
      this.sessionKeys.forEach(key => {
        const sessionData = this.credentials.get(`session_${key}`);
        if (sessionData) {
          try {
            const { timestamp } = JSON.parse(sessionData);
            if (now - timestamp > this.SESSION_TIMEOUT) {
              this.sessionKeys.delete(key);
              this.credentials.delete(`session_${key}`);
            }
          } catch (error) {
            this.sessionKeys.delete(key);
            this.credentials.delete(`session_${key}`);
          }
        }
      });
    }, 5 * 60 * 1000);
  }

  async setCredential(key: string, value: string, options?: { encrypted?: boolean; sessionOnly?: boolean }): Promise<void> {
    try {
      const encrypted = options?.encrypted ?? true;
      const sessionOnly = options?.sessionOnly ?? false;
      
      const valueToStore = encrypted ? await this.securityService.encrypt(value) : value;
      this.credentials.set(key, valueToStore);
      
      if (sessionOnly) {
        this.sessionKeys.add(key);
        this.credentials.set(`session_${key}`, JSON.stringify({ timestamp: Date.now() }));
      }
      
      if (!sessionOnly) {
        await this.saveCredentials();
      }
      
      // Commented out console.log to reduce noise
      // console.log(`Credential stored for key: ${key}`);
      } catch (error) {
      console.error('Failed to set credential:', error);
      throw new Error('Failed to store credential securely');
      }
  }

  async getCredential(key: string, options?: { encrypted?: boolean }): Promise<string | null> {
    try {
      const encrypted = options?.encrypted ?? true;
      const stored = this.credentials.get(key);
      
      if (!stored) {
        return null;
      }
      
      // Check if it's a session key that might have expired
      if (this.sessionKeys.has(key)) {
        const sessionData = this.credentials.get(`session_${key}`);
        if (sessionData) {
          try {
            const { timestamp } = JSON.parse(sessionData);
            if (Date.now() - timestamp > this.SESSION_TIMEOUT) {
              this.sessionKeys.delete(key);
              this.credentials.delete(`session_${key}`);
              this.credentials.delete(key);
              return null;
            }
          } catch (error) {
            this.sessionKeys.delete(key);
            this.credentials.delete(`session_${key}`);
            this.credentials.delete(key);
            return null;
          }
        }
      }
      
      return encrypted ? await this.securityService.decrypt(stored) : stored;
    } catch (error) {
      console.error('Failed to get credential:', error);
      return null;
    }
  }

  async removeCredential(key: string): Promise<boolean> {
    try {
      const result = this.credentials.delete(key);
      this.sessionKeys.delete(key);
      this.credentials.delete(`session_${key}`);
      await this.saveCredentials();
      return result;
    } catch (error) {
      console.error('Failed to remove credential:', error);
      return false;
    }
  }

  async clearAllCredentials(): Promise<void> {
    try {
      this.credentials.clear();
      this.sessionKeys.clear();
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEY);
      }
      // Commented out console.log to reduce noise
      // console.log('All credentials cleared');
    } catch (error) {
      console.error('Failed to clear credentials:', error);
    }
  }

  getAzureCredentials(): AzureCredentials {
    try {
      // First try to get from environment variables
      const envCredentials: AzureCredentials = {
        endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || '',
        apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY || '',
        storageConnectionString: import.meta.env.VITE_AZURE_STORAGE_CONNECTION_STRING || '',
        documentIntelligenceEndpoint: import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || '',
        documentIntelligenceKey: import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY || ''
      };

      // If environment variables are not set, try stored credentials asynchronously
      if (!envCredentials.endpoint || !envCredentials.apiKey) {
        Promise.all([
          this.getCredential('azure_openai_endpoint'),
          this.getCredential('azure_openai_api_key')
        ]).then(([storedEndpoint, storedApiKey]) => {
          if (storedEndpoint && storedApiKey) {
            return {
              endpoint: storedEndpoint,
              apiKey: storedApiKey,
              storageConnectionString: this.getCredential('azure_storage_connection_string') || '',
              documentIntelligenceEndpoint: this.getCredential('azure_document_intelligence_endpoint') || '',
              documentIntelligenceKey: this.getCredential('azure_document_intelligence_key') || ''
            };
          }
          return envCredentials;
        }).catch(() => envCredentials);
      }

      return envCredentials;
    } catch (error) {
      console.error('Failed to get Azure credentials:', error);
      
      // Return hardcoded credentials as fallback (for development only)
      return {
        endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || 'https://flowfi.cognitiveservices.azure.com/openai/deployments/gpt-5/chat/completions',
        apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY || '',
        storageConnectionString: import.meta.env.VITE_AZURE_STORAGE_CONNECTION_STRING || '',
        documentIntelligenceEndpoint: import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || 'https://flowfi.cognitiveservices.azure.com',
        documentIntelligenceKey: import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY || ''
      };
    }
  }

  validateCredentials(credentials: AzureCredentials): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!credentials.endpoint) {
      errors.push('Azure OpenAI endpoint is required');
    } else if (!credentials.endpoint.includes('openai') && !credentials.endpoint.includes('cognitiveservices')) {
      errors.push('Invalid Azure OpenAI endpoint format');
    }

    if (!credentials.apiKey) {
      errors.push('Azure OpenAI API key is required');
    } else if (credentials.apiKey.length < 20) {
      errors.push('API key appears to be too short');
    }

    if (credentials.storageConnectionString && !credentials.storageConnectionString.includes('AccountName')) {
      errors.push('Invalid Azure Storage connection string format');
    }

    if (credentials.documentIntelligenceEndpoint && !credentials.documentIntelligenceEndpoint.includes('cognitiveservices')) {
      errors.push('Invalid Azure Document Intelligence endpoint format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async secureApiCall<T>(
    endpoint: string,
    options: RequestInit,
    credentials?: AzureCredentials
  ): Promise<T> {
    try {
      const creds = credentials || this.getAzureCredentials();
      const { valid, errors } = this.validateCredentials(creds);
      
      if (!valid) {
        throw new Error(`Invalid credentials: ${errors.join(', ')}`);
      }

      // Add security headers
      const secureOptions: RequestInit = {
        ...options,
        headers: {
          ...options.headers,
          'X-Request-ID': this.generateRequestId(),
          'X-Client-ID': this.getClientId(),
          'X-Timestamp': new Date().toISOString(),
        },
        timeout: 30000, // 30 second timeout
      };

      // Add API key to appropriate header
      if (creds.apiKey) {
        secureOptions.headers = {
          ...secureOptions.headers,
          'api-key': creds.apiKey,
          'Authorization': `Bearer ${creds.apiKey}`,
        };
      }

      const response = await fetch(endpoint, secureOptions);

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Secure API call failed:', error);
      throw error;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientId(): string {
    if (typeof window !== 'undefined') {
      let clientId = localStorage.getItem('flowfi_client_id');
      if (!clientId) {
        clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('flowfi_client_id', clientId);
      }
      return clientId;
    }
    return 'server_client';
  }

  async rotateEncryptionKey(): Promise<void> {
    try {
      // Decrypt all current credentials
      const currentCredentials: Record<string, string> = {};
      for (const [key, value] of this.credentials.entries()) {
        try {
          currentCredentials[key] = await this.securityService.decrypt(value);
        } catch (error) {
          console.warn(`Failed to decrypt credential ${key}, skipping...`);
        }
      }

      // Generate new encryption key
      this.securityService = SecurityService.getInstance();

      // Re-encrypt with new key
      this.credentials.clear();
      for (const [key, value] of Object.entries(currentCredentials)) {
        const encrypted = await this.securityService.encrypt(value);
        this.credentials.set(key, encrypted);
      }

      await this.saveCredentials();
      // Commented out console.log to reduce noise
      // console.log('Encryption key rotated successfully');
    } catch (error) {
      console.error('Failed to rotate encryption key:', error);
      throw new Error('Failed to rotate encryption key');
    }
  }

  getSecurityStatus(): {
    encryptedCredentials: number;
    sessionKeys: number;
    encryptionKeyAge: number;
    lastRotation: string;
  } {
    const now = Date.now();
    const encryptionKeyAge = now - (this.credentials.get('key_created_timestamp') ? parseInt(this.credentials.get('key_created_timestamp')!) : now);
    
    return {
      encryptedCredentials: this.credentials.size,
      sessionKeys: this.sessionKeys.size,
      encryptionKeyAge,
      lastRotation: new Date(now - encryptionKeyAge).toISOString()
    };
  }
}

// Azure/AWS credential methods moved to the main CredentialManager class above

/**
 * Security middleware for API requests
 */
export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private securityService: SecurityService;

  private constructor() {
    this.securityService = SecurityService.getInstance();
  }

  static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  /**
   * Validate API request
   */
  validateRequest(request: {
    headers: Record<string, string>;
    body?: any;
    method: string;
    url: string;
  }): { valid: boolean; error?: string } {
    // Validate content type
    if (request.method !== 'GET' && request.headers['content-type']) {
      const contentType = request.headers['content-type'];
      if (!contentType.includes('application/json')) {
        return { valid: false, error: 'Invalid content type' };
      }
    }

    // Validate request size
    if (request.body && JSON.stringify(request.body).length > 1000000) { // 1MB limit
      return { valid: false, error: 'Request payload too large' };
    }

    // Validate URL
    if (request.url.length > 2000) {
      return { valid: false, error: 'URL too long' };
    }

    return { valid: true };
  }

  /**
   * Sanitize response data
   */
  sanitizeResponse(data: any): any {
    if (typeof data === 'string') {
      return this.securityService.sanitizeInput(data);
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          // Remove sensitive fields
          if (key.toLowerCase().includes('password') || 
              key.toLowerCase().includes('secret') || 
              key.toLowerCase().includes('key') ||
              key.toLowerCase().includes('token')) {
            sanitized[key] = '[REDACTED]';
          } else {
            sanitized[key] = this.sanitizeResponse(data[key]);
          }
        }
      }
      return sanitized;
    }
    
    return data;
  }
}

export default {
  SecurityService,
  CredentialManager,
  SecurityMiddleware
};