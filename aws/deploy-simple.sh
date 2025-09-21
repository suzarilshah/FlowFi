#!/bin/bash

# Simple deployment script for FlowFi infrastructure
set -e

echo "🚀 Starting FlowFi CDK deployment..."

# Navigate to infrastructure directory
cd /Users/suzarilshah/FlowFi/aws/infrastructure

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Try to use the flowfi profile directly
echo "🔑 Setting AWS profile..."
export AWS_PROFILE=flowfi

# Login to SSO
echo "🔐 Logging in to AWS SSO..."
aws sso login --profile flowfi

# Deploy the stack
echo "🏗️  Deploying CDK stack..."
npx cdk deploy FlowFiStack --require-approval never

echo "✅ Deployment completed successfully!"