#!/usr/bin/env node

/**
 * FlowFi AWS Deployment Status Checker
 * 
 * This script checks the deployment status of all AWS resources
 * defined in the FlowFi stack and reports any failures with specific error messages.
 */

const { 
  S3Client, 
  HeadBucketCommand, 
  ListBucketsCommand 
} = require('@aws-sdk/client-s3');
const { 
  RDSClient, 
  DescribeDBInstancesCommand 
} = require('@aws-sdk/client-rds');
const { 
  LambdaClient, 
  GetFunctionCommand, 
  ListFunctionsCommand 
} = require('@aws-sdk/client-lambda');
const { 
  APIGatewayClient, 
  GetRestApisCommand, 
  GetRestApiCommand 
} = require('@aws-sdk/client-api-gateway');
const { 
  CloudWatchClient, 
  DescribeAlarmsCommand 
} = require('@aws-sdk/client-cloudwatch');
const { 
  SNSClient, 
  ListTopicsCommand, 
  GetTopicAttributesCommand 
} = require('@aws-sdk/client-sns');
const { 
  EC2Client, 
  DescribeVpcsCommand 
} = require('@aws-sdk/client-ec2');
const { 
  IAMClient, 
  GetRoleCommand 
} = require('@aws-sdk/client-iam');

// AWS Configuration
const AWS_REGION = process.env.VITE_AWS_REGION || 'ap-southeast-1';
const AWS_PROFILE = process.env.AWS_PROFILE || 'flowfi';

// Use profile-based credentials for SSO
const AWS_CONFIG = {
  region: AWS_REGION,
  profile: AWS_PROFILE
};

// Expected AWS Resources
const EXPECTED_RESOURCES = {
  s3Buckets: [
    'flowfi-documents',
    'flowfi-backups'
  ],
  lambdaFunctions: [
    'flowfi-document-processor',
    'flowfi-ai-categorizer', 
    'flowfi-report-generator',
    'flowfi-notification-service'
  ],
  rdsInstances: [
    'flowfi-database'
  ],
  apiGateways: [
    'flowfi-backend-api'
  ],
  snsTopics: [
    'flowfi-document-events',
    'flowfi-system-alerts'
  ],
  cloudWatchAlarms: [
    'FlowFi-HighErrorRate',
    'FlowFi-SlowAPIResponse'
  ],
  iamRoles: [
    'FlowFiStack-FlowFiLambdaRole'
  ]
};

// Initialize AWS clients
const s3Client = new S3Client(AWS_CONFIG);
const rdsClient = new RDSClient(AWS_CONFIG);
const lambdaClient = new LambdaClient(AWS_CONFIG);
const apiGatewayClient = new APIGatewayClient(AWS_CONFIG);
const cloudWatchClient = new CloudWatchClient(AWS_CONFIG);
const snsClient = new SNSClient(AWS_CONFIG);
const ec2Client = new EC2Client(AWS_CONFIG);
const iamClient = new IAMClient(AWS_CONFIG);

// Status tracking
const deploymentStatus = {
  successful: [],
  failed: [],
  warnings: []
};

/**
 * Check S3 Buckets
 */
async function checkS3Buckets() {
  console.log('\n🪣 Checking S3 Buckets...');
  
  for (const bucketName of EXPECTED_RESOURCES.s3Buckets) {
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      deploymentStatus.successful.push(`S3 Bucket: ${bucketName}`);
      console.log(`✅ S3 Bucket '${bucketName}' exists and is accessible`);
    } catch (error) {
      deploymentStatus.failed.push({
        resource: `S3 Bucket: ${bucketName}`,
        error: error.message,
        code: error.name
      });
      console.log(`❌ S3 Bucket '${bucketName}' failed: ${error.message}`);
    }
  }
}

/**
 * Check Lambda Functions
 */
async function checkLambdaFunctions() {
  console.log('\n⚡ Checking Lambda Functions...');
  
  for (const functionName of EXPECTED_RESOURCES.lambdaFunctions) {
    try {
      const response = await lambdaClient.send(new GetFunctionCommand({ FunctionName: functionName }));
      const state = response.Configuration?.State;
      const lastUpdateStatus = response.Configuration?.LastUpdateStatus;
      
      if (state === 'Active' && lastUpdateStatus === 'Successful') {
        deploymentStatus.successful.push(`Lambda Function: ${functionName}`);
        console.log(`✅ Lambda Function '${functionName}' is active and ready`);
      } else {
        deploymentStatus.warnings.push({
          resource: `Lambda Function: ${functionName}`,
          warning: `State: ${state}, Last Update: ${lastUpdateStatus}`
        });
        console.log(`⚠️  Lambda Function '${functionName}' state: ${state}, last update: ${lastUpdateStatus}`);
      }
    } catch (error) {
      deploymentStatus.failed.push({
        resource: `Lambda Function: ${functionName}`,
        error: error.message,
        code: error.name
      });
      console.log(`❌ Lambda Function '${functionName}' failed: ${error.message}`);
    }
  }
}

/**
 * Check RDS Instances
 */
async function checkRDSInstances() {
  console.log('\n🗄️  Checking RDS Instances...');
  
  for (const instanceId of EXPECTED_RESOURCES.rdsInstances) {
    try {
      const response = await rdsClient.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: instanceId }));
      const instance = response.DBInstances?.[0];
      
      if (instance) {
        const status = instance.DBInstanceStatus;
        if (status === 'available') {
          deploymentStatus.successful.push(`RDS Instance: ${instanceId}`);
          console.log(`✅ RDS Instance '${instanceId}' is available`);
          console.log(`   Endpoint: ${instance.Endpoint?.Address}:${instance.Endpoint?.Port}`);
        } else {
          deploymentStatus.warnings.push({
            resource: `RDS Instance: ${instanceId}`,
            warning: `Status: ${status}`
          });
          console.log(`⚠️  RDS Instance '${instanceId}' status: ${status}`);
        }
      }
    } catch (error) {
      deploymentStatus.failed.push({
        resource: `RDS Instance: ${instanceId}`,
        error: error.message,
        code: error.name
      });
      console.log(`❌ RDS Instance '${instanceId}' failed: ${error.message}`);
    }
  }
}

/**
 * Check API Gateway
 */
async function checkAPIGateway() {
  console.log('\n🌐 Checking API Gateway...');
  
  try {
    const response = await apiGatewayClient.send(new GetRestApisCommand({}));
    const apis = response.items || [];
    
    for (const apiName of EXPECTED_RESOURCES.apiGateways) {
      const api = apis.find(a => a.name === apiName);
      
      if (api) {
        deploymentStatus.successful.push(`API Gateway: ${apiName}`);
        console.log(`✅ API Gateway '${apiName}' exists`);
        console.log(`   API ID: ${api.id}`);
        console.log(`   Endpoint: https://${api.id}.execute-api.${AWS_REGION}.amazonaws.com/`);
      } else {
        deploymentStatus.failed.push({
          resource: `API Gateway: ${apiName}`,
          error: 'API Gateway not found',
          code: 'NOT_FOUND'
        });
        console.log(`❌ API Gateway '${apiName}' not found`);
      }
    }
  } catch (error) {
    deploymentStatus.failed.push({
      resource: 'API Gateway',
      error: error.message,
      code: error.name
    });
    console.log(`❌ API Gateway check failed: ${error.message}`);
  }
}

/**
 * Check SNS Topics
 */
async function checkSNSTopics() {
  console.log('\n📢 Checking SNS Topics...');
  
  try {
    const response = await snsClient.send(new ListTopicsCommand({}));
    const topics = response.Topics || [];
    
    for (const topicName of EXPECTED_RESOURCES.snsTopics) {
      const topic = topics.find(t => t.TopicArn?.includes(topicName));
      
      if (topic) {
        deploymentStatus.successful.push(`SNS Topic: ${topicName}`);
        console.log(`✅ SNS Topic '${topicName}' exists`);
        console.log(`   ARN: ${topic.TopicArn}`);
      } else {
        deploymentStatus.failed.push({
          resource: `SNS Topic: ${topicName}`,
          error: 'SNS Topic not found',
          code: 'NOT_FOUND'
        });
        console.log(`❌ SNS Topic '${topicName}' not found`);
      }
    }
  } catch (error) {
    deploymentStatus.failed.push({
      resource: 'SNS Topics',
      error: error.message,
      code: error.name
    });
    console.log(`❌ SNS Topics check failed: ${error.message}`);
  }
}

/**
 * Check CloudWatch Alarms
 */
async function checkCloudWatchAlarms() {
  console.log('\n📊 Checking CloudWatch Alarms...');
  
  try {
    const response = await cloudWatchClient.send(new DescribeAlarmsCommand({
      AlarmNames: EXPECTED_RESOURCES.cloudWatchAlarms
    }));
    
    const alarms = response.MetricAlarms || [];
    
    for (const alarmName of EXPECTED_RESOURCES.cloudWatchAlarms) {
      const alarm = alarms.find(a => a.AlarmName === alarmName);
      
      if (alarm) {
        deploymentStatus.successful.push(`CloudWatch Alarm: ${alarmName}`);
        console.log(`✅ CloudWatch Alarm '${alarmName}' exists`);
        console.log(`   State: ${alarm.StateValue}`);
      } else {
        deploymentStatus.failed.push({
          resource: `CloudWatch Alarm: ${alarmName}`,
          error: 'CloudWatch Alarm not found',
          code: 'NOT_FOUND'
        });
        console.log(`❌ CloudWatch Alarm '${alarmName}' not found`);
      }
    }
  } catch (error) {
    deploymentStatus.failed.push({
      resource: 'CloudWatch Alarms',
      error: error.message,
      code: error.name
    });
    console.log(`❌ CloudWatch Alarms check failed: ${error.message}`);
  }
}

/**
 * Check IAM Roles
 */
async function checkIAMRoles() {
  console.log('\n🔐 Checking IAM Roles...');
  
  for (const roleName of EXPECTED_RESOURCES.iamRoles) {
    try {
      const response = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
      
      if (response.Role) {
        deploymentStatus.successful.push(`IAM Role: ${roleName}`);
        console.log(`✅ IAM Role '${roleName}' exists`);
      }
    } catch (error) {
      deploymentStatus.failed.push({
        resource: `IAM Role: ${roleName}`,
        error: error.message,
        code: error.name
      });
      console.log(`❌ IAM Role '${roleName}' failed: ${error.message}`);
    }
  }
}

/**
 * Generate Summary Report
 */
function generateSummaryReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 FLOWFI AWS DEPLOYMENT STATUS SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`\n✅ SUCCESSFUL DEPLOYMENTS (${deploymentStatus.successful.length}):`);
  deploymentStatus.successful.forEach(resource => {
    console.log(`   ✓ ${resource}`);
  });
  
  if (deploymentStatus.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${deploymentStatus.warnings.length}):`);
    deploymentStatus.warnings.forEach(warning => {
      console.log(`   ⚠️  ${warning.resource}: ${warning.warning}`);
    });
  }
  
  if (deploymentStatus.failed.length > 0) {
    console.log(`\n❌ FAILED DEPLOYMENTS (${deploymentStatus.failed.length}):`);
    deploymentStatus.failed.forEach(failure => {
      console.log(`   ❌ ${failure.resource}`);
      console.log(`      Error: ${failure.error}`);
      console.log(`      Code: ${failure.code}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  const totalResources = deploymentStatus.successful.length + deploymentStatus.failed.length;
  const successRate = totalResources > 0 ? (deploymentStatus.successful.length / totalResources * 100).toFixed(1) : 0;
  
  console.log(`📊 DEPLOYMENT SUCCESS RATE: ${successRate}% (${deploymentStatus.successful.length}/${totalResources})`);
  
  if (deploymentStatus.failed.length === 0) {
    console.log('🎉 ALL AWS SERVICES SUCCESSFULLY DEPLOYED!');
  } else {
    console.log(`⚠️  ${deploymentStatus.failed.length} AWS services need attention`);
  }
  
  console.log('='.repeat(80));
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting FlowFi AWS Deployment Status Check...');
  console.log(`📍 Region: ${AWS_REGION}`);
  console.log(`🔑 Using AWS Profile: ${process.env.VITE_AWS_PROFILE || 'default'}`);
  
  try {
    await checkS3Buckets();
    await checkLambdaFunctions();
    await checkRDSInstances();
    await checkAPIGateway();
    await checkSNSTopics();
    await checkCloudWatchAlarms();
    await checkIAMRoles();
    
    generateSummaryReport();
    
    // Exit with appropriate code
    process.exit(deploymentStatus.failed.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Fatal error during deployment check:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  checkS3Buckets,
  checkLambdaFunctions,
  checkRDSInstances,
  checkAPIGateway,
  checkSNSTopics,
  checkCloudWatchAlarms,
  checkIAMRoles,
  deploymentStatus
};