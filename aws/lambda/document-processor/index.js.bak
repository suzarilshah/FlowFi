const AWS = require('aws-sdk');
const { DocumentAnalysisClient, AzureKeyCredential } = require('@azure/ai-form-recognizer');
const s3 = new AWS.S3();
const sns = new AWS.SNS();
const { Client } = require('@opensearch-project/opensearch');

// OpenSearch Configuration
const OPENSEARCH_ENDPOINT = process.env.OPENSEARCH_ENDPOINT;
const opensearchClient = new Client({
  node: OPENSEARCH_ENDPOINT,
});


// Azure Document Intelligence Configuration
const DOCUMENT_INTELLIGENCE_ENDPOINT = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
const DOCUMENT_INTELLIGENCE_API_KEY = process.env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY;

if (!DOCUMENT_INTELLIGENCE_ENDPOINT || !DOCUMENT_INTELLIGENCE_API_KEY) {
    throw new Error('Azure Document Intelligence configuration missing. Please set AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT and AZURE_DOCUMENT_INTELLIGENCE_API_KEY environment variables.');
}

// Azure Document Intelligence Client
let documentClient = null;

function getDocumentClient() {
    if (!documentClient) {
        documentClient = new DocumentAnalysisClient(
            DOCUMENT_INTELLIGENCE_ENDPOINT,
            new AzureKeyCredential(DOCUMENT_INTELLIGENCE_API_KEY)
        );
    }
    return documentClient;
}

// Extract invoice data from Azure Document Intelligence results
function extractInvoiceData(analysisResult) {
    const documents = analysisResult.documents || [];
    const firstDocument = documents[0];
    
    if (!firstDocument) {
        throw new Error('No documents found in analysis result');
    }

    const fields = firstDocument.fields || {};
    
    return {
        vendorName: fields.VendorName?.value || fields.MerchantName?.value || 'Unknown Vendor',
        vendorAddress: fields.VendorAddress?.value || '',
        invoiceTotal: fields.InvoiceTotal?.value || fields.TotalAmount?.value || 0,
        invoiceDate: fields.InvoiceDate?.value || fields.TransactionDate?.value || new Date().toISOString(),
        invoiceId: fields.InvoiceId?.value || fields.InvoiceNumber?.value || '',
        description: fields.Description?.value || fields.TransactionDescription?.value || 'Invoice expense',
        currency: fields.Currency?.value || 'MYR',
        taxAmount: fields.TaxAmount?.value || 0,
        items: extractLineItems(fields.Items),
        confidence: firstDocument.confidence || 0.8,
        text: extractFullText(analysisResult)
    };
}

// Extract line items from invoice
function extractLineItems(itemsField) {
    const items = [];
    
    if (itemsField && itemsField.value && Array.isArray(itemsField.value)) {
        itemsField.value.forEach((item, index) => {
            const itemData = item.value || {};
            items.push({
                description: itemData.Description?.value || itemData.ItemDescription?.value || '',
                quantity: itemData.Quantity?.value || 1,
                unitPrice: itemData.UnitPrice?.value || 0,
                totalPrice: itemData.TotalPrice?.value || 0,
                confidence: item.confidence || 0.7
            });
        });
    }
    
    return items;
}

// Extract full text from all pages
function extractFullText(analysisResult) {
    let fullText = '';
    const pages = analysisResult.pages || [];
    
    pages.forEach(page => {
        if (page.lines && Array.isArray(page.lines)) {
            page.lines.forEach(line => {
                if (line.content) {
                    fullText += line.content + '\n';
                }
            });
        }
    });
    
    return fullText;
}

// Process document with Azure Document Intelligence
async function processDocumentWithAzure(documentBuffer, fileName) {
    try {
        console.log(`[INFO] Starting document processing for: ${fileName}`);
        
        // Analyze with Azure Document Intelligence
        const client = getDocumentClient();
        console.log(`[INFO] Analyzing document with Azure Document Intelligence...`);
        const poller = await client.beginAnalyzeDocument('prebuilt-invoice', documentBuffer);
        const result = await poller.pollUntilDone();

        console.log(`[SUCCESS] Document analysis completed for: ${fileName}`);

        // Extract key information
        const extractedData = extractInvoiceData(result);
        console.log(`[INFO] Extracted data from document: ${fileName}`);
        
        return {
            success: true,
            extractedData,
            confidence: extractedData.confidence,
            status: 'processed'
        };

    } catch (error) {
        console.error(`[ERROR] Failed to process document with Azure: ${fileName}`, error);
        throw new Error(`Document processing failed: ${error.message}`);
    }
}

exports.handler = async (event) => {
    console.log('[INFO] Document processor triggered with event:', JSON.stringify(event, null, 2));
    
    try {
        // Handle S3 event or direct invocation
        let bucketName, objectKey;
        
        if (event.Records && event.Records[0] && event.Records[0].s3) {
            // S3 event
            bucketName = event.Records[0].s3.bucket.name;
            objectKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
        } else if (event.bucketName && event.objectKey) {
            // Direct invocation
            bucketName = event.bucketName;
            objectKey = event.objectKey;
        } else {
            throw new Error('Invalid event format. No S3 records or direct invocation parameters found.');
        }
        
        console.log(`[INFO] Processing document: s3://${bucketName}/${objectKey}`);
        
        // Get document from S3
        const s3Object = await s3.getObject({
            Bucket: bucketName,
            Key: objectKey
        }).promise();
        
        const documentBuffer = s3Object.Body;
        console.log(`[INFO] Successfully downloaded document from S3.`);
        
        // Process with Azure Document Intelligence
        const azureResult = await processDocumentWithAzure(documentBuffer, objectKey);
        
        // Prepare extracted data
        const extractedData = {
            text: azureResult.extractedData.text,
            vendor: {
                name: azureResult.extractedData.vendorName,
                address: azureResult.extractedData.vendorAddress
            },
            invoice: {
                total: azureResult.extractedData.invoiceTotal,
                date: azureResult.extractedData.invoiceDate,
                id: azureResult.extractedData.invoiceId,
                currency: azureResult.extractedData.currency,
                taxAmount: azureResult.extractedData.taxAmount
            },
            items: azureResult.extractedData.items,
            metadata: {
                documentName: objectKey,
                processedAt: new Date().toISOString(),
                confidence: azureResult.extractedData.confidence,
                processedBy: 'Azure Document Intelligence'
            }
        };
        
        // Store processed data back to S3
        const processedKey = `processed/${objectKey.replace(/\.[^/.]+$/, '')}.json`;
        await s3.putObject({
            Bucket: bucketName,
            Key: processedKey,
            Body: JSON.stringify(extractedData, null, 2),
            ContentType: 'application/json'
        }).promise();
        console.log(`[SUCCESS] Stored processed data to: s3://${bucketName}/${processedKey}`);

        // Index data in OpenSearch
        const indexName = 'documents';
        const documentId = objectKey.replace(/\.[^/.]+$/, '');

        await opensearchClient.index({
            index: indexName,
            id: documentId,
            body: extractedData,
            refresh: true,
        });
        console.log(`[SUCCESS] Indexed document in OpenSearch with ID: ${documentId}`);
        
        // Send SNS notification
        if (process.env.SNS_TOPIC_ARN) {
            await sns.publish({
                TopicArn: process.env.SNS_TOPIC_ARN,
                Message: JSON.stringify({
                    event: 'document_processed',
                    documentKey: objectKey,
                    processedKey: processedKey,
                    confidence: extractedData.metadata.confidence,
                    vendor: extractedData.vendor.name,
                    total: extractedData.invoice.total,
                    timestamp: new Date().toISOString()
                }),
                Subject: 'Document Processing Complete - Azure Document Intelligence'
            }).promise();
            console.log(`[SUCCESS] Sent SNS notification for: ${objectKey}`);
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: 'Document processed successfully with Azure Document Intelligence',
                data: {
                    originalKey: objectKey,
                    processedKey: processedKey,
                    confidence: extractedData.metadata.confidence,
                    vendor: extractedData.vendor.name,
                    total: extractedData.invoice.total
                }
            })
        };
        
    } catch (error) {
        console.error('[FATAL] Unhandled error in document processor:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                message: 'Error processing document',
                error: error.message
            })
        };
    }
};