import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { FinancialReport, ReportFilters } from './report-service';

/**
 * Client-side report service that doesn't depend on database connections
 */
export class ReportServiceClient {
  /**
   * Generate a comprehensive financial report using mock data
   */
  async generateFinancialReport(
    userId: string,
    reportType: FinancialReport['reportType'],
    dateRange: { start: Date; end: Date },
    filters?: ReportFilters
  ): Promise<FinancialReport> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock data based on report type and date range
      const mockData = this.generateMockData(reportType, dateRange, filters);
      
      const report: FinancialReport = {
        id: this.generateReportId(),
        userId,
        reportName: this.generateReportName(reportType, dateRange),
        reportType,
        dateRangeStart: dateRange.start,
        dateRangeEnd: dateRange.end,
        filters,
        data: mockData,
        generatedAt: new Date(),
        status: 'completed'
      };

      return report;
    } catch (error) {
      console.error('Error generating financial report:', error);
      throw new Error('Failed to generate financial report');
    }
  }

  /**
   * Generate PDF report
   */
  async generatePDFReport(report: FinancialReport): Promise<Blob> {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(report.reportName, 20, 30);
    
    // Add report info
    doc.setFontSize(10);
    doc.text(`Generated: ${format(report.generatedAt, 'MMM dd, yyyy HH:mm')}`, 20, 45);
    doc.text(`Period: ${format(report.dateRangeStart, 'MMM dd, yyyy')} - ${format(report.dateRangeEnd, 'MMM dd, yyyy')}`, 20, 55);
    
    // Add summary section
    doc.setFontSize(16);
    doc.text('Financial Summary', 20, 75);
    
    const summaryData = [
      ['Total Revenue', `RM ${report.data.summary.totalRevenue.toFixed(2)}`],
      ['Total Expenses', `RM ${report.data.summary.totalExpenses.toFixed(2)}`],
      ['Net Profit', `RM ${report.data.summary.netProfit.toFixed(2)}`],
      ['Profit Margin', `${report.data.summary.profitMargin.toFixed(1)}%`],
      ['Total Transactions', report.data.summary.totalTransactions.toString()]
    ];

    (doc as any).autoTable({
      startY: 85,
      head: [['Metric', 'Amount']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Add expense breakdown
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(16);
    doc.text('Expense Breakdown by Category', 20, finalY);
    
    const expenseData = report.data.expenseBreakdown.map(category => [
      category.category,
      `RM ${category.amount.toFixed(2)}`,
      `${category.percentage.toFixed(1)}%`,
      category.transactionCount.toString()
    ]);

    (doc as any).autoTable({
      startY: finalY + 10,
      head: [['Category', 'Amount', 'Percentage', 'Transactions']],
      body: expenseData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Add monthly trend
    const trendY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(16);
    doc.text('Monthly Trend', 20, trendY);
    
    const trendData = report.data.monthlyTrend.map(month => [
      month.month,
      `RM ${month.revenue.toFixed(2)}`,
      `RM ${month.expenses.toFixed(2)}`,
      `RM ${month.profit.toFixed(2)}`,
      month.transactionCount.toString()
    ]);

    (doc as any).autoTable({
      startY: trendY + 10,
      head: [['Month', 'Revenue', 'Expenses', 'Profit', 'Transactions']],
      body: trendData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Generate the PDF as a Blob
    return doc.output('blob');
  }

  /**
   * Generate mock data for different report types
   */
  private generateMockData(reportType: string, dateRange: { start: Date; end: Date }, filters?: ReportFilters) {
    // Calculate number of months in range
    const monthsDiff = Math.max(1, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    
    // Generate monthly trend data
    const monthlyTrend = Array.from({ length: Math.min(monthsDiff, 12) }, (_, i) => {
      const date = new Date(dateRange.start);
      date.setMonth(date.getMonth() + i);
      
      const baseRevenue = 10000 + Math.random() * 5000;
      const baseExpenses = 3000 + Math.random() * 2000;
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: baseRevenue + (Math.random() - 0.5) * 2000,
        expenses: baseExpenses + (Math.random() - 0.5) * 1000,
        profit: 0, // Will be calculated
        transactionCount: Math.floor(Math.random() * 50) + 20
      };
    }).map(item => ({
      ...item,
      profit: item.revenue - item.expenses
    }));

    // Calculate totals
    const totalRevenue = monthlyTrend.reduce((sum, item) => sum + item.revenue, 0);
    const totalExpenses = monthlyTrend.reduce((sum, item) => sum + item.expenses, 0);
    const totalTransactions = monthlyTrend.reduce((sum, item) => sum + item.transactionCount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Generate expense breakdown
    const expenseCategories = [
      'Office Supplies', 'Marketing', 'Utilities', 'Travel', 'Equipment',
      'Professional Services', 'Software', 'Communication', 'Insurance', 'Other'
    ];

    const expenseBreakdown = expenseCategories.slice(0, 5).map(category => {
      const amount = Math.random() * 5000 + 500;
      const percentage = (amount / totalExpenses) * 100;
      const transactionCount = Math.floor(Math.random() * 20) + 5;
      
      return {
        category,
        amount,
        percentage,
        transactionCount,
        averageAmount: transactionCount > 0 ? amount / transactionCount : 0
      };
    }).sort((a, b) => b.amount - a.amount);

    // Generate top vendors
    const vendors = ['Tech Supply Co', 'Marketing Pro', 'Office Plus', 'Travel Agency', 'Software Solutions'];
    const topVendors = vendors.map(vendor => {
      const totalAmount = Math.random() * 3000 + 200;
      const transactionCount = Math.floor(Math.random() * 15) + 3;
      const categories = ['Equipment', 'Marketing', 'Office Supplies', 'Travel', 'Software'];
      
      return {
        vendor,
        totalAmount,
        transactionCount,
        averageAmount: transactionCount > 0 ? totalAmount / transactionCount : 0,
        category: categories[Math.floor(Math.random() * categories.length)]
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);

    // Generate cash flow data
    const operating = expenseBreakdown
      .filter(cat => ['Office Supplies', 'Utilities', 'Professional Services'].includes(cat.category))
      .reduce((sum, cat) => sum + cat.amount, 0);
    
    const investing = expenseBreakdown
      .filter(cat => ['Equipment', 'Software'].includes(cat.category))
      .reduce((sum, cat) => sum + cat.amount, 0);
    
    const financing = Math.random() * 1000 + 200;
    const netCashFlow = operating + investing + financing;

    return {
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalTransactions,
        averageTransactionAmount: totalTransactions > 0 ? (totalRevenue + totalExpenses) / totalTransactions : 0
      },
      expenseBreakdown,
      monthlyTrend,
      topVendors,
      cashFlow: {
        operating,
        investing,
        financing,
        netCashFlow
      }
    };
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate report name
   */
  private generateReportName(reportType: string, dateRange: { start: Date; end: Date }): string {
    const startStr = format(dateRange.start, 'MMM dd');
    const endStr = format(dateRange.end, 'MMM dd, yyyy');
    
    const typeNames = {
      'profit-loss': 'Profit & Loss Statement',
      'balance-sheet': 'Balance Sheet',
      'cash-flow': 'Cash Flow Statement',
      'expense-breakdown': 'Expense Breakdown',
      'custom': 'Custom Report'
    };

    return `${typeNames[reportType as keyof typeof typeNames]} - ${startStr} to ${endStr}`;
  }

  /**
   * Get user's saved reports (mock implementation)
   */
  async getUserReports(userId: string, limit = 10): Promise<FinancialReport[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return empty array for now, can be expanded later
    return [];
  }

  /**
   * Get report by ID (mock implementation)
   */
  async getReportById(reportId: string): Promise<FinancialReport | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return null;
  }
}

export const reportService = new ReportServiceClient();