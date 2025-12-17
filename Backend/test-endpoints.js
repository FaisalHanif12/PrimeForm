// Test script for Pure Body Backend API endpoints
// Run this after starting the server to test basic functionality

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Test configuration
const testUser = {
  fullName: 'Test User',
  email: 'test@primeform.com',
  password: 'TestPass123'
};

let authToken = '';

console.log('🧪 Starting Pure Body API Tests...\n');

// Helper function for API calls
const apiCall = async (method, url, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}${url}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
};

// Test functions
const testHealthCheck = async () => {
  console.log('🏥 Testing Health Check...');
  const result = await apiCall('GET', '/../health');
  if (result.success) {
    console.log('✅ Health check passed');
  } else {
    console.log('❌ Health check failed:', result.error);
  }
  console.log('');
};

const testSignup = async () => {
  console.log('📝 Testing User Signup...');
  const result = await apiCall('POST', '/auth/signup', testUser);
  
  if (result.success) {
    console.log('✅ Signup successful');
    authToken = result.data.token;
    console.log('🔑 Token received:', authToken.substring(0, 20) + '...');
  } else {
    console.log('❌ Signup failed:', result.error.message);
    
    // If user already exists, try login instead
    if (result.error.message?.includes('already exists')) {
      console.log('👤 User exists, trying login...');
      return await testLogin();
    }
  }
  console.log('');
};

const testLogin = async () => {
  console.log('🔐 Testing User Login...');
  const result = await apiCall('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (result.success) {
    console.log('✅ Login successful');
    authToken = result.data.token;
    console.log('🔑 Token received:', authToken.substring(0, 20) + '...');
  } else {
    console.log('❌ Login failed:', result.error.message);
  }
  console.log('');
};

const testGetProfile = async () => {
  if (!authToken) {
    console.log('⚠️  Skipping profile test - no auth token');
    return;
  }

  console.log('👤 Testing Get Profile...');
  const result = await apiCall('GET', '/auth/me', null, authToken);
  
  if (result.success) {
    console.log('✅ Profile retrieved successfully');
    console.log('📋 User:', result.data.data.user.fullName, '-', result.data.data.user.email);
  } else {
    console.log('❌ Profile retrieval failed:', result.error.message);
  }
  console.log('');
};

const testDashboard = async () => {
  if (!authToken) {
    console.log('⚠️  Skipping dashboard test - no auth token');
    return;
  }

  console.log('📊 Testing Dashboard...');
  const result = await apiCall('GET', '/dashboard', null, authToken);
  
  if (result.success) {
    console.log('✅ Dashboard data retrieved successfully');
    console.log('📈 Dashboard message:', result.data.message);
  } else {
    console.log('❌ Dashboard retrieval failed:', result.error.message);
  }
  console.log('');
};

const testInvalidLogin = async () => {
  console.log('🚫 Testing Invalid Login...');
  const result = await apiCall('POST', '/auth/login', {
    email: 'nonexistent@example.com',
    password: 'wrongpassword'
  });
  
  if (!result.success && result.error.message?.includes('Account not found')) {
    console.log('✅ Invalid login correctly rejected');
    console.log('📱 Show signup button:', result.error.showSignupButton || false);
  } else {
    console.log('❌ Invalid login test failed - should have been rejected');
  }
  console.log('');
};

const testForgotPassword = async () => {
  console.log('🔄 Testing Forgot Password...');
  const result = await apiCall('POST', '/auth/forgot-password', {
    email: testUser.email
  });
  
  if (result.success) {
    console.log('✅ Forgot password OTP sent successfully');
    console.log('📧 Message:', result.data.message);
  } else {
    console.log('❌ Forgot password failed:', result.error.message);
  }
  console.log('');
};

const testRateLimiting = async () => {
  console.log('⏱️  Testing Rate Limiting...');
  
  // Make multiple rapid requests to trigger rate limiting
  const promises = [];
  for (let i = 0; i < 6; i++) {
    promises.push(apiCall('POST', '/auth/login', {
      email: 'test@rate-limit.com',
      password: 'wrongpassword'
    }));
  }
  
  const results = await Promise.all(promises);
  const rateLimited = results.some(result => 
    !result.success && result.error.message?.includes('Too many')
  );
  
  if (rateLimited) {
    console.log('✅ Rate limiting is working');
  } else {
    console.log('⚠️  Rate limiting may not be active (this is okay in development)');
  }
  console.log('');
};

// Main test runner
const runAllTests = async () => {
  try {
    console.log('🏃‍♂️ Pure Body Backend API Tests');
    console.log('================================\n');

    await testHealthCheck();
    await testInvalidLogin();
    await testSignup();
    await testGetProfile();
    await testDashboard();
    await testForgotPassword();
    await testRateLimiting();

    console.log('🎉 All tests completed!');
    console.log('================================');
    console.log('💡 Tips:');
    console.log('   - Check your .env file if tests fail');
    console.log('   - Ensure MongoDB is connected');
    console.log('   - Verify email configuration for OTP tests');
    console.log('   - Check server logs for detailed errors');

  } catch (error) {
    console.error('💥 Test runner error:', error.message);
  } finally {
    process.exit(0);
  }
};

// Check if server is running before starting tests
const checkServer = async () => {
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('🚀 Server is running, starting tests...\n');
    await runAllTests();
  } catch (error) {
    console.error('❌ Server is not running or not accessible');
    console.error('💡 Please start the server first with: npm run dev');
    process.exit(1);
  }
};

// Start tests
checkServer();
