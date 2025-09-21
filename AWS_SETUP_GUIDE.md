# FlowFi AWS Setup Guide

This guide will help you set up AWS services for your FlowFi application.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed (already done ✅)
- Node.js and npm installed (already done ✅)

## Step 1: Configure AWS Credentials

You need to configure your AWS credentials to deploy the infrastructure. You have several options:

### Option A: Using AWS CLI Configure (Recommended)

```bash
aws configure
```

You'll be prompted to enter:
- **AWS Access Key ID**: Your AWS access key
- **AWS Secret Access Key**: Your AWS secret key
- **Default region name**: `ap-southeast-3` (Malaysia)
- **Default output format**: `json`

### Option B: Using Environment Variables

Set these environment variables in your shell:

```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_DEFAULT_REGION="ap-southeast-3"
```

### Option C: Using AWS Profile

If you have multiple AWS accounts, you can create a named profile:

```bash
aws configure --profile flowfi
```

Then use it by setting:
```bash
export AWS_PROFILE=flowfi
```

## Step 2: Verify AWS Credentials

Test your credentials:

```bash
npm run aws:check
```

This should show:
- ✅ AWS CLI is installed
- ✅ AWS credentials are valid
- ✅ AWS CDK is available

## Step 3: Deploy AWS Infrastructure

Once your credentials are configured, deploy the infrastructure:

```bash
npm run aws:deploy
```

This will:
1. Install all dependencies
2. Bootstrap CDK in the Malaysia region
3. Synthesize the CDK stack
4. Deploy all AWS resources
5. Generate stack outputs
6. Create environment configuration

## Step 4: Configure Environment Variables

After deployment, update your `.env` file with the actual AWS resource values from `stack-outputs.txt`:

```env
# AWS Configuration
AWS_REGION=ap-southeast-3
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# RDS Database
AWS_RDS_ENDPOINT=your-rds-endpoint
AWS_RDS_DATABASE=flowfi_db
AWS_RDS_USERNAME=flowfi_user
AWS_RDS_PASSWORD=your-secure-password

# S3 Buckets
AWS_S3_DOCUMENTS_BUCKET=flowfi-documents-bucket
AWS_S3_BACKUPS_BUCKET=flowfi-backups-bucket

# Cognito
AWS_COGNITO_USER_POOL_ID=your-user-pool-id
AWS_COGNITO_CLIENT_ID=your-client-id
AWS_COGNITO_IDENTITY_POOL_ID=your-identity-pool-id

# API Gateway
AWS_API_GATEWAY_URL=your-api-gateway-url

# Lambda Functions
AWS_LAMBDA_DOCUMENT_PROCESSOR=flowfi-document-processor
AWS_LAMBDA_AI_CATEGORIZER=flowfi-ai-categorizer
AWS_LAMBDA_REPORT_GENERATOR=flowfi-report-generator
AWS_LAMBDA_NOTIFICATION_SERVICE=flowfi-notification-service
```

## Step 5: Test AWS Services

Verify all services are working:

```bash
npm run aws:test
```

This will test:
- Database connection
- S3 bucket access
- Cognito user pool
- Lambda functions
- AI services (Textract, Comprehend)
- Notification services (SES, SNS)
- CloudWatch logging

## Step 6: Initialize Database

Once the RDS instance is running, initialize the database schema:

```bash
npm run db:init
```

## Troubleshooting

### Common Issues

1. **Invalid Credentials Error**
   - Verify your AWS access keys are correct
   - Check if your account has the necessary permissions
   - Ensure the region is set to `ap-southeast-3`

2. **CDK Bootstrap Failed**
   - Make sure you have permissions to create CloudFormation stacks
   - Verify the region is supported for CDK

3. **Lambda Deployment Failed**
   - Check if the Lambda function code is valid
   - Verify all dependencies are installed

4. **RDS Connection Failed**
   - Ensure the security groups allow connections
   - Verify the database credentials
   - Check if the VPC configuration is correct

### Useful Commands

```bash
# Check AWS account information
aws sts get-caller-identity

# List available regions
aws ec2 describe-regions --output table

# Check CDK version
cdk --version

# View CDK stack status
aws cloudformation describe-stacks --stack-name flowfi-stack --region ap-southeast-3

# View stack outputs
aws cloudformation describe-stacks --stack-name flowfi-stack --region ap-southeast-3 --query 'Stacks[0].Outputs'
```

## AWS Services Used

FlowFi uses the following AWS services:

- **RDS (PostgreSQL)**: Database for storing application data
- **S3**: File storage for documents and backups
- **Lambda**: Serverless functions for processing
- **Cognito**: User authentication and authorization
- **API Gateway**: REST API endpoints
- **Textract**: OCR for document processing
- **Comprehend**: AI text analysis and categorization
- **SES**: Email notifications
- **SNS**: SMS notifications
- **CloudWatch**: Logging and monitoring

## Security Considerations

1. **IAM Permissions**: Use least privilege principle
2. **VPC Security**: Configure security groups properly
3. **Database Security**: Use strong passwords and encryption
4. **API Security**: Implement proper authentication
5. **Environment Variables**: Never commit secrets to version control

## Cost Optimization

- Use appropriate instance sizes for RDS
- Configure S3 lifecycle policies
- Set up CloudWatch alarms for cost monitoring
- Use Lambda provisioned concurrency only when needed

## Next Steps

After successful setup:

1. Start the development server: `npm run dev`
2. Test the application functionality
3. Configure additional features as needed
4. Set up monitoring and alerting
5. Plan for production deployment

---

**Need Help?**

If you encounter issues:
1. Check the AWS CloudFormation console for stack events
2. Review CloudWatch logs for error details
3. Verify all environment variables are set correctly
4. Ensure your AWS account has sufficient permissions