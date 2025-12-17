import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { WorkoutExercise } from '../services/aiWorkoutService';
import { useLanguage } from '../context/LanguageContext';

interface WorkoutPlanCardProps {
  title: string;
  workouts: WorkoutExercise[];
  completedExercises?: Set<string>;
  onPress?: () => void;
  delay?: number;
}

export default function WorkoutPlanCard({ 
  title, 
  workouts, 
  completedExercises = new Set(),
  onPress, 
  delay = 0 
}: WorkoutPlanCardProps) {
  const { t, language, transliterateText } = useLanguage();
  const totalCalories = workouts.reduce((sum, workout) => sum + (workout.caloriesBurned || 0), 0);
  
  // Get today's date for completion checking (use local timezone to avoid UTC offset)
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const year = todayDate.getFullYear();
  const month = String(todayDate.getMonth() + 1).padStart(2, '0');
  const day = String(todayDate.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;

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
              <Text style={styles.calorieLabel}>{t('dashboard.stats.kcal')}</Text>
            </View>
          </View>
          
          {workouts.length > 0 ? (
            <View style={styles.workoutList}>
              {workouts.map((workout, index) => {
                const isCompleted = completedExercises.has(`${today}-${workout.name}`);
                return (
                  <View key={index} style={[
                    styles.workoutItem,
                    isCompleted && styles.workoutItemCompleted
                  ]}>
                    <View style={styles.workoutIcon}>
                      <Ionicons name="fitness" size={16} color={colors.mutedText} />
                    </View>
                    
                    <View style={styles.workoutContent}>
                      <Text style={[
                        styles.workoutName,
                        isCompleted && styles.workoutNameCompleted
                      ]}>
                        {language === 'ur' ? transliterateText(workout.name) : workout.name}
                      </Text>
                      <View style={styles.workoutDetails}>
                        <Text style={[
                          styles.workoutCalories,
                          isCompleted && styles.workoutCaloriesCompleted
                        ]}>
                          {workout.caloriesBurned} {t('dashboard.stats.kcal')}
                        </Text>
                        <Text style={[
                          styles.workoutWeight,
                          isCompleted && styles.workoutWeightCompleted
                        ]}>
                          {workout.sets} {t('dashboard.stats.sets')} × {workout.reps} {t('dashboard.stats.reps')}
                        </Text>
                      </View>
                    </View>
                    
                    {isCompleted && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedIcon}>✓</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyWorkoutContainer}>
              <Text style={styles.emptyWorkoutTitle}>{t('workout.page.comingSoon')}</Text>
              <Text style={styles.emptyWorkoutText}>{t('workout.page.comingSoonDesc')}</Text>
            </View>
          )}
          
          {onPress && (
            <TouchableOpacity style={styles.viewAllButton} onPress={onPress}>
              <Text style={styles.viewAllText}>{t('dashboard.view.full.workout')}</Text>
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
  workoutCalories: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '600',
  },
  workoutWeight: {
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
  emptyWorkoutContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyWorkoutTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
  },
  emptyWorkoutText: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  
  // Completion Styles
  workoutItemCompleted: {
    opacity: 0.7,
  },
  workoutNameCompleted: {
    color: colors.mutedText,
    textDecorationLine: 'line-through',
  },
  workoutCaloriesCompleted: {
    color: colors.mutedText,
    textDecorationLine: 'line-through',
  },
  workoutWeightCompleted: {
    color: colors.mutedText + '80',
    textDecorationLine: 'line-through',
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedIcon: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
});