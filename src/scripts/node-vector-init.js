// Node.js compatible vector initialization script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock vectorization service for Node.js
class SimpleVectorizationService {
  constructor() {
    this.documents = new Map();
    this.embeddings = new Map();
  }

  // Simple mock embedding generation
  async generateEmbedding(text) {
    // Create a simple mock embedding based on text content
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(1536).fill(0);
    
    // Simple hash-based embedding for demo purposes
    for (let i = 0; i < words.length && i < 100; i++) {
      const word = words[i];
      for (let j = 0; j < word.length && j < 15; j++) {
        const index = (word.charCodeAt(j) * 7 + i * 13) % 1536;
        embedding[index] += (word.charCodeAt(j) % 10) / 10;
      }
    }
    
    // Normalize embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return embedding.map(val => val / magnitude);
    }
    return embedding;
  }

  async vectorizeDocument(documentId, content, metadata) {
    const embedding = await this.generateEmbedding(content);
    
    const vectorDocument = {
      id: `vector_${documentId}_${Date.now()}`,
      content,
      metadata,
      embedding,
      timestamp: new Date().toISOString(),
    };

    this.documents.set(vectorDocument.id, vectorDocument);
    this.embeddings.set(vectorDocument.id, embedding);
    
    return vectorDocument;
  }

  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  async searchSimilarDocuments(query, topK = 5, threshold = 0.1) {
    const queryEmbedding = await this.generateEmbedding(query);
    const results = [];

    for (const [id, document] of this.documents) {
      const similarity = this.cosineSimilarity(queryEmbedding, document.embedding);
      
      if (similarity >= threshold) {
        results.push({
          document,
          similarity,
          score: similarity,
        });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  getDocumentCount() {
    return this.documents.size;
  }

  clearAllDocuments() {
    this.documents.clear();
    this.embeddings.clear();
  }

  getAllDocuments() {
    return Array.from(this.documents.values());
  }
}

// Sample financial documents for testing
const sampleDocuments = [
  {
    id: 'doc_1',
    content: 'Quarterly revenue increased by 15% to $2.4M, driven by strong enterprise sales and new customer acquisitions. Operating expenses remained stable at $1.8M.',
    metadata: {
      fileName: 'Q3_2024_Financial_Report.pdf',
      type: 'financial_report',
      category: 'quarterly',
      date: '2024-10-15',
      company: 'FlowFi Inc.',
      tags: ['revenue', 'expenses', 'quarterly']
    }
  },
  {
    id: 'doc_2',
    content: 'Marketing campaign ROI analysis shows 340% return on investment for Q3 digital campaigns, with customer acquisition cost averaging $45 per user.',
    metadata: {
      fileName: 'Marketing_ROI_Analysis.xlsx',
      type: 'marketing_analysis',
      category: 'performance',
      date: '2024-10-20',
      department: 'Marketing',
      tags: ['roi', 'marketing', 'acquisition']
    }
  },
  {
    id: 'doc_3',
    content: 'Annual budget projection for 2025 shows planned investment of $500K in R&D, $300K in sales infrastructure, and $200K in marketing expansion.',
    metadata: {
      fileName: '2025_Budget_Planning.pdf',
      type: 'budget_plan',
      category: 'annual',
      date: '2024-11-01',
      department: 'Finance',
      tags: ['budget', 'planning', '2025']
    }
  },
  {
    id: 'doc_4',
    content: 'Customer churn rate decreased to 5.2% this quarter, with retention improvements driven by enhanced support and product updates.',
    metadata: {
      fileName: 'Customer_Retention_Report.pdf',
      type: 'customer_analytics',
      category: 'quarterly',
      date: '2024-10-18',
      department: 'Customer Success',
      tags: ['churn', 'retention', 'customers']
    }
  },
  {
    id: 'doc_5',
    content: 'Cash flow analysis shows positive operating cash flow of $450K for the quarter, with runway extended to 18 months based on current burn rate.',
    metadata: {
      fileName: 'Cash_Flow_Statement_Q3.xlsx',
      type: 'cash_flow',
      category: 'quarterly',
      date: '2024-10-25',
      department: 'Finance',
      tags: ['cash_flow', 'runway', 'burn_rate']
    }
  }
];

async function initializeVectorSystem() {
  console.log('🚀 Initializing vector system with sample documents...');
  
  const vectorizationService = new SimpleVectorizationService();
  
  try {
    // Clear existing documents
    console.log('Clearing existing documents...');
    vectorizationService.clearAllDocuments();
    
    // Add sample documents
    console.log('Adding sample documents...');
    for (const doc of sampleDocuments) {
      await vectorizationService.vectorizeDocument(doc.id, doc.content, doc.metadata);
      console.log(`✅ Added document: ${doc.metadata.fileName}`);
    }
    
    // Verify documents were added
    const documentCount = vectorizationService.getDocumentCount();
    console.log(`📊 Total documents in vector store: ${documentCount}`);
    
    if (documentCount > 0) {
      // Test vector search
      console.log('\n🔍 Testing vector search...');
      const searchResults = await vectorizationService.searchSimilarDocuments('revenue growth', 3);
      console.log(`Found ${searchResults.length} relevant documents for "revenue growth":`);
      searchResults.forEach((result, index) => {
        console.log(`${index + 1}. ${result.document.metadata.fileName} (similarity: ${result.similarity.toFixed(3)})`);
      });
      
      // Test another search
      console.log('\n🔍 Testing budget search...');
      const budgetResults = await vectorizationService.searchSimilarDocuments('budget planning 2025', 2);
      console.log(`Found ${budgetResults.length} relevant documents for "budget planning 2025":`);
      budgetResults.forEach((result, index) => {
        console.log(`${index + 1}. ${result.document.metadata.fileName} (similarity: ${result.similarity.toFixed(3)})`);
      });
      
      // Save the vector data to a file for the web app to use
      const vectorData = {
        documents: vectorizationService.getAllDocuments(),
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const dataPath = path.join(__dirname, '../../public/vector-data.json');
      fs.writeFileSync(dataPath, JSON.stringify(vectorData, null, 2));
      console.log(`\n💾 Vector data saved to: ${dataPath}`);
      
      console.log('\n✅ Vector system initialization completed successfully!');
      console.log('🎯 You can now test natural language queries in the web interface.');
      
    } else {
      console.log('❌ No documents were added to the vector store.');
    }
    
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
}

// Run initialization
initializeVectorSystem();