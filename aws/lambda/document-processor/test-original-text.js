const fs = require('fs');
const { AzureKeyCredential, DocumentAnalysisClient } = require("@azure/ai-form-recognizer");

// Load Azure configuration
const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || "https://flowfi-document-intelligence.cognitiveservices.azure.com/";
const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY;

if (!apiKey) {
    console.error("❌ AZURE_DOCUMENT_INTELLIGENCE_API_KEY environment variable is not set");
    process.exit(1);
}

async function testOriginalTextFile() {
    try {
        console.log("🧪 Testing original text file (disguised as PDF) with Azure Document Intelligence...");
        
        // Create the original problematic text content that was in test-invoice.pdf
        const textContent = `Invoice #12345
Date: 2024-01-15
Customer: Test Customer
Amount: $1,500.00

This is a test invoice for document processing.`;
        
        console.log("📄 File content (text file disguised as PDF):");
        console.log(textContent);
        console.log("\n🔍 File analysis:");
        console.log(`Content length: ${textContent.length} bytes`);
        console.log(`First 8 bytes: "${textContent.slice(0, 8)}"`);
        console.log("❌ This is NOT a valid PDF - it's plain text!");
        
        // Initialize Azure client
        const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));
        console.log("\n🔄 Attempting document analysis...");
        
        // Try to analyze the text as if it were a PDF
        const poller = await client.beginAnalyzeDocument("prebuilt-invoice", Buffer.from(textContent));
        console.log("⏳ Poller created, waiting for results...");
        
        const { documents } = await poller.pollUntilDone();
        
        console.log("✅ Analysis completed!");
        console.log(`📊 Number of documents found: ${documents.length}`);
        
    } catch (error) {
        console.error("\n❌ Error during analysis (as expected):");
        console.error(`   ${error.message}`);
        
        if (error.message.includes('Invalid request')) {
            console.error("\n💡 This error confirms that Azure Document Intelligence:");
            console.error("   - Correctly detected this is NOT a valid PDF file");
            console.error("   - Rejected the invalid document format");
            console.error("   - The error handling is working properly");
        }
        
        if (error.statusCode) {
            console.error(`   Status Code: ${error.statusCode}`);
        }
    }
}

// Run the test
testOriginalTextFile();