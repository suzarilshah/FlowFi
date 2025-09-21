"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowFiStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const rds = __importStar(require("aws-cdk-lib/aws-rds"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const opensearch = __importStar(require("aws-cdk-lib/aws-opensearchservice"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const path = __importStar(require("path"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
class FlowFiStack extends cdk.Stack {
    constructor(scope, id, props) {
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
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*'],
                },
            ],
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        // VPC for RDS
        const vpc = new ec2.Vpc(this, 'FlowFiVpc', {
            maxAzs: 2,
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
exports.FlowFiStack = FlowFiStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxvd2ZpLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vZmxvd2ZpLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBRW5DLHVEQUF5QztBQUN6Qyx5REFBMkM7QUFDM0MseURBQTJDO0FBQzNDLHlEQUEyQztBQUMzQyx5REFBMkM7QUFDM0MsK0RBQWlEO0FBQ2pELDhFQUFnRTtBQUNoRSx1RUFBeUQ7QUFFekQsMkNBQTZCO0FBUzdCLHVFQUF5RDtBQUV6RCxNQUFhLFdBQVksU0FBUSxHQUFHLENBQUMsS0FBSztJQUN4QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDBCQUEwQjtRQUMxQixNQUFNLGVBQWUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1lBQ25FLFNBQVMsRUFBRSxJQUFJO1lBQ2YsSUFBSSxFQUFFO2dCQUNKO29CQUNFLGNBQWMsRUFBRTt3QkFDZCxFQUFFLENBQUMsV0FBVyxDQUFDLEdBQUc7d0JBQ2xCLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRzt3QkFDbEIsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJO3dCQUNuQixFQUFFLENBQUMsV0FBVyxDQUFDLE1BQU07d0JBQ3JCLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSTtxQkFDcEI7b0JBQ0QsY0FBYyxFQUFFLENBQUMsR0FBRyxDQUFDO29CQUNyQixjQUFjLEVBQUUsQ0FBQyxHQUFHLENBQUM7aUJBQ3RCO2FBQ0Y7WUFDRCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1NBQ3hDLENBQUMsQ0FBQztRQUVILGNBQWM7UUFDZCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUN6QyxNQUFNLEVBQUUsQ0FBQztZQUNULG1CQUFtQixFQUFFO2dCQUNuQjtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsU0FBUztvQkFDZixVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNO2lCQUNsQztnQkFDRDtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsYUFBYTtvQkFDbkIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsbUJBQW1CO2lCQUMvQztnQkFDRDtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsVUFBVTtvQkFDaEIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO2lCQUM1QzthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsMEJBQTBCO1FBQzFCLE1BQU0sUUFBUSxHQUFHLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUNoRSxNQUFNLEVBQUUsR0FBRyxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDMUYsWUFBWSxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBQ2hGLEdBQUc7WUFDSCxVQUFVLEVBQUU7Z0JBQ1YsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO2FBQzVDO1lBQ0QsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztZQUN4QyxZQUFZLEVBQUUsUUFBUTtTQUN2QixDQUFDLENBQUM7UUFFSCxzQkFBc0I7UUFDdEIsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUN4RCxTQUFTLEVBQUUsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUM7WUFDM0QsZUFBZSxFQUFFO2dCQUNmLEdBQUcsQ0FBQyxhQUFhLENBQUMsd0JBQXdCLENBQUMsMENBQTBDLENBQUM7YUFDdkY7U0FDRixDQUFDLENBQUM7UUFFSCxnREFBZ0Q7UUFDaEQsZUFBZSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMzQywrQ0FBK0M7UUFDL0MsUUFBUSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUVsQyxNQUFNLGdCQUFnQixHQUFHLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ25FLE9BQU8sRUFBRSxVQUFVLENBQUMsYUFBYSxDQUFDLGNBQWM7WUFDaEQsUUFBUSxFQUFFO2dCQUNSLFdBQVcsRUFBRSxDQUFDO2dCQUNkLFNBQVMsRUFBRSxDQUFDO2FBQ2I7WUFDRCxHQUFHLEVBQUU7Z0JBQ0gsVUFBVSxFQUFFLEVBQUU7YUFDZjtZQUNELGFBQWEsRUFBRTtnQkFDYixxQkFBcUIsRUFBRSxDQUFDO2FBQ3pCO1lBQ0QsT0FBTyxFQUFFO2dCQUNQLG9CQUFvQixFQUFFLElBQUk7Z0JBQzFCLGFBQWEsRUFBRSxJQUFJO2dCQUNuQixtQkFBbUIsRUFBRSxJQUFJO2FBQzFCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRXhDLDhCQUE4QjtRQUM5QixNQUFNLHVCQUF1QixHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUseUJBQXlCLENBQUMsQ0FBQztRQUUvRSwwQ0FBMEM7UUFDMUMsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLHlCQUF5QixFQUFFO1lBQ25GLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLGVBQWU7WUFDeEIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDhCQUE4QixDQUFDLENBQUM7WUFDakYsSUFBSSxFQUFFLFVBQVU7WUFDaEIsV0FBVyxFQUFFO2dCQUNYLG1CQUFtQixFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxJQUFJLEVBQUU7Z0JBQ3JELGFBQWEsRUFBRSx1QkFBdUIsQ0FBQyxRQUFRO2dCQUMvQyxtQkFBbUIsRUFBRSxnQkFBZ0IsQ0FBQyxjQUFjO2FBQ3JEO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsK0NBQStDO1FBQy9DLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUN2RSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDO1lBQ3pGLElBQUksRUFBRSxVQUFVO1lBQ2hCLFdBQVcsRUFBRTtnQkFDVCxXQUFXLEVBQUUsZUFBZSxDQUFDLFVBQVU7YUFDMUM7U0FDSixDQUFDLENBQUM7UUFFSCxNQUFNLG1CQUFtQixHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDM0UsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsZUFBZTtZQUN4QixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsMEJBQTBCLENBQUM7WUFDdkQsV0FBVyxFQUFFO2dCQUNYLG1CQUFtQixFQUFFLGdCQUFnQixDQUFDLGNBQWM7YUFDckQ7U0FDRixDQUFDLENBQUM7UUFFSCxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUVoRCxjQUFjO1FBQ2QsTUFBTSxHQUFHLEdBQUcsSUFBSSxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDbEQsV0FBVyxFQUFFLGdCQUFnQjtZQUM3QixXQUFXLEVBQUUsNkJBQTZCO1NBQzdDLENBQUMsQ0FBQztRQUVILE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNyRixNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ25FLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztRQUU3RCxNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0RCxjQUFjLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7UUFFMUYsb0JBQW9CO1FBQ3BCLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDL0MsTUFBTSxFQUFFLHVCQUF1QixDQUFDLFlBQVksRUFBRTtZQUM1QyxTQUFTLEVBQUUsQ0FBQztZQUNaLGlCQUFpQixFQUFFLENBQUM7WUFDcEIsZ0JBQWdCLEVBQUUsOENBQThDO1NBQ25FLENBQUMsQ0FBQztRQUVILGFBQWE7UUFDYixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQzNDLEtBQUssRUFBRSxlQUFlLENBQUMsVUFBVTtZQUNqQyxXQUFXLEVBQUUseUNBQXlDO1NBQ3pELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFO1lBQzlCLEtBQUssRUFBRSxHQUFHLENBQUMsR0FBRztZQUNkLFdBQVcsRUFBRSw0QkFBNEI7U0FDNUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBaktELGtDQWlLQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyByZHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJkcyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucyc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBvcGVuc2VhcmNoIGZyb20gJ2F3cy1jZGstbGliL2F3cy1vcGVuc2VhcmNoc2VydmljZSc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCB7IERvY2tlckltYWdlQ29kZSwgRG9ja2VySW1hZ2VGdW5jdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IFNuc0V2ZW50U291cmNlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYS1ldmVudC1zb3VyY2VzJztcbmltcG9ydCB7IENmbk91dHB1dCwgRHVyYXRpb24sIFN0YWNrLCBTdGFja1Byb3BzIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQmxvY2tQdWJsaWNBY2Nlc3MsIEJ1Y2tldEVuY3J5cHRpb24gfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0IHsgVnBjIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgeyBEYXRhYmFzZUluc3RhbmNlLCBEYXRhYmFzZUluc3RhbmNlRW5naW5lLCBQb3N0Z3Jlc0VuZ2luZVZlcnNpb24gfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtcmRzJztcbmltcG9ydCB7IFBvbGljeVN0YXRlbWVudCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uLCBTdWJzY3JpcHRpb25Qcm90b2NvbCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMnO1xuaW1wb3J0IHsgQWxhcm0sIENvbXBhcmlzb25PcGVyYXRvciB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJztcbmltcG9ydCAqIGFzIGNsb3Vkd2F0Y2ggZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gnO1xuXG5leHBvcnQgY2xhc3MgRmxvd0ZpU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBTMyBCdWNrZXQgZm9yIGRvY3VtZW50c1xuICAgIGNvbnN0IGRvY3VtZW50c0J1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ0Zsb3dGaURvY3VtZW50c0J1Y2tldCcsIHtcbiAgICAgIHZlcnNpb25lZDogdHJ1ZSxcbiAgICAgIGNvcnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGFsbG93ZWRNZXRob2RzOiBbXG4gICAgICAgICAgICBzMy5IdHRwTWV0aG9kcy5HRVQsXG4gICAgICAgICAgICBzMy5IdHRwTWV0aG9kcy5QVVQsXG4gICAgICAgICAgICBzMy5IdHRwTWV0aG9kcy5QT1NULFxuICAgICAgICAgICAgczMuSHR0cE1ldGhvZHMuREVMRVRFLFxuICAgICAgICAgICAgczMuSHR0cE1ldGhvZHMuSEVBRCxcbiAgICAgICAgICBdLFxuICAgICAgICAgIGFsbG93ZWRPcmlnaW5zOiBbJyonXSwgLy8gSW4gYSByZWFsLXdvcmxkIHNjZW5hcmlvLCB5b3UnZCByZXN0cmljdCB0aGlzIHRvIHlvdXIgYXBwJ3MgZG9tYWluXG4gICAgICAgICAgYWxsb3dlZEhlYWRlcnM6IFsnKiddLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICB9KTtcblxuICAgIC8vIFZQQyBmb3IgUkRTXG4gICAgY29uc3QgdnBjID0gbmV3IGVjMi5WcGModGhpcywgJ0Zsb3dGaVZwYycsIHtcbiAgICAgIG1heEF6czogMiwgLy8gRGVmYXVsdCBpcyAzLCBidXQgbGV0J3MgYmUgZXhwbGljaXRcbiAgICAgIHN1Ym5ldENvbmZpZ3VyYXRpb246IFtcbiAgICAgICAge1xuICAgICAgICAgIGNpZHJNYXNrOiAyNCxcbiAgICAgICAgICBuYW1lOiAnaW5ncmVzcycsXG4gICAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICAgIG5hbWU6ICdhcHBsaWNhdGlvbicsXG4gICAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9XSVRIX0VHUkVTUyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGNpZHJNYXNrOiAyOCxcbiAgICAgICAgICBuYW1lOiAnZGF0YWJhc2UnLFxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfSVNPTEFURUQsXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9KTtcblxuICAgIC8vIFJEUyBQb3N0Z3JlU1FMIERhdGFiYXNlXG4gICAgY29uc3QgZGF0YWJhc2UgPSBuZXcgcmRzLkRhdGFiYXNlSW5zdGFuY2UodGhpcywgJ0Zsb3dGaURhdGFiYXNlJywge1xuICAgICAgZW5naW5lOiByZHMuRGF0YWJhc2VJbnN0YW5jZUVuZ2luZS5wb3N0Z3Jlcyh7IHZlcnNpb246IHJkcy5Qb3N0Z3Jlc0VuZ2luZVZlcnNpb24uVkVSXzE1IH0pLFxuICAgICAgaW5zdGFuY2VUeXBlOiBlYzIuSW5zdGFuY2VUeXBlLm9mKGVjMi5JbnN0YW5jZUNsYXNzLlQ0RywgZWMyLkluc3RhbmNlU2l6ZS5NSUNSTyksXG4gICAgICB2cGMsXG4gICAgICB2cGNTdWJuZXRzOiB7XG4gICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfSVNPTEFURUQsXG4gICAgICB9LFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGRhdGFiYXNlTmFtZTogJ2Zsb3dmaScsXG4gICAgfSk7XG5cbiAgICAvLyBJQU0gUm9sZSBmb3IgTGFtYmRhXG4gICAgY29uc3QgbGFtYmRhUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnRmxvd0ZpTGFtYmRhUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IFMzIHJlYWQvd3JpdGUgYWNjZXNzIHRvIHRoZSBMYW1iZGEgcm9sZVxuICAgIGRvY3VtZW50c0J1Y2tldC5ncmFudFJlYWRXcml0ZShsYW1iZGFSb2xlKTtcbiAgICAvLyBHcmFudCBSRFMgRGF0YSBBUEkgYWNjZXNzIHRvIHRoZSBMYW1iZGEgcm9sZVxuICAgIGRhdGFiYXNlLmdyYW50Q29ubmVjdChsYW1iZGFSb2xlKTtcblxuICAgIGNvbnN0IG9wZW5zZWFyY2hEb21haW4gPSBuZXcgb3BlbnNlYXJjaC5Eb21haW4odGhpcywgJ0Zsb3dGaURvbWFpbicsIHtcbiAgICAgIHZlcnNpb246IG9wZW5zZWFyY2guRW5naW5lVmVyc2lvbi5PUEVOU0VBUkNIXzFfMCxcbiAgICAgIGNhcGFjaXR5OiB7XG4gICAgICAgIG1hc3Rlck5vZGVzOiAzLFxuICAgICAgICBkYXRhTm9kZXM6IDQsXG4gICAgICB9LFxuICAgICAgZWJzOiB7XG4gICAgICAgIHZvbHVtZVNpemU6IDIwLFxuICAgICAgfSxcbiAgICAgIHpvbmVBd2FyZW5lc3M6IHtcbiAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZUNvdW50OiAyLFxuICAgICAgfSxcbiAgICAgIGxvZ2dpbmc6IHtcbiAgICAgICAgc2xvd1NlYXJjaExvZ0VuYWJsZWQ6IHRydWUsXG4gICAgICAgIGFwcExvZ0VuYWJsZWQ6IHRydWUsXG4gICAgICAgIHNsb3dJbmRleExvZ0VuYWJsZWQ6IHRydWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgb3BlbnNlYXJjaERvbWFpbi5ncmFudFdyaXRlKGxhbWJkYVJvbGUpO1xuXG4gICAgLy8gU05TIFRvcGljIGZvciBub3RpZmljYXRpb25zXG4gICAgY29uc3QgZG9jdW1lbnRQcm9jZXNzaW5nVG9waWMgPSBuZXcgc25zLlRvcGljKHRoaXMsICdEb2N1bWVudFByb2Nlc3NpbmdUb3BpYycpO1xuXG4gICAgLy8gTGFtYmRhIEZ1bmN0aW9uIGZvciBTMyBldmVudCBwcm9jZXNzaW5nXG4gICAgY29uc3QgZG9jdW1lbnRQcm9jZXNzb3JMYW1iZGEgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdEb2N1bWVudFByb2Nlc3NvckxhbWJkYScsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9sYW1iZGEvZG9jdW1lbnQtcHJvY2Vzc29yJykpLFxuICAgICAgcm9sZTogbGFtYmRhUm9sZSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIERBVEFCQVNFX1NFQ1JFVF9BUk46IGRhdGFiYXNlLnNlY3JldD8uc2VjcmV0QXJuIHx8ICcnLFxuICAgICAgICBTTlNfVE9QSUNfQVJOOiBkb2N1bWVudFByb2Nlc3NpbmdUb3BpYy50b3BpY0FybixcbiAgICAgICAgT1BFTlNFQVJDSF9FTkRQT0lOVDogb3BlbnNlYXJjaERvbWFpbi5kb21haW5FbmRwb2ludCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBMYW1iZGEgRnVuY3Rpb24gZm9yIHByZXNpZ25lZCBVUkwgZ2VuZXJhdGlvblxuICAgIGNvbnN0IHByZXNpZ25lZFVybExhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ1ByZXNpZ25lZFVybExhbWJkYScsIHtcbiAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9sYW1iZGEvczMtcHJlc2lnbmVkLXVybC1nZW5lcmF0b3InKSksXG4gICAgICAgIHJvbGU6IGxhbWJkYVJvbGUsXG4gICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICBCVUNLRVRfTkFNRTogZG9jdW1lbnRzQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBzZWFyY2hTZXJ2aWNlTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnU2VhcmNoU2VydmljZUxhbWJkYScsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi9sYW1iZGEvc2VhcmNoLXNlcnZpY2UnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIE9QRU5TRUFSQ0hfRU5EUE9JTlQ6IG9wZW5zZWFyY2hEb21haW4uZG9tYWluRW5kcG9pbnQsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgb3BlbnNlYXJjaERvbWFpbi5ncmFudFJlYWQoc2VhcmNoU2VydmljZUxhbWJkYSk7XG5cbiAgICAvLyBBUEkgR2F0ZXdheVxuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ0Zsb3dGaUFwaScsIHtcbiAgICAgICAgcmVzdEFwaU5hbWU6ICdGbG93RmkgU2VydmljZScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhpcyBzZXJ2aWNlIHNlcnZlcyBGbG93RmkuJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IHByZXNpZ25lZFVybEludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocHJlc2lnbmVkVXJsTGFtYmRhKTtcbiAgICBjb25zdCBwcmVzaWduZWRVcmxSZXNvdXJjZSA9IGFwaS5yb290LmFkZFJlc291cmNlKCdwcmVzaWduZWQtdXJsJyk7XG4gICAgcHJlc2lnbmVkVXJsUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBwcmVzaWduZWRVcmxJbnRlZ3JhdGlvbik7XG5cbiAgICAgIGNvbnN0IHNlYXJjaFJlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3NlYXJjaCcpO1xuICAgICAgc2VhcmNoUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oc2VhcmNoU2VydmljZUxhbWJkYSkpO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBBbGFybXNcbiAgICBuZXcgY2xvdWR3YXRjaC5BbGFybSh0aGlzLCAnSGlnaEVycm9yUmF0ZUFsYXJtJywge1xuICAgICAgbWV0cmljOiBkb2N1bWVudFByb2Nlc3NvckxhbWJkYS5tZXRyaWNFcnJvcnMoKSxcbiAgICAgICAgdGhyZXNob2xkOiAxLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0FsYXJtIGlmIHRoZSBEb2N1bWVudCBQcm9jZXNzb3IgTGFtYmRhIGZhaWxzJyxcbiAgICB9KTtcblxuICAgIC8vIENmbk91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRG9jdW1lbnRzQnVja2V0TmFtZScsIHtcbiAgICAgICAgdmFsdWU6IGRvY3VtZW50c0J1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RoZSBuYW1lIG9mIHRoZSBTMyBidWNrZXQgZm9yIGRvY3VtZW50cycsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpVXJsJywge1xuICAgICAgICB2YWx1ZTogYXBpLnVybCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgVVJMIG9mIHRoZSBBUEkgR2F0ZXdheScsXG4gICAgfSk7XG4gIH1cbn0iXX0=