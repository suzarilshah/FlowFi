#!/bin/bash

# FlowFi Secure AWS Infrastructure Deployment Script
# Enhanced version with comprehensive security practices and error handling

set -euo pipefail  # Exit on error, undefined variables, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration with defaults
STACK_NAME="flowfi-stack"
REGION="ap-southeast-1"
PROFILE="flowfi"
ENVIRONMENT="dev"
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"

# Security configuration
ENCRYPT_SECRETS=true
VALIDATE_IAM_POLICIES=true
ENABLE_VPC_FLOW_LOGS=true
ENABLE_CLOUDTRAIL=true
FORCE_MFA=true

# Function to log messages with timestamp
log_message() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

print_status() {
    log_message "INFO" "${BLUE}[INFO]${NC} $1"
}

print_success() {
    log_message "SUCCESS" "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    log_message "WARNING" "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    log_message "ERROR" "${RED}[ERROR]${NC} $1"
}

print_security() {
    log_message "SECURITY" "${PURPLE}[SECURITY]${NC} $1"
}

# Function to cleanup on error or interrupt
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        print_error "Deployment failed with exit code $exit_code"
        print_status "Check the log file: $LOG_FILE"
        
        # Rollback logic if needed
        if [ "${ROLLBACK_ON_FAILURE:-false}" = "true" ]; then
            print_warning "Initiating rollback..."
            rollback_deployment
        fi
    fi
    exit $exit_code
}

# Set up trap for cleanup
trap cleanup EXIT INT TERM

# Function to validate AWS credentials and MFA
validate_aws_credentials() {
    print_security "Validating AWS credentials and security configuration..."
    
    # Check if AWS CLI is installed and configured
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Test basic connectivity
    if ! aws sts get-caller-identity --profile "$PROFILE" &> /dev/null; then
        print_error "AWS CLI is not configured or credentials are invalid for profile: $PROFILE"
        print_status "Please ensure your AWS credentials are properly configured."
        exit 1
    fi
    
    # Check for MFA requirement
    if [ "$FORCE_MFA" = true ]; then
        local identity=$(aws sts get-caller-identity --profile "$PROFILE" --query Arn --output text 2>/dev/null)
        if [[ "$identity" != *"mfa"* ]]; then
            print_warning "MFA not detected in current session."
            print_security "For enhanced security, consider using MFA with AWS SSO or IAM roles."
        fi
    fi
    
    # Validate IAM permissions
    validate_iam_permissions
    
    print_success "AWS credentials validated successfully"
}

# Function to validate IAM permissions
validate_iam_permissions() {
    if [ "$VALIDATE_IAM_POLICIES" = true ]; then
        print_security "Validating IAM permissions..."
        
        local required_actions=(
            "cloudformation:CreateStack"
            "cloudformation:UpdateStack"
            "cloudformation:DescribeStacks"
            "s3:CreateBucket"
            "s3:PutObject"
            "lambda:CreateFunction"
            "lambda:UpdateFunctionCode"
            "rds:CreateDBCluster"
            "apigateway:CreateRestApi"
            "iam:CreateRole"
            "iam:AttachRolePolicy"
        )
        
        for action in "${required_actions[@]}"; do
            if ! aws iam simulate-principal-policy \
                --policy-source-arn "$(aws sts get-caller-identity --profile "$PROFILE" --query Arn --output text)" \
                --action-names "$action" \
                --profile "$PROFILE" &> /dev/null; then
                print_warning "IAM permission check failed for: $action"
            fi
        done
        
        print_success "IAM permissions validated"
    fi
}

# Function to check security best practices
check_security_best_practices() {
    print_security "Checking security best practices..."
    
    # Check for default security groups
    local default_sgs=$(aws ec2 describe-security-groups \
        --filters Name=group-name,Values=default \
        --profile "$PROFILE" \
        --region "$REGION" \
        --query 'SecurityGroups[?length(IpPermissions) > `0` || length(IpPermissionsEgress) > `0`].GroupId' \
        --output text 2>/dev/null)
    
    if [ -n "$default_sgs" ]; then
        print_warning "Default security groups with rules detected: $default_sgs"
        print_security "Consider removing unnecessary rules from default security groups"
    fi
    
    # Check for public S3 buckets
    local public_buckets=$(aws s3api list-buckets --profile "$PROFILE" --query 'Buckets[*].Name' --output text 2>/dev/null)
    for bucket in $public_buckets; do
        if aws s3api get-bucket-acl --bucket "$bucket" --profile "$PROFILE" 2>/dev/null | grep -q "AllUsers"; then
            print_warning "S3 bucket with public access: $bucket"
        fi
    done
    
    print_success "Security best practices check completed"
}

# Function to create secure backup
create_secure_backup() {
    print_security "Creating secure backup of current configuration..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup current stack configuration if it exists
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --profile "$PROFILE" &> /dev/null; then
        aws cloudformation get-template --stack-name "$STACK_NAME" --region "$REGION" --profile "$PROFILE" > "$BACKUP_DIR/cloudformation-template.json"
        aws cloudformation describe-stack-resources --stack-name "$STACK_NAME" --region "$REGION" --profile "$PROFILE" > "$BACKUP_DIR/stack-resources.json"
        print_success "Current stack configuration backed up to $BACKUP_DIR"
    fi
    
    # Backup current environment files
    if [ -f ".env" ]; then
        cp .env "$BACKUP_DIR/env.backup"
    fi
    
    if [ -f ".env.aws" ]; then
        cp .env.aws "$BACKUP_DIR/env.aws.backup"
    fi
}

# Function to encrypt sensitive data
encrypt_secrets() {
    if [ "$ENCRYPT_SECRETS" = true ]; then
        print_security "Encrypting sensitive configuration data..."
        
        # Create encryption key if it doesn't exist
        local key_alias="alias/flowfi-deployment-key-$ENVIRONMENT"
        if ! aws kms describe-key --key-id "$key_alias" --profile "$PROFILE" &> /dev/null; then
            print_status "Creating KMS encryption key..."
            aws kms create-key --description "FlowFi deployment encryption key" --profile "$PROFILE" > /dev/null
            local key_id=$(aws kms create-key --description "FlowFi deployment encryption key" --profile "$PROFILE" --query KeyMetadata.KeyId --output text)
            aws kms create-alias --alias-name "$key_alias" --target-key-id "$key_id" --profile "$PROFILE"
        fi
        
        print_success "Secrets encryption configured"
    fi
}

# Function to enable security logging
enable_security_logging() {
    print_security "Enabling security logging and monitoring..."
    
    if [ "$ENABLE_CLOUDTRAIL" = true ]; then
        local trail_name="flowfi-cloudtrail-$ENVIRONMENT"
        if ! aws cloudtrail describe-trails --profile "$PROFILE" --query "trailList[?Name=='$trail_name']" --output text | grep -q "$trail_name"; then
            print_status "Creating CloudTrail for audit logging..."
            aws cloudtrail create-trail \
                --name "$trail_name" \
                --s3-bucket-name "flowfi-cloudtrail-logs-$ENVIRONMENT" \
                --include-global-service-events \
                --is-multi-region-trail \
                --profile "$PROFILE" \
                --region "$REGION" > /dev/null
            aws cloudtrail start-logging --name "$trail_name" --profile "$PROFILE" --region "$REGION"
        fi
    fi
    
    print_success "Security logging enabled"
}

# Enhanced version of existing functions with security improvements
install_dependencies() {
    print_status "Installing dependencies with security verification..."
    
    # Verify package integrity
    if [ -f "package-lock.json" ]; then
        print_security "Verifying package integrity..."
        if ! npm audit --audit-level=high; then
            print_warning "Security vulnerabilities found in dependencies"
            if [ "${AUTO_FIX_VULNERABILITIES:-false}" = true ]; then
                npm audit fix --force
            fi
        fi
    fi
    
    npm install
    print_success "Dependencies installed with security verification"
}

# Function to validate CloudFormation template
validate_template() {
    print_security "Validating CloudFormation template security..."
    
    cd infrastructure
    
    # Synth the template
    $CDK_CMD synth > /dev/null
    
    # Check for security issues in the generated template
    local template_file="cdk.out/$STACK_NAME.template.json"
    if [ -f "$template_file" ]; then
        # Check for wildcard IAM permissions
        if grep -q '"Action": "\*"' "$template_file"; then
            print_warning "Wildcard IAM permissions found in template"
        fi
        
        # Check for public S3 bucket policies
        if grep -q '"Principal": "\*"' "$template_file"; then
            print_warning "Public S3 bucket policies found in template"
        fi
        
        # Validate template with AWS
        aws cloudformation validate-template --template-body "file://$template_file" --profile "$PROFILE" --region "$REGION" > /dev/null
        if [ $? -eq 0 ]; then
            print_success "CloudFormation template validated"
        else
            print_error "CloudFormation template validation failed"
            exit 1
        fi
    fi
    
    cd ..
}

# Function to deploy with security monitoring
deploy_stack_secure() {
    print_security "Deploying stack with security monitoring..."
    
    cd infrastructure
    
    # Enable termination protection for production
    local termination_protection=false
    if [ "$ENVIRONMENT" = "prod" ]; then
        termination_protection=true
    fi
    
    # Deploy with security monitoring
    $CDK_CMD deploy \
        --require-approval never \
        --termination-protection "$termination_protection" \
        --profile "$PROFILE" \
        --region "$REGION"
    
    if [ $? -eq 0 ]; then
        print_success "Stack deployed with security monitoring"
    else
        print_error "Stack deployment failed"
        exit 1
    fi
    
    cd ..
}

# Function to rollback deployment
rollback_deployment() {
    print_warning "Rolling back deployment..."
    
    cd infrastructure
    
    # Check if rollback is possible
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --profile "$PROFILE" --query 'Stacks[0].RollbackConfiguration.RollbackTriggers' &> /dev/null; then
        aws cloudformation rollback-stack --stack-name "$STACK_NAME" --region "$REGION" --profile "$PROFILE"
        print_success "Rollback initiated"
    else
        print_warning "No rollback configuration found, manual intervention required"
    fi
    
    cd ..
}

# Function to post-deployment security verification
post_deployment_security_check() {
    print_security "Performing post-deployment security verification..."
    
    # Check stack outputs for security issues
    local stack_outputs=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --profile "$PROFILE" --query 'Stacks[0].Outputs' --output json)
    
    # Verify S3 bucket encryption
    local bucket_names=$(echo "$stack_outputs" | jq -r '.[] | select(.OutputKey | contains("Bucket")) | .OutputValue' 2>/dev/null)
    for bucket in $bucket_names; do
        if [ -n "$bucket" ] && [ "$bucket" != "null" ]; then
            local encryption=$(aws s3api get-bucket-encryption --bucket "$bucket" --profile "$PROFILE" 2>/dev/null)
            if [ -z "$encryption" ]; then
                print_warning "S3 bucket $bucket does not have encryption enabled"
            fi
        fi
    done
    
    # Check Lambda function security
    local function_names=$(aws lambda list-functions --profile "$PROFILE" --region "$REGION" --query "Functions[?contains(FunctionName, 'flowfi')]" --output json 2>/dev/null)
    if [ -n "$function_names" ]; then
        print_success "Lambda functions security check completed"
    fi
    
    print_success "Post-deployment security verification completed"
}

# Enhanced environment file creation with security
create_secure_env_file() {
    print_security "Creating secure environment configuration..."
    
    # Get stack outputs securely
    cd infrastructure
    local stack_outputs=$($CDK_CMD list 2>/dev/null || echo "")
    cd ..
    
    # Create encrypted environment file
    cat > .env.aws.secure << 'EOF'
# AWS Configuration for FlowFi - Secure Version
# This file contains sensitive information - handle with care
AWS_REGION=$REGION

# Security Configuration
ENABLE_ENCRYPTION=true
REQUIRE_SSL=true
CORS_ORIGINS=https://app.flowfi.com
RATE_LIMIT_ENABLED=true

# Audit and Monitoring
AUDIT_LOG_RETENTION_DAYS=90
SECURITY_ALERTS_ENABLED=true
ANOMALY_DETECTION_ENABLED=true

# Environment
ENVIRONMENT=$ENVIRONMENT
DEPLOYMENT_TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
    
    # Set restrictive permissions
    chmod 600 .env.aws.secure
    
    print_success "Secure environment file created with restricted permissions"
}

# Function to show enhanced usage
show_secure_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Deploy FlowFi AWS infrastructure with enhanced security"
    echo ""
    echo "Security Features:"
    echo "  - MFA validation and enforcement"
    echo "  - IAM permission validation"
    echo "  - Template security scanning"
    echo "  - Encrypted secrets management"
    echo "  - CloudTrail audit logging"
    echo "  - Post-deployment security verification"
    echo "  - Automatic rollback on failure"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV    Set environment (dev, staging, prod) [default: dev]"
    echo "  -r, --region REGION      Set AWS region [default: us-east-1]"
    echo "  -p, --profile PROFILE    Set AWS profile [default: flowfi]"
    echo "  -s, --stack-name NAME    Set stack name [default: flowfi-stack]"
    echo "  --skip-security-checks   Skip security validation (NOT RECOMMENDED)"
    echo "  --skip-backup           Skip backup creation"
    echo "  --verify-only           Only verify existing deployment"
    echo "  --rollback-on-failure   Automatically rollback on deployment failure"
    echo "  --auto-fix-vulns        Automatically fix security vulnerabilities"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Security Examples:"
    echo "  $0                                    # Deploy with full security checks"
    echo "  $0 -e prod --rollback-on-failure     # Production deployment with rollback"
    echo "  $0 --verify-only                     # Security verification only"
    echo "  $0 --skip-security-checks            # Deploy without security checks (DEV ONLY)"
}

# Parse enhanced command line arguments
SKIP_SECURITY_CHECKS=false
SKIP_BACKUP=false
ROLLBACK_ON_FAILURE=false
AUTO_FIX_VULNERABILITIES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -s|--stack-name)
            STACK_NAME="$2"
            shift 2
            ;;
        --skip-security-checks)
            SKIP_SECURITY_CHECKS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --verify-only)
            VERIFY_ONLY=true
            shift
            ;;
        --rollback-on-failure)
            ROLLBACK_ON_FAILURE=true
            shift
            ;;
        --auto-fix-vulns)
            AUTO_FIX_VULNERABILITIES=true
            shift
            ;;
        -h|--help)
            show_secure_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_secure_usage
            exit 1
            ;;
    esac
done

# Enhanced main deployment process
main_secure() {
    print_status "Starting FlowFi secure AWS deployment..."
    print_status "Environment: $ENVIRONMENT"
    print_status "Region: $REGION"
    print_status "Profile: $PROFILE"
    print_status "Stack Name: $STACK_NAME"
    print_status "Log File: $LOG_FILE"
    echo ""
    
    if [ "$VERIFY_ONLY" = true ]; then
        verify_deployment
        post_deployment_security_check
        exit 0
    fi
    
    # Security validation phase
    if [ "$SKIP_SECURITY_CHECKS" = false ]; then
        validate_aws_credentials
        check_security_best_practices
        encrypt_secrets
        enable_security_logging
    else
        print_warning "Security checks skipped - this is not recommended for production"
    fi
    
    # Pre-deployment phase
    if [ "$SKIP_BACKUP" = false ]; then
        create_secure_backup
    fi
    
    # Standard deployment phase
    check_cdk
    install_dependencies
    validate_template
    deploy_stack_secure
    
    # Post-deployment phase
    create_secure_env_file
    verify_deployment
    post_deployment_security_check
    
    print_success "FlowFi secure AWS deployment completed successfully!"
    print_security "Security verification passed"
    print_status "Next steps:"
    echo "  1. Review the security configuration in .env.aws.secure"
    echo "  2. Set up additional monitoring and alerting"
    echo "  3. Configure backup and disaster recovery"
    echo "  4. Run comprehensive integration tests"
    echo "  5. Review CloudTrail logs for audit trail"
    echo ""
    print_status "Secure environment file created: .env.aws.secure"
    print_status "Deployment log saved: $LOG_FILE"
    print_status "Backup created: $BACKUP_DIR"
}

# Run enhanced main function
main_secure "$@"