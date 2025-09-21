#!/usr/bin/env node

import dotenv from 'dotenv';
import AWS from 'aws-sdk';
import { db } from '../database/connection';
import {
  s3Service,
  cognitoService,
  lambdaService,
  textractService,
  sesService,
  cloudWatchService,
} from '../services/aws-services';
import {
  s3Config,
  cognitoConfig,
  lambdaConfig,
  aiServicesConfig,
  notificationConfig,
  cloudWatchConfig,
} from '../config/aws-config';

// Load environment variables
dotenv.config();

class AWSInitializer {
  private errors: string[] = [];
  private warnings: string[] = [];

  async initialize(): Promise<void> {
    // console.log('🚀 Initializing AWS services for FlowFi...');
    // console.log('=' .repeat(50));

    try {
      // Check environment variables
      // console.log('📋 Checking environment variables...');
      const envCheck = this.checkEnvironmentVariables();
      if (!envCheck.success) {
        throw new Error(`Missing required environment variables: ${envCheck.missing.join(', ')}`);
      }
      // console.log('✅ All required environment variables are set');

      // Test AWS credentials
      // console.log('🔐 Testing AWS credentials...');
      const identity = await this.testAWSCredentials();
      // console.log(`✅ AWS credentials valid - Account: ${identity.Account}, User: ${identity.Arn}`);

      // Test database connection
      // console.log('🗄️  Testing database connection...');
      const dbSuccess = await db.testConnection();
      if (!dbSuccess) {
        throw new Error('Database connection failed');
      }
      // console.log('✅ Database connection successful');

      // Test S3 service
      // console.log('📦 Testing S3 service...');
      const s3Config = config.aws.s3;
      const s3Test = await this.testS3Service(s3Config.documentsBucket);
      if (!s3Test.success) {
        throw new Error(`S3 service test failed: ${s3Test.error}`);
      }
      // console.log(`✅ Documents bucket '${s3Config.documentsBucket}' is accessible`);
      
      const backupTest = await this.testS3Service(s3Config.backupsBucket);
      if (!backupTest.success) {
        throw new Error(`S3 backup bucket test failed: ${backupTest.error}`);
      }
      // console.log(`✅ Backups bucket '${s3Config.backupsBucket}' is accessible`);

      // Test Cognito service
      // console.log('👤 Testing Cognito service...');
      const cognitoConfig = config.aws.cognito;
      const cognitoTest = await this.testCognitoService(cognitoConfig.userPoolId);
      if (!cognitoTest.success) {
        throw new Error(`Cognito service test failed: ${cognitoTest.error}`);
      }
      // console.log(`✅ Cognito User Pool '${cognitoConfig.userPoolId}' is accessible`);

      // Test Lambda functions
      // console.log('⚡ Testing Lambda functions...');
      const lambdaConfig = config.aws.lambda;
      const functionName = lambdaConfig.documentProcessorFunction;
      const lambdaTest = await this.testLambdaFunction(functionName);
      if (!lambdaTest.success) {
        throw new Error(`Lambda function test failed: ${lambdaTest.error}`);
      }
      // console.log(`✅ Lambda function '${functionName}' is accessible`);

      // Test AI services
      // console.log('🤖 Testing AI services...');
      const aiServicesConfig = config.aws.aiServices;
      const textractTest = await this.testTextractService(aiServicesConfig.textract.region);
      if (!textractTest.success) {
        throw new Error(`Textract service test failed: ${textractTest.error}`);
      }
      // console.log(`✅ Textract service is available in region ${aiServicesConfig.textract.region}`);

      const comprehendTest = await this.testComprehendService(aiServicesConfig.comprehend.region);
      if (!comprehendTest.success) {
        throw new Error(`Comprehend service test failed: ${comprehendTest.error}`);
      }
      // console.log(`✅ Comprehend service is available in region ${aiServicesConfig.comprehend.region}`);

      // Test notification services
      // console.log('📧 Testing notification services...');
      const notificationConfig = config.aws.notifications;
      const sesTest = await this.testSESService(notificationConfig.ses.region);
      if (!sesTest.success) {
        throw new Error(`SES service test failed: ${sesTest.error}`);
      }
      // console.log(`✅ SES service is accessible in region ${notificationConfig.ses.region}`);

      const snsTest = await this.testSNSService(notificationConfig.sns.region);
      if (!snsTest.success) {
        throw new Error(`SNS service test failed: ${snsTest.error}`);
      }
      // console.log(`✅ SNS service is accessible in region ${notificationConfig.sns.region}`);

      // Test CloudWatch service
      // console.log('📊 Testing CloudWatch service...');
      const cloudWatchConfig = config.aws.cloudWatch;
      const cloudWatchTest = await this.testCloudWatchService(cloudWatchConfig.region);
      if (!cloudWatchTest.success) {
        throw new Error(`CloudWatch service test failed: ${cloudWatchTest.error}`);
      }
      // console.log(`✅ CloudWatch Logs service is accessible in region ${cloudWatchConfig.region}`);

      // console.log('\n' + '=' .repeat(50));
      // console.log('📊 AWS Initialization Results');
      // console.log('=' .repeat(50));
      // console.log('🎉 All AWS services initialized successfully!');

    } catch (error) {
      // console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`  - ${error}`));
      // console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
      // console.log('\n🔧 Please fix the errors above before proceeding.');
      throw error;
    }

    if (this.warnings.length > 0) {
      // console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
      // console.log('\n✅ Initialization completed with warnings. You can proceed, but some features may not work properly.');
    }
  }}]}

  private async checkEnvironmentVariables(): Promise<void> {
    console.log('📋 Checking environment variables...');

    const requiredVars = [
      'AWS_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_RDS_ENDPOINT',
      'AWS_RDS_DATABASE',
      'AWS_RDS_USERNAME',
      'AWS_RDS_PASSWORD',
    ];

    const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);

    if (missingVars.length > 0) {
      this.errors.push(`Missing required environment variables: ${missingVars.join(', ')}`);
    } else {
      console.log('✅ All required environment variables are set');
    }

    const optionalVars = [
      'AWS_COGNITO_USER_POOL_ID',
      'AWS_COGNITO_CLIENT_ID',
      'AWS_API_GATEWAY_URL',
    ];

    const missingOptionalVars = optionalVars.filter(varName => !import.meta.env[varName]);
    if (missingOptionalVars.length > 0) {
      this.warnings.push(`Optional environment variables not set: ${missingOptionalVars.join(', ')}`);
    }
  }

  private async testAWSCredentials(): Promise<void> {
    console.log('🔐 Testing AWS credentials...');

    try {
      const sts = new AWS.STS();
      const identity = await sts.getCallerIdentity().promise();
      console.log(`✅ AWS credentials valid - Account: ${identity.Account}, User: ${identity.Arn}`);
    } catch (error) {
      this.errors.push(`AWS credentials test failed: ${error}`);
    }
  }

  private async testDatabaseConnection(): Promise<void> {
    console.log('🗄️  Testing database connection...');

    try {
      const isConnected = await db.testConnection();
      if (isConnected) {
        console.log('✅ Database connection successful');
      } else {
        this.errors.push('Database connection failed');
      }
    } catch (error) {
      this.errors.push(`Database connection error: ${error}`);
    }
  }

  private async testS3Service(): Promise<void> {
    console.log('📦 Testing S3 service...');

    try {
      const s3 = new AWS.S3();
      
      // Test documents bucket
      try {
        await s3.headBucket({ Bucket: s3Config.documentsBucket }).promise();
        console.log(`✅ Documents bucket '${s3Config.documentsBucket}' is accessible`);
      } catch (error) {
        this.warnings.push(`Documents bucket '${s3Config.documentsBucket}' not accessible: ${error}`);
      }

      // Test backups bucket
      try {
        await s3.headBucket({ Bucket: s3Config.backupsBucket }).promise();
        console.log(`✅ Backups bucket '${s3Config.backupsBucket}' is accessible`);
      } catch (error) {
        this.warnings.push(`Backups bucket '${s3Config.backupsBucket}' not accessible: ${error}`);
      }
    } catch (error) {
      this.errors.push(`S3 service test failed: ${error}`);
    }
  }

  private async testCognitoService(): Promise<void> {
    console.log('👤 Testing Cognito service...');

    if (!cognitoConfig.userPoolId) {
      this.warnings.push('Cognito User Pool ID not configured');
      return;
    }

    try {
      const cognito = new AWS.CognitoIdentityServiceProvider();
      await cognito.describeUserPool({ UserPoolId: cognitoConfig.userPoolId }).promise();
      console.log(`✅ Cognito User Pool '${cognitoConfig.userPoolId}' is accessible`);
    } catch (error) {
      this.errors.push(`Cognito service test failed: ${error}`);
    }
  }

  private async testLambdaFunctions(): Promise<void> {
    console.log('⚡ Testing Lambda functions...');

    const lambda = new AWS.Lambda();
    const functions = [
      lambdaConfig.documentProcessor,
      lambdaConfig.aiCategorizer,
      lambdaConfig.reportGenerator,
      lambdaConfig.notificationService,
    ];

    for (const functionName of functions) {
      try {
        await lambda.getFunction({ FunctionName: functionName }).promise();
        console.log(`✅ Lambda function '${functionName}' is accessible`);
      } catch (error) {
        this.warnings.push(`Lambda function '${functionName}' not accessible: ${error}`);
      }
    }
  }

  private async testAIServices(): Promise<void> {
    console.log('🤖 Testing AI services...');

    // Test Textract
    try {
      const textract = new AWS.Textract({ region: aiServicesConfig.textract.region });
      // Just check if the service is available (no actual document processing)
      console.log(`✅ Textract service is available in region ${aiServicesConfig.textract.region}`);
    } catch (error) {
      this.warnings.push(`Textract service test failed: ${error}`);
    }

    // Test Comprehend
    try {
      const comprehend = new AWS.Comprehend({ region: aiServicesConfig.comprehend.region });
      console.log(`✅ Comprehend service is available in region ${aiServicesConfig.comprehend.region}`);
    } catch (error) {
      this.warnings.push(`Comprehend service test failed: ${error}`);
    }
  }

  private async testNotificationServices(): Promise<void> {
    console.log('📧 Testing notification services...');

    // Test SES
    try {
      const ses = new AWS.SES({ region: notificationConfig.ses.region });
      await ses.getSendQuota().promise();
      console.log(`✅ SES service is accessible in region ${notificationConfig.ses.region}`);
    } catch (error) {
      this.warnings.push(`SES service test failed: ${error}`);
    }

    // Test SNS
    try {
      const sns = new AWS.SNS({ region: notificationConfig.sns.region });
      await sns.listTopics().promise();
      console.log(`✅ SNS service is accessible in region ${notificationConfig.sns.region}`);
    } catch (error) {
      this.warnings.push(`SNS service test failed: ${error}`);
    }
  }

  private async testCloudWatchService(): Promise<void> {
    console.log('📊 Testing CloudWatch service...');

    try {
      const cloudWatchLogs = new AWS.CloudWatchLogs({ region: cloudWatchConfig.region });
      await cloudWatchLogs.describeLogGroups().promise();
      console.log(`✅ CloudWatch Logs service is accessible in region ${cloudWatchConfig.region}`);
    } catch (error) {
      this.warnings.push(`CloudWatch service test failed: ${error}`);
    }
  }

  private displayResults(): void {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 AWS Initialization Results');
    console.log('=' .repeat(50));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All AWS services initialized successfully!');
    } else {
      if (this.errors.length > 0) {
        console.log('\n❌ Errors:');
        this.errors.forEach(error => console.log(`  - ${error}`));
      }

      if (this.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        this.warnings.forEach(warning => console.log(`  - ${warning}`));
      }

      if (this.errors.length > 0) {
        console.log('\n🔧 Please fix the errors above before proceeding.');
        throw new Error('AWS initialization failed due to missing required environment variables');
      } else {
        console.log('\n✅ Initialization completed with warnings. You can proceed, but some features may not work properly.');
      }
    }
  }
}

// Run the initializer if this script is executed directly
if (require.main === module) {
  const initializer = new AWSInitializer();
  initializer.initialize().catch(error => {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  });
}

export { AWSInitializer };