import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { WorkoutPlan, WorkoutDay } from '../services/aiWorkoutService';
import DailyProgressCard from './DailyProgressCard';
import WorkoutPlanCard from './WorkoutPlanCard';

const { width: screenWidth } = Dimensions.get('window');

interface WorkoutPlanDisplayProps {
  workoutPlan: WorkoutPlan;
  onExercisePress?: (exercise: any) => void;
  onDayPress?: (day: WorkoutDay) => void;
}

export default function WorkoutPlanDisplay({ 
  workoutPlan, 
  onExercisePress,
  onDayPress 
}: WorkoutPlanDisplayProps) {
  // Add safety checks for workout plan structure
  if (!workoutPlan || !workoutPlan.weeklyPlan || !Array.isArray(workoutPlan.weeklyPlan)) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid workout plan data</Text>
      </View>
    );
  }

  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(
    workoutPlan.weeklyPlan.find(day => !day.isRestDay) || null
  );

  const handleDayPress = (day: WorkoutDay) => {
    setSelectedDay(day);
    onDayPress?.(day);
  };

  const getDayStatus = (day: WorkoutDay, index: number): 'completed' | 'rest' | 'upcoming' | 'missed' => {
    if (day.isRestDay) return 'rest';
    
    const today = new Date();
    const dayDate = new Date(day.date);
    const todayString = today.toDateString();
    const dayString = dayDate.toDateString();
    
    // Current day - show as in progress
    if (dayString === todayString) {
      return 'upcoming'; // Current day shows as in progress
    }
    
    // Past days - simulate completion status (in real app, this would come from user data)
    if (dayDate < today) {
      // Simulate 80% completion rate for past days
      const random = Math.random();
      return random < 0.8 ? 'completed' : 'missed';
    }
    
    // Future days
    return 'upcoming';
  };

  const isCurrentDay = (day: WorkoutDay): boolean => {
    const today = new Date();
    const dayDate = new Date(day.date);
    return today.toDateString() === dayDate.toDateString();
  };

  const getCurrentWeek = (): number => {
    const today = new Date();
    const startDate = new Date(workoutPlan.startDate);
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(Math.ceil(daysDiff / 7), getTotalWeeks()));
  };

  const getTotalWeeks = (): number => {
    const startDate = new Date(workoutPlan.startDate);
    const endDate = new Date(workoutPlan.endDate);
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.ceil(daysDiff / 7);
  };

  const getProgressPercentage = (): number => {
    const currentWeek = getCurrentWeek();
    const totalWeeks = getTotalWeeks();
    return Math.min((currentWeek / totalWeeks) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <View style={styles.container}>
      {/* Goal and Duration Header */}
      <View style={styles.header}>
        <View style={styles.goalSection}>
          <Text style={styles.goalTitle}>{workoutPlan.goal}</Text>
          <Text style={styles.durationLabel}>Duration</Text>
        </View>
        
        <View style={styles.durationSection}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
            </View>
            <Text style={styles.weekIndicator}>Week {getCurrentWeek()}</Text>
          </View>
          <Text style={styles.durationValue}>{workoutPlan.duration}</Text>
        </View>
      </View>

      {/* Daily Progress Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.dailyProgressContainer}
        contentContainerStyle={styles.dailyProgressContent}
      >
        {workoutPlan.weeklyPlan.map((day, index) => (
          <View key={day.day} style={styles.dayCardContainer}>
            {isCurrentDay(day) && (
              <View style={styles.currentDayIndicator}>
                <Text style={styles.currentDayText}>TODAY</Text>
              </View>
            )}
            <DailyProgressCard
              dayName={day.dayName.substring(0, 3)}
              date={formatDate(day.date)}
              status={getDayStatus(day, index)}
              onPress={() => handleDayPress(day)}
            />
          </View>
        ))}
      </ScrollView>

      {/* Today's Workout Section */}
      <View style={styles.todaysWorkoutSection}>
        <Text style={styles.todaysWorkoutTitle}>
          {selectedDay?.isRestDay ? 'Rest Day' : "Today's Workout"}
        </Text>
        
        {selectedDay && !selectedDay.isRestDay && (
          <View style={styles.workoutDetails}>
            {selectedDay.exercises && selectedDay.exercises.length > 0 ? (
              selectedDay.exercises.map((exercise, index) => (
                <WorkoutPlanCard
                  key={index}
                  exercise={exercise}
                  onPress={() => onExercisePress?.(exercise)}
                />
              ))
            ) : (
              <View style={styles.noExercisesContainer}>
                <Text style={styles.noExercisesText}>No exercises planned for this day</Text>
              </View>
            )}
            
            {/* Warm-up and Cool-down */}
            <View style={styles.warmupCooldown}>
              <View style={styles.warmupCooldownItem}>
                <Text style={styles.warmupCooldownTitle}>Warm-up</Text>
                <Text style={styles.warmupCooldownText}>{selectedDay.warmUp}</Text>
              </View>
              <View style={styles.warmupCooldownItem}>
                <Text style={styles.warmupCooldownTitle}>Cool-down</Text>
                <Text style={styles.warmupCooldownText}>{selectedDay.coolDown}</Text>
              </View>
            </View>
          </View>
        )}
        
        {selectedDay?.isRestDay && (
          <View style={styles.restDayContainer}>
            <Text style={styles.restDayIcon}>😴</Text>
            <Text style={styles.restDayTitle}>Rest Day</Text>
            <Text style={styles.restDayText}>
              Take a break and let your muscles recover. You can do light stretching or go for a walk.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  goalSection: {
    flex: 1,
  },
  goalTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  durationLabel: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontFamily: fonts.body,
  },
  durationSection: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    flex: 1,
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressBar: {
    width: 100,
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  weekIndicator: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  durationValue: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  dailyProgressContainer: {
    marginBottom: spacing.xl,
  },
  dailyProgressContent: {
    paddingHorizontal: spacing.lg,
  },
  dayCardContainer: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  currentDayIndicator: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    zIndex: 1,
    alignItems: 'center',
  },
  currentDayText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  todaysWorkoutSection: {
    paddingHorizontal: spacing.lg,
  },
  todaysWorkoutTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },
  workoutDetails: {
    marginBottom: spacing.lg,
  },
  warmupCooldown: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  warmupCooldownItem: {
    marginBottom: spacing.sm,
  },
  warmupCooldownTitle: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
  },
  warmupCooldownText: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontFamily: fonts.body,
  },
  restDayContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  restDayIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  restDayTitle: {
    color: colors.white,
    fontSize: typography.h4,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
  },
  restDayText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  noExercisesContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  noExercisesText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.body,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
});
