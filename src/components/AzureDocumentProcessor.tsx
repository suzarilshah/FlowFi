import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload, FileText, CheckCircle, Brain, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useExpenseStore } from "@/store/useExpenseStore";
import { DocumentProcessingService } from "@/utils/aws-services";
import type { UploadedFile } from "@/store/useExpenseStore";

interface User {
  id: string;
  email: string;
  name: string;
}

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  description: string;
  result?: any;
  error?: string;
}

const AzureDocumentProcessor: React.FC = () => {
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    {
      id: 'upload',
      name: 'Document Upload',
      status: 'pending',
      description: 'Upload and validate document',
    },
    {
      id: 's3-upload',
      name: 'S3 Upload',
      status: 'pending',
      description: 'Upload document to S3 for processing',
    },
    {
      id: 'azure-analysis',
      name: 'AI Document Analysis',
      status: 'pending',
      description: 'Extract data with AI Document Analysis',
    },
    {
      id: 'ai-summary',
      name: 'AI-Powered Summarization',
      status: 'pending',
      description: 'Generate summary and insights with OpenAI',
    },
    {
      id: 'vector-embedding',
      name: 'Vector Embedding',
      status: 'pending',
      description: 'Create vector representation for semantic search',
    },
    {
      id: 'database-storage',
      name: 'Database Storage',
      status: 'pending',
      description: 'Save processed data to the database',
    },
  ]);

  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const { addUploadedFile } = useExpenseStore();
  // Remove the useToast destructuring and use the imported toast directly
  // const { toast } = useToast();

  useEffect(() => {
    // Get current user
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  useEffect(() => {
    // Cleanup polling on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const calculateProgress = useCallback(() => {
    const completedSteps = processingSteps.filter(step => step.status === 'completed').length;
    return (completedSteps / processingSteps.length) * 100;
  }, [processingSteps]);

  const resetProcessor = useCallback(() => {
    setCurrentFile(null);
    setIsProcessing(false);
    setError(null);
    setDocumentId(null);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setProcessingSteps([
      { id: 'upload', name: 'Document Upload', status: 'pending', description: 'Upload and validate document' },
      { id: 's3-upload', name: 'S3 Upload', status: 'pending', description: 'Upload document to S3 for processing' },
      { id: 'azure-analysis', name: 'AI Document Analysis', status: 'pending', description: 'Extract data with AI Document Analysis' },
      { id: 'ai-summary', name: 'AI-Powered Summarization', status: 'pending', description: 'Generate summary and insights with OpenAI' },
      { id: 'vector-embedding', name: 'Vector Embedding', status: 'pending', description: 'Create vector representation for semantic search' },
      { id: 'database-storage', name: 'Database Storage', status: 'pending', description: 'Save processed data to the database' },
    ]);
  }, [pollingInterval]);

  const updateStepStatus = useCallback((stepId: string, status: ProcessingStep['status'], result?: any, error?: string) => {
    setProcessingSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, status, result, error } : step
      )
    );
  }, []);

  const pollProcessingStatus = useCallback(async (docId: string) => {
    try {
      const statusData = await DocumentProcessingService.getProcessingStatus(docId);
      
      // Update processing steps based on status
      if (statusData.status === 'completed') {
        updateStepStatus('azure-analysis', 'completed', statusData.result);
        updateStepStatus('ai-summary', 'completed', statusData.result);
        updateStepStatus('vector-embedding', 'completed', statusData.result);
        updateStepStatus('database-storage', 'completed', statusData.result);
        
        setIsProcessing(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        
        toast({
          title: 'Processing Complete',
          description: 'Your document has been successfully processed.',
        });
      } else if (statusData.status === 'failed') {
        updateStepStatus('azure-analysis', 'error', undefined, 'Processing failed');
        setIsProcessing(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        
        toast({
          title: 'Processing Failed',
          description: 'Failed to process your document.',
          variant: 'destructive',
        });
      } else if (statusData.status === 'processing') {
        // Document is still being processed, continue polling
        updateStepStatus('azure-analysis', 'processing');
      }
      
      return statusData;
    } catch (error) {
      console.error('Error checking processing status:', error);
      updateStepStatus('azure-analysis', 'error', undefined, 'Failed to check processing status');
      setIsProcessing(false);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return { status: 'failed' };
    }
  }, [pollingInterval, toast, updateStepStatus]);

  const processDocument = useCallback(async (file: File) => {
    if (!currentUser) {
      setError('You must be logged in to upload documents');
      return;
    }

    setCurrentFile(file);
    setIsProcessing(true);
    setError(null);
    updateStepStatus('upload', 'processing');

    const uploadedFileId = crypto.randomUUID();
    let presignedUrl: string;
    let s3Key: string;
    let documentId: string;

    try {
      // Get presigned URL from backend
      updateStepStatus('upload', 'completed');
      updateStepStatus('s3-upload', 'processing');

      try {
        const apiEndpoint = import.meta.env.VITE_API_ENDPOINT || '';
        const response = await fetch(`${apiEndpoint}/presigned-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to get presigned URL');
        }

        const { data } = await response.json();
        presignedUrl = data.presignedUrl;
        s3Key = data.s3Key;
        documentId = data.documentId;
        setDocumentId(documentId);
        
      } catch (error) {
        console.error('Failed to get presigned URL:', error);
        const message = error instanceof Error ? error.message : 'Failed to get presigned URL';
        updateStepStatus('s3-upload', 'error', undefined, message);
        throw new Error(message);
      }

      try {
        const uploadResponse = await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('S3 upload failed');
        }
        updateStepStatus('s3-upload', 'completed', { s3Location: s3Key });
      } catch (s3Error) {
        console.error('S3 upload failed:', s3Error);
        updateStepStatus('s3-upload', 'error', undefined, 'Failed to upload to S3');
        throw new Error('S3 upload failed');
      }

      const newUploadedFile: UploadedFile = {
        id: uploadedFileId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        status: 'processing',
        s3Key: s3Key,
        documentId: documentId,
      };
      addUploadedFile(newUploadedFile);

      setProcessingSteps(prevSteps =>
        prevSteps.map(step => {
          if (step.id === 'upload' || step.id === 's3-upload') {
            return step;
          }
          return { ...step, status: 'processing' };
        })
      );
      
      toast({
          title: 'Upload Successful',
          description: 'Your document has been uploaded and is now being processed.',
      });

      // Start polling for processing status
      const interval = setInterval(() => {
        if (documentId) {
          pollProcessingStatus(documentId);
        }
      }, 3000); // Poll every 3 seconds
      
      setPollingInterval(interval);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      const failedStep = processingSteps.find(step => step.status === 'processing' || step.status === 'pending');
      if (failedStep) {
        updateStepStatus(failedStep.id, 'error', undefined, errorMessage);
      }
      setIsProcessing(false);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [currentUser, addUploadedFile, toast, resetProcessor, updateStepStatus, processingSteps, pollingInterval, pollProcessingStatus]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size exceeds 10MB. Please upload a smaller file.');
        return;
      }
      processDocument(file);
    }
  }, [processDocument]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
    },
    multiple: false,
  });

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'pending':
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Document Processor
          </CardTitle>
          <CardDescription>
            Upload documents for AI-powered analysis and processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!currentFile && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Drop the file here' : 'Upload a Document'}
              </p>
              <p className="text-gray-500">
                Drag & drop a PDF, JPG, or PNG file here, or click to select
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Maximum file size: 10MB
              </p>
            </div>
          )}

          {currentFile && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{currentFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={resetProcessor} disabled={isProcessing}>
                  Change File
                </Button>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {(isProcessing || processingSteps.some(s => s.status !== 'pending')) && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processing Progress</span>
                <span className="text-sm text-gray-500">{Math.round(calculateProgress())}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
          )}

          <div className="mt-6 space-y-3">
            {processingSteps.map((step) => (
              <div key={step.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                <div className="mr-4">{getStepIcon(step.status)}</div>
                <div className="flex-1">
                  <p className="font-medium">{step.name}</p>
                  <p className="text-sm text-gray-500">{step.description}</p>
                  {step.status === 'completed' && step.result && (
                    <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                      <pre>{JSON.stringify(step.result, null, 2)}</pre>
                    </div>
                  )}
                  {step.status === 'error' && step.error && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                      <p><strong>Error:</strong> {step.error}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {processingSteps.every(s => s.status === 'completed') && (
             <Button onClick={resetProcessor} className="w-full mt-4">
                Process Another Document
              </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AzureDocumentProcessor;