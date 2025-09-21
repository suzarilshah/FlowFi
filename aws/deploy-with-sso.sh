#!/bin/bash

# This script automates the deployment of the FlowFi application to AWS using AWS SSO.

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Step 1: Logging in with AWS SSO"
aws sso login --profile flowfi-dev

echo "Step 2: Navigating to the infrastructure directory"
cd "$(dirname "$0")/infrastructure"

echo "Step 3: Installing dependencies"
npm install

echo "Step 4: Bootstrapping CDK"
npx cdk bootstrap --profile flowfi-dev

echo "Step 5: Synthesizing the CDK stack"
npx cdk synth --profile flowfi-dev

echo "Step 6: Deploying the CDK stack"
npx cdk deploy --profile flowfi-dev --require-approval never

echo "Deployment completed successfully!"