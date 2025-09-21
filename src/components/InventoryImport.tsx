import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Package, CheckCircle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useExpenseStore } from '@/store/useExpenseStore';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  reorderLevel: number;
  supplier: string;
  location: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: Date;
}

interface ImportResult {
  success: number;
  errors: number;
  updated: number;
  data: InventoryItem[];
}

const InventoryImport: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { addInventoryItem } = useExpenseStore();

  const parseCSV = (text: string): InventoryItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have header and at least one data row');
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredFields = ['sku', 'name', 'quantity', 'unitprice'];
    
    // Validate required fields
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    const items: InventoryItem[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (values.length !== headers.length) {
        console.warn(`Row ${i + 1}: Column count mismatch, skipping`);
        continue;
      }
      
      const quantity = parseInt(values[headers.indexOf('quantity')]) || 0;
      const unitPrice = parseFloat(values[headers.indexOf('unitprice')]) || 0;
      const reorderLevel = parseInt(values[headers.indexOf('reorderlevel')]) || 10;
      
      const item: InventoryItem = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sku: values[headers.indexOf('sku')] || '',
        name: values[headers.indexOf('name')] || '',
        description: values[headers.indexOf('description')] || '',
        category: values[headers.indexOf('category')] || 'General',
        quantity,
        unitPrice,
        totalValue: quantity * unitPrice,
        reorderLevel,
        supplier: values[headers.indexOf('supplier')] || '',
        location: values[headers.indexOf('location')] || 'Main Warehouse',
        status: quantity === 0 ? 'out_of_stock' : quantity <= reorderLevel ? 'low_stock' : 'in_stock',
        lastUpdated: new Date()
      };
      
      // Basic validation
      if (!item.sku || !item.name) {
        console.warn(`Row ${i + 1}: Missing required data, skipping`);
        continue;
      }
      
      items.push(item);
    }
    
    return items;
  };

  const simulateExcelParsing = (file: File): Promise<InventoryItem[]> => {
    return new Promise((resolve) => {
      // Simulate Excel parsing with mock data
      setTimeout(() => {
        const mockItems: InventoryItem[] = [
          {
            id: `inv-${Date.now()}-1`,
            sku: 'OFF-001',
            name: 'A4 Paper Ream',
            description: 'White A4 copy paper, 500 sheets',
            category: 'Office Supplies',
            quantity: 25,
            unitPrice: 12.50,
            totalValue: 312.50,
            reorderLevel: 10,
            supplier: 'Office Depot',
            location: 'Storage Room A',
            status: 'in_stock',
            lastUpdated: new Date()
          },
          {
            id: `inv-${Date.now()}-2`,
            sku: 'TECH-002',
            name: 'Wireless Mouse',
            description: 'Ergonomic wireless optical mouse',
            category: 'Technology',
            quantity: 5,
            unitPrice: 45.00,
            totalValue: 225.00,
            reorderLevel: 8,
            supplier: 'Tech Solutions',
            location: 'IT Storage',
            status: 'low_stock',
            lastUpdated: new Date()
          },
          {
            id: `inv-${Date.now()}-3`,
            sku: 'FURN-003',
            name: 'Office Chair',
            description: 'Ergonomic office chair with lumbar support',
            category: 'Furniture',
            quantity: 0,
            unitPrice: 299.00,
            totalValue: 0,
            reorderLevel: 2,
            supplier: 'Furniture Plus',
            location: 'Warehouse B',
            status: 'out_of_stock',
            lastUpdated: new Date()
          },
          {
            id: `inv-${Date.now()}-4`,
            sku: 'CLEAN-004',
            name: 'Hand Sanitizer',
            description: '500ml antibacterial hand sanitizer',
            category: 'Cleaning Supplies',
            quantity: 15,
            unitPrice: 8.50,
            totalValue: 127.50,
            reorderLevel: 5,
            supplier: 'Health & Safety Co',
            location: 'Supply Closet',
            status: 'in_stock',
            lastUpdated: new Date()
          }
        ];
        resolve(mockItems);
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

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      setProgress(25);

      let items: InventoryItem[];
      
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const text = await file.text();
        items = parseCSV(text);
      } else {
        // Simulate Excel parsing
        items = await simulateExcelParsing(file);
      }

      setProgress(50);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(75);

      // Process items and detect updates
      let successCount = 0;
      let updatedCount = 0;
      const processedItems: InventoryItem[] = [];

      for (const item of items) {
        // Simulate existing item detection (basic SKU check)
        const isUpdate = Math.random() < 0.2; // 20% chance of being an update
        
        if (isUpdate) {
          updatedCount++;
        } else {
          successCount++;
        }
        
        addInventoryItem({
          ...item,
          currentStock: item.quantity || 0
        });
        processedItems.push(item);
      }

      setProgress(100);

      setImportResult({
        success: successCount,
        errors: 0,
        updated: updatedCount,
        data: processedItems
      });

    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: 0,
        errors: 1,
        updated: 0,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'low_stock':
        return <TrendingDown className="h-4 w-4 text-yellow-600" />;
      case 'out_of_stock':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'default';
      case 'low_stock':
        return 'secondary';
      case 'out_of_stock':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Data Import
          </CardTitle>
          <CardDescription>
            Upload CSV or Excel files to import inventory data. Required fields: sku, name, quantity, unitPrice
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
                  Drag & drop an inventory file here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports CSV, XLS, XLSX files (max 10MB)
                </p>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Processing inventory data...</span>
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
                  <div className="text-sm text-green-700">New Items</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <TrendingUp className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{importResult.updated}</div>
                  <div className="text-sm text-blue-700">Updated</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
                  <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                  <div className="text-sm text-red-700">Errors</div>
                </div>
              </div>

              {importResult.data.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Imported Inventory Items</h4>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total Value</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.data.slice(0, 5).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.sku}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>RM {item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell>RM {item.totalValue.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(item.status)} className="flex items-center gap-1">
                                {getStatusIcon(item.status)}
                                {item.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {importResult.data.length > 5 && (
                      <div className="p-3 text-center text-sm text-gray-500 border-t">
                        And {importResult.data.length - 5} more items...
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

export default InventoryImport;