import { CredentialManager } from '../services/security-service';
import { AzureConfig } from '../types/azure';

// Azure configuration with secure credential management
class SecureAzureConfig {
  private credentialManager = CredentialManager.getInstance();

  get documentIntelligence() {
    try {
      const credentials = this.credentialManager.getAzureCredentials();
      if (!credentials.apiKey) {
        console.warn('[Azure Config] Document Intelligence API key is missing; proceeding with placeholder config. Features depending on this service may be disabled until configured.');
      }
      return {
        endpoint: credentials.endpoint || 'https://flowfi.cognitiveservices.azure.com',
        apiKey: credentials.apiKey || '',
        region: credentials.region || 'eastus',
        modelId: 'prebuilt-invoice'
      };
    } catch (error) {
      // Fallback to environment variables if credential manager fails
      const apiKey = import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY;
      if (!apiKey) {
        console.warn('[Azure Config] Document Intelligence API key not found in env; proceeding with placeholder config.');
      }
      return {
        endpoint: 'https://flowfi.cognitiveservices.azure.com',
        apiKey: apiKey || '',
        region: 'eastus',
        modelId: 'prebuilt-invoice'
      };
    }
  }

  get storage() {
    const connectionString = import.meta.env.VITE_AZURE_STORAGE_CONNECTION_STRING;
    const accountName = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT_NAME;
    const containerName = import.meta.env.VITE_AZURE_STORAGE_CONTAINER_NAME;

    return {
      connectionString: connectionString || 'DefaultEndpointsProtocol=https;AccountName=flowfistorage;AccountKey=your_storage_key_here;EndpointSuffix=core.windows.net',
      accountName: accountName || 'flowfistorage',
      containerName: containerName || 'flowfi-invoices'
    };
  }

  get functions() {
    const appName = import.meta.env.VITE_AZURE_FUNCTION_APP_NAME;
    const functionKey = import.meta.env.VITE_AZURE_FUNCTION_KEY;

    return {
      appName: appName || 'flowfi-functions',
      functionKey: functionKey || 'your_function_key_here'
    };
  }

  get security() {
    return {
      encryptionKey: import.meta.env.VITE_ENCRYPTION_KEY,
      jwtSecret: import.meta.env.VITE_JWT_SECRET,
      apiKey: import.meta.env.VITE_API_KEY,
      enableEncryption: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      rateLimitWindowMs: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW_MS || '900000'),
      rateLimitMaxRequests: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_REQUESTS || '100')
    };
  }

  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      this.credentialManager.getAzureCredentials();
    } catch (error) {
      errors.push('Azure Document Intelligence credentials are not properly configured');
    }

    if (!import.meta.env.VITE_AZURE_STORAGE_CONNECTION_STRING) {
      errors.push('Azure Storage connection string is not configured');
    }

    if (!import.meta.env.VITE_ENCRYPTION_KEY) {
      errors.push('Encryption key is not configured for secure data handling');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

const secureAzureConfig = new SecureAzureConfig();

export const azureDocumentIntelligenceConfig = {
  endpoint: import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || '',
  apiKey: import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY || '',
  region: import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_REGION || 'eastus'
};

export const azureStorageConfig = {
  connectionString: import.meta.env.VITE_AZURE_STORAGE_CONNECTION_STRING || '',
  accountName: import.meta.env.VITE_AZURE_STORAGE_ACCOUNT_NAME || '',
  containerName: import.meta.env.VITE_AZURE_STORAGE_CONTAINER_NAME || 'documents'
};

export const azureConfig: AzureConfig = {
  documentIntelligence: azureDocumentIntelligenceConfig,
  storage: azureStorageConfig
};
export const azureFunctionConfig = secureAzureConfig.functions;
export const securityConfig = secureAzureConfig.security;
export const validateAzureConfiguration = () => secureAzureConfig.validateConfiguration();

export default secureAzureConfig;