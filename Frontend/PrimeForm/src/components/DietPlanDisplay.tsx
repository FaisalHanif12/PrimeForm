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
import { DietPlan, DietDay, DietMeal } from '../services/aiDietService';
import dietPlanService from '../services/dietPlanService';
import MealDetailScreen from './MealDetailScreen';
import DecorativeBackground from './DecorativeBackground';

interface DietPlanDisplayProps {
  dietPlan: DietPlan;
  onMealPress?: (meal: DietMeal) => void;
  onDayPress?: (day: DietDay) => void;
  onGenerateNew?: () => void;
  isGeneratingNew?: boolean;
}

export default function DietPlanDisplay({ 
  dietPlan, 
  onMealPress,
  onDayPress,
  onGenerateNew,
  isGeneratingNew = false
}: DietPlanDisplayProps) {
  const [selectedDay, setSelectedDay] = useState<DietDay | null>(null);
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [selectedMeal, setSelectedMeal] = useState<DietMeal | null>(null);
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const [waterIntake, setWaterIntake] = useState<{ [key: string]: number }>({});
  const [waterCompleted, setWaterCompleted] = useState<{ [key: string]: boolean }>({});

  // Safety checks for diet plan structure
  if (!dietPlan || !dietPlan.weeklyPlan || !Array.isArray(dietPlan.weeklyPlan)) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid diet plan data</Text>
      </View>
    );
  }

  // Helper functions - defined before useEffect
  const getCurrentWeek = (): number => {
    const today = new Date();
    const startDate = new Date(dietPlan.startDate);
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate week based on plan generation day (not Monday)
    // If plan starts mid-week, week 1 includes the generation day and forward
    const calculatedWeek = Math.floor(daysDiff / 7) + 1;
    
    console.log('📅 DietPlanDisplay Date Debug:', {
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
    if (dietPlan.totalWeeks) {
      return dietPlan.totalWeeks;
    }
    const startDate = new Date(dietPlan.startDate);
    const endDate = new Date(dietPlan.endDate);
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.ceil(daysDiff / 7));
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
    const start = new Date(dietPlan.startDate).getTime();
    const end = new Date(dietPlan.endDate).getTime();
    const now = Date.now();
    const timeProgress = end <= start ? 0 : Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
    
    // Use the higher of actual progress or time progress, but cap at time progress + 10%
    const finalProgress = Math.min(Math.max(actualProgress, timeProgress), timeProgress + 10);
    
    return Math.round(finalProgress);
  };

  // Get today's day data using the same logic as dashboard
  const getTodaysDayData = () => {
    if (!dietPlan.weeklyPlan || dietPlan.weeklyPlan.length === 0) {
      return null;
    }
    
    const today = new Date();
    const startDate = new Date(dietPlan.startDate);
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate week based on plan generation day (not Monday)
    const currentWeek = Math.floor(daysDiff / 7) + 1;
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0-6 where 0 = Monday
    
    console.log('📅 DietPlanDisplay Today Debug:', {
      today: today.toDateString(),
      startDate: startDate.toDateString(),
      daysDiff,
      currentWeek,
      dayOfWeek,
      adjustedDayOfWeek,
      planGenerationDay: startDate.toLocaleDateString('en-US', { weekday: 'long' })
    });
    
    // Get today's day data using the same logic as dashboard
    const todayMealData = dietPlan.weeklyPlan[adjustedDayOfWeek];
    
    if (todayMealData) {
      // Calculate the actual date for this day
      const todayDate = new Date();
      const dayDate = new Date(todayDate);
      dayDate.setDate(todayDate.getDate());
      
      return {
        ...todayMealData,
        date: dayDate.toISOString().split('T')[0],
        day: ((currentWeek - 1) * 7) + (adjustedDayOfWeek + 1) // Absolute day number for tracking
      };
    }
    
    return null;
  };

  // Expand the 7-day weekly pattern for the current week (for calendar display)
  const getCurrentWeekDays = () => {
    if (!dietPlan.weeklyPlan || dietPlan.weeklyPlan.length === 0) {
      return [];
    }
    
    const currentWeek = getCurrentWeek();
    const startDate = new Date(dietPlan.startDate);
    
    // Calculate week start based on plan generation day, not Monday
    // Week 1 starts from the plan generation day
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + ((currentWeek - 1) * 7));
    
    console.log('📅 Diet Calendar Debug:', {
      currentWeek,
      completedDaysCount: completedDays.size,
      completedWeeksCount: Math.floor(completedDays.size / 7),
      weekStartDate: weekStartDate.toISOString().split('T')[0],
      planGenerationDay: startDate.toLocaleDateString('en-US', { weekday: 'long' }),
      weekStartDay: weekStartDate.toLocaleDateString('en-US', { weekday: 'long' })
    });
    
    return dietPlan.weeklyPlan.map((day, index) => ({
      ...day,
      date: new Date(weekStartDate.getTime() + (index * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      day: ((currentWeek - 1) * 7) + (index + 1) // Absolute day number for tracking
    }));
  };

  useEffect(() => {
    loadCompletionStates();
    
    // Use the same logic as dashboard to get today's day data
    const todaysDay = getTodaysDayData();
    
    if (todaysDay) {
      console.log('📅 DietPlanDisplay Setting Today:', {
        dayName: todaysDay.dayName,
        date: todaysDay.date,
        mealCount: todaysDay.meals ? Object.keys(todaysDay.meals).length : 0
      });
      setSelectedDay(todaysDay);
      return;
    }

    // Fallback to first day of current week if today's data not found
    const currentWeekDays = getCurrentWeekDays();
    if (currentWeekDays.length > 0) {
      console.warn('Today\'s day data not found, using first day of week as fallback');
      setSelectedDay(currentWeekDays[0]);
    }
  }, [dietPlan]);

  const loadCompletionStates = async () => {
    try {
      // First try to load from the diet plan database
      const dietPlan = await dietPlanService.getActiveDietPlan();
      if (dietPlan.success && dietPlan.data) {
        console.log('📊 Loading completed meals from database:', dietPlan.data.completedMeals);
        if (dietPlan.data.completedMeals) {
          const mealIds = dietPlan.data.completedMeals.map((meal: any) => meal.mealId);
          setCompletedMeals(new Set(mealIds));
        }
        
        if (dietPlan.data.completedDays) {
          const dayIds = dietPlan.data.completedDays.map((day: any) => `${day.day}-${day.week}`);
          setCompletedDays(new Set(dayIds));
        }
      }

      // Also load from local storage as backup/sync
      try {
        const Storage = await import('../utils/storage');
        const cachedCompletedMeals = await Storage.default.getItem('completed_meals');
        const cachedCompletedDays = await Storage.default.getItem('completed_diet_days');
        const cachedWaterIntake = await Storage.default.getItem('water_intake');
        
        if (cachedCompletedMeals) {
          const localMeals = new Set<string>(JSON.parse(cachedCompletedMeals));
          console.log('📊 Loading completed meals from local storage:', Array.from(localMeals));
          
          // Merge with database data
          if (dietPlan.success && dietPlan.data && dietPlan.data.completedMeals) {
            const dbMeals = new Set<string>(dietPlan.data.completedMeals.map((meal: any) => meal.mealId));
            const mergedMeals = new Set<string>([...localMeals, ...dbMeals]);
            setCompletedMeals(mergedMeals);
            console.log('📊 Merged completed meals:', Array.from(mergedMeals));
          } else {
            setCompletedMeals(localMeals);
          }
        }
        
        if (cachedCompletedDays) {
          const localDays = new Set<string>(JSON.parse(cachedCompletedDays));
          console.log('📊 Loading completed days from local storage:', Array.from(localDays));
          
          // Merge with database data
          if (dietPlan.success && dietPlan.data && dietPlan.data.completedDays) {
            const dbDays = new Set<string>(dietPlan.data.completedDays.map((day: any) => `${day.day}-${day.week}`));
            const mergedDays = new Set<string>([...localDays, ...dbDays]);
            setCompletedDays(mergedDays);
            console.log('📊 Merged completed days:', Array.from(mergedDays));
          } else {
            setCompletedDays(localDays);
          }
        }
        
        if (cachedWaterIntake) {
          setWaterIntake(JSON.parse(cachedWaterIntake));
        }
        
        // Load water completion status
        const cachedWaterCompleted = await Storage.default.getItem('water_completed');
        if (cachedWaterCompleted) {
          setWaterCompleted(JSON.parse(cachedWaterCompleted));
        }
      } catch (storageError) {
        console.warn('Could not load from local storage:', storageError);
      }
    } catch (error) {
      console.warn('Could not load completion states from database:', error);
      
      // Fallback to local storage only
      try {
        const Storage = await import('../utils/storage');
        const cachedCompletedMeals = await Storage.default.getItem('completed_meals');
        const cachedCompletedDays = await Storage.default.getItem('completed_diet_days');
        const cachedWaterIntake = await Storage.default.getItem('water_intake');
        
        if (cachedCompletedMeals) {
          setCompletedMeals(new Set(JSON.parse(cachedCompletedMeals)));
        }
        if (cachedCompletedDays) {
          setCompletedDays(new Set(JSON.parse(cachedCompletedDays)));
        }
        if (cachedWaterIntake) {
          setWaterIntake(JSON.parse(cachedWaterIntake));
        }
        
        // Load water completion status
        const cachedWaterCompleted = await Storage.default.getItem('water_completed');
        if (cachedWaterCompleted) {
          setWaterCompleted(JSON.parse(cachedWaterCompleted));
        }
      } catch (storageError) {
        console.warn('Could not load from local storage:', storageError);
      }
    }
  };

  const getDayStatus = (day: DietDay, index: number): 'completed' | 'upcoming' | 'missed' | 'in_progress' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);
    const planStartDate = new Date(dietPlan.startDate);
    planStartDate.setHours(0, 0, 0, 0);
    
    // Check if day is completed (check both date format and day-week format)
    const isCompleted = completedDays.has(day.date) || 
                       completedDays.has(`${day.day}-${Math.ceil(day.day / 7)}`);
    
    if (isCompleted) {
      return 'completed';
    }
    
    // Current day is always in_progress
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
      const dayMeals = [
        `${day.date}-breakfast-${day.meals.breakfast.name}`,
        `${day.date}-lunch-${day.meals.lunch.name}`,
        `${day.date}-dinner-${day.meals.dinner.name}`,
        ...day.meals.snacks.map((snack, idx) => `${day.date}-snack-${snack.name}`)
      ];
      
      const completedMealsCount = dayMeals.filter(mealId => completedMeals.has(mealId)).length;
      const completionPercentage = (completedMealsCount / dayMeals.length) * 100;
      
      // Apply completion criteria: < 40% = missed, >= 60% = completed
      if (completionPercentage < 40) return 'missed';
      if (completionPercentage >= 60) return 'completed';
      return 'in_progress'; // 40-59% = in progress
    }
    
    // Future days
    return 'upcoming';
  };

  // Get completion percentage for a specific day
  const getDayCompletionPercentage = (day: DietDay): number => {
    const dayMeals = [
      `${day.date}-breakfast-${day.meals.breakfast.name}`,
      `${day.date}-lunch-${day.meals.lunch.name}`,
      `${day.date}-dinner-${day.meals.dinner.name}`,
      ...day.meals.snacks.map((snack, idx) => `${day.date}-snack-${snack.name}`)
    ];
    
    const completedMealsCount = dayMeals.filter(mealId => completedMeals.has(mealId)).length;
    const percentage = Math.round((completedMealsCount / dayMeals.length) * 100);
    
    // Apply completion criteria: < 40% = missed, >= 60% = completed, 40-59% = in progress
    if (percentage < 40) return 0; // Show as 0% for missed days
    if (percentage >= 60) return 100; // Show as 100% for completed days
    return percentage; // Show actual percentage for in-progress days
  };

  const isCurrentDay = (day: DietDay): boolean => {
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

  const handleMealComplete = async (meal: DietMeal, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    if (!selectedDay || !selectedDay.date) {
      console.warn('Cannot complete meal: selectedDay or selectedDay.date is null');
      return;
    }
    
    const mealId = `${selectedDay.date}-${mealType}-${meal.name}`;
    const week = Math.ceil(selectedDay.day / 7);
    
    // Prevent double-clicking by checking if already completed
    if (completedMeals.has(mealId)) {
      console.log('Meal already completed, ignoring duplicate completion');
      return;
    }
    
    try {
      const newCompletedMeals = new Set([...completedMeals, mealId]);
      setCompletedMeals(newCompletedMeals);
      
      const Storage = await import('../utils/storage');
      await Storage.default.setItem('completed_meals', JSON.stringify([...newCompletedMeals]));
      
      await dietPlanService.markMealCompleted(mealId, selectedDay.day, week, mealType);
      
      // Sync with progress service
      await syncProgressData();
      
      // Check if all meals for the day are completed
      const dayMeals = [
        `${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}`,
        `${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}`,
        `${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}`,
        ...selectedDay.meals.snacks.map((snack, index) => `${selectedDay.date}-snack-${snack.name}`)
      ];
      
      const allMealsCompleted = dayMeals.every(mealId => newCompletedMeals.has(mealId));
      
      if (allMealsCompleted) {
        await dietPlanService.markDayCompleted(selectedDay.day, week);
        const newCompletedDays = new Set([...completedDays, selectedDay.date]);
        setCompletedDays(newCompletedDays);
        
        await Storage.default.setItem('completed_diet_days', JSON.stringify([...newCompletedDays]));
        console.log(`🎉 Diet Day ${selectedDay.day} completed! All meals finished.`);
      }
    } catch (error) {
      console.error('Error marking meal completed:', error);
      setCompletedMeals(prev => {
        const reverted = new Set(prev);
        reverted.delete(mealId);
        return reverted;
      });
    }
  };

  // Sync progress data with progress service
  const syncProgressData = async () => {
    try {
      const progressService = await import('../services/progressService');
      // @ts-ignore - syncDietProgress method exists but TypeScript doesn't recognize it
      await progressService.default.syncDietProgress({
        completedMeals: Array.from(completedMeals),
        completedDays: Array.from(completedDays),
        dietPlan: dietPlan,
        waterIntake: waterIntake
      });
    } catch (error) {
      console.warn('Failed to sync diet progress:', error);
    }
  };

  const handleDayPress = (day: DietDay) => {
    setSelectedDay(day);
    onDayPress?.(day);
  };

  const handleMealPress = (meal: DietMeal, mealType: string) => {
    setSelectedMeal(meal);
    setMealModalVisible(true);
    onMealPress?.(meal);
  };

  const handleMealModalComplete = () => {
    // This will be implemented based on the meal type
    if (selectedMeal && selectedDay) {
      // Determine meal type and complete it
      let mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'breakfast';
      
      if (selectedDay.meals.breakfast.name === selectedMeal.name) mealType = 'breakfast';
      else if (selectedDay.meals.lunch.name === selectedMeal.name) mealType = 'lunch';
      else if (selectedDay.meals.dinner.name === selectedMeal.name) mealType = 'dinner';
      else mealType = 'snack';
      
      handleMealComplete(selectedMeal, mealType);
    }
  };

  const handleDeletePlan = async () => {
    try {
      console.log('🗑️ Deleting diet plan...');
      
      // Clear local storage
      const Storage = await import('../utils/storage');
      await Storage.default.removeItem('cached_diet_plan');
      await Storage.default.removeItem('completed_meals');
      await Storage.default.removeItem('completed_diet_days');
      await Storage.default.removeItem('water_intake');
      await Storage.default.removeItem('water_completed');
      
      // Delete from database
      if (dietPlan._id || dietPlan.id) {
        const planId = (dietPlan._id || dietPlan.id) as string;
        await dietPlanService.deleteDietPlan(planId);
        console.log('✅ Diet plan deleted from database');
      }
      
      // Call the onGenerateNew callback to refresh the parent component
      if (onGenerateNew) {
        onGenerateNew();
      }
      
      console.log('✅ Diet plan deleted successfully - returning to profile summary');
    } catch (error) {
      console.error('❌ Error deleting diet plan:', error);
    }
  };

  const toggleWaterCompletion = async () => {
    if (!selectedDay) return;
    
    const week = Math.ceil(selectedDay.day / 7);
    const isCompleted = waterCompleted[selectedDay.date] || false;
    const newWaterCompleted = { ...waterCompleted, [selectedDay.date]: !isCompleted };
    setWaterCompleted(newWaterCompleted);
    
    try {
      const Storage = await import('../utils/storage');
      await Storage.default.setItem('water_completed', JSON.stringify(newWaterCompleted));
      
      // Also update water intake amount when marking as completed
      const targetAmount = Number(selectedDay.waterIntake) || 2000;
      const newWaterIntake = { ...waterIntake, [selectedDay.date]: isCompleted ? 0 : targetAmount };
      setWaterIntake(newWaterIntake);
      await Storage.default.setItem('water_intake', JSON.stringify(newWaterIntake));
      
      await dietPlanService.logWaterIntake(selectedDay.day, week, isCompleted ? 0 : targetAmount);
      
      // Sync with progress service
      await syncProgressData();
    } catch (error) {
      console.error('Error toggling water completion:', error);
    }
  };

  return (
    <DecorativeBackground>
      <View style={styles.container}>
      {/* Hero Header Section - Diet Version */}
      <View style={styles.heroSection}>
        <View style={styles.heroBackground}>
          <View style={styles.heroContent}>
            {/* Goal Badge */}
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>🥗 {dietPlan.goal}</Text>
            </View>
            
            {/* Main Title */}
            
            <Text style={styles.heroSubtitle}>Week {getCurrentWeek()} of {getTotalWeeks()} • {dietPlan.duration}</Text>
            
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

            {/* Delete Button */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeletePlan}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteButtonText}>🗑️ Delete Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Weekly Calendar Section - Premium Design */}
      <View style={styles.premiumCalendarSection}>
        <View style={styles.calendarHeader}>
          <View style={styles.calendarHeaderLeft}>
            <Text style={styles.calendarTitle}>This Week's Nutrition</Text>
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
                ]}>
                  {status === 'upcoming' ? (
                    <Text style={styles.premiumStatusIcon}>🍽️</Text>
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
                
                {/* Calories Info */}
                <View style={styles.caloriesInfo}>
                  <Text style={[styles.premiumCaloriesCount, isToday && styles.premiumCaloriesCountToday]}>
                    {day.totalCalories}
                  </Text>
                  <Text style={[styles.premiumCaloriesLabel, isToday && styles.premiumCaloriesLabelToday]}>
                    kcal
                  </Text>
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

      {/* Diet Details Section */}
      <View style={styles.dietDetailsSection}>
        <View style={styles.dietHeader}>
          <View style={styles.dietHeaderLeft}>
            <Text style={styles.dietTitle}>
              {selectedDay && isCurrentDay(selectedDay) ? "Today's Meals" : 
               selectedDay ? `${selectedDay.dayName}'s Meals` : 'Select a Day'}
            </Text>
            {selectedDay && (
              <Text style={styles.dietSubtitle}>
                {selectedDay.totalCalories} kcal • {selectedDay.totalProtein}g protein
              </Text>
            )}
          </View>
          
          {selectedDay && (
            <View style={styles.nutritionProgress}>
              <Text style={styles.nutritionProgressText}>
                {selectedDay.totalCalories}
              </Text>
              <Text style={styles.nutritionProgressLabel}>kcal</Text>
            </View>
          )}
        </View>
        
        {selectedDay && (
          <ScrollView style={styles.mealsContainer} showsVerticalScrollIndicator={false}>
            {/* Breakfast */}
            <TouchableOpacity
              style={[
                styles.mealCard,
                completedMeals.has(`${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}`) && styles.mealCardCompleted
              ]}
              onPress={() => handleMealPress(selectedDay.meals.breakfast, 'breakfast')}
              activeOpacity={0.8}
            >
              <View style={styles.mealHeader}>
                <View style={styles.mealTimeSection}>
                  <Text style={[
                    styles.mealTime,
                    completedMeals.has(`${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}`) && styles.mealTimeCompleted
                  ]}>☀️ Breakfast</Text>
                  <Text style={[
                    styles.mealCalories,
                    completedMeals.has(`${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}`) && styles.mealCaloriesCompleted
                  ]}>{selectedDay.meals.breakfast.calories} kcal</Text>
                </View>
                
                <View style={styles.mealContent}>
                  <View style={styles.mealIcon}>
                    <Text style={styles.mealEmoji}>{selectedDay.meals.breakfast.emoji}</Text>
                  </View>
                  
                  <View style={styles.mealInfo}>
                    <Text style={[
                      styles.mealName,
                      completedMeals.has(`${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}`) && styles.mealNameCompleted
                    ]}>{selectedDay.meals.breakfast.name}</Text>
                    <Text style={[
                      styles.mealMacros,
                      completedMeals.has(`${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}`) && styles.mealMacrosCompleted
                    ]}>
                      P: {selectedDay.meals.breakfast.protein}g • C: {selectedDay.meals.breakfast.carbs}g • F: {selectedDay.meals.breakfast.fats}g
                    </Text>
                  </View>
                  
                  <View style={styles.mealAction}>
                    {completedMeals.has(`${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}`) ? (
                      <View style={styles.completedMealBadge}>
                        <Text style={styles.completedMealIcon}>✓</Text>
                      </View>
                    ) : getDayStatus(selectedDay, 0) === 'in_progress' ? (
                      <TouchableOpacity 
                        style={styles.completeMealButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleMealComplete(selectedDay.meals.breakfast, 'breakfast');
                        }}
                      >
                        <Text style={styles.completeMealButtonText}>✓</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
              
              {/* Progress Bar for Completed Meals - Same as Exercise */}
              {completedMeals.has(`${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}`) && (
                <View style={styles.mealProgressBar}>
                  <View style={styles.mealProgressFill} />
                </View>
              )}
            </TouchableOpacity>

            {/* Lunch */}
            <TouchableOpacity
              style={[
                styles.mealCard,
                completedMeals.has(`${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}`) && styles.mealCardCompleted
              ]}
              onPress={() => handleMealPress(selectedDay.meals.lunch, 'lunch')}
              activeOpacity={0.8}
            >
              <View style={styles.mealHeader}>
                <View style={styles.mealTimeSection}>
                  <Text style={[
                    styles.mealTime,
                    completedMeals.has(`${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}`) && styles.mealTimeCompleted
                  ]}>🌞 Lunch</Text>
                  <Text style={[
                    styles.mealCalories,
                    completedMeals.has(`${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}`) && styles.mealCaloriesCompleted
                  ]}>{selectedDay.meals.lunch.calories} kcal</Text>
                </View>
                
                <View style={styles.mealContent}>
                  <View style={styles.mealIcon}>
                    <Text style={styles.mealEmoji}>{selectedDay.meals.lunch.emoji}</Text>
                  </View>
                  
                  <View style={styles.mealInfo}>
                    <Text style={[
                      styles.mealName,
                      completedMeals.has(`${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}`) && styles.mealNameCompleted
                    ]}>{selectedDay.meals.lunch.name}</Text>
                    <Text style={[
                      styles.mealMacros,
                      completedMeals.has(`${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}`) && styles.mealMacrosCompleted
                    ]}>
                      P: {selectedDay.meals.lunch.protein}g • C: {selectedDay.meals.lunch.carbs}g • F: {selectedDay.meals.lunch.fats}g
                    </Text>
                  </View>
                  
                  <View style={styles.mealAction}>
                    {completedMeals.has(`${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}`) ? (
                      <View style={styles.completedMealBadge}>
                        <Text style={styles.completedMealIcon}>✓</Text>
                      </View>
                    ) : getDayStatus(selectedDay, 0) === 'in_progress' ? (
                      <TouchableOpacity 
                        style={styles.completeMealButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleMealComplete(selectedDay.meals.lunch, 'lunch');
                        }}
                      >
                        <Text style={styles.completeMealButtonText}>✓</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
              
              {/* Progress Bar for Completed Meals */}
              {completedMeals.has(`${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}`) && (
                <View style={styles.mealProgressBar}>
                  <View style={styles.mealProgressFill} />
                </View>
              )}
            </TouchableOpacity>

            {/* Dinner */}
            <TouchableOpacity
              style={[
                styles.mealCard,
                completedMeals.has(`${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}`) && styles.mealCardCompleted
              ]}
              onPress={() => handleMealPress(selectedDay.meals.dinner, 'dinner')}
              activeOpacity={0.8}
            >
              <View style={styles.mealHeader}>
                <View style={styles.mealTimeSection}>
                  <Text style={[
                    styles.mealTime,
                    completedMeals.has(`${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}`) && styles.mealTimeCompleted
                  ]}>🌙 Dinner</Text>
                  <Text style={[
                    styles.mealCalories,
                    completedMeals.has(`${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}`) && styles.mealCaloriesCompleted
                  ]}>{selectedDay.meals.dinner.calories} kcal</Text>
                </View>
                
                <View style={styles.mealContent}>
                  <View style={styles.mealIcon}>
                    <Text style={styles.mealEmoji}>{selectedDay.meals.dinner.emoji}</Text>
                  </View>
                  
                  <View style={styles.mealInfo}>
                    <Text style={[
                      styles.mealName,
                      completedMeals.has(`${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}`) && styles.mealNameCompleted
                    ]}>{selectedDay.meals.dinner.name}</Text>
                    <Text style={[
                      styles.mealMacros,
                      completedMeals.has(`${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}`) && styles.mealMacrosCompleted
                    ]}>
                      P: {selectedDay.meals.dinner.protein}g • C: {selectedDay.meals.dinner.carbs}g • F: {selectedDay.meals.dinner.fats}g
                    </Text>
                  </View>
                  
                  <View style={styles.mealAction}>
                    {completedMeals.has(`${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}`) ? (
                      <View style={styles.completedMealBadge}>
                        <Text style={styles.completedMealIcon}>✓</Text>
                      </View>
                    ) : getDayStatus(selectedDay, 0) === 'in_progress' ? (
                      <TouchableOpacity 
                        style={styles.completeMealButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleMealComplete(selectedDay.meals.dinner, 'dinner');
                        }}
                      >
                        <Text style={styles.completeMealButtonText}>✓</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
              
              {/* Progress Bar for Completed Meals */}
              {completedMeals.has(`${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}`) && (
                <View style={styles.mealProgressBar}>
                  <View style={styles.mealProgressFill} />
                </View>
              )}
            </TouchableOpacity>

            {/* Snacks */}
            {selectedDay.meals.snacks.map((snack, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.snackCard,
                  completedMeals.has(`${selectedDay.date}-snack-${snack.name}`) && styles.snackCardCompleted
                ]}
                onPress={() => handleMealPress(snack, 'snack')}
                activeOpacity={0.8}
              >
                <View style={styles.snackContent}>
                  <View style={styles.snackIcon}>
                    <Text style={styles.snackEmoji}>{snack.emoji}</Text>
                  </View>
                  
                  <View style={styles.snackInfo}>
                    <Text style={[
                      styles.snackName,
                      completedMeals.has(`${selectedDay.date}-snack-${snack.name}`) && styles.snackNameCompleted
                    ]}>🍎 Snack {index + 1}: {snack.name}</Text>
                    <Text style={[
                      styles.snackCalories,
                      completedMeals.has(`${selectedDay.date}-snack-${snack.name}`) && styles.snackCaloriesCompleted
                    ]}>{snack.calories} kcal</Text>
                  </View>
                  
                  <View style={styles.snackAction}>
                    {completedMeals.has(`${selectedDay.date}-snack-${snack.name}`) ? (
                      <View style={styles.completedSnackBadge}>
                        <Text style={styles.completedSnackIcon}>✓</Text>
                      </View>
                    ) : getDayStatus(selectedDay, 0) === 'in_progress' ? (
                      <TouchableOpacity 
                        style={styles.completeSnackButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleMealComplete(snack, 'snack');
                        }}
                      >
                        <Text style={styles.completeSnackButtonText}>✓</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
                
                {/* Progress Bar for Completed Snacks */}
                {completedMeals.has(`${selectedDay.date}-snack-${snack.name}`) && (
                  <View style={styles.snackProgressBar}>
                    <View style={styles.snackProgressFill} />
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Water Intake Section */}
            <View style={styles.waterSection}>
              <Text style={styles.waterTitle}>💧 Water Intake</Text>
              <Text style={styles.waterTarget}>Target: {selectedDay.waterIntake}ml</Text>
              
              <View style={styles.waterCompletionContainer}>
                <View style={styles.waterStatusInfo}>
                  <Text style={styles.waterStatusText}>
                    {waterCompleted[selectedDay.date] ? '✅ Completed' : '⏳ Due'}
                  </Text>
                  <Text style={styles.waterAmountText}>
                    {waterCompleted[selectedDay.date] ? selectedDay.waterIntake : 0}ml / {selectedDay.waterIntake}ml
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.waterCompletionButton,
                    waterCompleted[selectedDay.date] && styles.waterCompletionButtonCompleted
                  ]}
                  onPress={toggleWaterCompletion}
                >
                  <Text style={[
                    styles.waterCompletionButtonText,
                    waterCompleted[selectedDay.date] && styles.waterCompletionButtonTextCompleted
                  ]}>
                    {waterCompleted[selectedDay.date] ? 'Done' : 'Mark Done'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {!selectedDay && (
          <View style={styles.noDaySelectedContainer}>
            <Text style={styles.noDaySelectedText}>Please select a day from the calendar above</Text>
          </View>
        )}
      </View>

      {/* Meal Detail Modal */}
      <MealDetailScreen
        meal={selectedMeal}
        visible={mealModalVisible}
        onClose={() => {
          setMealModalVisible(false);
          setSelectedMeal(null);
        }}
        onComplete={handleMealModalComplete}
        isCompleted={selectedMeal && selectedDay ? 
          completedMeals.has(`${selectedDay.date}-breakfast-${selectedMeal.name}`) ||
          completedMeals.has(`${selectedDay.date}-lunch-${selectedMeal.name}`) ||
          completedMeals.has(`${selectedDay.date}-dinner-${selectedMeal.name}`) ||
          completedMeals.has(`${selectedDay.date}-snack-${selectedMeal.name}`) : false}
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
  
  // Hero Section - Diet Version
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
    backgroundColor: colors.gold + '20',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  goalBadgeText: {
    color: colors.gold,
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
    borderColor: 'transparent',
    borderTopColor: colors.gold,
    borderRightColor: colors.gold,
    transformOrigin: 'center',
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

  // Premium Calendar Section - Diet Version
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
    backgroundColor: colors.gold + '20',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold + '30',
  },
  weekIndicatorText: {
    color: colors.gold,
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
  
  // Premium Day Cards - Diet Version
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
    backgroundColor: 'transparent', // Remove background
    borderColor: colors.gold,
    borderWidth: 2,
    elevation: 0, // Remove elevation
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  premiumDayCardSelected: {
    backgroundColor: colors.gold + '08',
    borderColor: colors.gold + '60',
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
    backgroundColor: colors.gold + '20',
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
    backgroundColor: colors.gold,
  },
  premiumStatusBadgeCompleted: {
    backgroundColor: colors.green,
  },
  premiumStatusBadgeMissed: {
    backgroundColor: colors.error,
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
    color: colors.gold,
  },
  premiumDayDate: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  premiumDayDateToday: {
    color: colors.gold + 'AA',
  },
  
  // Calories Info Section
  caloriesInfo: {
    alignItems: 'center',
  },
  premiumCaloriesCount: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
    fontFamily: fonts.heading,
    marginBottom: 2,
  },
  premiumCaloriesCountToday: {
    color: colors.gold,
  },
  premiumCaloriesLabel: {
    color: colors.mutedText,
    fontSize: 10,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  premiumCaloriesLabelToday: {
    color: colors.gold + '80',
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
    backgroundColor: colors.gold + '40',
  },
  todayPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
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
    backgroundColor: colors.gold,
  },
  selectionDot: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },

  // Diet Details Section
  dietDetailsSection: {
    paddingHorizontal: spacing.lg,
    flex: 1,
  },
  dietHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  dietHeaderLeft: {
    flex: 1,
  },
  dietTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  dietSubtitle: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  nutritionProgress: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  nutritionProgressText: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: fonts.heading,
  },
  nutritionProgressLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  mealsContainer: {
    flex: 1,
  },

  // Meal Cards
  mealCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  mealCardCompleted: {
    backgroundColor: colors.green + '10',
    borderColor: colors.green + '40',
    opacity: 0.8,
  },
  mealHeader: {
    padding: spacing.lg,
  },
  mealTimeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mealTime: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  mealTimeCompleted: {
    color: colors.mutedText,
    textDecorationLine: 'line-through',
  },
  mealCalories: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  mealCaloriesCompleted: {
    color: colors.mutedText,
    textDecorationLine: 'line-through',
  },
  mealContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  mealEmoji: {
    fontSize: 24,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  mealNameCompleted: {
    color: colors.mutedText,
    textDecorationLine: 'line-through',
  },
  mealMacros: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  mealMacrosCompleted: {
    color: colors.mutedText + '80',
    textDecorationLine: 'line-through',
  },
  mealAction: {
    alignItems: 'center',
  },
  completedMealBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedMealIcon: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  completeMealButton: {
    backgroundColor: colors.gold,
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeMealButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },

  // Meal Progress Bar - Same as Exercise Progress Bar
  mealProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.cardBorder + '20',
  },
  mealProgressFill: {
    height: '100%',
    backgroundColor: colors.green,
    width: '100%',
  },

  // Snack Cards
  snackCard: {
    backgroundColor: colors.surface + '80',
    borderRadius: 16,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder + '50',
    elevation: 2,
    overflow: 'hidden',
  },
  snackCardCompleted: {
    backgroundColor: colors.green + '15',
    borderColor: colors.green + '30',
    opacity: 0.8,
  },
  snackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  snackIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gold + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  snackEmoji: {
    fontSize: 18,
  },
  snackInfo: {
    flex: 1,
  },
  snackName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginBottom: 2,
  },
  snackNameCompleted: {
    color: colors.mutedText,
    textDecorationLine: 'line-through',
  },
  snackCalories: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  snackCaloriesCompleted: {
    color: colors.mutedText + '60',
    textDecorationLine: 'line-through',
  },
  snackAction: {
    alignItems: 'center',
  },
  completedSnackBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedSnackIcon: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  completeSnackButton: {
    backgroundColor: colors.gold,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeSnackButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
  },

  // Snack Progress Bar
  snackProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.cardBorder + '20',
  },
  snackProgressFill: {
    height: '100%',
    backgroundColor: colors.green,
    width: '100%',
  },

  // Water Section
  waterSection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  waterTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  waterTarget: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
    marginBottom: spacing.md,
  },
  waterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  waterButton: {
    flex: 1,
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  waterButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  waterCurrent: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    textAlign: 'center',
  },

  // Water Completion Styles
  waterCompletionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  waterStatusInfo: {
    flex: 1,
  },
  waterStatusText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  waterAmountText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  waterCompletionButton: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  waterCompletionButtonCompleted: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  waterCompletionButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  waterCompletionButtonTextCompleted: {
    color: colors.white,
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
