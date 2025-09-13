import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { WorkoutExercise } from '../services/aiWorkoutService';

interface WorkoutPlanCardProps {
  title: string;
  workouts: WorkoutExercise[];
  onPress?: () => void;
  delay?: number;
}

export default function WorkoutPlanCard({ 
  title, 
  workouts, 
  onPress, 
  delay = 0 
}: WorkoutPlanCardProps) {
  const totalCalories = workouts.reduce((sum, workout) => sum + (workout.caloriesBurned || 0), 0);

  return (
    <Animated.View 
      entering={FadeInDown.delay(delay)} 
      style={styles.container}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.calorieContainer}>
              <Text style={styles.calorieCount}>{totalCalories}</Text>
              <Text style={styles.calorieLabel}>kcal</Text>
            </View>
          </View>
          
          <View style={styles.workoutList}>
            {workouts.slice(0, 3).map((workout, index) => (
              <View key={index} style={styles.workoutItem}>
                <View style={styles.workoutIcon}>
                  <Text style={styles.workoutEmoji}>{workout.emoji}</Text>
                </View>
                
                <View style={styles.workoutContent}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <View style={styles.workoutDetails}>
                    <Text style={styles.workoutStats}>{workout.sets} sets × {workout.reps} reps</Text>
                    <Text style={styles.workoutCalories}>{workout.caloriesBurned} kcal</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
          
          {onPress && (
            <TouchableOpacity style={styles.viewAllButton} onPress={onPress}>
              <Text style={styles.viewAllText}>View Full AI Workout Plan</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: typography.subtitle,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },
  calorieContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 201, 124, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  calorieCount: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  calorieLabel: {
    color: colors.mutedText,
    fontSize: 10,
    fontFamily: fonts.body,
  },
  workoutList: {
    marginBottom: spacing.md,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  workoutIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  workoutEmoji: {
    fontSize: 18,
  },
  workoutContent: {
    flex: 1,
  },
  workoutName: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '500',
    fontFamily: fonts.body,
    marginBottom: 2,
  },
  workoutDetails: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  workoutStats: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '600',
  },
  workoutCalories: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
});