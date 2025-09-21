#!/bin/bash

# FlowFi Deployment Validation Script
# Comprehensive validation of AWS deployment and security configuration

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="${1:-flowfi-stack}"
REGION="${2:-ap-southeast-1}"
PROFILE="${3:-flowfi}"
ENVIRONMENT="${4:-dev}"

# Validation counters
TESTS_PASSED=0
TESTS_FAILED=0
WARNINGS=0

# Function to log validation results
log_validation() {
    local test_name=$1
    local result=$2
    local message=$3
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name: $message"
        ((TESTS_PASSED++))
    elif [ "$result" = "FAIL" ]; then
        echo -e "${RED}✗${NC} $test_name: $message"
        ((TESTS_FAILED++))
    else
        echo -e "${YELLOW}⚠${NC} $test_name: $message"
        ((WARNINGS++))
    fi
}

# Function to check if stack exists
check_stack_exists() {
    print_status "Checking if CloudFormation stack exists..."
    
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --profile "$PROFILE" &> /dev/null; then
        log_validation "Stack Existence" "PASS" "Stack $STACK_NAME exists"
        return 0
    else
        log_validation "Stack Existence" "FAIL" "Stack $STACK_NAME does not exist"
        return 1
    fi
}

# Function to validate stack status
validate_stack_status() {
    print_status "Validating CloudFormation stack status..."
    
    local stack_status=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --profile "$PROFILE" --query 'Stacks[0].StackStatus' --output text)
    
    case "$stack_status" in
        "CREATE_COMPLETE"|"UPDATE_COMPLETE")
            log_validation "Stack Status" "PASS" "Stack is in $stack_status state"
            ;;
        "CREATE_IN_PROGRESS"|"UPDATE_IN_PROGRESS"|"UPDATE_COMPLETE_CLEANUP_IN_PROGRESS")
            log_validation "Stack Status" "WARN" "Stack is in $stack_status state"
            ;;
        "CREATE_FAILED"|"UPDATE_FAILED"|"ROLLBACK_COMPLETE"|"ROLLBACK_FAILED")
            log_validation "Stack Status" "FAIL" "Stack is in $stack_status state"
            ;;
        *)
            log_validation "Stack Status" "FAIL" "Unknown stack status: $stack_status"
            ;;
    esac
}

# Function to validate stack outputs
validate_stack_outputs() {
    print_status "Validating CloudFormation stack outputs..."
    
    local required_outputs=(
        "DocumentsBucketName"
        "BackupsBucketName"
        "DatabaseEndpoint"
        "ApiGatewayUrl"
        "LambdaFunctionArns"
    )
    
    local stack_outputs=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --profile "$PROFILE" --query 'Stacks[0].Outputs' --output json)
    
    for output in "${required_outputs[@]}"; do
        if echo "$stack_outputs" | jq -e ".[] | select(.OutputKey == \"$output\")" > /dev/null 2>&1; then
            log_validation "Stack Output: $output" "PASS" "Output exists"
        else
            log_validation "Stack Output: $output" "FAIL" "Output missing"
        fi
    done
}

# Function to validate S3 buckets
validate_s3_buckets() {
    print_status "Validating S3 buckets configuration..."
    
    local bucket_names=$(aws cloudformation describe-stack-resources --stack-name "$STACK_NAME" --region "$REGION" --profile "$PROFILE" --query 'StackResources[?ResourceType==`AWS::S3::Bucket`].PhysicalResourceId' --output text)
    
    for bucket in $bucket_names; do
        if [ -n "$bucket" ]; then
            # Check bucket existence
            if aws s3api head-bucket --bucket "$bucket" --profile "$PROFILE" 2>/dev/null; then
                log_validation "S3 Bucket: $bucket" "PASS" "Bucket exists"
                
                # Check encryption
                if aws s3api get-bucket-encryption --bucket "$bucket" --profile "$PROFILE" 2>/dev/null; then
                    log_validation "S3 Encryption: $bucket" "PASS" "Encryption enabled"
                else
                    log_validation "S3 Encryption: $bucket" "FAIL" "Encryption not enabled"
                fi
                
                # Check public access block
                local public_access=$(aws s3api get-public-access-block --bucket "$bucket" --profile "$PROFILE" 2>/dev/null || echo "{}")
                if echo "$public_access" | jq -e '.PublicAccessBlockConfiguration | .BlockPublicAcls == true and .BlockPublicPolicy == true and .IgnorePublicAcls == true and .RestrictPublicBuckets == true' > /dev/null 2>&1; then
                    log_validation "S3 Public Access: $bucket" "PASS" "Public access blocked"
                else
                    log_validation "S3 Public Access: $bucket" "WARN" "Public access not fully blocked"
                fi
                
                # Check versioning
                local versioning=$(aws s3api get-bucket-versioning --bucket "$bucket" --profile "$PROFILE" --query Status --output text 2>/dev/null || echo "Suspended")
                if [ "$versioning" = "Enabled" ]; then
                    log_validation "S3 Versioning: $bucket" "PASS" "Versioning enabled"
                else
                    log_validation "S3 Versioning: $bucket" "WARN" "Versioning not enabled"
                fi
            else
                log_validation "S3 Bucket: $bucket" "FAIL" "Bucket does not exist"
            fi
        fi
    done
}

# Function to validate Lambda functions
validate_lambda_functions() {
    print_status "Validating Lambda functions..."
    
    local function_names=$(aws cloudformation describe-stack-resources --stack-name "$STACK_NAME" --region "$REGION" --profile "$PROFILE" --query 'StackResources[?ResourceType==`AWS::Lambda::Function`].PhysicalResourceId' --output text)
    
    for function_name in $function_names; do
        if [ -n "$function_name" ]; then
            # Check function existence
            if aws lambda get-function --function-name "$function_name" --profile "$PROFILE" --region "$REGION" &> /dev/null; then
                log_validation "Lambda Function: $function_name" "PASS" "Function exists"
                
                # Check function configuration
                local function_config=$(aws lambda get-function-configuration --function-name "$function_name" --profile "$PROFILE" --region "$REGION")
                
                # Check runtime
                local runtime=$(echo "$function_config" | jq -r '.Runtime')
                if [[ "$runtime" == nodejs* ]]; then
                    log_validation "Lambda Runtime: $function_name" "PASS" "Runtime is $runtime"
                else
                    log_validation "Lambda Runtime: $function_name" "WARN" "Runtime is $runtime"
                fi
                
                # Check memory size
                local memory_size=$(echo "$function_config" | jq -r '.MemorySize')
                if [ "$memory_size" -ge 512 ]; then
                    log_validation "Lambda Memory: $function_name" "PASS" "Memory size is ${memory_size}MB"
                else
                    log_validation "Lambda Memory: $function_name" "WARN" "Memory size is ${memory_size}MB (consider increasing)"
                fi
                
                # Check timeout
                local timeout=$(echo "$function_config" | jq -r '.Timeout')
                if [ "$timeout" -le 300 ]; then
                    log_validation "Lambda Timeout: $function_name" "PASS" "Timeout is ${timeout}s"
                else
                    log_validation "Lambda Timeout: $function_name" "WARN" "Timeout is ${timeout}s (consider reducing)"
                fi
                
                # Check environment variables encryption
                local env_encryption=$(echo "$function_config" | jq -r '.KMSKeyArn // "null"')
                if [ "$env_encryption" != "null" ]; then
                    log_validation "Lambda Env Encryption: $function_name" "PASS" "Environment variables encrypted"
                else
                    log_validation "Lambda Env Encryption: $function_name" "WARN" "Environment variables not encrypted"
                fi
            else
                log_validation "Lambda Function: $function_name" "FAIL" "Function does not exist"
            fi
        fi
    done
}

# Function to validate RDS database
validate_rds_database() {
    print_status "Validating RDS database configuration..."
    
    local db_instances=$(aws cloudformation describe-stack-resources --stack-name "$STACK_NAME" --region "$REGION" --profile "$PROFILE" --query 'StackResources[?ResourceType==`AWS::RDS::DBInstance`].PhysicalResourceId' --output text)
    
    for db_instance in $db_instances; do
        if [ -n "$db_instance" ]; then
            # Check database existence
            if aws rds describe-db-instances --db-instance-identifier "$db_instance" --profile "$PROFILE" --region "$REGION" &> /dev/null; then
                log_validation "RDS Instance: $db_instance" "PASS" "Database exists"
                
                # Check database configuration
                local db_config=$(aws rds describe-db-instances --db-instance-identifier "$db_instance" --profile "$PROFILE" --region "$REGION" --query 'DBInstances[0]')
                
                # Check encryption
                local encryption=$(echo "$db_config" | jq -r '.StorageEncrypted')
                if [ "$encryption" = "true" ]; then
                    log_validation "RDS Encryption: $db_instance" "PASS" "Storage encryption enabled"
                else
                    log_validation "RDS Encryption: $db_instance" "FAIL" "Storage encryption not enabled"
                fi
                
                # Check backup retention
                local backup_retention=$(echo "$db_config" | jq -r '.BackupRetentionPeriod')
                if [ "$backup_retention" -ge 7 ]; then
                    log_validation "RDS Backup: $db_instance" "PASS" "Backup retention is $backup_retention days"
                else
                    log_validation "RDS Backup: $db_instance" "WARN" "Backup retention is $backup_retention days"
                fi
                
                # Check deletion protection
                local deletion_protection=$(echo "$db_config" | jq -r '.DeletionProtection')
                if [ "$deletion_protection" = "true" ]; then
                    log_validation "RDS Deletion Protection: $db_instance" "PASS" "Deletion protection enabled"
                else
                    log_validation "RDS Deletion Protection: $db_instance" "WARN" "Deletion protection not enabled"
                fi
            else
                log_validation "RDS Instance: $db_instance" "FAIL" "Database does not exist"
            fi
        fi
    done
}

# Function to validate API Gateway
validate_api_gateway() {
    print_status "Validating API Gateway configuration..."
    
    local api_ids=$(aws cloudformation describe-stack-resources --stack-name "$STACK_NAME" --region "$REGION" --profile "$PROFILE" --query 'StackResources[?ResourceType==`AWS::ApiGateway::RestApi`].PhysicalResourceId' --output text)
    
    for api_id in $api_ids; do
        if [ -n "$api_id" ]; then
            # Check API existence
            if aws apigateway get-rest-api --rest-api-id "$api_id" --profile "$PROFILE" --region "$REGION" &> /dev/null; then
                log_validation "API Gateway: $api_id" "PASS" "API exists"
                
                # Check API configuration
                local api_config=$(aws apigateway get-rest-api --rest-api-id "$api_id" --profile "$PROFILE" --region "$REGION")
                
                # Check endpoint configuration
                local endpoint_type=$(echo "$api_config" | jq -r '.endpointConfiguration.types[0]')
                if [ "$endpoint_type" = "REGIONAL" ]; then
                    log_validation "API Endpoint: $api_id" "PASS" "Regional endpoint configured"
                else
                    log_validation "API Endpoint: $api_id" "WARN" "Endpoint type is $endpoint_type"
                fi
                
                # Check stages
                local stages=$(aws apigateway get-stages --rest-api-id "$api_id" --profile "$PROFILE" --region "$REGION" --query 'item[].stageName' --output text)
                if [[ "$stages" == *"prod"* ]] || [[ "$stages" == *"production"* ]]; then
                    log_validation "API Stages: $api_id" "PASS" "Production stage configured"
                else
                    log_validation "API Stages: $api_id" "WARN" "Production stage not found"
                fi
            else
                log_validation "API Gateway: $api_id" "FAIL" "API does not exist"
            fi
        fi
    done
}

# Function to validate IAM roles and policies
validate_iam_security() {
    print_status "Validating IAM security configuration..."
    
    local role_names=$(aws cloudformation describe-stack-resources --stack-name "$STACK_NAME" --region "$REGION" --profile "$PROFILE" --query 'StackResources[?ResourceType==`AWS::IAM::Role`].PhysicalResourceId' --output text)
    
    for role_name in $role_names; do
        if [ -n "$role_name" ]; then
            # Check role existence
            if aws iam get-role --role-name "$role_name" --profile "$PROFILE" &> /dev/null; then
                log_validation "IAM Role: $role_name" "PASS" "Role exists"
                
                # Check role policies
                local attached_policies=$(aws iam list-attached-role-policies --role-name "$role_name" --profile "$PROFILE" --query 'AttachedPolicies[].PolicyName' --output text)
                local inline_policies=$(aws iam list-role-policies --role-name "$role_name" --profile "$PROFILE" --query 'PolicyNames' --output text)
                
                # Check for wildcard permissions
                local all_policies=$(aws iam get-role-policy --role-name "$role_name" --policy-name "${inline_policies%% *}" --profile "$PROFILE" 2>/dev/null || echo "{}")
                if echo "$all_policies" | jq -e '.PolicyDocument.Statement[]?.Action == "*"' > /dev/null 2>&1; then
                    log_validation "IAM Wildcard: $role_name" "WARN" "Wildcard permissions found"
                else
                    log_validation "IAM Wildcard: $role_name" "PASS" "No wildcard permissions"
                fi
            else
                log_validation "IAM Role: $role_name" "FAIL" "Role does not exist"
            fi
        fi
    done
}

# Function to validate CloudWatch logging
validate_cloudwatch_logging() {
    print_status "Validating CloudWatch logging configuration..."
    
    # Check log groups
    local log_groups=$(aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/flowfi" --profile "$PROFILE" --region "$REGION" --query 'logGroups[].logGroupName' --output text)
    
    for log_group in $log_groups; do
        if [ -n "$log_group" ]; then
            log_validation "Log Group: $log_group" "PASS" "Log group exists"
            
            # Check retention policy
            local retention_days=$(aws logs describe-log-groups --log-group-name-prefix "$log_group" --profile "$PROFILE" --region "$REGION" --query 'logGroups[0].retentionInDays' --output text 2>/dev/null || echo "null")
            if [ "$retention_days" != "null" ] && [ "$retention_days" -gt 0 ]; then
                log_validation "Log Retention: $log_group" "PASS" "Retention is $retention_days days"
            else
                log_validation "Log Retention: $log_group" "WARN" "No retention policy set"
            fi
            
            # Check encryption
            local kms_key_id=$(aws logs describe-log-groups --log-group-name-prefix "$log_group" --profile "$PROFILE" --region "$REGION" --query 'logGroups[0].kmsKeyId' --output text 2>/dev/null || echo "null")
            if [ "$kms_key_id" != "null" ]; then
                log_validation "Log Encryption: $log_group" "PASS" "Encryption enabled"
            else
                log_validation "Log Encryption: $log_group" "WARN" "Encryption not enabled"
            fi
        fi
    done
}

# Function to validate security groups
validate_security_groups() {
    print_status "Validating security groups configuration..."
    
    local security_groups=$(aws cloudformation describe-stack-resources --stack-name "$STACK_NAME" --region "$REGION" --profile "$PROFILE" --query 'StackResources[?ResourceType==`AWS::EC2::SecurityGroup`].PhysicalResourceId' --output text)
    
    for sg_id in $security_groups; do
        if [ -n "$sg_id" ]; then
            # Check security group existence
            if aws ec2 describe-security-groups --group-ids "$sg_id" --profile "$PROFILE" --region "$REGION" &> /dev/null; then
                log_validation "Security Group: $sg_id" "PASS" "Security group exists"
                
                # Check security group rules
                local sg_rules=$(aws ec2 describe-security-groups --group-ids "$sg_id" --profile "$PROFILE" --region "$REGION" --query 'SecurityGroups[0]')
                
                # Check for overly permissive rules
                local open_ingress=$(echo "$sg_rules" | jq -r '.IpPermissions[]? | select(.IpRanges[].CidrIp == "0.0.0.0/0") | .IpProtocol')
                if [ -n "$open_ingress" ]; then
                    log_validation "Security Group Rules: $sg_id" "WARN" "Open ingress rules found"
                else
                    log_validation "Security Group Rules: $sg_id" "PASS" "No overly permissive rules"
                fi
            else
                log_validation "Security Group: $sg_id" "FAIL" "Security group does not exist"
            fi
        fi
    done
}

# Function to validate overall security posture
validate_security_posture() {
    print_status "Validating overall security posture..."
    
    # Check for CloudTrail
    local cloudtrail_name="flowfi-cloudtrail-$ENVIRONMENT"
    if aws cloudtrail describe-trails --profile "$PROFILE" --query "trailList[?Name=='$cloudtrail_name']" --output text | grep -q "$cloudtrail_name"; then
        log_validation "CloudTrail Logging" "PASS" "CloudTrail is enabled"
    else
        log_validation "CloudTrail Logging" "WARN" "CloudTrail is not enabled"
    fi
    
    # Check for Config
    local config_recorders=$(aws config describe-configuration-recorders --profile "$PROFILE" --region "$REGION" --query 'ConfigurationRecorders[].name' --output text 2>/dev/null || echo "")
    if [ -n "$config_recorders" ]; then
        log_validation "AWS Config" "PASS" "AWS Config is enabled"
    else
        log_validation "AWS Config" "WARN" "AWS Config is not enabled"
    fi
    
    # Check for GuardDuty
    local guardduty_detectors=$(aws guardduty list-detectors --profile "$PROFILE" --region "$REGION" --query 'DetectorIds' --output text 2>/dev/null || echo "")
    if [ -n "$guardduty_detectors" ]; then
        log_validation "GuardDuty" "PASS" "GuardDuty is enabled"
    else
        log_validation "GuardDuty" "WARN" "GuardDuty is not enabled"
    fi
}

# Function to validate cost optimization
validate_cost_optimization() {
    print_status "Validating cost optimization settings..."
    
    # Check for unused resources
    local unused_volumes=$(aws ec2 describe-volumes --profile "$PROFILE" --region "$REGION" --filters Name=state,Values=available --query 'Volumes[].VolumeId' --output text 2>/dev/null || echo "")
    if [ -n "$unused_volumes" ]; then
        log_validation "Unused EBS Volumes" "WARN" "Found unused volumes: $unused_volumes"
    else
        log_validation "Unused EBS Volumes" "PASS" "No unused volumes found"
    fi
    
    # Check for old snapshots
    local old_snapshots=$(aws ec2 describe-snapshots --profile "$PROFILE" --owner-ids self --query 'Snapshots[?StartTime < `'$(date -d '30 days ago' -u +%Y-%m-%dT%H:%M:%S.%NZ)'`].SnapshotId' --output text 2>/dev/null || echo "")
    if [ -n "$old_snapshots" ]; then
        log_validation "Old Snapshots" "WARN" "Found old snapshots: $old_snapshots"
    else
        log_validation "Old Snapshots" "PASS" "No old snapshots found"
    fi
}

# Function to print validation summary
print_validation_summary() {
    echo ""
    echo "========================================="
    echo "     DEPLOYMENT VALIDATION SUMMARY"
    echo "========================================="
    echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
    echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
    echo ""
    
    if [ "$TESTS_FAILED" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
        echo -e "${GREEN}✓ All validation checks passed!${NC}"
        echo "Your FlowFi deployment is properly configured and secure."
        return 0
    elif [ "$TESTS_FAILED" -eq 0 ]; then
        echo -e "${YELLOW}⚠ Validation completed with warnings.${NC}"
        echo "Your FlowFi deployment is functional but has some recommendations."
        return 0
    else
        echo -e "${RED}✗ Validation failed with critical issues.${NC}"
        echo "Please address the failed tests before proceeding."
        return 1
    fi
}

# Helper functions for consistent output
print_status() {
    echo -e "${BLUE}[VALIDATION]${NC} $1"
}

# Main validation function
main() {
    echo "========================================="
    echo "  FLOWFI DEPLOYMENT VALIDATION"
    echo "========================================="
    echo "Stack Name: $STACK_NAME"
    echo "Region: $REGION"
    echo "Profile: $PROFILE"
    echo "Environment: $ENVIRONMENT"
    echo "========================================="
    echo ""
    
    # Check if AWS CLI is configured
    if ! aws sts get-caller-identity --profile "$PROFILE" &> /dev/null; then
        echo -e "${RED}Error: AWS CLI is not configured or credentials are invalid${NC}"
        exit 1
    fi
    
    # Run validation checks
    if check_stack_exists; then
        validate_stack_status
        validate_stack_outputs
        validate_s3_buckets
        validate_lambda_functions
        validate_rds_database
        validate_api_gateway
        validate_iam_security
        validate_cloudwatch_logging
        validate_security_groups
        validate_security_posture
        validate_cost_optimization
    else
        echo -e "${RED}Error: Stack validation cannot proceed - stack does not exist${NC}"
        exit 1
    fi
    
    # Print summary
    print_validation_summary
}

# Run main function
main "$@"