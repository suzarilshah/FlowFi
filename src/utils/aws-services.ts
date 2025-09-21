import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// AWS Configuration
const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1';
const DOCUMENTS_BUCKET = import.meta.env.VITE_DOCUMENTS_BUCKET || 'flowfi-documents-dev';
const BACKUPS_BUCKET = import.meta.env.VITE_BACKUPS_BUCKET || 'flowfi-backups-dev';
const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'https://api.flowfi.com/dev';

// Initialize S3 client (for client-side operations)
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  },
});

// Types
export interface DocumentUploadResult {
  success: boolean;
  documentId?: string;
  uploadUrl?: string;
  error?: string;
}

export interface DocumentProcessingResult {
  success: boolean;
  documentId: string;
  extractedData?: {
    amount?: number;
    date?: string;
    vendor?: string;
    category?: string;
    description?: string;
    confidence?: number;
  };
  error?: string;
}

export interface ReportGenerationResult {
  success: boolean;
  reportId?: string;
  downloadUrl?: string;
  error?: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Document Upload Service
export class DocumentUploadService {
  static async uploadDocument(file: File, userId: string): Promise<DocumentUploadResult> {
    try {
      const documentId = `${userId}/${Date.now()}-${file.name}`;
      const key = `documents/${documentId}`;

      // Create presigned URL for upload
      const command = new PutObjectCommand({
        Bucket: DOCUMENTS_BUCKET,
        Key: key,
        ContentType: file.type,
        Metadata: {
          userId: userId,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      // Upload file using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      return {
        success: true,
        documentId: documentId,
        uploadUrl: uploadUrl,
      };
    } catch (error) {
      console.error('Document upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  static async getDocumentUrl(documentId: string): Promise<string | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: DOCUMENTS_BUCKET,
        Key: `documents/${documentId}`,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return url;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  }

  static async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: DOCUMENTS_BUCKET,
        Key: `documents/${documentId}`,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }
}

// Document Processing Service
export class DocumentProcessingService {
  static async processDocument(documentId: string): Promise<DocumentProcessingResult> {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/process-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: documentId,
          bucket: DOCUMENTS_BUCKET,
        }),
      });

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        documentId: documentId,
        extractedData: result.extractedData,
      };
    } catch (error) {
      console.error('Document processing error:', error);
      return {
        success: false,
        documentId: documentId,
        error: error instanceof Error ? error.message : 'Processing failed',
      };
    }
  }

  static async getProcessingStatus(documentId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    result?: any;
  }> {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/processing-status/${documentId}`);
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking processing status:', error);
      return { status: 'failed' };
    }
  }
}

// AI Categorization Service
export class AICategorizeService {
  static async categorizeExpense(data: {
    description: string;
    amount: number;
    vendor?: string;
    date?: string;
  }): Promise<{
    success: boolean;
    category?: string;
    confidence?: number;
    suggestions?: string[];
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/categorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Categorization failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        category: result.category,
        confidence: result.confidence,
        suggestions: result.suggestions,
      };
    } catch (error) {
      console.error('AI categorization error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Categorization failed',
      };
    }
  }
}

// Report Generation Service
export class ReportService {
  static async generateReport(params: {
    type: 'summary' | 'monthly' | 'expenses' | 'revenue' | 'tax';
    startDate?: string;
    endDate?: string;
    format?: 'json' | 'pdf' | 'csv';
  }): Promise<ReportGenerationResult> {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Report generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        reportId: result.reportId,
        downloadUrl: result.downloadUrl,
      };
    } catch (error) {
      console.error('Report generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report generation failed',
      };
    }
  }

  static async getReportStatus(reportId: string): Promise<{
    status: 'pending' | 'generating' | 'completed' | 'failed';
    progress?: number;
    downloadUrl?: string;
  }> {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/report-status/${reportId}`);
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking report status:', error);
      return { status: 'failed' };
    }
  }

  static async downloadReport(reportId: string): Promise<Blob | null> {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/download-report/${reportId}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading report:', error);
      return null;
    }
  }
}

// Notification Service
export class NotificationService {
  static async sendNotification(params: {
    type: 'email' | 'sms' | 'push';
    recipient: string;
    template?: string;
    data: any;
  }): Promise<NotificationResult> {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Notification failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Notification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Notification failed',
      };
    }
  }

  static async getNotificationStatus(messageId: string): Promise<{
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    deliveredAt?: string;
  }> {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/notification-status/${messageId}`);
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking notification status:', error);
      return { status: 'failed' };
    }
  }
}

// Health Check Service
export class HealthCheckService {
  static async checkAWSServices(): Promise<{
    s3: boolean;
    lambda: boolean;
    apiGateway: boolean;
    rds: boolean;
    overall: boolean;
  }> {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/health`);
      
      if (!response.ok) {
        return {
          s3: false,
          lambda: false,
          apiGateway: false,
          rds: false,
          overall: false,
        };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Health check error:', error);
      return {
        s3: false,
        lambda: false,
        apiGateway: false,
        rds: false,
        overall: false,
      };
    }
  }
}

// Utility functions
export const awsUtils = {
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  validateFileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },

  generateDocumentId: (userId: string, fileName: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId}/${timestamp}-${random}-${fileName}`;
  },

  parseS3Url: (url: string): { bucket: string; key: string } | null => {
    const match = url.match(/https:\/\/([^.]+)\.s3\.([^.]+)\.amazonaws\.com\/(.+)/);
    if (match) {
      return {
        bucket: match[1],
        key: decodeURIComponent(match[3]),
      };
    }
    return null;
  },
};

// Services are already exported above, no need to re-export