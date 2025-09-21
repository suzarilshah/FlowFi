import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, FileText, Clock, CheckCircle, Upload, Plus, XCircle, Eye } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ExpenseForm from "@/components/ExpenseForm";
import { ExpenseDashboard } from '@/components/ExpenseDashboard';
import { useExpenseStore } from "@/store/useExpenseStore";

export default function Expenses() {
  const { 
    expenses, 
    uploadedFiles, 
    getTotalExpenses, 
    getPendingApprovals, 
    approveExpense, 
    rejectExpense,
    addExpense 
  } = useExpenseStore();
  const [activeTab, setActiveTab] = useState('overview');

  const handleFileProcessed = (file: any) => {
    // Create expense from processed file
    if (file.status === 'completed' && file.suggestedCategory) {
      // Extract amount from OCR text (simple regex)
      const amountMatch = file.extractedText?.match(/RM\s*(\d+(?:\.\d{2})?)/i);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
      
      addExpense({
        id: crypto.randomUUID(),
        description: `Expense from ${file.fileName}`,
        amount,
        currency: 'RM',
        category: file.suggestedCategory,
        status: 'pending',
        confidence: file.confidence || 0,
        date: new Date().toISOString().split('T')[0],
        submittedBy: 'Current User',
        fileUrl: file.id,
        fileName: file.fileName,
        fileType: file.fileType,
        extractedText: file.extractedText,
        userId: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  const formatAmount = (amount: number, currency: string = 'RM') => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  const totalExpenses = getTotalExpenses();
  const pendingApprovals = getPendingApprovals().length;
  const pendingFiles = uploadedFiles.filter(f => f.status === 'processing' || f.status === 'uploading');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    const variant = confidence >= 0.9 ? "default" : confidence >= 0.7 ? "secondary" : "destructive";
    return <Badge variant={variant}>{percentage}% confidence</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Expense Management</h1>
          <p className="text-gray-600">Manage invoices, categorization, and approval workflows</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="upload">Upload Invoice</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="ai-classification">Dashboard</TabsTrigger>
            <TabsTrigger value="cash-flow">Cash Flow Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatAmount(totalExpenses)}</div>
                  <p className="text-xs text-muted-foreground">{expenses.length} total expenses</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingApprovals}</div>
                  <p className="text-xs text-muted-foreground">Requires attention</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved This Month</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{expenses.filter(e => e.status === 'approved').length}</div>
                  <p className="text-xs text-muted-foreground">{formatAmount(expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0))} total</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Processing Files</CardTitle>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingFiles.length}</div>
                  <p className="text-xs text-muted-foreground">Files being processed</p>
                </CardContent>
              </Card>
            </div>

            {/* Expenses Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>Latest expense submissions and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>AI Confidence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No expenses found. Upload some invoices to get started!
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.id}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>{formatAmount(expense.amount, expense.currency)}</TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell>{getConfidenceBadge(expense.confidence)}</TableCell>
                          <TableCell>{getStatusBadge(expense.status)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {expense.status === 'pending' && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => approveExpense(expense.id, 'Current User')}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => rejectExpense(expense.id, 'Manual rejection', 'Current User')}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Invoice/Receipt</CardTitle>
                <CardDescription>
                  Upload your invoices and receipts for automatic processing and categorization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onFileProcessed={handleFileProcessed} />
              </CardContent>
            </Card>
            
            {/* Show uploaded files */}
            {uploadedFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Files</CardTitle>
                  <CardDescription>
                    Files that have been uploaded and processed.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="font-medium">{file.fileName}</p>
                            <p className="text-sm text-gray-500">{file.fileType} • {(file.fileSize / 1024).toFixed(1)} KB</p>
                            {file.suggestedCategory && (
                              <Badge variant="secondary" className="mt-1">
                                {file.suggestedCategory}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(file.status)}
                          {file.confidence && (
                            <Badge variant="outline">
                              {Math.round(file.confidence * 100)}% confidence
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <ExpenseForm onSuccess={() => {
              // Optionally switch back to overview after successful submission
              setActiveTab('overview');
            }} />
          </TabsContent>

          <TabsContent value="ai-classification" className="space-y-6">
            <ExpenseDashboard />
          </TabsContent>

          <TabsContent value="cash-flow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Tracking</CardTitle>
                <CardDescription>Track all outgoing payments by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900">Payroll</h4>
                    <p className="text-2xl font-bold text-blue-600">RM 25,000</p>
                    <p className="text-sm text-gray-600">This month</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900">Utilities</h4>
                    <p className="text-2xl font-bold text-green-600">RM 1,200</p>
                    <p className="text-sm text-gray-600">This month</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900">Office Expenses</h4>
                    <p className="text-2xl font-bold text-purple-600">RM 3,450</p>
                    <p className="text-sm text-gray-600">This month</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900">Loan Payments</h4>
                    <p className="text-2xl font-bold text-orange-600">RM 5,000</p>
                    <p className="text-sm text-gray-600">This month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categorize" className="space-y-6">
            <ExpenseDashboard />
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <ExpenseDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}