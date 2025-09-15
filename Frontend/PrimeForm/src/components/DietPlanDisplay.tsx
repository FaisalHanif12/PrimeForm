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
import DailyProgressCard from './DailyProgressCard';
import MealDetailScreen from './MealDetailScreen';
import DecorativeBackground from './DecorativeBackground';

const { width: screenWidth } = Dimensions.get('window');

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

  // Expand the 7-day weekly pattern for the current week
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

    // Fallback to first day of current week
    setSelectedDay(currentWeekDays[0]);
  }, [dietPlan]);

  const loadCompletionStates = async () => {
    try {
      const stats = await dietPlanService.getDietStats();
      if (stats.success && stats.data) {
        console.log('📊 Loaded diet stats:', stats.data);
      }
    } catch (error) {
      console.warn('Could not load completion states:', error);
      
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
    
    // If day is completed, always show as completed
    if (completedDays.has(day.date)) {
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
      
      // If 60% or more completed, consider it completed, otherwise missed
      return completionPercentage >= 60 ? 'completed' : 'missed';
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
    return Math.round((completedMealsCount / dayMeals.length) * 100);
  };

  const isCurrentDay = (day: DietDay): boolean => {
    const today = new Date();
    const dayDate = new Date(day.date);
    return today.toDateString() === dayDate.toDateString();
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

  const logWaterIntake = async (amount: number) => {
    if (!selectedDay) return;
    
    const week = Math.ceil(selectedDay.day / 7);
    const newWaterIntake = { ...waterIntake, [selectedDay.date]: amount };
    setWaterIntake(newWaterIntake);
    
    try {
      const Storage = await import('../utils/storage');
      await Storage.default.setItem('water_intake', JSON.stringify(newWaterIntake));
      await dietPlanService.logWaterIntake(selectedDay.day, week, amount);
    } catch (error) {
      console.error('Error logging water intake:', error);
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
              <Text style={styles.waterTarget}>Target: {selectedDay.waterIntake}</Text>
              <View style={styles.waterButtons}>
                {[250, 500, 750, 1000].map(amount => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.waterButton}
                    onPress={() => logWaterIntake(amount)}
                  >
                    <Text style={styles.waterButtonText}>+{amount}ml</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.waterCurrent}>
                Today: {waterIntake[selectedDay.date] || 0}ml
              </Text>
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
    borderColor: colors.gold,
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
    backgroundColor: colors.gold + '10',
    borderColor: colors.gold,
    borderWidth: 2,
    elevation: 8,
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
    color: colors.gold,
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
