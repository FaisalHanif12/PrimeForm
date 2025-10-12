import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  DeviceEventEmitter
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { WorkoutPlan, WorkoutDay, WorkoutExercise } from '../services/aiWorkoutService';
import aiWorkoutService from '../services/aiWorkoutService';
import workoutPlanService from '../services/workoutPlanService';
import exerciseCompletionService from '../services/exerciseCompletionService';
import DailyProgressCard from './DailyProgressCard';
import WorkoutPlanCard from './WorkoutPlanCard';
import ExerciseDetailScreen from './ExerciseDetailScreen';
import ExerciseCompletionScreen from './ExerciseCompletionScreen';
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
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

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
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate week based on plan generation day
    // First week: from generation day to Sunday (inclusive)
    // Subsequent weeks: Monday to Sunday
    const startDayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    let calculatedWeek;
    if (daysDiff < 0) {
      // Future date - not started yet
      calculatedWeek = 1;
    } else if (daysDiff === 0) {
      // Generation day - week 1
      calculatedWeek = 1;
    } else {
      // Calculate which week we're in
      // First week: generation day to Sunday (if Sunday, only 1 day)
      // Special case: if plan starts on Sunday (0), first week is only Sunday
      const daysInFirstWeek = startDayOfWeek === 0 ? 1 : (7 - startDayOfWeek);
      
      if (daysDiff < daysInFirstWeek) {
        // Still in first week
        calculatedWeek = 1;
      } else {
        // Calculate subsequent weeks (Monday to Sunday cycles)
        const remainingDays = daysDiff - daysInFirstWeek;
        calculatedWeek = 1 + Math.floor(remainingDays / 7) + 1;
      }
    }
    
    console.log('📅 WorkoutPlanDisplay Week Calculation:', {
      today: today.toDateString(),
      startDate: startDate.toDateString(),
      daysDiff,
      startDayOfWeek,
      daysInFirstWeek: 7 - startDayOfWeek,
      calculatedWeek,
      completedDaysCount: completedDays.size,
      planGenerationDay: startDate.toLocaleDateString('en-US', { weekday: 'long' })
    });
    
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

  // Get today's day data by finding it from current week days
  const getTodaysDayData = () => {
    const currentWeekDays = getCurrentWeekDays();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find today's day from the current week days
    const todaysDay = currentWeekDays.find(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === today.getTime();
    });
    
    console.log('📅 WorkoutPlanDisplay Today Debug:', {
      today: today.toDateString(),
      todaysDay: todaysDay ? {
        dayName: todaysDay.dayName,
        date: todaysDay.date,
        day: todaysDay.day
      } : 'Not found',
      currentWeekDaysCount: currentWeekDays.length,
      firstDayInWeek: currentWeekDays[0]?.dayName,
      lastDayInWeek: currentWeekDays[currentWeekDays.length - 1]?.dayName
    });
    
    return todaysDay || null;
  };

  // Get current week's days data - Same logic as DietPlanDisplay
  const getCurrentWeekDays = () => {
    if (!workoutPlan.weeklyPlan || workoutPlan.weeklyPlan.length === 0) {
      return [];
    }
    
    const weekDays: WorkoutDay[] = [];
    const currentWeek = getCurrentWeek();
    const startDate = new Date(workoutPlan.startDate);
    const today = new Date();
    
    // If we're in week 1, show days from plan start date to end of first week
    if (currentWeek === 1) {
      const planStartDayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Special case: if plan starts on Sunday, only show Sunday for week 1
      if (planStartDayOfWeek === 0) {
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        // Workout plan starts with Monday at index 0, so Sunday is at index 6
        weekDays.push({
          ...workoutPlan.weeklyPlan[6], // Sunday is at index 6 for workout plans
          date: dateString,
          day: 1,
          dayName: 'Sunday'
        });
      } else {
        // Week 1: from plan generation day to Sunday (or end of available days)
        for (let i = 0; i < 7; i++) {
          const dayDate = new Date(startDate);
          dayDate.setDate(startDate.getDate() + i);
          dayDate.setHours(0, 0, 0, 0); // Reset time to avoid timezone issues
          
          // Format date in local timezone to avoid UTC offset issues
          const year = dayDate.getFullYear();
          const month = String(dayDate.getMonth() + 1).padStart(2, '0');
          const day = String(dayDate.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;
          
          // Workout plan: Monday=0, Tuesday=1, ..., Sunday=6
          // dayDate.getDay(): Sunday=0, Monday=1, ..., Saturday=6
          // Map: Sunday(0)->6, Monday(1)->0, Tuesday(2)->1, etc.
          const planIndex = dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1;
          
          if (planIndex < workoutPlan.weeklyPlan.length) {
            weekDays.push({
              ...workoutPlan.weeklyPlan[planIndex],
              date: dateString,
              day: i + 1,
              dayName: dayDate.toLocaleDateString('en-US', { weekday: 'long' })
            });
          }
          
          // Stop after reaching Sunday
          if (dayDate.getDay() === 0 && i > 0) {
            break;
          }
        }
      }
    } else {
      // Subsequent weeks: use Monday-Sunday pattern
      const currentMonday = new Date(today);
      currentMonday.setDate(today.getDate() - today.getDay() + 1); // Go to Monday of current week
      currentMonday.setHours(0, 0, 0, 0); // Reset time to avoid timezone issues
      
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(currentMonday);
        dayDate.setDate(currentMonday.getDate() + i);
        dayDate.setHours(0, 0, 0, 0); // Reset time to avoid timezone issues
        
        // Format date in local timezone to avoid UTC offset issues
        const year = dayDate.getFullYear();
        const month = String(dayDate.getMonth() + 1).padStart(2, '0');
        const day = String(dayDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        const planDayIndex = i % workoutPlan.weeklyPlan.length; // Cycle through the weekly plan
        
        weekDays.push({
          ...workoutPlan.weeklyPlan[planDayIndex],
          date: dateString,
          day: ((currentWeek - 1) * 7) + (i + 1),
          dayName: dayDate.toLocaleDateString('en-US', { weekday: 'long' })
        });
      }
    }
    
    console.log('📅 Workout Calendar Week Days:', {
      currentWeek,
      weekDaysCount: weekDays.length,
      firstDay: weekDays[0]?.dayName,
      lastDay: weekDays[weekDays.length - 1]?.dayName,
      completedDaysCount: completedDays.size
    });
    
    return weekDays;
  };

  useEffect(() => {
    // Initialize completion service and load states
    const initializeCompletion = async () => {
      try {
        await exerciseCompletionService.initialize();
        await loadCompletionStates();
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing completion service:', error);
        setIsInitialized(true);
      }
    };

    initializeCompletion();

    // Auto-select current day only
    const currentWeekDays = getCurrentWeekDays();
    const todaysDay = currentWeekDays.find(day => isCurrentDay(day));
    if (todaysDay) {
      setSelectedDay(todaysDay);
      } else {
      setSelectedDay(null);
    }
  }, [workoutPlan]);

  // Update progress percentage whenever current week changes
  useEffect(() => {
    const newProgress = getProgressPercentage();
    setProgressPercentage(newProgress);
    console.log('🔄 Progress updated (week-based):', newProgress + '%');
  }, [workoutPlan]);

  // Listen for progress updates from other screens and refresh local state
  useEffect(() => {
    const sub1 = DeviceEventEmitter.addListener('workoutProgressUpdated', async () => {
      console.log('🔔 Received workoutProgressUpdated event - refreshing completion state');
      await loadCompletionStates();
      const newProgress = getProgressPercentage();
      setProgressPercentage(newProgress);
    });

    const sub2 = DeviceEventEmitter.addListener('exerciseCompleted', async () => {
      console.log('🔔 Received exerciseCompleted event - refreshing completion state');
      await loadCompletionStates();
      const newProgress = getProgressPercentage();
      setProgressPercentage(newProgress);
    });

    const sub3 = DeviceEventEmitter.addListener('dayCompleted', async () => {
      console.log('🔔 Received dayCompleted event - refreshing completion state');
      await loadCompletionStates();
      const newProgress = getProgressPercentage();
      setProgressPercentage(newProgress);
    });

    return () => {
      try { sub1.remove(); } catch (_) {}
      try { sub2.remove(); } catch (_) {}
      try { sub3.remove(); } catch (_) {}
    };
  }, []);

  // Also refresh when screen regains focus (coming back from detail or other tabs)
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        await loadCompletionStates();
        const newProgress = getProgressPercentage();
        setProgressPercentage(newProgress);
      })();
    }, [])
  );

  const loadCompletionStates = async () => {
    try {
      console.log('🔄 Loading completion states...');
      
      // Get completion data from the service
      const completionData = exerciseCompletionService.getCompletionData();
      
      // Update local state
      setCompletedExercises(new Set(completionData.completedExercises));
      setCompletedDays(new Set(completionData.completedDays));
      
      console.log('✅ Completion states loaded:', {
        exercises: completionData.completedExercises.length,
        days: completionData.completedDays.length,
      });
    } catch (error) {
      console.error('❌ Error loading completion states:', error);
    }
  };

  const getProgressPercentage = (): number => {
    // Calculate progress based on weeks completed out of total weeks
    const totalWeeks = getTotalWeeks();
    const currentWeek = getCurrentWeek();
    
    if (totalWeeks <= 0) {
      console.log('📊 Progress: No total weeks, returning 0%');
      return 0;
    }
    
    // Progress = (Completed Weeks / Total Weeks) * 100
    // Week 1 = 0% (haven't completed any weeks yet)
    // Week 2 = 1/36 * 100 = 2.78% (completed 1 week)
    // Week 18 = 17/36 * 100 = 47.22% (completed 17 weeks)
    // Week 36 = 35/36 * 100 = 97.22% (completed 35 weeks)
    const completedWeeks = Math.max(0, currentWeek - 1);
    const actualProgress = (completedWeeks / totalWeeks) * 100;
    const roundedProgress = Math.round(Math.max(0, Math.min(100, actualProgress)));

    console.log('📊 Progress Calculation (Weeks Completed):', {
      totalWeeks,
      currentWeek,
      completedWeeks,
      actualProgress: actualProgress.toFixed(2),
      roundedProgress,
      progressArcDegrees: `${(roundedProgress / 100) * 360}deg`,
      formula: `${completedWeeks} / ${totalWeeks} * 100 = ${actualProgress.toFixed(2)}%`
    });

    return roundedProgress;
  };

  const getDayStatus = (day: WorkoutDay, index: number): 'completed' | 'rest' | 'upcoming' | 'missed' | 'in_progress' => {
    if (day.isRestDay) return 'rest';

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);
    const planStartDate = new Date(workoutPlan.startDate);
    planStartDate.setHours(0, 0, 0, 0);

    // Check if day is completed (50% completion criteria)
    if (completedDays.has(day.date)) {
      console.log('📊 Day Status: Day marked as completed in completedDays set:', day.date);
      return 'completed';
    }

    // Current day - show as in progress
    if (dayDate.getTime() === today.getTime()) {
      console.log('📊 Day Status: Current day - showing as in_progress:', day.date);
      return 'in_progress';
    }

    // Days before plan generation should be 'upcoming' (not missed)
    if (dayDate < planStartDate) {
      console.log('📊 Day Status: Day before plan start - showing as upcoming:', day.date);
      return 'upcoming';
    }

    // Days after plan generation but before today
    if (dayDate < today && dayDate >= planStartDate) {
      // Check completion percentage for the day
      const dayExercises = day.exercises.map(exercise => `${day.date}-${exercise.name}`);
      const completedExercisesCount = dayExercises.filter(exerciseId => completedExercises.has(exerciseId)).length;
      const completionPercentage = dayExercises.length > 0 ? (completedExercisesCount / dayExercises.length) * 100 : 0;

      console.log('📊 Day Status: Past day completion check:', {
        dayDate: day.date,
        totalExercises: dayExercises.length,
        completedExercises: completedExercisesCount,
        completionPercentage: completionPercentage.toFixed(2)
      });

      // Apply completion criteria: < 50% = missed, >= 50% = completed
      if (completionPercentage >= 50) return 'completed';
      if (completionPercentage < 50) return 'missed';
    }

    // Future days
    console.log('📊 Day Status: Future day - showing as upcoming:', day.date);
    return 'upcoming';
  };

  // Get completion percentage for a specific day
  const getDayCompletionPercentage = (day: WorkoutDay): number => {
    if (day.isRestDay) return 100; // Rest days are always 100% complete
    
    const dayExercises = day.exercises.map(exercise => `${day.date}-${exercise.name}`);
    const completedExercisesCount = dayExercises.filter(exerciseId => completedExercises.has(exerciseId)).length;
    const percentage = dayExercises.length > 0 ? (completedExercisesCount / dayExercises.length) * 100 : 0;
    
    console.log('📊 Day Completion Debug:', {
      dayDate: day.date,
      totalExercises: dayExercises.length,
      completedExercises: completedExercisesCount,
      percentage: percentage.toFixed(2),
      isCurrentDay: isCurrentDay(day)
    });
    
     // Always show actual percentage achieved (not 100% for completed days)
    return Math.round(percentage);
  };

  const isCurrentDay = (day: WorkoutDay): boolean => {
    const today = new Date();
    const dayDate = new Date(day.date);
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    dayDate.setHours(0, 0, 0, 0);
    
    return today.getTime() === dayDate.getTime();
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

    try {
      console.log('🎯 WorkoutPlanDisplay: Completing exercise:', { exerciseId, dayDate: selectedDay.date, dayNumber: selectedDay.day, weekNumber: week });

      // Mark exercise as completed using the service
      const success = await exerciseCompletionService.markExerciseCompleted(
        exerciseId,
        selectedDay.date,
        selectedDay.day,
        week
      );

      console.log('🎯 WorkoutPlanDisplay: Exercise completion service result:', success);

      if (success) {
        // Update local state immediately
        const newCompletedExercises = new Set([...completedExercises, exerciseId]);
        setCompletedExercises(newCompletedExercises);
        console.log('🎯 WorkoutPlanDisplay: Updated local completed exercises state');

        // Check if day meets completion criteria
      const dayExercises = selectedDay.exercises.map(ex => `${selectedDay.date}-${ex.name}`);
        const isDayFullyCompleted = exerciseCompletionService.isDayFullyCompleted(dayExercises, selectedDay.date);

        if (isDayFullyCompleted && !completedDays.has(selectedDay.date)) {
          // Mark day as completed
          const daySuccess = await exerciseCompletionService.markDayCompleted(
            selectedDay.date,
            selectedDay.day,
            week
          );

          if (daySuccess) {
        const newCompletedDays = new Set([...completedDays, selectedDay.date]);
        setCompletedDays(newCompletedDays);
            console.log(`🎉 Day ${selectedDay.day} completed!`);
          }
        }

        // Update progress percentage
        const newProgress = getProgressPercentage();
        setProgressPercentage(newProgress);

        // Broadcast progress update
        DeviceEventEmitter.emit('workoutProgressUpdated', {
          type: 'exercise_completed',
          exerciseId,
          date: selectedDay.date
        });

        console.log('✅ WorkoutPlanDisplay: Exercise completion processed successfully');
      } else {
        console.error('❌ WorkoutPlanDisplay: Failed to complete exercise');
      }
    } catch (error) {
      console.error('❌ WorkoutPlanDisplay: Error completing exercise:', error);
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

  const handleExerciseModalComplete = async () => {
    if (selectedExercise && selectedDay) {
      await handleExerciseComplete(selectedExercise);
      await loadCompletionStates();
    }
  };

  const handleShowCompletion = () => {
    setExerciseModalVisible(false);
    setCompletionModalVisible(true);
  };

  const handleBackToWorkout = () => {
    setCompletionModalVisible(false);
    setSelectedExercise(null);
  };

  const handleCloseCompletion = () => {
    setCompletionModalVisible(false);
    setSelectedExercise(null);
  };

  // Removed delete plan handler and button per new requirement

  // Removed week cards per new design


  return (
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
                {/* Background Circle */}
                <View style={styles.progressCircleBackground} />
                <View style={styles.progressCircleInner}>
                  <Text style={styles.progressCircleText}>{progressPercentage}%</Text>
                  <Text style={styles.progressCircleLabel}>Complete</Text>
                </View>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
              </View>
              <Text style={styles.progressBarText}>
                Week {getCurrentWeek()} of {getTotalWeeks()} • {progressPercentage}% Complete
              </Text>
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
                  status === 'in_progress' && styles.premiumDayCardInProgress,
                ]}
                onPress={() => handleDayPress(day)}
                activeOpacity={0.8}
              >
                {/* Background Glow Effect - Removed for cleaner look */}

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
                    <Text style={styles.premiumStatusIcon}>⏰</Text>
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
                        Rest
                      </Text>
                      <Text style={[styles.premiumExerciseLabel, isToday && styles.premiumExerciseLabelToday]}>
                        day
                      </Text>
                    </>
                  )}
                </View>

                {/* Today Pulse Animation */}
                {isToday && (
                  <View style={styles.todayPulseContainer}>
                    <View style={styles.todayPulseDot} />
                  </View>
                )}

                {/* Selection Indicator - Only for current day */}
                {isToday && isSelected && (
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
                  return exerciseCompletionService.isExerciseCompleted(exerciseId);
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
                const isCompleted = exerciseCompletionService.isExerciseCompleted(exerciseId);
                const dayStatus = getDayStatus(selectedDay, 0);
                const isToday = selectedDay && selectedDay.date ? isCurrentDay(selectedDay) : false;
                const canComplete = isToday && dayStatus === 'in_progress';

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.modernExerciseCard,
                      isCompleted && styles.modernExerciseCardCompleted,
                      !canComplete && styles.modernExerciseCardDisabled,
                    ]}
                    onPress={() => {
                      if (!canComplete) return;
                      handleExercisePress(exercise);
                    }}
                    activeOpacity={canComplete ? 0.8 : 1}
                    disabled={!canComplete}
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
                          ) : canComplete ? (
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
        onShowCompletion={handleShowCompletion}
        isCompleted={selectedExercise && selectedDay ?
          exerciseCompletionService.isExerciseCompleted(`${selectedDay.date}-${selectedExercise.name}`) : false}
        canComplete={selectedDay ? (isCurrentDay(selectedDay) && getDayStatus(selectedDay, 0) === 'in_progress') : false}
        selectedDay={selectedDay}
      />

      {/* Exercise Completion Modal */}
      <ExerciseCompletionScreen
        exercise={selectedExercise}
        visible={completionModalVisible}
        onClose={handleCloseCompletion}
        onBackToWorkout={handleBackToWorkout}
      />
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
    paddingBottom: 100, // Add bottom padding for BottomNavigation
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
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressCircleBackground: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: colors.cardBorder + '20',
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

  // Progress Bar Styles
  progressBarContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: colors.cardBorder + '30',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
    minWidth: 8, // Minimum width to show some progress
  },
  progressBarText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
  },

  // Week Cards Styles
  weekSection: {
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
    backgroundColor: 'transparent', // Remove background
    borderRadius: 20,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 0, // Remove border
    position: 'relative',
    elevation: 0, // Remove elevation
    shadowColor: 'transparent', // Remove shadow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  premiumDayCardToday: {
    backgroundColor: 'transparent', // Remove heavy background
    borderColor: colors.blue,
    borderWidth: 2,
    elevation: 0, // Remove elevation
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  premiumDayCardInProgress: {
    backgroundColor: 'transparent', // Remove heavy background
    borderColor: colors.blue + '60',
    borderWidth: 2,
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
    backgroundColor: colors.blue + '20',
    borderRadius: 24,
    zIndex: -1,
  },

  // Premium Status Badge
  premiumStatusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
    fontFamily: fonts.heading,
  },
  premiumStatusPercentageCompleted: {
    color: colors.white,
  },
  premiumStatusPercentageMissed: {
    color: colors.white,
  },
  premiumStatusPercentageProgress: {
    color: colors.white,
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
    color: colors.blue,
  },
  premiumDayDate: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  premiumDayDateToday: {
    color: colors.blue + 'AA',
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
    color: colors.blue,
  },
  premiumExerciseLabel: {
    color: colors.mutedText,
    fontSize: 10,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  premiumExerciseLabelToday: {
    color: colors.blue + '80',
  },

  // Today Pulse Animation
  todayPulseContainer: {
    position: 'absolute',
    top: -4,
    right: -6,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayPulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.blue,
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
    flex: 1,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingLeft: spacing.lg, // Only left padding to align with "This Week's Plan"
    paddingRight: spacing.lg,
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
    marginHorizontal: spacing.lg, // Keep horizontal margin for proper spacing
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
    marginHorizontal: spacing.lg, // Add horizontal margin for consistency
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
    marginHorizontal: spacing.lg, // Add horizontal margin for consistency
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

  // Delete Button Styles
  deleteButton: {
    backgroundColor: colors.error + '20',
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
});