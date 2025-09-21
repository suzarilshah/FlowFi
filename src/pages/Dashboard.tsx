import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, DollarSign, TrendingUp, AlertCircle, Upload, FileText, MessageSquare, Brain } from "lucide-react";
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="min-h-screen animate-fade-in" role="main" aria-label="Financial Dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3" id="dashboard-title">
            Dashboard
          </h1>
          <p className="text-lg text-gray-600">Welcome to FlowFi - Your Financial Management Hub</p>
        </div>

        {/* Financial Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8" role="region" aria-labelledby="overview-heading">
            <h2 id="overview-heading" className="sr-only">Financial Overview</h2>
          <Card className="card-hover border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300" role="article" aria-labelledby="total-balance">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700" id="total-balance">Cash Position</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">RM 45,231.89</div>
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="font-medium">+20.1% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Monthly Revenue</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">RM 12,234.00</div>
              <div className="flex items-center text-sm text-blue-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="font-medium">+15.2% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Pending Approvals</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-2">8</div>
              <p className="text-sm text-orange-600 font-medium">Expenses awaiting review</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Overdue Payments</CardTitle>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 mb-2">3</div>
              <p className="text-sm text-red-600 font-medium">Requiring immediate attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-12 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-semibold text-gray-900">Quick Actions</CardTitle>
            <CardDescription className="text-gray-600">Frequently used features for efficient workflow</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Link to="/document-intelligence" className="h-24 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-100 hover:border-blue-200 text-blue-700 hover:text-blue-800 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg" aria-label="Document Intelligence">
                <Brain className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-center">Document Intelligence</span>
              </Link>
              <Link to="/reports" className="h-24 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-100 hover:border-green-200 text-green-700 hover:text-green-800 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-lg" aria-label="Generate Report">
                <FileText className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-center">Generate Report</span>
              </Link>
              <Button className="h-24 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 border-2 border-purple-100 hover:border-purple-200 text-purple-700 hover:text-purple-800 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2" aria-label="AI Assistant">
                <MessageSquare className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-center">AI Assistant</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-semibold text-gray-900">Alerts & Notifications</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Low Inventory Alert</p>
                    <p className="text-sm text-gray-600">Office supplies below reorder threshold</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200">Action Required</Badge>
              </div>
              
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Payment Overdue</p>
                    <p className="text-sm text-gray-600">ABC Corp - Invoice #INV-001 (RM 2,500)</p>
                  </div>
                </div>
                <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">Urgent</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}