# FlowFi AWS Integration

FlowFi is a comprehensive document management system built with React and powered by AWS cloud services. This document provides an overview of the AWS integration and setup process.

## 🏗️ Architecture Overview

FlowFi leverages the following AWS services:

### Core Infrastructure
- **Amazon RDS (PostgreSQL)**: Primary database for application data
- **Amazon S3**: Document storage and backups
- **AWS Lambda**: Serverless functions for document processing
- **Amazon API Gateway**: RESTful API endpoints
- **Amazon Cognito**: User authentication and authorization

### AI & Processing Services
- **Amazon Textract**: OCR for document text extraction
- **Amazon Comprehend**: AI-powered text analysis and categorization

### Notification & Monitoring
- **Amazon SES**: Email notifications
- **Amazon SNS**: SMS notifications
- **Amazon CloudWatch**: Logging and monitoring

## 🚀 Quick Start

### Prerequisites
- AWS Account with appropriate permissions
- Node.js 18+ and npm
- AWS CLI installed

### 1. Setup AWS Credentials

```bash
# Interactive setup helper
npm run aws:setup

# Or configure manually
aws configure
```

### 2. Deploy Infrastructure

```bash
# Check prerequisites
npm run aws:check

# Deploy all AWS resources
npm run aws:deploy
```

### 3. Initialize Services

```bash
# Test all AWS service connections
npm run aws:test

# Initialize database schema
npm run db:init
```

### 4. Start Development

```bash
# Start the development server
npm run dev
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run aws:setup` | Interactive AWS credentials setup |
| `npm run aws:check` | Verify AWS configuration and permissions |
| `npm run aws:deploy` | Deploy complete AWS infrastructure |
| `npm run aws:test` | Test all AWS service connections |
| `npm run aws:init` | Initialize AWS services in application |
| `npm run cdk:synth` | Synthesize CDK stack |
| `npm run cdk:deploy` | Deploy CDK stack only |
| `npm run cdk:destroy` | Destroy CDK stack |
| `npm run db:init` | Initialize database schema |

## 🏗️ Infrastructure Components

### CDK Stack (`aws/infrastructure/`)

The AWS CDK stack defines all infrastructure as code:

- **VPC & Networking**: Secure network configuration
- **RDS Instance**: PostgreSQL database with security groups
- **S3 Buckets**: Document storage with lifecycle policies
- **Lambda Functions**: Processing functions with proper IAM roles
- **Cognito User Pool**: Authentication service
- **API Gateway**: REST API with Lambda integration

### Lambda Functions (`aws/lambda/`)

1. **Document Processor**: Handles file uploads and initial processing
2. **AI Categorizer**: Uses Comprehend for automatic categorization
3. **Report Generator**: Creates reports and analytics
4. **Notification Service**: Manages email and SMS notifications

### Database Schema (`src/database/`)

- **Users**: User accounts and profiles
- **Documents**: Document metadata and relationships
- **Categories**: Document categorization system
- **Audit Logs**: Activity tracking and compliance

## 🔧 Configuration

### Environment Variables

After deployment, configure these variables in `.env`:

```env
# AWS Configuration
AWS_REGION=ap-southeast-3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Database
AWS_RDS_ENDPOINT=your-rds-endpoint
AWS_RDS_DATABASE=flowfi_db
AWS_RDS_USERNAME=flowfi_user
AWS_RDS_PASSWORD=your-password

# Storage
AWS_S3_DOCUMENTS_BUCKET=flowfi-documents
AWS_S3_BACKUPS_BUCKET=flowfi-backups

# Authentication
AWS_COGNITO_USER_POOL_ID=your-user-pool-id
AWS_COGNITO_CLIENT_ID=your-client-id

# API
AWS_API_GATEWAY_URL=your-api-url
```

### AWS Services Configuration

The application uses centralized AWS configuration:

- **`src/config/aws-config.ts`**: Service configurations
- **`src/services/aws-services.ts`**: Service client instances
- **`src/scripts/init-aws.ts`**: Service initialization and testing

## 🔒 Security

### IAM Permissions

The CDK stack creates minimal IAM roles with least privilege:

- Lambda execution roles with specific service permissions
- S3 bucket policies for secure access
- RDS security groups for database access
- Cognito user pool policies

### Data Protection

- **Encryption at Rest**: RDS and S3 encryption enabled
- **Encryption in Transit**: HTTPS/TLS for all communications
- **Access Control**: Cognito-based authentication
- **Audit Logging**: CloudWatch logs for all activities

## 📊 Monitoring

### CloudWatch Integration

- **Application Logs**: Centralized logging for all services
- **Metrics**: Custom metrics for business KPIs
- **Alarms**: Automated alerting for critical issues
- **Dashboards**: Real-time monitoring views

### Health Checks

The application includes health check endpoints:

- Database connectivity
- S3 bucket access
- Lambda function status
- External service availability

## 🚨 Troubleshooting

### Common Issues

1. **Credentials Error**
   ```bash
   # Check current configuration
   aws sts get-caller-identity
   
   # Reconfigure if needed
   npm run aws:setup
   ```

2. **CDK Bootstrap Failed**
   ```bash
   # Manual bootstrap
   cd aws/infrastructure
   cdk bootstrap aws://ACCOUNT-ID/ap-southeast-3
   ```

3. **Database Connection Failed**
   ```bash
   # Test database connectivity
   npm run aws:test
   
   # Check security groups and VPC configuration
   ```

4. **Lambda Deployment Failed**
   ```bash
   # Check function logs
   aws logs describe-log-groups --region ap-southeast-3
   ```

### Debug Commands

```bash
# View stack status
aws cloudformation describe-stacks --stack-name flowfi-stack --region ap-southeast-3

# Check Lambda functions
aws lambda list-functions --region ap-southeast-3

# View S3 buckets
aws s3 ls

# Test database connection
psql -h $AWS_RDS_ENDPOINT -U $AWS_RDS_USERNAME -d $AWS_RDS_DATABASE
```

## 💰 Cost Optimization

### Resource Sizing

- **RDS**: Start with `db.t3.micro` for development
- **Lambda**: Use appropriate memory allocation
- **S3**: Configure lifecycle policies for cost savings

### Monitoring Costs

- Set up billing alerts in AWS Console
- Use AWS Cost Explorer for analysis
- Monitor usage with CloudWatch metrics

## 🔄 CI/CD Integration

### GitHub Actions (Recommended)

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run aws:deploy
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## 📚 Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Amazon RDS User Guide](https://docs.aws.amazon.com/rds/)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. Verify environment configuration
4. Check AWS service status page

---

**Note**: This setup is optimized for the Malaysia region (`ap-southeast-3`). Adjust region settings if deploying elsewhere.