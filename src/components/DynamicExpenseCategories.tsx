import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Tag,
  TrendingUp,
  DollarSign,
  Settings,
  Brain
} from 'lucide-react';
import { useExpenseStore } from '@/store/useExpenseStore';

interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  aiSuggested?: boolean;
  confidence?: number;
}

interface DynamicExpenseCategoriesProps {
  onCategorySelect?: (category: string) => void;
  selectedCategory?: string;
  showAnalytics?: boolean;
}

export const DynamicExpenseCategories: React.FC<DynamicExpenseCategoriesProps> = ({
  onCategorySelect,
  selectedCategory,
  showAnalytics = true
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  const { expenses, addCategory, removeCategory } = useExpenseStore();

  // Predefined categories with colors
  const predefinedCategories = [
    { id: 'office-supplies', name: 'Office Supplies', color: 'bg-blue-100 text-blue-800', description: 'Office materials and supplies', isSystem: true },
    { id: 'travel', name: 'Travel', color: 'bg-green-100 text-green-800', description: 'Travel and transportation expenses', isSystem: true },
    { id: 'meals', name: 'Meals', color: 'bg-orange-100 text-orange-800', description: 'Food and dining expenses', isSystem: true },
    { id: 'equipment', name: 'Equipment', color: 'bg-purple-100 text-purple-800', description: 'Equipment and hardware purchases', isSystem: true },
    { id: 'software', name: 'Software', color: 'bg-indigo-100 text-indigo-800', description: 'Software subscriptions and licenses', isSystem: true },
    { id: 'marketing', name: 'Marketing', color: 'bg-pink-100 text-pink-800', description: 'Marketing and advertising expenses', isSystem: true },
    { id: 'utilities', name: 'Utilities', color: 'bg-yellow-100 text-yellow-800', description: 'Utility bills and services', isSystem: true },
    { id: 'professional-services', name: 'Professional Services', color: 'bg-teal-100 text-teal-800', description: 'Professional and consulting services', isSystem: true },
    { id: 'communication', name: 'Communication', color: 'bg-cyan-100 text-cyan-800', description: 'Phone, internet, and communication services', isSystem: true },
    { id: 'insurance', name: 'Insurance', color: 'bg-red-100 text-red-800', description: 'Insurance premiums and coverage', isSystem: true },
    { id: 'rent', name: 'Rent', color: 'bg-emerald-100 text-emerald-800', description: 'Rental and lease expenses', isSystem: true },
    { id: 'maintenance', name: 'Maintenance', color: 'bg-slate-100 text-slate-800', description: 'Maintenance and repair costs', isSystem: true }
  ];

  useEffect(() => {
    // Initialize with predefined categories and any custom ones from store
    const storeCategories = expenses.length > 0 ? 
      Array.from(new Set(expenses.map(exp => exp.category).filter(Boolean)))
        .map(cat => ({
          id: cat.toLowerCase().replace(/\s+/g, '-'),
          name: cat,
          color: 'bg-gray-100 text-gray-800',
          description: undefined,
          isActive: true,
          isSystem: false,
          createdAt: new Date().toISOString(),
          aiSuggested: false
        } as Category)) : [];

    const allCategories: Category[] = [
      ...predefinedCategories.map(cat => ({ 
        ...cat, 
        isActive: true,
        createdAt: new Date().toISOString(),
        aiSuggested: false
      })),
      ...storeCategories.filter(storeCat => 
        !predefinedCategories.some(preCat => preCat.name === storeCat.name)
      )
    ];

    setCategories(allCategories);
  }, [expenses]);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase().trim())) {
      setError('Category already exists');
      return;
    }

    const newCategory: Category = {
      id: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
      name: newCategoryName.trim(),
      color: 'bg-gray-100 text-gray-800',
      description: newCategoryDescription.trim() || undefined,
      isActive: true,
      isSystem: false,
      createdAt: new Date().toISOString(),
      aiSuggested: false
    };

    setCategories([...categories, newCategory]);
    addCategory(newCategory.name);
    
    setNewCategoryName('');
    setNewCategoryDescription('');
    setIsAddingNew(false);
    setSuccess('Category added successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEditCategory = (categoryId: string, newName: string) => {
    if (!newName.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    setCategories(categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, name: newName.trim() }
        : cat
    ));
    
    setEditingCategory(null);
    setSuccess('Category updated successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category?.isSystem) {
      setError('Cannot delete system categories');
      return;
    }

    setCategories(categories.filter(cat => cat.id !== categoryId));
    removeCategory(categoryId);
    setSuccess('Category deleted successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const toggleCategoryActive = (categoryId: string) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, isActive: !cat.isActive }
        : cat
    ));
  };

  const getCategoryAnalytics = (categoryName: string) => {
    const categoryExpenses = expenses.filter(exp => exp.category === categoryName);
    const totalAmount = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const count = categoryExpenses.length;
    const avgAmount = count > 0 ? totalAmount / count : 0;
    
    return { totalAmount, count, avgAmount };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dynamic Expense Categories</h2>
          <p className="text-gray-600">Manage and customize your expense categories with AI-powered suggestions</p>
        </div>
        <Button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Add New Category Form */}
      {isAddingNew && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">Add New Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name *</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-description">Description</Label>
                <Input
                  id="category-description"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Enter description (optional)"
                  className="bg-white"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAddCategory} className="flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>Add</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingNew(false);
                  setNewCategoryName('');
                  setNewCategoryDescription('');
                  setError('');
                }}
                className="flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const analytics = showAnalytics ? getCategoryAnalytics(category.name) : null;
          const isSelected = selectedCategory === category.name;
          
          return (
            <Card 
              key={category.id} 
              className={`transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-blue-500' : ''
              } ${!category.isActive ? 'opacity-60' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Tag className="w-5 h-5 text-gray-600" />
                    {editingCategory === category.id ? (
                      <Input
                        defaultValue={category.name}
                        onBlur={(e) => handleEditCategory(category.id, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleEditCategory(category.id, e.currentTarget.value);
                          }
                          if (e.key === 'Escape') {
                            setEditingCategory(null);
                          }
                        }}
                        className="h-8 text-sm"
                        autoFocus
                      />
                    ) : (
                      <CardTitle className="text-base">{category.name}</CardTitle>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {category.aiSuggested && (
                      <Brain className="w-4 h-4 text-purple-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCategory(category.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {category.description && (
                  <CardDescription className="text-sm mt-1">
                    {category.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Category Badge */}
                <Badge className={`${category.color} px-2 py-1 text-xs`}>
                  {category.name}
                </Badge>

                {/* Analytics */}
                {analytics && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Expenses:</span>
                      <span className="font-medium">{formatCurrency(analytics.totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Count:</span>
                      <span className="font-medium">{analytics.count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Average:</span>
                      <span className="font-medium">{formatCurrency(analytics.avgAmount)}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => onCategorySelect?.(category.name)}
                    className="flex-1"
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleCategoryActive(category.id)}
                    className="px-2"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
            <p className="text-gray-600 mb-4">
              Start by adding your first expense category or upload expenses to see AI-suggested categories.
            </p>
            <Button onClick={() => setIsAddingNew(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};