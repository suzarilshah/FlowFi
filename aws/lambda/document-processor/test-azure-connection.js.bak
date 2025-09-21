const axios = require('axios');

async function testAzureDocumentIntelligenceConnection() {
    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY;
    const region = process.env.AZURE_DOCUMENT_INTELLIGENCE_REGION;

    console.log('Testing Azure Document Intelligence Connection...');
    console.log('Endpoint:', endpoint);
    console.log('Region:', region);
    console.log('API Key:', apiKey ? 'Present (hidden)' : 'Missing');

    if (!endpoint || !apiKey) {
        console.error('❌ Missing Azure credentials');
        return false;
    }

    try {
        // Test the Azure Document Intelligence API endpoint
        const testUrl = `${endpoint}documentintelligence/documentModels/prebuilt-invoice?api-version=2023-07-31`;
        
        console.log('Testing endpoint:', testUrl);
        
        const response = await axios.get(testUrl, {
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log('✅ Azure Document Intelligence API is accessible');
        console.log('Response status:', response.status);
        console.log('Model info:', response.data);
        return true;

    } catch (error) {
        console.error('❌ Azure Document Intelligence API test failed');
        
        if (error.response) {
            console.error('HTTP Status:', error.response.status);
            console.error('Error message:', error.response.data);
            
            if (error.response.status === 401) {
                console.error('🔑 Invalid subscription key - API key is incorrect or expired');
            } else if (error.response.status === 403) {
                console.error('🔒 Access forbidden - subscription may be inactive or quota exceeded');
            } else if (error.response.status === 404) {
                console.error('❓ Endpoint not found - check the API endpoint URL');
            }
        } else if (error.code === 'ENOTFOUND') {
            console.error('🌐 Network error - cannot reach Azure endpoint');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('🔌 Connection refused - endpoint may be incorrect');
        } else {
            console.error('General error:', error.message);
        }
        
        return false;
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    testAzureDocumentIntelligenceConnection()
        .then(result => {
            console.log('Test result:', result ? 'SUCCESS' : 'FAILED');
            process.exit(result ? 0 : 1);
        })
        .catch(error => {
            console.error('Test error:', error);
            process.exit(1);
        });
}

module.exports = { testAzureDocumentIntelligenceConnection };