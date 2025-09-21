#!/bin/bash

# AWS Lambda Deployment Script for FlowFi Document Processor
# This script deploys the document processor function to AWS Lambda

set -e

echo "🚀 Starting FlowFi Document Processor Lambda Deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Change to Lambda function directory
cd "$(dirname "$0")"

# Configuration
FUNCTION_NAME="flowfi-document-processor"
REGION="us-east-1"
RUNTIME="nodejs18.x"
HANDLER="index.handler"
MEMORY_SIZE=512
TIMEOUT=300

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "  Function Name: $FUNCTION_NAME"
echo "  Region: $REGION"
echo "  Runtime: $RUNTIME"
echo "  Memory: ${MEMORY_SIZE}MB"
echo "  Timeout: ${TIMEOUT}s"

# Check AWS CLI and credentials
echo -e "${YELLOW}🔍 Checking AWS CLI and credentials...${NC}"
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install AWS CLI first.${NC}"
    exit 1
fi

# Verify AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials are not configured. Please configure AWS credentials.${NC}"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS credentials verified. Account ID: $ACCOUNT_ID${NC}"

# Create IAM role if it doesn't exist
echo -e "${YELLOW}🔐 Setting up IAM role...${NC}"
ROLE_NAME="flowfi-document-processor-role"

if ! aws iam get-role --role-name $ROLE_NAME &> /dev/null; then
    echo -e "${BLUE}🆕 Creating IAM role: $ROLE_NAME${NC}"
    
    # Create role
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file://trust-policy.json
    
    # Attach basic Lambda execution role
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    
    # Create and attach custom policy
    aws iam put-role-policy \
        --role-name $ROLE_NAME \
        --policy-name FlowFiDocumentProcessorPolicy \
        --policy-document file://lambda-policy.json
    
    echo -e "${GREEN}✅ IAM role created successfully${NC}"
else
    echo -e "${GREEN}✅ IAM role already exists${NC}"
fi

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
echo -e "${BLUE}🔗 Role ARN: $ROLE_ARN${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --production

# Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
rm -f deployment-package.zip
zip -r deployment-package.zip . -x "*.git*" "test-*" "*.md" "test-local.sh" "test-event.json" ".env*"

PACKAGE_SIZE=$(du -h deployment-package.zip | cut -f1)
echo -e "${GREEN}✅ Deployment package created: $PACKAGE_SIZE${NC}"

# Check if function exists
echo -e "${YELLOW}🔍 Checking if function exists...${NC}"
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &> /dev/null; then
    echo -e "${BLUE}🔄 Function exists. Updating function code...${NC}"
    
    # Update function code
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://deployment-package.zip \
        --region $REGION
    
    echo -e "${GREEN}✅ Function code updated successfully${NC}"
    
    # Update function configuration
    echo -e "${YELLOW}⚙️  Updating function configuration...${NC}"
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --memory-size $MEMORY_SIZE \
        --timeout $TIMEOUT \
        --environment "Variables={DOCUMENTS_BUCKET=flowfi-documents,SNS_TOPIC_ARN=arn:aws:sns:$REGION:$ACCOUNT_ID:flowfi-document-events}" \
        --region $REGION
    
    echo -e "${GREEN}✅ Function configuration updated${NC}"
else
    echo -e "${BLUE}🆕 Function does not exist. Creating new function...${NC}"
    
    # Create function
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://deployment-package.zip \
        --memory-size $MEMORY_SIZE \
        --timeout $TIMEOUT \
        --environment "Variables={DOCUMENTS_BUCKET=flowfi-documents,SNS_TOPIC_ARN=arn:aws:sns:$REGION:$ACCOUNT_ID:flowfi-document-events}" \
        --region $REGION
    
    echo -e "${GREEN}✅ Function created successfully${NC}"
fi

# Wait for function to be active
echo -e "${YELLOW}⏳ Waiting for function to be active...${NC}"
aws lambda wait function-active --function-name $FUNCTION_NAME --region $REGION

# Test the function
echo -e "${YELLOW}🧪 Testing function invocation...${NC}"
test_event='{"Records":[{"s3":{"bucket":{"name":"flowfi-documents"},"object":{"key":"test-invoice.pdf"}}}]}'

if aws lambda invoke \
    --function-name $FUNCTION_NAME \
    --payload "$test_event" \
    --region $REGION \
    response.json &> /dev/null; then
    
    echo -e "${GREEN}✅ Function invocation test passed${NC}"
    
    # Show response
    if [ -f response.json ]; then
        echo -e "${BLUE}📤 Function Response:${NC}"
        cat response.json | jq '.' 2>/dev/null || cat response.json
        rm -f response.json
    fi
else
    echo -e "${RED}❌ Function invocation test failed${NC}"
fi

# Get function configuration
echo -e "${BLUE}📊 Function Configuration:${NC}"
aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration' | jq '.'

# Get function URL (if applicable)
if aws lambda get-function-url-config --function-name $FUNCTION_NAME --region $REGION &> /dev/null; then
    FUNCTION_URL=$(aws lambda get-function-url-config --function-name $FUNCTION_NAME --region $REGION --query FunctionUrl --output text)
    echo -e "${GREEN}✅ Function URL: $FUNCTION_URL${NC}"
fi

# Cleanup
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
rm -f deployment-package.zip

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "  1. Upload test documents to S3 bucket: flowfi-documents"
echo "  2. Monitor CloudWatch logs for processing results"
echo "  3. Test with actual invoice PDF files"
echo "  4. Verify SNS notifications are working"
echo ""
echo -e "${YELLOW}🔗 Function ARN: arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME${NC}"
echo -e "${YELLOW}📊 Monitor logs: aws logs tail /aws/lambda/$FUNCTION_NAME --follow${NC}"