#!/bin/bash

# AWS Infrastructure Setup Script for FlowFi
# This script helps set up the necessary AWS services and configurations

set -e  # Exit on any error

echo "🚀 FlowFi AWS Infrastructure Setup"
echo "===================================="

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

# Check if AWS CLI is installed and configured
check_aws_cli() {
    print_status "Checking AWS CLI installation..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    print_success "AWS CLI is installed: $(aws --version)"
    
    # Check if AWS is configured
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "AWS CLI is properly configured"
    echo "Current AWS Identity: $(aws sts get-caller-identity --query 'Arn' --output text)"
}

# Check AWS service availability in the current region
check_service_availability() {
    local region=$(aws configure get region)
    print_status "Checking AWS service availability in region: $region"
    
    # Check if Textract is available
    if aws textract describe-document-text-detection --job-id "test" 2>&1 | grep -q "InvalidJobIdException\|AccessDeniedException"; then
        print_success "Amazon Textract is available"
    else
        print_warning "Amazon Textract might not be available in $region"
    fi
    
    # Check if Bedrock is available
    if aws bedrock list-foundation-models 2>&1 | grep -q "AccessDeniedException\|UnauthorizedOperation" || aws bedrock list-foundation-models &> /dev/null; then
        print_success "Amazon Bedrock is available"
    else
        print_warning "Amazon Bedrock might not be available in $region"
    fi
}

# Create S3 bucket for FlowFi documents
setup_s3_bucket() {
    local bucket_name="flowfi-documents-$(date +%s)"
    local region=$(aws configure get region)
    
    print_status "Creating S3 bucket: $bucket_name"
    
    if aws s3 mb "s3://$bucket_name" --region "$region"; then
        print_success "S3 bucket created: $bucket_name"
        
        # Enable versioning
        aws s3api put-bucket-versioning --bucket "$bucket_name" --versioning-configuration Status=Enabled
        print_success "S3 bucket versioning enabled"
        
        # Set up CORS for web access
        cat > /tmp/cors-config.json << EOF
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedOrigins": ["http://localhost:5173", "https://*.vercel.app"],
            "ExposeHeaders": ["ETag"]
        }
    ]
}
EOF
        
        aws s3api put-bucket-cors --bucket "$bucket_name" --cors-configuration file:///tmp/cors-config.json
        print_success "S3 CORS configuration applied"
        
        echo "S3_BUCKET_NAME=$bucket_name" >> .env.aws
    else
        print_error "Failed to create S3 bucket"
    fi
}

# Create IAM role for Lambda functions
setup_lambda_role() {
    local role_name="FlowFiLambdaRole"
    
    print_status "Creating IAM role for Lambda: $role_name"
    
    # Create trust policy
    cat > /tmp/lambda-trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF
    
    if aws iam create-role --role-name "$role_name" --assume-role-policy-document file:///tmp/lambda-trust-policy.json 2>/dev/null; then
        print_success "IAM role created: $role_name"
    else
        print_warning "IAM role $role_name might already exist"
    fi
    
    # Attach necessary policies
    aws iam attach-role-policy --role-name "$role_name" --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    aws iam attach-role-policy --role-name "$role_name" --policy-arn "arn:aws:iam::aws:policy/AmazonS3FullAccess"
    aws iam attach-role-policy --role-name "$role_name" --policy-arn "arn:aws:iam::aws:policy/AmazonTextractFullAccess"
    
    print_success "IAM policies attached to $role_name"
}

# Create environment configuration file
setup_environment_config() {
    local region=$(aws configure get region)
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    
    print_status "Creating environment configuration..."
    
    cat > .env.aws << EOF
# AWS Configuration for FlowFi
# Generated on $(date)

# AWS Basic Configuration
AWS_REGION=$region
AWS_ACCOUNT_ID=$account_id
AWS_PROFILE=default

# S3 Configuration
S3_REGION=$region

# Lambda Configuration
LAMBDA_ROLE_ARN=arn:aws:iam::$account_id:role/FlowFiLambdaRole

# SES Configuration (Update with your verified domain/email)
SES_REGION=$region
SES_FROM_EMAIL=noreply@yourdomain.com

# Textract Configuration
TEXTRACT_REGION=$region

# Bedrock Configuration
BEDROCK_REGION=$region
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0

# RDS Configuration (Update after RDS setup)
# RDS_ENDPOINT=your-rds-endpoint
# RDS_DATABASE=flowfi_db
# RDS_USERNAME=flowfi_user
# RDS_PASSWORD=your-secure-password
EOF
    
    print_success "Environment configuration created: .env.aws"
    print_warning "Please update the email and RDS configurations as needed"
}

# Main setup function
main() {
    echo
    print_status "Starting FlowFi AWS infrastructure setup..."
    echo
    
    # Step 1: Check AWS CLI
    check_aws_cli
    echo
    
    # Step 2: Check service availability
    check_service_availability
    echo
    
    # Step 3: Set up S3 bucket
    setup_s3_bucket
    echo
    
    # Step 4: Set up IAM role
    setup_lambda_role
    echo
    
    # Step 5: Create environment config
    setup_environment_config
    echo
    
    print_success "🎉 AWS infrastructure setup completed!"
    echo
    print_status "Next steps:"
    echo "1. Review and update .env.aws file with your specific configurations"
    echo "2. Set up RDS database if needed"
    echo "3. Verify SES email address/domain"
    echo "4. Test the AWS services integration"
    echo
    print_status "To test your setup, run: aws sts get-caller-identity"
    
    # Clean up temporary files
    rm -f /tmp/cors-config.json /tmp/lambda-trust-policy.json
}

# Run main function
main "$@"