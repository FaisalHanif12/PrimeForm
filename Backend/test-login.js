/**
 * Quick Login Script to Get JWT Token
 * 
 * This script logs in and displays your JWT token
 * 
 * Usage:
 * 1. Update EMAIL and PASSWORD below
 * 2. Run: node test-login.js
 * 3. Copy the token to test-push-notification.js
 */

const axios = require('axios');

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const EMAIL = 'your-email@example.com'; // Update this
const PASSWORD = 'your-password'; // Update this

// ============================================
// LOGIN FUNCTION
// ============================================

async function loginAndGetToken() {
  console.log('🔐 Logging in to get JWT token...\n');
  console.log('='.repeat(60));
  
  try {
    console.log(`📍 API URL: ${API_BASE_URL}/api/auth/login`);
    console.log(`📧 Email: ${EMAIL}\n`);
    
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/login`,
      {
        email: EMAIL,
        password: PASSWORD
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success && response.data.token) {
      console.log('✅ LOGIN SUCCESSFUL!\n');
      console.log('='.repeat(60));
      console.log('🔑 YOUR JWT TOKEN:');
      console.log('='.repeat(60));
      console.log(response.data.token);
      console.log('='.repeat(60));
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Copy the token above');
      console.log('2. Open test-push-notification.js');
      console.log('3. Replace JWT_TOKEN with the token above');
      console.log('4. Run: npm run test:push\n');
      console.log('='.repeat(60));
      
      // Also save to a file for easy access
      const fs = require('fs');
      const tokenFile = '.jwt-token.txt';
      fs.writeFileSync(tokenFile, response.data.token);
      console.log(`💾 Token also saved to: ${tokenFile}`);
      console.log('   (This file is gitignored for security)\n');
      
      return response.data.token;
    } else {
      console.error('❌ Login failed - No token in response');
      console.error('Response:', response.data);
      return null;
    }
    
  } catch (error) {
    console.error('\n❌ LOGIN FAILED!\n');
    
    if (error.response) {
      // Server responded with error status
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('\n💡 SOLUTION: Invalid email or password. Please check your credentials.');
      } else if (error.response.status === 404) {
        console.error('\n💡 SOLUTION: Account not found. Please sign up first.');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response from server. Is your server running?');
      console.error('Server URL:', API_BASE_URL);
      console.error('\n💡 SOLUTION: Start your backend server:');
      console.error('   cd PrimeForm/Backend');
      console.error('   npm run dev');
    } else {
      // Error setting up request
      console.error('Error:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    return null;
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('\n🚀 Pure Body - JWT Token Getter\n');
  
  // Validate configuration
  if (EMAIL === 'your-email@example.com' || PASSWORD === 'your-password') {
    console.error('❌ ERROR: Please update EMAIL and PASSWORD in the script');
    console.error('   Open test-login.js and update the values at the top\n');
    process.exit(1);
  }
  
  const token = await loginAndGetToken();
  
  if (token) {
    console.log('✨ Token retrieved successfully!\n');
  } else {
    console.log('❌ Failed to get token. Please check the error above.\n');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

