import { azureDocumentIntelligenceConfig } from '../config/azure-config';
import { 
  DocumentAnalysisClient, 
  AzureKeyCredential
} from '@azure/ai-form-recognizer';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { SecurityService, CredentialManager } from './security-service';

export interface ProcessedInvoice {
  invoiceId: string;
  vendorName: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  taxAmount: number;
  items: InvoiceItem[];
  category: string;
  confidence: number;
  documentUrl: string;
  extractedData: any;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ProcessingResult {
  success: boolean;
  data?: ProcessedInvoice;
  error?: string;
  category?: string;
  confidence?: number;
}

export class AzureDocumentIntelligenceService {
  private documentClient: DocumentAnalysisClient;
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;

  private securityService: SecurityService;
  private credentialManager: CredentialManager;

  constructor(private config: typeof azureDocumentIntelligenceConfig) {
    this.securityService = SecurityService.getInstance();
    this.credentialManager = CredentialManager.getInstance();
    
    // Validate credentials before initialization
    if (!this.credentialManager.validateCredentials('azure')) {
      throw new Error('Azure credentials are not properly configured');
    }

    // Initialize Document Intelligence client with secure credentials
    const azureCreds = this.credentialManager.getAzureCredentials();
    this.documentClient = new DocumentAnalysisClient(
      azureCreds.endpoint,
      new AzureKeyCredential(azureCreds.apiKey)
    );

    // Initialize Blob Storage client using credential manager
    if (azureCreds.storageConnectionString) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(azureCreds.storageConnectionString);
    } else {
      // Fallback to manual configuration if connection string is not available
      const accountName = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT_NAME || 'flowfistorage';
      const accountKey = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT_KEY || '';
      const credential = new AzureKeyCredential(accountKey);
      this.blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        credential as any
      );
    }
    
    this.containerClient = this.blobServiceClient.getContainerClient(import.meta.env.VITE_AZURE_STORAGE_CONTAINER_NAME || 'invoices');
  }

  async uploadInvoice(file: File): Promise<string> {
    try {
      // Ensure container exists
      await this.containerClient.createIfNotExists();
      
      const blobName = `invoices/${Date.now()}-${file.name}`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      // Upload file
      const buffer = await file.arrayBuffer();
      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: file.type }
      });
      
      return blockBlobClient.url;
    } catch (error) {
      console.error('Error uploading invoice:', error);
      throw new Error('Failed to upload invoice to Azure Blob Storage');
    }
  }

  async processInvoice(documentUrl: string): Promise<ProcessingResult> {
    try {
      // Analyze document using Azure Document Intelligence
      const poller = await this.documentClient.beginAnalyzeDocument(
        'prebuilt-invoice',
        { url: documentUrl } as any
      );
      
      const result = await poller.pollUntilDone();
      
      if (!result.documents || result.documents.length === 0) {
        return {
          success: false,
          error: 'No documents found in the invoice'
        };
      }

      const invoice = result.documents[0];
      const extractedData = this.extractInvoiceData(invoice);
      const categoryResult = await this.categorizeExpense(extractedData);
      
      return {
        success: true,
        data: {
          ...extractedData,
          category: categoryResult.category,
          confidence: categoryResult.confidence,
          documentUrl
        },
        category: categoryResult.category,
        confidence: categoryResult.confidence
      };
    } catch (error) {
      console.error('Error processing invoice:', error);
      return {
        success: false,
        error: `Failed to process invoice: ${error.message}`
      };
    }
  }

  private extractInvoiceData(invoice: any): ProcessedInvoice {
    const fields = invoice.fields;
    
    return {
      invoiceId: fields.invoiceId?.value || `INV-${Date.now()}`,
      vendorName: fields.vendorName?.value || 'Unknown Vendor',
      invoiceDate: fields.invoiceDate?.value || new Date().toISOString(),
      dueDate: fields.dueDate?.value || new Date().toISOString(),
      totalAmount: fields.invoiceTotal?.value?.amount || 0,
      taxAmount: fields.taxTotal?.value?.amount || 0,
      items: this.extractInvoiceItems(fields.items),
      category: '',
      confidence: 0,
      documentUrl: '',
      extractedData: fields
    };
  }

  private extractInvoiceItems(itemsField: any): InvoiceItem[] {
    if (!itemsField || !itemsField.value) return [];
    
    return itemsField.value.map((item: any) => ({
      description: item.properties.description?.value || '',
      quantity: item.properties.quantity?.value || 1,
      unitPrice: item.properties.unitPrice?.value?.amount || 0,
      totalPrice: item.properties.amount?.value?.amount || 0
    }));
  }

  private async categorizeExpense(invoice: ProcessedInvoice): Promise<{category: string, confidence: number}> {
    // Predefined categories
    const categories = [
      'Office Supplies', 'Travel', 'Meals', 'Equipment', 'Software',
      'Marketing', 'Utilities', 'Professional Services', 'Transportation',
      'Communication', 'Insurance', 'Rent', 'Maintenance', 'Other'
    ];

    // Enhanced categorization logic based on vendor name and items
    const vendorName = invoice.vendorName.toLowerCase();
    const itemDescriptions = invoice.items.map(item => item.description.toLowerCase()).join(' ');
    
    // Category mapping with confidence scoring
    const categoryScores = new Map<string, number>();
    
    // Analyze vendor name
    if (vendorName.includes('restaurant') || vendorName.includes('cafe') || 
        vendorName.includes('food') || vendorName.includes('dining')) {
      categoryScores.set('Meals', 0.9);
    }
    
    if (vendorName.includes('airline') || vendorName.includes('hotel') || 
        vendorName.includes('travel') || vendorName.includes('uber') || 
        vendorName.includes('lyft')) {
      categoryScores.set('Travel', 0.85);
    }
    
    if (vendorName.includes('office') || vendorName.includes('staples') || 
        vendorName.includes('office depot')) {
      categoryScores.set('Office Supplies', 0.9);
    }
    
    if (vendorName.includes('software') || vendorName.includes('tech') || 
        vendorName.includes('microsoft') || vendorName.includes('adobe')) {
      categoryScores.set('Software', 0.85);
    }

    // Analyze item descriptions
    if (itemDescriptions.includes('meal') || itemDescriptions.includes('food') || 
        itemDescriptions.includes('lunch') || itemDescriptions.includes('dinner')) {
      categoryScores.set('Meals', (categoryScores.get('Meals') || 0) + 0.7);
    }
    
    if (itemDescriptions.includes('flight') || itemDescriptions.includes('hotel') || 
        itemDescriptions.includes('transportation')) {
      categoryScores.set('Travel', (categoryScores.get('Travel') || 0) + 0.7);
    }

    // Find best category
    let bestCategory = 'Other';
    let maxScore = 0.3; // Minimum confidence threshold
    
    for (const [category, score] of categoryScores) {
      if (score > maxScore) {
        bestCategory = category;
        maxScore = score;
      }
    }

    // If confidence is low, suggest new category based on vendor pattern
    if (maxScore < 0.5) {
      const newCategory = this.suggestNewCategory(vendorName, itemDescriptions);
      if (newCategory) {
        return { category: newCategory, confidence: 0.4 };
      }
    }

    return { category: bestCategory, confidence: Math.min(maxScore, 0.95) };
  }

  private suggestNewCategory(vendorName: string, itemDescriptions: string): string | null {
    // Pattern matching for potential new categories
    const patterns = [
      { pattern: /consulting|legal|accounting|lawyer|attorney/, category: 'Professional Services' },
      { pattern: /marketing|advertising|promotion/, category: 'Marketing' },
      { pattern: /electric|gas|water|utility/, category: 'Utilities' },
      { pattern: /insurance|coverage|policy/, category: 'Insurance' },
      { pattern: /rent|lease|rental/, category: 'Rent' },
      { pattern: /repair|maintenance|service/, category: 'Maintenance' },
      { pattern: /phone|internet|telecom|communication/, category: 'Communication' }
    ];

    const combinedText = `${vendorName} ${itemDescriptions}`.toLowerCase();
    
    for (const { pattern, category } of patterns) {
      if (pattern.test(combinedText)) {
        return category;
      }
    }

    return null;
  }
}

export class AzureExpenseService {
  private documentIntelligenceService: AzureDocumentIntelligenceService;

  constructor(config: typeof azureDocumentIntelligenceConfig) {
    this.documentIntelligenceService = new AzureDocumentIntelligenceService(config);
  }

  async processInvoiceUpload(file: File): Promise<ProcessingResult> {
    try {
      // Step 1: Upload to Azure Blob Storage
      const documentUrl = await this.documentIntelligenceService.uploadInvoice(file);
      
      // Step 2: Process with Document Intelligence
      const result = await this.documentIntelligenceService.processInvoice(documentUrl);
      
      return result;
    } catch (error) {
      console.error('Error in invoice upload process:', error);
      return {
        success: false,
        error: `Failed to process invoice: ${error.message}`
      };
    }
  }

  async validateInvoiceData(data: ProcessedInvoice): Promise<{isValid: boolean, errors: string[]}> {
    const errors: string[] = [];
    
    if (!data.vendorName || data.vendorName === 'Unknown Vendor') {
      errors.push('Vendor name is required');
    }
    
    if (data.totalAmount <= 0) {
      errors.push('Total amount must be greater than 0');
    }
    
    if (!data.invoiceDate) {
      errors.push('Invoice date is required');
    }
    
    if (data.items.length === 0) {
      errors.push('At least one invoice item is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}