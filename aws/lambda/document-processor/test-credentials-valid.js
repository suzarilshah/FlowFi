const axios = require('axios');

async function testCredentialsValidity() {
  const endpoint = 'https://flowfis.cognitiveservices.azure.com/';
  const apiKey = 'process.env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY';
  
  console.log('Testing Azure Document Intelligence credentials validity...');
  console.log('Endpoint:', endpoint);
  console.log('API Key:', apiKey.substring(0, 8) + '...');
  
  try {
    // Test 1: Try to get model information (this should work with valid credentials)
    console.log('\n=== Test 1: Get Document Models ===');
    
    const response = await axios({
      method: 'GET',
      url: `${endpoint}/formrecognizer/documentModels?api-version=2023-07-31`,
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ SUCCESS! Credentials are valid!');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return true;
    
  } catch (error) {
    console.log('❌ Credentials test failed');
    console.log('Error status:', error.response?.status, error.response?.statusText);
    console.log('Error details:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('\n🔍 Authentication Error: Invalid API Key');
      console.log('The API key is invalid, expired, or incorrect.');
    } else if (error.response?.status === 403) {
      console.log('\n🔍 Authorization Error: Insufficient Permissions');
      console.log('The API key is valid but lacks permissions for this operation.');
    } else if (error.response?.status === 404) {
      console.log('\n🔍 Resource Not Found');
      console.log('The Document Intelligence resource may not exist at this endpoint.');
    } else if (error.response?.status === 429) {
      console.log('\n🔍 Rate Limit Exceeded');
      console.log('Too many requests. The credentials are valid but rate limited.');
    }
    
    return false;
  }
}

// Run the test
testCredentialsValidity().then(isValid => {
  console.log('\n=== FINAL RESULT ===');
  if (isValid) {
    console.log('✅ The Azure Document Intelligence credentials are VALID and working!');
  } else {
    console.log('❌ The Azure Document Intelligence credentials are INVALID or not working!');
  }
}).catch(console.error);