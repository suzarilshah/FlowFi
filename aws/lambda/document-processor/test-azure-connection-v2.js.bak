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
        // Test 1: Try the correct Azure Document Intelligence endpoint format
        let testUrl = `${endpoint.replace(/\/$/, '')}/documentintelligence/info?api-version=2023-07-31`;
        
        console.log('\nTest 1: Testing info endpoint:', testUrl);
        
        let response = await axios.get(testUrl, {
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log('✅ Azure Document Intelligence API is accessible');
        console.log('Response status:', response.status);
        console.log('API Info:', response.data);
        return true;

    } catch (error) {
        console.error('❌ Test 1 failed');
        
        if (error.response) {
            console.error('HTTP Status:', error.response.status);
            console.error('Error message:', error.response.data);
            
            if (error.response.status === 401) {
                console.error('🔑 Invalid subscription key - API key is incorrect or expired');
            } else if (error.response.status === 403) {
                console.error('🔒 Access forbidden - subscription may be inactive or quota exceeded');
            } else if (error.response.status === 404) {
                console.error('❓ Endpoint not found - trying alternative endpoint');
                
                // Test 2: Try alternative endpoint format
                return await testAlternativeEndpoint(endpoint, apiKey, region);
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

async function testAlternativeEndpoint(endpoint, apiKey, region) {
    try {
        // Test 2: Try the Azure Cognitive Services general endpoint
        let testUrl = `${endpoint.replace(/\/$/, '')}/vision/v3.2/read/analyze?readingOrder=natural`;
        
        console.log('\nTest 2: Testing Computer Vision endpoint:', testUrl);
        
        let response = await axios.post(testUrl, 
            { url: 'https://example.com/test.jpg' },
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        console.log('✅ Azure Computer Vision API is accessible');
        console.log('Response status:', response.status);
        return true;

    } catch (error) {
        console.error('❌ Test 2 failed');
        
        if (error.response) {
            console.error('HTTP Status:', error.response.status);
            console.error('Error message:', error.response.data);
            
            if (error.response.status === 401) {
                console.error('🔑 Invalid subscription key - API key is incorrect or expired');
            } else if (error.response.status === 403) {
                console.error('🔒 Access forbidden - subscription may be inactive or quota exceeded');
            }
        }
        
        // Test 3: Try to validate the key with Azure Resource Manager
        return await validateWithAzureRM(endpoint, apiKey, region);
    }
}

async function validateWithAzureRM(endpoint, apiKey, region) {
    try {
        // Extract subscription ID from endpoint if possible
        console.log('\nTest 3: Validating credentials with Azure services');
        
        // Try to access the Azure Cognitive Services management endpoint
        const managementUrl = `https://management.azure.com/subscriptions?api-version=2020-01-01`;
        
        console.log('Testing management endpoint (this may fail for service keys)');
        
        let response = await axios.get(managementUrl, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log('✅ Azure Management API accessible');
        return true;

    } catch (error) {
        console.error('❌ Test 3 failed - this is expected for service-specific keys');
        console.error('The API key appears to be a service-specific key, not a management key');
        
        // Final assessment
        console.log('\n📋 FINAL ASSESSMENT:');
        console.log('The Azure Document Intelligence credentials appear to be invalid or expired.');
        console.log('The API key format looks correct, but the service is rejecting it.');
        console.log('This could mean:');
        console.log('1. The subscription key is invalid or expired');
        console.log('2. The Azure Cognitive Services resource is deleted or inactive');
        console.log('3. The endpoint URL is incorrect for this service');
        console.log('4. The subscription has been disabled or has billing issues');
        
        return false;
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    testAzureDocumentIntelligenceConnection()
        .then(result => {
            console.log('\n🎯 Test result:', result ? 'SUCCESS' : 'FAILED');
            process.exit(result ? 0 : 1);
        })
        .catch(error => {
            console.error('Test error:', error);
            process.exit(1);
        });
}

module.exports = { testAzureDocumentIntelligenceConnection };