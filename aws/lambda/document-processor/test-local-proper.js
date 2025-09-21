const fs = require('fs');
const { AzureKeyCredential, DocumentAnalysisClient } = require("@azure/ai-form-recognizer");

// Load Azure configuration
const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || "https://flowfi-document-intelligence.cognitiveservices.azure.com/";
const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY;

if (!apiKey) {
    console.error("❌ AZURE_DOCUMENT_INTELLIGENCE_API_KEY environment variable is not set");
    process.exit(1);
}

async function testProperInvoice() {
    try {
        console.log("🧪 Testing proper invoice PDF with Azure Document Intelligence...");
        console.log("📄 File: test-invoice-proper.pdf");
        
        // Read the proper PDF file
        const pdfBuffer = fs.readFileSync('test-invoice-proper.pdf');
        console.log(`✅ PDF loaded, size: ${pdfBuffer.length} bytes`);
        
        // Check if it's actually a PDF
        const firstBytes = pdfBuffer.slice(0, 8).toString();
        console.log(`🔍 First 8 bytes: ${firstBytes}`);
        
        if (!firstBytes.startsWith('%PDF')) {
            console.error("❌ This does not appear to be a valid PDF file");
            return;
        }
        
        console.log("✅ Valid PDF format detected");
        
        // Initialize Azure client
        const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));
        console.log("🔄 Starting document analysis...");
        
        // Analyze the document using prebuilt-invoice model
        const poller = await client.beginAnalyzeDocument("prebuilt-invoice", pdfBuffer);
        console.log("⏳ Poller created, waiting for results...");
        
        const { documents } = await poller.pollUntilDone();
        
        console.log("✅ Analysis completed successfully!");
        console.log(`📊 Number of documents found: ${documents.length}`);
        
        if (documents.length > 0) {
            const document = documents[0];
            console.log(`📄 Document type: ${document.docType || 'unknown'}`);
            console.log(`🎯 Confidence: ${document.confidence || 'N/A'}`);
            
            // Extract key fields
            const fields = document.fields || {};
            console.log("\n📋 Extracted Fields:");
            
            if (fields.VendorName) {
                console.log(`  🏢 Vendor Name: ${fields.VendorName.value} (confidence: ${fields.VendorName.confidence})`);
            }
            
            if (fields.InvoiceId) {
                console.log(`  📋 Invoice ID: ${fields.InvoiceId.value} (confidence: ${fields.InvoiceId.confidence})`);
            }
            
            if (fields.InvoiceDate) {
                console.log(`  📅 Invoice Date: ${fields.InvoiceDate.value} (confidence: ${fields.InvoiceDate.confidence})`);
            }
            
            if (fields.InvoiceTotal) {
                console.log(`  💰 Invoice Total: ${fields.InvoiceTotal.value} ${fields.InvoiceTotal.value.currency || ''} (confidence: ${fields.InvoiceTotal.confidence})`);
            }
            
            if (fields.Items) {
                console.log(`  📦 Items: ${fields.Items.value?.length || 0} line items found`);
            }
            
            // Show all available fields
            console.log("\n🔍 All Available Fields:");
            Object.keys(fields).forEach(fieldName => {
                const field = fields[fieldName];
                console.log(`  - ${fieldName}: ${JSON.stringify(field.value)} (confidence: ${field.confidence})`);
            });
            
        } else {
            console.log("⚠️  No documents were extracted from this PDF");
            console.log("💡 This might mean the PDF doesn't contain recognizable invoice data");
        }
        
    } catch (error) {
        console.error("❌ Error during analysis:");
        console.error(`   ${error.message}`);
        
        if (error.message.includes('Invalid request')) {
            console.error("\n💡 This error typically means:");
            console.error("   - The file format is not supported (must be PDF, JPG, PNG, etc.)");
            console.error("   - The file is corrupted or not a valid document");
            console.error("   - The document type doesn't match the model (prebuilt-invoice)");
        }
        
        if (error.statusCode) {
            console.error(`   Status Code: ${error.statusCode}`);
        }
    }
}

// Run the test
testProperInvoice();