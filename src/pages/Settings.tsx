import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Building, Bell, Shield, CreditCard, Database, Palette, Globe } from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and system configuration</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>Update your personal information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" defaultValue="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" defaultValue="Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="john@example.com" defaultValue="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="+60 12-345 6789" defaultValue="+60 12-345 6789" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="asia-kuala-lumpur">
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asia-kuala-lumpur">Asia/Kuala Lumpur (GMT+8)</SelectItem>
                        <SelectItem value="asia-singapore">Asia/Singapore (GMT+8)</SelectItem>
                        <SelectItem value="asia-bangkok">Asia/Bangkok (GMT+7)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ms">Bahasa Malaysia</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Company Information</span>
                </CardTitle>
                <CardDescription>Manage your business details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" placeholder="FlowFi Solutions Sdn Bhd" defaultValue="FlowFi Solutions Sdn Bhd" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Registration Number</Label>
                    <Input id="registrationNumber" placeholder="202301234567" defaultValue="202301234567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / GST Number</Label>
                    <Input id="taxId" placeholder="000123456789" defaultValue="000123456789" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select defaultValue="technology">
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea id="address" placeholder="Enter your business address" defaultValue="123 Business Street, Kuala Lumpur, 50000, Malaysia" />
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button>Update Company Info</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>Choose how you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                    <Button 
                      variant={notifications.email ? "default" : "outline"}
                      onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                    >
                      {notifications.email ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Push Notifications</h4>
                      <p className="text-sm text-gray-600">Receive browser push notifications</p>
                    </div>
                    <Button 
                      variant={notifications.push ? "default" : "outline"}
                      onClick={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
                    >
                      {notifications.push ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">SMS Notifications</h4>
                      <p className="text-sm text-gray-600">Receive notifications via SMS</p>
                    </div>
                    <Button 
                      variant={notifications.sms ? "default" : "outline"}
                      onClick={() => setNotifications(prev => ({ ...prev, sms: !prev.sms }))}
                    >
                      {notifications.sms ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">Notification Types</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="invoices" defaultChecked />
                      <Label htmlFor="invoices">Invoice updates</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="expenses" defaultChecked />
                      <Label htmlFor="expenses">Expense approvals</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="reports" defaultChecked />
                      <Label htmlFor="reports">Report generation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="security" defaultChecked />
                      <Label htmlFor="security">Security alerts</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Settings</span>
                </CardTitle>
                <CardDescription>Manage your account security and authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                    <Badge variant="outline">Not Enabled</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Password</h4>
                      <p className="text-sm text-gray-600">Last changed 30 days ago</p>
                    </div>
                    <Button variant="outline">Change Password</Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Login Sessions</h4>
                      <p className="text-sm text-gray-600">Manage your active sessions</p>
                    </div>
                    <Button variant="outline">View Sessions</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Billing & Subscription</span>
                </CardTitle>
                <CardDescription>Manage your subscription and payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Current Plan</h4>
                      <p className="text-sm text-gray-600">Professional Plan - RM 99/month</p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Next Billing Date</h4>
                      <p className="text-sm text-gray-600">February 15, 2024</p>
                    </div>
                    <Button variant="outline">View Invoice</Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Payment Method</h4>
                      <p className="text-sm text-gray-600">•••• •••• •••• 1234</p>
                    </div>
                    <Button variant="outline">Update</Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex space-x-4">
                  <Button>Upgrade Plan</Button>
                  <Button variant="outline">Download Invoices</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Integrations</span>
                </CardTitle>
                <CardDescription>Connect FlowFi with your favorite tools and services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">AWS Services</h4>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Cloud storage and AI services</p>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Bank Integration</h4>
                      <Badge variant="outline">Not Connected</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Automatic transaction import</p>
                    <Button size="sm">Connect</Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Email Integration</h4>
                      <Badge variant="outline">Not Connected</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Automated invoice sending</p>
                    <Button size="sm">Connect</Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Accounting Software</h4>
                      <Badge variant="outline">Not Connected</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Sync with existing accounting tools</p>
                    <Button size="sm">Connect</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}