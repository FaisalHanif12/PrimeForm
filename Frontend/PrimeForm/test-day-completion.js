// Test script for day completion percentage calculation
// Run this in the React Native debugger console to test the completion percentage

const testDayCompletion = async () => {
  try {
    console.log('🧪 Starting day completion percentage test...');
    
    // Import the completion service
    const { default: exerciseCompletionService } = await import('./src/services/exerciseCompletionService');
    
    // Initialize the service
    await exerciseCompletionService.initialize();
    
    // Test data - simulate 3 out of 5 exercises completed
    const testDayDate = '2024-01-15';
    const testDayExercises = [
      '2024-01-15-Push-Ups',
      '2024-01-15-Squats', 
      '2024-01-15-Lunges',
      '2024-01-15-Planks',
      '2024-01-15-Burpees'
    ];
    
    // Mark 3 exercises as completed
    console.log('🎯 Marking 3 exercises as completed...');
    await exerciseCompletionService.markExerciseCompleted('2024-01-15-Push-Ups', testDayDate, 1, 1);
    await exerciseCompletionService.markExerciseCompleted('2024-01-15-Squats', testDayDate, 1, 1);
    await exerciseCompletionService.markExerciseCompleted('2024-01-15-Lunges', testDayDate, 1, 1);
    
    // Calculate completion percentage
    const completionPercentage = exerciseCompletionService.calculateDayCompletion(testDayExercises, testDayDate);
    
    console.log('📊 Day Completion Test Results:');
    console.log('Total exercises:', testDayExercises.length);
    console.log('Completed exercises:', 3);
    console.log('Expected percentage:', '60%');
    console.log('Actual percentage:', completionPercentage.toFixed(2) + '%');
    
    // Check if calculation is correct
    const expectedPercentage = 60;
    const actualPercentage = Math.round(completionPercentage);
    
    if (actualPercentage === expectedPercentage) {
      console.log('✅ Day completion percentage calculation is CORRECT!');
    } else {
      console.log('❌ Day completion percentage calculation is INCORRECT!');
      console.log('Expected:', expectedPercentage + '%');
      console.log('Got:', actualPercentage + '%');
    }
    
    // Test individual exercise completion status
    console.log('\n🔍 Individual Exercise Status:');
    testDayExercises.forEach(exerciseId => {
      const isCompleted = exerciseCompletionService.isExerciseCompleted(exerciseId);
      console.log(`${exerciseId}: ${isCompleted ? '✅ Completed' : '❌ Not Completed'}`);
    });
    
    console.log('\n✅ Day completion test completed!');
    
  } catch (error) {
    console.error('❌ Day completion test failed:', error);
  }
};

// Run the test
testDayCompletion();
