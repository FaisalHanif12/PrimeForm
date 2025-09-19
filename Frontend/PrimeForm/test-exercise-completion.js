// Test script for exercise completion functionality
// Run this in the React Native debugger console to test the completion service

const testExerciseCompletion = async () => {
  try {
    console.log('🧪 Starting exercise completion test...');
    
    // Import the completion service
    const { default: exerciseCompletionService } = await import('./src/services/exerciseCompletionService');
    
    // Initialize the service
    await exerciseCompletionService.initialize();
    
    // Test data
    const testExerciseId = '2024-01-15-Push-Ups';
    const testDayDate = '2024-01-15';
    const testDayNumber = 1;
    const testWeekNumber = 1;
    
    console.log('📊 Initial completion data:', exerciseCompletionService.getCompletionData());
    
    // Test marking exercise as completed
    console.log('🎯 Testing exercise completion...');
    const success = await exerciseCompletionService.markExerciseCompleted(
      testExerciseId,
      testDayDate,
      testDayNumber,
      testWeekNumber
    );
    
    console.log('✅ Exercise completion result:', success);
    
    // Check if exercise is marked as completed
    const isCompleted = exerciseCompletionService.isExerciseCompleted(testExerciseId);
    console.log('✅ Exercise is completed:', isCompleted);
    
    // Test day completion
    const testDayExercises = [testExerciseId, '2024-01-15-Squats'];
    const dayCompletion = exerciseCompletionService.calculateDayCompletion(testDayExercises, testDayDate);
    console.log('📊 Day completion percentage:', dayCompletion + '%');
    
    // Test day completion criteria
    const isDayFullyCompleted = exerciseCompletionService.isDayFullyCompleted(testDayExercises, testDayDate);
    console.log('🎯 Day fully completed (60%+):', isDayFullyCompleted);
    
    // Get final completion data
    console.log('📊 Final completion data:', exerciseCompletionService.getCompletionData());
    
    // Get completion statistics
    const stats = exerciseCompletionService.getCompletionStats();
    console.log('📈 Completion statistics:', stats);
    
    console.log('✅ Exercise completion test completed successfully!');
    
  } catch (error) {
    console.error('❌ Exercise completion test failed:', error);
  }
};

// Run the test
testExerciseCompletion();
