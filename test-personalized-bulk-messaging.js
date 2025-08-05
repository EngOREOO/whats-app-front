/**
 * Test script for personalized bulk messaging functionality
 * 
 * This script demonstrates how to use the new personalized bulk messaging API
 * with dynamic placeholders and CSV/JSON data input
 * Make sure your WhatsApp API server is running on http://localhost:3001
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testPersonalizedBulkMessaging() {
  try {
    console.log('🚀 Testing Personalized Bulk Messaging API...\n');

    // Step 1: Create a session
    console.log('1. Creating WhatsApp session...');
    const sessionResponse = await axios.post(`${API_BASE}/sessions`, {
      sessionId: 'test-personalized-bulk-session'
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

    // Step 2: Send personalized bulk messages
    console.log('\n2. Starting personalized bulk message job...');
    
    const personalizedRequest = {
      message: "Hello {{Name}}, your code is {{Code}}. You are in group {{Group Name}} and your student number is {{Student Number}}. Your password is {{Password}}.",
      data: [
        {
          "Phone": "+201122267427",
          "Name": "Ahmed Kabary",
          "Student Number": "11",
          "Group Name": "السبت 8",
          "Code": "3256888",
          "Password": "12345"
        },
        {
          "Phone": "+201061370451",
          "Name": "Sarah Johnson",
          "Student Number": "12",
          "Group Name": "الأحد 9",
          "Code": "3256889",
          "Password": "67890"
        },
        {
          "Phone": "+201234567890",
          "Name": "Mohammed Ali",
          "Student Number": "13",
          "Group Name": "الاثنين 10",
          "Code": "3256890",
          "Password": "11111"
        }
      ],
      delayRange: {
        min: 2,
        max: 9
      }
    };

    console.log('📝 Message template:', personalizedRequest.message);
    console.log('📊 Data to be processed:');
    personalizedRequest.data.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.Name} (${item.Phone}) - Code: ${item.Code}`);
    });

    const bulkResponse = await axios.post(`${API_BASE}/sessions/${sessionId}/send-personalized-bulk-text`, personalizedRequest);

    const jobId = bulkResponse.data.data.jobId;
    console.log(`✅ Personalized bulk job started: ${jobId}`);
    console.log(`📊 Total recipients: ${bulkResponse.data.data.totalNumbers}`);
    console.log(`⏱️  Estimated duration: ${bulkResponse.data.data.estimatedDuration} seconds`);

    // Step 3: Monitor job progress
    console.log('\n3. Monitoring personalized job progress...');
    let jobStatus = 'pending';
    while (jobStatus !== 'completed' && jobStatus !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const statusResponse = await axios.get(`${API_BASE}/bulk-jobs/${jobId}`);
      const job = statusResponse.data.data;
      jobStatus = job.status;
      
      console.log(`📈 Progress: ${job.progress.sent}/${job.progress.total} sent, ${job.progress.failed} failed (${job.progress.percentage}%)`);
      
      if (jobStatus === 'completed') {
        console.log('✅ Personalized bulk job completed!');
        console.log(`📊 Final results: ${job.progress.sent} sent, ${job.progress.failed} failed`);
        
        // Show detailed results with personalized messages
        console.log('\n📋 Detailed results with personalized messages:');
        job.results.forEach((result, index) => {
          const status = result.success ? '✅' : '❌';
          console.log(`${index + 1}. ${status} ${result.number}:`);
          console.log(`   📝 Message: ${result.personalizedMessage}`);
          if (!result.success) {
            console.log(`   ❌ Error: ${result.error}`);
          }
          console.log('');
        });
      }
    }

    // Step 4: Test error handling with missing placeholder
    console.log('\n4. Testing error handling with missing placeholder...');
    try {
      const invalidRequest = {
        message: "Hello {{Name}}, your code is {{Code}} and your age is {{Age}}.",
        data: [
          {
            "Phone": "+201122267427",
            "Name": "Ahmed Kabary",
            "Code": "3256888"
            // Missing Age placeholder
          }
        ]
      };

      const errorResponse = await axios.post(`${API_BASE}/sessions/${sessionId}/send-personalized-bulk-text`, invalidRequest);
      console.log('❌ Expected error but got success:', errorResponse.data);
    } catch (error) {
      console.log('✅ Error handling works correctly:');
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    // Step 5: Test error handling with missing Phone field
    console.log('\n5. Testing error handling with missing Phone field...');
    try {
      const invalidRequest2 = {
        message: "Hello {{Name}}, your code is {{Code}}.",
        data: [
          {
            "Name": "Ahmed Kabary",
            "Code": "3256888"
            // Missing Phone field
          }
        ]
      };

      const errorResponse2 = await axios.post(`${API_BASE}/sessions/${sessionId}/send-personalized-bulk-text`, invalidRequest2);
      console.log('❌ Expected error but got success:', errorResponse2.data);
    } catch (error) {
      console.log('✅ Error handling works correctly:');
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    // Step 6: List all bulk jobs
    console.log('\n6. Listing all bulk jobs...');
    const allJobsResponse = await axios.get(`${API_BASE}/bulk-jobs`);
    console.log(`📋 Total jobs: ${allJobsResponse.data.data.length}`);
    allJobsResponse.data.data.forEach(job => {
      console.log(`- ${job.jobId}: ${job.status} (${job.progress.sent}/${job.progress.total})`);
    });

    console.log('\n🎉 Personalized bulk messaging test completed!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('💡 Make sure your WhatsApp API server is running on http://localhost:3001');
    }
  }
}

// Run the test
testPersonalizedBulkMessaging(); 