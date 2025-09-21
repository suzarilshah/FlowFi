#!/bin/bash

# Clean deployment script for FlowFi using only account 076181802739
# This script removes all references to account 202291438802

set -e

echo "🚀 Starting clean deployment for FlowFi using account 076181802739..."

# Navigate to infrastructure directory
cd /Users/suzarilshah/FlowFi/aws/infrastructure

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set AWS profile to flowfi (which uses account 076181802739)
export AWS_PROFILE=flowfi
export AWS_REGION=ap-southeast-1

echo "🔐 Using AWS Profile: $AWS_PROFILE"
echo "📍 Using AWS Region: $AWS_REGION"

# Verify we're using the correct account
echo "🔍 Verifying AWS account..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Current AWS Account ID: $ACCOUNT_ID"

if [ "$ACCOUNT_ID" != "076181802739" ]; then
    echo "❌ ERROR: Wrong AWS account! Expected 076181802739 but got $ACCOUNT_ID"
    exit 1
fi

echo "✅ Confirmed using correct account: 076181802739"

# Login with SSO if needed
echo "🔑 Checking SSO credentials..."
aws sts get-caller-identity > /dev/null 2>&1 || {
    echo "🔄 SSO credentials expired, logging in..."
    aws sso login --profile flowfi
}

# Bootstrap CDK if needed
echo "🔧 Bootstrapping CDK..."
npx cdk bootstrap aws://076181802739/ap-southeast-1 --profile flowfi || true

# Synthesize the stack
echo "📋 Synthesizing CDK stack..."
npx cdk synth --profile flowfi

# Deploy the stack
echo "🚀 Deploying CDK stack..."
npx cdk deploy --profile flowfi --require-approval never

echo "✅ Deployment completed successfully!"
echo "📊 Stack deployed using account: 076181802739"
echo "🎯 AWS Profile: flowfi"
echo "🌍 Region: ap-southeast-1"