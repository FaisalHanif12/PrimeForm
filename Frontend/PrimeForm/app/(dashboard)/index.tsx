import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Dimensions, RefreshControl, Alert, AppState, ActivityIndicator, DeviceEventEmitter, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
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
import { getUserCacheKey, getCurrentUserId } from '../../src/utils/cacheKeys';
import { getTimeBasedGreeting } from '../../src/utils/greetingUtils';
import { BottomBanner } from '../../src/ads/BottomBanner';


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
  const loadingInProgress = useRef(false);
  const { showToast } = useToast();

  // Centralized date calculation utility for consistency across all components
  const getStandardizedDateInfo = (planStartDate: string) => {
    const today = new Date();
    const startDate = new Date(planStartDate);
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate week based on plan generation day (not Monday)
    // If plan starts mid-week, week 1 includes the generation day and forward
    const currentWeek = Math.floor(daysDiff / 7) + 1;
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.

    return {
      today,
      startDate,
      daysDiff,
      currentWeek,
      dayOfWeek,
      planGenerationDay: startDate.toLocaleDateString('en-US', { weekday: 'long' })
    };
  };

  // Load dynamic data on mount and when user info changes
  // Load dynamic data only when dashboard is actually viewed
  useEffect(() => {
    if (isAuthenticated || hasCompletedSignup) {
      // Don't load immediately - let user trigger it
    }
  }, [isAuthenticated, hasCompletedSignup]);

  // OPTIMIZATION: Load completion states from local storage first, avoid API calls
  // ✅ CRITICAL: Always reload completion states to ensure real-time updates
  // Define this BEFORE the useEffect that uses it
  const loadCompletionStates = useCallback(async (forceRefresh = false) => {
    try {
      // ✅ CRITICAL: Ensure completion services are initialized before loading data
      try {
        const { default: mealCompletionService } = await import('../../src/services/mealCompletionService');
        await mealCompletionService.ensureInitialized();
      } catch (error) {
        console.warn('⚠️ Error ensuring meal completion service initialized:', error);
      }

      try {
        const { default: exerciseCompletionService } = await import('../../src/services/exerciseCompletionService');
        await exerciseCompletionService.ensureInitialized();
      } catch (error) {
        console.warn('⚠️ Error ensuring exercise completion service initialized:', error);
      }

      // OPTIMIZATION: Load from local storage first - no API call needed
      let localMeals = new Set<string>();
      let localExercises = new Set<string>();

      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          // No user ID, skip loading completion data
          setCompletedMeals(new Set());
          setCompletedExercises(new Set());
          setWaterIntake(0);
          setWaterCompleted(false);
          return;
        }

        // ✅ CRITICAL: Load completed meals from local storage with user-specific key
        const mealsKey = await getUserCacheKey('completed_meals', userId);
        const completedMealsData = await AsyncStorage.getItem(mealsKey);
        if (completedMealsData) {
          localMeals = new Set(JSON.parse(completedMealsData) as string[]);
        }

        // ✅ CRITICAL: Load completed exercises from local storage with user-specific key
        const exercisesKey = await getUserCacheKey('completed_exercises', userId);
        const completedExercisesData = await AsyncStorage.getItem(exercisesKey);
        if (completedExercisesData) {
          localExercises = new Set(JSON.parse(completedExercisesData) as string[]);
        }

        // ✅ CRITICAL: Load water intake from local storage with user-specific key
        const waterKey = await getUserCacheKey('water_intake', userId);
        const waterData = await AsyncStorage.getItem(waterKey);
        if (waterData) {
          const waterObj = JSON.parse(waterData);
          // Get today's date in local timezone
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          const year = todayDate.getFullYear();
          const month = String(todayDate.getMonth() + 1).padStart(2, '0');
          const day = String(todayDate.getDate()).padStart(2, '0');
          const today = `${year}-${month}-${day}`;
          setWaterIntake(waterObj[today] || 0);
        } else {
          setWaterIntake(0);
        }

        // ✅ CRITICAL: Load water completion status from local storage with user-specific key
        const waterCompletedKey = await getUserCacheKey('water_completed', userId);
        const waterCompletedData = await AsyncStorage.getItem(waterCompletedKey);
        if (waterCompletedData) {
          const waterCompletedObj = JSON.parse(waterCompletedData);
          // Get today's date in local timezone
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          const year = todayDate.getFullYear();
          const month = String(todayDate.getMonth() + 1).padStart(2, '0');
          const day = String(todayDate.getDate()).padStart(2, '0');
          const today = `${year}-${month}-${day}`;
          setWaterCompleted(waterCompletedObj[today] || false);
        } else {
          setWaterCompleted(false);
        }
      } catch (storageError) {
        // Could not load from local storage - reset to empty
        setCompletedMeals(new Set());
        setCompletedExercises(new Set());
        setWaterIntake(0);
        setWaterCompleted(false);
      }

      // ✅ CRITICAL: Always update state, even if empty, to trigger UI refresh
      setCompletedMeals(localMeals);
      setCompletedExercises(localExercises);

      // OPTIMIZATION: Do NOT refresh full plans when completion events occur
      // Completion events only need to update local completion states, not reload entire plans
      // Full plan refresh should only happen on initial load or manual refresh
      // The completion data is already saved to local storage by the completion services,
      // so we only need to read from local storage here - no API calls needed
    } catch (error) {
      // Failed to load completion states - reset to empty
      setCompletedMeals(new Set());
      setCompletedExercises(new Set());
      setWaterIntake(0);
      setWaterCompleted(false);
    }
  }, []); // ✅ CRITICAL: Empty dependency array since we use getCurrentUserId inside

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
          await AsyncStorage.setItem('last_checked_day', today);
          await loadDynamicData();
        }
      } catch (error) {
        // Error checking for new day
      } finally {
        isChecking = false;
      }
    };

    // Check immediately on mount
    checkForNewDay();
  }, []);

  // ✅ OPTIMIZATION: Combined AppState listener - handles both data refresh AND auth check
  // This prevents duplicate listeners and reduces API calls
  useEffect(() => {
    let isRefreshing = false; // Prevent concurrent refreshes
    let lastActiveTime = 0; // Track last time app became active

    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active' && !isRefreshing) {
        const now = Date.now();
        // ✅ CRITICAL: Debounce rapid app state changes (e.g., keyboard show/hide)
        // Only process if it's been at least 1 second since last activation
        if (now - lastActiveTime < 1000) {
          return;
        }
        lastActiveTime = now;
        isRefreshing = true;

        try {
          // ✅ CRITICAL: Combined logic - check auth AND refresh data
          // Only force refresh if it's a new day
          const today = new Date().toDateString();
          const lastCheckedDay = await AsyncStorage.getItem('last_checked_day');

          if (lastCheckedDay !== today) {
            await AsyncStorage.setItem('last_checked_day', today);
            // Force refresh only on new day
            await Promise.all([
              loadCompletionStates(true),
              loadDynamicData(true)
            ]);
          } else {
            // Not a new day - just reload from local storage, no API call
            await loadCompletionStates();
          }

          // ✅ CRITICAL: Also handle auth check (merged from duplicate listener)
          if (!isAuthenticated) {
            // User is not authenticated, check if they have ever signed up
            const hasEverSignedUp = await AsyncStorage.getItem('primeform_has_ever_signed_up');

            // ✅ CRITICAL: If user has signed up but is not authenticated, redirect to login
            // This prevents guest mode from appearing when app becomes active after token expiration
            if (hasEverSignedUp === 'true') {
              // User has signed up but token expired - redirect to login immediately
              router.replace('/auth/login');
              return;
            }
          }
        } catch (error) {
          // Error refreshing data
        } finally {
          isRefreshing = false;
        }
      }
    };

    // ✅ CRITICAL: Single AppState listener (removed duplicate)
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isAuthenticated]); // Include isAuthenticated to handle auth state changes

  // Listen for meal completion events to update dashboard in real-time
  // OPTIMIZATION: Only update local completion states, do NOT reload full plans
  useEffect(() => {
    const mealCompletedListener = DeviceEventEmitter.addListener('mealCompleted', async (data) => {
      // ✅ CRITICAL: Immediately refresh completion states from local storage - no API calls
      // This ensures dashboard updates in real-time when meals are completed
      await loadCompletionStates(false);
    });

    const dayCompletedListener = DeviceEventEmitter.addListener('dayCompleted', async (data) => {
      // ✅ CRITICAL: Immediately refresh completion states from local storage - no API calls
      await loadCompletionStates(false);
    });

    const exerciseCompletedListener = DeviceEventEmitter.addListener('exerciseCompleted', async (data) => {
      // ✅ CRITICAL: Immediately refresh completion states from local storage - no API calls
      await loadCompletionStates(false);
    });

    const waterIntakeListener = DeviceEventEmitter.addListener('waterIntakeUpdated', async (data) => {
      // ✅ CRITICAL: Refresh water completion/intake from local storage so dashboard reflects "Done"
      await loadCompletionStates(false);
    });

    const dietProgressUpdatedListener = DeviceEventEmitter.addListener('dietProgressUpdated', async (data) => {
      // ✅ CRITICAL: Refresh completion states when diet progress is updated
      await loadCompletionStates(false);
    });

    const workoutProgressUpdatedListener = DeviceEventEmitter.addListener('workoutProgressUpdated', async (data) => {
      // ✅ CRITICAL: Refresh completion states when workout progress is updated
      await loadCompletionStates(false);
    });

    return () => {
      mealCompletedListener.remove();
      dayCompletedListener.remove();
      exerciseCompletedListener.remove();
      waterIntakeListener.remove();
      dietProgressUpdatedListener.remove();
      workoutProgressUpdatedListener.remove();
    };
  }, [loadCompletionStates]); // ✅ CRITICAL: Include loadCompletionStates in dependencies

  // Check app state on mount
  useEffect(() => {
    const checkAppState = async () => {
      try {
        // ✅ CRITICAL: First check if user has ever signed up
        // If they have, and they're not authenticated, redirect to login immediately
        const hasEverSignedUp = await AsyncStorage.getItem('primeform_has_ever_signed_up');
        
        // ✅ CRITICAL: If user has signed up but is not authenticated, redirect to login
        // This prevents any possibility of showing guest mode to users who have signed up
        if (hasEverSignedUp === 'true' && !isAuthenticated) {
          // User has signed up but token expired - redirect to login
          router.replace('/auth/login');
          return;
        }

        // Check if this is the first time the app has ever been launched
        const isFirstLaunch = await AsyncStorage.getItem('primeform_first_launch');
        const deviceLanguageSelected = await AsyncStorage.getItem('primeform_device_language_selected');

        // CRITICAL: Language modal should ONLY show for first-time guest users
        // According to workflow Phase 4: After sign-up, language modal NEVER appears again
        if (hasEverSignedUp === 'true' || isAuthenticated) {
          // Ensure language modal never shows for users who have ever signed up
          await AsyncStorage.setItem('primeform_device_language_selected', 'true');
          setShowLanguageModal(false);
          return;
        }

        // Check if this is the first time ANY user has opened the app on this device
        if (isFirstLaunch === null && !deviceLanguageSelected) {
          // Mark as first launch and device language selection
          await AsyncStorage.setItem('primeform_first_launch', 'false');
          await AsyncStorage.setItem('primeform_device_language_selected', 'true');
          setShowLanguageModal(true);
        }

        // Check if user has completed signup - check both authentication and signup completion
        const signupCompleted = await AsyncStorage.getItem('primeform_signup_completed');

        if (isAuthenticated) {
          // User is authenticated - mark signup as completed
          setHasCompletedSignup(true);
          await AsyncStorage.setItem('primeform_signup_completed', 'true');
          await AsyncStorage.setItem('primeform_has_ever_signed_up', 'true');
        } else if (signupCompleted === 'true' || hasEverSignedUp === 'true') {
          // ✅ CRITICAL: User has completed signup but is not authenticated
          // This means token expired - redirect to login to prevent guest mode
          if (hasEverSignedUp === 'true') {
            router.replace('/auth/login');
            return;
          }
          setHasCompletedSignup(true);
        } else {
          // If not authenticated and no signup completion, ensure no access
          setHasCompletedSignup(false);
        }
      } catch (error) {
        // Failed to check app state - check hasEverSignedUp as fallback
        try {
          const hasEverSignedUp = await AsyncStorage.getItem('primeform_has_ever_signed_up');
          if (hasEverSignedUp === 'true' && !isAuthenticated) {
            router.replace('/auth/login');
          }
        } catch (fallbackError) {
          // Ignore fallback errors
        }
      }
    };
    checkAppState();
  }, [isAuthenticated, hasSelectedLanguage]);

  // Additional effect to handle authentication state changes
  useEffect(() => {
    // Handle authentication state changes silently
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
          email: isAuthenticated ? (user?.email || 'user@example.com') : (hasCompletedSignup ? 'user@purebody.com' : 'guest@purebody.com'),
          isEmailVerified: isAuthenticated ? (user?.isEmailVerified || false) : hasCompletedSignup,
          memberSince: new Date().toISOString(),
          daysSinceJoining: 1,
          lastLogin: new Date().toISOString()
        },
        notifications: []
      });
    } catch (error) {
      // Failed to load dashboard
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // OPTIMIZATION: Load user info from cache if available, only call API if no cache
    loadUserInfoFromCacheFirst();
  }, []);

  // Load user info when profile page is opened if it's missing
  useEffect(() => {
    if (showProfilePage && !userInfo && isAuthenticated) {
      // Profile page opened but no user info - load it
      loadUserInfo();
    }
  }, [showProfilePage, isAuthenticated]);

  // OPTIMIZATION: Check backend availability using cached data only - no API call
  const checkBackendAvailability = async () => {
    // Use cached data to determine availability - no API call needed
    const cachedProfile = await userProfileService.getCachedData();
    if (cachedProfile) {
      setBackendAvailable(true);
      setOfflineMode(false);
    } else {
      // No cached data - assume offline mode
      setBackendAvailable(false);
      setOfflineMode(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Use cached data - no API calls unless data is stale
      // API calls are only made when user actually updates/saves data
      await loadDashboard();
      await loadCompletionStates();
    } catch (error) {
      // Failed to refresh dashboard
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

      if (response && response.success) {
        setUserInfo(userInfoData);
        setShowUserInfoModal(false);
        showToast('success', 'Profile created successfully!');
      } else {
        // Show error to user
        showToast('error', 'Failed to save profile. Please try again.');
      }
    } catch (error) {
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
      // Failed to save cancellation status
    }
  };

  // OPTIMIZATION: Load user info from cache first, fallback to API only if authenticated and no cache
  const loadUserInfoFromCacheFirst = async () => {
    try {
      // Check if we have cached data first (await the async call)
      const cachedData = await userProfileService.getCachedData();
      if (cachedData && cachedData.success && cachedData.data) {
        // Validate cached data belongs to current user
        const { getCurrentUserId, validateCachedData } = await import('../../src/utils/cacheKeys');
        const userId = await getCurrentUserId();
        if (userId && validateCachedData(cachedData.data, userId)) {
          setUserInfo(cachedData.data);
          setBackendAvailable(true);
          setOfflineMode(false);
        } else {
          // Cached data doesn't belong to current user, clear it and load fresh
          await userProfileService.clearCache();
          if (isAuthenticated) {
            await loadUserInfo();
          } else {
            setUserInfo(null);
            setBackendAvailable(false);
            setOfflineMode(true);
          }
        }
      } else {
        // No cached data - but if user is authenticated, load from API once to populate cache
        if (isAuthenticated) {
          await loadUserInfo();
        } else {
          // Not authenticated - set to null
          setUserInfo(null);
          setBackendAvailable(false);
          setOfflineMode(true);
        }
      }
    } catch (error) {
      // Failed to load user info from cache
      if (isAuthenticated) {
        // Try API as fallback
        await loadUserInfo();
      } else {
        setUserInfo(null);
      }
    }
  };

  // Load user info from API (only called when cache is empty or forced)
  const loadUserInfo = async (forceRefresh = false) => {
    try {
      // Load user profile from backend database
      const response = await userProfileService.getUserProfile(forceRefresh);

      if (response.success && response.data) {
        setUserInfo(response.data);
        setBackendAvailable(true);
        setOfflineMode(false);
      } else {
        // No profile exists yet or failed to load
        setUserInfo(null);
      }
    } catch (error) {
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
        // Refresh cache with updated data (API call is necessary here to sync cache)
        await userProfileService.getUserProfile(true);
      } else {
        showToast('error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      showToast('error', 'Failed to update profile. Please check your connection and try again.');
    }
  };



  const handleLogout = async () => {
    try {
      await authLogout();
      router.replace('/auth/login');
    } catch (error) {
      router.replace('/auth/login'); // Navigate anyway
    }
  };

  const handleQuickAction = (action: string) => {
    // Feature coming soon - no action needed
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
            showToast('error', 'Failed to logout. Please try again.');
          }
        }
        break;
      case 'language':
        // Navigate to language preferences page
        router.push('/(dashboard)/language');
        break;
      case 'sport-mode':
        router.push('/(dashboard)/sport-mode');
        break;
      default:
        break;
    }
  };

  // Load dynamic data - with optional force refresh
  const loadDynamicData = useCallback(async (forceRefresh = false) => {
    // Prevent concurrent calls
    if (loadingInProgress.current) {
      return;
    }

    try {
      loadingInProgress.current = true;
      setIsLoadingPlans(true);
      setPlansLoaded(false);

      // Load both plans in parallel - uses cache by default, API only when needed
      const [dietPlanData, workoutPlanData] = await Promise.allSettled([
        forceRefresh ? aiDietService.refreshDietPlanFromDatabase() : aiDietService.loadDietPlanFromDatabase(),
        forceRefresh ? aiWorkoutService.refreshWorkoutPlanFromDatabase() : aiWorkoutService.loadWorkoutPlanFromDatabase()
      ]);

      // Handle results with proper error handling
      const dietPlan = dietPlanData.status === 'fulfilled' ? dietPlanData.value : null;
      const workoutPlan = workoutPlanData.status === 'fulfilled' ? workoutPlanData.value : null;

      // Handle rejected promises silently

      // Process diet plan
      if (dietPlan) {
        setDietPlan(dietPlan);

        // Get today's meals using centralized date logic
        const dateInfo = getStandardizedDateInfo(dietPlan.startDate);

        // Get the day from the 7-day pattern
        // Diet weeklyPlan starts with Sunday at index 0, so we use dayOfWeek directly
        const todayMealData = dietPlan.weeklyPlan[dateInfo.dayOfWeek];

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

        // Get the day from the 7-day pattern
        // Workout weeklyPlan starts with Monday at index 0, so we need to adjust:
        // Sunday (0) -> 6, Monday (1) -> 0, Tuesday (2) -> 1, etc.
        const workoutDayIndex = workoutDateInfo.dayOfWeek === 0 ? 6 : workoutDateInfo.dayOfWeek - 1;
        const todayWorkoutData = workoutPlan.weeklyPlan[workoutDayIndex];

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
      // Failed to load dynamic data
    } finally {
      setIsLoadingPlans(false);
      loadingInProgress.current = false;
    }
  }, [loadCompletionStates]);

  // Function to refresh dashboard data (can be called from other components)
  const refreshDashboardData = async () => {
    await loadDynamicData();
  };

  // Load data when user actually needs it (lazy loading)
  const loadDataIfNeeded = async () => {
    if (!plansLoaded && !isLoadingPlans) {
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

    // Get today's date for completion checking (local timezone)
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const year = todayDate.getFullYear();
    const month = String(todayDate.getMonth() + 1).padStart(2, '0');
    const day = String(todayDate.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    // Helper function to check if a meal is completed
    // Meal ID format: `${date}-${mealType}-${mealName}`
    // Example: "2025-12-17-breakfast-Vegetable Dalia (Broken Wheat Porridge)"
    const isMealCompleted = (meal: typeof todayMeals[0]): boolean => {
      // Extract meal type and name from dashboard meal format
      // Format: "🌅 Vegetable Dalia (Broken Wheat Porridge)" or "🌞 Kadhi Pakora with Rice" or "🍎 Snack 1: Rice Cakes"
      let mealType: string;
      let mealName: string;
      
      if (meal.name.startsWith('🌅')) {
        mealType = 'breakfast';
        mealName = meal.name.replace(/^🌅\s*/, '').trim();
      } else if (meal.name.startsWith('🌞')) {
        mealType = 'lunch';
        mealName = meal.name.replace(/^🌞\s*/, '').trim();
      } else if (meal.name.startsWith('🌙')) {
        mealType = 'dinner';
        mealName = meal.name.replace(/^🌙\s*/, '').trim();
      } else if (meal.name.startsWith('🍎')) {
        // Snack format: "🍎 Snack 1: Rice Cakes with Avocado"
        mealType = 'snack';
        mealName = meal.name.replace(/^🍎\s*Snack\s+\d+:\s*/, '').trim();
      } else {
        // Fallback: try to extract from any format
        mealName = meal.name.replace(/^[🌅🌞🌙🍎]+\s*/, '').replace(/^(Breakfast|Lunch|Dinner|Snack \d+):\s*/, '').trim();
        // Try to infer meal type from name pattern
        if (meal.name.includes('Breakfast') || meal.name.includes('🌅')) {
          mealType = 'breakfast';
        } else if (meal.name.includes('Lunch') || meal.name.includes('🌞')) {
          mealType = 'lunch';
        } else if (meal.name.includes('Dinner') || meal.name.includes('🌙')) {
          mealType = 'dinner';
        } else {
          mealType = 'snack';
        }
      }

      // Check if any completion key matches: `${today}-${mealType}-${mealName}`
      const expectedMealId = `${today}-${mealType}-${mealName}`;
      
      return Array.from(completedMeals).some(completedKey => {
        if (typeof completedKey !== 'string') return false;
        // Exact match is best
        if (completedKey === expectedMealId) return true;
        // Also check if it contains both date and meal name (for flexibility)
        return completedKey.includes(today) && completedKey.includes(mealType) && completedKey.includes(mealName);
      });
    };

    // Check completion using the improved matching logic
    const consumedCalories = todayMeals.filter(isMealCompleted).reduce((sum, meal) => sum + meal.calories, 0);
    const remainingCalories = Math.max(0, totalCalories - consumedCalories);

    // Check completed workouts
    const completedWorkouts = todayWorkouts.filter(workout =>
      completedExercises.has(`${today}-${workout.name}`)
    ).length;

    // Check completed meals count
    const completedMealsCount = todayMeals.filter(isMealCompleted).length;
    const remainingMeals = todayMeals.length - completedMealsCount;

    return [
      { label: t('dashboard.stats.calories'), value: remainingCalories.toLocaleString(), icon: 'flame' as const, color: colors.gold },
      { label: t('dashboard.stats.water'), value: waterCompleted ? t('dashboard.stats.water.done') : t('dashboard.stats.water.due'), icon: 'water' as const, color: waterCompleted ? colors.green : colors.blue },
      { label: t('dashboard.stats.workouts'), value: (todayWorkouts.length - completedWorkouts).toString(), icon: 'barbell' as const, color: colors.green },
      { label: t('dashboard.stats.mealsRemaining'), value: remainingMeals.toString(), icon: 'restaurant' as const, color: colors.purple },
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
      await changeLanguage(language);
      // Mark device language as selected (this persists across all users on this device)
      await AsyncStorage.setItem('primeform_device_language_selected', 'true');
      // Close the modal and mark first launch as complete
      setShowLanguageModal(false);
      await AsyncStorage.setItem('primeform_first_launch', 'false');
      showToast('success', 'Language updated successfully!');
    } catch (error) {
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

  // ✅ REMOVED: Duplicate AppState listener - functionality merged into the single listener above
  // This prevents duplicate API calls and reduces "too many requests" errors

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
      // Failed to reset signup status
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
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <View style={styles.mainContainer}>
          {/* Header */}
          <DashboardHeader
            userName={(() => {
              const displayName = isAuthenticated ?
                transliterateName((user?.fullName || dashboardData?.user?.fullName || 'User').split(' ')[0]) :
                'Guest';
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
              <Text style={styles.greetingText}>
                {getTimeBasedGreeting(language)}, {transliterateName((user?.fullName || dashboardData?.user?.fullName || 'Guest').split(' ')[0])} 💪
              </Text>
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
                title={t('dashboard.meal.plan')}
                meals={mockMeals}
                totalCalories={mockMeals.reduce((sum, meal) => sum + meal.calories, 0)}
                onPress={() => handleFeatureAccess('AI Diet')}
                delay={300}
              />
            ) : isLoadingPlans ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.loadingCardText}>{t('dashboard.loading.mealPlan')}</Text>
              </View>
            ) : todayMeals.length > 0 ? (
              <MealPlanCard
                title={t('dashboard.meal.plan')}
                meals={todayMeals}
                totalCalories={todayMeals.reduce((sum, meal) => sum + meal.calories, 0)}
                completedMeals={completedMeals}
                onPress={() => handleFeatureAccess('AI Diet')}
                delay={300}
              />
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardTitle}>{t('dashboard.empty.mealPlan.title')}</Text>
                <Text style={styles.emptyCardText}>{t('dashboard.empty.mealPlan.text')}</Text>
              </View>
            )}

            {/* Today's Workout Plan */}
            {!isAuthenticated ? (
              <WorkoutPlanCard
                title={t('dashboard.workout.plan')}
                workouts={mockWorkouts}
                completedExercises={completedExercises}
                onPress={() => handleFeatureAccess('AI Workout')}
                delay={400}
              />
            ) : isLoadingPlans ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.loadingCardText}>{t('dashboard.loading.workoutPlan')}</Text>
              </View>
            ) : (
              <WorkoutPlanCard
                title={t('dashboard.workout.plan')}
                workouts={todayWorkouts}
                completedExercises={completedExercises}
                onPress={() => handleFeatureAccess('AI Workout')}
                delay={400}
              />
            )}

            {/* Water Intake Section - Status Only */}
            <View style={styles.waterSection}>
              <Text style={styles.waterTitle}>💧 {t('dashboard.water.intake')}</Text>
              <Text style={styles.waterTarget}>{t('dashboard.water.target')} {targetWater}ml</Text>

              <View style={styles.waterStatusOnlyContainer}>
                <View style={styles.waterStatusInfo}>
                  <View style={styles.waterStatusTextContainer}>
                    <Text style={styles.waterStatusText} numberOfLines={1}>
                      {waterCompleted ? '✅ Done' : '⏱️ Due'}
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
                  <Ionicons 
                    name={waterCompleted ? "checkmark-circle" : "time-outline"} 
                    size={24} 
                    color={waterCompleted ? colors.green : colors.mutedText} 
                  />
                </View>
              </View>

              <Text style={styles.waterNoteText}>
                Manage water intake in your diet plan
              </Text>
            </View>

            {/* Banner Ad - Below Water Intake Section */}
            <View style={styles.bannerAdContainer}>
              <BottomBanner />
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
            // When user goes back, set English as default, close modal, and mark first launch as complete
            await changeLanguage('en');
            setShowLanguageModal(false);
            // Mark that first launch is complete (even if user didn't explicitly choose)
            await AsyncStorage.setItem('primeform_first_launch', 'false');
          }}
        />

        {/* Signup Modal */}
        <SignupModal
          visible={showSignupModal}
          onSignup={handleSignup}
          onClose={handleSignupModalClose}
          featureName={currentFeature}
        />
      </SafeAreaView>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
  bannerAdContainer: {
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50, // Reserve space for banner ad
  },
});
