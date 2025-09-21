// Test script to populate vector store with sample documents
import { createVectorizationService } from '@/services/vectorization-service';
import { createAIService } from '@/services/ai-document-service';

// Sample expense documents for testing
const sampleDocuments = [
  {
    id: 'sample-1',
    content: 'Office Supplies Purchase - Staples receipt for $125.67 on 2024-01-15. Items include printer paper, pens, sticky notes, and folders for the accounting department.',
    metadata: {
      fileName: 'staples-receipt.pdf',
      type: 'receipt',
      category: 'Office Supplies',
      amount: 125.67,
      date: '2024-01-15',
      vendor: 'Staples'
    }
  },
  {
    id: 'sample-2', 
    content: 'Client Dinner at Italian Restaurant - $89.50 on 2024-01-20. Business meal with potential client John Smith from ABC Corporation to discuss new project proposal.',
    metadata: {
      fileName: 'italian-restaurant-receipt.pdf',
      type: 'receipt',
      category: 'Meals & Entertainment',
      amount: 89.50,
      date: '2024-01-20',
      vendor: 'Luigi\'s Italian Restaurant'
    }
  },
  {
    id: 'sample-3',
    content: 'Software Subscription - Annual Adobe Creative Cloud license for $599.88 on 2024-01-25. Used for graphic design and marketing materials creation.',
    metadata: {
      fileName: 'adobe-subscription.pdf',
      type: 'invoice',
      category: 'Software & Technology',
      amount: 599.88,
      date: '2024-01-25',
      vendor: 'Adobe Inc.'
    }
  },
  {
    id: 'sample-4',
    content: 'Travel Expense - Uber ride from airport to hotel $45.20 on 2024-02-01. Business trip to San Francisco for client meeting at TechCorp headquarters.',
    metadata: {
      fileName: 'uber-receipt.pdf',
      type: 'receipt',
      category: 'Transportation',
      amount: 45.20,
      date: '2024-02-01',
      vendor: 'Uber Technologies'
    }
  },
  {
    id: 'sample-5',
    content: 'Professional Services - Legal consultation fee $250.00 on 2024-02-05. Contract review services from Smith & Associates law firm for employment agreement.',
    metadata: {
      fileName: 'legal-services-invoice.pdf',
      type: 'invoice',
      category: 'Professional Services',
      amount: 250.00,
      date: '2024-02-05',
      vendor: 'Smith & Associates LLP'
    }
  }
];

export async function populateVectorStore() {
  console.log('Starting vector store population...');
  
  try {
    const vectorService = createVectorizationService();
    const aiService = createAIService();
    
    // Load existing documents from localStorage
    await vectorService.loadFromLocalStorage();
    
    console.log(`Found ${vectorService.getDocumentCount()} existing documents`);
    
    // Add sample documents
    for (const doc of sampleDocuments) {
      console.log(`Processing document: ${doc.metadata.fileName}`);
      
      // Check if document already exists
      const existingDocs = vectorService.getAllDocuments();
      const exists = existingDocs.some(d => 
        d.metadata.fileName === doc.metadata.fileName
      );
      
      if (!exists) {
        // Generate embedding and store document
        await vectorService.vectorizeDocument(
          doc.id,
          doc.content,
          doc.metadata
        );
        
        console.log(`✓ Added ${doc.metadata.fileName}`);
      } else {
        console.log(`⚠ Skipped ${doc.metadata.fileName} (already exists)`);
      }
    }
    
    console.log(`Vector store now contains ${vectorService.getDocumentCount()} documents`);
    
    // Test search functionality
    console.log('\nTesting search functionality...');
    
    const testQueries = [
      'How much did I spend on office supplies?',
      'Show me restaurant expenses',
      'What software subscriptions do I have?',
      'Travel expenses for business trips'
    ];
    
    for (const query of testQueries) {
      console.log(`\nQuery: "${query}"`);
      
      const searchResults = await vectorService.searchSimilarDocuments({
        query,
        topK: 3,
        threshold: 0.5
      });
      
      console.log(`Found ${searchResults.length} results:`);
      searchResults.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.document.metadata.fileName} (similarity: ${result.similarity.toFixed(3)})`);
        console.log(`     Content: ${result.document.content.substring(0, 100)}...`);
      });
    }
    
    // Test AI analysis
    console.log('\nTesting AI analysis...');
    const aiQuery = 'How much did I spend on office supplies this month?';
    console.log(`AI Query: "${aiQuery}"`);
    
    const searchResults = await vectorService.searchSimilarDocuments({
      query: aiQuery,
      topK: 5,
      threshold: 0.5
    });
    
    const context = searchResults.map(r => ({
      content: r.document.content,
      metadata: r.document.metadata,
      similarity: r.similarity
    }));
    
    const aiResponse = await aiService.generateNaturalLanguageQuery(
      aiQuery,
      context
    );
    
    console.log('AI Response:', aiResponse);
    
    return {
      success: true,
      documentCount: vectorService.getDocumentCount(),
      searchResults: testQueries.length
    };
    
  } catch (error) {
    console.error('Error populating vector store:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateVectorStore().then(result => {
    console.log('\nPopulation complete:', result);
    process.exit(result.success ? 0 : 1);
  });
}