const axios = require('axios');

async function testAzureCredentials() {
  const endpoint = 'https://flowfis.cognitiveservices.azure.com/';
  const apiKey = 'process.env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY';
  
  console.log('Testing Azure Document Intelligence credentials...');
  console.log('Endpoint:', endpoint);
  console.log('API Key:', apiKey.substring(0, 8) + '...');
  
  try {
    // Test 1: Verify endpoint accessibility
    console.log('\n=== Test 1: Document Intelligence Endpoint ===');
    const docIntelResponse = await axios({
      method: 'GET',
      url: `${endpoint}/formrecognizer/v2.1/layout/analyzeResults/123`,
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Document Intelligence endpoint accessible');
    console.log('Status:', docIntelResponse.status);
    
  } catch (error) {
    console.log('❌ Document Intelligence test failed');
    console.log('Error:', error.response?.status, error.response?.statusText);
    console.log('Error details:', error.response?.data);
  }
  
  try {
    // Test 2: Try Computer Vision endpoint (alternative)
    console.log('\n=== Test 2: Computer Vision Endpoint ===');
    const visionResponse = await axios({
      method: 'GET',
      url: `${endpoint}/vision/v3.2/analyze?visualFeatures=Categories`,
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Computer Vision endpoint accessible');
    console.log('Status:', visionResponse.status);
    
  } catch (error) {
    console.log('❌ Computer Vision test failed');
    console.log('Error:', error.response?.status, error.response?.statusText);
    console.log('Error details:', error.response?.data);
  }
  
  try {
    // Test 3: Try to get resource info
    console.log('\n=== Test 3: Azure Resource Manager ===');
    const resourceResponse = await axios({
      method: 'GET',
      url: 'https://management.azure.com/subscriptions?api-version=2020-01-01',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Azure Resource Manager accessible');
    console.log('Status:', resourceResponse.status);
    
  } catch (error) {
    console.log('❌ Azure Resource Manager test failed');
    console.log('Error:', error.response?.status, error.response?.statusText);
    console.log('Error details:', error.response?.data);
  }
  
  console.log('\n=== Final Assessment ===');
  console.log('The provided credentials need to be tested with actual document processing.');
  console.log('If all tests fail, the credentials are likely invalid.');
}

testAzureCredentials().catch(console.error);