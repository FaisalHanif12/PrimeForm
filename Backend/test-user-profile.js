const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-test-jwt-token-here'; // Replace with actual JWT token

// Test data
const testUserInfo = {
  country: 'United States',
  age: '25',
  gender: 'male',
  height: '5\'10"',
  currentWeight: '75 kg',
  goalWeight: '70 kg',
  bodyGoal: 'Lose Fat',
  medicalConditions: 'None',
  occupationType: 'Sedentary Desk Job',
  availableEquipment: 'Basic Dumbbells',
  dietPreference: 'Non-Vegetarian'
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    return null;
  }
};

// Test functions
const testCreateProfile = async () => {
  console.log('\n🧪 Testing Create Profile...');
  const result = await makeRequest('POST', '/user-profile', testUserInfo);
  if (result) {
    console.log('✅ Create Profile:', result.message);
    return result.data;
  }
  return null;
};

const testGetProfile = async () => {
  console.log('\n🧪 Testing Get Profile...');
  const result = await makeRequest('GET', '/user-profile');
  if (result) {
    console.log('✅ Get Profile:', result.message);
    return result.data;
  }
  return null;
};

const testUpdateProfileField = async () => {
  console.log('\n🧪 Testing Update Profile Field...');
  const result = await makeRequest('PATCH', '/user-profile/field', {
    field: 'age',
    value: '26'
  });
  if (result) {
    console.log('✅ Update Profile Field:', result.message);
    return result.data;
  }
  return null;
};

const testCheckProfileCompletion = async () => {
  console.log('\n🧪 Testing Check Profile Completion...');
  const result = await makeRequest('GET', '/user-profile/completion');
  if (result) {
    console.log('✅ Check Profile Completion:', result.message);
    console.log('   Is Complete:', result.data.isComplete);
    console.log('   Missing Fields:', result.data.missingFields);
    return result.data;
  }
  return null;
};

const testDeleteProfile = async () => {
  console.log('\n🧪 Testing Delete Profile...');
  const result = await makeRequest('DELETE', '/user-profile');
  if (result) {
    console.log('✅ Delete Profile:', result.message);
    return result.data;
  }
  return null;
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting User Profile API Tests...');
  console.log('=====================================');
  
  // Test 1: Create Profile
  const createdProfile = await testCreateProfile();
  
  // Test 2: Get Profile
  const retrievedProfile = await testGetProfile();
  
  // Test 3: Update Profile Field
  const updatedProfile = await testUpdateProfileField();
  
  // Test 4: Check Profile Completion
  const completionStatus = await testCheckProfileCompletion();
  
  // Test 5: Delete Profile (cleanup)
  const deleteResult = await testDeleteProfile();
  
  console.log('\n=====================================');
  console.log('🎯 Test Summary:');
  console.log('✅ Create Profile:', createdProfile ? 'PASSED' : 'FAILED');
  console.log('✅ Get Profile:', retrievedProfile ? 'PASSED' : 'FAILED');
  console.log('✅ Update Profile Field:', updatedProfile ? 'PASSED' : 'FAILED');
  console.log('✅ Check Profile Completion:', completionStatus ? 'PASSED' : 'FAILED');
  console.log('✅ Delete Profile:', deleteResult ? 'PASSED' : 'FAILED');
  console.log('=====================================');
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testCreateProfile,
  testGetProfile,
  testUpdateProfileField,
  testCheckProfileCompletion,
  testDeleteProfile
};
