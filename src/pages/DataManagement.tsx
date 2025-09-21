import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Users, Package, FileText, TrendingUp } from 'lucide-react';
import CustomerImport from '@/components/CustomerImport';
import InventoryImport from '@/components/InventoryImport';
import { useExpenseStore } from '@/store/useExpenseStore';

export default function DataManagement() {
  const { customers, inventory, expenses } = useExpenseStore();

  const getDataStats = () => {
    const totalCustomers = customers?.length || 0;
    const activeCustomers = customers?.filter(c => c.status === 'active').length || 0;
    const totalInventoryItems = inventory?.length || 0;
    const lowStockItems = inventory?.filter(i => i.status === 'low_stock').length || 0;
    const outOfStockItems = inventory?.filter(i => i.status === 'out_of_stock').length || 0;
    const totalInventoryValue = inventory?.reduce((sum, item) => sum + item.totalValue, 0) || 0;
    const totalExpenses = expenses?.length || 0;
    const pendingExpenses = expenses?.filter(e => e.status === 'pending').length || 0;

    return {
      totalCustomers,
      activeCustomers,
      totalInventoryItems,
      lowStockItems,
      outOfStockItems,
      totalInventoryValue,
      totalExpenses,
      pendingExpenses
    };
  };

  const stats = getDataStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
          <p className="text-gray-600">Import and manage your business data</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-gray-600">
              {stats.activeCustomers} active customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInventoryItems}</div>
            <p className="text-xs text-gray-600">
              {stats.lowStockItems} low stock, {stats.outOfStockItems} out of stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {stats.totalInventoryValue.toFixed(2)}</div>
            <p className="text-xs text-gray-600">
              Total asset value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expense Records</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExpenses}</div>
            <p className="text-xs text-gray-600">
              {stats.pendingExpenses} pending approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Import Tabs */}
      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="customers">Customer Import</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Import</TabsTrigger>
          <TabsTrigger value="overview">Data Overview</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <CustomerImport />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryImport />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Data
                </CardTitle>
                <CardDescription>Recent customer records</CardDescription>
              </CardHeader>
              <CardContent>
                {customers && customers.length > 0 ? (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.slice(0, 5).map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.company}</TableCell>
                            <TableCell>
                              <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                                {customer.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {customers.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        And {customers.length - 5} more customers...
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No customer data</h3>
                    <p className="text-gray-600">Import customer data to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inventory Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Inventory Data
                </CardTitle>
                <CardDescription>Current inventory status</CardDescription>
              </CardHeader>
              <CardContent>
                {inventory && inventory.length > 0 ? (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventory.slice(0, 5).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.sku}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  item.status === 'in_stock' ? 'default' : 
                                  item.status === 'low_stock' ? 'secondary' : 'destructive'
                                }
                              >
                                {item.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {inventory.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        And {inventory.length - 5} more items...
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory data</h3>
                    <p className="text-gray-600">Import inventory data to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Export Data
              </CardTitle>
              <CardDescription>
                Export your data for backup or external analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <Users className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                  <h4 className="font-medium mb-2">Customer Data</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Export all customer information as CSV
                  </p>
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    disabled={!customers || customers.length === 0}
                  >
                    Export CSV
                  </button>
                </div>
                
                <div className="p-4 border rounded-lg text-center">
                  <Package className="mx-auto h-8 w-8 text-green-600 mb-2" />
                  <h4 className="font-medium mb-2">Inventory Data</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Export inventory items and stock levels
                  </p>
                  <button 
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    disabled={!inventory || inventory.length === 0}
                  >
                    Export CSV
                  </button>
                </div>
                
                <div className="p-4 border rounded-lg text-center">
                  <FileText className="mx-auto h-8 w-8 text-orange-600 mb-2" />
                  <h4 className="font-medium mb-2">Expense Data</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Export all expense records and receipts
                  </p>
                  <button 
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                    disabled={!expenses || expenses.length === 0}
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}