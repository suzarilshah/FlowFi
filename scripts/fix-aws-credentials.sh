#!/bin/bash

# AWS Credential Fix Script for FlowFi
# This script helps you configure a dedicated AWS profile to resolve credential issues.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

main() {
    echo "=============================================="
    echo "   FlowFi AWS Credential Fixer"
    echo "=============================================="
    echo
    print_status "This script will help you create a dedicated AWS profile named 'flowfi'."
    print_status "This will resolve the 'Resolved credential object is not valid' error."
    echo

    # Configure the 'flowfi' profile
    aws configure --profile flowfi

    echo
    print_success "The 'flowfi' AWS profile has been configured."
    echo
    print_status "To use this profile for your deployments, you need to set the AWS_PROFILE environment variable."
    echo
    print_status "You can do this in your current terminal session by running:"
    echo "export AWS_PROFILE=flowfi"
    echo
    print_warning "This command is only valid for the current terminal session. To make it permanent, you should add it to your shell's startup file (e.g., ~/.zshrc, ~/.bash_profile)."
    echo "echo 'export AWS_PROFILE=flowfi' >> ~/.zshrc && source ~/.zshrc"
    echo
    print_status "Now, let's test the connection using the new profile."
    export AWS_PROFILE=flowfi
    
    # Assuming the test script is in the same directory
    if [ -f "./test-aws-connection.sh" ]; then
        ./test-aws-connection.sh
    else
        print_warning "Could not find test-aws-connection.sh. Please run it manually."
    fi
}

main