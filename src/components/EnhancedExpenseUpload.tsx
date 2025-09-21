import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  DollarSign,
  Calendar,
  Building,
  Tag,
  X
} from 'lucide-react';
import { AzureExpenseService } from '@/services/azure-services';
import { SecurityService } from '@/services/security-service';
import { azureDocumentIntelligenceConfig } from '@/config/azure-config';
import { useExpenseStore } from '@/store/useExpenseStore';

interface EnhancedExpenseUploadProps {
  onUploadComplete?: (processedData: any) => void;
  onError?: (error: string) => void;
}

export const EnhancedExpenseUpload: React.FC<EnhancedExpenseUploadProps> = ({ 
  onUploadComplete, 
  onError 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedInvoice, setProcessedInvoice] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  const { addExpense } = useExpenseStore();
  const securityService = SecurityService.getInstance();
  
  // Initialize Azure service
  const azureService = new AzureExpenseService(azureDocumentIntelligenceConfig);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or image file (JPEG, PNG)');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    // Validate file using security service
    const validation = securityService.validateFileUpload(file);
    if (!validation.valid) {
      setError(validation.error || 'File validation failed');
      return;
    }
    
    setError('');
    setSuccess('');
    setProcessedInvoice(null);
    setIsProcessing(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      // Process the invoice
      const result = await azureService.processInvoiceUpload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.success && result.data) {
        setProcessedInvoice(result.data);
        setSuccess(`Invoice processed successfully! Category: ${result.data.category} (${Math.round(result.data.confidence * 100)}% confidence)`);
        
        // Add to expense store
        const expenseData = {
          id: crypto.randomUUID(),
          userId: 'system', // This should be the current user ID in a real app
          description: result.data.vendorName,
          amount: result.data.totalAmount,
          currency: 'MYR',
          category: result.data.category,
          status: 'pending' as const,
          confidence: result.data.confidence,
          date: result.data.invoiceDate,
          submittedBy: 'system',
          fileName: file.name,
          fileType: file.type,
          extractedText: JSON.stringify(result.data.items),
          aiProcessed: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        addExpense(expenseData);
        
        if (onUploadComplete) {
          onUploadComplete(expenseData);
        }
      } else {
        const errorMsg = result.error || 'Failed to process invoice';
        setError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to process invoice';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsProcessing(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [azureService, addExpense, onUploadComplete, onError, securityService]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const clearResults = () => {
    setProcessedInvoice(null);
    setError('');
    setSuccess('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Enhanced Invoice Upload
          </CardTitle>
          <CardDescription>
            Upload your invoice and let Azure AI automatically extract and categorize your expenses
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {isDragActive ? (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-blue-500 mx-auto" />
                <p className="text-blue-600 font-medium">Drop the invoice here...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-gray-600 font-medium mb-2">
                    Drag & drop your invoice here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, JPEG, PNG (max 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Processing invoice...</span>
                <span className="text-gray-500">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Processed Invoice Results */}
          {processedInvoice && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-green-800">
                    Processed Invoice
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearResults}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Vendor Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Vendor</p>
                      <p className="font-medium text-gray-900">{processedInvoice.vendorName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-medium text-gray-900">{formatCurrency(processedInvoice.totalAmount)}</p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Invoice Date</p>
                      <p className="font-medium text-gray-900">{formatDate(processedInvoice.invoiceDate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Tag className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <Badge variant="secondary" className="font-medium">
                        {processedInvoice.category}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Tax Information */}
                {processedInvoice.taxAmount > 0 && (
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Tax Amount</p>
                      <p className="font-medium text-gray-900">{formatCurrency(processedInvoice.taxAmount)}</p>
                    </div>
                  </div>
                )}

                {/* Items */}
                {processedInvoice.items.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Invoice Items</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {processedInvoice.items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.description}</p>
                            <p className="text-xs text-gray-600">
                              Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.totalPrice)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confidence Score */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-sm text-gray-600">AI Confidence</span>
                  <Badge 
                    variant={processedInvoice.confidence > 0.8 ? "default" : "secondary"}
                    className="font-medium"
                  >
                    {Math.round(processedInvoice.confidence * 100)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};