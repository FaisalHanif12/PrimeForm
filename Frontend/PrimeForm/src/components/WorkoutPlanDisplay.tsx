import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { WorkoutPlan, WorkoutDay, WorkoutExercise } from '../services/aiWorkoutService';
import workoutPlanService from '../services/workoutPlanService';
import DailyProgressCard from './DailyProgressCard';
import WorkoutPlanCard from './WorkoutPlanCard';

const { width: screenWidth } = Dimensions.get('window');

interface WorkoutPlanDisplayProps {
  workoutPlan: WorkoutPlan;
  onExercisePress?: (exercise: WorkoutExercise) => void;
  onDayPress?: (day: WorkoutDay) => void;
  onGenerateNew?: () => void;
  isGeneratingNew?: boolean;
}

export default function WorkoutPlanDisplay({ 
  workoutPlan, 
  onExercisePress,
  onDayPress,
  onGenerateNew,
  isGeneratingNew = false
}: WorkoutPlanDisplayProps) {
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());

  // Safety checks for workout plan structure
  if (!workoutPlan || !workoutPlan.weeklyPlan || !Array.isArray(workoutPlan.weeklyPlan)) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid workout plan data</Text>
      </View>
    );
  }

  useEffect(() => {
    // Set the first non-rest day as selected by default
    const firstWorkoutDay = workoutPlan.weeklyPlan.find(day => !day.isRestDay);
    if (firstWorkoutDay) {
      setSelectedDay(firstWorkoutDay);
    }
  }, [workoutPlan]);

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

  const getDayStatus = (day: WorkoutDay, index: number): 'completed' | 'rest' | 'upcoming' | 'missed' => {
    if (day.isRestDay) return 'rest';
    
    const today = new Date();
    const dayDate = new Date(day.date);
    const todayString = today.toDateString();
    const dayString = dayDate.toDateString();
    
    // Check if day is completed
    if (completedDays.has(day.date)) {
      return 'completed';
    }
    
    // Current day - show as in progress
    if (dayString === todayString) {
      return 'upcoming';
    }
    
    // Past days - missed if not completed
    if (dayDate < today) {
      return 'missed';
    }
    
    // Future days
    return 'upcoming';
  };

  const isCurrentDay = (day: WorkoutDay): boolean => {
    const today = new Date();
    const dayDate = new Date(day.date);
    return today.toDateString() === dayDate.toDateString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const handleExerciseComplete = async (exercise: WorkoutExercise) => {
    if (!selectedDay) return;
    
    const exerciseId = `${selectedDay.date}-${exercise.name}`;
    const week = Math.ceil(selectedDay.day / 7);
    
    try {
      // Mark exercise as completed in database
      await workoutPlanService.markExerciseCompleted(exerciseId, selectedDay.day, week);
      
      // Update local state
      setCompletedExercises(prev => new Set([...prev, exerciseId]));
      
      // Check if all exercises for the day are completed
      const allExercisesCompleted = selectedDay.exercises.every(ex => 
        completedExercises.has(`${selectedDay.date}-${ex.name}`) || 
        exercise.name === ex.name
      );
      
      if (allExercisesCompleted) {
        // Mark day as completed in database
        await workoutPlanService.markDayCompleted(selectedDay.day, week);
        setCompletedDays(prev => new Set([...prev, selectedDay.date]));
      }
    } catch (error) {
      console.error('Error marking exercise completed:', error);
    }
  };

  const handleDayPress = (day: WorkoutDay) => {
    setSelectedDay(day);
    onDayPress?.(day);
  };

  const renderWeekCards = () => {
    const totalWeeks = getTotalWeeks();
    const currentWeek = getCurrentWeek();
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.weekCardsContainer}
        contentContainerStyle={styles.weekCardsContent}
      >
        {Array.from({ length: totalWeeks }, (_, index) => {
          const weekNumber = index + 1;
          const isCompleted = weekNumber < currentWeek;
          const isCurrent = weekNumber === currentWeek;
          
          return (
            <View key={weekNumber} style={styles.weekCard}>
              <View style={[
                styles.weekCardContent,
                isCompleted && styles.weekCardCompleted,
                isCurrent && styles.weekCardCurrent
              ]}>
                <Text style={[
                  styles.weekNumber,
                  isCompleted && styles.weekNumberCompleted,
                  isCurrent && styles.weekNumberCurrent
                ]}>
                  {weekNumber}
                </Text>
                <Text style={[
                  styles.weekLabel,
                  isCompleted && styles.weekLabelCompleted,
                  isCurrent && styles.weekLabelCurrent
                ]}>
                  Week
                </Text>
              </View>
              {isCompleted && (
                <View style={styles.checkmarkContainer}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderProgressLine = () => {
    const progressPercentage = getProgressPercentage();
    
    return (
      <View style={styles.progressLineContainer}>
        <View style={styles.progressLine}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Section - Goal and Duration */}
      <View style={styles.header}>
        <View style={styles.goalSection}>
          <Text style={styles.goalTitle}>{workoutPlan.goal}</Text>
          <Text style={styles.durationLabel}>Duration</Text>
        </View>
        
        <View style={styles.durationSection}>
          {renderProgressLine()}
          <Text style={styles.durationValue}>{workoutPlan.duration}</Text>
          {onGenerateNew && (
            <TouchableOpacity 
              style={[styles.generateNewButton, isGeneratingNew && styles.generateNewButtonDisabled]}
              onPress={onGenerateNew}
              disabled={isGeneratingNew}
            >
              <Text style={styles.generateNewButtonText}>
                {isGeneratingNew ? 'Generating...' : 'Generate New'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Week Cards Section */}
      <View style={styles.weekSection}>
        <Text style={styles.weekSectionTitle}>Workout Progress</Text>
        {renderWeekCards()}
      </View>

      {/* Daily Calendar Section */}
      <View style={styles.calendarSection}>
        <Text style={styles.calendarTitle}>Daily Progress</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.calendarContainer}
          contentContainerStyle={styles.calendarContent}
        >
          {workoutPlan.weeklyPlan.map((day, index) => (
            <View key={day.day} style={styles.dayCardWrapper}>
              {isCurrentDay(day) && (
                <View style={styles.todayIndicator}>
                  <Text style={styles.todayText}>TODAY</Text>
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
      </View>

      {/* Today's Workout Section */}
      <View style={styles.workoutSection}>
        <Text style={styles.workoutTitle}>
          {selectedDay?.isRestDay ? 'Rest Day' : "Today's Workout"}
        </Text>
        
        {selectedDay && !selectedDay.isRestDay && (
          <View style={styles.exercisesContainer}>
            {selectedDay.exercises && selectedDay.exercises.length > 0 ? (
              selectedDay.exercises.map((exercise, index) => {
                const exerciseId = `${selectedDay.date}-${exercise.name}`;
                const isCompleted = completedExercises.has(exerciseId);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.exerciseCard, isCompleted && styles.exerciseCardCompleted]}
                    onPress={() => onExercisePress?.(exercise)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.exerciseIcon}>
                      <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
                    </View>
                    
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseDetails}>
                        {exercise.sets} sets, {exercise.reps} reps
                      </Text>
                      <Text style={styles.exerciseMuscles}>
                        {exercise.targetMuscles.join(', ')}
                      </Text>
                    </View>
                    
                    <View style={styles.exerciseCalories}>
                      <Text style={styles.caloriesText}>{exercise.caloriesBurned} kcal</Text>
                    </View>
                    
                    {isCompleted && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedCheckmark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.noExercisesContainer}>
                <Text style={styles.noExercisesText}>No exercises planned for this day</Text>
              </View>
            )}
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
    backgroundColor: colors.background,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  goalSection: {
    flex: 1,
  },
  goalTitle: {
    color: colors.white,
    fontSize: 28,
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
    alignItems: 'flex-end',
  },
  progressLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLine: {
    width: 120,
    height: 8,
    backgroundColor: colors.cardBorder,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  durationValue: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  generateNewButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  generateNewButtonDisabled: {
    backgroundColor: colors.mutedText,
  },
  generateNewButtonText: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
  },

  // Week Cards Styles
  weekSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  weekSectionTitle: {
    color: colors.white,
    fontSize: typography.h4,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },
  weekCardsContainer: {
    marginBottom: spacing.sm,
  },
  weekCardsContent: {
    paddingRight: spacing.lg,
  },
  weekCard: {
    position: 'relative',
    marginRight: spacing.md,
  },
  weekCardContent: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  weekCardCompleted: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  weekCardCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekNumber: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  weekNumberCompleted: {
    color: colors.white,
  },
  weekNumberCurrent: {
    color: colors.white,
  },
  weekLabel: {
    color: colors.mutedText,
    fontSize: 10,
    fontFamily: fonts.body,
    marginTop: 2,
  },
  weekLabelCompleted: {
    color: colors.white,
  },
  weekLabelCurrent: {
    color: colors.white,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '700',
  },

  // Calendar Styles
  calendarSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  calendarTitle: {
    color: colors.white,
    fontSize: typography.h4,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },
  calendarContainer: {
    marginBottom: spacing.sm,
  },
  calendarContent: {
    paddingRight: spacing.lg,
  },
  dayCardWrapper: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  todayIndicator: {
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
  todayText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '700',
    fontFamily: fonts.body,
  },

  // Workout Section Styles
  workoutSection: {
    paddingHorizontal: spacing.lg,
    flex: 1,
  },
  workoutTitle: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },
  exercisesContainer: {
    flex: 1,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    position: 'relative',
  },
  exerciseCardCompleted: {
    backgroundColor: colors.green + '20',
    borderColor: colors.green,
  },
  exerciseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  exerciseEmoji: {
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
  exerciseCalories: {
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

  // Rest Day Styles
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

  // Error Styles
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

  // No Exercises Styles
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
});