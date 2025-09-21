const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-1' }); // SES availability
const sns = new AWS.SNS();

exports.handler = async (event) => {
    console.log('Notification Service triggered:', JSON.stringify(event, null, 2));
    
    try {
        let notificationType = 'email';
        let recipient = '';
        let subject = '';
        let message = '';
        let templateData = {};
        
        // Handle different event sources
        if (event.httpMethod) {
            // API Gateway event
            const body = JSON.parse(event.body || '{}');
            notificationType = body.type || 'email';
            recipient = body.recipient || '';
            subject = body.subject || 'FlowFi Notification';
            message = body.message || '';
            templateData = body.templateData || {};
        } else if (event.Records && event.Records[0] && event.Records[0].Sns) {
            // SNS event
            const snsMessage = JSON.parse(event.Records[0].Sns.Message);
            notificationType = 'email';
            subject = event.Records[0].Sns.Subject || 'FlowFi System Notification';
            message = JSON.stringify(snsMessage, null, 2);
            
            // Extract recipient from SNS attributes or use default
            recipient = process.env.DEFAULT_EMAIL || 'admin@flowfi.com';
        } else {
            // Direct invocation
            notificationType = event.type || 'email';
            recipient = event.recipient || '';
            subject = event.subject || 'FlowFi Notification';
            message = event.message || '';
            templateData = event.templateData || {};
        }
        
        if (!recipient) {
            throw new Error('Recipient is required');
        }
        
        console.log(`Sending ${notificationType} notification to: ${recipient}`);
        
        let result = {};
        
        if (notificationType === 'email') {
            // Email notification using SES
            const emailParams = {
                Source: process.env.FROM_EMAIL || 'noreply@flowfi.com',
                Destination: {
                    ToAddresses: [recipient]
                },
                Message: {
                    Subject: {
                        Data: subject,
                        Charset: 'UTF-8'
                    },
                    Body: {
                        Html: {
                            Data: generateEmailTemplate(subject, message, templateData),
                            Charset: 'UTF-8'
                        },
                        Text: {
                            Data: message,
                            Charset: 'UTF-8'
                        }
                    }
                }
            };
            
            result = await ses.sendEmail(emailParams).promise();
            
        } else if (notificationType === 'sms') {
            // SMS notification using SNS
            const smsParams = {
                PhoneNumber: recipient,
                Message: `${subject}: ${message}`.substring(0, 160) // SMS character limit
            };
            
            result = await sns.publish(smsParams).promise();
            
        } else {
            throw new Error(`Unsupported notification type: ${notificationType}`);
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: `${notificationType} notification sent successfully`,
                data: {
                    messageId: result.MessageId,
                    recipient,
                    type: notificationType,
                    sentAt: new Date().toISOString()
                }
            })
        };
        
    } catch (error) {
        console.error('Error sending notification:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                message: 'Error sending notification',
                error: error.message
            })
        };
    }
};

function generateEmailTemplate(subject, message, templateData) {
    const { documentName, category, amount, processedAt } = templateData;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${subject}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
            .highlight { background-color: #e8f5e8; padding: 10px; border-left: 4px solid #4CAF50; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>FlowFi Notification</h1>
            </div>
            <div class="content">
                <h2>${subject}</h2>
                <p>${message}</p>
                
                ${documentName ? `
                <div class="highlight">
                    <h3>Document Details:</h3>
                    <ul>
                        <li><strong>Document:</strong> ${documentName}</li>
                        ${category ? `<li><strong>Category:</strong> ${category}</li>` : ''}
                        ${amount ? `<li><strong>Amount:</strong> $${amount}</li>` : ''}
                        ${processedAt ? `<li><strong>Processed:</strong> ${new Date(processedAt).toLocaleString()}</li>` : ''}
                    </ul>
                </div>
                ` : ''}
                
                <p>This is an automated notification from your FlowFi accounting system.</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 FlowFi. All rights reserved.</p>
                <p>If you have any questions, please contact support.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}