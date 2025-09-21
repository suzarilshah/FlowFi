import AWS from 'aws-sdk';
import { s3Config } from '../config/aws-config';

class S3UploadService {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      region: s3Config.region,
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    });
  }

  async uploadFile(file: File, userId: string): Promise<string> {
    const fileKey = `uploads/${userId}/${new Date().toISOString()}-${file.name}`;

    const params = {
      Bucket: s3Config.documentsBucket,
      Key: fileKey,
      Body: file,
      ContentType: file.type,
      Metadata: {
        'owner-user-id': userId,
      },
      ACL: 'private',
    };

    try {
      const data = await this.s3.upload(params).promise();
      return data.Location;
    } catch (error) {
      throw new Error('Failed to upload file to S3.');
    }
  }
}

export const s3UploadService = new S3UploadService();