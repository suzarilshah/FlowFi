import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { useExpenseStore, UploadedFile } from '@/store/useExpenseStore';
import { toast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileProcessed?: (file: UploadedFile) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileProcessed, 
  maxFiles = 10, 
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
}) => {
  const { uploadedFiles, addUploadedFile, updateUploadedFile, removeUploadedFile } = useExpenseStore();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const simulateOCR = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        reject(new Error(`Unsupported file type: ${file.type}`));
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        reject(new Error('File size exceeds 10MB limit'));
        return;
      }

      setTimeout(() => {
        // More realistic OCR simulation based on file name and type
        const invoicePatterns = [
          {
            text: `Invoice #INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}\nDate: ${new Date().toISOString().split('T')[0]}\nAmount: RM ${(Math.random() * 5000 + 100).toFixed(2)}\nVendor: ${['Office Supplies Co.', 'Tech Solutions Ltd', 'Catering Services', 'Maintenance Corp'][Math.floor(Math.random() * 4)]}\nDescription: ${['Office supplies and equipment', 'Software licensing fees', 'Team lunch catering', 'Building maintenance'][Math.floor(Math.random() * 4)]}`,
            category: 'office_supplies',
            confidence: 0.85 + Math.random() * 0.1
          },
          {
            text: `Receipt #RCP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}\nDate: ${new Date().toISOString().split('T')[0]}\nAmount: RM ${(Math.random() * 500 + 20).toFixed(2)}\nVendor: ${['Fuel Station', 'Parking Services', 'Taxi Service', 'Toll Plaza'][Math.floor(Math.random() * 4)]}\nDescription: ${['Vehicle fuel', 'Parking fees', 'Business travel', 'Highway toll'][Math.floor(Math.random() * 4)]}`,
            category: 'travel',
            confidence: 0.75 + Math.random() * 0.15
          },
          {
            text: `Bill #BILL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}\nDate: ${new Date().toISOString().split('T')[0]}\nAmount: RM ${(Math.random() * 3000 + 500).toFixed(2)}\nVendor: ${['Utilities Corp', 'Internet Provider', 'Phone Company', 'Security Services'][Math.floor(Math.random() * 4)]}\nDescription: ${['Monthly electricity bill', 'Internet service', 'Phone service', 'Security monitoring'][Math.floor(Math.random() * 4)]}`,
            category: 'utilities',
            confidence: 0.90 + Math.random() * 0.05
          }
        ];
        
        const selectedPattern = invoicePatterns[Math.floor(Math.random() * invoicePatterns.length)];
        resolve(JSON.stringify(selectedPattern));
      }, 1500 + Math.random() * 1000); // Variable processing time
    });
  };

  const processFile = async (file: File, fileId: string) => {
    try {
      // Update status to processing
      updateUploadedFile(fileId, { status: 'processing' });
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fileId] || 0;
          const newProgress = Math.min(currentProgress + Math.random() * 20, 90);
          return { ...prev, [fileId]: newProgress };
        });
      }, 500);
      
      // Perform OCR simulation
      const ocrResultString = await simulateOCR(file);
      const ocrResult = JSON.parse(ocrResultString);
      
      // Complete upload
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
      
      // Update file with results
      const updatedFile = {
        status: 'completed' as const,
        extractedText: ocrResult.text,
        suggestedCategory: ocrResult.category,
        confidence: ocrResult.confidence
      };
      
      updateUploadedFile(fileId, updatedFile);
      
      // Call callback if provided
      if (onFileProcessed) {
        const fileData = uploadedFiles.find(f => f.id === fileId);
        if (fileData) {
          onFileProcessed({ ...fileData, ...updatedFile });
        }
      }
      
      toast({
        title: "File processed successfully",
        description: `${file.name} has been processed and categorized as ${ocrResult.category}`,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      
      updateUploadedFile(fileId, { 
        status: 'error', 
        error: errorMessage
      });
      
      toast({
        title: "Processing failed",
        description: `Failed to process ${file.name}: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((error: any) => {
        toast({
          title: "File rejected",
          description: `${file.name}: ${error.message}`,
          variant: "destructive",
        });
      });
    });

    // Process accepted files
    acceptedFiles.forEach((file) => {
      const uploadedFile = {
        id: crypto.randomUUID(),
        file,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        status: 'uploading' as const,
      };
      
      addUploadedFile(uploadedFile);
      
      // Get the file ID (we need to find it since addUploadedFile generates it)
      setTimeout(() => {
        const files = useExpenseStore.getState().uploadedFiles;
        const addedFile = files.find(f => f.fileName === file.name && f.fileSize === file.size);
        if (addedFile) {
          processFile(file, addedFile.id);
        }
      }, 100);
    });
  }, [addUploadedFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles,
    maxSize,
    multiple: true,
  });

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Badge variant="secondary">Uploading</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <div>
                <h3 className="text-lg font-medium text-blue-600 mb-2">Drop files here</h3>
                <p className="text-blue-500">Release to upload your files</p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload your invoices</h3>
                <p className="text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  Choose Files
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  Supports PDF, JPG, PNG up to {formatFileSize(maxSize)} • Max {maxFiles} files
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Uploaded Files</h3>
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    {getStatusIcon(file.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.fileName}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.fileSize)}</p>
                      {file.suggestedCategory && (
                        <p className="text-sm text-blue-600">Suggested: {file.suggestedCategory}</p>
                      )}
                      {file.confidence && (
                        <p className="text-sm text-green-600">
                          Confidence: {Math.round(file.confidence * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(file.status)}
                    
                    {file.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeUploadedFile(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export { FileUpload };
export default FileUpload;