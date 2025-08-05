/**
 * Test script for bulk messaging functionality
 * 
 * This script demonstrates how to use the new bulk messaging API
 * Make sure your WhatsApp API server is running on http://localhost:3001
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testBulkMessaging() {
  try {
    console.log('🚀 Testing Bulk Messaging API...\n');

    // Step 1: Create a session
    console.log('1. Creating WhatsApp session...');
    const sessionResponse = await axios.post(`${API_BASE}/sessions`, {
      sessionId: 'test-bulk-session'
    });
    
    const sessionId = sessionResponse.data.data.id;
    console.log(`✅ Session created: ${sessionId}`);
    console.log(`📱 Status: ${sessionResponse.data.data.status}`);
    
    if (sessionResponse.data.data.status === 'qr') {
      console.log('🔍 Please scan the QR code in your terminal to authenticate...');
      console.log('⏳ Waiting for authentication...');
      
      // Wait for authentication
      let sessionStatus = 'qr';
      while (sessionStatus === 'qr') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusResponse = await axios.get(`${API_BASE}/sessions/${sessionId}`);
        sessionStatus = statusResponse.data.data.status;
        console.log(`📱 Current status: ${sessionStatus}`);
      }
    }

    // Step 2: Send bulk messages
    console.log('\n2. Starting bulk message job...');
    const bulkResponse = await axios.post(`${API_BASE}/sessions/${sessionId}/send-bulk-text`, {
      numbers: [
        '1234567890',  // Replace with real phone numbers
        '0987654321',  // Replace with real phone numbers
        '5555555555'   // Replace with real phone numbers
      ],
      message: 'Hello from bulk messaging API! This is a test message with random delays.',
      delayRange: {
        min: 2,
        max: 9
      }
    });

    const jobId = bulkResponse.data.data.jobId;
    console.log(`✅ Bulk job started: ${jobId}`);
    console.log(`📊 Total numbers: ${bulkResponse.data.data.totalNumbers}`);
    console.log(`⏱️  Estimated duration: ${bulkResponse.data.data.estimatedDuration} seconds`);

    // Step 3: Monitor job progress
    console.log('\n3. Monitoring job progress...');
    let jobStatus = 'pending';
    while (jobStatus !== 'completed' && jobStatus !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const statusResponse = await axios.get(`${API_BASE}/bulk-jobs/${jobId}`);
      const job = statusResponse.data.data;
      jobStatus = job.status;
      
      console.log(`📈 Progress: ${job.progress.sent}/${job.progress.total} sent, ${job.progress.failed} failed (${job.progress.percentage}%)`);
      
      if (jobStatus === 'completed') {
        console.log('✅ Bulk job completed!');
        console.log(`📊 Final results: ${job.progress.sent} sent, ${job.progress.failed} failed`);
        
        // Show detailed results
        console.log('\n📋 Detailed results:');
        job.results.forEach((result, index) => {
          const status = result.success ? '✅' : '❌';
          console.log(`${index + 1}. ${status} ${result.number}: ${result.success ? 'Sent' : result.error}`);
        });
      }
    }

    // Step 4: List all bulk jobs
    console.log('\n4. Listing all bulk jobs...');
    const allJobsResponse = await axios.get(`${API_BASE}/bulk-jobs`);
    console.log(`📋 Total jobs: ${allJobsResponse.data.data.length}`);
    allJobsResponse.data.data.forEach(job => {
      console.log(`- ${job.jobId}: ${job.status} (${job.progress.sent}/${job.progress.total})`);
    });

    console.log('\n🎉 Bulk messaging test completed!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('💡 Make sure your WhatsApp API server is running on http://localhost:3001');
    }
  }
}

// Run the test
testBulkMessaging(); 