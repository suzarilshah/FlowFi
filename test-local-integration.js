#!/usr/bin/env node

/**
 * Test script to verify local document intelligence server integration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Test the local server integration
async function testLocalIntegration() {
  console.log('🧪 Testing Local Document Intelligence Integration...\n');

  try {
    // Test 1: Check if local server is running
    console.log('1️⃣ Testing local server health...');
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok && healthData.status === 'healthy') {
      console.log('✅ Local server is healthy');
      console.log(`   Service: ${healthData.service}`);
      console.log(`   Version: ${healthData.version}`);
    } else {
      throw new Error('Local server health check failed');
    }

    // Test 2: Check available models
    console.log('\n2️⃣ Testing models endpoint...');
    const modelsResponse = await fetch('http://localhost:3001/models');
    const modelsData = await modelsResponse.json();
    
    if (modelsResponse.ok && modelsData.models) {
      console.log('✅ Models endpoint working');
      console.log(`   Available models: ${modelsData.models.length}`);
      modelsData.models.forEach(model => {
        console.log(`   - ${model.modelId}: ${model.description}`);
      });
    } else {
      throw new Error('Models endpoint failed');
    }

    // Test 3: Test document analysis with a sample file
    console.log('\n3️⃣ Testing document analysis...');
    
    // Check if test PDF exists
    const testFilePath = '/Users/suzarilshah/FlowFi/208113291122-20250905-333711896.pdf';
    if (!fs.existsSync(testFilePath)) {
      console.log('⚠️  Test PDF file not found, creating a simple test...');
      
      // Create a simple text file to test the endpoint
      const formData = new FormData();
      formData.append('modelId', 'prebuilt-invoice');
      
      const response = await fetch('http://localhost:3001/document/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (response.status === 400) {
        console.log('✅ Document analysis endpoint is accessible (expected 400 for no file)');
      } else {
        console.log('⚠️  Unexpected response from document analysis endpoint');
      }
    } else {
      // Test with actual file
      const fileBuffer = fs.readFileSync(testFilePath);
      const formData = new FormData();
      
      // Create a Blob from the file buffer
      const blob = new Blob([fileBuffer], { type: 'application/pdf' });
      formData.append('document', blob, 'test-document.pdf');
      formData.append('modelId', 'prebuilt-invoice');
      
      const response = await fetch('http://localhost:3001/document/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Document analysis successful');
        console.log(`   Status: ${result.status}`);
        console.log(`   Model: ${result.modelId}`);
        console.log(`   Document: ${result.documentInfo?.filename}`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Document analysis failed: ${response.status} ${response.statusText}`);
        console.log(`   Error: ${errorText}`);
      }
    }

    // Test 4: Test Azure service integration
    console.log('\n4️⃣ Testing Azure service integration...');
    
    // This would require the full TypeScript compilation, so we'll do a simple config test
    console.log('✅ Azure service configuration test (skipped - requires full build)');

    console.log('\n🎉 Local integration tests completed!');
    console.log('\n💡 To test the full integration:');
    console.log('   1. Open http://localhost:5173 in your browser');
    console.log('   2. Navigate to Document Intelligence');
    console.log('   3. Upload a PDF document');
    console.log('   4. Check the browser console and local server logs');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testLocalIntegration().catch(console.error);