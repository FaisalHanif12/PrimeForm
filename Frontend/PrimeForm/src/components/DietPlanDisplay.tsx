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
    
    console.log('📅 DietPlanDisplay Week Calculation:', {
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
      console.log('📊 Diet Progress: No total weeks, returning 0%');
      return 0;
    }
    
    // Progress = (Completed Weeks / Total Weeks) * 100
    // Week 1 = 0% (haven't completed any weeks yet)
    // Week 2 = 1/12 * 100 = 8.33% (completed 1 week)
    const completedWeeks = Math.max(0, currentWeek - 1);
    const actualProgress = (completedWeeks / totalWeeks) * 100;
    const roundedProgress = Math.round(Math.max(0, Math.min(100, actualProgress)));

    console.log('📊 Diet Progress Calculation (Weeks Completed):', {
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
    
    console.log('📅 DietPlanDisplay Today Debug:', {
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

  // Get current week's days data
  const getCurrentWeekDays = () => {
    if (!dietPlan.weeklyPlan || dietPlan.weeklyPlan.length === 0) {
      return [];
    }
    
    const weekDays: DietDay[] = [];
    const currentWeek = getCurrentWeek();
    const startDate = new Date(dietPlan.startDate);
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
        
        weekDays.push({
          ...dietPlan.weeklyPlan[0], // Sunday is at index 0
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
          
          // Get the correct weeklyPlan index based on day of week (Sunday=0, Monday=1, etc.)
          const planIndex = dayDate.getDay();
          
          if (planIndex < dietPlan.weeklyPlan.length) {
            weekDays.push({
              ...dietPlan.weeklyPlan[planIndex],
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
    
    console.log('📅 Diet Calendar Week Days:', {
      currentWeek,
      weekDaysCount: weekDays.length,
      firstDay: weekDays[0]?.dayName,
      lastDay: weekDays[weekDays.length - 1]?.dayName,
      completedDaysCount: completedDays.size
    });
    
    return weekDays;
  };

  useEffect(() => {
    const initializeComponent = async () => {
      // Initialize meal completion service
      await mealCompletionService.initialize();
      
      // ✅ Load completion states from prop data + local storage (NO API CALL)
      loadCompletionStatesFromProp();
      
      // Use the same logic as dashboard to get today's day data
      const todaysDay = getTodaysDayData();
      
      if (todaysDay) {
        console.log('📅 DietPlanDisplay Setting Today:', {
          dayName: todaysDay.dayName,
          date: todaysDay.date,
          mealCount: todaysDay.meals ? Object.keys(todaysDay.meals).length : 0
        });
        setSelectedDay(todaysDay);
      } else {
        // Fallback to first day of current week if today's data not found
        const currentWeekDays = getCurrentWeekDays();
        if (currentWeekDays.length > 0) {
          console.warn('Today\'s day data not found, using first day of week as fallback');
          setSelectedDay(currentWeekDays[0]);
        }
      }
      
      setIsInitialized(true);
    };
    
    initializeComponent();
  }, [dietPlan]);

  // Add focus effect to reload completion states when screen is focused
  // Only reload if data might have changed (e.g., after coming back from another screen)
  const lastFocusTime = React.useRef<number>(0);
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // Only reload if it's been more than 2 seconds since last focus
      // This prevents unnecessary reloads on quick navigation
      if (isInitialized && now - lastFocusTime.current > 2000) {
        console.log('🔄 DietPlanDisplay: Reloading completion states from local storage after focus');
        // ✅ Load from local storage only (NO API CALL)
        loadCompletionStatesFromLocalStorage();
        lastFocusTime.current = now;
      }
    }, [isInitialized])
  );

  // Listen for meal completion events and progress updates
  useEffect(() => {
    const mealCompletedListener = (event: any) => {
      console.log('🍽️ Meal completed event received:', event);
      // ✅ Update state directly from event data (NO API CALL)
      if (event.mealId) {
        setCompletedMeals(prev => new Set([...prev, event.mealId]));
      }
    };

    const dayCompletedListener = (event: any) => {
      console.log('📅 Day completed event received:', event);
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
      console.log('🔔 Received dietProgressUpdated event - refreshing completion state');
      // ✅ Just recalculate progress from current state (NO API CALL)
      const newProgress = getProgressPercentage();
      setProgressPercentage(newProgress);
    };

    const waterIntakeUpdatedListener = async () => {
      console.log('💧 Received waterIntakeUpdated event - refreshing completion state');
      // ✅ Load from local storage only (NO API CALL)
      try {
        const Storage = await import('../utils/storage');
        const cachedWaterIntake = await Storage.default.getItem('water_intake');
        const cachedWaterCompleted = await Storage.default.getItem('water_completed');
        if (cachedWaterIntake) {
          setWaterIntake(JSON.parse(cachedWaterIntake));
        }
        if (cachedWaterCompleted) {
          setWaterCompleted(JSON.parse(cachedWaterCompleted));
        }
      } catch (error) {
        console.warn('Could not load water data from local storage:', error);
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
        const cachedCompletedMeals = await Storage.default.getItem('completed_meals');
        const cachedCompletedDays = await Storage.default.getItem('completed_diet_days');
        const cachedWaterIntake = await Storage.default.getItem('water_intake');
      const cachedWaterCompleted = await Storage.default.getItem('water_completed');
        
        if (cachedCompletedMeals) {
          const localMeals = new Set<string>(JSON.parse(cachedCompletedMeals));
          console.log('📊 Loading completed meals from local storage:', Array.from(localMeals));
            setCompletedMeals(localMeals);
        }
        
        if (cachedCompletedDays) {
          const localDays = new Set<string>(JSON.parse(cachedCompletedDays));
          console.log('📊 Loading completed days from local storage:', Array.from(localDays));
            setCompletedDays(localDays);
        }
        
        if (cachedWaterIntake) {
          setWaterIntake(JSON.parse(cachedWaterIntake));
        }
        
        if (cachedWaterCompleted) {
          setWaterCompleted(JSON.parse(cachedWaterCompleted));
        }
      } catch (storageError) {
        console.warn('Could not load from local storage:', storageError);
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
        console.log('📊 Loading completed meals from prop:', mealIds);
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
        console.log('📊 Loading completed days from prop:', dayIds);
        if (dayIds.length > 0) {
          setCompletedDays(new Set(dayIds));
        }
      }

      // Also load from local storage and merge
      try {
        const Storage = await import('../utils/storage');
        const cachedCompletedMeals = await Storage.default.getItem('completed_meals');
        const cachedCompletedDays = await Storage.default.getItem('completed_diet_days');
        const cachedWaterIntake = await Storage.default.getItem('water_intake');
        const cachedWaterCompleted = await Storage.default.getItem('water_completed');
        
        if (cachedCompletedMeals) {
          const localMeals = new Set<string>(JSON.parse(cachedCompletedMeals));
          console.log('📊 Loading completed meals from local storage:', Array.from(localMeals));
          
          // Merge with prop data
          if (dietPlan.completedMeals && Array.isArray(dietPlan.completedMeals)) {
            const propMeals = new Set<string>(
              dietPlan.completedMeals.map((meal: any) => 
                typeof meal === 'string' ? meal : (meal.mealId || meal)
              ).filter(Boolean)
            );
            const mergedMeals = new Set<string>([...localMeals, ...propMeals]);
            setCompletedMeals(mergedMeals);
            console.log('📊 Merged completed meals:', Array.from(mergedMeals));
          } else {
            setCompletedMeals(localMeals);
          }
        }
        
        if (cachedCompletedDays) {
          const localDays = new Set<string>(JSON.parse(cachedCompletedDays));
          console.log('📊 Loading completed days from local storage:', Array.from(localDays));
          
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
            console.log('📊 Merged completed days:', Array.from(mergedDays));
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
        console.warn('Could not load from local storage:', storageError);
      }
    } catch (error) {
      console.warn('Could not load completion states from prop:', error);
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
    
    console.log('📊 Day meal completion calculation:', {
      dayDate: day.date,
      totalMeals: dayMeals.length,
      completedMeals: completedMealsCount,
      percentage: percentage,
      isCurrentDay: isCurrentDay(day)
    });
    
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
      console.warn('Cannot complete meal: selectedDay or selectedDay.date is null');
      return;
    }
    
    // Only allow completion on current day
    if (!isCurrentDay(selectedDay)) {
      console.warn('Cannot complete meal: only current day meals can be completed');
      return;
    }
    
    const mealId = `${selectedDay.date}-${mealType}-${meal.name}`;
    const week = Math.ceil(selectedDay.day / 7);
    
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
        
        if (daySuccess) {
          console.log(`🎉 Diet Day ${selectedDay.day} completed! ${completionPercentage.toFixed(1)}% of meals finished.`);
        }
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
      
      console.log('🔄 Diet progress synced and broadcasted to dashboard');
    } catch (error) {
      console.warn('Failed to sync diet progress:', error);
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
    
    console.log('💧 Water completion toggled:', {
      date: selectedDay.date,
      isCompleted: !isCompleted,
      targetAmount,
      waterIntake: newWaterIntake[selectedDay.date]
    });
    
    try {
      const Storage = await import('../utils/storage');
      await Storage.default.setItem('water_completed', JSON.stringify(newWaterCompleted));
      await Storage.default.setItem('water_intake', JSON.stringify(newWaterIntake));
      
      // Broadcast water update
      DeviceEventEmitter.emit('waterIntakeUpdated', {
        date: selectedDay.date,
        completed: !isCompleted,
        amount: isCompleted ? 0 : targetAmount
      });
      
      // Sync with progress service
      await syncProgressData();
    } catch (error) {
      console.error('Error toggling water completion:', error);
      
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
              <Text style={styles.goalBadgeText}>🥗 {dietPlan.goal}</Text>
            </View>
            
            {/* Main Title */}
            <Text style={styles.heroSubtitle}>Week {getCurrentWeek()} of {getTotalWeeks()} • {dietPlan.duration.split('(')[0].trim()}</Text>
            
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
                <View style={[styles.progressBarFill, { 
                  width: `${progressPercentage}%` 
                }]} />
              </View>
              <Text style={styles.progressBarText}>
                Week {getCurrentWeek()} of {getTotalWeeks()} • {progressPercentage}% Complete
              </Text>
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
                    {day.dayName.substring(0, 3)}
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
                    <Text style={styles.detailSectionTitle}>🥘 Ingredients</Text>
                    {selectedDay.meals.breakfast.ingredients.map((ingredient, idx) => (
                      <Text key={idx} style={styles.detailText}>• {ingredient}</Text>
                    ))}
                  </View>
                  
                  {/* Instructions */}
                  {selectedDay.meals.breakfast.instructions && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>👨‍🍳 Instructions</Text>
                      <Text style={styles.detailText}>{selectedDay.meals.breakfast.instructions}</Text>
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
                      <Text style={styles.markEatenButtonText}>Mark as Eaten ✓</Text>
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
                    <Text style={styles.detailSectionTitle}>🥘 Ingredients</Text>
                    {selectedDay.meals.lunch.ingredients.map((ingredient, idx) => (
                      <Text key={idx} style={styles.detailText}>• {ingredient}</Text>
                    ))}
                  </View>
                  
                  {/* Instructions */}
                  {selectedDay.meals.lunch.instructions && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>👨‍🍳 Instructions</Text>
                      <Text style={styles.detailText}>{selectedDay.meals.lunch.instructions}</Text>
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
                      <Text style={styles.markEatenButtonText}>Mark as Eaten ✓</Text>
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
                    <Text style={styles.detailSectionTitle}>🥘 Ingredients</Text>
                    {selectedDay.meals.dinner.ingredients.map((ingredient, idx) => (
                      <Text key={idx} style={styles.detailText}>• {ingredient}</Text>
                    ))}
                  </View>
                  
                  {/* Instructions */}
                  {selectedDay.meals.dinner.instructions && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>👨‍🍳 Instructions</Text>
                      <Text style={styles.detailText}>{selectedDay.meals.dinner.instructions}</Text>
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
                      <Text style={styles.markEatenButtonText}>Mark as Eaten ✓</Text>
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
                    ]}>🍎 Snack {index + 1}: {snack.name}</Text>
                    <Text style={[
                      styles.snackCalories,
                      completedMeals.has(snackId) && styles.snackCaloriesCompleted
                    ]}>{snack.calories} kcal</Text>
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
                      <Text style={styles.detailSectionTitle}>🥘 Ingredients</Text>
                      {snack.ingredients.map((ingredient, idx) => (
                        <Text key={idx} style={styles.detailText}>• {ingredient}</Text>
                      ))}
                    </View>
                    
                    {/* Instructions */}
                    {snack.instructions && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>👨‍🍳 Instructions</Text>
                        <Text style={styles.detailText}>{snack.instructions}</Text>
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
                        <Text style={styles.markEatenButtonText}>Mark as Eaten ✓</Text>
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
              <Text style={styles.waterTitle}>💧 Water Intake</Text>
              <Text style={styles.waterTarget}>Target: {selectedDay.waterIntake}ml</Text>
              
              <View style={styles.waterCompletionContainer}>
                <View style={styles.waterStatusInfo}>
                  <Text style={styles.waterStatusText}>
                    {waterCompleted[selectedDay.date] ? '✅ Completed' : '⏳ Due'}
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
                    waterCompleted[selectedDay.date] && styles.waterCompletionButtonDisabled
                  ]}
                  onPress={waterCompleted[selectedDay.date] ? undefined : toggleWaterCompletion}
                  disabled={waterCompleted[selectedDay.date]}
                  activeOpacity={waterCompleted[selectedDay.date] ? 1 : 0.7}
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
    borderColor: colors.blue,
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
