import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { WorkoutExercise } from '../services/aiWorkoutService';

interface WorkoutPlanCardProps {
  exercise: WorkoutExercise;
  onPress?: () => void;
}

export default function WorkoutPlanCard({ exercise, onPress }: WorkoutPlanCardProps) {
  // Add safety checks and fallback values
  if (!exercise) {
    return null;
  }

  const safeExercise = {
    name: exercise.name || 'Exercise',
    emoji: exercise.emoji || '💪',
    sets: exercise.sets || 0,
    reps: exercise.reps || 0,
    caloriesBurned: exercise.caloriesBurned || 0,
    targetMuscles: Array.isArray(exercise.targetMuscles) ? exercise.targetMuscles : ['General']
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{safeExercise.emoji}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.exerciseName}>{safeExercise.name}</Text>
        <Text style={styles.setsReps}>
          {safeExercise.sets} sets, {safeExercise.reps} reps
        </Text>
        <Text style={styles.calories}>
          {safeExercise.caloriesBurned} kcal
        </Text>
        <Text style={styles.targetMuscles}>
          {safeExercise.targetMuscles.join(', ')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  exerciseName: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  setsReps: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
  },
  calories: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
  },
  targetMuscles: {
    color: colors.mutedText,
    fontSize: 11,
    fontFamily: fonts.body,
  },
});