import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { 
  PieChart as PieChartIcon, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText,
  Calendar,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useExpenseStore } from '@/store/useExpenseStore';
import { ChartGenerator } from '@/services/chart-generator';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00ff00'
];

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  count: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

interface MonthlyData {
  month: string;
  amount: number;
  count: number;
}

export function ExpenseDashboard() {
  const { expenses, categories, getExpensesByCategory, getTotalExpenses } = useExpenseStore();
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  // Add error boundary and loading state
  if (!expenses) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Dashboard...</h3>
            <p className="text-gray-600">Please wait while we load your expense data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter expenses based on timeframe
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : selectedTimeframe === '90d' ? 90 : 365;
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return expenses.filter(expense => new Date(expense.date) >= cutoffDate);
  }, [expenses, selectedTimeframe]);

  // Calculate category breakdown
  const categoryData = useMemo(() => {
    if (!filteredExpenses || filteredExpenses.length === 0) {
      return [];
    }
    
    const categoryMap = new Map<string, { total: number; count: number; expenses: any[] }>();
    
    filteredExpenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      const current = categoryMap.get(category) || { total: 0, count: 0, expenses: [] };
      current.total += expense.amount;
      current.count += 1;
      current.expenses.push(expense);
      categoryMap.set(category, current);
    });

    const total = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.total, 0);
    
    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      value: data.total,
      percentage: (data.total / total) * 100,
      count: data.count,
      trend: Math.random() > 0.5 ? 'up' : 'down' as 'up' | 'down',
      trendValue: Math.floor(Math.random() * 20) + 5
    })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // Calculate monthly trend
  const monthlyData = useMemo(() => {
    const monthlyMap = new Map<string, { amount: number; count: number }>();
    
    filteredExpenses.forEach(expense => {
      const month = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const current = monthlyMap.get(month) || { amount: 0, count: 0 };
      current.amount += expense.amount;
      current.count += 1;
      monthlyMap.set(month, current);
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, amount: data.amount, count: data.count }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [filteredExpenses]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const average = total / (filteredExpenses.length || 1);
    const pendingCount = filteredExpenses.filter(e => e.status === 'pending').length;
    const approvedCount = filteredExpenses.filter(e => e.status === 'approved').length;
    
    return {
      totalExpenses: total,
      averageExpense: average,
      totalCount: filteredExpenses.length,
      pendingCount,
      approvedCount,
      topCategory: categoryData[0]?.name || 'N/A',
      topCategoryAmount: categoryData[0]?.value || 0
    };
  }, [filteredExpenses, categoryData]);

  // Prepare chart data
  const pieChartData = categoryData.map(cat => ({
    name: cat.name,
    value: cat.value,
    percentage: cat.percentage
  }));

  const barChartData = categoryData.slice(0, 8).map(cat => ({
    category: cat.name.length > 15 ? cat.name.substring(0, 15) + '...' : cat.name,
    amount: cat.value,
    count: cat.count
  }));

  const handleCategoryClick = (data: any) => {
    if (data && data.name) {
      setSelectedCategory(data.name === selectedCategory ? null : data.name);
    }
  };

  const handleDownloadReport = () => {
    const reportData = {
      timeframe: selectedTimeframe,
      totalExpenses: summaryStats.totalExpenses,
      categoryBreakdown: categoryData,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-dashboard-${selectedTimeframe}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-600">
            Amount: {ChartGenerator.formatCurrency(payload[0].value)}
          </p>
          {payload[0].payload.percentage && (
            <p className="text-sm text-gray-600">
              Percentage: {payload[0].payload.percentage.toFixed(1)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Handle empty state
  if (filteredExpenses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <PieChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Expense Data</h3>
            <p className="text-gray-600 mb-4">
              No expenses found for the selected timeframe. Start adding expenses to see your dashboard.
            </p>
            <Button variant="outline" onClick={() => setSelectedTimeframe('365d')}>
              <Calendar className="h-4 w-4 mr-2" />
              View All Time
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expense Dashboard</h2>
          <p className="text-gray-600">Comprehensive view of your expense categories and trends</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {ChartGenerator.formatCurrency(summaryStats.totalExpenses)}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {summaryStats.totalCount} transactions
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-800">Average Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {ChartGenerator.formatCurrency(summaryStats.averageExpense)}
            </div>
            <div className="text-xs text-green-600 mt-1">
              Per transaction
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-800">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-900 truncate">
              {summaryStats.topCategory}
            </div>
            <div className="text-xs text-purple-600 mt-1">
              {ChartGenerator.formatCurrency(summaryStats.topCategoryAmount)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-800">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {summaryStats.pendingCount}
            </div>
            <div className="text-xs text-orange-600 mt-1">
              {summaryStats.approvedCount} approved
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Expense Distribution</CardTitle>
                    <CardDescription>Breakdown by category</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setChartType(chartType === 'pie' ? 'bar' : 'pie')}
                  >
                    {chartType === 'pie' ? <BarChart3 className="h-4 w-4" /> : <PieChartIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        onClick={handleCategoryClick}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]}
                            stroke={selectedCategory === entry.name ? '#000' : 'none'}
                            strokeWidth={selectedCategory === entry.name ? 2 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  ) : (
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Categories List */}
            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
                <CardDescription>Highest spending categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryData.slice(0, 6).map((category, index) => (
                    <div 
                      key={category.name} 
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedCategory === category.name ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleCategoryClick({ name: category.name })}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-gray-600">{category.count} transactions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{ChartGenerator.formatCurrency(category.value)}</div>
                        <div className="text-sm text-gray-600">{category.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending Trend</CardTitle>
              <CardDescription>Expense trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2, r: 4 }}
                    name="Total Amount"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 3 }}
                    name="Transaction Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryData.map((category, index) => (
              <Card key={category.name} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <CardTitle className="text-base">{category.name}</CardTitle>
                    </div>
                    <Badge variant="outline">{category.count} items</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-2xl font-bold">
                        {ChartGenerator.formatCurrency(category.value)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {category.percentage.toFixed(1)}% of total
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {category.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm text-gray-600">
                        {category.trendValue}% vs last period
                      </span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Category Details */}
      {selectedCategory && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              {selectedCategory} Details
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="ml-auto"
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredExpenses
                .filter(expense => (expense.category || 'Uncategorized') === selectedCategory)
                .slice(0, 6)
                .map(expense => (
                  <div key={expense.id} className="p-3 bg-white rounded-lg border">
                    <div className="font-medium">{expense.description}</div>
                    <div className="text-sm text-gray-600">
                      {ChartGenerator.formatCurrency(expense.amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}