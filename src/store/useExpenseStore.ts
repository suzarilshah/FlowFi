import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ExpenseItem {
  id: string;
  userId: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  confidence: number;
  date: string;
  submittedBy: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  extractedText?: string;
  approvedBy?: string;
  rejectionReason?: string;
  aiProcessed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  extractedText?: string;
  suggestedCategory?: string;
  confidence?: number;
  error?: string;
  s3Key?: string;
  documentId?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  paymentTerms: number;
  outstandingAmount: number;
  lastPaymentDate?: string;
  paymentBehavior: 'excellent' | 'good' | 'fair' | 'poor';
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  currentStock: number;
  reorderLevel: number;
  unitPrice: number;
  totalValue: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  supplier?: string;
  lastRestocked?: string;
  expiryDate?: string;
}

interface ExpenseStore {
  // Expenses
  expenses: ExpenseItem[];
  addExpense: (expense: ExpenseItem) => void;
  updateExpense: (id: string, updates: Partial<ExpenseItem>) => void;
  deleteExpense: (id: string) => void;
  approveExpense: (id: string, approvedBy: string) => void;
  rejectExpense: (id: string, rejectionReason: string, rejectedBy: string) => void;
  
  // File Uploads
  uploadedFiles: UploadedFile[];
  addUploadedFile: (file: UploadedFile) => void;
  updateUploadedFile: (id: string, updates: Partial<UploadedFile>) => void;
  removeUploadedFile: (id: string) => void;
  
  // Categories
  categories: string[];
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  
  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  // Inventory
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  
  // Utility functions
  getTotalExpenses: () => number;
  getPendingApprovals: () => ExpenseItem[];
  getExpensesByCategory: () => Record<string, ExpenseItem[]>;
  getOverdueCustomers: () => Customer[];
  getLowStockItems: () => InventoryItem[];
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      expenses: [],
      uploadedFiles: [],
      customers: [],
      inventory: [],
      categories: ['Office Supplies', 'Travel', 'Meals', 'Software', 'Equipment', 'Marketing', 'Utilities', 'Professional Services'],
      
      // Expense management
      addExpense: (expense) => {
        set((state) => ({
          expenses: [...state.expenses, expense],
        }));
      },
      
      updateExpense: (id, updates) => {
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id
              ? { ...expense, ...updates, updatedAt: new Date().toISOString() }
              : expense
          ),
        }));
      },
      
      deleteExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        }));
      },
      
      approveExpense: (id, approvedBy) => {
        get().updateExpense(id, {
          status: 'approved',
          approvedBy,
        });
      },
      
      rejectExpense: (id, rejectionReason, rejectedBy) => {
        get().updateExpense(id, {
          status: 'rejected',
          rejectionReason,
          approvedBy: rejectedBy,
        });
      },
      
      // File upload management
      addUploadedFile: (file) => {
        set((state) => ({
          uploadedFiles: [...state.uploadedFiles, file],
        }));
      },
      
      updateUploadedFile: (id, updates) => {
        set((state) => ({
          uploadedFiles: state.uploadedFiles.map((file) =>
            file.id === id ? { ...file, ...updates } : file
          ),
        }));
      },
      
      removeUploadedFile: (id) => {
        set((state) => ({
          uploadedFiles: state.uploadedFiles.filter((file) => file.id !== id),
        }));
      },
      
      // Category management
      addCategory: (category) => {
        set((state) => ({
          categories: [...state.categories, category],
        }));
      },
      
      removeCategory: (category) => {
        set((state) => ({
          categories: state.categories.filter((cat) => cat !== category),
        }));
      },
      
      // Customer management
      addCustomer: (customer) => {
        const newCustomer: Customer = {
          ...customer,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          customers: [...state.customers, newCustomer],
        }));
      },
      
      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((customer) =>
            customer.id === id ? { ...customer, ...updates } : customer
          ),
        }));
      },
      
      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((customer) => customer.id !== id),
        }));
      },
      
      // Inventory management
      addInventoryItem: (item) => {
        const newItem: InventoryItem = {
          ...item,
          id: generateId(),
        };
        set((state) => ({
          inventory: [...state.inventory, newItem],
        }));
      },
      
      updateInventoryItem: (id, updates) => {
        set((state) => ({
          inventory: state.inventory.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },
      
      deleteInventoryItem: (id) => {
        set((state) => ({
          inventory: state.inventory.filter((item) => item.id !== id),
        }));
      },
      
      // Utility functions
      getTotalExpenses: () => {
        return get().expenses
          .filter((expense) => expense.status === 'approved')
          .reduce((total, expense) => total + expense.amount, 0);
      },
      
      getPendingApprovals: () => {
        return get().expenses.filter((expense) => expense.status === 'pending');
      },
      
      getExpensesByCategory: () => {
        const expenses = get().expenses;
        return expenses.reduce((acc, expense) => {
          if (!acc[expense.category]) {
            acc[expense.category] = [];
          }
          acc[expense.category].push(expense);
          return acc;
        }, {} as Record<string, ExpenseItem[]>);
      },
      
      getOverdueCustomers: () => {
        return get().customers.filter((customer) => customer.outstandingAmount > 0);
      },
      
      getLowStockItems: () => {
        return get().inventory.filter((item) => item.currentStock <= item.reorderLevel);
      },
    }),
    {
      name: 'flowfi-expense-store',
      partialize: (state) => ({
        expenses: state.expenses,
        customers: state.customers,
        inventory: state.inventory,
      }),
    }
  )
);