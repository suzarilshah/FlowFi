#!/bin/bash

# FlowFi AWS Deployment Script
# This script deploys the complete AWS infrastructure for FlowFi

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="ap-southeast-3"  # Malaysia region
STACK_NAME="flowfi-stack"
PROFILE="default"

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check AWS CLI installation
check_aws_cli() {
    print_status "Checking AWS CLI installation..."
    if ! command_exists aws; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    print_success "AWS CLI is installed"
}

# Function to check AWS credentials
check_aws_credentials() {
    print_status "Checking AWS credentials..."
    if ! aws sts get-caller-identity --region $REGION >/dev/null 2>&1; then
        print_error "AWS credentials are not configured or invalid."
        print_error "Please run 'aws configure' to set up your credentials."
        exit 1
    fi
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region $REGION)
    print_success "AWS credentials are valid (Account: $ACCOUNT_ID)"
}

# Function to check CDK installation
check_cdk() {
    print_status "Checking AWS CDK installation..."
    if ! command_exists cdk; then
        print_error "AWS CDK is not installed. Installing..."
        npm install -g aws-cdk
    fi
    print_success "AWS CDK is available"
}

# Function to bootstrap CDK
bootstrap_cdk() {
    print_status "Bootstrapping CDK in region $REGION..."
    
    cd aws/infrastructure
    
    if ! cdk bootstrap aws://$ACCOUNT_ID/$REGION; then
        print_error "CDK bootstrap failed"
        exit 1
    fi
    
    print_success "CDK bootstrap completed"
    cd ../..
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install main project dependencies
    if [ -f "package.json" ]; then
        npm install
        print_success "Main project dependencies installed"
    fi
    
    # Install CDK dependencies
    if [ -f "aws/infrastructure/package.json" ]; then
        cd aws/infrastructure
        npm install
        print_success "CDK dependencies installed"
        cd ../..
    fi
    
    # Install Lambda function dependencies
    for lambda_dir in aws/lambda/*/; do
        if [ -f "${lambda_dir}package.json" ]; then
            print_status "Installing dependencies for $(basename "$lambda_dir")..."
            cd "$lambda_dir"
            npm install
            cd - >/dev/null
        fi
    done
    
    print_success "All dependencies installed"
}

# Function to synthesize CDK stack
synthesize_stack() {
    print_status "Synthesizing CDK stack..."
    
    cd aws/infrastructure
    
    if ! cdk synth; then
        print_error "CDK synthesis failed"
        exit 1
    fi
    
    print_success "CDK stack synthesized successfully"
    cd ../..
}

# Function to deploy CDK stack
deploy_stack() {
    print_status "Deploying CDK stack to AWS..."
    
    cd aws/infrastructure
    
    # Deploy with automatic approval for non-interactive deployment
    if ! cdk deploy --require-approval never --region $REGION; then
        print_error "CDK deployment failed"
        exit 1
    fi
    
    print_success "CDK stack deployed successfully"
    cd ../..
}

# Function to get stack outputs
get_stack_outputs() {
    print_status "Retrieving stack outputs..."
    
    cd aws/infrastructure
    
    # Get stack outputs and save to file
    aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs' \
        --output table > ../../stack-outputs.txt
    
    print_success "Stack outputs saved to stack-outputs.txt"
    cd ../..
}

# Function to create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        print_warning "Created .env file from .env.example"
        print_warning "Please update .env file with actual values from stack outputs"
    else
        print_warning ".env file already exists. Please verify configuration."
    fi
}

# Function to test AWS services
test_aws_services() {
    print_status "Testing AWS service connections..."
    
    if [ -f "src/scripts/init-aws.ts" ]; then
        if command_exists npx; then
            npx ts-node src/scripts/init-aws.ts
        else
            print_warning "ts-node not available. Skipping AWS services test."
            print_warning "Run 'npm run test:aws' manually after deployment."
        fi
    else
        print_warning "AWS initialization script not found. Skipping test."
    fi
}

# Function to display next steps
display_next_steps() {
    echo
    print_success "🎉 AWS infrastructure deployment completed!"
    echo
    print_status "Next steps:"
    echo "1. Review the stack outputs in 'stack-outputs.txt'"
    echo "2. Update your .env file with the actual AWS resource values"
    echo "3. Run 'npm run test:aws' to verify all services are working"
    echo "4. Start your application with 'npm run dev'"
    echo
    print_status "Important files:"
    echo "- .env: Environment configuration"
    echo "- stack-outputs.txt: AWS resource details"
    echo "- aws/infrastructure/cdk.out/: CDK synthesis outputs"
    echo
}

# Main deployment function
main() {
    echo "======================================"
    echo "    FlowFi AWS Deployment Script"
    echo "======================================"
    echo
    
    # Pre-deployment checks
    check_aws_cli
    check_aws_credentials
    check_cdk
    
    # Install dependencies
    install_dependencies
    
    # CDK operations
    bootstrap_cdk
    synthesize_stack
    deploy_stack
    
    # Post-deployment setup
    get_stack_outputs
    create_env_file
    test_aws_services
    
    # Display completion message
    display_next_steps
}

# Handle script arguments
case "${1:-}" in
    "--help" | "-h")
        echo "FlowFi AWS Deployment Script"
        echo
        echo "Usage: $0 [options]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --check        Only run pre-deployment checks"
        echo "  --deploy       Run full deployment"
        echo "  --test         Only test AWS services"
        echo
        exit 0
        ;;
    "--check")
        check_aws_cli
        check_aws_credentials
        check_cdk
        print_success "All pre-deployment checks passed"
        exit 0
        ;;
    "--test")
        test_aws_services
        exit 0
        ;;
    "--deploy" | "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        print_error "Use --help for usage information"
        exit 1
        ;;
esac