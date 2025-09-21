#!/bin/bash

# AWS Connection Test Script for FlowFi
# This script tests the AWS CLI configuration and service connectivity

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

echo "🔍 FlowFi AWS Connection Test"
echo "============================="
echo

# Test 1: AWS CLI Installation
print_test "Checking AWS CLI installation..."
if command -v aws &> /dev/null; then
    version=$(aws --version)
    print_pass "AWS CLI is installed: $version"
else
    print_fail "AWS CLI is not installed"
    exit 1
fi
echo

# Test 2: AWS Configuration
print_test "Checking AWS configuration..."
if aws configure list &> /dev/null; then
    print_pass "AWS CLI is configured"
    print_info "Current configuration:"
    aws configure list
else
    print_fail "AWS CLI is not configured. Run 'aws configure' first."
    exit 1
fi
echo

# Test 3: AWS Authentication
print_test "Testing AWS authentication..."
if identity=$(aws sts get-caller-identity 2>/dev/null); then
    print_pass "AWS authentication successful"
    echo "$identity" | jq .
else
    print_fail "AWS authentication failed. Check your credentials."
    exit 1
fi
echo

# Test 4: S3 Access
print_test "Testing S3 access..."
if aws s3 ls &> /dev/null; then
    print_pass "S3 access successful"
    bucket_count=$(aws s3 ls | wc -l)
    print_info "Found $bucket_count S3 buckets"
else
    print_fail "S3 access failed. Check your permissions."
fi
echo

# Test 5: Textract Service
print_test "Testing Textract service availability..."
if aws textract describe-document-text-detection --job-id "test-job-id" 2>&1 | grep -q "InvalidJobIdException"; then
    print_pass "Textract service is available"
elif aws textract describe-document-text-detection --job-id "test-job-id" 2>&1 | grep -q "AccessDeniedException"; then
    print_fail "Textract access denied. Check your permissions."
else
    print_info "Textract service status unclear (this is normal if no jobs exist)"
fi
echo

# Test 6: Bedrock Service
print_test "Testing Bedrock service availability..."
if aws bedrock list-foundation-models &> /dev/null; then
    print_pass "Bedrock service is available"
    model_count=$(aws bedrock list-foundation-models --query 'length(modelSummaries)' --output text)
    print_info "Found $model_count foundation models"
elif aws bedrock list-foundation-models 2>&1 | grep -q "AccessDeniedException"; then
    print_fail "Bedrock access denied. Check your permissions or region."
else
    print_info "Bedrock service might not be available in your region"
fi
echo

# Test 7: SES Service
print_test "Testing SES service availability..."
if aws ses get-send-quota &> /dev/null; then
    print_pass "SES service is available"
    quota=$(aws ses get-send-quota --query 'Max24HourSend' --output text)
    print_info "SES daily send quota: $quota emails"
elif aws ses get-send-quota 2>&1 | grep -q "AccessDeniedException"; then
    print_fail "SES access denied. Check your permissions."
else
    print_info "SES service status unclear"
fi
echo

# Test 8: Lambda Service
print_test "Testing Lambda service availability..."
if aws lambda list-functions &> /dev/null; then
    print_pass "Lambda service is available"
    function_count=$(aws lambda list-functions --query 'length(Functions)' --output text)
    print_info "Found $function_count Lambda functions"
elif aws lambda list-functions 2>&1 | grep -q "AccessDeniedException"; then
    print_fail "Lambda access denied. Check your permissions."
else
    print_info "Lambda service status unclear"
fi
echo

# Summary
echo "📋 Test Summary"
echo "==============="
region=$(aws configure get region)
print_info "AWS Region: $region"
print_info "AWS Account: $(aws sts get-caller-identity --query Account --output text)"
print_info "AWS User/Role: $(aws sts get-caller-identity --query Arn --output text)"
echo
print_info "✅ All core services tested. Review any failures above."
print_info "🚀 Your AWS setup is ready for FlowFi development!"
echo
print_info "Next steps:"
echo "1. Run './scripts/aws-setup.sh' to set up FlowFi infrastructure"
echo "2. Configure your .env.aws file with specific settings"
echo "3. Start developing your FlowFi backend services"
echo