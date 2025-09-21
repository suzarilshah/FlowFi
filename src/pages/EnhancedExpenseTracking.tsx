import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Brain,
  CheckCircle,
  AlertCircle,
  Upload,
  Settings,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  Shield,
  XCircle
} from 'lucide-react';
import { EnhancedExpenseUpload } from '@/components/EnhancedExpenseUpload';
import { DynamicExpenseCategories } from '@/components/DynamicExpenseCategories';
import { SecurityConfigValidator } from '@/components/SecurityConfigValidator';
import { useExpenseStore } from '@/store/useExpenseStore';

interface ExpenseAnalytics {
  totalExpenses: number;
  totalAmount: number;
  averageAmount: number;
  aiProcessedCount: number;
  categoriesCount: number;
  monthlyTrend: Array<{month: string, amount: number, count: number}>;
  topCategories: Array<{category: string, amount: number, count: number}>;
}

export const EnhancedExpenseTracking: React.FC = () => {
  const { expenses, categories } = useExpenseStore();
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showSecurityValidator, setShowSecurityValidator] = useState(false);

  useEffect(() => {
    calculateAnalytics();
    setIsLoading(false);
  }, [expenses, dateRange]);

  const calculateAnalytics = () => {
    let filteredExpenses = expenses;
    
    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filteredExpenses = expenses.filter(exp => new Date(exp.date) >= startDate);
    }

    // Apply category filter
    if (selectedCategory) {
      filteredExpenses = filteredExpenses.filter(exp => exp.category === selectedCategory);
    }

    const totalExpenses = filteredExpenses.length;
    const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const averageAmount = totalExpenses > 0 ? totalAmount / totalExpenses : 0;
    const aiProcessedCount = filteredExpenses.filter(exp => exp.aiProcessed).length;
    const categoriesCount = new Set(filteredExpenses.map(exp => exp.category).filter(Boolean)).size;

    // Calculate monthly trend
    const monthlyData = new Map<string, {amount: number, count: number}>();
    filteredExpenses.forEach(exp => {
      const month = new Date(exp.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      const current = monthlyData.get(month) || { amount: 0, count: 0 };
      monthlyData.set(month, {
        amount: current.amount + exp.amount,
        count: current.count + 1
      });
    });

    const monthlyTrend = Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12); // Last 12 months

    // Calculate top categories
    const categoryData = new Map<string, {amount: number, count: number}>();
    filteredExpenses.forEach(exp => {
      if (exp.category) {
        const current = categoryData.get(exp.category) || { amount: 0, count: 0 };
        categoryData.set(exp.category, {
          amount: current.amount + exp.amount,
          count: current.count + 1
        });
      }
    });

    const topCategories = Array.from(categoryData.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    setAnalytics({
      totalExpenses,
      totalAmount,
      averageAmount,
      aiProcessedCount,
      categoriesCount,
      monthlyTrend,
      topCategories
    });
  };

  const handleUploadComplete = (processedData: any) => {
    setSuccess('Invoice processed and expense added successfully!');
    setTimeout(() => setSuccess(''), 5000);
    calculateAnalytics();
  };

  const handleUploadError = (error: string) => {
    setError(`Upload failed: ${error}`);
    setTimeout(() => setError(''), 5000);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
  };

  const exportData = () => {
    const dataToExport = {
      expenses: expenses,
      analytics: analytics,
      exportDate: new Date().toISOString(),
      summary: {
        totalExpenses: analytics?.totalExpenses,
        totalAmount: analytics?.totalAmount,
        averageAmount: analytics?.averageAmount
      }
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Progress value={66} className="w-64" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Expense Tracking</h1>
          <p className="text-gray-600">AI-powered expense management with dynamic categorization</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={exportData}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          <Button 
            onClick={() => setShowSecurityValidator(true)} 
            variant="outline" 
            className="flex items-center space-x-2"
          >
            <Shield className="h-4 w-4" />
            <span>Security Check</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-900">{analytics.totalExpenses}</span>
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-900">{formatCurrency(analytics.totalAmount)}</span>
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">AI Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-purple-900">{analytics.aiProcessedCount}</span>
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div className="mt-2">
                <Progress 
                  value={analytics.totalExpenses > 0 ? (analytics.aiProcessedCount / analytics.totalExpenses) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-900">{analytics.categoriesCount}</span>
                <PieChart className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Categories</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <EnhancedExpenseUpload 
            onUploadComplete={handleUploadComplete}
            onError={handleUploadError}
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <DynamicExpenseCategories 
            onCategorySelect={handleCategorySelect}
            selectedCategory={selectedCategory}
            showAnalytics={true}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm"
                      >
                        <option value="all">All Time</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="90days">Last 90 Days</option>
                        <option value="1year">Last Year</option>
                      </select>
                    </div>
                    
                    {selectedCategory && (
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <span>Category: {selectedCategory}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCategory('')}
                          className="h-4 w-4 p-0 ml-1"
                        >
                          ×
                        </Button>
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topCategories.map((cat, index) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-600 w-4">{index + 1}.</span>
                          <span className="font-medium">{cat.category}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(cat.amount)}</div>
                          <div className="text-sm text-gray-600">{cat.count} expenses</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.monthlyTrend.map((month) => (
                      <div key={month.month} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{month.month}</span>
                          <span className="text-gray-600">{formatCurrency(month.amount)} ({month.count} expenses)</span>
                        </div>
                        <Progress 
                          value={analytics.totalAmount > 0 ? (month.amount / analytics.totalAmount) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Security Validator Modal */}
      {showSecurityValidator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Security Configuration</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSecurityValidator(false)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
              <SecurityConfigValidator 
                showDetails={true}
                onConfigurationValid={() => {
                  setSuccess('Security configuration validated successfully');
                  setShowSecurityValidator(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};