#!/bin/bash

set -e

PROFILE="flowfi"

# Log in to AWS SSO
aws sso login --profile "$PROFILE"

# Export credentials to the environment
eval "$(aws configure export-credentials --profile "$PROFILE" --format env)"

# Navigate to the infrastructure directory
cd "$(dirname "$0")/infrastructure"

# Deploy the CDK stack
npx cdk deploy --require-approval never