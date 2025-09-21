import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { DockerImageCode, DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { SnsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { BlockPublicAccess, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion } from 'aws-cdk-lib/aws-rds';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Subscription, SubscriptionProtocol } from 'aws-cdk-lib/aws-sns';
import { Alarm, ComparisonOperator } from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export class FlowFiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for documents
    const documentsBucket = new s3.Bucket(this, 'FlowFiDocumentsBucket', {
      versioned: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'], // In a real-world scenario, you'd restrict this to your app's domain
          allowedHeaders: ['*'],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // VPC for RDS
    const vpc = new ec2.Vpc(this, 'FlowFiVpc', {
      maxAzs: 2, // Default is 3, but let's be explicit
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'ingress',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'application',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ]
    });

    // RDS PostgreSQL Database
    const database = new rds.DatabaseInstance(this, 'FlowFiDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_15 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      databaseName: 'flowfi',
    });

    // IAM Role for Lambda
    const lambdaRole = new iam.Role(this, 'FlowFiLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant S3 read/write access to the Lambda role
    documentsBucket.grantReadWrite(lambdaRole);
    // Grant RDS Data API access to the Lambda role
    database.grantConnect(lambdaRole);

    const opensearchDomain = new opensearch.Domain(this, 'FlowFiDomain', {
      version: opensearch.EngineVersion.OPENSEARCH_1_0,
      capacity: {
        masterNodes: 3,
        dataNodes: 4,
      },
      ebs: {
        volumeSize: 20,
      },
      zoneAwareness: {
        availabilityZoneCount: 2,
      },
      logging: {
        slowSearchLogEnabled: true,
        appLogEnabled: true,
        slowIndexLogEnabled: true,
      },
    });

    opensearchDomain.grantWrite(lambdaRole);

    // SNS Topic for notifications
    const documentProcessingTopic = new sns.Topic(this, 'DocumentProcessingTopic');

    // Lambda Function for S3 event processing
    const documentProcessorLambda = new lambda.Function(this, 'DocumentProcessorLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/document-processor')),
      role: lambdaRole,
      environment: {
        DATABASE_SECRET_ARN: database.secret?.secretArn || '',
        SNS_TOPIC_ARN: documentProcessingTopic.topicArn,
        OPENSEARCH_ENDPOINT: opensearchDomain.domainEndpoint,
      },
    });

    // Lambda Function for presigned URL generation
    const presignedUrlLambda = new lambda.Function(this, 'PresignedUrlLambda', {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/s3-presigned-url-generator')),
        role: lambdaRole,
        environment: {
            BUCKET_NAME: documentsBucket.bucketName,
        },
    });

    const searchServiceLambda = new lambda.Function(this, 'SearchServiceLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../lambda/search-service'),
      environment: {
        OPENSEARCH_ENDPOINT: opensearchDomain.domainEndpoint,
      },
    });

    opensearchDomain.grantRead(searchServiceLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, 'FlowFiApi', {
        restApiName: 'FlowFi Service',
        description: 'This service serves FlowFi.',
    });

    const presignedUrlIntegration = new apigateway.LambdaIntegration(presignedUrlLambda);
    const presignedUrlResource = api.root.addResource('presigned-url');
    presignedUrlResource.addMethod('GET', presignedUrlIntegration);

      const searchResource = api.root.addResource('search');
      searchResource.addMethod('POST', new apigateway.LambdaIntegration(searchServiceLambda));

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      metric: documentProcessorLambda.metricErrors(),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'Alarm if the Document Processor Lambda fails',
    });

    // CfnOutputs
    new cdk.CfnOutput(this, 'DocumentsBucketName', {
        value: documentsBucket.bucketName,
        description: 'The name of the S3 bucket for documents',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
        value: api.url,
        description: 'The URL of the API Gateway',
    });
  }
}