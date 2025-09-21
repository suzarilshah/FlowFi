const fs = require('fs');
const { AzureKeyCredential, DocumentAnalysisClient } = require("@azure/ai-form-recognizer");

// Load Azure configuration
const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || "https://flowfis.cognitiveservices.azure.com/";
const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY;

if (!apiKey) {
    console.error("❌ AZURE_DOCUMENT_INTELLIGENCE_API_KEY environment variable is not set");
    process.exit(1);
}

async function testFlowFiPDF() {
    try {
        console.log("🧪 Testing FlowFi PDF with Azure Document Intelligence...");
        console.log("📄 File: /Users/suzarilshah/FlowFi/208113291122-20250905-333711896.pdf");
        
        // Read the FlowFi PDF file
        const pdfBuffer = fs.readFileSync('/Users/suzarilshah/FlowFi/208113291122-20250905-333711896.pdf');
        console.log(`✅ PDF loaded, size: ${pdfBuffer.length} bytes`);
        
        // Check if it's actually a PDF
        const firstBytes = pdfBuffer.slice(0, 8).toString();
        console.log(`🔍 First 8 bytes: ${firstBytes}`);
        
        if (!firstBytes.startsWith('%PDF')) {
            console.error("❌ This does not appear to be a valid PDF file");
            return;
        }
        
        console.log("✅ Valid PDF format detected");
        console.log("📄 PDF Info: 4 pages (zip deflate encoded)");
        
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
            
            // Vendor Information
            if (fields.VendorName) {
                console.log(`  🏢 Vendor Name: ${fields.VendorName.value} (confidence: ${fields.VendorName.confidence})`);
            }
            
            if (fields.VendorAddress) {
                console.log(`  📍 Vendor Address: ${JSON.stringify(fields.VendorAddress.value)} (confidence: ${fields.VendorAddress.confidence})`);
            }
            
            if (fields.VendorAddressRecipient) {
                console.log(`  👤 Vendor Recipient: ${fields.VendorAddressRecipient.value} (confidence: ${fields.VendorAddressRecipient.confidence})`);
            }
            
            // Invoice Details
            if (fields.InvoiceId) {
                console.log(`  📋 Invoice ID: ${fields.InvoiceId.value} (confidence: ${fields.InvoiceId.confidence})`);
            }
            
            if (fields.InvoiceDate) {
                console.log(`  📅 Invoice Date: ${fields.InvoiceDate.value} (confidence: ${fields.InvoiceDate.confidence})`);
            }
            
            if (fields.InvoiceTotal) {
                const total = fields.InvoiceTotal.value;
                console.log(`  💰 Invoice Total: ${total.amount} ${total.currencySymbol || ''} (confidence: ${fields.InvoiceTotal.confidence})`);
            }
            
            // Customer Information
            if (fields.CustomerName) {
                console.log(`  👥 Customer Name: ${fields.CustomerName.value} (confidence: ${fields.CustomerName.confidence})`);
            }
            
            if (fields.CustomerAddress) {
                console.log(`  📍 Customer Address: ${JSON.stringify(fields.CustomerAddress.value)} (confidence: ${fields.CustomerAddress.confidence})`);
            }
            
            // Items
            if (fields.Items) {
                const items = fields.Items.value || [];
                console.log(`  📦 Items: ${items.length} line items found`);
                
                items.forEach((item, index) => {
                    console.log(`    Item ${index + 1}:`);
                    if (item.value.Description) {
                        console.log(`      Description: ${item.value.Description.value} (confidence: ${item.value.Description.confidence})`);
                    }
                    if (item.value.Amount) {
                        console.log(`      Amount: ${JSON.stringify(item.value.Amount.value)} (confidence: ${item.value.Amount.confidence})`);
                    }
                    if (item.value.Quantity) {
                        console.log(`      Quantity: ${item.value.Quantity.value} (confidence: ${item.value.Quantity.confidence})`);
                    }
                });
            }
            
            // Show all available fields
            console.log("\n🔍 All Available Fields:");
            Object.keys(fields).forEach(fieldName => {
                const field = fields[fieldName];
                if (field && field.value !== undefined) {
                    console.log(`  - ${fieldName}: ${JSON.stringify(field.value)} (confidence: ${field.confidence})`);
                }
            });
            
            // Save results to file for further analysis
            const results = {
                documentType: document.docType,
                confidence: document.confidence,
                fields: fields,
                timestamp: new Date().toISOString()
            };
            
            fs.writeFileSync('flowfi-pdf-analysis-results.json', JSON.stringify(results, null, 2));
            console.log("\n💾 Results saved to flowfi-pdf-analysis-results.json");
            
        } else {
            console.log("⚠️  No documents were extracted from this PDF");
            console.log("💡 This might mean the PDF doesn't contain recognizable invoice data");
            console.log("💡 Or the document format isn't supported by the prebuilt-invoice model");
        }
        
    } catch (error) {
        console.error("\n❌ Error during analysis:");
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
        
        // Save error for debugging
        const errorInfo = {
            error: error.message,
            statusCode: error.statusCode,
            timestamp: new Date().toISOString(),
            file: '/Users/suzarilshah/FlowFi/208113291122-20250905-333711896.pdf'
        };
        
        fs.writeFileSync('flowfi-pdf-analysis-error.json', JSON.stringify(errorInfo, null, 2));
        console.log("\n📝 Error details saved to flowfi-pdf-analysis-error.json");
    }
}

// Run the test
testFlowFiPDF();