import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, FileText, Search, Upload, MessageCircle } from 'lucide-react';
import AIDocumentProcessor from '@/components/AzureDocumentProcessor';
import NaturalLanguageQuery from '@/components/NaturalLanguageQuery';
import ChatInterface from '@/components/ChatInterface';

const DocumentIntelligence: React.FC = () => {
  const [activeTab, setActiveTab] = useState('processor');

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Document Intelligence Hub
        </h1>
        <p className="text-muted-foreground">
          Upload documents for AI-powered analysis and query your financial data with natural language
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI-Powered Processing</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AI Document Processing</div>
              <p className="text-xs text-muted-foreground">
                Advanced Document Intelligence + Smart Summarization
              </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Smart Search</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Vector DB</div>
            <p className="text-xs text-muted-foreground">
              Semantic search with natural language queries
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supported Formats</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PDF, JPG, PNG</div>
            <p className="text-xs text-muted-foreground">
              Up to 10MB per document
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="processor" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Document Processor
          </TabsTrigger>
          <TabsTrigger value="query" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Natural Language Query
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            AI Chat Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Document Intelligence Processor</CardTitle>
              <CardDescription>
                Upload invoices and documents for comprehensive AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIDocumentProcessor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Natural Language Document Query</CardTitle>
              <CardDescription>
                Ask questions about your processed documents in plain English
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NaturalLanguageQuery />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Chat Assistant</CardTitle>
              <CardDescription>
                Have a conversation with your financial data using advanced AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChatInterface />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Processing Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                  1
                </div>
                <div>
                  <p className="font-medium">Document Upload</p>
                  <p className="text-sm text-muted-foreground">PDF, JPG, PNG files up to 10MB</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-medium text-green-600">
                  2
                </div>
                <div>
                  <p className="font-medium">AI Document Intelligence</p>
                  <p className="text-sm text-muted-foreground">Extract text, structure, and key fields</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-600">
                  3
                </div>
                <div>
                  <p className="font-medium">AI Summarization</p>
                  <p className="text-sm text-muted-foreground">Generate intelligent insights and summaries</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-medium text-orange-600">
                  4
                </div>
                <div>
                  <p className="font-medium">Vectorization & Storage</p>
                  <p className="text-sm text-muted-foreground">Convert to searchable format and store</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Query Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Badge variant="secondary" className="w-full justify-start">
                <Search className="h-3 w-3 mr-2" />
                "Show me all office supply expenses"
              </Badge>
              
              <Badge variant="secondary" className="w-full justify-start">
                <Search className="h-3 w-3 mr-2" />
                "What was spent on travel this quarter?"
              </Badge>
              
              <Badge variant="secondary" className="w-full justify-start">
                <Search className="h-3 w-3 mr-2" />
                "Find invoices from TechCorp"
              </Badge>
              
              <Badge variant="secondary" className="w-full justify-start">
                <Search className="h-3 w-3 mr-2" />
                "List expenses over $500"
              </Badge>
              
              <Badge variant="secondary" className="w-full justify-start">
                <Search className="h-3 w-3 mr-2" />
                "Show pending approvals"
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentIntelligence;