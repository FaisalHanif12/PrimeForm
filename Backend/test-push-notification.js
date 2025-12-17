/**
 * Test Script for Push Notifications
 * 
 * This script tests the push notification endpoint to verify:
 * 1. Push notifications are working
 * 2. Pure Body branding is configured correctly
 * 3. Notification data is properly formatted
 * 
 * Usage:
 * 1. Make sure your server is running
 * 2. Get your JWT token from login
 * 3. Update USER_ID and JWT_TOKEN below
 * 4. Run: node test-push-notification.js
 */

const axios = require('axios');

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Get this from login
const USER_ID = 'YOUR_USER_ID_HERE'; // Optional: Will use token's user if not provided

// ============================================
// TEST FUNCTIONS
// ============================================

async function testPushNotification() {
  console.log('🧪 Testing Push Notification API...\n');
  console.log('='.repeat(60));
  
  try {
    // Test the push notification endpoint
    console.log('📱 Sending test push notification...');
    console.log(`📍 Endpoint: ${API_BASE_URL}/api/reminders/test`);
    
    const response = await axios.post(
      `${API_BASE_URL}/api/reminders/test`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ SUCCESS! Push notification sent successfully!\n');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 VERIFICATION CHECKLIST:');
    console.log('='.repeat(60));
    console.log('✅ API endpoint responded successfully');
    console.log('✅ Push notification was sent to Expo');
    console.log('✅ User has push token registered');
    console.log('\n📱 NEXT STEPS:');
    console.log('1. Check your mobile device');
    console.log('2. You should see: "Pure Body - Test Notification 🎉"');
    console.log('3. Verify the notification has:');
    console.log('   - Pure Body app icon');
    console.log('   - Color: #6366F1 (indigo)');
    console.log('   - Correct title and message');
    console.log('4. Tap the notification - app should open');
    console.log('='.repeat(60));
    
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error('\n❌ ERROR: Push notification test failed!\n');
    
    if (error.response) {
      // Server responded with error status
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('\n💡 SOLUTION: Invalid or expired JWT token. Please login again to get a new token.');
      } else if (error.response.status === 400) {
        console.error('\n💡 SOLUTION: No push token found. Make sure:');
        console.error('   1. App is installed on a physical device (not Expo Go)');
        console.error('   2. Push notifications are enabled in device settings');
        console.error('   3. User has logged in and push token was registered');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response from server. Is your server running?');
      console.error('Server URL:', API_BASE_URL);
    } else {
      // Error setting up request
      console.error('Error:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    return { success: false, error: error.message };
  }
}

async function testIndividualReminders() {
  console.log('\n🧪 Testing Individual Reminder Types...\n');
  
  const reminderTypes = [
    { name: 'Diet', endpoint: `/api/reminders/diet/${USER_ID}` },
    { name: 'Workout', endpoint: `/api/reminders/workout/${USER_ID}` },
    { name: 'Gym', endpoint: `/api/reminders/gym/${USER_ID}` },
    { name: 'Streak', endpoint: `/api/reminders/streak/${USER_ID}` }
  ];
  
  for (const reminder of reminderTypes) {
    try {
      console.log(`Testing ${reminder.name} reminder...`);
      const response = await axios.post(
        `${API_BASE_URL}${reminder.endpoint}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${JWT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        console.log(`✅ ${reminder.name} reminder sent successfully`);
      } else {
        console.log(`⚠️  ${reminder.name} reminder: ${response.data.message}`);
      }
    } catch (error) {
      console.log(`❌ ${reminder.name} reminder failed:`, error.response?.data?.message || error.message);
    }
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('\n🚀 Pure Body Push Notification Test Script\n');
  
  // Validate configuration
  if (JWT_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.error('❌ ERROR: Please update JWT_TOKEN in the script');
    console.error('   Get your token by logging in to the app or via API');
    process.exit(1);
  }
  
  // Test main push notification
  const result = await testPushNotification();
  
  // If main test succeeded and USER_ID is provided, test individual reminders
  if (result.success && USER_ID !== 'YOUR_USER_ID_HERE') {
    await testIndividualReminders();
  }
  
  console.log('\n✨ Test completed!\n');
}

// Run the test
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

