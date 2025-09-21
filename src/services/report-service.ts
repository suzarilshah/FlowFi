import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { db } from '../database/connection';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';

export interface FinancialReport {
  id: string;
  userId: string;
  reportName: string;
  reportType: 'profit-loss' | 'balance-sheet' | 'cash-flow' | 'expense-breakdown' | 'custom';
  dateRangeStart: Date;
  dateRangeEnd: Date;
  filters?: ReportFilters;
  data: ReportData;
  generatedAt: Date;
  status: 'generating' | 'completed' | 'failed';
}

export interface ReportFilters {
  categories?: string[];
  vendors?: string[];
  minAmount?: number;
  maxAmount?: number;
  status?: ('pending' | 'approved' | 'rejected')[];
}

export interface ReportData {
  summary: FinancialSummary;
  expenseBreakdown: ExpenseCategory[];
  monthlyTrend: MonthlyData[];
  topVendors: VendorData[];
  cashFlow: CashFlowData;
  balanceSheet?: BalanceSheetData;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalTransactions: number;
  averageTransactionAmount: number;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  averageAmount: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  transactionCount: number;
}

export interface VendorData {
  vendor: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  category: string;
}

export interface CashFlowData {
  operating: number;
  investing: number;
  financing: number;
  netCashFlow: number;
}

export interface BalanceSheetData {
  assets: {
    current: number;
    nonCurrent: number;
    total: number;
  };
  liabilities: {
    current: number;
    longTerm: number;
    total: number;
  };
  equity: number;
}

export class ReportService {
  private db = db;

  /**
   * Generate a comprehensive financial report
   */
  async generateFinancialReport(
    userId: string,
    reportType: FinancialReport['reportType'],
    dateRange: { start: Date; end: Date },
    filters?: ReportFilters
  ): Promise<FinancialReport> {
    try {
      // Get financial data from database
      const expenseData = await this.getExpenseData(userId, dateRange, filters);
      const revenueData = await this.getRevenueData(userId, dateRange);
      
      // Calculate financial metrics
      const summary = this.calculateFinancialSummary(expenseData, revenueData);
      const expenseBreakdown = this.calculateExpenseBreakdown(expenseData);
      const monthlyTrend = this.calculateMonthlyTrend(expenseData, revenueData, dateRange);
      const topVendors = this.getTopVendors(expenseData);
      const cashFlow = this.calculateCashFlow(expenseData);

      const report: FinancialReport = {
        id: this.generateReportId(),
        userId,
        reportName: this.generateReportName(reportType, dateRange),
        reportType,
        dateRangeStart: dateRange.start,
        dateRangeEnd: dateRange.end,
        filters,
        data: {
          summary,
          expenseBreakdown,
          monthlyTrend,
          topVendors,
          cashFlow
        },
        generatedAt: new Date(),
        status: 'completed'
      };

      // Save report to database
      await this.saveReportToDatabase(report);

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
      `RM ${month.profit.toFixed(2)}`
    ]);

    (doc as any).autoTable({
      startY: trendY + 10,
      head: [['Month', 'Revenue', 'Expenses', 'Profit']],
      body: trendData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Return as Blob
    return doc.output('blob');
  }

  /**
   * Get expense data from database
   */
  private async getExpenseData(
    userId: string,
    dateRange: { start: Date; end: Date },
    filters?: ReportFilters
  ) {
    const client = await this.db.getClient();
    
    let query = `
      SELECT e.*, c.name as category_name
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = $1 
      AND e.created_at >= $2 
      AND e.created_at <= $3
    `;
    
    const params = [userId, dateRange.start, dateRange.end];
    let paramIndex = 4;

    if (filters?.categories?.length) {
      query += ` AND c.name = ANY($${paramIndex})`;
      params.push(`{${filters.categories.join(',')}}`);
      paramIndex++;
    }

    if (filters?.status?.length) {
      query += ` AND e.status = ANY($${paramIndex})`;
      params.push(`{${filters.status.join(',')}}`);
      paramIndex++;
    }

    if (filters?.minAmount) {
      query += ` AND e.amount >= $${paramIndex}`;
      params.push(filters.minAmount.toString());
      paramIndex++;
    }

    if (filters?.maxAmount) {
      query += ` AND e.amount <= $${paramIndex}`;
      params.push(filters.maxAmount.toString());
      paramIndex++;
    }

    const result = await client.query(query, params);
    return result.rows;
  }

  /**
   * Get revenue data (mock implementation - would come from invoices/sales)
   */
  private async getRevenueData(userId: string, dateRange: { start: Date; end: Date }) {
    // Mock revenue data - in real implementation, this would come from invoices/sales table
    const monthsDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    return Array.from({ length: monthsDiff }, (_, i) => ({
      date: new Date(dateRange.start.getFullYear(), dateRange.start.getMonth() + i, 1),
      amount: 45000 + Math.random() * 10000 // Mock revenue between 45k-55k
    }));
  }

  /**
   * Calculate financial summary
   */
  private calculateFinancialSummary(expenseData: any[], revenueData: any[]): FinancialSummary {
    const totalExpenses = expenseData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const totalRevenue = revenueData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const totalTransactions = expenseData.length;
    const averageTransactionAmount = totalTransactions > 0 ? totalExpenses / totalTransactions : 0;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      totalTransactions,
      averageTransactionAmount
    };
  }

  /**
   * Calculate expense breakdown by category
   */
  private calculateExpenseBreakdown(expenseData: any[]): ExpenseCategory[] {
    const categoryMap = new Map<string, { amount: number; count: number }>();
    
    expenseData.forEach(item => {
      const category = item.category_name || 'Uncategorized';
      const current = categoryMap.get(category) || { amount: 0, count: 0 };
      current.amount += parseFloat(item.amount);
      current.count += 1;
      categoryMap.set(category, current);
    });

    const totalAmount = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.amount, 0);
    
    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      transactionCount: data.count,
      averageAmount: data.count > 0 ? data.amount / data.count : 0
    })).sort((a, b) => b.amount - a.amount);
  }

  /**
   * Calculate monthly trend
   */
  private calculateMonthlyTrend(
    expenseData: any[],
    revenueData: any[],
    dateRange: { start: Date; end: Date }
  ): MonthlyData[] {
    const monthlyMap = new Map<string, { revenue: number; expenses: number; count: number }>();
    
    // Initialize all months in range
    const current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      const monthKey = format(current, 'MMM yyyy');
      monthlyMap.set(monthKey, { revenue: 0, expenses: 0, count: 0 });
      current.setMonth(current.getMonth() + 1);
    }

    // Add expense data
    expenseData.forEach(item => {
      const monthKey = format(new Date(item.created_at), 'MMM yyyy');
      const current = monthlyMap.get(monthKey) || { revenue: 0, expenses: 0, count: 0 };
      current.expenses += parseFloat(item.amount);
      current.count += 1;
      monthlyMap.set(monthKey, current);
    });

    // Add revenue data
    revenueData.forEach(item => {
      const monthKey = format(new Date(item.date), 'MMM yyyy');
      const current = monthlyMap.get(monthKey) || { revenue: 0, expenses: 0, count: 0 };
      current.revenue += parseFloat(item.amount);
      monthlyMap.set(monthKey, current);
    });

    return Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.revenue - data.expenses,
      transactionCount: data.count
    }));
  }

  /**
   * Get top vendors
   */
  private getTopVendors(expenseData: any[]): VendorData[] {
    const vendorMap = new Map<string, { amount: number; count: number; category: string }>();
    
    expenseData.forEach(item => {
      const vendor = item.vendor || 'Unknown Vendor';
      const current = vendorMap.get(vendor) || { amount: 0, count: 0, category: item.category_name || 'Uncategorized' };
      current.amount += parseFloat(item.amount);
      current.count += 1;
      vendorMap.set(vendor, current);
    });

    return Array.from(vendorMap.entries())
      .map(([vendor, data]) => ({
        vendor,
        totalAmount: data.amount,
        transactionCount: data.count,
        averageAmount: data.count > 0 ? data.amount / data.count : 0,
        category: data.category
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }

  /**
   * Calculate cash flow
   */
  private calculateCashFlow(expenseData: any[]): CashFlowData {
    // Mock cash flow categorization - in real implementation, this would be more sophisticated
    const operating = expenseData
      .filter(item => ['Office Supplies', 'Utilities', 'Professional Services'].includes(item.category_name))
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    const investing = expenseData
      .filter(item => ['Equipment', 'Technology', 'Software'].includes(item.category_name))
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    const financing = expenseData
      .filter(item => ['Loan Payments', 'Interest'].includes(item.category_name))
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);

    const netCashFlow = operating + investing + financing;

    return {
      operating,
      investing,
      financing,
      netCashFlow
    };
  }

  /**
   * Save report to database
   */
  private async saveReportToDatabase(report: FinancialReport) {
    const client = await this.db.getClient();
    
    const query = `
      INSERT INTO reports (id, user_id, report_name, report_type, date_range_start, date_range_end, filters, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        report_name = EXCLUDED.report_name,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at
    `;

    await client.query(query, [
      report.id,
      report.userId,
      report.reportName,
      report.reportType,
      report.dateRangeStart,
      report.dateRangeEnd,
      JSON.stringify(report.filters || {}),
      report.status,
      report.generatedAt,
      new Date()
    ]);
  }

  /**
   * Get user's saved reports
   */
  async getUserReports(userId: string, limit = 10): Promise<FinancialReport[]> {
    const client = await this.db.getClient();
    
    const query = `
      SELECT * FROM reports
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await client.query(query, [userId, limit]);
    return result.rows.map(this.mapDatabaseReportToFinancialReport);
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string): Promise<FinancialReport | null> {
    const client = await this.db.getClient();
    
    const query = 'SELECT * FROM reports WHERE id = $1';
    const result = await client.query(query, [reportId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDatabaseReportToFinancialReport(result.rows[0]);
  }

  /**
   * Helper method to map database report to FinancialReport
   */
  private mapDatabaseReportToFinancialReport(dbReport: any): FinancialReport {
    return {
      id: dbReport.id,
      userId: dbReport.user_id,
      reportName: dbReport.report_name,
      reportType: dbReport.report_type,
      dateRangeStart: new Date(dbReport.date_range_start),
      dateRangeEnd: new Date(dbReport.date_range_end),
      filters: dbReport.filters || {},
      data: dbReport.data || {}, // This would need to be properly structured
      generatedAt: new Date(dbReport.created_at),
      status: dbReport.status
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
}

export const reportService = new ReportService();