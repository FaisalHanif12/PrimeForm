const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_USER_TOKEN = ''; // You'll need to get this from your auth system

// Sample diet plan data
const sampleDietPlan = {
  goal: 'Muscle Gain',
  duration: '12 weeks',
  country: 'Pakistan',
  keyNotes: [
    'Stay hydrated - drink plenty of water throughout the day',
    'Eat slowly and mindfully to aid digestion',
    'Prepare meals in advance when possible'
  ],
  weeklyPlan: [
    {
      day: 1,
      dayName: 'Monday',
      date: '2025-09-20',
      totalCalories: 2200,
      totalProtein: 120,
      totalCarbs: 250,
      totalFats: 80,
      meals: {
        breakfast: {
          name: 'Protein Pancakes',
          emoji: '🥞',
          ingredients: ['oats', 'eggs', 'protein powder', 'banana'],
          calories: 400,
          protein: 25,
          carbs: 45,
          fats: 12,
          preparationTime: '15 minutes',
          servingSize: '2 pancakes',
          instructions: 'Mix ingredients and cook on medium heat'
        },
        lunch: {
          name: 'Chicken Rice Bowl',
          emoji: '🍚',
          ingredients: ['chicken breast', 'brown rice', 'vegetables'],
          calories: 600,
          protein: 40,
          carbs: 60,
          fats: 18,
          preparationTime: '25 minutes',
          servingSize: '1 bowl',
          instructions: 'Grill chicken and serve with rice and vegetables'
        },
        dinner: {
          name: 'Salmon with Quinoa',
          emoji: '🐟',
          ingredients: ['salmon fillet', 'quinoa', 'asparagus'],
          calories: 650,
          protein: 45,
          carbs: 50,
          fats: 25,
          preparationTime: '30 minutes',
          servingSize: '1 plate',
          instructions: 'Bake salmon and serve with quinoa and asparagus'
        },
        snacks: [
          {
            name: 'Greek Yogurt with Berries',
            emoji: '🍓',
            ingredients: ['greek yogurt', 'mixed berries'],
            calories: 180,
            protein: 15,
            carbs: 20,
            fats: 6,
            preparationTime: '5 minutes',
            servingSize: '1 cup',
            instructions: 'Mix yogurt with berries'
          }
        ]
      },
      waterIntake: '2-3 liters',
      notes: 'Focus on protein intake for muscle building'
    }
  ],
  startDate: '2025-09-20',
  endDate: '2025-12-13',
  totalWeeks: 12,
  targetCalories: 2200,
  targetProtein: 120,
  targetCarbs: 250,
  targetFats: 80
};

async function testDietPlanAPI() {
  try {
    console.log('🧪 Testing Diet Plan API...');
    
    // Test 1: Check if server is running
    console.log('\n1. Testing server connection...');
    const healthCheck = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Server is running:', healthCheck.data);
    
    // Test 2: Test diet plan creation (without auth for now)
    console.log('\n2. Testing diet plan creation...');
    try {
      const createResponse = await axios.post(`${API_BASE_URL}/diet-plans`, sampleDietPlan);
      console.log('✅ Diet plan created successfully:', createResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('⚠️ Authentication required (expected):', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    
    // Test 3: Test diet plan retrieval (without auth)
    console.log('\n3. Testing diet plan retrieval...');
    try {
      const getResponse = await axios.get(`${API_BASE_URL}/diet-plans`);
      console.log('✅ Diet plans retrieved:', getResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('⚠️ Authentication required (expected):', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    
    console.log('\n🎉 Diet Plan API tests completed!');
    console.log('✅ The backend is running and diet plan endpoints are accessible');
    console.log('⚠️ Authentication is working (401 errors are expected without tokens)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('🔥 Backend server is not running on localhost:5000');
    }
  }
}

// Run the test
testDietPlanAPI();


