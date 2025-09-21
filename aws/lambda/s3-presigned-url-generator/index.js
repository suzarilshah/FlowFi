const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const crypto = require('crypto');

const BUCKET_NAME = process.env.BUCKET_NAME || 'flowfi-documents-dev';

exports.handler = async (event) => {
    console.log('[INFO] Received event for presigned URL generation:', JSON.stringify(event, null, 2));

    try {
        const { fileName, fileType } = JSON.parse(event.body);

        if (!fileName || !fileType) {
            throw new Error('Missing required parameters: fileName and fileType');
        }

        const documentId = crypto.randomBytes(16).toString('hex');
        const s3Key = `uploads/${documentId}/${fileName}`;

        const params = {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            ContentType: fileType,
            Expires: 300 // 5 minutes
        };

        console.log(`[INFO] Generating presigned URL for: s3://${BUCKET_NAME}/${s3Key}`);
        const presignedUrl = await s3.getSignedUrlPromise('putObject', params);
        console.log(`[SUCCESS] Generated presigned URL.`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: 'Presigned URL generated successfully',
                data: {
                    presignedUrl,
                    s3Key,
                    documentId
                }
            })
        };

    } catch (error) {
        console.error('[FATAL] Error generating presigned URL:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                message: 'Error generating presigned URL',
                error: error.message
            })
        };
    }
};