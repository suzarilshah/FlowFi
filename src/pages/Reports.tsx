import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, TrendingUp, TrendingDown, Download, Calendar, FileText, DollarSign, Plus, PieChart as PieChartIcon } from "lucide-react";
import { ReportServiceClient } from '@/services/report-service-client';
import { FinancialReport } from '@/services/report-service';
import { ChartGenerator, ChartData } from '@/services/chart-generator';

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<FinancialReport | null>(null);
  const [chartData, setChartData] = useState<{
    expensePie: ChartData;
    monthlyTrend: ChartData;
    expenseBar: ChartData;
    profitMargin: ChartData;
  } | null>(null);

  const reportService = new ReportServiceClient();

  useEffect(() => {
    loadFinancialData();
  }, [selectedPeriod]);

  const loadFinancialData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the client-side service to generate financial report
      const report = await reportService.generateFinancialReport(
        'user-123', // userId
        'profit-loss', // reportType
        { start: new Date('2024-01-01'), end: new Date('2024-12-31') } // dateRange
      );
      
      setFinancialData(report);
      
      // Generate chart data
      const charts = ChartGenerator.generateReportCharts(report);
      setChartData(charts);
      
    } catch (error) {
      console.error('Error loading financial data:', error);
      setError('Failed to load financial data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async (type: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!financialData) {
        throw new Error('No financial data available');
      }
      
      // Generate PDF report using client service
      const pdfBlob = await reportService.generatePDFReport(financialData);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating PDF report:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const reportTypes = [
    {
      id: "profit-loss",
      title: "Profit & Loss Statement",
      description: "Comprehensive income and expense analysis",
      icon: TrendingUp,
      status: "ready",
      lastGenerated: "2024-01-15"
    },
    {
      id: "balance-sheet",
      title: "Balance Sheet",
      description: "Assets, liabilities, and equity overview",
      icon: BarChart3,
      status: "ready",
      lastGenerated: "2024-01-15"
    },
    {
      id: "cash-flow",
      title: "Cash Flow Statement",
      description: "Track money movement in and out",
      icon: DollarSign,
      status: "generating",
      lastGenerated: "2024-01-14"
    },
    {
      id: "expense-breakdown",
      title: "Expense Breakdown",
      description: "Detailed categorization of expenses",
      icon: PieChartIcon,
      status: "ready",
      lastGenerated: "2024-01-15"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>;
      case "generating":
        return <Badge className="bg-yellow-100 text-yellow-800">Generating</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading financial reports...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!financialData || !chartData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Financial Reports</h1>
            <p className="text-gray-500 mb-4">No data available</p>
            <button
              onClick={loadFinancialData}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Load Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Reports</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadFinancialData}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Reports</h1>
          <p className="text-gray-600">Generate and analyze comprehensive financial reports</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="statements">Financial Statements</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="custom">Custom Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {financialData ? ChartGenerator.formatCurrency(financialData.data.summary.netProfit) : 'RM 0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {financialData ? `+12.5% from last period` : 'Loading...'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {financialData ? ChartGenerator.formatCurrency(financialData.data.summary.totalRevenue) : 'RM 0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {financialData ? `+8.3% from last period` : 'Loading...'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {financialData ? ChartGenerator.formatCurrency(financialData.data.summary.totalExpenses) : 'RM 0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {financialData ? `+5.2% from last period` : 'Loading...'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                  <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {financialData ? ChartGenerator.formatPercentage(financialData.data.summary.profitMargin) : '0.0%'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {financialData ? `+2.1% from last period` : 'Loading...'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Available Reports */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Available Reports</CardTitle>
                    <CardDescription>Generate and download financial reports</CardDescription>
                  </div>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportTypes.map((report) => {
                    const IconComponent = report.icon;
                    return (
                      <div key={report.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <IconComponent className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{report.title}</h3>
                              <p className="text-sm text-gray-600">{report.description}</p>
                            </div>
                          </div>
                          {getStatusBadge(report.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">Last generated: {report.lastGenerated}</p>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <FileText className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              disabled={report.status === "generating" || isLoading}
                              onClick={() => handleGenerateReport(report.id)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              {isLoading ? 'Generating...' : 'Download'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Statements</CardTitle>
                <CardDescription>Standard accounting reports for your business</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Profit & Loss */}
                  <div className="border rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Profit & Loss Statement</h3>
                      <Button 
                        onClick={() => handleGenerateReport('profit-loss')}
                        disabled={isLoading}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {isLoading ? 'Generating...' : 'Generate Report'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600">RM 45,231.89</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Expenses</p>
                        <p className="text-2xl font-bold text-red-600">RM 16,781.89</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Net Profit</p>
                        <p className="text-2xl font-bold text-blue-600">RM 28,450.00</p>
                      </div>
                    </div>
                  </div>

                  {/* Balance Sheet */}
                  <div className="border rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Balance Sheet</h3>
                      <Button 
                        onClick={() => handleGenerateReport('balance-sheet')}
                        disabled={isLoading}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {isLoading ? 'Generating...' : 'Generate Report'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Assets</p>
                        <p className="text-2xl font-bold text-blue-600">RM 125,450.00</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Liabilities</p>
                        <p className="text-2xl font-bold text-orange-600">RM 35,200.00</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Owner's Equity</p>
                        <p className="text-2xl font-bold text-green-600">RM 90,250.00</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Analytics</CardTitle>
                <CardDescription>Advanced insights and trend analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData && financialData ? (
                  <div className="space-y-8">
                    {/* Monthly Trend Chart */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Monthly Financial Trends</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData.monthlyTrend.datasets[0].data.map((value, index) => ({
                            month: chartData.monthlyTrend.labels[index],
                            revenue: chartData.monthlyTrend.datasets[0].data[index],
                            expenses: chartData.monthlyTrend.datasets[1].data[index],
                            profit: chartData.monthlyTrend.datasets[2].data[index]
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(value) => `RM ${value.toLocaleString()}`} />
                            <Tooltip formatter={(value) => [`RM ${value.toLocaleString()}`, '']} />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
                            <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} />
                            <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Expense Breakdown</h3>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData.expensePie.datasets[0].data.map((value, index) => ({
                                  name: chartData.expensePie.labels[index],
                                  value: value
                                }))}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {chartData.expensePie.datasets[0].data.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={chartData.expensePie.datasets[0].backgroundColor[index]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [`RM ${value.toLocaleString()}`, '']} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-4">Top Expense Categories</h3>
                        <div className="space-y-3">
                          {financialData.data.expenseBreakdown.slice(0, 5).map((expense, index) => (
                            <div key={expense.category} className="flex justify-between items-center">
                              <span className="text-sm font-medium">{expense.category}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">
                                  {ChartGenerator.formatCurrency(expense.amount)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({((expense.amount / financialData.data.summary.totalExpenses) * 100).toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Analytics...</h3>
                    <p className="text-gray-600">Financial analytics will be displayed here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom Reports</CardTitle>
                <CardDescription>Create personalized reports for your specific needs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Report Builder</h3>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      New Custom Report
                    </Button>
                  </div>
                  
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Reports</h3>
                    <p className="text-gray-600 mb-4">Create your first custom report to get started</p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}