const fs = require('fs');
const path = require('path');

// Create a simple HTML invoice that will be converted to PDF-like format
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .invoice-header { background-color: #f0f0f0; padding: 20px; margin-bottom: 20px; }
        .invoice-details { margin-bottom: 20px; }
        .item-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .item-table th, .item-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .item-table th { background-color: #f2f2f2; }
        .total { text-align: right; font-weight: bold; font-size: 16px; }
    </style>
</head>
<body>
    <div class="invoice-header">
        <h1>INVOICE</h1>
        <p><strong>Invoice Number:</strong> INV-2024-001</p>
        <p><strong>Date:</strong> January 15, 2024</p>
    </div>
    
    <div class="invoice-details">
        <p><strong>From:</strong></p>
        <p>FlowFi Technologies Inc.<br>
        123 Business Street<br>
        San Francisco, CA 94105<br>
        Email: billing@flowfi.com</p>
        
        <p><strong>To:</strong></p>
        <p>Test Customer<br>
        456 Customer Ave<br>
        New York, NY 10001</p>
    </div>
    
    <table class="item-table">
        <thead>
            <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Software Development Services</td>
                <td>10</td>
                <td>$150.00</td>
                <td>$1,500.00</td>
            </tr>
            <tr>
                <td>Cloud Infrastructure Setup</td>
                <td>1</td>
                <td>$500.00</td>
                <td>$500.00</td>
            </tr>
        </tbody>
    </table>
    
    <div class="total">
        <p><strong>Subtotal: $2,000.00</strong></p>
        <p><strong>Tax (8.875%): $177.50</strong></p>
        <p><strong>Total: $2,177.50</strong></p>
    </div>
    
    <p><strong>Payment Terms:</strong> Net 30 days</p>
    <p><strong>Payment Method:</strong> Bank Transfer</p>
</body>
</html>
`;

// For now, let's create a simple text-based PDF-like structure
// This will be enough to test Azure Document Intelligence
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
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 1000
>>
stream
BT
/F1 12 Tf
50 750 Td
(Invoice) Tj
ET

BT
/F1 10 Tf
50 720 Td
(Invoice Number: INV-2024-001) Tj
ET

BT
/F1 10 Tf
50 700 Td
(Date: January 15, 2024) Tj
ET

BT
/F1 10 Tf
50 650 Td
(From: FlowFi Technologies Inc.) Tj
ET

BT
/F1 10 Tf
50 630 Td
(123 Business Street) Tj
ET

BT
/F1 10 Tf
50 610 Td
(San Francisco, CA 94105) Tj
ET

BT
/F1 10 Tf
50 580 Td
(To: Test Customer) Tj
ET

BT
/F1 10 Tf
50 560 Td
(456 Customer Ave) Tj
ET

BT
/F1 10 Tf
50 540 Td
(New York, NY 10001) Tj
ET

BT
/F1 10 Tf
50 480 Td
(Description: Software Development Services) Tj
ET

BT
/F1 10 Tf
50 460 Td
(Quantity: 10) Tj
ET

BT
/F1 10 Tf
50 440 Td
(Unit Price: $150.00) Tj
ET

BT
/F1 10 Tf
50 420 Td
(Total: $1,500.00) Tj
ET

BT
/F1 12 Tf
50 350 Td
(Total Amount: $1,500.00) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000263 00000 n 
0000001364 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
1433
%%EOF`;

// Write the PDF content to a file
fs.writeFileSync('test-invoice-proper.pdf', pdfContent);

console.log('✅ Created proper test invoice PDF: test-invoice-proper.pdf');
console.log('📄 File size:', fs.statSync('test-invoice-proper.pdf').size, 'bytes');
console.log('');
console.log('Next steps:');
console.log('1. Upload to S3: aws s3 cp test-invoice-proper.pdf s3://flowfi-documents-dev/test-invoice-proper.pdf');
console.log('2. Test with Lambda: aws lambda invoke --function-name flowfi-document-processor-azure --payload \'{"Records":[{"s3":{"bucket":{"name":"flowfi-documents-dev"},"object":{"key":"test-invoice-proper.pdf"}}}]\' /tmp/test-proper.json');