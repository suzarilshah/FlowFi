import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Receipt, TrendingUp, FileText, Settings, DollarSign, Database } from "lucide-react";

export default function Home() {
  const features = [
    {
      title: "Dashboard",
      description: "Get a comprehensive overview of your financial health",
      icon: BarChart3,
      link: "/dashboard",
      color: "bg-blue-500"
    },
    {
      title: "Expense Management",
      description: "AI-powered invoice processing and categorization",
      icon: Receipt,
      link: "/expenses",
      color: "bg-red-500"
    },
    {
      title: "Income Tracking",
      description: "Manage invoices and track revenue streams",
      icon: DollarSign,
      link: "/income",
      color: "bg-green-500"
    },
    {
      title: "Data Management",
      description: "Import and manage customer and inventory data",
      icon: Database,
      link: "/data-management",
      color: "bg-indigo-500"
    },
    {
      title: "Financial Reports",
      description: "Generate comprehensive financial statements",
      icon: FileText,
      link: "/reports",
      color: "bg-purple-500"
    },
    {
      title: "Settings",
      description: "Configure your account and preferences",
      icon: Settings,
      link: "/settings",
      color: "bg-gray-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">FlowFi</h1>
            </div>
            <Link to="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">FlowFi</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Your intelligent accounting companion for small and medium businesses. 
            Streamline your financial operations with AI-powered insights and automation.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Link key={index} to={feature.link}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${feature.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Key Benefits */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose FlowFi?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Insights</h3>
              <p className="text-gray-600">
                Leverage artificial intelligence for automated categorization and financial insights.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Analytics</h3>
              <p className="text-gray-600">
                Get instant insights into your business performance with real-time dashboards.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Comprehensive Reports</h3>
              <p className="text-gray-600">
                Generate detailed financial reports and statements with just a few clicks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 FlowFi. All rights reserved. Built with modern web technologies.</p>
          </div>
        </div>
      </div>
    </div>
  );
}