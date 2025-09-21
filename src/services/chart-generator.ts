import { FinancialReport, ExpenseCategory, MonthlyData } from './report-service';

export interface ChartConfig {
  width: number;
  height: number;
  colors: string[];
  title?: string;
  showLegend: boolean;
  showGrid: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    fill?: boolean;
  }[];
}

export class ChartGenerator {
  private static readonly DEFAULT_COLORS = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1'  // Indigo
  ];

  /**
   * Generate expense breakdown pie chart data
   */
  static generateExpensePieChart(expenseBreakdown: ExpenseCategory[]): ChartData {
    const labels = expenseBreakdown.map(item => item.category);
    const data = expenseBreakdown.map(item => item.amount);
    const colors = this.DEFAULT_COLORS.slice(0, expenseBreakdown.length);

    return {
      labels,
      datasets: [{
        label: 'Expenses by Category',
        data,
        backgroundColor: colors,
        borderColor: colors.map(color => this.darkenColor(color, 0.2))
      }]
    };
  }

  /**
   * Generate monthly trend line chart data
   */
  static generateMonthlyTrendChart(monthlyTrend: MonthlyData[]): ChartData {
    const labels = monthlyTrend.map(item => item.month);
    const revenueData = monthlyTrend.map(item => item.revenue);
    const expenseData = monthlyTrend.map(item => item.expenses);
    const profitData = monthlyTrend.map(item => item.profit);

    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: revenueData,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: false
        },
        {
          label: 'Profit',
          data: profitData,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: false
        }
      ]
    };
  }

  /**
   * Generate expense category bar chart data
   */
  static generateExpenseBarChart(expenseBreakdown: ExpenseCategory[]): ChartData {
    const labels = expenseBreakdown.map(item => item.category);
    const data = expenseBreakdown.map(item => item.amount);
    const colors = this.DEFAULT_COLORS.slice(0, expenseBreakdown.length);

    return {
      labels,
      datasets: [{
        label: 'Amount (RM)',
        data,
        backgroundColor: colors,
        borderColor: colors.map(color => this.darkenColor(color, 0.2))
      }]
    };
  }

  /**
   * Generate profit margin trend chart
   */
  static generateProfitMarginChart(monthlyTrend: MonthlyData[]): ChartData {
    const labels = monthlyTrend.map(item => item.month);
    const marginData = monthlyTrend.map(item => 
      item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0
    );

    return {
      labels,
      datasets: [{
        label: 'Profit Margin (%)',
        data: marginData,
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true
      }]
    };
  }

  /**
   * Generate cash flow chart
   */
  static generateCashFlowChart(cashFlowData: { operating: number; investing: number; financing: number }): ChartData {
    const labels = ['Operating Activities', 'Investing Activities', 'Financing Activities'];
    const data = [cashFlowData.operating, cashFlowData.investing, cashFlowData.financing];
    const colors = ['#10B981', '#F59E0B', '#EF4444'];

    return {
      labels,
      datasets: [{
        label: 'Cash Flow (RM)',
        data,
        backgroundColor: colors,
        borderColor: colors.map(color => this.darkenColor(color, 0.2))
      }]
    };
  }

  /**
   * Generate vendor spending chart
   */
  static generateVendorChart(vendors: Array<{ vendor: string; totalAmount: number }>): ChartData {
    const topVendors = vendors.slice(0, 10); // Top 10 vendors
    const labels = topVendors.map(item => item.vendor);
    const data = topVendors.map(item => item.totalAmount);
    const colors = this.DEFAULT_COLORS.slice(0, topVendors.length);

    return {
      labels,
      datasets: [{
        label: 'Total Spending (RM)',
        data,
        backgroundColor: colors,
        borderColor: colors.map(color => this.darkenColor(color, 0.2))
      }]
    };
  }

  /**
   * Generate comprehensive report charts
   */
  static generateReportCharts(report: any): {
    expensePie: ChartData;
    monthlyTrend: ChartData;
    expenseBar: ChartData;
    profitMargin: ChartData;
    cashFlow: ChartData;
    vendorChart: ChartData;
  } {
    return {
      expensePie: this.generateExpensePieChart(report.data.expenseBreakdown),
      monthlyTrend: this.generateMonthlyTrendChart(report.data.monthlyTrend),
      expenseBar: this.generateExpenseBarChart(report.data.expenseBreakdown),
      profitMargin: this.generateProfitMarginChart(report.data.monthlyTrend),
      cashFlow: this.generateCashFlowChart(report.data.cashFlow),
      vendorChart: this.generateVendorChart(report.data.topVendors)
    };
  }

  /**
   * Helper method to darken a color
   */
  private static darkenColor(color: string, amount: number): string {
    // Remove # if present
    const hex = color.replace('#', '');
    
    // Parse RGB values
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * amount));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * amount));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * amount));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Generate chart configuration options
   */
  static getChartConfig(type: 'pie' | 'line' | 'bar' | 'doughnut', title?: string): any {
    const baseConfig: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            padding: 20,
            usePointStyle: true
          }
        }
      }
    };

    if (title) {
      baseConfig.plugins.title = {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: 20
      };
    }

    switch (type) {
      case 'line':
        return {
          ...baseConfig,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return 'RM ' + value.toLocaleString();
                }
              }
            }
          }
        };
      
      case 'bar':
        return {
          ...baseConfig,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return 'RM ' + value.toLocaleString();
                }
              }
            }
          }
        };
      
      case 'pie':
      case 'doughnut':
        return {
          ...baseConfig,
          plugins: {
            ...baseConfig.plugins,
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  const label = context.label || '';
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: RM ${value.toLocaleString()} (${percentage}%)`;
                }
              }
            }
          }
        };
      
      default:
        return baseConfig;
    }
  }

  /**
   * Format currency for chart labels
   */
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * Format percentage for chart labels
   */
  static formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}