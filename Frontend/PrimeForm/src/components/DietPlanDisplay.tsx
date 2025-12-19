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
import { DietPlan, DietDay, DietMeal } from '../services/aiDietService';
import dietPlanService from '../services/dietPlanService';
import mealCompletionService from '../services/mealCompletionService';
import { getUserCacheKey, getCurrentUserId } from '../utils/cacheKeys';
import aiDietService from '../services/aiDietService';
import { useLanguage } from '../context/LanguageContext';
import { showRewardedAd } from '../ads/showRewarded';
import { AdUnits } from '../ads/adUnits';
import Storage from '../utils/storage';

interface DietPlanDisplayProps {
  dietPlan: DietPlan;
  onMealPress?: (meal: DietMeal) => void;
  onDayPress?: (day: DietDay) => void;
  onGenerateNew?: () => void | Promise<void>;
  isGeneratingNew?: boolean;
}

export default function DietPlanDisplay({ 
  dietPlan, 
  onMealPress,
  onDayPress,
  onGenerateNew,
  isGeneratingNew = false
}: DietPlanDisplayProps) {
  const { t, language, transliterateText, translateDayName } = useLanguage();
  const [selectedDay, setSelectedDay] = useState<DietDay | null>(null);
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [waterIntake, setWaterIntake] = useState<{ [key: string]: number }>({});
  const [waterCompleted, setWaterCompleted] = useState<{ [key: string]: boolean }>({});
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

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
    // Calculate progress based on weeks completed out of total weeks (same as workout plan)
    const totalWeeks = getTotalWeeks();
    const currentWeek = getCurrentWeek();
    
    if (totalWeeks <= 0) {
      return 0;
    }
    
    // Progress = (Completed Weeks / Total Weeks) * 100
    // Week 1 = 0% (haven't completed any weeks yet)
    // Week 2 = 1/12 * 100 = 8.33% (completed 1 week)
    const completedWeeks = Math.max(0, currentWeek - 1);
    const actualProgress = (completedWeeks / totalWeeks) * 100;
    const roundedProgress = Math.round(Math.max(0, Math.min(100, actualProgress)));

    return roundedProgress;
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
    
    return todaysDay || null;
  };

  // Get current week's days data
  const getCurrentWeekDays = () => {
    if (!dietPlan.weeklyPlan || dietPlan.weeklyPlan.length === 0) {
      return [];
    }
    
    const weekDays: DietDay[] = [];
    const currentWeek = getCurrentWeek();
    
    // Parse startDate carefully to avoid timezone issues
    // If startDate is a string like "2025-12-16", parse it as local date
    let startDate: Date;
    if (typeof dietPlan.startDate === 'string') {
      const [year, month, day] = dietPlan.startDate.split('-').map(Number);
      startDate = new Date(year, month - 1, day); // month is 0-indexed
    } else {
      startDate = new Date(dietPlan.startDate);
    }
    startDate.setHours(0, 0, 0, 0); // Ensure it's at midnight local time
    
    // CRITICAL: Store the generation day of week to ensure we only show days from that day onwards
    const generationDayOfWeek = startDate.getDay();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // If we're in week 1, show days from plan start date (generation day) to Sunday
    if (currentWeek === 1) {
      const planStartDayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Special case: if plan starts on Sunday, only show Sunday for week 1
      if (planStartDayOfWeek === 0) {
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        weekDays.push({
          ...dietPlan.weeklyPlan[0], // Sunday is at index 0
          date: dateString,
          day: 1,
          dayName: 'Sunday'
        });
      } else {
        // Week 1: from plan generation day to Sunday (inclusive)
        // Calculate how many days from generation day to Sunday (inclusive)
        // If generation day is Monday (1), we need 7 days (Mon-Sun)
        // If generation day is Tuesday (2), we need 6 days (Tue-Sun)
        // If generation day is Wednesday (3), we need 5 days (Wed-Sun)
        // Formula: days needed = 7 - planStartDayOfWeek
        const daysUntilSunday = 7 - planStartDayOfWeek;
        
        // Start from generation day (i=0) and continue until we reach Sunday (inclusive)
        // i=0: generation day, i=daysUntilSunday: Sunday
        let dayCounter = 1; // Track day number starting from 1
        for (let i = 0; i <= daysUntilSunday; i++) {
          const dayDate = new Date(startDate);
          dayDate.setDate(startDate.getDate() + i);
          dayDate.setHours(0, 0, 0, 0); // Reset time to avoid timezone issues
          
          // CRITICAL: Only include days from generation day onwards
          // Skip any days that are before the generation day
          if (dayDate < startDate) {
            continue;
          }
          
          // CRITICAL: Verify this day's day of week matches what we expect
          // If generation day is Wednesday (3), we should only see days with getDay() >= 3 OR Sunday (0)
          const currentDayOfWeek = dayDate.getDay();
          // Skip days before generation day, but always include Sunday (0) if we're in week 1
          if (currentDayOfWeek < generationDayOfWeek && currentDayOfWeek !== 0 && generationDayOfWeek !== 0) {
            // Skip days before generation day (unless it's Sunday or generation day is Sunday)
            continue;
          }
          
          // Format date in local timezone to avoid UTC offset issues
          const year = dayDate.getFullYear();
          const month = String(dayDate.getMonth() + 1).padStart(2, '0');
          const day = String(dayDate.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;
          
          // Get the correct weeklyPlan index based on day of week (Sunday=0, Monday=1, etc.)
          const planIndex = currentDayOfWeek;
          
          // CRITICAL: Only add days that are on or after the generation day
          // This ensures we don't show days before the generation day
          // Include Sunday (0) even if generation day is a weekday
          const isValidDay = (currentDayOfWeek === 0) || (currentDayOfWeek >= generationDayOfWeek);
          if (planIndex < dietPlan.weeklyPlan.length && dayDate >= startDate && isValidDay) {
            weekDays.push({
              ...dietPlan.weeklyPlan[planIndex],
              date: dateString,
              day: dayCounter,
              dayName: dayDate.toLocaleDateString('en-US', { weekday: 'long' })
            });
            dayCounter++;
          }
        }
      }
    } else {
      // Subsequent weeks: use Monday-Sunday pattern
      // IMPORTANT: Show previous week until Monday starts (Sunday should show previous week)
      const todayDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // If today is Sunday (0), show the previous week (go back 6 days to get to Monday of previous week)
      // Otherwise, show the current week (Monday to Sunday)
      let weekStartMonday: Date;
      if (todayDayOfWeek === 0) {
        // It's Sunday - show previous week (go back 6 days to get to Monday of previous week)
        weekStartMonday = new Date(today);
        weekStartMonday.setDate(today.getDate() - 6); // Go to Monday of previous week
      } else {
        // It's Monday-Saturday - show current week
        weekStartMonday = new Date(today);
        weekStartMonday.setDate(today.getDate() - todayDayOfWeek + 1); // Go to Monday of current week
      }
      weekStartMonday.setHours(0, 0, 0, 0); // Reset time to avoid timezone issues
      
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStartMonday);
        dayDate.setDate(weekStartMonday.getDate() + i);
        dayDate.setHours(0, 0, 0, 0); // Reset time to avoid timezone issues
        
        // Format date in local timezone to avoid UTC offset issues
        const year = dayDate.getFullYear();
        const month = String(dayDate.getMonth() + 1).padStart(2, '0');
        const day = String(dayDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        // Map Monday-Sunday loop (i=0 to 6) to weeklyPlan array (Sunday=0, Monday=1, etc.)
        // i=0 (Monday) -> weeklyPlan[1], i=1 (Tuesday) -> weeklyPlan[2], ..., i=6 (Sunday) -> weeklyPlan[0]
        const planDayIndex = (i + 1) % dietPlan.weeklyPlan.length;
        
          weekDays.push({
          ...dietPlan.weeklyPlan[planDayIndex],
            date: dateString,
            day: ((currentWeek - 1) * 7) + (i + 1),
          dayName: dayDate.toLocaleDateString('en-US', { weekday: 'long' })
          });
      }
    }
    
    return weekDays;
  };

  useEffect(() => {
    const initializeComponent = async () => {
      // ✅ CRITICAL: Initialize meal completion service with retry logic
      try {
        await mealCompletionService.ensureInitialized();
      } catch (error) {
        console.error('❌ Error initializing meal completion in DietPlanDisplay:', error);
        // Retry once after delay
        try {
          await new Promise(resolve => setTimeout(resolve, 200));
          await mealCompletionService.initialize();
        } catch (retryError) {
          console.error('❌ Retry failed in DietPlanDisplay:', retryError);
        }
      }
      
      // ✅ Load completion states from prop data + local storage (NO API CALL)
      loadCompletionStatesFromProp();
      
      // Use the same logic as dashboard to get today's day data
      const todaysDay = getTodaysDayData();
      
      if (todaysDay) {
        setSelectedDay(todaysDay);
      } else {
        // Fallback to first day of current week if today's data not found
        const currentWeekDays = getCurrentWeekDays();
        if (currentWeekDays.length > 0) {
          setSelectedDay(currentWeekDays[0]);
        }
      }
      
      setIsInitialized(true);
    };
    
    initializeComponent();
  }, [dietPlan]);

  // ✅ OPTIMIZATION: Add focus effect to reload completion states when screen is focused
  // Only reload if data might have changed (e.g., after coming back from another screen)
  const lastFocusTime = React.useRef<number>(0);
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // ✅ OPTIMIZATION: Extended threshold to 30 seconds - completion states don't change frequently
      // This prevents unnecessary reloads on quick navigation while still syncing after longer absences
      if (isInitialized && now - lastFocusTime.current > 30000) {
        // ✅ Load from local storage only (NO API CALL)
        loadCompletionStatesFromLocalStorage();
        lastFocusTime.current = now;
      }
    }, [isInitialized])
  );

  // Listen for meal completion events and progress updates
  useEffect(() => {
    const mealCompletedListener = (event: any) => {
      // ✅ Update state directly from event data (NO API CALL)
      if (event.mealId) {
        setCompletedMeals(prev => new Set([...prev, event.mealId]));
      }
    };

    const dayCompletedListener = (event: any) => {
      // ✅ Update state directly from event data (NO API CALL)
      if (event.dayNumber && event.weekNumber) {
        const dayId = `${event.dayNumber}-${event.weekNumber}`;
        setCompletedDays(prev => new Set([...prev, dayId]));
      }
      // Also add by date format if available
      if (event.dayDate) {
        setCompletedDays(prev => new Set([...prev, event.dayDate]));
      }
    };

    const dietProgressUpdatedListener = async () => {
      // ✅ Just recalculate progress from current state (NO API CALL)
      const newProgress = getProgressPercentage();
      setProgressPercentage(newProgress);
    };

    const waterIntakeUpdatedListener = async () => {
      // ✅ Load from local storage only (NO API CALL), using user-specific keys
      try {
        const Storage = await import('../utils/storage');
        const { getUserCacheKey, getCurrentUserId } = await import('../utils/cacheKeys');
        const userId = await getCurrentUserId();
        const waterIntakeKey = userId ? await getUserCacheKey('water_intake', userId) : 'water_intake';
        const waterCompletedKey = userId ? await getUserCacheKey('water_completed', userId) : 'water_completed';

        const cachedWaterIntake = await Storage.default.getItem(waterIntakeKey);
        const cachedWaterCompleted = await Storage.default.getItem(waterCompletedKey);

        if (cachedWaterIntake) {
          setWaterIntake(JSON.parse(cachedWaterIntake));
        }
        if (cachedWaterCompleted) {
          setWaterCompleted(JSON.parse(cachedWaterCompleted));
        }
      } catch (error) {
        // Ignore errors
      }
    };

    const subscription1 = DeviceEventEmitter.addListener('mealCompleted', mealCompletedListener);
    const subscription2 = DeviceEventEmitter.addListener('dayCompleted', dayCompletedListener);
    const subscription3 = DeviceEventEmitter.addListener('dietProgressUpdated', dietProgressUpdatedListener);
    const subscription4 = DeviceEventEmitter.addListener('waterIntakeUpdated', waterIntakeUpdatedListener);

    return () => {
      subscription1?.remove();
      subscription2?.remove();
      subscription3?.remove();
      subscription4?.remove();
    };
  }, []);

  // Update progress percentage when completion states change
  useEffect(() => {
    const newProgressPercentage = getProgressPercentage();
    setProgressPercentage(newProgressPercentage);
  }, [completedDays]);

  // ✅ Load completion states from local storage only (NO API CALL)
  const loadCompletionStatesFromLocalStorage = async () => {
      try {
        const Storage = await import('../utils/storage');
        const { getUserCacheKey, getCurrentUserId } = await import('../utils/cacheKeys');
        const userId = await getCurrentUserId();

        const completedMealsKey = userId ? await getUserCacheKey('completed_meals', userId) : 'completed_meals';
        const completedDaysKey = userId ? await getUserCacheKey('completed_diet_days', userId) : 'completed_diet_days';
        const waterIntakeKey = userId ? await getUserCacheKey('water_intake', userId) : 'water_intake';
        const waterCompletedKey = userId ? await getUserCacheKey('water_completed', userId) : 'water_completed';

        const cachedCompletedMeals = await Storage.default.getItem(completedMealsKey);
        const cachedCompletedDays = await Storage.default.getItem(completedDaysKey);
        const cachedWaterIntake = await Storage.default.getItem(waterIntakeKey);
        const cachedWaterCompleted = await Storage.default.getItem(waterCompletedKey);
        
        if (cachedCompletedMeals) {
          const localMeals = new Set<string>(JSON.parse(cachedCompletedMeals));
          setCompletedMeals(localMeals);
        }
        
        if (cachedCompletedDays) {
          const localDays = new Set<string>(JSON.parse(cachedCompletedDays));
          setCompletedDays(localDays);
        }
        
        if (cachedWaterIntake) {
          setWaterIntake(JSON.parse(cachedWaterIntake));
        }
        
        if (cachedWaterCompleted) {
          setWaterCompleted(JSON.parse(cachedWaterCompleted));
        }
      } catch (storageError) {
        // Ignore errors
      }
  };

  // ✅ Load completion states from dietPlan prop + local storage (NO API CALL)
  const loadCompletionStatesFromProp = async () => {
    try {
      // Load from dietPlan prop (already has completedMeals and completedDays from initial API call)
      if (dietPlan.completedMeals && Array.isArray(dietPlan.completedMeals)) {
        // Handle both object format {mealId: string} and string array format
        const mealIds = dietPlan.completedMeals.map((meal: any) => 
          typeof meal === 'string' ? meal : (meal.mealId || meal)
        ).filter(Boolean);
        if (mealIds.length > 0) {
          setCompletedMeals(new Set(mealIds));
        }
      }
      
      if (dietPlan.completedDays && Array.isArray(dietPlan.completedDays)) {
        // Handle both object format {day: number, week: number} and string array format
        const dayIds = dietPlan.completedDays.map((day: any) => {
          if (typeof day === 'string') {
            return day;
          }
          return `${day.day}-${day.week}`;
        }).filter(Boolean);
        if (dayIds.length > 0) {
          setCompletedDays(new Set(dayIds));
        }
      }

      // Also load from local storage and merge
      try {
        const Storage = await import('../utils/storage');
        const { getUserCacheKey, getCurrentUserId } = await import('../utils/cacheKeys');
        const userId = await getCurrentUserId();

        const completedMealsKey = userId ? await getUserCacheKey('completed_meals', userId) : 'completed_meals';
        const completedDaysKey = userId ? await getUserCacheKey('completed_diet_days', userId) : 'completed_diet_days';
        const waterIntakeKey = userId ? await getUserCacheKey('water_intake', userId) : 'water_intake';
        const waterCompletedKey = userId ? await getUserCacheKey('water_completed', userId) : 'water_completed';

        const cachedCompletedMeals = await Storage.default.getItem(completedMealsKey);
        const cachedCompletedDays = await Storage.default.getItem(completedDaysKey);
        const cachedWaterIntake = await Storage.default.getItem(waterIntakeKey);
        const cachedWaterCompleted = await Storage.default.getItem(waterCompletedKey);
        
        if (cachedCompletedMeals) {
          const localMeals = new Set<string>(JSON.parse(cachedCompletedMeals));
          
          // Merge with prop data
          if (dietPlan.completedMeals && Array.isArray(dietPlan.completedMeals)) {
            const propMeals = new Set<string>(
              dietPlan.completedMeals.map((meal: any) => 
                typeof meal === 'string' ? meal : (meal.mealId || meal)
              ).filter(Boolean)
            );
            const mergedMeals = new Set<string>([...localMeals, ...propMeals]);
            setCompletedMeals(mergedMeals);
          } else {
            setCompletedMeals(localMeals);
          }
        }
        
        if (cachedCompletedDays) {
          const localDays = new Set<string>(JSON.parse(cachedCompletedDays));
          
          // Merge with prop data
          if (dietPlan.completedDays && Array.isArray(dietPlan.completedDays)) {
            const propDays = new Set<string>(
              dietPlan.completedDays.map((day: any) => {
                if (typeof day === 'string') {
                  return day;
                }
                return `${day.day}-${day.week}`;
              }).filter(Boolean)
            );
            const mergedDays = new Set<string>([...localDays, ...propDays]);
            setCompletedDays(mergedDays);
          } else {
            setCompletedDays(localDays);
          }
        }
        
        if (cachedWaterIntake) {
          setWaterIntake(JSON.parse(cachedWaterIntake));
        }
        
        if (cachedWaterCompleted) {
          setWaterCompleted(JSON.parse(cachedWaterCompleted));
        }
      } catch (storageError) {
        // Ignore errors
      }
    } catch (error) {
      // Fallback to local storage only
      await loadCompletionStatesFromLocalStorage();
    }
  };

  const getDayStatus = (day: DietDay, index: number): 'completed' | 'upcoming' | 'missed' | 'in_progress' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);
    const planStartDate = new Date(dietPlan.startDate);
    planStartDate.setHours(0, 0, 0, 0);
    
    // Check if day is completed (50% completion criteria)
    const dayMeals = [
      `${day.date}-breakfast-${day.meals.breakfast.name}`,
      `${day.date}-lunch-${day.meals.lunch.name}`,
      `${day.date}-dinner-${day.meals.dinner.name}`,
      ...day.meals.snacks.map((snack, idx) => `${day.date}-snack-${snack.name}`)
    ];
    
    const completedMealsCount = dayMeals.filter(mealId => completedMeals.has(mealId)).length;
    const completionPercentage = (completedMealsCount / dayMeals.length) * 100;
    
    // Current day is always in_progress regardless of completion
    if (dayDate.getTime() === today.getTime()) {
      return 'in_progress';
    }
    
    // Future days are always upcoming
    if (dayDate > today) {
      return 'upcoming';
    }
    
    // Past days: check completion based on 50% threshold
    if (dayDate < today) {
      // Apply completion criteria: < 50% = missed, >= 50% = completed
      if (completionPercentage >= 50) return 'completed';
      if (completionPercentage < 50) return 'missed';
    }
    
    // Default fallback
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
    
    // Always show actual percentage achieved
    return percentage;
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
      return;
    }
    
    // Only allow completion on current day
    if (!isCurrentDay(selectedDay)) {
      return;
    }
    
    const mealId = `${selectedDay.date}-${mealType}-${meal.name}`;
    const week = Math.ceil(selectedDay.day / 7);

    // ✅ CRITICAL: Check if this is breakfast and if ad needs to be shown
    // Only show ad for breakfast, once per day per user
    if (mealType === 'breakfast') {
      try {
        // Get user ID for user-specific ad tracking (preserved across login/logout)
        const userId = await getCurrentUserId();
        
        if (userId) {
          const today = new Date();
          const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD
          
          // ✅ CRITICAL: Use user-specific key for ad tracking (data isolation per account)
          const adWatchedKey = await getUserCacheKey(`diet_breakfast_ad_watched_${dateKey}`, userId);
          const hasWatchedAdToday = await Storage.getItem(adWatchedKey) === 'true';

          // If ad not watched today, show rewarded ad first
          if (!hasWatchedAdToday) {
            // Show rewarded ad before marking breakfast as complete
            showRewardedAd(AdUnits.rewardedDiet, {
              onEarned: async () => {
                // ✅ CRITICAL: Mark ad as watched for today (user-specific, preserved across login/logout)
                await Storage.setItem(adWatchedKey, 'true');
                // Proceed with marking breakfast as complete after ad is watched
                await proceedWithMealCompletion(meal, mealType, mealId, week);
              },
              onError: (error) => {
                console.error('Rewarded ad error:', error);
                // If ad fails, still allow meal completion (graceful degradation)
                proceedWithMealCompletion(meal, mealType, mealId, week);
              },
              onClosed: () => {
                // Ad was closed without watching - don't mark meal as complete
                // User can try again by clicking mark as eaten button
              }
            });
            return; // Exit early, meal will be marked complete after ad is watched
          }
        }
      } catch (error) {
        console.error('Error checking breakfast ad status:', error);
        // If error, proceed with meal completion (graceful degradation)
      }
    }

    // Not breakfast OR ad already watched today, proceed directly
    await proceedWithMealCompletion(meal, mealType, mealId, week);
  };

  // Separate function to handle the actual meal completion logic (prevents race conditions)
  const proceedWithMealCompletion = async (
    meal: DietMeal, 
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    mealId: string,
    week: number
  ) => {
    if (!selectedDay || !selectedDay.date) {
      return;
    }

    // ✅ CRITICAL: Prevent duplicate completion (race condition protection)
    if (completedMeals.has(mealId)) {
      console.log('⚠️ Meal already completed, skipping');
      return;
    }
    
    // Update UI immediately for better UX
    const newCompletedMeals = new Set([...completedMeals, mealId]);
    setCompletedMeals(newCompletedMeals);
    
    // Broadcast immediate UI update
    DeviceEventEmitter.emit('mealCompleted', {
      mealId,
      dayDate: selectedDay.date,
      dayNumber: selectedDay.day,
      weekNumber: week,
      mealType
    });
    
    // Use meal completion service in background
    const success = await mealCompletionService.markMealCompleted(
      mealId, 
      selectedDay.date, 
      selectedDay.day, 
      week, 
      mealType
    );
    
    if (success) {
      // Check if all meals for the day are completed (50% threshold)
      const dayMeals = [
        `${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}`,
        `${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}`,
        `${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}`,
        ...selectedDay.meals.snacks.map((snack, index) => `${selectedDay.date}-snack-${snack.name}`)
      ];
      
      const completedMealsCount = dayMeals.filter(id => newCompletedMeals.has(id)).length;
      const completionPercentage = (completedMealsCount / dayMeals.length) * 100;
      
      // Mark day as completed if >= 50% of meals are done
      if (completionPercentage >= 50 && !completedDays.has(selectedDay.date)) {
        // Update UI immediately
        const newCompletedDays = new Set([...completedDays, selectedDay.date]);
        setCompletedDays(newCompletedDays);
        
        // Broadcast day completion
        DeviceEventEmitter.emit('dayCompleted', {
          dayDate: selectedDay.date,
          dayNumber: selectedDay.day,
          weekNumber: week
        });
        
        // Save to backend
        const daySuccess = await mealCompletionService.markDayCompleted(
          selectedDay.date, 
          selectedDay.day, 
          week
        );
      }
      
      // Sync with progress service
      await syncProgressData();
    } else {
      // Revert UI change if backend failed
      const revertedMeals = new Set(completedMeals);
      revertedMeals.delete(mealId);
      setCompletedMeals(revertedMeals);
    }
  };

  // Sync progress data with progress service
  const syncProgressData = async () => {
    try {
      const progressService = await import('../services/progressService');
      await progressService.default.syncDietProgress({
        completedMeals: Array.from(completedMeals),
        completedDays: Array.from(completedDays),
        dietPlan: dietPlan,
        waterIntake: waterIntake
      });
      
      // Broadcast progress update to dashboard
      DeviceEventEmitter.emit('dietProgressUpdated', {
        completedMeals: Array.from(completedMeals),
        completedDays: Array.from(completedDays),
        totalMeals: dietPlan?.weeklyPlan?.reduce((total: number, day: any) => 
          total + 3 + (day.meals?.snacks?.length || 0), 0) || 0,
        progressPercentage: getProgressPercentage()
      });
    } catch (error) {
      // Ignore errors
    }
  };

  const handleDayPress = (day: DietDay) => {
    setSelectedDay(day);
    onDayPress?.(day);
  };

  const handleMealPress = (mealId: string) => {
    // Toggle expansion - if clicking same meal, collapse it; otherwise expand new one
    if (expandedMealId === mealId) {
      setExpandedMealId(null);
    } else {
      setExpandedMealId(mealId);
    }
  };


  const toggleWaterCompletion = async () => {
    if (!selectedDay) return;
    
    // ✅ CRITICAL: Only allow water intake completion on current day
    if (!isCurrentDay(selectedDay)) {
      return;
    }
    
    const week = Math.ceil(selectedDay.day / 7);
    const isCompleted = waterCompleted[selectedDay.date] || false;
    const newWaterCompleted = { ...waterCompleted, [selectedDay.date]: !isCompleted };
    
    // Update UI immediately for better UX
    setWaterCompleted(newWaterCompleted);
      
    // When marking as completed, set water intake to 100% of target (in ml)
    // When unmarking, set to 0
    const targetAmount = Number(selectedDay.waterIntake) || 3000; // Default to 3000ml (3L) if not specified
      const newWaterIntake = { ...waterIntake, [selectedDay.date]: isCompleted ? 0 : targetAmount };
      setWaterIntake(newWaterIntake);
    
    try {
      const Storage = await import('../utils/storage');
      const { getUserCacheKey, getCurrentUserId } = await import('../utils/cacheKeys');
      const userId = await getCurrentUserId();

      const waterIntakeKey = userId ? await getUserCacheKey('water_intake', userId) : 'water_intake';
      const waterCompletedKey = userId ? await getUserCacheKey('water_completed', userId) : 'water_completed';

      await Storage.default.setItem(waterCompletedKey, JSON.stringify(newWaterCompleted));
      await Storage.default.setItem(waterIntakeKey, JSON.stringify(newWaterIntake));
      
      // Broadcast water update
      DeviceEventEmitter.emit('waterIntakeUpdated', {
        date: selectedDay.date,
        completed: !isCompleted,
        amount: isCompleted ? 0 : targetAmount
      });
      
      // Sync with progress service
      await syncProgressData();
    } catch (error) {
      // Revert UI changes if backend failed
      setWaterCompleted(waterCompleted);
      setWaterIntake(waterIntake);
    }
  };

  return (
      <View style={styles.container}>
      {/* Hero Header Section - Diet Version */}
      <View style={styles.heroSection}>
        <View style={styles.heroBackground}>
          <View style={styles.heroContent}>
            {/* Goal Badge */}
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>🥗 {language === 'ur' ? transliterateText(dietPlan.goal) : dietPlan.goal}</Text>
            </View>
            
            {/* Main Title */}
            <Text style={styles.heroSubtitle}>{t('diet.week.of')} {getCurrentWeek()} {t('diet.week.of')} {getTotalWeeks()} • {language === 'ur' ? transliterateText(dietPlan.duration.split('(')[0].trim()) : dietPlan.duration.split('(')[0].trim()}</Text>
            
            {/* Progress Circle */}
            <View style={styles.progressCircleContainer}>
              <View style={styles.progressCircle}>
                {/* Background Circle */}
                <View style={styles.progressCircleBackground} />
                <View style={styles.progressCircleInner}>
                  <Text style={styles.progressCircleText}>{progressPercentage}%</Text>
                  <Text style={styles.progressCircleLabel}>{t('diet.complete')}</Text>
                </View>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressBarFill, { 
                  width: `${progressPercentage}%` 
                }]} />
              </View>
              <Text style={styles.progressBarText}>
                {t('diet.week.of')} {getCurrentWeek()} {t('diet.week.of')} {getTotalWeeks()} • {progressPercentage}% {t('diet.complete')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Weekly Calendar Section - Premium Design */}
      <View style={styles.premiumCalendarSection}>
        <View style={styles.calendarHeader}>
          <View style={styles.calendarHeaderLeft}>
            <Text style={styles.calendarTitle}>{t('diet.week.nutrition')}</Text>
            <Text style={styles.calendarSubtitle}>{t('diet.week.of')} {getCurrentWeek()} {t('diet.week.of')} {getTotalWeeks()}</Text>
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
                  status === 'completed' && styles.premiumDayCardCompleted,
                  status === 'missed' && styles.premiumDayCardMissed,
                  status === 'in_progress' && styles.premiumDayCardInProgress,
                  isSelected && styles.premiumDayCardSelected,
                  isToday && styles.premiumDayCardToday,
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
                  <Text style={[styles.premiumDayName, (isToday || isSelected) && styles.premiumDayNameToday]}>
                    {language === 'ur' ? translateDayName(day.dayName.substring(0, 3)) : day.dayName.substring(0, 3)}
                  </Text>
                  <Text style={[styles.premiumDayDate, (isToday || isSelected) && styles.premiumDayDateToday]}>
                    {formatDate(day.date)}
                  </Text>
                </View>
                
                {/* Calories Info */}
                <View style={styles.caloriesInfo}>
                  <Text style={[styles.premiumCaloriesCount, (isToday || isSelected) && styles.premiumCaloriesCountToday]}>
                    {day.totalCalories}
                  </Text>
                  <Text style={[styles.premiumCaloriesLabel, (isToday || isSelected) && styles.premiumCaloriesLabelToday]}>
                    {t('dashboard.stats.kcal')}
                  </Text>
                </View>
                
                {/* Today Pulse Animation */}
                {isToday && (
                  <View style={styles.todayPulseContainer}>
                    <View style={styles.todayPulseRing} />
                    <View style={styles.todayPulseDot} />
                  </View>
                )}
                
                {/* Selection Indicator - Blue circle in top right (matching workout page) */}
                {isSelected && !isToday && (
                  <View style={styles.todayPulseContainer}>
                    <View style={styles.todayPulseDot} />
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
              {selectedDay && isCurrentDay(selectedDay) ? t('diet.today.meals') : 
               selectedDay ? t('diet.day.meals').replace('{day}', language === 'ur' ? transliterateText(selectedDay.dayName) : selectedDay.dayName) : t('diet.select.day')}
            </Text>
            {selectedDay && (
              <Text style={styles.dietSubtitle}>
                {selectedDay.totalCalories} {t('dashboard.stats.kcal')} • {selectedDay.totalProtein}g {t('diet.protein')}
              </Text>
            )}
          </View>
          
          {selectedDay && (
            <View style={styles.nutritionProgress}>
              <Text style={styles.nutritionProgressText}>
                {selectedDay.totalCalories}
              </Text>
              <Text style={styles.nutritionProgressLabel}>{t('dashboard.stats.kcal')}</Text>
            </View>
          )}
        </View>
        
        {selectedDay && (
          <ScrollView style={styles.mealsContainer} showsVerticalScrollIndicator={false}>
            {/* Breakfast */}
            <View
              style={[
                styles.mealCard,
                completedMeals.has(`${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}`) && styles.mealCardCompleted
              ]}
            >
              <TouchableOpacity 
                style={styles.mealHeader}
                onPress={() => handleMealPress(`${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}`)}
                activeOpacity={0.7}
              >
                <View style={styles.mealTimeSection}>
                  <Text style={[
                    styles.mealTime,
                    completedMeals.has(`${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}`) && styles.mealTimeCompleted
                  ]}>☀️ {t('diet.breakfast')}</Text>
                  <Text style={[
                    styles.mealCalories,
                    completedMeals.has(`${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}`) && styles.mealCaloriesCompleted
                  ]}>{selectedDay.meals.breakfast.calories} {t('dashboard.stats.kcal')}</Text>
                </View>
                
                <View style={styles.mealContent}>
                  <View style={styles.mealIcon}>
                    <Text style={styles.mealEmoji}>{selectedDay.meals.breakfast.emoji}</Text>
                  </View>
                  
                  <View style={styles.mealInfo}>
                    <Text style={[
                      styles.mealName,
                      completedMeals.has(`${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}`) && styles.mealNameCompleted
                    ]}>{language === 'ur' ? transliterateText(selectedDay.meals.breakfast.name) : selectedDay.meals.breakfast.name}</Text>
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
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
              
              {/* Expandable Details Section */}
              {expandedMealId === `${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}` && (
                <View style={styles.expandedMealDetails}>
                  <View style={styles.detailDivider} />
                  
                  {/* Ingredients */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>🥘 {t('diet.ingredients')}</Text>
                    {selectedDay.meals.breakfast.ingredients.map((ingredient, idx) => (
                      <Text key={idx} style={styles.detailText}>• {language === 'ur' ? transliterateText(ingredient) : ingredient}</Text>
                    ))}
                  </View>
                  
                  {/* Instructions */}
                  {selectedDay.meals.breakfast.instructions && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>👨‍🍳 {t('diet.instructions')}</Text>
                      <Text style={styles.detailText}>{language === 'ur' ? transliterateText(selectedDay.meals.breakfast.instructions) : selectedDay.meals.breakfast.instructions}</Text>
                    </View>
                  )}
                  
                  {/* Mark as Eaten Button */}
                  {!completedMeals.has(`${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}`) && 
                   isCurrentDay(selectedDay) && getDayStatus(selectedDay, 0) === 'in_progress' && (
                    <TouchableOpacity 
                      style={styles.markEatenButton}
                      onPress={() => {
                        handleMealComplete(selectedDay.meals.breakfast, 'breakfast');
                        setExpandedMealId(null); // Collapse after marking
                      }}
                    >
                      <Text style={styles.markEatenButtonText}>{t('diet.mark.eaten')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {/* Progress Bar for Completed Meals */}
              {completedMeals.has(`${selectedDay.date}-breakfast-${selectedDay.meals.breakfast.name}`) && (
                <View style={styles.mealProgressBar}>
                  <View style={styles.mealProgressFill} />
                </View>
              )}
            </View>

            {/* Lunch */}
            <View
              style={[
                styles.mealCard,
                completedMeals.has(`${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}`) && styles.mealCardCompleted
              ]}
            >
              <TouchableOpacity 
                style={styles.mealHeader}
                onPress={() => handleMealPress(`${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}`)}
                activeOpacity={0.7}
              >
                <View style={styles.mealTimeSection}>
                  <Text style={[
                    styles.mealTime,
                    completedMeals.has(`${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}`) && styles.mealTimeCompleted
                  ]}>🌞 {t('diet.lunch')}</Text>
                  <Text style={[
                    styles.mealCalories,
                    completedMeals.has(`${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}`) && styles.mealCaloriesCompleted
                  ]}>{selectedDay.meals.lunch.calories} {t('dashboard.stats.kcal')}</Text>
                </View>
                
                <View style={styles.mealContent}>
                  <View style={styles.mealIcon}>
                    <Text style={styles.mealEmoji}>{selectedDay.meals.lunch.emoji}</Text>
                  </View>
                  
                  <View style={styles.mealInfo}>
                    <Text style={[
                      styles.mealName,
                      completedMeals.has(`${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}`) && styles.mealNameCompleted
                    ]}>{language === 'ur' ? transliterateText(selectedDay.meals.lunch.name) : selectedDay.meals.lunch.name}</Text>
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
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
              
              {/* Expandable Details Section */}
              {expandedMealId === `${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}` && (
                <View style={styles.expandedMealDetails}>
                  <View style={styles.detailDivider} />
                  
                  {/* Ingredients */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>🥘 {t('diet.ingredients')}</Text>
                    {selectedDay.meals.lunch.ingredients.map((ingredient, idx) => (
                      <Text key={idx} style={styles.detailText}>• {language === 'ur' ? transliterateText(ingredient) : ingredient}</Text>
                    ))}
                  </View>
                  
                  {/* Instructions */}
                  {selectedDay.meals.lunch.instructions && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>👨‍🍳 {t('diet.instructions')}</Text>
                      <Text style={styles.detailText}>{language === 'ur' ? transliterateText(selectedDay.meals.lunch.instructions) : selectedDay.meals.lunch.instructions}</Text>
                    </View>
                  )}
                  
                  {/* Mark as Eaten Button */}
                  {!completedMeals.has(`${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}`) && 
                   isCurrentDay(selectedDay) && getDayStatus(selectedDay, 0) === 'in_progress' && (
                    <TouchableOpacity 
                      style={styles.markEatenButton}
                      onPress={() => {
                        handleMealComplete(selectedDay.meals.lunch, 'lunch');
                        setExpandedMealId(null);
                      }}
                    >
                      <Text style={styles.markEatenButtonText}>{t('diet.mark.eaten')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {/* Progress Bar for Completed Meals */}
              {completedMeals.has(`${selectedDay.date}-lunch-${selectedDay.meals.lunch.name}`) && (
                <View style={styles.mealProgressBar}>
                  <View style={styles.mealProgressFill} />
                </View>
              )}
            </View>

            {/* Dinner */}
            <View
              style={[
                styles.mealCard,
                completedMeals.has(`${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}`) && styles.mealCardCompleted
              ]}
            >
              <TouchableOpacity 
                style={styles.mealHeader}
                onPress={() => handleMealPress(`${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}`)}
                activeOpacity={0.7}
              >
                <View style={styles.mealTimeSection}>
                  <Text style={[
                    styles.mealTime,
                    completedMeals.has(`${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}`) && styles.mealTimeCompleted
                  ]}>🌙 {t('diet.dinner')}</Text>
                  <Text style={[
                    styles.mealCalories,
                    completedMeals.has(`${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}`) && styles.mealCaloriesCompleted
                  ]}>{selectedDay.meals.dinner.calories} {t('dashboard.stats.kcal')}</Text>
                </View>
                
                <View style={styles.mealContent}>
                  <View style={styles.mealIcon}>
                    <Text style={styles.mealEmoji}>{selectedDay.meals.dinner.emoji}</Text>
                  </View>
                  
                  <View style={styles.mealInfo}>
                    <Text style={[
                      styles.mealName,
                      completedMeals.has(`${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}`) && styles.mealNameCompleted
                    ]}>{language === 'ur' ? transliterateText(selectedDay.meals.dinner.name) : selectedDay.meals.dinner.name}</Text>
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
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
              
              {/* Expandable Details Section */}
              {expandedMealId === `${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}` && (
                <View style={styles.expandedMealDetails}>
                  <View style={styles.detailDivider} />
                  
                  {/* Ingredients */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>🥘 {t('diet.ingredients')}</Text>
                    {selectedDay.meals.dinner.ingredients.map((ingredient, idx) => (
                      <Text key={idx} style={styles.detailText}>• {language === 'ur' ? transliterateText(ingredient) : ingredient}</Text>
                    ))}
                  </View>
                  
                  {/* Instructions */}
                  {selectedDay.meals.dinner.instructions && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>👨‍🍳 {t('diet.instructions')}</Text>
                      <Text style={styles.detailText}>{language === 'ur' ? transliterateText(selectedDay.meals.dinner.instructions) : selectedDay.meals.dinner.instructions}</Text>
                    </View>
                  )}
                  
                  {/* Mark as Eaten Button */}
                  {!completedMeals.has(`${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}`) && 
                   isCurrentDay(selectedDay) && getDayStatus(selectedDay, 0) === 'in_progress' && (
                    <TouchableOpacity 
                      style={styles.markEatenButton}
                      onPress={() => {
                        handleMealComplete(selectedDay.meals.dinner, 'dinner');
                        setExpandedMealId(null);
                      }}
                    >
                      <Text style={styles.markEatenButtonText}>{t('diet.mark.eaten')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {/* Progress Bar for Completed Meals */}
              {completedMeals.has(`${selectedDay.date}-dinner-${selectedDay.meals.dinner.name}`) && (
                <View style={styles.mealProgressBar}>
                  <View style={styles.mealProgressFill} />
                </View>
              )}
            </View>

            {/* Snacks */}
            {selectedDay.meals.snacks.map((snack, index) => {
              const snackId = `${selectedDay.date}-snack-${snack.name}`;
              return (
              <View
                key={index}
                style={[
                  styles.snackCard,
                  completedMeals.has(snackId) && styles.snackCardCompleted
                ]}
              >
                <TouchableOpacity 
                  style={styles.snackContent}
                  onPress={() => handleMealPress(snackId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.snackIcon}>
                    <Text style={styles.snackEmoji}>{snack.emoji}</Text>
                  </View>
                  
                  <View style={styles.snackInfo}>
                    <Text style={[
                      styles.snackName,
                      completedMeals.has(snackId) && styles.snackNameCompleted
                    ]}>🍎 {t('diet.snack')} {index + 1}: {language === 'ur' ? transliterateText(snack.name) : snack.name}</Text>
                    <Text style={[
                      styles.snackCalories,
                      completedMeals.has(snackId) && styles.snackCaloriesCompleted
                    ]}>{snack.calories} {t('dashboard.stats.kcal')}</Text>
                  </View>
                  
                  <View style={styles.snackAction}>
                    {completedMeals.has(snackId) ? (
                      <View style={styles.completedSnackBadge}>
                        <Text style={styles.completedSnackIcon}>✓</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
                
                {/* Expandable Details Section */}
                {expandedMealId === snackId && (
                  <View style={styles.expandedMealDetails}>
                    <View style={styles.detailDivider} />
                    
                    {/* Ingredients */}
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>🥘 {t('diet.ingredients')}</Text>
                      {snack.ingredients.map((ingredient, idx) => (
                        <Text key={idx} style={styles.detailText}>• {language === 'ur' ? transliterateText(ingredient) : ingredient}</Text>
                      ))}
                    </View>
                    
                    {/* Instructions */}
                    {snack.instructions && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>👨‍🍳 {t('diet.instructions')}</Text>
                        <Text style={styles.detailText}>{language === 'ur' ? transliterateText(snack.instructions) : snack.instructions}</Text>
                      </View>
                    )}
                    
                    {/* Mark as Eaten Button */}
                    {!completedMeals.has(snackId) && 
                     isCurrentDay(selectedDay) && getDayStatus(selectedDay, 0) === 'in_progress' && (
                      <TouchableOpacity 
                        style={styles.markEatenButton}
                        onPress={() => {
                          handleMealComplete(snack, 'snack');
                          setExpandedMealId(null);
                        }}
                      >
                        <Text style={styles.markEatenButtonText}>{t('diet.mark.eaten')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                
                {/* Progress Bar for Completed Snacks */}
                {completedMeals.has(snackId) && (
                  <View style={styles.snackProgressBar}>
                    <View style={styles.snackProgressFill} />
                  </View>
                )}
              </View>
            );
            })}

            {/* Water Intake Section */}
            <View style={styles.waterSection}>
              <Text style={styles.waterTitle}>💧 {t('diet.water.intake')}</Text>
              <Text style={styles.waterTarget}>{t('diet.water.target')} {selectedDay.waterIntake}ml</Text>
              
              <View style={styles.waterCompletionContainer}>
                <View style={styles.waterStatusInfo}>
                  <Text style={styles.waterStatusText}>
                    {waterCompleted[selectedDay.date] ? `✅ ${t('diet.water.completed')}` : `⏳ ${t('diet.water.due')}`}
                  </Text>
                  <Text style={styles.waterAmountText}>
                    {waterCompleted[selectedDay.date] 
                      ? `${((waterIntake[selectedDay.date] || Number(selectedDay.waterIntake) || 3000) / 1000).toFixed(1)}L` 
                      : `${((waterIntake[selectedDay.date] || 0) / 1000).toFixed(1)}L`} / {((Number(selectedDay.waterIntake) || 3000) / 1000).toFixed(1)}L
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.waterCompletionButton,
                    waterCompleted[selectedDay.date] && styles.waterCompletionButtonCompleted,
                    (waterCompleted[selectedDay.date] || !isCurrentDay(selectedDay)) && styles.waterCompletionButtonDisabled
                  ]}
                  onPress={(waterCompleted[selectedDay.date] || !isCurrentDay(selectedDay)) ? undefined : toggleWaterCompletion}
                  disabled={waterCompleted[selectedDay.date] || !isCurrentDay(selectedDay)}
                  activeOpacity={(waterCompleted[selectedDay.date] || !isCurrentDay(selectedDay)) ? 1 : 0.7}
                >
                  <Text style={[
                    styles.waterCompletionButtonText,
                    waterCompleted[selectedDay.date] && styles.waterCompletionButtonTextCompleted,
                    !isCurrentDay(selectedDay) && styles.waterCompletionButtonTextDisabled
                  ]}>
                    {waterCompleted[selectedDay.date] ? t('diet.water.done') : !isCurrentDay(selectedDay) ? t('diet.water.not.available') : t('diet.water.mark.done')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {!selectedDay && (
          <View style={styles.noDaySelectedContainer}>
            <Text style={styles.noDaySelectedText}>{t('diet.select.day.message')}</Text>
          </View>
        )}
      </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingBottom: 100, // Add bottom padding for BottomNavigation
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
    backgroundColor: colors.gold,
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
    backgroundColor: '#000000', // Black background
    borderWidth: 0, // Remove border
    elevation: 0, // Remove elevation
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  premiumDayCardSelected: {
    backgroundColor: 'transparent',
    borderColor: '#4ADE80', // Light green color
    borderWidth: 2,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  premiumDayCardCompleted: {
    backgroundColor: colors.green + '10',
    borderColor: colors.green + '40',
  },
  premiumDayCardMissed: {
    backgroundColor: colors.error + '10',
    borderColor: colors.error + '40',
  },
  premiumDayCardInProgress: {
    backgroundColor: colors.blue + '10',
    borderColor: colors.blue + '60',
    borderWidth: 2,
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
    color: colors.white,
  },
  premiumDayDate: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  premiumDayDateToday: {
    color: colors.mutedText,
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
    color: colors.white,
  },
  premiumCaloriesLabel: {
    color: colors.mutedText,
    fontSize: 10,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  premiumCaloriesLabelToday: {
    color: colors.mutedText,
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
  todayPulseRing: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.blue + '40',
  },
  todayPulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.blue,
  },
  
  // Selection Indicator - Removed (using blue circle in top right instead, matching workout page)

  // Diet Details Section
  dietDetailsSection: {
    flex: 1,
  },
  dietHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingLeft: spacing.lg, // Only left padding to align with "This Week's Plan"
    paddingRight: spacing.lg,
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
    marginHorizontal: spacing.lg, // Add horizontal margin for proper spacing
    borderWidth: 1,
    borderColor: colors.cardBorder,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg, // Add horizontal margin for proper spacing
    borderWidth: 1,
    borderColor: colors.cardBorder,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  snackCardCompleted: {
    backgroundColor: colors.green + '10',
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
    marginHorizontal: spacing.lg, // Add horizontal margin for consistency
    borderWidth: 1,
    borderColor: colors.cardBorder,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  waterCompletionButtonDisabled: {
    opacity: 0.6,
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
  waterCompletionButtonTextDisabled: {
    color: colors.mutedText,
    opacity: 0.5,
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
    marginHorizontal: spacing.lg, // Add horizontal margin for consistency
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noDaySelectedText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    textAlign: 'center',
  },

  // Expandable Meal Details Styles
  expandedMealDetails: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: spacing.md,
  },
  detailSection: {
    marginBottom: spacing.md,
  },
  detailSectionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
  },
  detailText: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  markEatenButton: {
    backgroundColor: colors.green,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    elevation: 4,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  markEatenButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
});
