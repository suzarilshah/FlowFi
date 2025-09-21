import { azureDocumentIntelligenceConfig } from '@/config/azure-config';

export interface DocumentAnalysisResult {
  documentType: string;
  confidence: number;
  fields: {
    vendor?: { value: string; confidence: number };
    amount?: { value: number; confidence: number };
    date?: { value: string; confidence: number };
    invoiceId?: { value: string; confidence: number };
    description?: { value: string; confidence: number };
    category?: { value: string; confidence: number };
    paymentTerms?: { value: string; confidence: number };
    customer?: { value: string; confidence: number };
    dueDate?: { value: string; confidence: number };
    lineItems?: { value: Array<{ description: string; quantity: number; unitPrice: number; total: number }>; confidence: number };
  };
  rawResponse: any;
}

export interface AzureDocumentProcessorConfig {
  endpoint: string;
  apiKey: string;
  modelId: string;
}

export class AzureDocumentIntelligenceService {
  private config: AzureDocumentProcessorConfig;

  constructor(config: AzureDocumentProcessorConfig) {
    this.config = config;
  }

  async analyzeDocument(file: File): Promise<DocumentAnalysisResult> {
    try {
      // Use Azure format (Base64 JSON)
      const base64Content = await this.fileToBase64(file);
      
      const response = await fetch(`${this.config.endpoint}/formrecognizer/documentModels/${this.config.modelId}:analyze?api-version=2023-07-31`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Source: base64Content.split(',')[1], // Remove data URL prefix
        }),
      });

      if (!response.ok) {
        throw new Error(`Azure Document Intelligence API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return this.parseAnalysisResult(result);
    } catch (error) {
      console.error('Document Intelligence analysis failed:', error);
      throw error;
    }
  }

  async analyzeDocumentWithPolling(file: File): Promise<DocumentAnalysisResult> {
    try {
      // Use Azure polling format
      const base64Content = await this.fileToBase64(file);
      
      const startResponse = await fetch(`${this.config.endpoint}/formrecognizer/documentModels/${this.config.modelId}:analyze?api-version=2023-07-31`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Source: base64Content.split(',')[1],
        }),
      });

      if (!startResponse.ok) {
        throw new Error(`Azure Document Intelligence API error: ${startResponse.status} ${startResponse.statusText}`);
      }

      const operationLocation = startResponse.headers.get('Operation-Location');
      if (!operationLocation) {
        throw new Error('No Operation-Location header found in response');
      }

      // Poll for results
      return await this.pollForResults(operationLocation);
    } catch (error) {
      console.error('Document Intelligence analysis failed:', error);
      throw error;
    }
  }

  private async pollForResults(operationLocation: string): Promise<DocumentAnalysisResult> {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    const pollInterval = 10000; // 10 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(operationLocation, {
          method: 'GET',
          headers: {
            'Ocp-Apim-Subscription-Key': this.config.apiKey,
          },
        });

        if (!response.ok) {
          throw new Error(`Polling request failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.status === 'succeeded') {
          return this.parseAnalysisResult(result);
        } else if (result.status === 'failed') {
          throw new Error(`Document analysis failed: ${result.error?.message || 'Unknown error'}`);
        }
        
        // Still processing, wait and try again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error(`Polling attempt ${attempt + 1} failed:`, error);
        if (attempt === maxAttempts - 1) {
          throw new Error('Document analysis timed out after 5 minutes');
        }
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('Document analysis timed out after 5 minutes');
  }

  private parseAnalysisResult(result: any): DocumentAnalysisResult {
    const document = result.analyzeResult?.documents?.[0];
    const fields = document?.fields || {};

    return {
      documentType: document?.documentType || 'unknown',
      confidence: document?.confidence || 0,
      fields: {
        vendor: this.extractField(fields.VendorName || fields.vendorName || fields.vendor),
        amount: this.extractAmountField(fields.Total || fields.total || fields.amount),
        date: this.extractDateField(fields.InvoiceDate || fields.invoiceDate || fields.date),
        invoiceId: this.extractField(fields.InvoiceId || fields.invoiceId || fields.invoiceNumber),
        description: this.extractField(fields.Description || fields.description),
        category: this.extractField(fields.Category || fields.category),
        paymentTerms: this.extractField(fields.PaymentTerms || fields.paymentTerms),
        customer: this.extractField(fields.CustomerName || fields.customerName || fields.customer),
        dueDate: this.extractDateField(fields.DueDate || fields.dueDate),
        lineItems: this.extractLineItems(fields.LineItems || fields.lineItems),
      },
      rawResponse: result,
    };
  }

  private extractField(field: any): { value: string; confidence: number } | undefined {
    if (!field) return undefined;
    
    return {
      value: field.valueString || field.value || field.content || '',
      confidence: field.confidence || 0,
    };
  }

  private extractAmountField(field: any): { value: number; confidence: number } | undefined {
    if (!field) return undefined;
    
    const value = field.valueNumber || field.value || 0;
    const confidence = field.confidence || 0;
    
    return {
      value: typeof value === 'number' ? value : parseFloat(value) || 0,
      confidence,
    };
  }

  private extractDateField(field: any): { value: string; confidence: number } | undefined {
    if (!field) return undefined;
    
    const value = field.valueDate || field.valueString || field.value || '';
    const confidence = field.confidence || 0;
    
    return {
      value: value instanceof Date ? value.toISOString().split('T')[0] : value,
      confidence,
    };
  }

  private extractLineItems(field: any): { value: Array<{ description: string; quantity: number; unitPrice: number; total: number }>; confidence: number } | undefined {
    if (!field || !field.valueArray) return undefined;
    
    const items = field.valueArray.map((item: any) => ({
      description: item.valueObject?.Description?.valueString || item.valueObject?.description?.valueString || '',
      quantity: item.valueObject?.Quantity?.valueNumber || item.valueObject?.quantity?.valueNumber || 0,
      unitPrice: item.valueObject?.UnitPrice?.valueNumber || item.valueObject?.unitPrice?.valueNumber || 0,
      total: item.valueObject?.Total?.valueNumber || item.valueObject?.total?.valueNumber || 0,
    }));
    
    return {
      value: items,
      confidence: field.confidence || 0,
    };
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test Azure with model list request
      const response = await fetch(`${this.config.endpoint}/formrecognizer/documentModels?api-version=2023-07-31`, {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': this.config.apiKey,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Document Intelligence connection test failed:', error);
      return false;
    }
  }
}

// Factory function to create Azure Document Intelligence service with config from environment
export const createAzureDocumentIntelligenceService = (): AzureDocumentIntelligenceService => {
  return new AzureDocumentIntelligenceService({
    ...azureDocumentIntelligenceConfig,
    modelId: 'prebuilt-invoice'
  });
};