import AWS from 'aws-sdk';
import {
  s3Config,
  rdsConfig,
  cognitoConfig,
  lambdaConfig,
  aiServicesConfig,
  notificationConfig,
  cloudWatchConfig,
} from '../config/aws-config';

// S3 Service Client
export class S3Service {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({ region: s3Config.region });
  }

  async uploadDocument(file: File, key: string): Promise<string> {
    const params = {
      Bucket: s3Config.documentsBucket,
      Key: key,
      Body: file,
      ContentType: file.type,
    };

    const result = await this.s3.upload(params).promise();
    return result.Location;
  }

  async downloadDocument(key: string): Promise<AWS.S3.GetObjectOutput> {
    const params = {
      Bucket: s3Config.documentsBucket,
      Key: key,
    };

    return await this.s3.getObject(params).promise();
  }

  async deleteDocument(key: string): Promise<void> {
    const params = {
      Bucket: s3Config.documentsBucket,
      Key: key,
    };

    await this.s3.deleteObject(params).promise();
  }

  async listDocuments(prefix?: string): Promise<AWS.S3.Object[]> {
    const params = {
      Bucket: s3Config.documentsBucket,
      Prefix: prefix,
    };

    const result = await this.s3.listObjectsV2(params).promise();
    return result.Contents || [];
  }
}

// Cognito Service Client
export class CognitoService {
  private cognitoIdentityServiceProvider: AWS.CognitoIdentityServiceProvider;
  private cognitoIdentity: AWS.CognitoIdentity;

  constructor() {
    this.cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
      region: cognitoConfig.region,
    });
    this.cognitoIdentity = new AWS.CognitoIdentity({
      region: cognitoConfig.region,
    });
  }

  async signUp(username: string, password: string, email: string): Promise<any> {
    const params = {
      ClientId: cognitoConfig.clientId!,
      Username: username,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
      ],
    };

    return await this.cognitoIdentityServiceProvider.signUp(params).promise();
  }

  async confirmSignUp(username: string, confirmationCode: string): Promise<any> {
    const params = {
      ClientId: cognitoConfig.clientId!,
      Username: username,
      ConfirmationCode: confirmationCode,
    };

    return await this.cognitoIdentityServiceProvider.confirmSignUp(params).promise();
  }

  async signIn(username: string, password: string): Promise<any> {
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: cognitoConfig.clientId!,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    };

    return await this.cognitoIdentityServiceProvider.initiateAuth(params).promise();
  }
}

// Lambda Service Client
export class LambdaService {
  private lambda: AWS.Lambda;

  constructor() {
    this.lambda = new AWS.Lambda({ region: lambdaConfig.region });
  }

  async invokeDocumentProcessor(payload: any): Promise<any> {
    const params = {
      FunctionName: lambdaConfig.documentProcessor,
      Payload: JSON.stringify(payload),
    };

    const result = await this.lambda.invoke(params).promise();
    return JSON.parse(result.Payload as string);
  }

  async invokeAICategorizer(payload: any): Promise<any> {
    const params = {
      FunctionName: lambdaConfig.aiCategorizer,
      Payload: JSON.stringify(payload),
    };

    const result = await this.lambda.invoke(params).promise();
    return JSON.parse(result.Payload as string);
  }

  async invokeReportGenerator(payload: any): Promise<any> {
    const params = {
      FunctionName: lambdaConfig.reportGenerator,
      Payload: JSON.stringify(payload),
    };

    const result = await this.lambda.invoke(params).promise();
    return JSON.parse(result.Payload as string);
  }

  async invokeNotificationService(payload: any): Promise<any> {
    const params = {
      FunctionName: lambdaConfig.notificationService,
      Payload: JSON.stringify(payload),
    };

    const result = await this.lambda.invoke(params).promise();
    return JSON.parse(result.Payload as string);
  }
}

// Textract Service Client
export class TextractService {
  private textract: AWS.Textract;

  constructor() {
    this.textract = new AWS.Textract({ region: aiServicesConfig.textract.region });
  }

  async analyzeDocument(s3Object: { bucket: string; name: string }): Promise<any> {
    const params = {
      Document: {
        S3Object: {
          Bucket: s3Object.bucket,
          Name: s3Object.name,
        },
      },
      FeatureTypes: ['TABLES', 'FORMS'],
    };

    return await this.textract.analyzeDocument(params).promise();
  }

  async detectDocumentText(s3Object: { bucket: string; name: string }): Promise<any> {
    const params = {
      Document: {
        S3Object: {
          Bucket: s3Object.bucket,
          Name: s3Object.name,
        },
      },
    };

    return await this.textract.detectDocumentText(params).promise();
  }
}

// SES Service Client
export class SESService {
  private ses: AWS.SES;

  constructor() {
    this.ses = new AWS.SES({ region: notificationConfig.ses.region });
  }

  async sendEmail(to: string, subject: string, body: string): Promise<any> {
    const params = {
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Body: {
          Html: {
            Data: body,
          },
        },
        Subject: {
          Data: subject,
        },
      },
      Source: notificationConfig.ses.fromEmail,
    };

    return await this.ses.sendEmail(params).promise();
  }
}

// CloudWatch Service Client
export class CloudWatchService {
  private cloudWatchLogs: AWS.CloudWatchLogs;

  constructor() {
    this.cloudWatchLogs = new AWS.CloudWatchLogs({ region: cloudWatchConfig.region });
  }

  async createLogStream(logStreamName: string): Promise<void> {
    const params = {
      logGroupName: cloudWatchConfig.logGroup,
      logStreamName: logStreamName,
    };

    await this.cloudWatchLogs.createLogStream(params).promise();
  }

  async putLogEvents(logStreamName: string, events: any[]): Promise<void> {
    const params = {
      logGroupName: cloudWatchConfig.logGroup,
      logStreamName: logStreamName,
      logEvents: events,
    };

    await this.cloudWatchLogs.putLogEvents(params).promise();
  }
}

// Export service instances
export const s3Service = new S3Service();
export const cognitoService = new CognitoService();
export const lambdaService = new LambdaService();
export const textractService = new TextractService();
export const sesService = new SESService();
export const cloudWatchService = new CloudWatchService();