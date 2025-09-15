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
import ExerciseDetailScreen from './ExerciseDetailScreen';
import DecorativeBackground from './DecorativeBackground';

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
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null);
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);

  // Safety checks for workout plan structure
  if (!workoutPlan || !workoutPlan.weeklyPlan || !Array.isArray(workoutPlan.weeklyPlan)) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid workout plan data</Text>
      </View>
    );
  }

  // Helper functions - defined before useEffect
  const getCurrentWeek = (): number => {
    const today = new Date();
    const startDate = new Date(workoutPlan.startDate);
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate week based on plan generation day (not Monday)
    // If plan starts mid-week, week 1 includes the generation day and forward
    const calculatedWeek = Math.floor(daysDiff / 7) + 1;
    
    console.log('📅 WorkoutPlanDisplay Date Debug:', {
      today: today.toDateString(),
      startDate: startDate.toDateString(),
      daysDiff,
      calculatedWeek,
      completedDaysCount: completedDays.size,
      planGenerationDay: startDate.toLocaleDateString('en-US', { weekday: 'long' })
    });
    
    // Use simple date-based calculation to match dashboard logic
    return Math.max(1, Math.min(calculatedWeek, getTotalWeeks()));
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

  // Expand the 7-day weekly pattern for the current week
  const getCurrentWeekDays = () => {
    if (!workoutPlan.weeklyPlan || workoutPlan.weeklyPlan.length === 0) {
      return [];
    }

    const currentWeek = getCurrentWeek();
    const startDate = new Date(workoutPlan.startDate);
    
    // Calculate week start based on plan generation day, not Monday
    // Week 1 starts from the plan generation day
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + ((currentWeek - 1) * 7));

    console.log('📅 Workout Calendar Debug:', {
      currentWeek,
      completedDaysCount: completedDays.size,
      completedWeeksCount: Math.floor(completedDays.size / 7),
      weekStartDate: weekStartDate.toISOString().split('T')[0],
      planGenerationDay: startDate.toLocaleDateString('en-US', { weekday: 'long' }),
      weekStartDay: weekStartDate.toLocaleDateString('en-US', { weekday: 'long' })
    });

    return workoutPlan.weeklyPlan.map((day, index) => ({
      ...day,
      date: new Date(weekStartDate.getTime() + (index * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      day: ((currentWeek - 1) * 7) + (index + 1) // Absolute day number for tracking
    }));
  };

  useEffect(() => {
    // Load completion states and set initial day
    loadCompletionStates();

    // Get current week days and find today
    const currentWeekDays = getCurrentWeekDays();

    if (currentWeekDays.length === 0) {
      console.warn('No days available in current week');
      return;
    }

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

  const getProgressPercentage = (): number => {
    // Calculate progress based on actual weeks completed vs total weeks
    const totalWeeks = getTotalWeeks();
    const currentWeek = getCurrentWeek();

    if (totalWeeks <= 0) return 0;

    // Calculate actual completion progress based on completed days
    const completedWeeksCount = Math.floor(completedDays.size / 7);
    const partialWeekProgress = (completedDays.size % 7) / 7;
    const actualProgress = ((completedWeeksCount + partialWeekProgress) / totalWeeks) * 100;

    // Calculate time-based progress for reference
    const start = new Date(workoutPlan.startDate).getTime();
    const end = new Date(workoutPlan.endDate).getTime();
    const now = Date.now();
    const timeProgress = end <= start ? 0 : Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));

    // Use the higher of actual progress or time progress, but cap at time progress + 10%
    const finalProgress = Math.min(Math.max(actualProgress, timeProgress), timeProgress + 10);

    return Math.round(finalProgress);
  };

  const getDayStatus = (day: WorkoutDay, index: number): 'completed' | 'rest' | 'upcoming' | 'missed' | 'in_progress' => {
    if (day.isRestDay) return 'rest';

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);
    const planStartDate = new Date(workoutPlan.startDate);
    planStartDate.setHours(0, 0, 0, 0);

    // Check if day is completed
    if (completedDays.has(day.date)) {
      return 'completed';
    }

    // Current day - show as in progress
    if (dayDate.getTime() === today.getTime()) {
      return 'in_progress';
    }

    // Plan generation day should be in_progress if it's today or in the past
    if (dayDate.getTime() === planStartDate.getTime() && dayDate <= today) {
      return 'in_progress';
    }

    // Days before plan generation should be 'upcoming' (not missed)
    if (dayDate < planStartDate) {
      return 'upcoming';
    }

    // Days after plan generation but before today
    if (dayDate < today && dayDate > planStartDate) {
      // Check completion percentage for the day
      const dayExercises = day.exercises.map(exercise => `${day.date}-${exercise.name}`);
      const completedExercisesCount = dayExercises.filter(exerciseId => completedExercises.has(exerciseId)).length;
      const completionPercentage = (completedExercisesCount / dayExercises.length) * 100;

      // If 60% or more completed, consider it completed, otherwise missed
      return completionPercentage >= 60 ? 'completed' : 'missed';
    }

    // Future days
    return 'upcoming';
  };

  // Get completion percentage for a specific day
  const getDayCompletionPercentage = (day: WorkoutDay): number => {
    if (day.isRestDay) return 100; // Rest days are always 100% complete
    
    const dayExercises = day.exercises.map(exercise => `${day.date}-${exercise.name}`);
    const completedExercisesCount = dayExercises.filter(exerciseId => completedExercises.has(exerciseId)).length;
    return Math.round((completedExercisesCount / dayExercises.length) * 100);
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
    if (!selectedDay || !selectedDay.date) {
      console.warn('Cannot complete exercise: selectedDay or selectedDay.date is null');
      return;
    }

    const exerciseId = `${selectedDay.date}-${exercise.name}`;
    const week = Math.ceil(selectedDay.day / 7);

    // Prevent double-clicking by checking if already completed
    if (completedExercises.has(exerciseId)) {
      console.log('Exercise already completed, ignoring duplicate completion');
      return;
    }

    try {
      // Optimistically update local state first for better UX
      const newCompletedExercises = new Set([...completedExercises, exerciseId]);
      setCompletedExercises(newCompletedExercises);

      // Save to local storage immediately
      const Storage = await import('../utils/storage');
      await Storage.default.setItem('completed_exercises', JSON.stringify([...newCompletedExercises]));

      // Mark exercise as completed in database
      await workoutPlanService.markExerciseCompleted(exerciseId, selectedDay.day, week);

      // Sync with progress service
      await syncProgressData();

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

  // Sync progress data with progress service
  const syncProgressData = async () => {
    try {
      const progressService = await import('../services/progressService');
      // @ts-ignore - syncWorkoutProgress method exists but TypeScript doesn't recognize it
      await progressService.default.syncWorkoutProgress({
        completedExercises: Array.from(completedExercises),
        completedDays: Array.from(completedDays),
        workoutPlan: workoutPlan
      });
    } catch (error) {
      console.warn('Failed to sync workout progress:', error);
    }
  };

  const handleDayPress = (day: WorkoutDay) => {
    setSelectedDay(day);
    onDayPress?.(day);
  };

  const handleExercisePress = (exercise: WorkoutExercise) => {
    setSelectedExercise(exercise);
    setExerciseModalVisible(true);
    onExercisePress?.(exercise);
  };

  const handleExerciseModalComplete = () => {
    if (selectedExercise && selectedDay) {
      handleExerciseComplete(selectedExercise);
    }
  };

  // Removed week cards per new design


  return (
    <DecorativeBackground>
      <View style={styles.container}>
      {/* Hero Header Section - Extraordinary redesign */}
      <View style={styles.heroSection}>
        <View style={styles.heroBackground}>
          <View style={styles.heroContent}>
            {/* Goal Badge */}
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>🎯 {workoutPlan.goal}</Text>
            </View>

            {/* Main Title */}
            <Text style={styles.heroSubtitle}>Week {getCurrentWeek()} of {getTotalWeeks()} • {workoutPlan.duration}</Text>

            {/* Progress Circle */}
            <View style={styles.progressCircleContainer}>
              <View style={styles.progressCircle}>
                <View style={[styles.progressCircleFill, {
                  transform: [{ rotate: `${(getProgressPercentage() / 100) * 360}deg` }]
                }]} />
                <View style={styles.progressCircleInner}>
                  <Text style={styles.progressCircleText}>{getProgressPercentage()}%</Text>
                  <Text style={styles.progressCircleLabel}>Complete</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Weekly Calendar Section - Premium Redesign */}
      <View style={styles.premiumCalendarSection}>
        <View style={styles.calendarHeader}>
          <View style={styles.calendarHeaderLeft}>
            <Text style={styles.calendarTitle}>This Week's Plan</Text>
            <Text style={styles.calendarSubtitle}>Week {getCurrentWeek()} of {getTotalWeeks()}</Text>
          </View>
          <View style={styles.weekIndicator}>
            <Text style={styles.weekIndicatorText}>W{getCurrentWeek()}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.calendarScrollView}
          contentContainerStyle={styles.calendarScrollContent}
        >
          {getCurrentWeekDays().map((day, index) => {
            const status = getDayStatus(day, index);
            const isToday = isCurrentDay(day);
            const isSelected = selectedDay?.day === day.day;

            return (
              <TouchableOpacity
                key={day.day}
                style={[
                  styles.premiumDayCard,
                  isToday && styles.premiumDayCardToday,
                  isSelected && styles.premiumDayCardSelected,
                  status === 'completed' && styles.premiumDayCardCompleted,
                  status === 'missed' && styles.premiumDayCardMissed,
                ]}
                onPress={() => handleDayPress(day)}
                activeOpacity={0.8}
              >
                {/* Background Glow Effect */}
                {isToday && <View style={styles.todayGlow} />}

                {/* Status Badge */}
                <View style={[styles.premiumStatusBadge,
                status === 'in_progress' && styles.premiumStatusBadgeProgress,
                status === 'completed' && styles.premiumStatusBadgeCompleted,
                status === 'missed' && styles.premiumStatusBadgeMissed,
                status === 'rest' && styles.premiumStatusBadgeRest,
                ]}>
                  {status === 'rest' ? (
                    <Text style={styles.premiumStatusIcon}>🏃‍♂️</Text>
                  ) : status === 'upcoming' ? (
                    <Text style={styles.premiumStatusIcon}>📅</Text>
                  ) : (
                    <Text style={[styles.premiumStatusPercentage,
                      status === 'completed' && styles.premiumStatusPercentageCompleted,
                      status === 'missed' && styles.premiumStatusPercentageMissed,
                      status === 'in_progress' && styles.premiumStatusPercentageProgress,
                    ]}>
                      {getDayCompletionPercentage(day)}%
                    </Text>
                  )}
                </View>

                {/* Day Info */}
                <View style={styles.dayInfo}>
                  <Text style={[styles.premiumDayName, isToday && styles.premiumDayNameToday]}>
                    {day.dayName.substring(0, 3)}
                  </Text>
                  <Text style={[styles.premiumDayDate, isToday && styles.premiumDayDateToday]}>
                    {formatDate(day.date)}
                  </Text>
                </View>

                {/* Exercise Info */}
                <View style={styles.exerciseInfoSection}>
                  {!day.isRestDay ? (
                    <>
                      <Text style={[styles.premiumExerciseCount, isToday && styles.premiumExerciseCountToday]}>
                        {day.exercises.length}
                      </Text>
                      <Text style={[styles.premiumExerciseLabel, isToday && styles.premiumExerciseLabelToday]}>
                        exercises
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.premiumExerciseCount, isToday && styles.premiumExerciseCountToday]}>
                        Active
                      </Text>
                      <Text style={[styles.premiumExerciseLabel, isToday && styles.premiumExerciseLabelToday]}>
                        recovery
                      </Text>
                    </>
                  )}
                </View>

                {/* Today Pulse Animation */}
                {isToday && (
                  <View style={styles.todayPulseContainer}>
                    <View style={styles.todayPulseRing} />
                    <View style={styles.todayPulseDot} />
                  </View>
                )}

                {/* Selection Indicator */}
                {isSelected && (
                  <View style={styles.selectionIndicator}>
                    <View style={styles.selectionDot} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Workout Details Section - Completely Redesigned */}
      <View style={styles.workoutDetailsSection}>
        <View style={styles.workoutHeader}>
          <View style={styles.workoutHeaderLeft}>
            <Text style={styles.workoutTitle}>
              {selectedDay?.isRestDay ? 'Active Recovery' :
                selectedDay && isCurrentDay(selectedDay) ? "Today's Workout" :
                  selectedDay ? `${selectedDay.dayName}'s Workout` : 'Select a Day'}
            </Text>
            {selectedDay && !selectedDay.isRestDay && (
              <Text style={styles.workoutSubtitle}>
                {selectedDay.exercises.length} exercises • {selectedDay.totalCalories} kcal
              </Text>
            )}
          </View>

          {selectedDay && !selectedDay.isRestDay && (
            <View style={styles.workoutProgress}>
              <Text style={styles.workoutProgressText}>
                {selectedDay.exercises.filter(exercise => {
                  const exerciseId = selectedDay.date ? `${selectedDay.date}-${exercise.name}` : `exercise-${selectedDay.exercises.indexOf(exercise)}`;
                  return completedExercises.has(exerciseId);
                }).length}/{selectedDay.exercises.length}
              </Text>
              <Text style={styles.workoutProgressLabel}>Complete</Text>
            </View>
          )}
        </View>

        {selectedDay && !selectedDay.isRestDay && (
          <ScrollView style={styles.exercisesContainer} showsVerticalScrollIndicator={false}>
            {selectedDay.exercises && selectedDay.exercises.length > 0 ? (
              selectedDay.exercises.map((exercise, index) => {
                const exerciseId = selectedDay.date ? `${selectedDay.date}-${exercise.name}` : `exercise-${index}`;
                const isCompleted = completedExercises.has(exerciseId);
                const dayStatus = getDayStatus(selectedDay, 0);

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.modernExerciseCard,
                      isCompleted && styles.modernExerciseCardCompleted,
                      dayStatus === 'missed' && styles.modernExerciseCardDisabled,
                    ]}
                    onPress={() => {
                      if (dayStatus === 'missed') return;
                      handleExercisePress(exercise);
                    }}
                    activeOpacity={0.8}
                    disabled={dayStatus === 'missed'}
                  >
                    {/* Exercise Number Badge */}
                    <View style={[styles.exerciseNumber, isCompleted && styles.exerciseNumberCompleted]}>
                      <Text style={[styles.exerciseNumberText, isCompleted && styles.exerciseNumberTextCompleted]}>
                        {index + 1}
                      </Text>
                    </View>

                    {/* Exercise Content */}
                    <View style={styles.modernExerciseContent}>
                      <View style={styles.modernExerciseHeader}>
                        <View style={styles.modernExerciseIcon}>
                          <Text style={styles.modernExerciseEmoji}>{exercise.emoji}</Text>
                        </View>

                        <View style={styles.modernExerciseInfo}>
                          <Text style={[styles.modernExerciseName, isCompleted && styles.modernExerciseNameCompleted]}>
                            {exercise.name}
                          </Text>
                          <Text style={[styles.modernExerciseStats, isCompleted && styles.modernExerciseStatsCompleted]}>
                            {exercise.sets} sets × {exercise.reps} reps
                          </Text>
                        </View>

                        {/* Action Button */}
                        <View style={styles.exerciseAction}>
                          {isCompleted ? (
                            <View style={styles.modernCompletedBadge}>
                              <Text style={styles.modernCompletedIcon}>✓</Text>
                            </View>
                          ) : dayStatus === 'in_progress' ? (
                            <TouchableOpacity
                              style={styles.modernStartButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleExercisePress(exercise);
                              }}
                            >
                              <Text style={styles.modernStartButtonText}>START</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.modernViewButton}>
                              <Text style={styles.modernViewButtonText}>VIEW</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Exercise Details */}
                      <View style={styles.modernExerciseDetails}>
                        <View style={styles.modernDetailItem}>
                          <Text style={styles.modernDetailIcon}>⏱️</Text>
                          <Text style={styles.modernDetailText}>{exercise.rest} rest</Text>
                        </View>
                        <View style={styles.modernDetailItem}>
                          <Text style={styles.modernDetailIcon}>🎯</Text>
                          <Text style={styles.modernDetailText}>{exercise.targetMuscles.slice(0, 2).join(', ')}</Text>
                        </View>
                        <View style={styles.modernDetailItem}>
                          <Text style={styles.modernDetailIcon}>🔥</Text>
                          <Text style={styles.modernDetailText}>{exercise.caloriesBurned} kcal</Text>
                        </View>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    {isCompleted && (
                      <View style={styles.exerciseProgressBar}>
                        <View style={styles.exerciseProgressFill} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyExercisesCard}>
                <Text style={styles.emptyExercisesIcon}>💪</Text>
                <Text style={styles.emptyExercisesTitle}>No exercises planned</Text>
                <Text style={styles.emptyExercisesText}>This day doesn't have any exercises scheduled</Text>
              </View>
            )}
          </ScrollView>
        )}

        {selectedDay?.isRestDay && (
          <View style={styles.restDayContainer}>
            <Text style={styles.restDayIcon}>🏃‍♂️</Text>
            <Text style={styles.restDayTitle}>Active Recovery Day</Text>
            <Text style={styles.restDayText}>
              Keep moving with light activities! Try a gentle jog, yoga session, or stretching routine to help your muscles recover while staying active.
            </Text>
            <View style={styles.recoveryActivities}>
              <View style={styles.activityItem}>
                <Text style={styles.activityIcon}>🧘‍♂️</Text>
                <Text style={styles.activityText}>Yoga (15-20 min)</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityIcon}>🚶‍♂️</Text>
                <Text style={styles.activityText}>Light Walk (20-30 min)</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityIcon}>🏃‍♂️</Text>
                <Text style={styles.activityText}>Easy Jog (15-25 min)</Text>
              </View>
            </View>
          </View>
        )}

        {!selectedDay && (
          <View style={styles.noDaySelectedContainer}>
            <Text style={styles.noDaySelectedText}>Please select a day from the calendar above</Text>
          </View>
        )}
      </View>

      {/* Exercise Detail Modal */}
      <ExerciseDetailScreen
        exercise={selectedExercise}
        visible={exerciseModalVisible}
        onClose={() => {
          setExerciseModalVisible(false);
          setSelectedExercise(null);
        }}
        onComplete={handleExerciseModalComplete}
        isCompleted={selectedExercise && selectedDay ?
          completedExercises.has(`${selectedDay.date}-${selectedExercise.name}`) : false}
        canComplete={selectedDay ? getDayStatus(selectedDay, 0) === 'in_progress' : false}
      />
      </View>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },

  // Hero Section - Extraordinary Design
  heroSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  heroBackground: {
    backgroundColor: colors.surface,
    position: 'relative',
  },
  heroContent: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  goalBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  goalBadgeText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '900',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  progressCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.cardBorder + '20',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressCircleFill: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: colors.primary,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  progressCircleInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  progressCircleText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '900',
    fontFamily: fonts.heading,
  },
  progressCircleLabel: {
    color: colors.mutedText,
    fontSize: 12,
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

  // Premium Calendar Section - Extraordinary Design
  premiumCalendarSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  calendarHeaderLeft: {
    flex: 1,
  },
  calendarTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  calendarSubtitle: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  weekIndicator: {
    backgroundColor: colors.primary + '20',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  weekIndicatorText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  calendarScrollView: {
    marginHorizontal: -spacing.lg,
  },
  calendarScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  // Premium Day Cards
  premiumDayCard: {
    width: 100,
    height: 140,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    position: 'relative',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  premiumDayCardToday: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
    borderWidth: 2,
    elevation: 8,
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  premiumDayCardSelected: {
    backgroundColor: colors.primary + '08',
    borderColor: colors.primary + '60',
    borderWidth: 2,
  },
  premiumDayCardCompleted: {
    backgroundColor: colors.green + '10',
    borderColor: colors.green + '40',
  },
  premiumDayCardMissed: {
    backgroundColor: colors.error + '10',
    borderColor: colors.error + '40',
  },

  // Today Glow Effect
  todayGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: colors.primary + '20',
    borderRadius: 24,
    zIndex: -1,
  },

  // Premium Status Badge
  premiumStatusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardBorder + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    elevation: 2,
  },
  premiumStatusBadgeProgress: {
    backgroundColor: colors.primary,
  },
  premiumStatusBadgeCompleted: {
    backgroundColor: colors.green,
  },
  premiumStatusBadgeMissed: {
    backgroundColor: colors.error,
  },
  premiumStatusBadgeRest: {
    backgroundColor: '#4A5568',
  },
  premiumStatusIcon: {
    fontSize: 16,
  },
  premiumStatusIconProgress: {
    fontSize: 18,
  },
  premiumStatusIconCompleted: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
  premiumStatusPercentage: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '900',
    fontFamily: fonts.heading,
  },
  premiumStatusPercentageCompleted: {
    color: colors.white,
  },
  premiumStatusPercentageMissed: {
    color: colors.error,
  },
  premiumStatusPercentageProgress: {
    color: colors.primary,
  },

  // Day Info Section
  dayInfo: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  premiumDayName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  premiumDayNameToday: {
    color: colors.primary,
  },
  premiumDayDate: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  premiumDayDateToday: {
    color: colors.primary + 'AA',
  },

  // Exercise Info Section
  exerciseInfoSection: {
    alignItems: 'center',
  },
  premiumExerciseCount: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
    fontFamily: fonts.heading,
    marginBottom: 2,
  },
  premiumExerciseCountToday: {
    color: colors.primary,
  },
  premiumExerciseLabel: {
    color: colors.mutedText,
    fontSize: 10,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  premiumExerciseLabelToday: {
    color: colors.primary + '80',
  },

  // Today Pulse Animation
  todayPulseContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayPulseRing: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary + '40',
  },
  todayPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  // Selection Indicator
  selectionIndicator: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  selectionDot: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },

  // Workout Details Section - Modern Design
  workoutDetailsSection: {
    paddingHorizontal: spacing.lg,
    flex: 1,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  workoutHeaderLeft: {
    flex: 1,
  },
  workoutTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  workoutSubtitle: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  workoutProgress: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  workoutProgressText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: fonts.heading,
  },
  workoutProgressLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  exercisesContainer: {
    flex: 1,
  },

  // Modern Exercise Cards
  modernExerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  modernExerciseCardCompleted: {
    backgroundColor: colors.green + '10',
    borderColor: colors.green + '40',
  },
  modernExerciseCardDisabled: {
    backgroundColor: colors.cardBorder + '20',
    borderColor: colors.cardBorder,
    opacity: 0.6,
  },
  exerciseNumber: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  exerciseNumberCompleted: {
    backgroundColor: colors.green,
  },
  exerciseNumberText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
    fontFamily: fonts.heading,
  },
  exerciseNumberTextCompleted: {
    color: colors.white,
  },
  modernExerciseContent: {
    padding: spacing.lg,
    paddingLeft: spacing.lg + 40,
  },
  modernExerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modernExerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  modernExerciseEmoji: {
    fontSize: 24,
  },
  modernExerciseInfo: {
    flex: 1,
  },
  modernExerciseName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  modernExerciseNameCompleted: {
    color: colors.mutedText,
    textDecorationLine: 'line-through',
  },
  modernExerciseStats: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  modernExerciseStatsCompleted: {
    color: colors.mutedText,
    opacity: 0.7,
  },
  exerciseAction: {
    alignItems: 'center',
  },
  modernCompletedBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernCompletedIcon: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  modernStartButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modernStartButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: fonts.heading,
    letterSpacing: 0.5,
  },
  modernViewButton: {
    backgroundColor: colors.cardBorder + '40',
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modernViewButtonText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  modernExerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder + '30',
  },
  modernDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernDetailIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  modernDetailText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
    flex: 1,
  },
  exerciseProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.cardBorder + '30',
  },
  exerciseProgressFill: {
    height: '100%',
    backgroundColor: colors.green,
    width: '100%',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  exerciseIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    elevation: 2,
  },
  exerciseEmoji: {
    fontSize: 28,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  exerciseDetails: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    fontWeight: '500',
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder + '30',
  },
  exerciseMuscles: {
    color: colors.mutedText,
    fontSize: 12,
    fontFamily: fonts.body,
    flex: 1,
    opacity: 0.8,
  },
  exerciseRightSection: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  caloriesText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  caloriesTextCompleted: {
    color: colors.mutedText,
    opacity: 0.7,
  },
  completeButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  completeButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  completedCheckmark: {
    color: colors.white,
    fontSize: 18,
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
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  restDayIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  restDayTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  restDayText: {
    color: colors.mutedText,
    fontSize: 16,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  recoveryActivities: {
    width: '100%',
    gap: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBorder + '20',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  activityIcon: {
    fontSize: 24,
  },
  activityText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.body,
    flex: 1,
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

  // Empty Exercises Card - Modern Design
  emptyExercisesCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyExercisesIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyExercisesTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyExercisesText: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 20,
  },

  // No Day Selected Styles
  noDaySelectedContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  noDaySelectedText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
});