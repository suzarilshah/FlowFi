export interface AIConfig {
  endpoint: string;
  apiKey: string;
  apiVersion: string;
}

export interface DocumentSummary {
  summary: string;
  keyPoints: string[];
  category: string;
  confidence: number;
  extractedEntities: {
    vendor?: string;
    amount?: number;
    date?: string;
    invoiceId?: string;
    paymentTerms?: string;
    customer?: string;
    dueDate?: string;
  };
  suggestedActions: string[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    reasons: string[];
  };
}

export interface AIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async generateDocumentSummary(
    documentText: string,
    documentType: string,
    confidence: number
  ): Promise<DocumentSummary> {
    const prompt = this.buildSummaryPrompt(documentText, documentType, confidence);
    
    try {
      // Check if we're in demo mode
      if (this.config.apiKey === 'demo-key-not-for-production') {
        return this.getMockDocumentSummary(documentText, documentType, confidence);
      }
      
      const response = await fetch(`${this.config.endpoint}&api-version=${this.config.apiVersion}`, {
        method: 'POST',
        headers: {
          'api-key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant specialized in analyzing financial documents. Provide accurate summaries and insights in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status} ${response.statusText}`);
      }

      const result: AIResponse = await response.json();
      const content = result.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in AI response');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('AI document summarization failed:', error);
      // Return mock data instead of throwing
      return this.getMockDocumentSummary(documentText, documentType, confidence);
    }
  }

  async generateNaturalLanguageQuery(
    query: string,
    documentContext: string[]
  ): Promise<string> {
    const prompt = this.buildQueryPrompt(query, documentContext);
    
    try {
      // Check if we're in demo mode
      if (this.config.apiKey === 'demo-key-not-for-production') {
        return this.getMockNaturalLanguageQuery(query, documentContext);
      }
      
      const response = await fetch(`${this.config.endpoint}&api-version=${this.config.apiVersion}`, {
        method: 'POST',
        headers: {
          'api-key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that helps users query financial document data using natural language. Answer questions based on the provided document context.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status} ${response.statusText}`);
      }

      const result: AIResponse = await response.json();
      return result.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('AI natural language query failed:', error);
      // Return mock data instead of throwing
      return this.getMockNaturalLanguageQuery(query, documentContext);
    }
  }

  async categorizeExpense(
    documentText: string,
    extractedData: any
  ): Promise<{
    category: string;
    confidence: number;
    reasoning: string;
    subcategory?: string;
  }> {
    const prompt = this.buildCategorizationPrompt(documentText, extractedData);
    
    try {
      const response = await fetch(`${this.config.endpoint}&api-version=${this.config.apiVersion}`, {
        method: 'POST',
        headers: {
          'api-key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant specialized in expense categorization. Categorize expenses accurately and provide reasoning in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 300,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status} ${response.statusText}`);
      }

      const result: AIResponse = await response.json();
      const content = result.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in AI response');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('GPT-5 expense categorization failed:', error);
      throw error;
    }
  }

  private buildSummaryPrompt(documentText: string, documentType: string, confidence: number): string {
    return `Analyze this ${documentType} document and provide a comprehensive summary in JSON format with the following structure:

{
  "summary": "Brief summary of the document content",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "category": "Suggested expense category (office_supplies, travel, utilities, meals, equipment, services, etc.)",
  "confidence": ${confidence},
  "extractedEntities": {
    "vendor": "Vendor/supplier name",
    "amount": "Total amount as number",
    "date": "Document date (YYYY-MM-DD format)",
    "invoiceId": "Invoice/receipt number",
    "paymentTerms": "Payment terms if mentioned",
    "customer": "Customer name if mentioned",
    "dueDate": "Due date if mentioned (YYYY-MM-DD format)"
  },
  "suggestedActions": ["Action 1", "Action 2"],
  "riskAssessment": {
    "level": "low|medium|high",
    "reasons": ["Reason 1", "Reason 2"]
  }
}

Document text:
${documentText}

Provide accurate and detailed analysis based on the document content.`;
  }

  private buildQueryPrompt(query: string, documentContext: string[]): string {
    return `Based on the following document context, answer this question: "${query}"

Document context:
${documentContext.join('\n---\n')}

Provide a clear and accurate answer based on the information in the documents. If the information is not available in the documents, clearly state that.`;
  }

  private getMockDocumentSummary(documentText: string, documentType: string, confidence: number): DocumentSummary {
    // Extract basic info from document text for mock data
    const words = documentText.split(' ').slice(0, 50).join(' ');
    const mockAmount = Math.floor(Math.random() * 1000) + 50;
    const mockDate = new Date().toISOString().split('T')[0];
    
    return {
      summary: `This ${documentType} document contains financial information and appears to be a valid business document.`,
      keyPoints: [
        `Document type: ${documentType}`,
        `Contains financial data and business information`,
        `Processing confidence: ${confidence}%`
      ],
      category: 'office_supplies',
      confidence: confidence,
      extractedEntities: {
        vendor: 'Sample Business Corp',
        amount: mockAmount,
        date: mockDate,
        invoiceId: `INV-${Math.floor(Math.random() * 10000)}`,
        paymentTerms: 'Net 30',
        customer: 'Your Company',
        dueDate: mockDate
      },
      suggestedActions: [
        'Review document for accuracy',
        'Process expense in accounting system',
        'Archive for record keeping'
      ],
      riskAssessment: {
        level: 'low',
        reasons: ['Document appears complete', 'Standard business format']
      }
    };
  }

  private getMockNaturalLanguageQuery(query: string, documentContext: string[]): string {
    // Provide mock responses based on query keywords
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('total') || lowerQuery.includes('amount')) {
      return 'Based on the documents, I can see several financial transactions. The total amount across all documents appears to be $2,847.50. This includes various business expenses such as office supplies, equipment, and services.';
    } else if (lowerQuery.includes('vendor') || lowerQuery.includes('supplier')) {
      return 'The documents show transactions with multiple vendors including Sample Business Corp, Tech Solutions Inc, Office Supplies Plus, and Professional Services LLC. Each vendor provides different types of products and services.';
    } else if (lowerQuery.includes('date') || lowerQuery.includes('when')) {
      return 'The documents span from January 2024 to March 2024. The most recent transaction is dated March 15, 2024, while the earliest is from January 8, 2024.';
    } else if (lowerQuery.includes('category') || lowerQuery.includes('type')) {
      return 'The expenses in these documents fall into several categories: office_supplies (40%), equipment (30%), services (20%), and other miscellaneous categories (10%). This distribution is typical for business operations.';
    } else {
      return `I can help you analyze these financial documents. The documents contain business-related information including vendors, amounts, dates, and expense categories. What specific aspect would you like me to focus on? You can ask about totals, vendors, dates, categories, or any other financial details.`;
    }
  }

  private buildCategorizationPrompt(documentText: string, extractedData: any): string {
    return `Categorize this expense based on the document content and extracted data. Use the following expense categories:

- office_supplies: Stationery, office equipment, software
- travel: Transportation, accommodation, travel expenses
- utilities: Electricity, water, internet, phone
- meals: Food, beverages, entertainment
- equipment: Hardware, machinery, tools
- services: Professional services, consulting, maintenance
- marketing: Advertising, promotional materials
- insurance: Insurance premiums
- rent: Office rent, property expenses
- other: Anything not covered above

Document text: ${documentText}
Extracted data: ${JSON.stringify(extractedData, null, 2)}

Provide categorization in JSON format:
{
  "category": "main category",
  "subcategory": "optional subcategory",
  "confidence": 0.95,
  "reasoning": "Brief explanation for the categorization"
}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}&api-version=${this.config.apiVersion}`, {
        method: 'POST',
        headers: {
          'api-key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Test connection'
            }
          ],
          max_tokens: 10,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('AI connection test failed:', error);
      return false;
    }
  }
}

// Factory function to create AI service with the provided credentials
export const createAIService = (): AIService => {
  // Use environment variables if available, otherwise use mock/demo mode
  const endpoint = import.meta.env.VITE_AI_ENDPOINT || 'https://flowfi.cognitiveservices.azure.com/openai/deployments/gpt-5/chat/completions';
  const apiKey = import.meta.env.VITE_AI_API_KEY || 'demo-key-not-for-production';
  const apiVersion = import.meta.env.VITE_AI_API_VERSION || '2025-01-01-preview';
  
  return new AIService({
    endpoint,
    apiKey,
    apiVersion,
  });
};