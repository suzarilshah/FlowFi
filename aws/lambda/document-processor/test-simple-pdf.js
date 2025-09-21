const fs = require('fs');
const { DocumentAnalysisClient, AzureKeyCredential } = require('@azure/ai-form-recognizer');

async function testSimplePDF() {
    try {
        console.log('Testing simple PDF with Azure Document Intelligence...');
        
        // Read the simple PDF
        const pdfBuffer = fs.readFileSync('/Users/suzarilshah/FlowFi/aws/lambda/document-processor/test-invoice-simple.pdf');
        console.log('PDF loaded, size:', pdfBuffer.length, 'bytes');
        console.log('First 8 bytes:', pdfBuffer.slice(0, 8).toString());
        
        // Create Azure client
        const client = new DocumentAnalysisClient(
            'https://flowfis.cognitiveservices.azure.com/',
            new AzureKeyCredential('process.env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY')
        );
        
        console.log('Starting document analysis...');
        const poller = await client.beginAnalyzeDocument('prebuilt-invoice', pdfBuffer);
        console.log('Poller created, waiting for results...');
        const result = await poller.pollUntilDone();
        
        console.log('Analysis completed successfully!');
        console.log('- Number of documents found:', result.documents?.length || 0);
        console.log('- Number of pages:', result.pages?.length || 0);
        
        if (result.documents && result.documents.length > 0) {
            const doc = result.documents[0];
            console.log('- Document type:', doc.docType);
            console.log('- Confidence:', doc.confidence);
            console.log('- Fields found:', Object.keys(doc.fields || {}));
            
            // Show some extracted fields
            const fields = doc.fields || {};
            if (fields.VendorName) {
                console.log('- Vendor Name:', fields.VendorName.value, '(confidence:', fields.VendorName.confidence, ')');
            }
            if (fields.InvoiceTotal) {
                console.log('- Invoice Total:', fields.InvoiceTotal.value, '(confidence:', fields.InvoiceTotal.confidence, ')');
            }
        } else {
            console.log('- No documents were extracted from this PDF');
            console.log('- This might be because the PDF is too simple or doesn\'t contain invoice-like content');
        }
        
    } catch (error) {
        console.error('Azure Document Intelligence error:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
            details: error.details || 'No additional details'
        });
    }
}

testSimplePDF();