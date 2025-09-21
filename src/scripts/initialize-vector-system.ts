import { createVectorizationService } from '../services/vectorization-service';
import { AIChatService } from '../services/ai-chat-service';

// Sample financial documents for testing
const sampleDocuments = [
  {
    documentId: 'invoice_001',
    content: 'Invoice #INV-2024-001 from TechCorp Solutions for software licensing. Total amount: RM 15,000. Payment terms: Net 30 days. Services include cloud infrastructure and support.',
    metadata: {
      documentId: 'invoice_001',
      documentType: 'invoice',
      fileName: 'TechCorp_Invoice_001.pdf',
      uploadDate: '2024-01-15T10:30:00Z',
      summary: 'Software licensing invoice from TechCorp',
      category: 'Technology',
      confidence: 0.95,
      extractedEntities: {
        vendor: 'TechCorp Solutions',
        amount: 15000,
        currency: 'MYR',
        invoiceNumber: 'INV-2024-001',
        paymentTerms: 'Net 30 days',
        category: 'Software Licensing'
      },
      riskAssessment: { level: 'low', factors: ['established vendor'] },
      suggestedActions: ['Process payment', 'Archive for tax purposes']
    }
  },
  {
    documentId: 'receipt_002',
    content: 'Receipt for office supplies purchase from OfficeMax. Items: Printer paper (10 reams), pens, notebooks. Total: RM 450. Date: January 20, 2024.',
    metadata: {
      documentId: 'receipt_002',
      documentType: 'receipt',
      fileName: 'OfficeMax_Receipt_002.jpg',
      uploadDate: '2024-01-20T14:15:00Z',
      summary: 'Office supplies receipt',
      category: 'Office Supplies',
      confidence: 0.88,
      extractedEntities: {
        vendor: 'OfficeMax',
        amount: 450,
        currency: 'MYR',
        items: ['Printer paper', 'pens', 'notebooks'],
        category: 'Office Supplies'
      },
      riskAssessment: { level: 'low', factors: ['routine purchase'] },
      suggestedActions: ['Categorize as office expense', 'Update inventory']
    }
  },
  {
    documentId: 'contract_003',
    content: 'Service agreement with Digital Marketing Agency for Q1 2024. Monthly retainer: RM 8,500. Services: social media management, content creation, SEO optimization. Contract period: January-March 2024.',
    metadata: {
      documentId: 'contract_003',
      documentType: 'contract',
      fileName: 'DigitalMarketing_Contract_Q1.pdf',
      uploadDate: '2024-01-05T09:00:00Z',
      summary: 'Digital marketing service agreement',
      category: 'Marketing',
      confidence: 0.92,
      extractedEntities: {
        vendor: 'Digital Marketing Agency',
        amount: 8500,
        currency: 'MYR',
        contractPeriod: 'Q1 2024',
        services: ['social media management', 'content creation', 'SEO optimization'],
        category: 'Marketing Services'
      },
      riskAssessment: { level: 'medium', factors: ['recurring commitment'] },
      suggestedActions: ['Monitor performance metrics', 'Review at quarter end']
    }
  },
  {
    documentId: 'expense_004',
    content: 'Travel expense report for sales team conference in Singapore. Flight tickets: RM 3,200, Hotel accommodation: RM 1,800, Meals: RM 650, Transportation: RM 300. Total travel expenses: RM 5,950.',
    metadata: {
      documentId: 'expense_004',
      documentType: 'expense_report',
      fileName: 'SalesConference_Travel_Expenses.xlsx',
      uploadDate: '2024-01-25T16:45:00Z',
      summary: 'Sales team travel expenses for Singapore conference',
      category: 'Travel',
      confidence: 0.90,
      extractedEntities: {
        location: 'Singapore',
        flight: 3200,
        hotel: 1800,
        meals: 650,
        transportation: 300,
        totalAmount: 5950,
        currency: 'MYR',
        category: 'Business Travel'
      },
      riskAssessment: { level: 'low', factors: ['business necessity'] },
      suggestedActions: ['Reimburse employees', 'Update travel budget']
    }
  },
  {
    documentId: 'utility_005',
    content: 'Monthly utility bill for office building. Electricity: RM 2,100, Water: RM 350, Internet: RM 800. Total utilities: RM 3,250. Billing period: December 2023.',
    metadata: {
      documentId: 'utility_005',
      documentType: 'utility_bill',
      fileName: 'Dec2023_Utilities_Statement.pdf',
      uploadDate: '2024-01-02T11:20:00Z',
      summary: 'December 2023 office utilities',
      category: 'Utilities',
      confidence: 0.93,
      extractedEntities: {
        electricity: 2100,
        water: 350,
        internet: 800,
        totalAmount: 3250,
        currency: 'MYR',
        billingPeriod: 'December 2023',
        category: 'Office Utilities'
      },
      riskAssessment: { level: 'low', factors: ['predictable expense'] },
      suggestedActions: ['Process payment', 'Monitor usage trends']
    }
  }
];

async function initializeVectorSystem() {
  console.log('🚀 Initializing Vector System with Sample Documents...');
  
  const vectorizationService = createVectorizationService();
  const aiService = AIChatService.getInstance();
  
  try {
    // Clear existing documents
    console.log('🧹 Clearing existing documents...');
    vectorizationService.clearAllDocuments();
    
    // Add sample documents
    console.log('📄 Adding sample documents...');
    for (const doc of sampleDocuments) {
      await vectorizationService.vectorizeDocument(
        doc.documentId,
        doc.content,
        doc.metadata
      );
      console.log(`✅ Added document: ${doc.metadata.fileName}`);
    }
    
    // Verify documents were added
    const documentCount = vectorizationService.getDocumentCount();
    const allDocs = vectorizationService.getAllDocuments();
    
    console.log(`\n📊 Vector System Status:`);
    console.log(`   Total documents: ${documentCount}`);
    console.log(`   Categories: ${[...new Set(allDocs.map(d => d.metadata.category))].join(', ')}`);
    
    // Test vector search
    console.log('\n🔍 Testing vector search...');
    const testQueries = [
      'Show me technology expenses',
      'What did we spend on office supplies?',
      'Travel expenses for sales team',
      'Marketing contract costs'
    ];
    
    for (const testQuery of testQueries) {
      console.log(`\n📝 Query: "${testQuery}"`);
      const results = await vectorizationService.searchSimilarDocuments({
        query: testQuery,
        topK: 3,
        threshold: 0.3
      });
      
      if (results.length > 0) {
        console.log(`   Found ${results.length} results:`);
        results.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.document.metadata.fileName} (similarity: ${(result.similarity * 100).toFixed(1)}%)`);
        });
      } else {
        console.log('   No results found');
      }
    }
    
    // Test AI analysis
    console.log('\n🤖 Testing AI analysis...');
    const aiTestQuery = 'What are my highest expenses this month?';
    const vectorResults = await vectorizationService.searchSimilarDocuments({
      query: aiTestQuery,
      topK: 5,
      threshold: 0.3
    });
    
    if (vectorResults.length > 0) {
      const documentContext = vectorResults.map(result => 
        `Document: ${result.document.metadata.fileName}\n` +
        `Category: ${result.document.metadata.category}\n` +
        `Amount: ${result.document.metadata.extractedEntities.amount || 'N/A'}\n` +
        `Summary: ${result.document.metadata.summary}`
      );
      
      const aiAnswer = await aiService.generateNaturalLanguageQuery(aiTestQuery, documentContext);
      console.log(`\n🤖 AI Response to "${aiTestQuery}":`);
      console.log(`   ${aiAnswer}`);
    }
    
    console.log('\n✅ Vector system initialization complete!');
    console.log('\n📝 You can now test the Natural Language Query system with questions like:');
    console.log('   - "What are my highest expenses?"');
    console.log('   - "Show me technology-related documents"');
    console.log('   - "How much did we spend on travel?"');
    console.log('   - "List all vendor invoices"');
    
  } catch (error) {
    console.error('❌ Error initializing vector system:', error);
  }
}

// Run initialization
initializeVectorSystem();