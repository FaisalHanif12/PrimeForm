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
    // Load completion states and set initial day
    loadCompletionStates();
    
    // Get current week days and find today
    const currentWeekDays = getCurrentWeekDays();
    const today = new Date().toDateString();
    const todaysDay = currentWeekDays.find(day => new Date(day.date).toDateString() === today);
    
    if (todaysDay) {
      setSelectedDay(todaysDay);
      return;
    }

    // Fallback to first workout day of current week
    const firstWorkoutDay = currentWeekDays.find(day => !day.isRestDay);
    if (firstWorkoutDay) {
      setSelectedDay(firstWorkoutDay);
    } else {
      // Ultimate fallback - set to first day of current week
      setSelectedDay(currentWeekDays[0]);
    }
  }, [workoutPlan]);

  const loadCompletionStates = async () => {
    try {
      // Load completion states from backend
      const stats = await workoutPlanService.getWorkoutStats();
      if (stats.success && stats.data) {
        // Load completed exercises and days from backend
        // This would be implemented when backend completion tracking is ready
        console.log('📊 Loaded workout stats:', stats.data);
      }
    } catch (error) {
      console.warn('Could not load completion states:', error);
      
      // Try to load from local storage as fallback
      try {
        const Storage = await import('../utils/storage');
        const cachedCompletedExercises = await Storage.default.getItem('completed_exercises');
        const cachedCompletedDays = await Storage.default.getItem('completed_days');
        
        if (cachedCompletedExercises) {
          setCompletedExercises(new Set(JSON.parse(cachedCompletedExercises)));
        }
        if (cachedCompletedDays) {
          setCompletedDays(new Set(JSON.parse(cachedCompletedDays)));
        }
      } catch (storageError) {
        console.warn('Could not load from local storage:', storageError);
      }
    }
  };

  const getCurrentWeek = (): number => {
    const today = new Date();
    const startDate = new Date(workoutPlan.startDate);
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(Math.floor(daysDiff / 7) + 1, getTotalWeeks()));
  };

  const getTotalWeeks = (): number => {
    // Use totalWeeks from workout plan if available, otherwise calculate from dates
    if (workoutPlan.totalWeeks) {
      return workoutPlan.totalWeeks;
    }
    const startDate = new Date(workoutPlan.startDate);
    const endDate = new Date(workoutPlan.endDate);
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.ceil(daysDiff / 7));
  };

  const getProgressPercentage = (): number => {
    // Calculate progress based on time elapsed in the plan
    const start = new Date(workoutPlan.startDate).getTime();
    const end = new Date(workoutPlan.endDate).getTime();
    const now = Date.now();
    
    if (end <= start) return 0;
    
    const timeProgress = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
    
    // For now, use time-based progress since completion tracking needs backend integration
    return Math.round(timeProgress);
  };

  // Expand the 7-day weekly pattern for the current week
  const getCurrentWeekDays = () => {
    const currentWeek = getCurrentWeek();
    const startDate = new Date(workoutPlan.startDate);
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + ((currentWeek - 1) * 7));
    
    return workoutPlan.weeklyPlan.map((day, index) => ({
      ...day,
      date: new Date(weekStartDate.getTime() + (index * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      day: ((currentWeek - 1) * 7) + (index + 1) // Absolute day number for tracking
    }));
  };

  const getDayStatus = (day: WorkoutDay, index: number): 'completed' | 'rest' | 'upcoming' | 'missed' => {
    if (day.isRestDay) return 'rest';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);
    
    // Check if day is completed
    if (completedDays.has(day.date)) {
      return 'completed';
    }
    
    // Current day - show as upcoming (in progress)
    if (dayDate.getTime() === today.getTime()) {
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
      // Optimistically update local state first for better UX
      const newCompletedExercises = new Set([...completedExercises, exerciseId]);
      setCompletedExercises(newCompletedExercises);
      
      // Save to local storage immediately
      const Storage = await import('../utils/storage');
      await Storage.default.setItem('completed_exercises', JSON.stringify([...newCompletedExercises]));
      
      // Mark exercise as completed in database
      await workoutPlanService.markExerciseCompleted(exerciseId, selectedDay.day, week);
      
      // Check if all exercises for the day are completed
      const allExercisesCompleted = selectedDay.exercises.every(ex => 
        newCompletedExercises.has(`${selectedDay.date}-${ex.name}`)
      );
      
      if (allExercisesCompleted) {
        // Mark day as completed in database
        await workoutPlanService.markDayCompleted(selectedDay.day, week);
        const newCompletedDays = new Set([...completedDays, selectedDay.date]);
        setCompletedDays(newCompletedDays);
        
        // Save to local storage
        await Storage.default.setItem('completed_days', JSON.stringify([...newCompletedDays]));
        
        console.log(`🎉 Day ${selectedDay.day} completed! All exercises finished.`);
      }
    } catch (error) {
      console.error('Error marking exercise completed:', error);
      // Revert optimistic update on error
      setCompletedExercises(prev => {
        const reverted = new Set(prev);
        reverted.delete(exerciseId);
        return reverted;
      });
    }
  };

  const handleDayPress = (day: WorkoutDay) => {
    setSelectedDay(day);
    onDayPress?.(day);
  };

  // Removed week cards per new design


  return (
    <View style={styles.container}>
      {/* Header Section - redesigned to match the image */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.goalTitle}>{workoutPlan.goal}</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
            </View>
            <Text style={styles.progressPercentage}>{getProgressPercentage()}%</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.generateButton, isGeneratingNew && styles.generateButtonDisabled]}
          onPress={onGenerateNew}
          disabled={isGeneratingNew}
        >
          <Text style={styles.generateButtonText}>
            {isGeneratingNew ? 'Generating…' : 'Generate New'}
          </Text>
          <Text style={styles.durationText}>{workoutPlan.duration}</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Calendar Section */}
      <View style={styles.calendarSection}>
        <Text style={styles.calendarTitle}>Daily Progress — Week {getCurrentWeek()} of {getTotalWeeks()}</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.calendarContainer}
          contentContainerStyle={styles.calendarContent}
        >
          {getCurrentWeekDays().map((day, index) => {
            const status = getDayStatus(day, index);
            const isToday = isCurrentDay(day);
            
            return (
              <View key={day.day} style={styles.dayCardWrapper}>
                {isToday && (
                  <View style={styles.todayIndicator}>
                    <Text style={styles.todayText}>TODAY</Text>
                  </View>
                )}
                <DailyProgressCard
                  dayName={day.dayName.substring(0, 3)}
                  date={formatDate(day.date)}
                  status={status}
                  onPress={() => handleDayPress(day)}
                />
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Today's Workout Section */}
      <View style={styles.workoutSection}>
        <Text style={styles.workoutTitle}>
          {selectedDay?.isRestDay ? 'Rest Day' : 
           isCurrentDay(selectedDay!) ? "Today's Workout" : 
           `${selectedDay?.dayName}'s Workout`}
        </Text>
        
        {selectedDay && !selectedDay.isRestDay && (
          <ScrollView style={styles.exercisesContainer} showsVerticalScrollIndicator={false}>
            {selectedDay.exercises && selectedDay.exercises.length > 0 ? (
              selectedDay.exercises.map((exercise, index) => {
                const exerciseId = `${selectedDay.date}-${exercise.name}`;
                const isCompleted = completedExercises.has(exerciseId);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.exerciseCard, isCompleted && styles.exerciseCardCompleted]}
                    onPress={() => {
                      if (!isCompleted) {
                        handleExerciseComplete(exercise);
                      }
                      onExercisePress?.(exercise);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.exerciseIcon}>
                      <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
                    </View>
                    
                    <View style={styles.exerciseInfo}>
                      <Text style={[styles.exerciseName, isCompleted && styles.exerciseNameCompleted]}>
                        {exercise.name}
                      </Text>
                      <Text style={[styles.exerciseDetails, isCompleted && styles.exerciseDetailsCompleted]}>
                        {exercise.sets} × {exercise.reps} • Rest {exercise.rest}
                      </Text>
                      <Text style={[styles.exerciseMuscles, isCompleted && styles.exerciseMusclesCompleted]}>
                        {exercise.targetMuscles.join(', ')}
                      </Text>
                    </View>
                    
                    <View style={styles.exerciseRightSection}>
                      <Text style={[styles.caloriesText, isCompleted && styles.caloriesTextCompleted]}>
                        {exercise.caloriesBurned} kcal
                      </Text>
                      {!isCompleted && (
                        <TouchableOpacity 
                          style={styles.completeButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleExerciseComplete(exercise);
                          }}
                        >
                          <Text style={styles.completeButtonText}>Complete</Text>
                        </TouchableOpacity>
                      )}
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
          </ScrollView>
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
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  goalTitle: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.cardBorder,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressPercentage: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
    minWidth: 35,
  },
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minWidth: 100,
  },
  generateButtonDisabled: {
    backgroundColor: colors.mutedText,
  },
  generateButtonText: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  durationText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '500',
    fontFamily: fonts.body,
    marginTop: 2,
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
  exerciseRightSection: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  caloriesText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  caloriesTextCompleted: {
    color: colors.mutedText,
  },
  completeButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  completeButtonText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  exerciseNameCompleted: {
    textDecorationLine: 'line-through',
    color: colors.mutedText,
  },
  exerciseDetailsCompleted: {
    color: colors.mutedText,
  },
  exerciseMusclesCompleted: {
    color: colors.mutedText,
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