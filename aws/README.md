# FlowFi AWS Infrastructure Setup Guide

This guide will help you set up and deploy all AWS services required for FlowFi.

## Prerequisites

1. **AWS Account**: Ensure you have an active AWS account
2. **AWS CLI**: Install and configure AWS CLI
3. **Node.js**: Version 18+ installed
4. **AWS CDK**: Installed via npm (already included in project)

## Quick Start

### 1. Configure AWS Credentials

```bash
# Configure AWS CLI with your credentials
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

### 2. Install Dependencies

```bash
# From project root
npm install

# Install CDK globally (optional)
npm install -g aws-cdk
```

### 3. Deploy Infrastructure

```bash
# Make deploy script executable
chmod +x aws/deploy.sh

# Run deployment script
./aws/deploy.sh
```

## Manual Setup Steps

If you prefer manual setup or encounter issues with the automated script:

### 1. Bootstrap CDK

```bash
cd aws/infrastructure
npx cdk bootstrap
```

### 2. Deploy Stack

```bash
# Synthesize CloudFormation template
npx cdk synth

# Deploy the stack
npx cdk deploy FlowFiStack
```

### 3. Package and Deploy Lambda Functions

```bash
# Package each Lambda function
cd ../lambda/document-processor
zip -r document-processor.zip .

cd ../ai-categorizer
zip -r ai-categorizer.zip .

cd ../report-generator
zip -r report-generator.zip .

cd ../notification-service
zip -r notification-service.zip .

# Deploy using AWS CLI
aws lambda update-function-code --function-name flowfi-document-processor-dev --zip-file fileb://document-processor.zip
aws lambda update-function-code --function-name flowfi-ai-categorizer-dev --zip-file fileb://ai-categorizer.zip
aws lambda update-function-code --function-name flowfi-report-generator-dev --zip-file fileb://report-generator.zip
aws lambda update-function-code --function-name flowfi-notification-service-dev --zip-file fileb://notification-service.zip
```

## Services Overview

### 1. S3 Buckets
- **Documents Bucket**: Stores uploaded financial documents
- **Backups Bucket**: Stores database backups and archives
- **Features**: Versioning, lifecycle policies, CORS configuration

### 2. RDS Aurora Serverless
- **Engine**: PostgreSQL
- **Features**: Auto-scaling, automated backups, encryption
- **Access**: VPC-only for security

### 3. Lambda Functions
- **Document Processor**: OCR and data extraction using Textract
- **AI Categorizer**: Expense categorization using Bedrock/Comprehend
- **Report Generator**: Financial report generation
- **Notification Service**: Email and SMS notifications

### 4. API Gateway
- **Type**: REST API
- **Features**: CORS enabled, request validation, rate limiting
- **Endpoints**: Document upload, processing status, reports

### 5. AI/ML Services
- **Textract**: Document OCR and data extraction
- **Bedrock**: AI-powered expense categorization
- **Comprehend**: Text analysis and sentiment detection

### 6. Notification Services
- **SES**: Email notifications with templates
- **SNS**: SMS notifications and push notifications

### 7. Monitoring & Logging
- **CloudWatch**: Logs, metrics, and alarms
- **X-Ray**: Distributed tracing (optional)

## Configuration

### Environment Variables

Update your `.env` file with the deployed resource information:

```bash
# After deployment, update these values
VITE_AWS_REGION=us-east-1
VITE_DOCUMENTS_BUCKET=flowfi-documents-dev-xxxxx
VITE_BACKUPS_BUCKET=flowfi-backups-dev-xxxxx
VITE_API_GATEWAY_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/dev
VITE_DB_CLUSTER_IDENTIFIER=flowfi-cluster-dev-xxxxx
```

### IAM Roles and Policies

The CDK stack creates the following IAM roles:
- **Lambda Execution Role**: For Lambda functions
- **API Gateway Role**: For API Gateway integration
- **S3 Access Role**: For S3 bucket operations
- **RDS Access Role**: For database operations

## Security Considerations

### 1. VPC Configuration
- RDS instances are deployed in private subnets
- Lambda functions have VPC access when needed
- Security groups restrict access appropriately

### 2. Encryption
- S3 buckets use server-side encryption
- RDS instances use encryption at rest
- Lambda environment variables are encrypted

### 3. Access Control
- IAM roles follow principle of least privilege
- API Gateway has request validation
- CORS is properly configured

## Monitoring and Alerts

### CloudWatch Alarms
- Lambda function errors and duration
- API Gateway 4xx/5xx errors
- RDS CPU and connection metrics
- S3 bucket access patterns

### Log Groups
- `/aws/lambda/flowfi-document-processor-dev`
- `/aws/lambda/flowfi-ai-categorizer-dev`
- `/aws/lambda/flowfi-report-generator-dev`
- `/aws/lambda/flowfi-notification-service-dev`
- `/aws/apigateway/flowfi-api-dev`

## Cost Optimization

### 1. S3 Lifecycle Policies
- Transition to IA after 30 days
- Archive to Glacier after 90 days
- Delete after 7 years (compliance)

### 2. RDS Aurora Serverless
- Auto-pauses when not in use
- Scales based on demand
- Backup retention optimized

### 3. Lambda Optimization
- Right-sized memory allocation
- Efficient code and dependencies
- Connection pooling for database

## Troubleshooting

### Common Issues

1. **CDK Bootstrap Failed**
   ```bash
   # Ensure AWS credentials are configured
   aws sts get-caller-identity
   
   # Bootstrap with explicit account/region
   npx cdk bootstrap aws://ACCOUNT-NUMBER/REGION
   ```

2. **Lambda Deployment Failed**
   ```bash
   # Check function logs
   aws logs describe-log-groups --log-group-name-prefix /aws/lambda/flowfi
   
   # View recent logs
   aws logs tail /aws/lambda/flowfi-document-processor-dev --follow
   ```

3. **API Gateway CORS Issues**
   - Verify CORS configuration in CDK stack
   - Check preflight OPTIONS requests
   - Ensure proper headers in Lambda responses

4. **RDS Connection Issues**
   - Verify VPC configuration
   - Check security group rules
   - Ensure Lambda functions are in correct subnets

### Useful Commands

```bash
# View stack resources
aws cloudformation describe-stack-resources --stack-name FlowFiStack

# Check Lambda function status
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `flowfi`)].{Name:FunctionName,Status:State}'

# View API Gateway endpoints
aws apigateway get-rest-apis --query 'items[?name==`FlowFi API`].{Id:id,Name:name}'

# Check S3 buckets
aws s3 ls | grep flowfi

# View RDS clusters
aws rds describe-db-clusters --query 'DBClusters[?starts_with(DBClusterIdentifier, `flowfi`)].{Id:DBClusterIdentifier,Status:Status}'
```

## Cleanup

To remove all AWS resources:

```bash
# Destroy CDK stack
cd aws/infrastructure
npx cdk destroy FlowFiStack

# Remove S3 bucket contents (if needed)
aws s3 rm s3://flowfi-documents-dev-xxxxx --recursive
aws s3 rm s3://flowfi-backups-dev-xxxxx --recursive
```

## Support

For issues or questions:
1. Check CloudWatch logs for error details
2. Review AWS service quotas and limits
3. Consult AWS documentation for specific services
4. Contact AWS support if needed

## Next Steps

After successful deployment:
1. Test document upload functionality
2. Verify AI categorization is working
3. Generate sample reports
4. Set up monitoring dashboards
5. Configure backup and disaster recovery
6. Implement additional security measures
7. Set up CI/CD pipeline for updates

---

**Note**: This setup creates development environment resources. For production deployment, review and adjust:
- Instance sizes and configurations
- Security settings and access controls
- Backup and retention policies
- Monitoring and alerting thresholds
- Cost optimization settings