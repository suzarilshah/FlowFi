const AWS = require('aws-sdk');

// Configure AWS
const s3 = new AWS.S3({
    region: 'ap-southeast-1'
});

async function testS3File() {
    try {
        console.log('Testing S3 file access...');
        
        // Try to get the test file from S3
        const result = await s3.getObject({
            Bucket: 'flowfi-documents-dev',
            Key: 'test-invoice.pdf'
        }).promise();
        
        console.log('File retrieved successfully:');
        console.log('- Content-Type:', result.ContentType);
        console.log('- Content-Length:', result.ContentLength);
        console.log('- Last Modified:', result.LastModified);
        console.log('- ETag:', result.ETag);
        
        // Check if it's actually a PDF
        const isPDF = result.ContentType === 'application/pdf' || 
                     result.ContentType === 'application/x-pdf' ||
                     (result.Body && result.Body.length > 4 && 
                      result.Body.slice(0, 4).toString() === '%PDF');
        
        console.log('- Is PDF:', isPDF);
        
        if (result.Body && result.Body.length > 0) {
            console.log('- First 20 bytes:', result.Body.slice(0, 20));
            console.log('- Last 20 bytes:', result.Body.slice(-20));
        }
        
    } catch (error) {
        console.error('Error accessing S3 file:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
    }
}

testS3File();