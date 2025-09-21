import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  MessageSquare, 
  FileText, 
  Brain, 
  Database, 
  Send, 
  RefreshCw,
  Filter,
  Clock,
  DollarSign,
  User,
  Calendar
} from 'lucide-react';
import { createAIService } from '@/services/ai-document-service';
import { createVectorizationService } from '@/services/vectorization-service';

export interface QueryResult {
  answer: string;
  confidence: number;
  sources: Array<{
    documentId: string;
    fileName: string;
    similarity: number;
    content: string;
    metadata: any;
  }>;
  relatedQueries: string[];
  processingTime: number;
}

export interface QueryHistory {
  id: string;
  query: string;
  timestamp: string;
  results: QueryResult;
}

const exampleQueries = [
  'Show my expenses this month',
  'What did I spend on office supplies?',
  'Compare spending by vendor',
  'Find my highest expense this year',
  'Show expense trends over time'
];

const NaturalLanguageQuery: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    dateRange: '',
    amountRange: '',
    vendor: '',
  });

  const aiService = createAIService();
  const vectorizationService = createVectorizationService();

  const handleQuerySubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    const startTime = Date.now();

    try {
      // Step 1: Vector search for relevant documents
      const vectorResults = await vectorizationService.searchSimilarDocuments({
        query: query,
        topK: 10,
        threshold: 0.5,
        filters: buildFilters(),
      });

      if (vectorResults.length === 0) {
        setQueryResult({
          answer: "I couldn't find any relevant documents matching your query. Try rephrasing your question or check if any documents have been processed.",
          confidence: 0,
          sources: [],
          relatedQueries: [],
          processingTime: Date.now() - startTime,
        });
        return;
      }

      // Step 2: Prepare context for AI analysis
      const documentContext = vectorResults.map(result => 
        `Document: ${result.document.metadata.fileName}\n` +
        `Category: ${result.document.metadata.category}\n` +
        `Summary: ${result.document.metadata.summary}\n` +
        `Entities: ${JSON.stringify(result.document.metadata.extractedEntities, null, 2)}`
      );

      // Step 3: Generate natural language answer
      const aiAnswer = await aiService.generateNaturalLanguageQuery(query, documentContext);

      // Step 4: Format results
      const result: QueryResult = {
        answer: aiAnswer,
        confidence: calculateConfidence(vectorResults),
        sources: vectorResults.map(result => ({
          documentId: result.document.id,
          fileName: result.document.metadata.fileName,
          similarity: result.similarity,
          content: result.document.content,
          metadata: result.document.metadata,
        })),
        relatedQueries: generateRelatedQueries(query),
        processingTime: Date.now() - startTime,
      };

      setQueryResult(result);

      // Add to history
      const historyItem: QueryHistory = {
        id: `query_${Date.now()}`,
        query: query,
        timestamp: new Date().toISOString(),
        results: result,
      };
      setQueryHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10

    } catch (error) {
      console.error('Query processing failed:', error);
      setError(error instanceof Error ? error.message : 'Query processing failed');
    } finally {
      setIsProcessing(false);
    }
  }, [query, isProcessing, filters, aiService, vectorizationService]);

  const buildFilters = () => {
    const activeFilters: Record<string, any> = {};
    
    if (filters.category) {
      activeFilters.category = filters.category;
    }
    if (filters.vendor) {
      activeFilters.extractedEntities = { vendor: filters.vendor };
    }
    if (filters.dateRange) {
      activeFilters.uploadDate = filters.dateRange;
    }
    
    return activeFilters;
  };

  const calculateConfidence = (results: any[]): number => {
    if (results.length === 0) return 0;
    const avgSimilarity = results.reduce((sum, result) => sum + result.similarity, 0) / results.length;
    return Math.round(avgSimilarity * 100);
  };

  const generateRelatedQueries = (originalQuery: string): string[] => {
    const related = [];
    const lowerQuery = originalQuery.toLowerCase();
    
    if (lowerQuery.includes('expense') || lowerQuery.includes('spending')) {
      related.push('Show expense trends over time');
      related.push('Compare spending by category');
    }
    if (lowerQuery.includes('vendor') || lowerQuery.includes('supplier')) {
      related.push('List all vendors');
      related.push('Show vendor spending comparison');
    }
    if (lowerQuery.includes('amount') || lowerQuery.includes('$')) {
      related.push('Find highest expenses');
      related.push('Show budget vs actual');
    }
    
    return related.slice(0, 3);
  };

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  const clearQuery = () => {
    setQuery('');
    setQueryResult(null);
    setError(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Natural Language Document Query
          </CardTitle>
          <CardDescription>
            Ask questions about your processed documents in plain English
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQuerySubmit} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Ask a question about your documents..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isProcessing}
                  className="w-full"
                />
              </div>
              <Button type="submit" disabled={isProcessing || !query.trim()}>
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isProcessing ? 'Processing...' : 'Ask'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                disabled={isProcessing}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {showFilters && (
              <div className="grid gap-3 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Input
                      placeholder="e.g., office_supplies"
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Vendor</label>
                    <Input
                      placeholder="e.g., TechCorp"
                      value={filters.vendor}
                      onChange={(e) => setFilters(prev => ({ ...prev, vendor: e.target.value }))}
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </div>
            )}
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Example Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleExampleClick(example)}
                disabled={isProcessing}
              >
                {example}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {queryResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Query Result</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Confidence: {queryResult.confidence}%
                </Badge>
                <Badge variant="outline">
                  {queryResult.processingTime}ms
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Answer</h4>
                <p className="text-gray-700">{queryResult.answer}</p>
              </div>

              {queryResult.sources.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Source Documents ({queryResult.sources.length})
                  </h4>
                  <ScrollArea className="h-48 border rounded-lg">
                    <div className="p-4 space-y-3">
                      {queryResult.sources.map((source, index) => (
                        <div key={index} className="border-b pb-3 last:border-b-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-sm">{source.fileName}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(source.similarity * 100)}% match
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            {source.metadata.extractedEntities?.vendor && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{source.metadata.extractedEntities.vendor}</span>
                              </div>
                            )}
                            {source.metadata.extractedEntities?.amount && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <span>{formatCurrency(source.metadata.extractedEntities.amount)}</span>
                              </div>
                            )}
                            {source.metadata.extractedEntities?.date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(source.metadata.extractedEntities.date)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{source.metadata.category}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {queryResult.relatedQueries.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Related Queries</h4>
                  <div className="flex flex-wrap gap-2">
                    {queryResult.relatedQueries.map((relatedQuery, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleExampleClick(relatedQuery)}
                      >
                        {relatedQuery}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {queryHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Query History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {queryHistory.map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <Button
                        variant="link"
                        className="p-0 h-auto text-left"
                        onClick={() => setQuery(item.query)}
                      >
                        {item.query}
                      </Button>
                      <Badge variant="outline" className="text-xs">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Confidence: {item.results.confidence}%</span>
                      <span>•</span>
                      <span>{item.results.sources.length} sources</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NaturalLanguageQuery;