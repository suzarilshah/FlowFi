const fs = require('fs');
const AWS = require('aws-sdk');

// Configure AWS
const s3 = new AWS.S3({
    region: 'ap-southeast-1'
});

// Create a simple test PDF content (minimal valid PDF)
function createTestPDF() {
    // This is a minimal valid PDF structure
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Invoice Test Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000100 00000 n 
0000000178 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
270
%%EOF`;
    
    return Buffer.from(pdfContent, 'utf8');
}

async function uploadTestFile() {
    try {
        const pdfBuffer = createTestPDF();
        
        console.log('Uploading test PDF to S3...');
        console.log('- PDF size:', pdfBuffer.length, 'bytes');
        console.log('- First 8 bytes:', pdfBuffer.slice(0, 8).toString());
        
        await s3.putObject({
            Bucket: 'flowfi-documents-dev',
            Key: 'test-invoice-simple.pdf',
            Body: pdfBuffer,
            ContentType: 'application/pdf'
        }).promise();
        
        console.log('Test PDF uploaded successfully!');
        
        // Now test with Azure
        await testWithAzure(pdfBuffer);
        
    } catch (error) {
        console.error('Error uploading test file:', error);
    }
}

async function testWithAzure(buffer) {
    try {
        console.log('\nTesting with Azure Document Intelligence...');
        
        const { DocumentAnalysisClient, AzureKeyCredential } = require('@azure/ai-form-recognizer');
        
        const client = new DocumentAnalysisClient(
            'https://flowfis.cognitiveservices.azure.com/',
            new AzureKeyCredential('process.env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY')
        );
        
        console.log('Starting document analysis...');
        const poller = await client.beginAnalyzeDocument('prebuilt-invoice', buffer);
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
        }
        
    } catch (error) {
        console.error('Azure Document Intelligence error:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
            details: error.details
        });
    }
}

uploadTestFile();