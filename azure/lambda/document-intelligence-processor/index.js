const { DocumentAnalysisClient, AzureKeyCredential } = require('@azure/ai-form-recognizer');
const { BlobServiceClient } = require('@azure/storage-blob');
const crypto = require('crypto');

// Azure Document Intelligence Configuration
const DOCUMENT_INTELLIGENCE_ENDPOINT = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
const DOCUMENT_INTELLIGENCE_API_KEY = process.env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY;
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const INVOICE_CONTAINER_NAME = 'flowfi-invoices';

if (!DOCUMENT_INTELLIGENCE_ENDPOINT || !DOCUMENT_INTELLIGENCE_API_KEY) {
    throw new Error('Azure Document Intelligence configuration missing. Please set AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT and AZURE_DOCUMENT_INTELLIGENCE_API_KEY environment variables.');
}

// Predefined expense categories with keywords for matching
const EXPENSE_CATEGORIES = {
  'Office Supplies': ['office', 'stationery', 'supplies', 'paper', 'pen', 'printer', 'ink'],
  'Travel & Transportation': ['travel', 'transport', 'flight', 'hotel', 'taxi', 'fuel', 'car', 'train', 'bus'],
  'Meals & Entertainment': ['meal', 'restaurant', 'food', 'lunch', 'dinner', 'entertainment', 'catering'],
  'Utilities': ['electricity', 'water', 'gas', 'internet', 'phone', 'utility', 'power'],
  'Marketing & Advertising': ['marketing', 'advertising', 'promotion', 'social media', 'campaign', 'branding'],
  'Professional Services': ['legal', 'accounting', 'consulting', 'professional', 'service', 'advisory'],
  'Software & Technology': ['software', 'subscription', 'saas', 'technology', 'app', 'license', 'cloud'],
  'Equipment & Hardware': ['equipment', 'hardware', 'computer', 'laptop', 'monitor', 'keyboard', 'mouse'],
  'Insurance': ['insurance', 'coverage', 'policy', 'premium'],
  'Rent & Facilities': ['rent', 'lease', 'facility', 'office space', 'property'],
  'Training & Education': ['training', 'education', 'course', 'workshop', 'seminar', 'certification'],
  'Other': []
};

// Dynamic category creation based on patterns
class DynamicCategoryManager {
  constructor() {
    this.customCategories = new Map();
  }

  addCustomCategory(name, keywords = []) {
    this.customCategories.set(name.toLowerCase(), {
      name,
      keywords: keywords.map(k => k.toLowerCase()),
      createdAt: new Date().toISOString(),
      usageCount: 0
    });
  }

  categorizeExpense(description, vendor, extractedData) {
    const text = `${description} ${vendor}`.toLowerCase();
    const categoryScores = new Map();

    // Score predefined categories
    Object.entries(EXPENSE_CATEGORIES).forEach(([category, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          score += 1;
        }
      });
      if (score > 0) {
        categoryScores.set(category, score);
      }
    });

    // Score custom categories
    this.customCategories.forEach((categoryData, categoryName) => {
      let score = 0;
      categoryData.keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          score += 1;
        }
      });
      if (score > 0) {
        categoryScores.set(categoryData.name, score);
      }
    });

    // Use extracted data for additional context
    if (extractedData.invoiceTotal) {
      const amount = parseFloat(extractedData.invoiceTotal);
      if (amount > 1000) {
        // Higher amounts might indicate equipment or professional services
        if (categoryScores.has('Equipment & Hardware')) {
          categoryScores.set('Equipment & Hardware', categoryScores.get('Equipment & Hardware') + 2);
        }
        if (categoryScores.has('Professional Services')) {
          categoryScores.set('Professional Services', categoryScores.get('Professional Services') + 1);
        }
      }
    }

    // Find best category
    let bestCategory = 'Other';
    let bestScore = 0;
    
    categoryScores.forEach((score, category) => {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    });

    // Create new category if confidence is low and we have good data
    if (bestScore < 2 && extractedData.vendorName && extractedData.invoiceTotal) {
      const newCategory = this.suggestNewCategory(extractedData, text);
      if (newCategory && newCategory !== 'Other') {
        this.addCustomCategory(newCategory, [extractedData.vendorName.toLowerCase()]);
        bestCategory = newCategory;
        bestScore = 3; // High confidence for new category
      }
    }

    // Update usage count for custom categories
    if (this.customCategories.has(bestCategory.toLowerCase())) {
      const categoryData = this.customCategories.get(bestCategory.toLowerCase());
      categoryData.usageCount++;
    }

    const confidence = Math.min(bestScore / 5, 1.0); // Normalize confidence to 0-1

    return {
      category: bestCategory,
      confidence: confidence,
      reasoning: `Categorized based on keywords and extracted data. Score: ${bestScore}`,
      alternativeCategories: Array.from(categoryScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, score]) => ({ category: cat, score: score / 5 }))
    };
  }

  suggestNewCategory(extractedData, description) {
    // Logic to suggest new categories based on patterns
    const vendor = extractedData.vendorName?.toLowerCase() || '';
    const descriptionLower = description.toLowerCase();

    if (vendor.includes('tech') || vendor.includes('software') || descriptionLower.includes('saas')) {
      return 'Technology Services';
    }
    if (vendor.includes('consult') || vendor.includes('advisory')) {
      return 'Consulting Services';
    }
    if (vendor.includes('clean') || vendor.includes('maintenance')) {
      return 'Maintenance Services';
    }
    if (vendor.includes('security') || vendor.includes('alarm')) {
      return 'Security Services';
    }

    return null;
  }
}

// Initialize category manager
const categoryManager = new DynamicCategoryManager();

// Azure Document Intelligence Client
let documentClient = null;

function getDocumentClient() {
  if (!documentClient) {
    documentClient = new DocumentAnalysisClient(
      DOCUMENT_INTELLIGENCE_ENDPOINT,
      new AzureKeyCredential(DOCUMENT_INTELLIGENCE_API_KEY)
    );
  }
  return documentClient;
}

// Azure Blob Storage Client
let blobServiceClient = null;

function getBlobServiceClient() {
  if (!blobServiceClient && AZURE_STORAGE_CONNECTION_STRING) {
    blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  }
  return blobServiceClient;
}

// Process invoice document
async function processInvoiceDocument(fileBuffer, fileName, mimeType) {
  try {
    console.log(`Processing invoice: ${fileName}`);
    
    // Upload to Azure Blob Storage
    const blobClient = getBlobServiceClient()?.getContainerClient(INVOICE_CONTAINER_NAME);
    if (!blobClient) {
      throw new Error('Azure Blob Storage not configured');
    }

    await blobClient.createIfNotExists();
    
    const blobName = `invoices/${Date.now()}-${fileName}`;
    const blockBlobClient = blobClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      blobHTTPHeaders: { blobContentType: mimeType }
    });
    
    const fileUrl = blockBlobClient.url;
    console.log(`File uploaded to: ${fileUrl}`);

    // Analyze with Azure Document Intelligence
    const client = getDocumentClient();
    const poller = await client.beginAnalyzeDocument('prebuilt-invoice', fileBuffer);
    const result = await poller.pollUntilDone();

    console.log('Document analysis completed');

    // Extract key information
    const extractedData = extractInvoiceData(result);
    
    // Categorize expense
    const categorization = categoryManager.categorizeExpense(
      extractedData.description,
      extractedData.vendorName,
      extractedData
    );

    return {
      success: true,
      fileUrl,
      blobName,
      extractedData,
      categorization,
      confidence: categorization.confidence,
      status: 'processed'
    };

  } catch (error) {
    console.error('Error processing invoice:', error);
    throw new Error(`Invoice processing failed: ${error.message}`);
  }
}

// Extract invoice data from Azure Document Intelligence results
function extractInvoiceData(analysisResult) {
  const documents = analysisResult.documents || [];
  const firstDocument = documents[0];
  
  if (!firstDocument) {
    throw new Error('No documents found in analysis result');
  }

  const fields = firstDocument.fields || {};
  
  return {
    vendorName: fields.VendorName?.value || fields.MerchantName?.value || 'Unknown Vendor',
    vendorAddress: fields.VendorAddress?.value || '',
    invoiceTotal: fields.InvoiceTotal?.value || fields.TotalAmount?.value || 0,
    invoiceDate: fields.InvoiceDate?.value || fields.TransactionDate?.value || new Date().toISOString(),
    invoiceId: fields.InvoiceId?.value || fields.InvoiceNumber?.value || '',
    description: fields.Description?.value || fields.TransactionDescription?.value || 'Invoice expense',
    currency: fields.Currency?.value || 'MYR',
    taxAmount: fields.TaxAmount?.value || 0,
    items: extractLineItems(fields.Items),
    confidence: firstDocument.confidence || 0.8
  };
}

// Extract line items from invoice
function extractLineItems(itemsField) {
  const items = [];
  
  if (itemsField && itemsField.value && Array.isArray(itemsField.value)) {
    itemsField.value.forEach((item, index) => {
      const itemData = item.value || {};
      items.push({
        description: itemData.Description?.value || itemData.ItemDescription?.value || '',
        quantity: itemData.Quantity?.value || 1,
        unitPrice: itemData.UnitPrice?.value || 0,
        totalPrice: itemData.TotalPrice?.value || 0,
        confidence: item.confidence || 0.7
      });
    });
  }
  
  return items;
}

// Main Azure Function handler
module.exports = async function (context, req) {
  context.log('Document Intelligence Processor function triggered');
  
  try {
    // Validate request
    if (!req.body || !req.body.fileData) {
      context.res = {
        status: 400,
        body: { error: 'Missing file data in request body' }
      };
      return;
    }

    const { fileData, fileName, mimeType, userId } = req.body;
    
    // Decode base64 file data
    const fileBuffer = Buffer.from(fileData, 'base64');
    
    // Process the invoice
    const result = await processInvoiceDocument(fileBuffer, fileName, mimeType);
    
    // Create expense record
    const expenseRecord = {
      id: crypto.randomUUID(),
      description: result.extractedData.description,
      amount: parseFloat(result.extractedData.invoiceTotal),
      currency: result.extractedData.currency,
      category: result.categorization.category,
      date: result.extractedData.invoiceDate,
      vendor: result.extractedData.vendorName,
      invoiceId: result.extractedData.invoiceId,
      confidence: result.confidence,
      status: 'pending',
      fileUrl: result.fileUrl,
      fileName: fileName,
      extractedText: JSON.stringify(result.extractedData),
      categorizationReasoning: result.categorization.reasoning,
      alternativeCategories: result.categorization.alternativeCategories,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    context.res = {
      status: 200,
      body: {
        success: true,
        message: 'Invoice processed successfully',
        data: {
          expense: expenseRecord,
          extractedData: result.extractedData,
          categorization: result.categorization,
          fileUrl: result.fileUrl
        }
      }
    };

  } catch (error) {
    context.log.error('Error processing document:', error);
    context.res = {
      status: 500,
      body: {
        success: false,
        error: 'Document processing failed',
        message: error.message,
        details: error.stack
      }
    };
  }
};