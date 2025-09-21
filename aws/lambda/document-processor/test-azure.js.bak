const AWS = require('aws-sdk');
const { AzureKeyCredential, DocumentAnalysisClient } = require("@azure/ai-form-recognizer");

// Test Azure Document Intelligence connection
async function testAzureDocumentIntelligence() {
  console.log('Testing Azure Document Intelligence connection...');
  
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY;
  
  if (!endpoint || !apiKey) {
    console.error('Azure credentials not found in environment variables');
    return false;
  }
  
  try {
    const credential = new AzureKeyCredential(apiKey);
    const client = new DocumentAnalysisClient(endpoint, credential);
    
    console.log('Azure Document Intelligence client created successfully');
    console.log('Endpoint:', endpoint);
    console.log('Ready to process documents with Azure Document Intelligence');
    
    return true;
  } catch (error) {
    console.error('Error creating Azure Document Intelligence client:', error);
    return false;
  }
}

// Run test
if (require.main === module) {
  testAzureDocumentIntelligence()
    .then(success => {
      console.log('Test result:', success ? 'SUCCESS' : 'FAILED');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test error:', error);
      process.exit(1);
    });
}

module.exports = { testAzureDocumentIntelligence };