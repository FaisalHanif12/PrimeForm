import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert 
} from 'react-native';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { WorkoutExercise } from '../services/aiWorkoutService';

interface ExerciseDetailScreenProps {
  exercise: WorkoutExercise;
  onComplete: (exercise: WorkoutExercise) => void;
  onBack: () => void;
  isCompleted?: boolean;
}

export default function ExerciseDetailScreen({ 
  exercise, 
  onComplete,
  onBack,
  isCompleted = false 
}: ExerciseDetailScreenProps) {
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState<Set<number>>(new Set());

  const totalSets = exercise.sets || 3;
  const isFullyCompleted = completedSets.size === totalSets;

  const handleSetComplete = (setNumber: number) => {
    const newCompletedSets = new Set(completedSets);
    if (completedSets.has(setNumber)) {
      newCompletedSets.delete(setNumber);
    } else {
      newCompletedSets.add(setNumber);
    }
    setCompletedSets(newCompletedSets);
  };

  const handleExerciseComplete = () => {
    if (isFullyCompleted) {
      Alert.alert(
        'Exercise Completed!',
        `Great job completing ${exercise.name}!`,
        [
          {
            text: 'OK',
            onPress: () => onComplete(exercise)
          }
        ]
      );
    } else {
      Alert.alert(
        'Complete All Sets',
        `Please complete all ${totalSets} sets before marking this exercise as complete.`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exercise Details</Text>
          <View style={styles.placeholder} />
        </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Exercise Header */}
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseIcon}>
            <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
          </View>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exerciseMuscles}>
              {exercise.targetMuscles.join(', ')}
            </Text>
            <Text style={styles.exerciseCalories}>
              {exercise.caloriesBurned} calories
            </Text>
          </View>
        </View>

        {/* Exercise Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Exercise Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sets</Text>
            <Text style={styles.detailValue}>{exercise.sets}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reps</Text>
            <Text style={styles.detailValue}>{exercise.reps}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rest</Text>
            <Text style={styles.detailValue}>{exercise.rest}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Target Muscles</Text>
            <Text style={styles.detailValue}>{exercise.targetMuscles.join(', ')}</Text>
          </View>
        </View>

        {/* Sets Progress */}
        <View style={styles.setsCard}>
          <Text style={styles.setsTitle}>Sets Progress</Text>
          <Text style={styles.setsSubtitle}>
            {completedSets.size} of {totalSets} sets completed
          </Text>
          
          <View style={styles.setsContainer}>
            {Array.from({ length: totalSets }, (_, index) => {
              const setNumber = index + 1;
              const isCompleted = completedSets.has(setNumber);
              
              return (
                <TouchableOpacity
                  key={setNumber}
                  style={[
                    styles.setButton,
                    isCompleted && styles.setButtonCompleted
                  ]}
                  onPress={() => handleSetComplete(setNumber)}
                >
                  <Text style={[
                    styles.setButtonText,
                    isCompleted && styles.setButtonTextCompleted
                  ]}>
                    {setNumber}
                  </Text>
                  {isCompleted && (
                    <Text style={styles.setCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <Text style={styles.instructionsText}>
            • Perform {exercise.reps} repetitions for each set{'\n'}
            • Rest for {exercise.rest} between sets{'\n'}
            • Focus on proper form and controlled movements{'\n'}
            • Complete all {exercise.sets} sets to finish this exercise
          </Text>
        </View>
      </ScrollView>

      {/* Complete Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.completeButton,
            isFullyCompleted && styles.completeButtonActive
          ]}
          onPress={handleExerciseComplete}
          disabled={!isFullyCompleted}
        >
          <Text style={[
            styles.completeButtonText,
            isFullyCompleted && styles.completeButtonTextActive
          ]}>
            {isCompleted ? 'Exercise Completed' : 'Mark as Complete'}
          </Text>
        </TouchableOpacity>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 1000,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backButton: {
    padding: spacing.sm,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: typography.body,
    fontFamily: fonts.body,
    fontWeight: '600',
  },
  headerTitle: {
    color: colors.white,
    fontSize: typography.h4,
    fontFamily: fonts.heading,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  
  // Exercise Header
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  exerciseIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  exerciseEmoji: {
    fontSize: 40,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: colors.white,
    fontSize: 24,
    fontFamily: fonts.heading,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  exerciseMuscles: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
  },
  exerciseCalories: {
    color: colors.primary,
    fontSize: typography.body,
    fontFamily: fonts.body,
    fontWeight: '600',
  },

  // Details Card
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  detailsTitle: {
    color: colors.white,
    fontSize: typography.h4,
    fontFamily: fonts.heading,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  detailLabel: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
  },
  detailValue: {
    color: colors.white,
    fontSize: typography.body,
    fontFamily: fonts.body,
    fontWeight: '600',
  },

  // Sets Card
  setsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  setsTitle: {
    color: colors.white,
    fontSize: typography.h4,
    fontFamily: fonts.heading,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  setsSubtitle: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    marginBottom: spacing.md,
  },
  setsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  setButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  setButtonCompleted: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  setButtonText: {
    color: colors.white,
    fontSize: 18,
    fontFamily: fonts.heading,
    fontWeight: '700',
  },
  setButtonTextCompleted: {
    color: colors.white,
  },
  setCheckmark: {
    position: 'absolute',
    top: 2,
    right: 2,
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  // Instructions Card
  instructionsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  instructionsTitle: {
    color: colors.white,
    fontSize: typography.h4,
    fontFamily: fonts.heading,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  instructionsText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    lineHeight: 24,
  },

  // Bottom Container
  bottomContainer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  completeButton: {
    backgroundColor: colors.cardBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  completeButtonActive: {
    backgroundColor: colors.primary,
  },
  completeButtonText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    fontWeight: '600',
  },
  completeButtonTextActive: {
    color: colors.white,
  },
});

