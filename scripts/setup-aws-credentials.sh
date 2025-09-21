#!/bin/bash

# AWS Credentials Setup Helper for FlowFi
# This script helps users configure AWS credentials for FlowFi deployment

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

# Function to check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws >/dev/null 2>&1; then
        print_error "AWS CLI is not installed. Please install it first."
        print_status "Install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    print_success "AWS CLI is installed"
}

# Function to display current AWS configuration
show_current_config() {
    print_status "Current AWS Configuration:"
    echo
    
    if aws configure list >/dev/null 2>&1; then
        aws configure list
    else
        print_warning "No AWS configuration found"
    fi
    echo
}

# Function to test AWS credentials
test_credentials() {
    print_status "Testing AWS credentials..."
    
    if aws sts get-caller-identity --region ap-southeast-3 >/dev/null 2>&1; then
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region ap-southeast-3)
        USER_ARN=$(aws sts get-caller-identity --query Arn --output text --region ap-southeast-3)
        print_success "AWS credentials are valid!"
        print_success "Account ID: $ACCOUNT_ID"
        print_success "User/Role: $USER_ARN"
        return 0
    else
        print_error "AWS credentials are invalid or not configured"
        return 1
    fi
}

# Function to configure AWS credentials interactively
configure_credentials() {
    print_status "Configuring AWS credentials..."
    echo
    
    print_warning "You'll need the following information:"
    echo "1. AWS Access Key ID"
    echo "2. AWS Secret Access Key"
    echo "3. Default region (we'll set this to ap-southeast-3 for Malaysia)"
    echo
    
    read -p "Do you want to proceed with AWS configuration? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Configure AWS with Malaysia region as default
        aws configure set region ap-southeast-3
        aws configure
        
        # Test the new configuration
        echo
        if test_credentials; then
            print_success "AWS credentials configured successfully!"
        else
            print_error "Configuration failed. Please check your credentials and try again."
            exit 1
        fi
    else
        print_warning "Configuration cancelled. You can configure manually later."
        exit 0
    fi
}

# Function to show alternative configuration methods
show_alternatives() {
    echo
    print_status "Alternative Configuration Methods:"
    echo
    echo "1. Environment Variables:"
    echo "   export AWS_ACCESS_KEY_ID='your-access-key-id'"
    echo "   export AWS_SECRET_ACCESS_KEY='your-secret-access-key'"
    echo "   export AWS_DEFAULT_REGION='ap-southeast-3'"
    echo
    echo "2. AWS Profile:"
    echo "   aws configure --profile flowfi"
    echo "   export AWS_PROFILE=flowfi"
    echo
    echo "3. IAM Role (for EC2 instances):"
    echo "   Attach an IAM role with necessary permissions to your EC2 instance"
    echo
}

# Function to check required permissions
check_permissions() {
    print_status "Checking AWS permissions..."
    
    # List of services to check
    services=("cloudformation" "s3" "rds" "lambda" "cognito-idp" "apigateway" "iam")
    
    for service in "${services[@]}"; do
        case $service in
            "cloudformation")
                if aws cloudformation list-stacks --region ap-southeast-3 >/dev/null 2>&1; then
                    print_success "CloudFormation access: OK"
                else
                    print_warning "CloudFormation access: Limited or denied"
                fi
                ;;
            "s3")
                if aws s3 ls >/dev/null 2>&1; then
                    print_success "S3 access: OK"
                else
                    print_warning "S3 access: Limited or denied"
                fi
                ;;
            "rds")
                if aws rds describe-db-instances --region ap-southeast-3 >/dev/null 2>&1; then
                    print_success "RDS access: OK"
                else
                    print_warning "RDS access: Limited or denied"
                fi
                ;;
            "lambda")
                if aws lambda list-functions --region ap-southeast-3 >/dev/null 2>&1; then
                    print_success "Lambda access: OK"
                else
                    print_warning "Lambda access: Limited or denied"
                fi
                ;;
            "cognito-idp")
                if aws cognito-idp list-user-pools --max-results 1 --region ap-southeast-3 >/dev/null 2>&1; then
                    print_success "Cognito access: OK"
                else
                    print_warning "Cognito access: Limited or denied"
                fi
                ;;
            "apigateway")
                if aws apigateway get-rest-apis --region ap-southeast-3 >/dev/null 2>&1; then
                    print_success "API Gateway access: OK"
                else
                    print_warning "API Gateway access: Limited or denied"
                fi
                ;;
            "iam")
                if aws iam list-roles >/dev/null 2>&1; then
                    print_success "IAM access: OK"
                else
                    print_warning "IAM access: Limited or denied"
                fi
                ;;
        esac
    done
}

# Main function
main() {
    echo "======================================"
    echo "   FlowFi AWS Credentials Setup"
    echo "======================================"
    echo
    
    # Check AWS CLI installation
    check_aws_cli
    
    # Show current configuration
    show_current_config
    
    # Test current credentials
    if test_credentials; then
        print_success "Your AWS credentials are already configured and working!"
        
        # Check permissions
        check_permissions
        
        echo
        print_status "You can now proceed with deployment:"
        echo "npm run aws:deploy"
    else
        print_warning "AWS credentials need to be configured."
        
        # Show configuration options
        show_alternatives
        
        # Offer interactive configuration
        configure_credentials
        
        # Check permissions after configuration
        check_permissions
        
        echo
        print_status "Next steps:"
        echo "1. Run 'npm run aws:check' to verify setup"
        echo "2. Run 'npm run aws:deploy' to deploy infrastructure"
    fi
    
    echo
    print_status "For detailed setup instructions, see: AWS_SETUP_GUIDE.md"
}

# Handle script arguments
case "${1:-}" in
    "--help" | "-h")
        echo "FlowFi AWS Credentials Setup Helper"
        echo
        echo "Usage: $0 [options]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --test         Only test current credentials"
        echo "  --check        Check permissions for AWS services"
        echo "  --configure    Force interactive configuration"
        echo
        exit 0
        ;;
    "--test")
        check_aws_cli
        test_credentials
        exit $?
        ;;
    "--check")
        check_aws_cli
        if test_credentials; then
            check_permissions
        fi
        exit 0
        ;;
    "--configure")
        check_aws_cli
        configure_credentials
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        print_error "Use --help for usage information"
        exit 1
        ;;
esac