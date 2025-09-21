#!/bin/bash

# Local testing script for FlowFi Document Processor Lambda Function
# This script tests the document processing functionality locally

set -e

echo "🚀 Starting FlowFi Document Processor Local Testing"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to Lambda function directory
cd "$(dirname "$0")"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ to proceed.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
echo -e "${GREEN}✅ Node.js version: $NODE_VERSION${NC}"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Create test environment file
cat > .env.test << EOF
AWS_REGION=us-east-1
DOCUMENTS_BUCKET=flowfi-documents-test
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:flowfi-document-events-test
EOF

# Set test environment variables
export AWS_REGION=us-east-1
export DOCUMENTS_BUCKET=flowfi-documents-test
export SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:flowfi-document-events-test

# Create a test PDF file (simulated)
echo "Creating test PDF file..."
cat > test-invoice.pdf << 'EOF'
%PDF-1.4
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
(Invoice #12345 - Test Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000112 00000 n 
0000000178 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
270
%%EOF
EOF

# Mock AWS services for local testing
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_SESSION_TOKEN=test

echo -e "${YELLOW}🧪 Running local tests...${NC}"

# Test 1: Basic function loading
echo "Test 1: Testing function loading..."
node -e "
try {
  const handler = require('./index.js').handler;
  console.log('✅ Function loaded successfully');
  console.log('Handler type:', typeof handler);
} catch (error) {
  console.error('❌ Failed to load function:', error.message);
  process.exit(1);
}
"

# Test 2: Event validation
echo "Test 2: Testing event validation..."
node -e "
const handler = require('./index.js').handler;
const testEvent = require('./test-event.json');

// Test with invalid event
handler({}, {}, (error, result) => {
  if (error) {
    console.log('✅ Correctly rejected invalid event');
  } else {
    console.log('❌ Should reject invalid event');
    process.exit(1);
  }
});
"

# Test 3: Mock Textract response
echo "Test 3: Testing with mock Textract response..."
node -e "
const handler = require('./index.js').handler;
const AWS = require('aws-sdk');

// Mock Textract
const mockTextract = {
  analyzeDocument: () => ({
    promise: () => Promise.resolve({
      Blocks: [
        {
          BlockType: 'LINE',
          Text: 'INVOICE #12345',
          Confidence: 99.5,
          Geometry: {
            BoundingBox: { Width: 0.5, Height: 0.1, Left: 0.1, Top: 0.1 }
          }
        },
        {
          BlockType: 'LINE',
          Text: 'Total Amount: $1,250.00',
          Confidence: 98.2,
          Geometry: {
            BoundingBox: { Width: 0.6, Height: 0.1, Left: 0.1, Top: 0.2 }
          }
        }
      ]
    })
  })
};

AWS.Textract = function() { return mockTextract; };

const mockEvent = {
  Records: [{
    s3: {
      bucket: { name: 'flowfi-documents-test' },
      object: { key: 'test-invoice.pdf' }
    }
  }]
};

handler(mockEvent, {}, (error, result) => {
  if (error) {
    console.log('❌ Function failed:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Function executed successfully');
    console.log('Result:', JSON.stringify(result, null, 2));
  }
});
"

echo -e "${GREEN}✅ All local tests passed!${NC}"
echo -e "${YELLOW}📋 Test Summary:${NC}"
echo "  - Function loads correctly"
echo "  - Event validation works"
echo "  - Mock processing successful"
echo "  - Ready for AWS deployment"

# Cleanup
rm -f .env.test test-invoice.pdf

echo -e "${GREEN}🎉 Document Processor Lambda function is ready for deployment!${NC}"