import AWS from 'aws-sdk';

// AWS Configuration
const awsConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'ap-southeast-1',
  accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
  secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
};

// Configure AWS SDK
AWS.config.update(awsConfig);

// S3 Configuration
export const s3Config = {
  documentsBucket: import.meta.env.VITE_AWS_S3_DOCUMENTS_BUCKET || 'flowfi-documents-bucket',
  backupsBucket: import.meta.env.VITE_AWS_S3_BACKUPS_BUCKET || 'flowfi-backups-bucket',
  region: awsConfig.region,
};

// RDS Configuration
export const rdsConfig = {
  endpoint: import.meta.env.VITE_AWS_RDS_ENDPOINT,
  database: import.meta.env.VITE_AWS_RDS_DATABASE || 'flowfi',
  username: import.meta.env.VITE_AWS_RDS_USERNAME || 'flowfi_admin',
  password: import.meta.env.VITE_AWS_RDS_PASSWORD,
  port: parseInt(import.meta.env.VITE_AWS_RDS_PORT || '5432'),
  region: awsConfig.region,
};

// Cognito Configuration
export const cognitoConfig = {
  userPoolId: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID,
  clientId: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID,
  identityPoolId: import.meta.env.VITE_AWS_COGNITO_IDENTITY_POOL_ID,
  region: awsConfig.region,
};

// API Gateway Configuration
export const apiGatewayConfig = {
  url: import.meta.env.VITE_AWS_API_GATEWAY_URL,
  region: awsConfig.region,
};

// Lambda Functions Configuration
export const lambdaConfig = {
  documentProcessor: import.meta.env.VITE_AWS_LAMBDA_DOCUMENT_PROCESSOR || 'flowfi-document-processor',
  aiCategorizer: import.meta.env.VITE_AWS_LAMBDA_AI_CATEGORIZER || 'flowfi-ai-categorizer',
  reportGenerator: import.meta.env.VITE_AWS_LAMBDA_REPORT_GENERATOR || 'flowfi-report-generator',
  notificationService: import.meta.env.VITE_AWS_LAMBDA_NOTIFICATION_SERVICE || 'flowfi-notification-service',
  region: awsConfig.region,
};

// AI Services Configuration
export const aiServicesConfig = {
  textract: {
    region: import.meta.env.VITE_AWS_TEXTRACT_REGION || awsConfig.region,
  },
  bedrock: {
    region: import.meta.env.VITE_AWS_BEDROCK_REGION || awsConfig.region,
  },
  comprehend: {
    region: import.meta.env.VITE_AWS_COMPREHEND_REGION || awsConfig.region,
  },
};

// Notification Services Configuration
export const notificationConfig = {
  ses: {
    region: import.meta.env.VITE_AWS_SES_REGION || awsConfig.region,
    fromEmail: import.meta.env.VITE_AWS_SES_FROM_EMAIL || 'noreply@flowfi.com',
  },
  sns: {
    region: import.meta.env.VITE_AWS_SNS_REGION || awsConfig.region,
  },
};

// CloudWatch Configuration
export const cloudWatchConfig = {
  logGroup: import.meta.env.VITE_AWS_CLOUDWATCH_LOG_GROUP || '/aws/lambda/flowfi',
  region: import.meta.env.VITE_AWS_CLOUDWATCH_REGION || awsConfig.region,
};

// Export default AWS configuration
export default awsConfig;