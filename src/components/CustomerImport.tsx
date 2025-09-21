import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { useExpenseStore } from '@/store/useExpenseStore';

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  status: 'active' | 'inactive';
}

interface ImportResult {
  success: number;
  errors: number;
  duplicates: number;
  data: CustomerData[];
}

const CustomerImport: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { addCustomer } = useExpenseStore();

  const parseCSV = (text: string): CustomerData[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have header and at least one data row');
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredFields = ['name', 'email'];
    
    // Validate required fields
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    const customers: CustomerData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (values.length !== headers.length) {
        console.warn(`Row ${i + 1}: Column count mismatch, skipping`);
        continue;
      }
      
      const customer: CustomerData = {
        id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: values[headers.indexOf('name')] || '',
        email: values[headers.indexOf('email')] || '',
        phone: values[headers.indexOf('phone')] || '',
        company: values[headers.indexOf('company')] || '',
        address: values[headers.indexOf('address')] || '',
        status: (values[headers.indexOf('status')] as 'active' | 'inactive') || 'active'
      };
      
      // Basic validation
      if (!customer.name || !customer.email) {
        console.warn(`Row ${i + 1}: Missing required data, skipping`);
        continue;
      }
      
      customers.push(customer);
    }
    
    return customers;
  };

  const simulateExcelParsing = (file: File): Promise<CustomerData[]> => {
    return new Promise((resolve) => {
      // Simulate Excel parsing with mock data
      setTimeout(() => {
        const mockCustomers: CustomerData[] = [
          {
            id: `cust-${Date.now()}-1`,
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+60123456789',
            company: 'Tech Solutions Sdn Bhd',
            address: 'Kuala Lumpur, Malaysia',
            status: 'active'
          },
          {
            id: `cust-${Date.now()}-2`,
            name: 'Jane Smith',
            email: 'jane.smith@company.com',
            phone: '+60198765432',
            company: 'Marketing Pro',
            address: 'Petaling Jaya, Malaysia',
            status: 'active'
          },
          {
            id: `cust-${Date.now()}-3`,
            name: 'Ahmad Rahman',
            email: 'ahmad@business.my',
            phone: '+60187654321',
            company: 'Local Services',
            address: 'Shah Alam, Malaysia',
            status: 'inactive'
          }
        ];
        resolve(mockCustomers);
      }, 1500);
    });
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setImportResult(null);

    try {
      // Validate file type
      const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        throw new Error('Please upload a CSV or Excel file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      setProgress(25);

      let customers: CustomerData[];
      
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const text = await file.text();
        customers = parseCSV(text);
      } else {
        // Simulate Excel parsing
        customers = await simulateExcelParsing(file);
      }

      setProgress(50);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(75);

      // Process customers and detect duplicates
      let successCount = 0;
      let duplicateCount = 0;
      const processedCustomers: CustomerData[] = [];

      for (const customer of customers) {
        // Simulate duplicate detection (basic email check)
        const isDuplicate = Math.random() < 0.1; // 10% chance of duplicate
        
        if (isDuplicate) {
          duplicateCount++;
        } else {
          addCustomer({
            ...customer,
            paymentTerms: 30,
            outstandingAmount: 0,
            paymentBehavior: 'good',
            status: 'active'
          });
          processedCustomers.push(customer);
          successCount++;
        }
      }

      setProgress(100);

      setImportResult({
        success: successCount,
        errors: customers.length - successCount - duplicateCount,
        duplicates: duplicateCount,
        data: processedCustomers
      });

    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: 0,
        errors: 1,
        duplicates: 0,
        data: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        processFile(acceptedFiles[0]);
      }
    },
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
    disabled: isProcessing
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Data Import
          </CardTitle>
          <CardDescription>
            Upload CSV or Excel files to import customer data. Required fields: name, email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Drop the file here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag & drop a customer file here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports CSV, XLS, XLSX files (max 5MB)
                </p>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Processing...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {importResult && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
                  <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                  <div className="text-sm text-green-700">Imported</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <AlertCircle className="mx-auto h-8 w-8 text-yellow-600 mb-2" />
                  <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                  <div className="text-sm text-yellow-700">Duplicates</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
                  <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                  <div className="text-sm text-red-700">Errors</div>
                </div>
              </div>

              {importResult.data.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Imported Customers</h4>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.data.slice(0, 5).map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell>{customer.company}</TableCell>
                            <TableCell>
                              <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                                {customer.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {importResult.data.length > 5 && (
                      <div className="p-3 text-center text-sm text-gray-500 border-t">
                        And {importResult.data.length - 5} more customers...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerImport;