import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Dimensions, SafeAreaView, RefreshControl, Alert, AppState, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useAuthContext } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import userProfileService from '../../src/services/userProfileService';
import { authService } from '../../src/services/authService';
import aiDietService from '../../src/services/aiDietService';
import aiWorkoutService from '../../src/services/aiWorkoutService';
import dietPlanService from '../../src/services/dietPlanService';
import workoutPlanService from '../../src/services/workoutPlanService';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import Sidebar from '../../src/components/Sidebar';
import UserInfoModal from '../../src/components/UserInfoModal';
import ProfilePage from '../../src/components/ProfilePage';
import StatsCard from '../../src/components/StatsCard';
import WorkoutPlanCard from '../../src/components/WorkoutPlanCard';
import MealPlanCard from '../../src/components/MealPlanCard';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import NotificationModal from '../../src/components/NotificationModal';
import LanguageSelectionModal from '../../src/components/LanguageSelectionModal';
import SignupModal from '../../src/components/SignupModal';
import { useToast } from '../../src/context/ToastContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../../src/contexts/NotificationContext';


interface DashboardData {
  user: {
    fullName: string;
    email: string;
    isEmailVerified: boolean;
    memberSince: string;
    daysSinceJoining: number;
    lastLogin: string;
  };
  stats: {
    totalWorkouts: number;
    totalCaloriesBurned: number;
    currentStreak: number;
    achievements: any[];
  };
  quickActions: Array<{
    title: string;
    description: string;
    icon: string;
    action: string;
  }>;
  notifications: Array<{
    type: string;
    title: string;
    message: string;
    priority: string;
  }>;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { logout: authLogout, user, isAuthenticated } = useAuthContext();
  const { t, transliterateName, transliterateText, changeLanguage, language, hasSelectedLanguage } = useLanguage();
  const { unreadCount } = useNotifications();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'diet' | 'gym' | 'workout' | 'progress'>('home');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [offlineMode, setOfflineMode] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [currentFeature, setCurrentFeature] = useState<string>('');
  const [hasCompletedSignup, setHasCompletedSignup] = useState<boolean>(false);
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [todayMeals, setTodayMeals] = useState<any[]>([]);
  const [todayWorkouts, setTodayWorkouts] = useState<any[]>([]);
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [waterIntake, setWaterIntake] = useState<number>(0);
  const [targetWater, setTargetWater] = useState<number>(2000);
  const [waterCompleted, setWaterCompleted] = useState<boolean>(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [plansLoaded, setPlansLoaded] = useState(false);
  const { showToast } = useToast();

  // Centralized date calculation utility for consistency across all components
  const getStandardizedDateInfo = (planStartDate: string) => {
    const today = new Date();
    const startDate = new Date(planStartDate);
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate week based on plan generation day (not Monday)
    // If plan starts mid-week, week 1 includes the generation day and forward
    const currentWeek = Math.floor(daysDiff / 7) + 1;
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0-6 where 0 = Monday
    
    return {
      today,
      startDate,
      daysDiff,
      currentWeek,
      dayOfWeek,
      adjustedDayOfWeek,
      planGenerationDay: startDate.toLocaleDateString('en-US', { weekday: 'long' })
    };
  };

  // Load dynamic data on mount and when user info changes
  // Load dynamic data only when dashboard is actually viewed
  useEffect(() => {
    if (isAuthenticated || hasCompletedSignup) {
      // Don't load immediately - let user trigger it
      console.log('📱 Dashboard mounted, ready to load data when needed');
    }
  }, [isAuthenticated, hasCompletedSignup]);

  // Check for new day only when app becomes active (no polling)
  useEffect(() => {
    let isChecking = false; // Prevent concurrent checks
    
    const checkForNewDay = async () => {
      if (isChecking) return;
      
      try {
        isChecking = true;
        const today = new Date().toDateString();
        const lastCheckedDay = await AsyncStorage.getItem('last_checked_day');
        
        if (lastCheckedDay !== today) {
          console.log('🌅 New day detected! Refreshing dashboard data...');
          await AsyncStorage.setItem('last_checked_day', today);
          await loadDynamicData();
        }
      } catch (error) {
        console.error('Error checking for new day:', error);
      } finally {
        isChecking = false;
      }
    };

    // Check immediately on mount
    checkForNewDay();
  }, []);

  // Production-optimized refresh system - ONLY when needed
  useEffect(() => {
    let isRefreshing = false; // Prevent concurrent refreshes

    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active' && !isRefreshing) {
        console.log('📱 App became active, refreshing data...');
        isRefreshing = true;
        
        try {
          // First check for new day
          const today = new Date().toDateString();
          const lastCheckedDay = await AsyncStorage.getItem('last_checked_day');
          
          if (lastCheckedDay !== today) {
            console.log('🌅 New day detected! Refreshing dashboard data...');
            await AsyncStorage.setItem('last_checked_day', today);
          }
          
          // Refresh both completion states and meal/workout data
          await Promise.all([
            loadCompletionStates(),
            loadDynamicData()
          ]);
        } catch (error) {
          console.error('Error refreshing data:', error);
        } finally {
          isRefreshing = false;
        }
      }
    };

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  // Check app state on mount
  useEffect(() => {
    const checkAppState = async () => {
      try {
        // Check if this is the first time the app has ever been launched
        const isFirstLaunch = await AsyncStorage.getItem('primeform_first_launch');
        const deviceLanguageSelected = await AsyncStorage.getItem('primeform_device_language_selected');
        const hasEverSignedUp = await AsyncStorage.getItem('primeform_has_ever_signed_up');
        
        console.log('🔍 App State Check:', {
          isFirstLaunch,
          hasSelectedLanguage,
          isAuthenticated,
          deviceLanguageSelected,
          hasEverSignedUp
        });
        
        // CRITICAL: Language modal should ONLY show for first-time guest users
        // According to workflow Phase 4: After sign-up, language modal NEVER appears again
        if (hasEverSignedUp === 'true' || isAuthenticated) {
          console.log('🚫 User has signed up before or is authenticated - language modal will NOT be shown');
          // Ensure language modal never shows for users who have ever signed up
          await AsyncStorage.setItem('primeform_device_language_selected', 'true');
          setShowLanguageModal(false);
          return;
        }
        
        // Check if this is the first time ANY user has opened the app on this device
        if (isFirstLaunch === null && !deviceLanguageSelected) {
          console.log('🌍 First device launch detected - showing language modal for guest user');
          // Mark as first launch and device language selection
          await AsyncStorage.setItem('primeform_first_launch', 'false');
          await AsyncStorage.setItem('primeform_device_language_selected', 'true');
          setShowLanguageModal(true);
        } else {
          console.log('✅ Language modal conditions not met:', {
            isFirstLaunch,
            hasSelectedLanguage,
            deviceLanguageSelected,
            hasEverSignedUp
          });
        }

        // Check if user has completed signup - check both authentication and signup completion
        const signupCompleted = await AsyncStorage.getItem('primeform_signup_completed');
        
        if (isAuthenticated) {
          // User is authenticated - mark signup as completed
          setHasCompletedSignup(true);
          await AsyncStorage.setItem('primeform_signup_completed', 'true');
          await AsyncStorage.setItem('primeform_has_ever_signed_up', 'true');
          console.log('✅ User authenticated - signup marked as completed');
        } else if (signupCompleted === 'true' || hasEverSignedUp === 'true') {
          // User has completed signup but might not be authenticated
          // This could happen if token expired but user hasn't logged out
          setHasCompletedSignup(true);
          
          // Try to refresh authentication status
          try {
            const isStillAuth = await authService.isAuthenticated();
            if (!isStillAuth) {
              // Token is truly expired, user needs to login again
              console.log('Token expired, user needs to login again');
              // Don't redirect here, let the main app logic handle it
            }
          } catch (error) {
            console.log('Auth refresh failed, but user has completed signup');
          }
        } else {
          // If not authenticated and no signup completion, ensure no access
          setHasCompletedSignup(false);
        }
      } catch (error) {
        console.error('Failed to check app state:', error);
      }
    };
    checkAppState();
  }, [isAuthenticated, hasSelectedLanguage]);

  // Additional effect to handle authentication state changes
  useEffect(() => {
    console.log('🔄 Authentication state changed:', { 
      isAuthenticated, 
      user: user?.fullName,
      hasCompletedSignup,
      userEmail: user?.email 
    });
    if (isAuthenticated && user) {
      console.log('✅ User is authenticated with name:', user.fullName);
    } else {
      console.log('❌ User is not authenticated or no user data');
    }
  }, [isAuthenticated, user, hasCompletedSignup]);

  // Language selection modal is now controlled by hasSelectedLanguage from context

  const loadDashboard = async () => {
    try {
      setLoading(true);
      // For now, we'll use mock data since dashboard API is not implemented
      // This maintains the exact same functionality
      setDashboardData({
        stats: {
          totalWorkouts: 2,
          totalCaloriesBurned: 1200,
          currentStreak: 3,
          achievements: []
        },
        quickActions: [],
        user: {
          fullName: isAuthenticated ? (user?.fullName || 'User') : (hasCompletedSignup ? 'User' : 'Guest'),
          email: isAuthenticated ? (user?.email || 'user@example.com') : (hasCompletedSignup ? 'user@primeform.com' : 'guest@primeform.com'),
          isEmailVerified: isAuthenticated ? (user?.isEmailVerified || false) : hasCompletedSignup,
          memberSince: new Date().toISOString(),
          daysSinceJoining: 1,
          lastLogin: new Date().toISOString()
        },
        notifications: []
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // Removed checkOnboardingStatus();
    loadUserInfo();
    // Removed checkUserInfoStatus();
    // Check backend availability in background without blocking
    checkBackendAvailability();
  }, []);

  const checkBackendAvailability = async () => {
    try {
      // Simple check - try to get user profile to see if backend is working
      const response = await userProfileService.getUserProfile();
      setBackendAvailable(true);
      setOfflineMode(false);
      console.log('Backend is available');
    } catch (error: any) {
      console.log('Backend is not available:', error.message);
      setBackendAvailable(false);
      setOfflineMode(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboard();
      await loadDynamicData(); // Also reload meal and workout plans
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Removed checkOnboardingStatus function

  // Removed handlePermissionStart function

  // Removed handlePermissionCancel function

  const handleCompleteUserInfo = async (userInfoData: any) => {
    try {
      // Save to backend database
      const response = await userProfileService.createOrUpdateProfile(userInfoData);
      
      console.log('🔍 Full response from userProfileService:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response.success:', response.success);
      console.log('🔍 Response.data:', response.data);
      
      if (response && response.success) {
        setUserInfo(userInfoData);
        setShowUserInfoModal(false);
        console.log('✅ User profile saved to database:', response.data);
        showToast('success', 'Profile created successfully!');
      } else {
        console.error('❌ Failed to save to database:', response?.message || 'Unknown error');
        // Show error to user
        showToast('error', 'Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('💥 Exception in handleCompleteUserInfo:', error);
      // Show error to user
      showToast('error', 'Failed to save profile. Please check your connection and try again.');
    }
  };

  const handleCancelUserInfo = async () => {
    try {
      // Mark that user cancelled user info collection
      // Removed AsyncStorage dependency
      setShowUserInfoModal(false);
    } catch (error) {
      console.error('Failed to save cancellation status:', error);
    }
  };

  const loadUserInfo = async () => {
    try {
      // Load user profile from backend database
      const response = await userProfileService.getUserProfile();
      
      if (response.success && response.data) {
        setUserInfo(response.data);
        console.log('User profile loaded from database:', response.data);
      } else {
        // No profile exists yet or failed to load
        setUserInfo(null);
        console.log('No user profile found or failed to load:', response.message);
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
      setUserInfo(null);
    }
  };

  // Removed checkUserInfoStatus function

  const handleUpdateUserInfo = async (updatedUserInfo: any) => {
    try {
      // Update in backend database
      const response = await userProfileService.createOrUpdateProfile(updatedUserInfo);
      
      if (response.success) {
        setUserInfo(updatedUserInfo);
        console.log('User profile updated in database:', response.data);
              } else {
          console.error('Failed to update in database:', response.message);
          showToast('error', 'Failed to update profile. Please try again.');
        }
      } catch (error) {
        console.error('Failed to update user info:', error);
        showToast('error', 'Failed to update profile. Please check your connection and try again.');
      }
  };



  const handleLogout = async () => {
    try {
      await authLogout();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/auth/login'); // Navigate anyway
    }
  };

  const handleQuickAction = (action: string) => {
    // Feature coming soon - no action needed
    console.log('Feature coming soon:', action);
  };

  const handleProfilePress = () => {
    // Profile icon should always open sidebar, not show protected feature modal
    setSidebarVisible(true);
  };

  const handleNotificationPress = () => {
    if (!isAuthenticated && !hasCompletedSignup) {
      setCurrentFeature('Notifications');
      setShowSignupModal(true);
      return;
    }
    console.log('Notifications pressed');
    setShowNotificationModal(true);
  };

  const handleTabPress = (tab: 'home' | 'diet' | 'gym' | 'workout' | 'progress') => {
    if (tab === 'home') {
      setActiveTab(tab);
      return;
    }
    
    // For non-home tabs, check authentication and signup completion
    if (!isAuthenticated && !hasCompletedSignup) {
      const featureNames = {
        'diet': 'AI Diet',
        'gym': 'Gym',
        'workout': 'AI Workout',
        'progress': 'Progress'
      };
      setCurrentFeature(featureNames[tab]);
      setShowSignupModal(true);
      return;
    }
    
    // User is authenticated or has completed signup, allow navigation
    setActiveTab(tab);
    
    switch (tab) {
      case 'diet':
        router.push('/(dashboard)/diet');
        break;
      case 'gym':
        router.push('/(dashboard)/gym');
        break;
      case 'workout':
        router.push('/(dashboard)/workout');
        break;
      case 'progress':
        router.push('/(dashboard)/progress');
        break;
      default:
        break;
    }
  };

  const handleSidebarMenuPress = async (action: string) => {
    // For guest users, protect all menu items except language
    if (!isAuthenticated && !hasCompletedSignup && action !== 'language') {
      setCurrentFeature(action.charAt(0).toUpperCase() + action.slice(1));
      setShowSignupModal(true);
      return;
    }

    switch (action) {
      case 'profile':
        setShowProfilePage(true);
        break;
      case 'edit_profile':
        setShowUserInfoModal(true);
        break;
      case 'streak':
        router.push('/(dashboard)/streak');
        break;
      case 'ai-trainer':
        router.push('/(dashboard)/ai-trainer');
        break;
      case 'settings':
        router.push('/(dashboard)/settings');
        break;
      case 'subscription':
        router.push('/(dashboard)/subscription');
        break;
      case 'contact':
        router.push('/(dashboard)/contact');
        break;
      case 'logout':
        if (isAuthenticated) {
          // Actually perform logout
          try {
            await authLogout();
            // Clear signup completion status when logging out
            await AsyncStorage.removeItem('primeform_signup_completed');
            setHasCompletedSignup(false);
            // Don't clear primeform_has_ever_signed_up - preserve historical record
            router.replace('/auth/login');
          } catch (error) {
            console.error('Logout failed:', error);
            showToast('error', 'Failed to logout. Please try again.');
          }
        }
        break;
      case 'language':
        // Language change is always allowed
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Load dynamic data
  const loadDynamicData = useCallback(async () => {
    try {
      setIsLoadingPlans(true);
      setPlansLoaded(false);
      
      // Load both plans in parallel to ensure consistent loading
      const [dietPlanData, workoutPlanData] = await Promise.allSettled([
        aiDietService.loadDietPlanFromDatabase(),
        aiWorkoutService.loadWorkoutPlanFromDatabase()
      ]);
      
      // Handle results with proper error handling
      const dietPlan = dietPlanData.status === 'fulfilled' ? dietPlanData.value : null;
      const workoutPlan = workoutPlanData.status === 'fulfilled' ? workoutPlanData.value : null;
      
      if (dietPlanData.status === 'rejected') {
        console.error('Failed to load diet plan:', dietPlanData.reason);
      }
      if (workoutPlanData.status === 'rejected') {
        console.error('Failed to load workout plan:', workoutPlanData.reason);
      }

      // Process diet plan
      if (dietPlan) {
        setDietPlan(dietPlan);
        
        // Get today's meals using centralized date logic
        const dateInfo = getStandardizedDateInfo(dietPlan.startDate);
        
        console.log('📅 Dashboard Diet Date Debug:', {
          today: dateInfo.today.toDateString(),
          startDate: dateInfo.startDate.toDateString(),
          daysDiff: dateInfo.daysDiff,
          currentWeek: dateInfo.currentWeek,
          dayOfWeek: dateInfo.dayOfWeek,
          adjustedDayOfWeek: dateInfo.adjustedDayOfWeek,
          planGenerationDay: dateInfo.planGenerationDay
        });
        
        // Get the day from the 7-day pattern
        const todayMealData = dietPlan.weeklyPlan[dateInfo.adjustedDayOfWeek];
        
        console.log('🍽️ Dashboard Meal Loading:', {
          currentWeek: dateInfo.currentWeek,
          dayOfWeek: dateInfo.dayOfWeek,
          adjustedDayOfWeek: dateInfo.adjustedDayOfWeek,
          hasMealData: !!todayMealData,
          mealCount: todayMealData?.meals ? Object.keys(todayMealData.meals).length : 0
        });
        
        if (todayMealData) {
          const meals = [
            { name: `🌅 ${todayMealData.meals.breakfast.name}`, calories: todayMealData.meals.breakfast.calories, weight: '200g' },
            { name: `🌞 ${todayMealData.meals.lunch.name}`, calories: todayMealData.meals.lunch.calories, weight: '400g' },
            { name: `🌙 ${todayMealData.meals.dinner.name}`, calories: todayMealData.meals.dinner.calories, weight: '500g' },
            ...todayMealData.meals.snacks.map((snack: any, index: number) => ({
              name: `🍎 Snack ${index + 1}: ${snack.name}`,
              calories: snack.calories,
              weight: '100g'
            }))
          ];
          setTodayMeals(meals);
          setTargetWater(Number(todayMealData.waterIntake) || 2000);
        }
      }

      // Process workout plan
      if (workoutPlan) {
        setWorkoutPlan(workoutPlan);
        
        // Get today's workout using centralized date logic
        const workoutDateInfo = getStandardizedDateInfo(workoutPlan.startDate);
        
        console.log('📅 Dashboard Workout Date Debug:', {
          today: workoutDateInfo.today.toDateString(),
          startDate: workoutDateInfo.startDate.toDateString(),
          daysDiff: workoutDateInfo.daysDiff,
          currentWeek: workoutDateInfo.currentWeek,
          dayOfWeek: workoutDateInfo.dayOfWeek,
          adjustedDayOfWeek: workoutDateInfo.adjustedDayOfWeek,
          planGenerationDay: workoutDateInfo.planGenerationDay
        });
        
        // Get the day from the 7-day pattern
        const todayWorkoutData = workoutPlan.weeklyPlan[workoutDateInfo.adjustedDayOfWeek];
        
        console.log('💪 Dashboard Workout Loading:', {
          currentWeek: workoutDateInfo.currentWeek,
          dayOfWeek: workoutDateInfo.dayOfWeek,
          adjustedDayOfWeek: workoutDateInfo.adjustedDayOfWeek,
          hasWorkoutData: !!todayWorkoutData,
          isRestDay: todayWorkoutData?.isRestDay,
          exerciseCount: todayWorkoutData?.exercises?.length || 0
        });
        
        if (todayWorkoutData && !todayWorkoutData.isRestDay) {
          const workouts = todayWorkoutData.exercises.map((exercise: any) => ({
            name: exercise.name,
            emoji: exercise.emoji,
            sets: exercise.sets,
            reps: exercise.reps,
            rest: exercise.rest,
            targetMuscles: exercise.targetMuscles,
            caloriesBurned: exercise.caloriesBurned
          }));
          setTodayWorkouts(workouts);
        }
      }

      // Load completion states
      await loadCompletionStates();
      
      // Mark plans as loaded
      setPlansLoaded(true);
    } catch (error) {
      console.error('Failed to load dynamic data:', error);
    } finally {
      setIsLoadingPlans(false);
    }
  }, []);

  const loadCompletionStates = async () => {
    try {
      // Load from database first
      const [workoutPlan, dietPlan] = await Promise.allSettled([
        aiWorkoutService.loadWorkoutPlanFromDatabase(),
        aiDietService.loadDietPlanFromDatabase()
      ]);

      // Load completed exercises from database
      if (workoutPlan.status === 'fulfilled' && workoutPlan.value && workoutPlan.value.completedExercises) {
        console.log('📊 Dashboard: Loading completed exercises from database:', workoutPlan.value.completedExercises);
        setCompletedExercises(new Set(workoutPlan.value.completedExercises as string[]));
      }

      // Load completed meals from database
      if (dietPlan.status === 'fulfilled' && dietPlan.value && dietPlan.value.completedMeals) {
        console.log('📊 Dashboard: Loading completed meals from database:', dietPlan.value.completedMeals);
        setCompletedMeals(new Set(dietPlan.value.completedMeals as string[]));
      }

      // Also load from local storage as backup/sync
      try {
        // Load completed meals
        const completedMealsData = await AsyncStorage.getItem('completed_meals');
        if (completedMealsData) {
          const localMeals = new Set(JSON.parse(completedMealsData) as string[]);
          console.log('📊 Dashboard: Loading completed meals from local storage:', Array.from(localMeals));
          
          // Merge with database data
          if (dietPlan.status === 'fulfilled' && dietPlan.value && dietPlan.value.completedMeals) {
            const dbMeals = new Set(dietPlan.value.completedMeals as string[]);
            const mergedMeals = new Set([...localMeals, ...dbMeals]);
            setCompletedMeals(mergedMeals);
            console.log('📊 Dashboard: Merged completed meals:', Array.from(mergedMeals));
          } else {
            setCompletedMeals(localMeals);
          }
        }

        // Load completed exercises
        const completedExercisesData = await AsyncStorage.getItem('completed_exercises');
        if (completedExercisesData) {
          const localExercises = new Set(JSON.parse(completedExercisesData) as string[]);
          console.log('📊 Dashboard: Loading completed exercises from local storage:', Array.from(localExercises));
          
          // Merge with database data
          if (workoutPlan.status === 'fulfilled' && workoutPlan.value && workoutPlan.value.completedExercises) {
            const dbExercises = new Set(workoutPlan.value.completedExercises as string[]);
            const mergedExercises = new Set([...localExercises, ...dbExercises]);
            setCompletedExercises(mergedExercises);
            console.log('📊 Dashboard: Merged completed exercises:', Array.from(mergedExercises));
          } else {
            setCompletedExercises(localExercises);
          }
        }

        // Load water intake
        const waterData = await AsyncStorage.getItem('water_intake');
        if (waterData) {
          const waterObj = JSON.parse(waterData);
          const today = new Date().toISOString().split('T')[0];
          setWaterIntake(waterObj[today] || 0);
        }

        // Load water completion status
        const waterCompletedData = await AsyncStorage.getItem('water_completed');
        if (waterCompletedData) {
          const waterCompletedObj = JSON.parse(waterCompletedData);
          const today = new Date().toISOString().split('T')[0];
          setWaterCompleted(waterCompletedObj[today] || false);
        }
      } catch (storageError) {
        console.warn('Could not load from local storage:', storageError);
      }
    } catch (error) {
      console.error('Failed to load completion states:', error);
    }
  };

  // Function to refresh dashboard data (can be called from other components)
  const refreshDashboardData = async () => {
    console.log('🔄 Refreshing dashboard data...');
    await loadDynamicData();
  };

  // Load data when user actually needs it (lazy loading)
  const loadDataIfNeeded = async () => {
    if (!plansLoaded && !isLoadingPlans) {
      console.log('📊 Loading dashboard data on demand...');
      await loadDynamicData();
    }
  };

  // Load data only when dashboard is actually viewed (not on app open)
  useEffect(() => {
    if (isAuthenticated || hasCompletedSignup) {
      // Load data when dashboard becomes visible
      loadDynamicData();
    }
  }, [isAuthenticated, hasCompletedSignup]);

  // Production-optimized dynamic stats with memoization
  const getDynamicStats = useMemo(() => {
    const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
    
    // Get today's date for completion checking
    const today = new Date().toISOString().split('T')[0];
    
    // Check completion using the original meal names (without emojis)
    const consumedCalories = todayMeals.filter(meal => {
      // Extract original meal name by removing emoji prefix
      const originalName = meal.name.replace(/^[🌅🌞🌙🍎]+\s*/, '').replace(/^(Breakfast|Lunch|Dinner|Snack \d+):\s*/, '');
      
      // Check if any completion key matches this meal
      return Array.from(completedMeals).some(completedKey => 
        completedKey.includes(today) && completedKey.includes(originalName)
      );
    }).reduce((sum, meal) => sum + meal.calories, 0);
    
    const remainingCalories = Math.max(0, totalCalories - consumedCalories);
    
    // Check completed workouts
    const completedWorkouts = todayWorkouts.filter(workout => 
      completedExercises.has(`${today}-${workout.name}`)
    ).length;
    
    // Check completed meals using original names
    const completedMealsCount = todayMeals.filter(meal => {
      const originalName = meal.name.replace(/^[🌅🌞🌙🍎]+\s*/, '').replace(/^(Breakfast|Lunch|Dinner|Snack \d+):\s*/, '');
      return Array.from(completedMeals).some(completedKey => 
        completedKey.includes(today) && completedKey.includes(originalName)
      );
    }).length;
    
    const remainingMeals = todayMeals.length - completedMealsCount;

    return [
      { label: t('dashboard.stats.calories'), value: remainingCalories.toLocaleString(), icon: 'flame' as const, color: colors.gold },
      { label: t('dashboard.stats.water'), value: waterCompleted ? 'Done' : 'Due', icon: 'water' as const, color: waterCompleted ? colors.green : colors.blue },
      { label: t('dashboard.stats.workouts'), value: (todayWorkouts.length - completedWorkouts).toString(), icon: 'barbell' as const, color: colors.green },
      { label: 'Meals Remaining', value: remainingMeals.toString(), icon: 'restaurant' as const, color: colors.purple },
    ];
  }, [todayMeals, completedMeals, todayWorkouts, completedExercises, waterCompleted, t]);

  // Sample data for guest mode
  const mockMeals = [
    { name: `🥣 ${transliterateText('Chicken Rice')}`, calories: 350, weight: '200g' },
    { name: `🥗 ${transliterateText('Greek Salad')}`, calories: 500, weight: '400g' },
    { name: `🍗 ${transliterateText('Grilled Chicken')}`, calories: 650, weight: '500g' },
  ];

  const mockWorkouts = [
    { 
      name: 'Push-ups', 
      emoji: '💪', 
      caloriesBurned: 50, 
      sets: 3, 
      reps: 15, 
      rest: '60s', 
      targetMuscles: ['Chest', 'Shoulders', 'Triceps'] 
    },
    { 
      name: 'Squats', 
      emoji: '🦵', 
      caloriesBurned: 40, 
      sets: 3, 
      reps: 20, 
      rest: '60s', 
      targetMuscles: ['Quads', 'Glutes', 'Hamstrings'] 
    },
    { 
      name: 'Plank', 
      emoji: '🤸', 
      caloriesBurned: 30, 
      sets: 3, 
      reps: 30, 
      rest: '45s', 
      targetMuscles: ['Core', 'Shoulders'] 
    },
  ];

  const handleLanguageSelect = async (language: 'en' | 'ur') => {
    try {
      console.log('🌍 Language selected:', language);
      await changeLanguage(language);
      // Mark device language as selected (this persists across all users on this device)
      await AsyncStorage.setItem('primeform_device_language_selected', 'true');
      // Close the modal and mark first launch as complete
      setShowLanguageModal(false);
      await AsyncStorage.setItem('primeform_first_launch', 'false');
      console.log('✅ Language modal closed and device language marked as selected');
      showToast('success', 'Language updated successfully!');
    } catch (error) {
      console.error('Failed to change language:', error);
      showToast('error', 'Failed to update language');
    }
  };

  const handleFeatureAccess = (featureName: string) => {
    if (!isAuthenticated && !hasCompletedSignup) {
      setCurrentFeature(featureName);
      setShowSignupModal(true);
    } else {
      // User is authenticated or has completed signup, allow access
      switch (featureName) {
        case 'Profile':
          setShowProfilePage(true);
          break;
        case 'AI Diet':
          router.push('/(dashboard)/diet');
          break;
        case 'AI Workout':
          router.push('/(dashboard)/workout');
          break;
        case 'Gym':
          router.push('/(dashboard)/gym');
          break;
        case 'Progress':
          // Handle progress page
          break;
        default:
          break;
      }
    }
  };

  const handleSignupModalClose = () => {
    setShowSignupModal(false);
    // Navigate back to home (Dashboard) as specified in requirements
    setActiveTab('home');
    // Ensure user stays on dashboard
    router.replace('/(dashboard)');
  };

  // Handle when user returns from signup or app comes to foreground
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App came to foreground, check authentication status
        if (!isAuthenticated) {
          // User is not authenticated, check if they have completed signup
          const signupCompleted = await AsyncStorage.getItem('primeform_signup_completed');
          const hasEverSignedUp = await AsyncStorage.getItem('primeform_has_ever_signed_up');
          
          if (signupCompleted === 'true' || hasEverSignedUp === 'true') {
            // User has completed signup but token might be expired
            // Try to refresh authentication
            try {
              const isStillValid = await authService.isAuthenticated();
              if (!isStillValid) {
                // Token is expired, user needs to login again
                console.log('🔐 App returned to foreground - token expired, redirecting to login');
                router.replace('/auth/login');
                return;
              }
            } catch (error) {
              console.log('🔐 Cannot verify token on app return - redirecting to login');
              router.replace('/auth/login');
              return;
            }
          } else {
            // User is not authenticated and has not completed signup
            // Ensure no current session access
            resetSignupStatus();
          }
        } else {
          // User is authenticated, ensure they stay on dashboard
          console.log('✅ App returned to foreground - user authenticated, staying on dashboard');
          // Data will be refreshed by the optimized AppState listener
        }
      }
    };

    // Add AppState listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Cleanup subscription
    return () => subscription?.remove();
  }, [isAuthenticated]);

  // Check for actual authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      // User is actually authenticated, mark signup as completed
      AsyncStorage.setItem('primeform_signup_completed', 'true');
      setHasCompletedSignup(true);
      
      // Also mark that user has ever signed up (for app-wide tracking)
      AsyncStorage.setItem('primeform_has_ever_signed_up', 'true');
    } else {
      // User is not authenticated, ensure they don't have access
      resetSignupStatus();
    }
  }, [isAuthenticated]);

  // Cleanup effect to ensure proper state management
  useEffect(() => {
    return () => {
      // Component unmounting, ensure proper cleanup
      if (!isAuthenticated) {
        // Only reset current session status, preserve historical record
        resetSignupStatus();
      }
    };
  }, [isAuthenticated]);

  const handleSignup = () => {
    setShowSignupModal(false);
    // Don't mark as completed until they actually finish signup
    // Just navigate to signup page
    router.push('/auth/signup');
  };


  // Function to reset signup completion status
  const resetSignupStatus = async () => {
    try {
      await AsyncStorage.removeItem('primeform_signup_completed');
      setHasCompletedSignup(false);
      // Don't clear primeform_has_ever_signed_up - preserve historical record
    } catch (error) {
      console.error('Failed to reset signup status:', error);
    }
  };

  if (loading) {
    return (
      <DecorativeBackground>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </DecorativeBackground>
    );
  }

  if (!dashboardData) {
    return (
      <DecorativeBackground>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Failed to load dashboard</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </DecorativeBackground>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <DecorativeBackground>
        <View style={styles.mainContainer}>
          {/* Header */}
          <DashboardHeader 
            userName={(() => {
              const displayName = isAuthenticated ? 
                transliterateName((user?.fullName || dashboardData?.user?.fullName || 'User').split(' ')[0]) : 
                'Guest';
              console.log('🏷️ Dashboard Header Display Name:', { 
                isAuthenticated, 
                userFullName: user?.fullName, 
                dashboardUserFullName: dashboardData?.user?.fullName,
                displayName 
              });
              return displayName;
            })()}
            onProfilePress={handleProfilePress}
            onNotificationPress={handleNotificationPress}
            notificationCount={unreadCount}
          />

          {/* Content */}
          <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.gold}
                colors={[colors.gold]}
              />
            }
          >
            {/* Welcome Message */}
            <Animated.View entering={FadeInUp.delay(100)} style={styles.welcomeSection}>
              <Text style={styles.greetingText}>{t('dashboard.greeting')}, {transliterateName((user?.fullName || dashboardData.user.fullName).split(' ')[0])} 💪</Text>
              <Text style={styles.motivationText}>{t('dashboard.subtitle')}</Text>
            </Animated.View>

            {/* Stats Overview */}
            <StatsCard 
              title={t('dashboard.overview')}
              stats={getDynamicStats}
              delay={200}
            />

            {/* Today's Meal Plan */}
            {!isAuthenticated ? (
              <MealPlanCard
                title="Today's AI Meal Plan"
                meals={mockMeals}
                totalCalories={mockMeals.reduce((sum, meal) => sum + meal.calories, 0)}
                onPress={() => handleFeatureAccess('AI Diet')}
                delay={300}
              />
            ) : isLoadingPlans ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.loadingCardText}>Loading your meal plan...</Text>
              </View>
            ) : todayMeals.length > 0 ? (
              <MealPlanCard
                title="Today's AI Meal Plan"
                meals={todayMeals}
                totalCalories={todayMeals.reduce((sum, meal) => sum + meal.calories, 0)}
                onPress={() => handleFeatureAccess('AI Diet')}
                delay={300}
              />
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardTitle}>No Meal Plan Today</Text>
                <Text style={styles.emptyCardText}>Generate a diet plan to see today's meals</Text>
              </View>
            )}

            {/* Today's Workout Plan */}
            {!isAuthenticated ? (
              <WorkoutPlanCard
                title="Today's AI Workout Plan"
                workouts={mockWorkouts}
                completedExercises={completedExercises}
                onPress={() => handleFeatureAccess('AI Workout')}
                delay={400}
              />
            ) : isLoadingPlans ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.loadingCardText}>Loading your workout plan...</Text>
              </View>
            ) : (
              <WorkoutPlanCard
                title="Today's AI Workout Plan"
                workouts={todayWorkouts}
                completedExercises={completedExercises}
                onPress={() => handleFeatureAccess('AI Workout')}
                delay={400}
              />
            )}

            {/* Water Intake Section - Status Only */}
            <View style={styles.waterSection}>
              <Text style={styles.waterTitle}>💧 Water Intake</Text>
              <Text style={styles.waterTarget}>Target: {targetWater}ml</Text>
              
              <View style={styles.waterStatusOnlyContainer}>
                <View style={styles.waterStatusInfo}>
                  <View style={styles.waterStatusTextContainer}>
                  <Text style={styles.waterStatusText} numberOfLines={1}>
                    {waterCompleted ? '✅ Done' : '⏳ Due'}
                  </Text>
                  </View>
                  <Text style={styles.waterAmountText}>
                    {waterCompleted ? targetWater : 0}ml / {targetWater}ml
                  </Text>
                </View>
                
                <View style={[
                  styles.waterStatusIndicator,
                  waterCompleted && styles.waterStatusIndicatorCompleted
                ]}>
                  <Text style={[
                    styles.waterStatusIndicatorText,
                    waterCompleted && styles.waterStatusIndicatorTextCompleted
                  ]}>
                    {waterCompleted ? '✓' : '○'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.waterNoteText}>
                Manage water intake in your diet plan
              </Text>
            </View>

            {/* Extra spacing for bottom navigation */}
            <View style={styles.bottomSpacing} />
          </ScrollView>

          {/* Bottom Navigation */}
          <BottomNavigation 
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </View>

        {/* Sidebar */}
        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onMenuItemPress={handleSidebarMenuPress}
          userName={transliterateName((user?.fullName || dashboardData.user.fullName).split(' ')[0])}
          userEmail={user?.email || dashboardData.user.email}
          userInfo={userInfo}
          isGuest={!isAuthenticated && !hasCompletedSignup}
          badges={userInfo?.badges || []}
        />

        {/* Permission Modal */}
        {/* Removed Permission Modal */}

        {/* User Info Modal */}
        <UserInfoModal
          visible={showUserInfoModal}
          onComplete={handleCompleteUserInfo}
          onCancel={handleCancelUserInfo}
        />

        {/* Profile Page */}
        <ProfilePage
          visible={showProfilePage}
          onClose={() => setShowProfilePage(false)}
          userInfo={userInfo}
          onUpdateUserInfo={handleUpdateUserInfo}
        />

        {/* Notification Modal */}
        <NotificationModal
          visible={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
        />

        {/* Language Selection Modal */}
        <LanguageSelectionModal
          visible={showLanguageModal}
          onLanguageSelect={handleLanguageSelect}
          onBack={async () => {
            console.log('🔙 Language modal back button pressed - setting English as default');
            // When user goes back, set English as default, close modal, and mark first launch as complete
            await changeLanguage('en');
            setShowLanguageModal(false);
            // Mark that first launch is complete (even if user didn't explicitly choose)
            await AsyncStorage.setItem('primeform_first_launch', 'false');
            console.log('✅ Language modal closed with English default and first launch marked as complete');
          }}
        />

        {/* Signup Modal */}
        <SignupModal
          visible={showSignupModal}
          onSignup={handleSignup}
          onClose={handleSignupModalClose}
          featureName={currentFeature}
        />
      </DecorativeBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: 100, // reserve space for bottom tab that scrolls with content
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    color: colors.white,
    fontSize: typography.body,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: typography.body,
  },
  welcomeSection: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  greetingText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  motivationText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 100, // Space for bottom navigation
  },
  
  // Empty Card Styles
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  emptyCardTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
  },
  emptyCardText: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    textAlign: 'center',
  },

  // Water Section Styles
  waterSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
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
  waterProgress: {
    marginBottom: spacing.md,
  },
  waterProgressBar: {
    height: 8,
    backgroundColor: colors.cardBorder + '30',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  waterProgressFill: {
    height: '100%',
    backgroundColor: colors.blue,
    borderRadius: 4,
  },
  waterProgressText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  waterButtons: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  waterButton: {
    flex: 1,
    backgroundColor: colors.blue + '20',
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.blue + '30',
  },
  waterButtonText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },

  // Water Status Only Styles
  waterStatusOnlyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    minHeight: 50,
    paddingHorizontal: spacing.xs,
  },
  waterStatusInfo: {
    flex: 1,
    marginRight: spacing.sm,
    minWidth: 120,
  },
  waterStatusTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
    marginBottom: spacing.xs,
  },
  waterStatusText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.heading,
    flexShrink: 0,
    flexWrap: 'nowrap',
    textAlign: 'left',
  },
  waterAmountText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  waterStatusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBorder + '30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  waterStatusIndicatorText: {
    color: colors.mutedText,
    fontSize: 20,
    fontWeight: '700',
  },
  waterStatusIndicatorCompleted: {
    backgroundColor: colors.green + '20',
    borderColor: colors.green,
  },
  waterStatusIndicatorTextCompleted: {
    color: colors.green,
  },
  waterNoteText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  loadingCardText: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fonts.body,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
