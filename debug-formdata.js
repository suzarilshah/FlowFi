#!/usr/bin/env node

/**
 * Debug script to test FormData creation and file upload
 */

import fs from 'fs';

// Test FormData creation and file upload
async function debugFormData() {
  console.log('🔍 Debugging FormData creation and file upload...\n');

  try {
    // Test 1: Check if test file exists
    const testFilePath = '/Users/suzarilshah/FlowFi/208113291122-20250905-333711896.pdf';
    
    if (!fs.existsSync(testFilePath)) {
      console.log('❌ Test file not found:', testFilePath);
      return;
    }

    console.log('✅ Test file found:', testFilePath);
    
    // Test 2: Create a Blob from the file
    const fileBuffer = fs.readFileSync(testFilePath);
    console.log('📄 File size:', fileBuffer.length, 'bytes');
    
    // Create a File-like object
    const file = new Blob([fileBuffer], { type: 'application/pdf' });
    file.name = 'test-document.pdf';
    
    console.log('📝 Created Blob with name:', file.name);
    console.log('📝 Blob type:', file.type);
    console.log('📝 Blob size:', file.size);

    // Test 3: Create FormData
    const formData = new FormData();
    formData.append('document', file, 'test-document.pdf');
    formData.append('modelId', 'prebuilt-invoice');
    
    console.log('\n📤 FormData created:');
    console.log('- document field: Blob with filename');
    console.log('- modelId field: prebuilt-invoice');

    // Test 4: Send to local server
    console.log('\n🚀 Sending to local server...');
    
    const response = await fetch('http://localhost:3001/document/analyze', {
      method: 'POST',
      body: formData,
    });
    
    console.log('📊 Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success! Response:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error.stack);
  }
}

// Run the debug
debugFormData();