import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { WorkoutExercise } from '../services/aiWorkoutService';

interface WorkoutPlanCardProps {
  exercise: WorkoutExercise;
  onPress?: (exercise: WorkoutExercise) => void;
  isCompleted?: boolean;
}

export default function WorkoutPlanCard({ 
  exercise, 
  onPress,
  isCompleted = false 
}: WorkoutPlanCardProps) {
  // Safety checks for exercise data
  const safeExercise = {
    name: exercise?.name || 'Exercise',
    emoji: exercise?.emoji || '💪',
    sets: exercise?.sets || 3,
    reps: exercise?.reps || 10,
    rest: exercise?.rest || '60s',
    targetMuscles: Array.isArray(exercise?.targetMuscles) ? exercise.targetMuscles : ['General'],
    caloriesBurned: exercise?.caloriesBurned || 50
  };

  return (
    <TouchableOpacity 
      style={[
        styles.card,
        isCompleted && styles.cardCompleted
      ]} 
      onPress={() => onPress?.(safeExercise)}
      activeOpacity={0.8}
    >
      {/* Exercise Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{safeExercise.emoji}</Text>
      </View>
      
      {/* Exercise Info */}
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{safeExercise.name}</Text>
        <Text style={styles.exerciseDetails}>
          {safeExercise.sets} sets, {safeExercise.reps} reps
        </Text>
        <Text style={styles.exerciseMuscles}>
          {safeExercise.targetMuscles.join(', ')}
        </Text>
      </View>
      
      {/* Calories */}
      <View style={styles.caloriesContainer}>
        <Text style={styles.caloriesText}>{safeExercise.caloriesBurned} kcal</Text>
      </View>
      
      {/* Completion Badge */}
      {isCompleted && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedCheckmark}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    position: 'relative',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardCompleted: {
    backgroundColor: colors.green + '20',
    borderColor: colors.green,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  exerciseDetails: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
  },
  exerciseMuscles: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontFamily: fonts.body,
  },
  caloriesContainer: {
    alignItems: 'flex-end',
  },
  caloriesText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  completedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCheckmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});