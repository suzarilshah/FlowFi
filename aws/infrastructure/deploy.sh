#!/bin/bash

set -e

echo "🚀 Starting FlowFi Search Service Lambda Deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Change to Lambda function directory
cd "$(dirname "$0")"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --production

# Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
rm -f deployment-package.zip
zip -r deployment-package.zip . -x "*.git*" "test-*" "*.md" "deploy.sh"

PACKAGE_SIZE=$(du -h deployment-package.zip | cut -f1)
echo -e "${GREEN}✅ Deployment package created: $PACKAGE_SIZE${NC}"

echo -e "${GREEN}🎉 Deployment script finished successfully!${NC}"