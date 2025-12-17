import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Modal, ScrollView, Alert, TouchableOpacity, Dimensions, Image, ActivityIndicator, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp, FadeInLeft, FadeInRight, SlideInUp } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { useToast } from '../../src/context/ToastContext';
import userProfileService from '../../src/services/userProfileService';
import aiDietService from '../../src/services/aiDietService';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import Sidebar from '../../src/components/Sidebar';
import UserInfoModal from '../../src/components/UserInfoModal';
import ProfilePage from '../../src/components/ProfilePage';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import DietPlanDisplay from '../../src/components/DietPlanDisplay';
import LoadingModal from '../../src/components/LoadingModal';
import NotificationModal from '../../src/components/NotificationModal';
import { useNotifications } from '../../src/contexts/NotificationContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

export default function DietScreen() {
  const { user } = useAuthContext();
  const { t, language } = useLanguage();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasCheckedLocalStorage, setHasCheckedLocalStorage] = useState(false);
  const [justDeleted, setJustDeleted] = useState(false); // Flag to track if plan was just deleted
  const { showToast } = useToast();

  // Helper function to translate dynamic values (same approach as ProfilePage)
  const translateValue = (value: string, type: 'goal' | 'diet') => {
    if (language === 'ur' && value) {
      // Use the same arrays as ProfilePage for consistency
      const bodyGoals = [
        { en: 'Lose Fat', ur: 'چربی کم کریں' },
        { en: 'Gain Muscle', ur: 'پٹھے بنائیں' },
        { en: 'Maintain Weight', ur: 'وزن برقرار رکھیں' },
        { en: 'General Training', ur: 'عمومی تربیت' },
        { en: 'Improve Fitness', ur: 'فٹنس بہتر کریں' }
      ];

      const dietPreferences = [
        { en: 'Vegetarian', ur: 'سبزی خور' },
        { en: 'Non-Vegetarian', ur: 'سبزی خور نہیں' },
        { en: 'Vegan', ur: 'ویگن' },
        { en: 'Flexitarian', ur: 'فلیکسیٹیرین' },
        { en: 'Pescatarian', ur: 'پیسکیٹیرین' }
      ];

      let options: { en: string; ur: string }[];
      if (type === 'goal') {
        options = bodyGoals;
      } else if (type === 'diet') {
        options = dietPreferences;
      } else {
        return value;
      }

      // Find the matching option and return Urdu text
      const option = options.find(opt => opt.en === value);
      if (option) {
        return option.ur;
      }
    }
    return value;
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        // OPTIMIZATION: Use cached data only - no API calls on page visit
        const cachedData = await userProfileService.getCachedData();
        // Validate cached data belongs to current user
        if (cachedData && cachedData.data) {
          const { getCurrentUserId, validateCachedData } = await import('../../src/utils/cacheKeys');
          const userId = await getCurrentUserId();
          if (userId && validateCachedData(cachedData.data, userId)) {
            setUserInfo(cachedData.data);
            setIsLoading(false);
          } else {
            // Cached data doesn't belong to current user, clear it
            await userProfileService.clearCache();
            setIsLoading(false);
          }
        } else {
          // No cached data - show profile creation UI
          setIsLoading(false);
        }

        // Load diet plan from local cache only (no API call)
        await loadDietPlan();
      } catch (error) {
        // Error during initialization
      } finally {
        setIsLoadingPlan(false);
        setInitialLoadComplete(true);
      }
    };

    initializeData();
  }, []);

  // Reset layout when screen comes into focus (after returning from modals)
  useFocusEffect(
    React.useCallback(() => {
      // Reset status bar to ensure proper layout
      StatusBar.setBarStyle('light-content');
      if (StatusBar.setBackgroundColor) {
        StatusBar.setBackgroundColor(colors.background, false);
      }
      // Force layout recalculation
      setTimeout(() => {
        StatusBar.setHidden(false, 'none');
      }, 0);
      
      // ✅ CRITICAL: If plan was just deleted, ALWAYS check database first and never use cache
      // This prevents the plan from reappearing when navigating back
      if (justDeleted) {
        // Plan was deleted, verify with database first (force refresh, skip cache)
        (async () => {
          try {
            // Force refresh from database - this will skip all caches
            const dbPlan = await aiDietService.loadDietPlanFromDatabase(true);
            if (!dbPlan) {
              // Confirmed: no plan in database
              setDietPlan(null);
              setLoadError(null);
              setHasCheckedLocalStorage(true);
              setIsLoadingPlan(false);
              // Keep justDeleted flag until we're sure it's cleared
              // This prevents cache reload on subsequent navigations
            } else {
              // Plan still exists in database (deletion might have failed)
              // Try to delete it again
              console.warn('⚠️ Plan still exists after deletion, attempting to delete again...');
              try {
                await aiDietService.clearDietPlanFromDatabase();
                setDietPlan(null);
                setLoadError(null);
              } catch (deleteError) {
                console.error('❌ Failed to delete plan on retry:', deleteError);
                // Still set to null to show generation screen
                setDietPlan(null);
                setLoadError(null);
              }
              setHasCheckedLocalStorage(true);
              setIsLoadingPlan(false);
            }
          } catch (error) {
            // On error, assume plan is deleted and show generation screen
            console.warn('⚠️ Error checking database after deletion:', error);
            setDietPlan(null);
            setLoadError(null);
            setHasCheckedLocalStorage(true);
            setIsLoadingPlan(false);
          }
        })();
        // Don't reset justDeleted flag here - let it persist to prevent cache reload
        // It will be reset when user generates a new plan
      } else if (!dietPlan && hasCheckedLocalStorage) {
        // If no plan and we've checked, reload to see if one was created elsewhere
        // But only if we haven't just deleted
        loadDietPlan(false);
      }
    }, [justDeleted])
  );

  const handleProfilePress = () => {
    setSidebarVisible(true);
  };

  const handleSidebarMenuPress = async (action: string) => {
    switch (action) {
      case 'profile':
        setShowProfilePage(true);
        break;
      case 'edit_profile':
        setShowUserInfoModal(true);
        break;
      case 'sport-mode':
        router.push('/(dashboard)/sport-mode');
        break;
      case 'streak':
        router.push('/(dashboard)/streak');
        break;
      case 'ai-trainer':
        router.push('/(dashboard)/ai-trainer');
        break;
      case 'language':
        router.push('/(dashboard)/language');
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
        try {
          const { authService } = await import('../../src/services/authService');
          await authService.logout();
          router.replace('/auth/login');
        } catch (error) {
          showToast('error', 'Failed to logout. Please try again.');
        }
        break;
      default:
        break;
    }
  };

  const handleGenerateClick = async () => {
    if (userInfo) {
      // User already has profile, generate diet plan
      setIsGenerating(true);
      try {
        const response = await aiDietService.generateDietPlan(userInfo);

        if (response.success && response.data) {
          setDietPlan(response.data);
          setJustDeleted(false); // ✅ Reset deletion flag when new plan is generated
          showToast('success', 'Your personalized diet plan is ready!');
        } else {
          showToast('error', 'Failed to generate diet plan. Please try again.');
        }
      } catch (error) {
        // Show interactive error alert
        const errorMessage = error instanceof Error ? error.message : 'Something went wrong';

        if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
          showToast('error', 'Network issue detected. Please check your connection and try again.');
        } else if (errorMessage.includes('API')) {
          showToast('error', 'AI service is temporarily busy. Please try again in a moment.');
        } else {
          showToast('error', 'Unable to generate diet plan. Please try again.');
        }
      } finally {
        setIsGenerating(false);
      }
    } else {
      // User needs to create profile first
      setShowUserInfoModal(true);
    }
  };

  const handleCompleteUserInfo = async (userInfoData: any) => {
    try {
      const response = await userProfileService.createOrUpdateProfile(userInfoData);

      if (response && response.success) {
        setUserInfo(userInfoData);
        setShowUserInfoModal(false);
        showToast('success', 'Profile created! Now generating your diet plan...');

        // Automatically generate diet plan after profile creation
        try {
          setIsGenerating(true);
          const dietResponse = await aiDietService.generateDietPlan(userInfoData);

          if (dietResponse.success && dietResponse.data) {
            setDietPlan(dietResponse.data);
            setJustDeleted(false); // ✅ Reset deletion flag when new plan is generated
            showToast('success', 'Your personalized diet plan is ready!');
          } else {
            showToast('error', 'Profile saved, but diet plan generation failed. Please try again.');
          }
        } catch (error) {
          showToast('error', 'Profile saved, but diet plan generation failed. Please try again.');
        } finally {
          setIsGenerating(false);
        }
      } else {
        showToast('error', 'Failed to save profile. Please try again.');
      }
    } catch (error) {
      showToast('error', 'Failed to save profile. Please check your connection and try again.');
    }
  };

  const handleCancelUserInfo = async () => {
    try {
      setShowUserInfoModal(false);
    } catch (error) {
      // Failed to handle cancellation
    }
  };

  const handleUpdateUserInfo = async (updatedUserInfo: any) => {
    try {
      const response = await userProfileService.createOrUpdateProfile(updatedUserInfo);
      if (response.success) {
        setUserInfo(updatedUserInfo);
      } else {
        showToast('error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      showToast('error', 'Failed to update profile. Please check your connection and try again.');
    }
  };

  // Load user info when profile page is opened if it's missing
  useEffect(() => {
    if (showProfilePage && !userInfo) {
      const loadUserInfoForProfile = async () => {
        try {
          const cachedData = await userProfileService.getCachedData();
          if (cachedData && cachedData.data) {
            setUserInfo(cachedData.data);
          } else {
            const response = await userProfileService.getUserProfile();
            if (response.success && response.data) {
              setUserInfo(response.data);
            }
          }
        } catch (error) {
          // Failed to load user info
    }
  };
      loadUserInfoForProfile();
    }
  }, [showProfilePage]);

  // NOTE: loadUserInfo is kept for cases where profile needs to be loaded after creation
  // but it's not called on page initialization to avoid unnecessary API calls
  const loadUserInfo = async () => {
    try {
      const response = await userProfileService.getUserProfile();

      if (response.success) {
        if (response.data) {
          setUserInfo(response.data);
        } else {
          setUserInfo(null);
        }
      }
    } catch (error) {
      // Failed to load user info
    } finally {
      setIsLoading(false);
    }
  };

  const loadDietPlan = async (skipCache = false) => {
    try {
      setLoadError(null);
      
      // ✅ CRITICAL: If plan was just deleted, ALWAYS check database first with force refresh
      // This ensures we don't reload from cache after deletion
      if (justDeleted || skipCache) {
        setHasCheckedLocalStorage(true);
        // Force refresh from database - this will return null if plan was deleted
        const dietPlanFromDB = await aiDietService.loadDietPlanFromDatabase(true);
        if (dietPlanFromDB) {
          // Plan exists in database (shouldn't happen after deletion, but handle it)
          setDietPlan(dietPlanFromDB);
          setJustDeleted(false); // Reset flag
        } else {
          // No plan found in database - confirmed deleted
          setDietPlan(null);
          setJustDeleted(false); // Reset flag
          console.log('ℹ️ No diet plan found - confirmed deleted');
        }
        return;
      }
      
      // Normal flow: Check local storage first (ONLY if not just deleted)
      // ✅ CRITICAL: Never use cache if justDeleted flag is set
      if (!justDeleted) {
        try {
          const { getCurrentUserId, getUserCacheKey, validateCachedData } = await import('../../src/utils/cacheKeys');
          const Storage = await import('../../src/utils/storage');
          
          const userId = await getCurrentUserId();
          if (userId) {
            const userCacheKey = await getUserCacheKey('cached_diet_plan', userId);
            const cachedPlan = await Storage.default.getItem(userCacheKey);
            if (cachedPlan) {
              const plan = JSON.parse(cachedPlan);
              // Validate cached data belongs to current user
              if (validateCachedData(plan, userId) && plan && plan.weeklyPlan && Array.isArray(plan.weeklyPlan) && plan.weeklyPlan.length > 0) {
                console.log('✅ Found diet plan in local storage, using it immediately');
                setDietPlan(plan);
                setHasCheckedLocalStorage(true);
                setIsLoadingPlan(false);
                setInitialLoadComplete(true);
                
                // ✅ OPTIMIZATION: Only sync in background if cache might be stale (older than 30 minutes)
                // Diet plans don't change frequently, so we can extend cache time
                // This prevents unnecessary API calls when data is fresh
                const planTimestamp = plan.updatedAt || plan.createdAt;
                const CACHE_STALE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
                const shouldSync = planTimestamp 
                  ? (Date.now() - new Date(planTimestamp).getTime() > CACHE_STALE_THRESHOLD)
                  : false; // If no timestamp, assume cache is fresh (don't sync)
                
                if (shouldSync) {
                  // Only sync if cache might be stale
                  aiDietService.loadDietPlanFromDatabase().then(async (dbPlan) => {
                    if (dbPlan && dbPlan !== plan) {
                      setDietPlan(dbPlan);
                    } else if (!dbPlan) {
                      // Database says no plan - clear local cache and state
                      setDietPlan(null);
                      const { getCurrentUserId, getUserCacheKey } = await import('../../src/utils/cacheKeys');
                      const Storage = await import('../../src/utils/storage');
                      const userId = await getCurrentUserId();
                      if (userId) {
                        const key = await getUserCacheKey('cached_diet_plan', userId);
                        await Storage.default.removeItem(key);
                      }
                      await Storage.default.removeItem('cached_diet_plan');
                    }
                  }).catch(() => {
                    // Ignore background sync errors
                  });
                }
                return;
              }
            }
          }
        } catch (localError) {
          console.warn('Could not check local storage:', localError);
        }
      } else {
        // If justDeleted is true, skip cache entirely and go straight to database
        console.log('⚠️ Skipping cache check - plan was just deleted');
      }
      
      setHasCheckedLocalStorage(true);
      
      // If no local cache, try to load from database
      const dietPlanFromDB = await aiDietService.loadDietPlanFromDatabase(false);
      if (dietPlanFromDB) {
        setDietPlan(dietPlanFromDB);
      } else {
        // No plan found - this is OK, user needs to generate one
        console.log('ℹ️ No diet plan found - user needs to generate one');
      }
    } catch (error) {
      console.error('❌ Error loading diet plan:', error);
      
      // ✅ CRITICAL: On error, try local storage as last resort before showing generation screen
      // BUT only if we didn't just delete
      if (!justDeleted && !skipCache) {
        try {
          const { getCurrentUserId, getUserCacheKey, validateCachedData } = await import('../../src/utils/cacheKeys');
          const Storage = await import('../../src/utils/storage');
          
          const userId = await getCurrentUserId();
          if (userId) {
            const userCacheKey = await getUserCacheKey('cached_diet_plan', userId);
            const cachedPlan = await Storage.default.getItem(userCacheKey);
            if (cachedPlan) {
              const plan = JSON.parse(cachedPlan);
              // Validate cached data belongs to current user
              if (validateCachedData(plan, userId) && plan && plan.weeklyPlan && Array.isArray(plan.weeklyPlan) && plan.weeklyPlan.length > 0) {
                console.log('✅ Fallback: Found diet plan in local storage after error');
                setDietPlan(plan);
                setLoadError(null); // Clear error since we found plan locally
                return;
              }
            }
          }
        } catch (localError) {
          console.warn('Could not check local storage on error:', localError);
        }
      }
      
      // Only set error if we truly have no plan
      setLoadError('Failed to load diet plan. Please check your connection.');
    }
  };

  const handleTabPress = (tab: 'home' | 'diet' | 'gym' | 'workout' | 'progress') => {
    if (tab === 'home') {
      router.push('/(dashboard)');
    } else if (tab === 'workout') {
      router.push('/(dashboard)/workout');
    } else if (tab === 'gym') {
      router.push('/(dashboard)/gym');
    } else if (tab === 'progress') {
      router.push('/(dashboard)/progress');
    }
  };

  // Render content based on user info and diet plan status
  const renderContent = () => {
    // ✅ CRITICAL: Show loading while checking local storage or loading plan
    // Don't show generation screen until we've confirmed no plan exists
    if (!hasCheckedLocalStorage || isLoadingPlan || (isLoading && !initialLoadComplete)) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading your diet plan...</Text>
        </View>
      );
    }

    // ✅ CRITICAL: If we have a diet plan (even if userInfo is null), show it
    // This prevents showing generation screen when plan exists but userInfo hasn't loaded yet
    if (dietPlan && dietPlan.weeklyPlan && Array.isArray(dietPlan.weeklyPlan) && dietPlan.weeklyPlan.length > 0) {
      return (
        <DietPlanDisplay
          dietPlan={dietPlan}
          onGenerateNew={async () => {
            try {
              // Set deletion flag FIRST to prevent cache reload
              setJustDeleted(true);
              
              // Clear all diet plan data from database and cache
              await aiDietService.clearDietPlanFromDatabase();
              
              // Also manually clear any remaining cache keys (double-check for completeness)
              const { getCurrentUserId, getUserCacheKey } = await import('../../src/utils/cacheKeys');
              const Storage = await import('../../src/utils/storage');
              const userId = await getCurrentUserId();
              
              if (userId) {
                const userCacheKey = await getUserCacheKey('cached_diet_plan', userId);
                await Storage.default.removeItem(userCacheKey);
                
                // Clear all related completion data
                const completedMealsKey = await getUserCacheKey('completed_meals', userId);
                const completedDaysKey = await getUserCacheKey('completed_diet_days', userId);
                const waterIntakeKey = await getUserCacheKey('water_intake', userId);
                const waterCompletedKey = await getUserCacheKey('water_completed', userId);
                
                await Storage.default.removeItem(completedMealsKey);
                await Storage.default.removeItem(completedDaysKey);
                await Storage.default.removeItem(waterIntakeKey);
                await Storage.default.removeItem(waterCompletedKey);
              }
              
              // Clear global keys as well
              await Storage.default.removeItem('cached_diet_plan');
              await Storage.default.removeItem('completed_meals');
              await Storage.default.removeItem('completed_diet_days');
              await Storage.default.removeItem('water_intake');
              await Storage.default.removeItem('water_completed');
              
              // Clear local state immediately to trigger UI update
              setDietPlan(null);
              setLoadError(null); // Clear any previous errors
              setHasCheckedLocalStorage(true); // Set to true so generation screen shows
              setIsLoadingPlan(false); // Don't show loading - go straight to generation screen
              // ✅ CRITICAL: Keep justDeleted flag set to prevent cache reload when navigating back
              // This flag will persist until user generates a new plan
              
              // Small delay to ensure cache is fully cleared before showing generation screen
              await new Promise(resolve => setTimeout(resolve, 100));
              
              showToast('success', 'Diet plan deleted successfully. You can now generate a new one.');
            } catch (error) {
              console.error('Error clearing diet plan:', error);
              
              // Even if there's an error, clear local state to ensure navigation works
              setJustDeleted(true); // Still set flag to prevent cache reload
              setDietPlan(null);
              setLoadError(null); // Clear any previous errors
              setHasCheckedLocalStorage(true);
              setIsLoadingPlan(false);
              
              // Try to clear cache manually as fallback
              try {
                const { getCurrentUserId, getUserCacheKey } = await import('../../src/utils/cacheKeys');
                const Storage = await import('../../src/utils/storage');
                const userId = await getCurrentUserId();
                if (userId) {
                  const userCacheKey = await getUserCacheKey('cached_diet_plan', userId);
                  await Storage.default.removeItem(userCacheKey);
                  
                  // Clear completion data as well
                  const completedMealsKey = await getUserCacheKey('completed_meals', userId);
                  const completedDaysKey = await getUserCacheKey('completed_diet_days', userId);
                  const waterIntakeKey = await getUserCacheKey('water_intake', userId);
                  const waterCompletedKey = await getUserCacheKey('water_completed', userId);
                  
                  await Storage.default.removeItem(completedMealsKey);
                  await Storage.default.removeItem(completedDaysKey);
                  await Storage.default.removeItem(waterIntakeKey);
                  await Storage.default.removeItem(waterCompletedKey);
                }
                await Storage.default.removeItem('cached_diet_plan');
                await Storage.default.removeItem('completed_meals');
                await Storage.default.removeItem('completed_diet_days');
                await Storage.default.removeItem('water_intake');
                await Storage.default.removeItem('water_completed');
              } catch (cacheError) {
                console.error('Error clearing cache fallback:', cacheError);
              }
              
              showToast('info', 'Diet plan cleared. You can now generate a new one.');
            }
          }}
          isGeneratingNew={isGenerating}
        />
      );
    }

    // ✅ CRITICAL: Show error screen instead of generation screen if there was a load error
    // Only show error if we've confirmed there's no plan in local storage
    if (loadError && hasCheckedLocalStorage && !dietPlan) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to Load Diet Plan</Text>
          <Text style={styles.errorMessage}>{loadError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={async () => {
              setIsLoadingPlan(true);
              setLoadError(null);
              await loadDietPlan();
              setIsLoadingPlan(false);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Only show generation screens if we've confirmed no plan exists
    if (userInfo) {
      // User has profile but no diet plan - show richer profile summary and generate button
      return (
        <View style={styles.profileSummaryContainer}>
          <Text style={styles.profileSummaryTitle}>{t('profile.summary.title')}</Text>

          <View style={styles.profileSummaryCard}>
            {/* Goal & diet preference */}
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('profile.summary.goal')}</Text>
              <Text style={styles.profileSummaryValue}>{translateValue(userInfo.bodyGoal, 'goal')}</Text>
            </View>
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('profile.summary.diet.preference')}</Text>
              <Text style={styles.profileSummaryValue}>
                {translateValue(userInfo.dietPreference, 'diet')}
              </Text>
            </View>

            {/* Age & height */}
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('userinfo.age')}</Text>
              <Text style={styles.profileSummaryValue}>{userInfo.age}</Text>
            </View>
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('userinfo.height')}</Text>
              <Text style={styles.profileSummaryValue}>
                {userInfo.height ? `${userInfo.height}` : t('profile.summary.none')}
              </Text>
            </View>

            {/* Weights */}
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('profile.summary.current.weight')}</Text>
              <Text style={styles.profileSummaryValue}>
                {userInfo.currentWeight ? `${userInfo.currentWeight} kg` : t('profile.summary.none')}
              </Text>
            </View>
            {(userInfo.bodyGoal === 'Lose Fat' || userInfo.bodyGoal === 'Gain Muscle') && (
              <View style={styles.profileSummaryRow}>
                <Text style={styles.profileSummaryLabel}>{t('profile.summary.target.weight')}</Text>
                <Text style={styles.profileSummaryValue}>
                  {userInfo.targetWeight ? `${userInfo.targetWeight} kg` : t('profile.summary.none')}
                </Text>
              </View>
            )}

            {/* Medical conditions (important for diet) */}
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('profile.summary.medical.conditions')}</Text>
              <Text style={styles.profileSummaryValue}>
                {userInfo.medicalConditions || t('profile.summary.none')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmGenerateButton, isGenerating && styles.confirmGenerateButtonDisabled]}
            onPress={handleGenerateClick}
            disabled={isGenerating}
          >
            <Text style={styles.confirmGenerateButtonText}>
              {isGenerating ? 'Generating Diet Plan...' : t('profile.summary.confirm.generate')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // User has no profile - show simple, clean start card
    // ✅ CRITICAL: Only show this if we've confirmed no plan exists
    return (
      <View style={styles.startCardContainer}>
        <View style={styles.startCard}>
          <View style={styles.startCardIconWrapper}>
            <Text style={styles.startCardIcon}>🥗</Text>
          </View>

          <Text style={styles.startCardTitle}>
            {language === 'ur'
              ? 'چلیں آپ کے لئے ذاتی diet پلان بنائیں؟'
              : 'Let’s create your personal diet plan.'}
          </Text>

          <Text style={styles.startCardSubtitle}>
            {language === 'ur'
              ? 'چند مختصر سوالات، پھر AI آپ کے لئے موزوں meal plan تیار کرے گا۔'
              : 'Answer a few quick questions and AI will build a meal plan for you.'}
          </Text>

          <TouchableOpacity
            style={styles.startButton}
            onPress={() => setShowUserInfoModal(true)}
            activeOpacity={0.9}
          >
            <Text style={styles.startButtonText}>{t('onboarding.start')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const hasValidDietPlan =
    !!(
      dietPlan &&
      dietPlan.weeklyPlan &&
      Array.isArray(dietPlan.weeklyPlan) &&
      dietPlan.weeklyPlan.length > 0
    );

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.mainContainer}>
          <DashboardHeader
            userName={user?.fullName || 'User'}
            onProfilePress={handleProfilePress}
            onNotificationPress={() => setShowNotificationModal(true)}
            notificationCount={unreadCount}
          />

          <ScrollView
            style={styles.container}
            contentContainerStyle={
              hasValidDietPlan && initialLoadComplete ? styles.contentNoPadding : styles.content
            }
            showsVerticalScrollIndicator={false}
          >
            {renderContent()}

            {/* Bottom Spacing - only show when not displaying diet plan */}
            {!(hasValidDietPlan && initialLoadComplete) && (
              <View style={styles.bottomSpacing} />
            )}
          </ScrollView>

          <BottomNavigation
            activeTab="diet"
            onTabPress={handleTabPress}
          />
        </View>

        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onMenuItemPress={handleSidebarMenuPress}
          userName={user?.fullName || 'User'}
          userEmail={user?.email || 'user@purebody.com'}
          userInfo={userInfo}
          badges={userInfo?.badges || []}
        />

        <UserInfoModal
          visible={showUserInfoModal}
          onComplete={handleCompleteUserInfo}
          onCancel={handleCancelUserInfo}
        />

        <ProfilePage
          visible={showProfilePage}
          onClose={() => setShowProfilePage(false)}
          userInfo={userInfo}
          onUpdateUserInfo={handleUpdateUserInfo}
        />

        <NotificationModal
          visible={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
        />

        {/* Beautiful Loading Modal */}
        <LoadingModal
          visible={isGenerating}
          title="Creating Your Diet Plan"
          subtitle="Analyzing your profile and generating personalized meals"
          type="diet"
        />
      </SafeAreaView>
    </DecorativeBackground>
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
  contentNoPadding: {
    paddingTop: 0,
    paddingBottom: 0, // DietPlanDisplay handles its own bottom padding (100px)
    paddingHorizontal: 0, // Remove horizontal padding to allow full-width content
  },
  bottomSpacing: {
    height: 100,
  },

  // Hero Section (for onboarding)
  heroSection: {
    marginBottom: spacing.xl,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroIcon: {
    fontSize: 40,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '700',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },



  // Magic Message
  magicSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  magicText: {
    fontSize: typography.subtitle,
    color: colors.gold,
    textAlign: 'center',
    fontFamily: fonts.heading,
    fontWeight: '600',
  },

  // Generate Section (for onboarding)
  generateSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },



  // Generate Button (for onboarding)
  generateButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    alignSelf: 'center',
    width: '80%',
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  generateButtonIcon: {
    fontSize: 20,
  },
  generateButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    flex: 1,
    textAlign: 'center',
  },



  // Profile Summary Section
  profileSummaryTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  profileSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  profileSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  profileSummaryLabel: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    fontWeight: '500',
  },
  profileSummaryValue: {
    color: colors.white,
    fontSize: typography.body,
    fontFamily: fonts.body,
    fontWeight: '600',
  },

  // Simple Confirm Generate Button
  confirmGenerateButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    alignSelf: 'center',
    width: '80%',
    maxWidth: 300,
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmGenerateButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    textAlign: 'center',
    flexShrink: 1,
  },
  confirmGenerateButtonDisabled: {
    backgroundColor: colors.mutedText,
    opacity: 0.7,
  },

  // Loading Section
  loadingSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    fontSize: typography.subtitle,
    color: colors.mutedText,
    fontFamily: fonts.body,
  },

  // New styles for the new UI
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  profileSummaryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  startCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl * 2,
  },
  startCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  startCardIconWrapper: {
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startCardIconHalo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  startCardIconContainer: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  startCardIcon: {
    fontSize: 44,
  },
  startCardKicker: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  startCardTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 32,
  },
  startCardSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: typography.body,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  startButton: {
    marginTop: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    letterSpacing: 0.2,
  },

  // Error Screen Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  errorTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  errorMessage: {
    color: colors.mutedText,
    fontSize: 16,
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
});
