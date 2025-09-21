#!/bin/bash

# Robust deployment script for FlowFi infrastructure
set -e

echo "🚀 Starting FlowFi CDK deployment with Azure Document Intelligence integration..."

# Navigate to infrastructure directory
cd /Users/suzarilshah/FlowFi/aws/infrastructure

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set AWS profile
echo "🔑 Setting AWS profile..."
export AWS_PROFILE=flowfi

# Force refresh SSO credentials
echo "🔐 Refreshing AWS SSO credentials..."
aws sso logout --profile flowfi || true
aws sso login --profile flowfi

# Wait a moment for credentials to propagate
echo "⏳ Waiting for credentials to propagate..."
sleep 5

# Verify credentials
echo "✅ Verifying AWS credentials..."
aws sts get-caller-identity --profile flowfi

# Bootstrap CDK if needed
echo "🥾 Bootstrapping CDK..."
npx cdk bootstrap --profile flowfi || echo "Bootstrap already completed or failed"

# Synthesize the stack
echo "🔍 Synthesizing CDK stack..."
npx cdk synth FlowFiStack

# Deploy the stack
echo "🏗️  Deploying CDK stack with Azure Document Intelligence configuration..."
npx cdk deploy FlowFiStack --require-approval never --profile flowfi

echo "✅ Deployment completed successfully!"
echo "🎉 FlowFi infrastructure with Azure Document Intelligence is now deployed!"