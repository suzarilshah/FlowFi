export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    documentId: string;
    documentType: string;
    fileName: string;
    uploadDate: string;
    summary: string;
    category: string;
    confidence: number;
    extractedEntities: Record<string, any>;
    riskAssessment: any;
    suggestedActions: string[];
  };
  embedding: number[];
  timestamp: string;
}

export interface VectorQuery {
  query: string;
  topK?: number;
  threshold?: number;
  filters?: Record<string, any>;
}

export interface VectorSearchResult {
  document: VectorDocument;
  similarity: number;
  score: number;
}

export interface VectorizationConfig {
  embeddingEndpoint: string;
  embeddingApiKey: string;
  vectorDatabase: 'in-memory' | 'local-storage' | 'custom';
  dimensions: number;
}

export class VectorizationService {
  private config: VectorizationConfig;
  private documents: Map<string, VectorDocument> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  constructor(config: VectorizationConfig) {
    this.config = config;
    // Load pre-generated data if in demo mode
    if (this.config.embeddingApiKey === 'demo-key-not-for-production') {
      this.loadPreGeneratedData();
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Demo mode - return simple embedding instead of calling API
    if (this.config.embeddingApiKey === 'demo-key-not-for-production') {
      return this.generateSimpleEmbedding(text);
    }

    try {
      // For now, we'll use a simple embedding generation
      // In production, you'd call Azure OpenAI Embeddings API
      const response = await fetch(`${this.config.embeddingEndpoint}/embeddings`, {
        method: 'POST',
        headers: {
          'api-key': this.config.embeddingApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-ada-002',
        }),
      });

      if (!response.ok) {
        // Fallback to simple embedding for development
        return this.generateSimpleEmbedding(text);
      }

      const result = await response.json();
      return result.data[0].embedding;
    } catch (error) {
      // Fallback to simple embedding for development
      return this.generateSimpleEmbedding(text);
    }
  }

  private generateSimpleEmbedding(text: string): number[] {
    // Simple hash-based embedding for development
    const hash = this.hashCode(text);
    const embedding = new Array(this.config.dimensions).fill(0);
    
    for (let i = 0; i < this.config.dimensions; i++) {
      embedding[i] = ((hash * (i + 1)) % 1000) / 1000; // Normalize to 0-1
    }
    
    return embedding;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private loadPreGeneratedData(): void {
    try {
      // Try to load pre-generated vector data
      fetch('/vector-data.json')
        .then(response => response.json())
        .then(data => {
          if (data.documents && Array.isArray(data.documents)) {
            console.log(`Loading ${data.documents.length} pre-generated documents...`);
            data.documents.forEach((doc: VectorDocument) => {
              this.documents.set(doc.id, doc);
              this.embeddings.set(doc.id, doc.embedding);
            });
            console.log('✅ Pre-generated vector data loaded successfully');
          }
        })
        .catch(error => {
          console.log('ℹ️  No pre-generated vector data found, using empty vector store');
        });
    } catch (error) {
      console.log('ℹ️  Could not load pre-generated vector data, using empty vector store');
    }
  }

  async vectorizeDocument(
    documentId: string,
    content: string,
    metadata: VectorDocument['metadata']
  ): Promise<VectorDocument> {
    const embedding = await this.generateEmbedding(content);
    
    const vectorDocument: VectorDocument = {
      id: `vector_${documentId}_${Date.now()}`,
      content,
      metadata,
      embedding,
      timestamp: new Date().toISOString(),
    };

    // Store in memory for now
    this.documents.set(vectorDocument.id, vectorDocument);
    this.embeddings.set(vectorDocument.id, embedding);

    // Persist to local storage if configured
    if (this.config.vectorDatabase === 'local-storage') {
      this.persistToLocalStorage(vectorDocument);
    }

    return vectorDocument;
  }

  async searchSimilarDocuments(query: VectorQuery): Promise<VectorSearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query.query);
    const topK = query.topK || 5;
    const threshold = query.threshold || 0.7;

    const results: VectorSearchResult[] = [];

    for (const [id, document] of this.documents) {
      // Apply filters if provided
      if (query.filters && !this.matchesFilters(document, query.filters)) {
        continue;
      }

      const similarity = this.cosineSimilarity(queryEmbedding, document.embedding);
      const score = similarity;

      if (similarity >= threshold) {
        results.push({
          document,
          similarity,
          score,
        });
      }
    }

    // Sort by similarity and take top K
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  async findSimilarDocuments(
    documentId: string,
    topK: number = 5
  ): Promise<VectorSearchResult[]> {
    const sourceDocument = this.documents.get(documentId);
    if (!sourceDocument) {
      throw new Error(`Document ${documentId} not found`);
    }

    const results: VectorSearchResult[] = [];

    for (const [id, document] of this.documents) {
      if (id === documentId) continue; // Skip the source document

      const similarity = this.cosineSimilarity(sourceDocument.embedding, document.embedding);
      
      results.push({
        document,
        similarity,
        score: similarity,
      });
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
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

  private matchesFilters(document: VectorDocument, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      const documentValue = this.getNestedValue(document.metadata, key);
      if (documentValue !== value) {
        return false;
      }
    }
    return true;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private persistToLocalStorage(document: VectorDocument): void {
    try {
      const key = `vector_doc_${document.id}`;
      localStorage.setItem(key, JSON.stringify(document));
    } catch (error) {
      console.warn('Failed to persist to localStorage:', error);
    }
  }

  async loadFromLocalStorage(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('vector_doc_'));
      
      for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
          const document: VectorDocument = JSON.parse(data);
          this.documents.set(document.id, document);
          this.embeddings.set(document.id, document.embedding);
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    const document = this.documents.get(documentId);
    if (!document) {
      return false;
    }

    this.documents.delete(documentId);
    this.embeddings.delete(documentId);

    // Remove from local storage if persisted
    try {
      localStorage.removeItem(`vector_doc_${documentId}`);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }

    return true;
  }

  getAllDocuments(): VectorDocument[] {
    return Array.from(this.documents.values());
  }

  getDocumentCount(): number {
    return this.documents.size;
  }

  clearAllDocuments(): void {
    this.documents.clear();
    this.embeddings.clear();
    
    // Clear from local storage
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('vector_doc_'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
}

// Factory function to create vectorization service
export const createVectorizationService = (): VectorizationService => {
  // Use demo mode if no API key is provided or demo key is used
  const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY || 'demo-key-not-for-production';
  
  return new VectorizationService({
    embeddingEndpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || 'https://flowfi.cognitiveservices.azure.com/openai/deployments/text-embedding-ada-002',
    embeddingApiKey: apiKey,
    vectorDatabase: 'local-storage',
    dimensions: 1536,
  });
};