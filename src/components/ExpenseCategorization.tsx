import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, AlertTriangle, FileText, Brain, User } from 'lucide-react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { ExpenseItem } from '@/store/useExpenseStore';

const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Travel & Transportation',
  'Meals & Entertainment',
  'Utilities',
  'Marketing & Advertising',
  'Professional Services',
  'Software & Technology',
  'Equipment & Hardware',
  'Insurance',
  'Rent & Facilities',
  'Training & Education',
  'Other'
];

interface CategorizationItem {
  expense: ExpenseItem;
  suggestedCategory: string;
  confidence: number;
  aiReasoning: string;
}

export function ExpenseCategorization() {
  const { expenses, updateExpense } = useExpenseStore();
  const [selectedCategory, setSelectedCategory] = useState<Record<string, string>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  // Simulate AI categorization for pending expenses
  const getCategorizationItems = (): CategorizationItem[] => {
    return expenses
      .filter(expense => expense.status === 'pending' && !expense.approvedBy)
      .map(expense => {
        // Simulate AI categorization based on description
        const description = expense.description.toLowerCase();
        let suggestedCategory = 'Other';
        let confidence = 0.5;
        let aiReasoning = 'General categorization based on description';

        if (description.includes('office') || description.includes('supplies') || description.includes('stationery')) {
          suggestedCategory = 'Office Supplies';
          confidence = 0.85;
          aiReasoning = 'Keywords "office" or "supplies" detected in description';
        } else if (description.includes('travel') || description.includes('transport') || description.includes('fuel') || description.includes('taxi')) {
          suggestedCategory = 'Travel & Transportation';
          confidence = 0.90;
          aiReasoning = 'Transportation-related keywords found';
        } else if (description.includes('meal') || description.includes('lunch') || description.includes('dinner') || description.includes('restaurant')) {
          suggestedCategory = 'Meals & Entertainment';
          confidence = 0.80;
          aiReasoning = 'Food and dining keywords identified';
        } else if (description.includes('software') || description.includes('app') || description.includes('subscription') || description.includes('saas')) {
          suggestedCategory = 'Software & Technology';
          confidence = 0.88;
          aiReasoning = 'Technology and software-related terms detected';
        } else if (description.includes('marketing') || description.includes('advertising') || description.includes('promotion')) {
          suggestedCategory = 'Marketing & Advertising';
          confidence = 0.82;
          aiReasoning = 'Marketing and promotional keywords found';
        } else if (description.includes('utility') || description.includes('electricity') || description.includes('water') || description.includes('internet')) {
          suggestedCategory = 'Utilities';
          confidence = 0.92;
          aiReasoning = 'Utility service keywords detected';
        }

        return {
          expense,
          suggestedCategory,
          confidence,
          aiReasoning
        };
      });
  };

  const categorizationItems = getCategorizationItems();

  const handleApproveCategory = (expenseId: string, category: string, confidence: number) => {
    updateExpense(expenseId, {
      category,
      confidence,
      status: 'approved',
      approvedBy: 'AI System + User Approval'
    });
  };

  const handleRejectCategory = (expenseId: string) => {
    const reason = rejectionReasons[expenseId] || 'Category rejected by user';
    updateExpense(expenseId, {
      status: 'rejected',
      rejectionReason: reason,
      approvedBy: 'User'
    });
  };

  const handleManualCategorize = (expenseId: string) => {
    const category = selectedCategory[expenseId];
    if (category) {
      updateExpense(expenseId, {
        category,
        confidence: 1.0, // Manual categorization has 100% confidence
        status: 'approved',
        approvedBy: 'Manual Categorization'
      });
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-100 text-green-800">High Confidence ({Math.round(confidence * 100)}%)</Badge>;
    } else if (confidence >= 0.6) {
      return <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence ({Math.round(confidence * 100)}%)</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Low Confidence ({Math.round(confidence * 100)}%)</Badge>;
    }
  };

  if (categorizationItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Expense Categorization
          </CardTitle>
          <CardDescription>
            Review and approve AI-suggested expense categories with confidence scoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items pending categorization</h3>
            <p className="text-gray-600">Add expenses or upload invoices to see AI categorization suggestions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Expense Categorization
          </CardTitle>
          <CardDescription>
            Review and approve AI-suggested expense categories with confidence scoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categorizationItems.map((item) => (
              <div key={item.expense.id} className="border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg">{item.expense.description}</h4>
                      {getConfidenceBadge(item.confidence)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>Amount: <span className="font-medium">{item.expense.currency} {item.expense.amount.toFixed(2)}</span></div>
                      <div>Date: <span className="font-medium">{item.expense.date}</span></div>
                      <div>Submitted by: <span className="font-medium">{item.expense.submittedBy}</span></div>
                      <div>Current Category: <span className="font-medium">{item.expense.category || 'Uncategorized'}</span></div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">AI Suggestion</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Suggested Category: {item.suggestedCategory}</p>
                    <p className="text-blue-700">{item.aiReasoning}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApproveCategory(item.expense.id, item.suggestedCategory, item.confidence)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve AI Suggestion
                    </Button>
                    <Button
                      onClick={() => handleRejectCategory(item.expense.id)}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Select
                      value={selectedCategory[item.expense.id] || ''}
                      onValueChange={(value) => setSelectedCategory(prev => ({ ...prev, [item.expense.id]: value }))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Manual category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => handleManualCategorize(item.expense.id)}
                      disabled={!selectedCategory[item.expense.id]}
                      variant="outline"
                      size="sm"
                    >
                      <User className="h-4 w-4 mr-1" />
                      Manual Categorize
                    </Button>
                  </div>
                </div>

                {/* Rejection reason textarea */}
                <div className="mt-4">
                  <Textarea
                    placeholder="Optional: Provide reason for rejection..."
                    value={rejectionReasons[item.expense.id] || ''}
                    onChange={(e) => setRejectionReasons(prev => ({ ...prev, [item.expense.id]: e.target.value }))}
                    className="text-sm"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Categorization Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{categorizationItems.length}</div>
              <div className="text-sm text-blue-700">Pending Review</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {categorizationItems.filter(item => item.confidence >= 0.8).length}
              </div>
              <div className="text-sm text-green-700">High Confidence</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {categorizationItems.filter(item => item.confidence < 0.6).length}
              </div>
              <div className="text-sm text-yellow-700">Needs Review</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}