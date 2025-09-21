const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const bedrock = new AWS.BedrockRuntime({ region: 'us-east-1' }); // Bedrock availability
const comprehend = new AWS.Comprehend();

exports.handler = async (event) => {
    console.log('AI Categorizer triggered:', JSON.stringify(event, null, 2));
    
    try {
        let documentText = '';
        let documentKey = '';
        
        // Handle different event sources
        if (event.httpMethod) {
            // API Gateway event
            const body = JSON.parse(event.body || '{}');
            documentText = body.text || '';
            documentKey = body.documentKey || 'direct-input';
        } else if (event.documentKey) {
            // Direct invocation with document key
            documentKey = event.documentKey;
            
            // Fetch processed document from S3
            const processedKey = `processed/${documentKey.replace(/\.[^/.]+$/, '')}.json`;
            const s3Object = await s3.getObject({
                Bucket: process.env.DOCUMENTS_BUCKET,
                Key: processedKey
            }).promise();
            
            const processedData = JSON.parse(s3Object.Body.toString());
            documentText = processedData.text || '';
        } else {
            throw new Error('Invalid event format');
        }
        
        if (!documentText) {
            throw new Error('No text content found for categorization');
        }
        
        console.log(`Categorizing document: ${documentKey}`);
        
        // Use Amazon Comprehend for entity detection and sentiment
        const comprehendPromises = [
            comprehend.detectEntities({
                Text: documentText.substring(0, 5000), // Comprehend limit
                LanguageCode: 'en'
            }).promise(),
            comprehend.detectKeyPhrases({
                Text: documentText.substring(0, 5000),
                LanguageCode: 'en'
            }).promise()
        ];
        
        const [entitiesResult, keyPhrasesResult] = await Promise.all(comprehendPromises);
        
        // Extract financial entities and amounts
        const financialEntities = entitiesResult.Entities.filter(entity => 
            entity.Type === 'QUANTITY' || 
            entity.Type === 'OTHER' && /RM|MYR|amount|total|cost|price/i.test(entity.Text)
        );
        
        const keyPhrases = keyPhrasesResult.KeyPhrases.map(phrase => phrase.Text);
        
        // Simple rule-based categorization
        const categories = {
            'Office Supplies': ['office', 'supplies', 'stationery', 'paper', 'pen', 'computer'],
            'Travel': ['travel', 'hotel', 'flight', 'taxi', 'uber', 'gas', 'mileage'],
            'Meals & Entertainment': ['restaurant', 'meal', 'lunch', 'dinner', 'coffee', 'catering'],
            'Professional Services': ['consulting', 'legal', 'accounting', 'professional', 'service'],
            'Utilities': ['electricity', 'water', 'internet', 'phone', 'utility'],
            'Marketing': ['advertising', 'marketing', 'promotion', 'social media'],
            'Equipment': ['equipment', 'machinery', 'tools', 'hardware'],
            'Software': ['software', 'license', 'subscription', 'saas', 'app'],
            'Insurance': ['insurance', 'premium', 'coverage', 'policy'],
            'Other': []
        };
        
        let bestCategory = 'Other';
        let maxScore = 0;
        
        const textLower = documentText.toLowerCase();
        
        Object.entries(categories).forEach(([category, keywords]) => {
            const score = keywords.reduce((acc, keyword) => {
                const matches = (textLower.match(new RegExp(keyword, 'g')) || []).length;
                return acc + matches;
            }, 0);
            
            if (score > maxScore) {
                maxScore = score;
                bestCategory = category;
            }
        });
        
        // Extract potential amounts
        const amountRegex = /([0-9,]+\.?[0-9]*)/g;
        const amounts = [];
        let match;
        while ((match = amountRegex.exec(documentText)) !== null) {
            const amount = parseFloat(match[1].replace(/,/g, ''));
            if (amount > 0 && amount < 1000000) { // Reasonable range
                amounts.push(amount);
            }
        }
        
        const result = {
            documentKey,
            category: bestCategory,
            confidence: maxScore > 0 ? Math.min(maxScore * 0.2, 1.0) : 0.1,
            entities: financialEntities.slice(0, 10), // Limit results
            keyPhrases: keyPhrases.slice(0, 10),
            amounts: amounts.slice(0, 5),
            suggestedAmount: amounts.length > 0 ? Math.max(...amounts) : null,
            processedAt: new Date().toISOString()
        };
        
        // Store categorization result
        if (process.env.DOCUMENTS_BUCKET && documentKey !== 'direct-input') {
            const resultKey = `categorized/${documentKey.replace(/\.[^/.]+$/, '')}.json`;
            await s3.putObject({
                Bucket: process.env.DOCUMENTS_BUCKET,
                Key: resultKey,
                Body: JSON.stringify(result, null, 2),
                ContentType: 'application/json'
            }).promise();
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: 'Document categorized successfully',
                data: result
            })
        };
        
    } catch (error) {
        console.error('Error categorizing document:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                message: 'Error categorizing document',
                error: error.message
            })
        };
    }
};