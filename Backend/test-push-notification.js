/**
 * Simple test script to test push notification functionality
 * Run with: node test-push-notification.js
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Decodes JWT token to get user ID
 * 3. Fetches user and verifies push token (or uses manual token)
 * 4. Tests push notification via API endpoint (POST /api/reminders/test)
 * 5. Falls back to direct service call if API fails
 * 
 * HOW TO GET A TEST PUSH TOKEN (for testing before APK):
 * 
 * Option 1: Use Expo Push Notification Tool
 *   1. Go to: https://expo.dev/notifications
 *   2. Enter your Expo project ID (from app.json)
 *   3. Enter a test push token (you can generate one or use a real device token)
 *   4. Send a test notification to verify Expo service works
 * 
 * Option 2: Get token from physical device (if you have one)
 *   1. Install app on physical device (development build)
 *   2. Log in to the app
 *   3. Check app logs/console for: "Expo Push Token: ExponentPushToken[...]"
 *   4. Copy that token
 *   5. Run: MANUAL_PUSH_TOKEN="ExponentPushToken[xxxxx]" node test-push-notification.js
 * 
 * Option 3: Test with manual token
 *   MANUAL_PUSH_TOKEN="ExponentPushToken[your-token-here]" node test-push-notification.js
 * 
 * Make sure your server is running before executing this script!
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const pushNotificationService = require('./services/pushNotificationService');
const User = require('./models/User');

// JWT Token from user
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5M2RlMjk3Y2UyY2JiMDIxMTQzYjc0MCIsImlhdCI6MTc2NjA3Njk1NiwiZXhwIjoxNzY2NjgxNzU2fQ.JZ__Oov3LPujQrc3PsI8gJzTzvf0LWvNntjMy2z9dT8';

// OPTIONAL: Manual Push Token for testing (if you have one from Expo)
// You can get a test push token from: https://expo.dev/notifications
// Or from your device when the app is running
// Format: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
const MANUAL_PUSH_TOKEN = process.env.MANUAL_PUSH_TOKEN || null;

// API Base URL - adjust port if needed (default: 5000 or 5001)
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = httpModule.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            json: () => Promise.resolve(jsonData)
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            json: () => Promise.resolve({ message: data })
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testPushNotification() {
  try {
    console.log('🚀 Starting push notification test...\n');

    // Step 1: Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected\n');

    // Step 2: Decode JWT token to get user ID
    console.log('🔐 Decoding JWT token...');
    const decoded = jwt.decode(JWT_TOKEN);
    if (!decoded || !decoded.id) {
      throw new Error('Invalid JWT token - could not decode user ID');
    }
    const userId = decoded.id;
    console.log(`✅ User ID extracted: ${userId}\n`);

    // Step 3: Get user and check push token
    console.log('👤 Fetching user from database...');
    const user = await User.findById(userId).select('fullName email pushToken notificationSettings');
    
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }
    
    console.log(`✅ User found: ${user.fullName} (${user.email})`);
    
    let pushToken = user.pushToken;
    
    // If no push token in database, check if manual token provided
    if (!pushToken) {
      if (MANUAL_PUSH_TOKEN) {
        console.log('⚠️  No push token in database, but manual token provided for testing');
        pushToken = MANUAL_PUSH_TOKEN;
        
        // Optionally save it to database for this test
        console.log('💾 Saving manual push token to database for this user...');
        await User.findByIdAndUpdate(userId, { pushToken: MANUAL_PUSH_TOKEN });
        console.log('✅ Manual push token saved to database\n');
      } else {
        console.log('\n❌ ERROR: User does not have a push token registered.');
        console.log('\n💡 SOLUTIONS:');
        console.log('   1. Install the app on a physical device and log in to register push token');
        console.log('   2. Get a test push token from Expo and set it as environment variable:');
        console.log('      MANUAL_PUSH_TOKEN="ExponentPushToken[xxxxx]" node test-push-notification.js');
        console.log('   3. Get push token from Expo dashboard: https://expo.dev/notifications');
        console.log('\n📱 To get push token from device:');
        console.log('   - Open app on physical device');
        console.log('   - Check app logs for "Expo Push Token: ExponentPushToken[...]"');
        console.log('   - Copy that token and use it as MANUAL_PUSH_TOKEN\n');
        throw new Error('No push token available for testing');
      }
    } else {
      console.log(`✅ Push token found in database: ${pushToken.substring(0, 20)}...\n`);
    }

    // Step 4: Check notification settings
    const notificationSettings = user.notificationSettings || {
      pushNotifications: true,
      workoutReminders: true,
      dietReminders: true
    };
    
    console.log('🔔 Notification Settings:');
    console.log(`   - Push Notifications: ${notificationSettings.pushNotifications ? '✅ ON' : '❌ OFF'}`);
    console.log(`   - Workout Reminders: ${notificationSettings.workoutReminders ? '✅ ON' : '❌ OFF'}`);
    console.log(`   - Diet Reminders: ${notificationSettings.dietReminders ? '✅ ON' : '❌ OFF'}\n`);

    if (!notificationSettings.pushNotifications) {
      console.log('⚠️  Warning: Push notifications are disabled for this user.');
      console.log('   The notification will still be sent, but user preferences indicate they are disabled.\n');
    }

    // Step 5: Test via API endpoint (recommended way)
    console.log('📱 Testing push notification via API endpoint...');
    console.log(`🌐 API URL: ${API_BASE_URL}/reminders/test\n`);
    
    try {
      const apiResponse = await makeRequest(`${API_BASE_URL}/reminders/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`
        }
      });

      const apiResult = await apiResponse.json();
      
      console.log('📥 API Response Status:', apiResponse.status);
      console.log('📥 API Response:', JSON.stringify(apiResult, null, 2));
      
      if (apiResponse.ok && apiResult.success) {
        console.log('\n✅ SUCCESS! Push notification sent via API!');
        console.log('📋 API Response Data:', JSON.stringify(apiResult.data, null, 2));
        console.log('\n💡 Check your device to see the notification with Pure Body branding.');
      } else {
        console.log('\n❌ FAILED to send push notification via API');
        console.log('📋 Error:', apiResult.message || apiResult.error);
        console.log('\n💡 Possible reasons:');
        console.log('   - Push token might be invalid or expired');
        console.log('   - Device might not be connected to internet');
        console.log('   - Expo push notification service might be down');
        console.log('   - Server might not be running on the expected port');
        console.log('   - Check if server is running and API_BASE_URL is correct');
      }
    } catch (apiError) {
      console.log('\n❌ ERROR calling API endpoint:', apiError.message);
      console.log('💡 Make sure the server is running and accessible at:', API_BASE_URL);
      console.log('💡 You can set API_BASE_URL environment variable or modify the default in the script');
      console.log('\n🔄 Falling back to direct service call...\n');
      
      // Fallback: Direct service call
      console.log('📱 Sending test push notification directly via service...');
      const notification = {
        title: 'Pure Body - Test Notification 🧪',
        body: 'This is a test notification to verify push notification functionality with Pure Body branding!',
        data: {
          type: 'test_notification',
          actionType: 'test',
          language: 'en',
          navigateTo: 'dashboard',
          timestamp: new Date().toISOString()
        },
        badge: 1
      };

      // Use direct token send if we have a push token
      let result;
      if (pushToken) {
        console.log(`📤 Sending directly to push token: ${pushToken.substring(0, 30)}...`);
        result = await pushNotificationService.sendToToken(pushToken, notification);
      } else {
        result = await pushNotificationService.sendToUser(userId, notification);
      }

      if (result.success) {
        console.log('\n✅ SUCCESS! Push notification sent successfully (direct service)!');
        console.log('📋 Result:', JSON.stringify(result, null, 2));
        console.log('\n💡 Check your device to see the notification with Pure Body branding.');
      } else {
        console.log('\n❌ FAILED to send push notification (direct service)');
        console.log('📋 Result:', JSON.stringify(result, null, 2));
        console.log('\n💡 Possible reasons:');
        console.log('   - Push token might be invalid or expired');
        console.log('   - Device might not be connected to internet');
        console.log('   - Expo push notification service might be down');
      }
    }

    // Step 6: Close database connection
    await mongoose.connection.close();
    console.log('\n🔴 MongoDB connection closed');
    console.log('✨ Test completed!');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('📋 Error details:', error);
    
    // Close connection if open
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔴 MongoDB connection closed');
    }
    
    process.exit(1);
  }
}

// Run the test
testPushNotification();

