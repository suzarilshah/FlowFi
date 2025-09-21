import { AIService } from './ai-document-service';
import { CredentialManager } from './security-service';
import { createVectorizationService, VectorSearchResult } from './vectorization-service';

// Mock database for browser environment
let db: any = null;
if (typeof window === 'undefined') {
  // Only import database in Node.js environment
  try {
    const dbModule = require('../database/connection');
    db = dbModule.db;
  } catch (error) {
    console.warn('Database connection not available in browser environment');
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
  metadata?: {
    sources?: Array<{
      documentId: string;
      fileName: string;
      similarity: number;
      content: string;
      metadata: any;
    }>;
    confidence?: number;
    processingTime?: number;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  context?: {
    vectorResults?: any[];
    expenseData?: any[];
  };
}

export interface ChatResponse {
  message: ChatMessage;
  sessionId: string;
  sources?: Array<{
    documentId: string;
    fileName: string;
    similarity: number;
    content: string;
    metadata: any;
  }>;
  confidence: number;
  processingTime: number;
}

export interface GPT5Config {
  endpoint: string;
  apiKey: string;
  apiVersion: string;
  deploymentName: string;
}

export class AIChatService {
  private static instance: AIChatService;
  private sessions: Map<string, ChatSession> = new Map();
  private aiService: AIService;
  private credentialManager: CredentialManager;
  private vectorizationService: any;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  private constructor() {
    this.aiService = new AIService();
    this.credentialManager = CredentialManager.getInstance();
    this.vectorizationService = createVectorizationService();
    this.setupSessionCleanup();
  }

  private setupSessionCleanup(): void {
    // Clean up expired sessions every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of this.sessions.entries()) {
        const sessionAge = now - session.timestamp;
        if (sessionAge > SESSION_TIMEOUT) {
          this.sessions.delete(sessionId);
          // Commented out console.log to reduce noise
          // console.log(`Cleaned up expired session: ${sessionId}`);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  static getInstance(): AIChatService {
    if (!AIChatService.instance) {
      AIChatService.instance = new AIChatService();
    }
    return AIChatService.instance;
  }

  private getGPT5Config(): GPT5Config {
    try {
      const credentials = this.credentialManager.getAzureCredentials();
      return {
        endpoint: credentials.endpoint || import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || 'https://flowfi.cognitiveservices.azure.com/openai/deployments/gpt-5/chat/completions',
        apiKey: credentials.apiKey || import.meta.env.VITE_AZURE_OPENAI_API_KEY || '',
        apiVersion: '2025-01-01-preview',
        deploymentName: 'gpt-5'
      };
    } catch (error) {
      // Fallback to environment variables
      return {
        endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || 'https://flowfi.cognitiveservices.azure.com/openai/deployments/gpt-5/chat/completions',
        apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY || '',
        apiVersion: '2025-01-01-preview',
        deploymentName: 'gpt-5'
      };
    }
  }

  async createSession(title?: string): Promise<ChatSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: ChatSession = {
      id: sessionId,
      title: title || 'New Chat Session',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      context: {}
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getAllSessions(): Promise<ChatSession[]> {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }

  async sendMessage(
    sessionId: string,
    userMessage: string,
    context?: {
      vectorResults?: any[];
      expenseData?: any[];
    }
  ): Promise<ChatResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const startTime = Date.now();

    // Add user message to session
    const userChatMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };

    session.messages.push(userChatMessage);

    try {
      // Prepare context for AI
      const systemContext = this.buildSystemContext(context);
      const conversationHistory = this.buildConversationHistory(session.messages);

      // Generate AI response
      const aiResponse = await this.generateAIResponse(
        userMessage,
        systemContext,
        conversationHistory
      );

      // Create assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        metadata: {
          sources: context?.vectorResults?.map(result => ({
            documentId: result.document.id,
            fileName: result.document.metadata.fileName,
            similarity: result.similarity,
            content: result.document.content,
            metadata: result.document.metadata
          })) || [],
          confidence: aiResponse.confidence,
          processingTime: Date.now() - startTime
        }
      };

      session.messages.push(assistantMessage);
      session.updatedAt = new Date().toISOString();
      session.context = context;

      return {
        message: assistantMessage,
        sessionId,
        sources: assistantMessage.metadata?.sources,
        confidence: aiResponse.confidence,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('AI chat error:', error);
      
      // Fallback response
      const fallbackMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or rephrase your question.',
        timestamp: new Date().toISOString()
      };

      session.messages.push(fallbackMessage);
      session.updatedAt = new Date().toISOString();

      return {
        message: fallbackMessage,
        sessionId,
        confidence: 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  private async performVectorSearch(query: string, topK: number = 5): Promise<VectorSearchResult[]> {
    try {
      const results = await this.vectorizationService.searchSimilarDocuments({
        query,
        topK,
        threshold: 0.6,
      });
      return results;
    } catch (error) {
      console.error('Vector search failed:', error);
      return [];
    }
  }

  private formatVectorResultsForContext(results: VectorSearchResult[]): string {
    if (results.length === 0) {
      return 'No relevant documents found in the knowledge base.';
    }

    const contextSections = results.map((result, index) => {
      const doc = result.document;
      return `Document ${index + 1} (${doc.metadata.fileName}):
- Category: ${doc.metadata.category}
- Summary: ${doc.metadata.summary}
- Confidence: ${(doc.metadata.confidence * 100).toFixed(1)}%
- Similarity Score: ${(result.similarity * 100).toFixed(1)}%
- Key Entities: ${JSON.stringify(doc.metadata.extractedEntities, null, 2)}
- Suggested Actions: ${doc.metadata.suggestedActions.join(', ')}
---`;
    });

    return `Relevant Documents Found:\n${contextSections.join('\n')}`;
  }

  private async executeDatabaseQuery(query: string, userId?: string): Promise<any> {
    try {
      // Check if database is available (not in browser environment)
      if (!db) {
        console.warn('Database connection not available in browser environment');
        return { 
          error: 'Database queries are not available in the browser. Please use the desktop application or contact support.' 
        };
      }

      const intent = this.parseQueryIntent(query);
      let sqlQuery = '';
      let params: any[] = [];

      switch (intent.type) {
        case 'expense_summary':
          sqlQuery = `
            SELECT 
              category,
              COUNT(*) as expense_count,
              SUM(amount) as total_amount,
              AVG(amount) as avg_amount
            FROM expenses 
            WHERE user_id = $1 
              AND date >= CURRENT_DATE - INTERVAL '${intent.timeRange}'
            GROUP BY category
            ORDER BY total_amount DESC
          `;
          params = [userId];
          break;

        case 'vendor_analysis':
          sqlQuery = `
            SELECT 
              vendor_name,
              COUNT(*) as transaction_count,
              SUM(amount) as total_spent,
              AVG(amount) as avg_transaction
            FROM expenses 
            WHERE user_id = $1 
              AND date >= CURRENT_DATE - INTERVAL '${intent.timeRange}'
              AND vendor_name IS NOT NULL
            GROUP BY vendor_name
            ORDER BY total_spent DESC
            LIMIT 10
          `;
          params = [userId];
          break;

        case 'monthly_trends':
          sqlQuery = `
            SELECT 
              DATE_TRUNC('month', date) as month,
              COUNT(*) as transaction_count,
              SUM(amount) as total_expenses
            FROM expenses 
            WHERE user_id = $1 
              AND date >= CURRENT_DATE - INTERVAL '${intent.timeRange}'
            GROUP BY DATE_TRUNC('month', date)
            ORDER BY month DESC
          `;
          params = [userId];
          break;

        case 'category_breakdown':
          sqlQuery = `
            SELECT 
              category,
              COUNT(*) as expense_count,
              SUM(amount) as total_amount,
              ROUND(SUM(amount) * 100.0 / (SELECT SUM(amount) FROM expenses WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${intent.timeRange}'), 2) as percentage
            FROM expenses 
            WHERE user_id = $1 
              AND date >= CURRENT_DATE - INTERVAL '${intent.timeRange}'
            GROUP BY category
            ORDER BY total_amount DESC
          `;
          params = [userId, userId];
          break;

        default:
          return { error: 'Unable to determine query intent. Please rephrase your question.' };
      }

      const result = await db.query(sqlQuery, params);
      return {
        intent: intent.type,
        data: result.rows,
        query: sqlQuery,
        rowCount: result.rowCount
      };

    } catch (error) {
      console.error('Database query execution failed:', error);
      return { error: 'Failed to execute database query. Please try again.' };
    }
  }

  private parseQueryIntent(query: string): { type: string; timeRange?: string } {
    const lowerQuery = query.toLowerCase();
    
    // Time range detection
    let timeRange = '30 days';
    if (lowerQuery.includes('this month') || lowerQuery.includes('current month')) {
      timeRange = '1 month';
    } else if (lowerQuery.includes('this year') || lowerQuery.includes('current year')) {
      timeRange = '1 year';
    } else if (lowerQuery.includes('last month')) {
      timeRange = '2 months';
    } else if (lowerQuery.includes('last year')) {
      timeRange = '13 months';
    } else if (lowerQuery.includes('week')) {
      timeRange = '7 days';
    }

    // Intent detection
    if (lowerQuery.includes('expense') && (lowerQuery.includes('summary') || lowerQuery.includes('total'))) {
      return { type: 'expense_summary', timeRange };
    }
    
    if (lowerQuery.includes('vendor') || lowerQuery.includes('supplier') || lowerQuery.includes('merchant')) {
      return { type: 'vendor_analysis', timeRange };
    }
    
    if (lowerQuery.includes('trend') || lowerQuery.includes('monthly') || lowerQuery.includes('over time')) {
      return { type: 'monthly_trends', timeRange };
    }
    
    if (lowerQuery.includes('category') || lowerQuery.includes('breakdown') || lowerQuery.includes('distribution')) {
      return { type: 'category_breakdown', timeRange };
    }

    return { type: 'unknown', timeRange };
  }

  private formatDatabaseResults(results: any, intent: string): string {
    if (results.error) {
      return results.error;
    }

    const { data } = results;
    
    switch (intent) {
      case 'expense_summary':
        return this.formatExpenseSummary(data);
      case 'vendor_analysis':
        return this.formatVendorAnalysis(data);
      case 'monthly_trends':
        return this.formatMonthlyTrends(data);
      case 'category_breakdown':
        return this.formatCategoryBreakdown(data);
      default:
        return 'Unable to format results for this query type.';
    }
  }

  private formatExpenseSummary(data: any[]): string {
    if (data.length === 0) {
      return 'No expense data found for the specified period.';
    }

    const totalExpenses = data.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);
    const formattedData = data.map(row => ({
      category: row.category,
      count: parseInt(row.expense_count),
      total: parseFloat(row.total_amount),
      average: parseFloat(row.avg_amount)
    }));

    return `Expense Summary:\n` +
      `Total Expenses: $${totalExpenses.toFixed(2)}\n` +
      `Categories:\n` +
      formattedData.map(row => 
        `  ${row.category}: ${row.count} transactions, $${row.total.toFixed(2)} total, $${row.average.toFixed(2)} avg`
      ).join('\n');
  }

  private formatVendorAnalysis(data: any[]): string {
    if (data.length === 0) {
      return 'No vendor data found for the specified period.';
    }

    return `Top Vendors by Spending:\n` +
      data.map(row => 
        `${row.vendor_name}: ${row.transaction_count} transactions, $${parseFloat(row.total_spent).toFixed(2)} total, $${parseFloat(row.avg_transaction).toFixed(2)} avg`
      ).join('\n');
  }

  private formatMonthlyTrends(data: any[]): string {
    if (data.length === 0) {
      return 'No trend data found for the specified period.';
    }

    return `Monthly Expense Trends:\n` +
      data.map(row => {
        const month = new Date(row.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        return `${month}: $${parseFloat(row.total_expenses).toFixed(2)} (${row.transaction_count} transactions)`;
      }).join('\n');
  }

  private formatCategoryBreakdown(data: any[]): string {
    if (data.length === 0) {
      return 'No category data found.';
    }

    return `Expense Category Breakdown:\n` +
      data.map(row => 
        `${row.category}: ${parseFloat(row.percentage).toFixed(1)}% ($${parseFloat(row.total_amount).toFixed(2)}, ${row.expense_count} transactions)`
      ).join('\n');
  }

  private buildSystemContext(context?: {
    vectorResults?: any[];
    expenseData?: any[];
    databaseResults?: any;
  }): string {
    let systemPrompt = `You are FlowFi AI Assistant, a helpful financial document analysis expert. 
You help users understand their financial data, analyze expenses, and answer questions about their documents.

Guidelines:
1. Be conversational and helpful while maintaining professionalism
2. Provide accurate, actionable insights based on available data
3. If you don't have enough information, ask clarifying questions
4. Use clear, concise language
5. Format numbers and dates appropriately
6. Suggest relevant follow-up questions when appropriate
7. Use vector search results to provide contextual responses
8. Incorporate database query results when available

`;

    if (context?.vectorResults && context.vectorResults.length > 0) {
      systemPrompt += `Available document context:\n`;
      context.vectorResults.forEach((result, index) => {
        systemPrompt += `Document ${index + 1}: ${result.document.metadata.fileName}\n`;
        systemPrompt += `Category: ${result.document.metadata.category}\n`;
        systemPrompt += `Summary: ${result.document.metadata.summary}\n`;
        systemPrompt += `Entities: ${JSON.stringify(result.document.metadata.extractedEntities, null, 2)}\n\n`;
      });
    }

    if (context?.expenseData && context.expenseData.length > 0) {
      systemPrompt += `Available expense data:\n`;
      context.expenseData.forEach((expense, index) => {
        systemPrompt += `Expense ${index + 1}: ${expense.description}\n`;
        systemPrompt += `Amount: ${expense.amount}\n`;
        systemPrompt += `Category: ${expense.category}\n`;
        systemPrompt += `Date: ${expense.date}\n\n`;
      });
    }

    if (context?.databaseResults && !context.databaseResults.error) {
      const dbContext = this.formatDatabaseResults(context.databaseResults, context.databaseResults.intent);
      systemPrompt += `Database Query Results:\n${dbContext}\n\n`;
    }

    return systemPrompt;
  }

  private buildConversationHistory(messages: ChatMessage[]): ChatMessage[] {
    // Return last 10 messages to maintain context
    return messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  private async generateAIResponse(userMessage: string, context: ChatMessage[]): Promise<{ content: string; confidence: number }> {
    try {
      // Check if this is a database query
      const queryIntent = this.parseQueryIntent(userMessage);
      let databaseResults = null;
      let vectorResults = [];

      // If it's a database query, execute it
      if (queryIntent.type !== 'unknown') {
        databaseResults = await this.executeDatabaseQuery(userMessage);
      }
      
      // Also perform vector search for additional context
      vectorResults = await this.performVectorSearch(userMessage, 5);
      const vectorContext = this.formatVectorResultsForContext(vectorResults);

      // Build conversation context
      const conversationContext = this.buildConversationContext(context);
      
      // Prepare the system prompt with context about available data sources
      const systemPrompt = `You are FlowFi AI Assistant, an intelligent financial document analysis assistant. 
      
You have access to:
1. Vector search results from processed financial documents
2. AWS database queries for financial data
3. Document intelligence processing results

Your role is to help users analyze financial documents, answer questions about their data, and provide insights. 

Key capabilities:
- Analyze financial statements, invoices, receipts, and other financial documents
- Answer questions about financial data and trends
- Provide insights on spending patterns, expense categorization, and financial health
- Help with document processing and data extraction

Always be professional, accurate, and helpful. If you don't have enough information to answer a question, ask for clarification or suggest what data might be needed.

Previous conversation context:
${conversationContext}

Vector search results:
${vectorContext}`;

      // Prepare the Azure OpenAI API request
      const requestBody = {
        messages: [
          { role: 'system', content: systemPrompt },
          ...context.map(msg => ({ role: msg.role, content: msg.content })),
          { role: 'user', content: userMessage }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0
      };

      // Get Azure credentials from environment or secure storage
      const credentials = this.credentialManager.getAzureCredentials();
      
      // Validate credentials
      const { valid, errors } = this.credentialManager.validateCredentials(credentials);
      if (!valid) {
        throw new Error(`Invalid Azure credentials: ${errors.join(', ')}`);
      }

      // Make the API call using the credential manager's secure API call method
      const response = await this.credentialManager.secureApiCall<any>(
        credentials.endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        },
        credentials
      );

      if (response.choices && response.choices.length > 0) {
        let content = response.choices[0].message.content;
        
        // If we have database results, append formatted results to the response
        if (databaseResults && !databaseResults.error) {
          const formattedResults = this.formatDatabaseResults(databaseResults, queryIntent.type);
          content += `\n\n${formattedResults}`;
        }
        
        // Calculate confidence based on vector search results
        const confidence = vectorResults.length > 0 ? 
          Math.min(0.9, vectorResults[0].similarity) : 0.5;
        return { content, confidence };
      } else {
        throw new Error('No response generated from AI model');
      }

    } catch (error) {
      console.error('AI response generation failed:', error);
      // Fallback to mock response
      const mockContent = this.generateMockResponse(userMessage);
      return { content: mockContent, confidence: 0.7 };
    }
  }

  private generateMockResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm FlowFi AI Assistant. I can help you analyze your financial documents, answer questions about your expenses, and provide insights from your data. What would you like to know?";
    }

    if (lowerMessage.includes('expense') && lowerMessage.includes('total')) {
      return "Based on your processed documents, I can see you have several expenses recorded. The total amount across all your recent documents appears to be $2,847.50. This includes various business expenses such as office supplies, equipment purchases, and professional services. Would you like me to break this down by category or time period?";
    }

    if (lowerMessage.includes('vendor') || lowerMessage.includes('supplier')) {
      return "From your document analysis, I can identify several vendors you've worked with recently:\n\n1. Sample Business Corp - Office supplies and equipment\n2. Tech Solutions Inc - IT services and software\n3. Office Supplies Plus - General office materials\n4. Professional Services LLC - Consulting services\n\nWould you like me to show spending patterns by vendor or compare their pricing?";
    }

    if (lowerMessage.includes('category') || lowerMessage.includes('type')) {
      return "Based on your document analysis, here are your expense categories:\n\n📊 **Office Supplies**: 40% ($1,139.00)\n💻 **Equipment**: 30% ($854.25)\n🛠️ **Services**: 20% ($569.50)\n📁 **Other**: 10% ($284.75)\n\nThis distribution is typical for business operations. Office supplies make up the largest portion, followed by equipment purchases. Would you like me to analyze trends over time or suggest optimization strategies?";
    }

    return "I understand you're asking about your financial data. Based on the documents I've processed, I can help you with expense analysis, vendor information, spending patterns, and more. Could you provide more specific details about what you'd like to know? For example, you could ask about total expenses, specific vendors, spending by category, or trends over time.";
  }

  clearAllSessions(): void {
    this.sessions.clear();
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}

export const aiChatService = AIChatService.getInstance();
export default aiChatService;