import { useState, useEffect, useCallback } from 'react';
import {
  DocumentUploadService,
  DocumentProcessingService,
  AICategorizeService,
  ReportService,
  NotificationService,
  HealthCheckService,
  DocumentUploadResult,
  DocumentProcessingResult,
  ReportGenerationResult,
  NotificationResult,
} from '../utils/aws-services';

// Types
interface AWSStatus {
  isConnected: boolean;
  services: {
    s3: boolean;
    lambda: boolean;
    apiGateway: boolean;
    rds: boolean;
  };
  lastChecked: Date | null;
}

interface UploadProgress {
  documentId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
}

// Custom hook for AWS services
export const useAWS = () => {
  const [status, setStatus] = useState<AWSStatus>({
    isConnected: false,
    services: {
      s3: false,
      lambda: false,
      apiGateway: false,
      rds: false,
    },
    lastChecked: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check AWS services health
  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const healthStatus = await HealthCheckService.checkAWSServices();
      
      setStatus({
        isConnected: healthStatus.overall,
        services: {
          s3: healthStatus.s3,
          lambda: healthStatus.lambda,
          apiGateway: healthStatus.apiGateway,
          rds: healthStatus.rds,
        },
        lastChecked: new Date(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        lastChecked: new Date(),
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-check health on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    status,
    isLoading,
    error,
    checkHealth,
  };
};

// Custom hook for document upload
export const useDocumentUpload = () => {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const [isUploading, setIsUploading] = useState(false);

  const uploadDocument = useCallback(async (file: File, userId: string): Promise<DocumentUploadResult> => {
    const tempId = `temp-${Date.now()}`;
    
    setUploads(prev => new Map(prev.set(tempId, {
      documentId: tempId,
      progress: 0,
      status: 'uploading',
    })));
    
    setIsUploading(true);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploads(prev => {
          const current = prev.get(tempId);
          if (current && current.progress < 90) {
            return new Map(prev.set(tempId, {
              ...current,
              progress: current.progress + 10,
            }));
          }
          return prev;
        });
      }, 200);

      const result = await DocumentUploadService.uploadDocument(file, userId);
      
      clearInterval(progressInterval);

      if (result.success && result.documentId) {
        setUploads(prev => new Map(prev.set(result.documentId!, {
          documentId: result.documentId!,
          progress: 100,
          status: 'completed',
        })));
        
        // Remove temp entry
        setUploads(prev => {
          const newMap = new Map(prev);
          newMap.delete(tempId);
          return newMap;
        });
      } else {
        setUploads(prev => new Map(prev.set(tempId, {
          documentId: tempId,
          progress: 0,
          status: 'failed',
        })));
      }

      return result;
    } catch (error) {
      setUploads(prev => new Map(prev.set(tempId, {
        documentId: tempId,
        progress: 0,
        status: 'failed',
      })));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    } finally {
      setIsUploading(false);
    }
  }, []);

  const removeUpload = useCallback((documentId: string) => {
    setUploads(prev => {
      const newMap = new Map(prev);
      newMap.delete(documentId);
      return newMap;
    });
  }, []);

  const clearUploads = useCallback(() => {
    setUploads(new Map());
  }, []);

  return {
    uploads: Array.from(uploads.values()),
    isUploading,
    uploadDocument,
    removeUpload,
    clearUploads,
  };
};

// Custom hook for document processing
export const useDocumentProcessing = () => {
  const [processing, setProcessing] = useState<Map<string, {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    result?: any;
  }>>(new Map());

  const processDocument = useCallback(async (documentId: string): Promise<DocumentProcessingResult> => {
    setProcessing(prev => new Map(prev.set(documentId, {
      status: 'processing',
      progress: 0,
    })));

    try {
      const result = await DocumentProcessingService.processDocument(documentId);
      
      setProcessing(prev => new Map(prev.set(documentId, {
        status: result.success ? 'completed' : 'failed',
        progress: 100,
        result: result.extractedData,
      })));

      return result;
    } catch (error) {
      setProcessing(prev => new Map(prev.set(documentId, {
        status: 'failed',
        progress: 0,
      })));
      
      return {
        success: false,
        documentId,
        error: error instanceof Error ? error.message : 'Processing failed',
      };
    }
  }, []);

  const getProcessingStatus = useCallback(async (documentId: string) => {
    try {
      const status = await DocumentProcessingService.getProcessingStatus(documentId);
      
      setProcessing(prev => new Map(prev.set(documentId, {
        status: status.status,
        progress: status.progress || 0,
        result: status.result,
      })));
      
      return status;
    } catch (error) {
      console.error('Error getting processing status:', error);
      return { status: 'failed' as const };
    }
  }, []);

  const removeProcessing = useCallback((documentId: string) => {
    setProcessing(prev => {
      const newMap = new Map(prev);
      newMap.delete(documentId);
      return newMap;
    });
  }, []);

  return {
    processing: Array.from(processing.entries()).map(([id, data]) => ({ documentId: id, ...data })),
    processDocument,
    getProcessingStatus,
    removeProcessing,
  };
};

// Custom hook for AI categorization
export const useAICategorization = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const categorizeExpense = useCallback(async (data: {
    description: string;
    amount: number;
    vendor?: string;
    date?: string;
  }) => {
    setIsLoading(true);
    
    try {
      const result = await AICategorizeService.categorizeExpense(data);
      setLastResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Categorization failed',
      };
      setLastResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    lastResult,
    categorizeExpense,
  };
};

// Custom hook for report generation
export const useReportGeneration = () => {
  const [reports, setReports] = useState<Map<string, {
    status: 'pending' | 'generating' | 'completed' | 'failed';
    progress: number;
    downloadUrl?: string;
    type: string;
  }>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = useCallback(async (params: {
    type: 'summary' | 'monthly' | 'expenses' | 'revenue' | 'tax';
    startDate?: string;
    endDate?: string;
    format?: 'json' | 'pdf' | 'csv';
  }): Promise<ReportGenerationResult> => {
    setIsGenerating(true);
    
    try {
      const result = await ReportService.generateReport(params);
      
      if (result.success && result.reportId) {
        setReports(prev => new Map(prev.set(result.reportId!, {
          status: 'completed',
          progress: 100,
          downloadUrl: result.downloadUrl,
          type: params.type,
        })));
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report generation failed',
      };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const getReportStatus = useCallback(async (reportId: string) => {
    try {
      const status = await ReportService.getReportStatus(reportId);
      
      setReports(prev => {
        const current = prev.get(reportId);
        return new Map(prev.set(reportId, {
          ...current,
          status: status.status,
          progress: status.progress || 0,
          downloadUrl: status.downloadUrl,
          type: current?.type || 'unknown',
        }));
      });
      
      return status;
    } catch (error) {
      console.error('Error getting report status:', error);
      return { status: 'failed' as const };
    }
  }, []);

  const downloadReport = useCallback(async (reportId: string): Promise<Blob | null> => {
    try {
      return await ReportService.downloadReport(reportId);
    } catch (error) {
      console.error('Error downloading report:', error);
      return null;
    }
  }, []);

  const removeReport = useCallback((reportId: string) => {
    setReports(prev => {
      const newMap = new Map(prev);
      newMap.delete(reportId);
      return newMap;
    });
  }, []);

  return {
    reports: Array.from(reports.entries()).map(([id, data]) => ({ reportId: id, ...data })),
    isGenerating,
    generateReport,
    getReportStatus,
    downloadReport,
    removeReport,
  };
};

// Custom hook for notifications
export const useNotifications = () => {
  const [isSending, setIsSending] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<Array<{
    messageId: string;
    type: string;
    recipient: string;
    sentAt: Date;
    status: 'pending' | 'sent' | 'delivered' | 'failed';
  }>>([]);

  const sendNotification = useCallback(async (params: {
    type: 'email' | 'sms' | 'push';
    recipient: string;
    template?: string;
    data: any;
  }): Promise<NotificationResult> => {
    setIsSending(true);
    
    try {
      const result = await NotificationService.sendNotification(params);
      
      if (result.success && result.messageId) {
        setSentNotifications(prev => [...prev, {
          messageId: result.messageId!,
          type: params.type,
          recipient: params.recipient,
          sentAt: new Date(),
          status: 'sent',
        }]);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Notification failed',
      };
    } finally {
      setIsSending(false);
    }
  }, []);

  const getNotificationStatus = useCallback(async (messageId: string) => {
    try {
      const status = await NotificationService.getNotificationStatus(messageId);
      
      setSentNotifications(prev => prev.map(notification => 
        notification.messageId === messageId
          ? { ...notification, status: status.status }
          : notification
      ));
      
      return status;
    } catch (error) {
      console.error('Error getting notification status:', error);
      return { status: 'failed' as const };
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setSentNotifications([]);
  }, []);

  return {
    isSending,
    sentNotifications,
    sendNotification,
    getNotificationStatus,
    clearNotifications,
  };
};

// Combined hook for all AWS functionality
export const useAWSIntegration = () => {
  const aws = useAWS();
  const upload = useDocumentUpload();
  const processing = useDocumentProcessing();
  const categorization = useAICategorization();
  const reports = useReportGeneration();
  const notifications = useNotifications();

  return {
    aws,
    upload,
    processing,
    categorization,
    reports,
    notifications,
  };
};