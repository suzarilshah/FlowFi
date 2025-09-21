#!/bin/bash

# This script uses aws-vault to execute the CDK deployment.
# It now uses AWS SSO for authentication.

set -e

# Configuration
PROFILE="flowfi" # The AWS profile to use with aws-vault

echo "Step 1: Logging in with AWS SSO"
aws sso login --profile "$PROFILE"

echo "Step 2: Navigating to the infrastructure directory"
cd "$(dirname "$0")/infrastructure"

echo "Step 3: Installing dependencies"
npm install

echo "Step 4: Bootstrapping CDK"
aws-vault exec "$PROFILE" -- cdk bootstrap

echo "Step 5: Synthesizing the CDK stack"
aws-vault exec "$PROFILE" -- cdk synth

echo "Step 6: Deploying the CDK stack with aws-vault"
aws-vault exec "$PROFILE" -- cdk deploy --require-approval never

echo "Deployment completed successfully!"