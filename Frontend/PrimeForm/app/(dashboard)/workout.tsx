import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Alert, TouchableOpacity, Dimensions, ActivityIndicator, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInLeft, FadeInRight, SlideInUp } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import userProfileService from '../../src/services/userProfileService';
import aiWorkoutService, { WorkoutPlan, WorkoutExercise } from '../../src/services/aiWorkoutService';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import Sidebar from '../../src/components/Sidebar';
import UserInfoModal from '../../src/components/UserInfoModal';
import ProfilePage from '../../src/components/ProfilePage';
import WorkoutPlanDisplay from '../../src/components/WorkoutPlanDisplay';
// ExerciseDetailScreen removed - WorkoutPlanDisplay handles it internally
import DecorativeBackground from '../../src/components/DecorativeBackground';
import LoadingModal from '../../src/components/LoadingModal';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../../src/context/AuthContext';
import { useToast } from '../../src/context/ToastContext';
import NotificationModal from '../../src/components/NotificationModal';
import { useNotifications } from '../../src/contexts/NotificationContext';

const { width: screenWidth } = Dimensions.get('window');

export default function WorkoutScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuthContext();
  const { unreadCount } = useNotifications();
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null);
  // showExerciseDetail removed - WorkoutPlanDisplay handles modals internally
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [generationTimer, setGenerationTimer] = useState(0);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasCheckedLocalStorage, setHasCheckedLocalStorage] = useState(false);
  const { showToast } = useToast();

  // Helper function to translate dynamic values (same approach as ProfilePage)
  const translateValue = (value: string, type: 'goal' | 'occupation' | 'equipment') => {
    if (language === 'ur' && value) {
      // Use the same arrays as ProfilePage for consistency
      const bodyGoals = [
        { en: 'Lose Fat', ur: 'چربی کم کریں' },
        { en: 'Gain Muscle', ur: 'پٹھے بنائیں' },
        { en: 'Maintain Weight', ur: 'وزن برقرار رکھیں' },
        { en: 'General Training', ur: 'عمومی تربیت' },
        { en: 'Improve Fitness', ur: 'فٹنس بہتر کریں' }
      ];

      const occupationTypes = [
        { en: 'Sedentary Desk Job', ur: 'بیٹھے ہوئے ڈیسک کا کام' },
        { en: 'Active Job', ur: 'متحرک کام' },
        { en: 'Shift Worker', ur: 'شفٹ ورکر' },
        { en: 'Student', ur: 'طالب علم' },
        { en: 'Retired', ur: 'ریٹائرڈ' },
        { en: 'Other', ur: 'دیگر' }
      ];

      const equipmentOptions = [
        { en: 'None', ur: 'کوئی نہیں' },
        { en: 'Basic Dumbbells', ur: 'بنیادی ڈمبلز' },
        { en: 'Resistance Bands', ur: 'مزاحمتی بینڈز' },
        { en: 'Home Gym', ur: 'گھریلو جم' },
        { en: 'Full Gym Access', ur: 'مکمل جم تک رسائی' }
      ];

      let options: { en: string; ur: string }[];
      if (type === 'goal') {
        options = bodyGoals;
      } else if (type === 'occupation') {
        options = occupationTypes;
      } else if (type === 'equipment') {
        options = equipmentOptions;
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
        // User profile is passed from dashboard or loaded from cache
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

        // ✅ CRITICAL: First check local storage with user-specific key
        // This prevents showing generation screen if plan exists locally
        setLoadError(null);
        try {
          const { getCurrentUserId, getUserCacheKey, validateCachedData } = await import('../../src/utils/cacheKeys');
          const Storage = await import('../../src/utils/storage');
          
          const userId = await getCurrentUserId();
          if (userId) {
            const userCacheKey = await getUserCacheKey('cached_workout_plan', userId);
            const cachedPlan = await Storage.default.getItem(userCacheKey);
            if (cachedPlan) {
              const plan = JSON.parse(cachedPlan);
              // Validate cached data belongs to current user
              if (validateCachedData(plan, userId) && plan && plan.weeklyPlan && Array.isArray(plan.weeklyPlan) && plan.weeklyPlan.length > 0) {
                console.log('✅ Found workout plan in local storage, using it immediately');
                setWorkoutPlan(plan);
                setHasCheckedLocalStorage(true);
                // ✅ OPTIMIZATION: Only sync in background if cache might be stale (older than 30 minutes)
                // Diet/workout plans don't change frequently, so we can extend cache time
                // This prevents unnecessary API calls when data is fresh
                const planTimestamp = plan.updatedAt || plan.createdAt;
                const CACHE_STALE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
                const shouldSync = planTimestamp 
                  ? (Date.now() - new Date(planTimestamp).getTime() > CACHE_STALE_THRESHOLD)
                  : false; // If no timestamp, assume cache is fresh (don't sync)
                
                if (shouldSync) {
                  // Only sync if cache might be stale
                  aiWorkoutService.loadWorkoutPlanFromDatabase().then((dbPlan) => {
                    if (dbPlan && dbPlan !== plan) {
                      setWorkoutPlan(dbPlan);
                    }
                  }).catch(() => {
                    // Ignore background sync errors
                  });
                }
                setIsLoadingPlan(false);
                setInitialLoadComplete(true);
                return;
              }
            }
          }
        } catch (localError) {
          console.warn('Could not check local storage:', localError);
        }
        
        setHasCheckedLocalStorage(true);
        
        // Load workout plan from database
        const plan = await aiWorkoutService.loadWorkoutPlanFromDatabase();
        if (plan) {
          setWorkoutPlan(plan);
        } else {
          console.log('ℹ️ No workout plan found - user needs to generate one');
        }
      } catch (error) {
        console.error('❌ Error loading workout plan:', error);
        
        // ✅ CRITICAL: On error, try local storage as last resort before showing generation screen
        try {
          const { getCurrentUserId, getUserCacheKey, validateCachedData } = await import('../../src/utils/cacheKeys');
          const Storage = await import('../../src/utils/storage');
          
          const userId = await getCurrentUserId();
          if (userId) {
            const userCacheKey = await getUserCacheKey('cached_workout_plan', userId);
            const cachedPlan = await Storage.default.getItem(userCacheKey);
            if (cachedPlan) {
              const plan = JSON.parse(cachedPlan);
              // Validate cached data belongs to current user
              if (validateCachedData(plan, userId) && plan && plan.weeklyPlan && Array.isArray(plan.weeklyPlan) && plan.weeklyPlan.length > 0) {
                console.log('✅ Fallback: Found workout plan in local storage after error');
                setWorkoutPlan(plan);
                setLoadError(null); // Clear error since we found plan locally
                setIsLoadingPlan(false);
                setInitialLoadComplete(true);
                return;
              }
            }
          }
        } catch (localError) {
          console.warn('Could not check local storage on error:', localError);
        }
        
        // Only set error if we truly have no plan
        setLoadError('Failed to load workout plan. Please check your connection.');
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
        StatusBar.setBackgroundColor(colors.background, true);
      }
    }, [])
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
      // User already has profile, generate AI workout plan
      setIsGeneratingPlan(true);
      setShowGenerationModal(true);
      setGenerationTimer(6); // Set to 6 seconds for optimal generation time (5-7s range)

      // Start countdown timer
      const timerInterval = setInterval(() => {
        setGenerationTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      try {
        const response = await aiWorkoutService.generateWorkoutPlan(userInfo);

        if (response.success && response.data) {
          setWorkoutPlan(response.data);
          showToast('success', 'Your personalized workout plan is ready!');

          // Clear timer and hide modal immediately when plan is ready
          clearInterval(timerInterval);
          setShowGenerationModal(false);
          setGenerationTimer(0);
        } else {
          showToast('error', response.message || 'Failed to generate workout plan');
        }
      } catch (error) {
        // Show interactive error alert
        const errorMessage = error instanceof Error ? error.message : 'Something went wrong';

        if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
          showToast('error', 'Network issue detected. Please check your connection and try again.');
        } else if (errorMessage.includes('API')) {
          showToast('error', 'AI service is temporarily busy. Please try again in a moment.');
        } else {
          showToast('error', 'Unable to generate workout plan. Please try again.');
        }
      } finally {
        clearInterval(timerInterval);
        setIsGeneratingPlan(false);
        setShowGenerationModal(false);
        setGenerationTimer(0);
      }
    } else {
      // User needs to create profile first
      setShowUserInfoModal(true);
    }
  };

  const handleCompleteUserInfo = async (userInfoData: any) => {
    try {
      const response = await userProfileService.createOrUpdateProfile(userInfoData);

      if (response.success) {
        setUserInfo(userInfoData);
        setShowUserInfoModal(false);
        showToast('success', 'Profile created! Now generating your workout plan...');
        // Here you would typically call the workout plan generation API
        setTimeout(() => {
          showToast('success', 'Your personalized workout plan is ready! This feature will be available soon.');
        }, 2000);
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
      const loadUserInfo = async () => {
        try {
          const cachedData = await userProfileService.getCachedData();
          // Validate cached data belongs to current user
          if (cachedData && cachedData.data) {
            const { getCurrentUserId, validateCachedData } = await import('../../src/utils/cacheKeys');
            const userId = await getCurrentUserId();
            if (userId && validateCachedData(cachedData.data, userId)) {
              setUserInfo(cachedData.data);
            } else {
              // Cached data doesn't belong to current user, clear it and fetch fresh
              await userProfileService.clearCache();
              const response = await userProfileService.getUserProfile();
              if (response.success && response.data) {
                setUserInfo(response.data);
              }
            }
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
      loadUserInfo();
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

  const handleTabPress = (tab: 'home' | 'diet' | 'gym' | 'workout' | 'progress') => {
    if (tab === 'home') {
      router.push('/(dashboard)');
    } else if (tab === 'diet') {
      router.push('/(dashboard)/diet');
    } else if (tab === 'gym') {
      router.push('/(dashboard)/gym');
    } else if (tab === 'progress') {
      router.push('/(dashboard)/progress');
    }
  };

  const handleExercisePress = (exercise: WorkoutExercise) => {
    // WorkoutPlanDisplay handles exercise modals internally
    // No need to manage state here
    setSelectedExercise(exercise);
  };

  const handleExerciseComplete = (exercise: WorkoutExercise) => {
    // WorkoutPlanDisplay handles exercise completion internally
    showToast('success', `${exercise.name} completed! Great job!`);
    setSelectedExercise(null);
  };

  const handleExerciseBack = () => {
    // WorkoutPlanDisplay handles exercise modals internally
    setSelectedExercise(null);
  };

  const handleGenerateNewPlan = async () => {
    if (!userInfo) {
      showToast('error', 'Profile information not found. Please refresh and try again.');
      return;
    }

    setIsGeneratingPlan(true);
    setGenerationProgress('Preparing new plan...');

    try {
      // Clear existing plans from database
      try {
        await aiWorkoutService.clearWorkoutPlanFromDatabase();
      } catch (error) {
        // Continue anyway
      }

      // Clear current plan from UI
      setWorkoutPlan(null);

      // Update progress
      setGenerationProgress('Creating your new workout plan...');

      // Generate new plan
      const response = await aiWorkoutService.generateWorkoutPlan(userInfo);
      if (response.success && response.data) {
        setWorkoutPlan(response.data);
        showToast('success', 'New workout plan generated successfully!');
      } else {
        showToast('error', response.message || 'Failed to generate new workout plan. Please try again.');
      }
    } catch (error) {
      // Show red alert for any error
      const errorMessage = error instanceof Error ? error.message : String(error);
      showToast('error', `Error: ${errorMessage}`);
    } finally {
      setIsGeneratingPlan(false);
      setGenerationProgress('');
    }
  };

  // Handle delete plan - reset to profile summary interface
  const handleDeletePlan = async () => {
    try {
      // Clear all workout plan data
      await aiWorkoutService.clearWorkoutPlanFromDatabase();
      
      // Clear local state
      setWorkoutPlan(null);
      setHasCheckedLocalStorage(false);
      setIsLoadingPlan(true);
      
      // Force reload to ensure no cached data remains
      const plan = await aiWorkoutService.loadWorkoutPlanFromDatabase(true); // Force refresh
      if (plan) {
        setWorkoutPlan(plan);
      }
      
      setIsLoadingPlan(false);
      showToast('success', 'Workout plan deleted successfully. You can now generate a new one.');
    } catch (error) {
      console.error('Error clearing workout plan:', error);
      // Even if there's an error, clear local state
      setWorkoutPlan(null);
      setHasCheckedLocalStorage(false);
      setIsLoadingPlan(false);
      showToast('info', 'Workout plan cleared. You can now generate a new one.');
    }
  };

  // Render content based on user info status
  const renderContent = () => {
    // ✅ CRITICAL: Show loading while checking local storage or loading plan
    // Don't show generation screen until we've confirmed no plan exists
    if (!hasCheckedLocalStorage || isLoadingPlan || (isLoading && !initialLoadComplete)) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading your workout plan...</Text>
        </View>
      );
    }

    // ✅ CRITICAL: If we have a workout plan, show it immediately
    // This prevents showing generation screen when plan exists
    if (workoutPlan && workoutPlan.weeklyPlan && Array.isArray(workoutPlan.weeklyPlan) && workoutPlan.weeklyPlan.length > 0) {
      return (
        <WorkoutPlanDisplay
          workoutPlan={workoutPlan}
          onExercisePress={handleExercisePress}
          onDayPress={(day) => {
            // Handle day press - could show day details
          }}
          onGenerateNew={handleDeletePlan}
          isGeneratingNew={isGeneratingPlan}
        />
      );
    }

    // ✅ CRITICAL: Show error screen instead of generation screen if there was a load error
    // Only show error if we've confirmed there's no plan in local storage
    if (loadError && hasCheckedLocalStorage && !workoutPlan) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to Load Workout Plan</Text>
          <Text style={styles.errorMessage}>{loadError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={async () => {
              setIsLoadingPlan(true);
              setLoadError(null);
              setHasCheckedLocalStorage(false);
              // Reload by re-running initialization
              const Storage = await import('../../src/utils/storage');
              const cachedPlan = await Storage.default.getItem('cached_workout_plan');
              if (cachedPlan) {
                const plan = JSON.parse(cachedPlan);
                if (plan && plan.weeklyPlan && Array.isArray(plan.weeklyPlan) && plan.weeklyPlan.length > 0) {
                  setWorkoutPlan(plan);
                  setHasCheckedLocalStorage(true);
                  setIsLoadingPlan(false);
                  return;
                }
              }
              try {
                const plan = await aiWorkoutService.loadWorkoutPlanFromDatabase();
                if (plan) {
                  setWorkoutPlan(plan);
                }
              } catch (error) {
                setLoadError('Failed to load workout plan. Please check your connection.');
              } finally {
                setIsLoadingPlan(false);
                setHasCheckedLocalStorage(true);
              }
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Only show generation screens if we've confirmed no plan exists
    if (userInfo) {
      // User has profile - show richer profile summary and confirm button
      return (
        <View style={styles.profileSummaryContainer}>
          <Text style={styles.profileSummaryTitle}>{t('profile.summary.title')}</Text>

          <View style={styles.profileSummaryCard}>
            {/* Goal & occupation / equipment are most important for workout */}
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('profile.summary.goal')}</Text>
              <Text style={styles.profileSummaryValue}>{translateValue(userInfo.bodyGoal, 'goal')}</Text>
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

            {/* Lifestyle */}
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('profile.summary.occupation')}</Text>
              <Text style={styles.profileSummaryValue}>
                {translateValue(userInfo.occupationType, 'occupation')}
              </Text>
            </View>
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('profile.summary.equipment')}</Text>
              <Text style={styles.profileSummaryValue}>
                {translateValue(userInfo.availableEquipment, 'equipment')}
              </Text>
            </View>
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('profile.summary.medical.conditions')}</Text>
              <Text style={styles.profileSummaryValue}>
                {userInfo.medicalConditions || t('profile.summary.none')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmGenerateButton, isGeneratingPlan && styles.confirmGenerateButtonDisabled]}
            onPress={handleGenerateClick}
            disabled={isGeneratingPlan}
          >
            {isGeneratingPlan ? (
              <View style={styles.loadingButtonContent}>
                <ActivityIndicator color={colors.white} size="small" />
                <Text style={styles.confirmGenerateButtonText}>
                  {generationProgress || 'Creating your plan...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.confirmGenerateButtonText}>{t('profile.summary.confirm.generate')}</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    // User has no profile - show simple, clean start card
    return (
      <View style={styles.startCardContainer}>
        <View style={styles.startCard}>
          <View style={styles.startCardIconWrapper}>
            <Text style={styles.startCardIcon}>🏋️</Text>
          </View>

          <Text style={styles.startCardTitle}>
            {language === 'ur'
              ? 'چلیں آپ کے لئے ذاتی workout بنائیں؟'
              : 'Let’s build your personal workout plan.'}
          </Text>

          <Text style={styles.startCardSubtitle}>
            {language === 'ur'
              ? 'صرف چند آسان سوالات، پھر AI آپ کے لئے مکمل پلان تیار کرے گا۔'
              : 'Answer a few quick questions and AI will design a plan just for you.'}
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

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        <DashboardHeader
          userName={user?.fullName || t('common.user')}
          onProfilePress={handleProfilePress}
          onNotificationPress={() => setShowNotificationModal(true)}
          notificationCount={unreadCount}
        />

        <ScrollView
          style={styles.container}
          contentContainerStyle={workoutPlan && initialLoadComplete ? styles.contentNoPadding : styles.content}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}

          {/* Bottom Spacing - only show when not displaying workout plan */}
          {!(workoutPlan && initialLoadComplete) && (
            <View style={styles.bottomSpacing} />
          )}
        </ScrollView>

        <BottomNavigation
          activeTab="workout"
          onTabPress={handleTabPress}
        />

        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onMenuItemPress={handleSidebarMenuPress}
          userName={user?.fullName || t('common.user')}
          userEmail={user?.email || 'user@example.com'}
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

        {/* ExerciseDetailScreen is now handled internally by WorkoutPlanDisplay */}
        {/* No need to render it here as it would create duplicate modals */}

        {/* Beautiful Loading Modal */}
        <LoadingModal
          visible={isGeneratingPlan}
          title="Creating Your Workout Plan"
          subtitle="Analyzing your profile and generating personalized exercises"
          type="workout"
        />

        {/* Generation Timer Modal */}
        {showGenerationModal && (
          <View style={styles.generationModalOverlay}>
            <View style={styles.generationModal}>
              <Text style={styles.generationModalTitle}>Generating Your Plan</Text>
              <Text style={styles.generationModalSubtitle}>
                AI is creating your personalized workout plan...
              </Text>
              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>{generationTimer}</Text>
                <Text style={styles.timerLabel}>seconds remaining</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((6 - generationTimer) / 6) * 100}%` }]} />
              </View>
            </View>
          </View>
        )}
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
    paddingBottom: 0, // No bottom padding when workout plan is displayed
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

  // Quick Actions Section (for onboarding)
  quickActionsSection: {
    marginBottom: spacing.xl,
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
  generateButtonArrow: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },



  // Features Section (for onboarding)
  sectionTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: spacing.xl,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  featureCard: {
    width: (screenWidth - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  featureText: {
    color: colors.mutedText,
    fontSize: 13,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 18,
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
  // New styles for the simple UI
  confirmGenerateSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
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
    flexWrap: 'nowrap', // Prevent text wrapping
  },
  confirmGenerateButtonDisabled: {
    opacity: 0.7,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    fontSize: typography.body,
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

  // Generation Timer Modal Styles
  generationModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  generationModal: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    maxWidth: 300,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  generationModalTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  generationModalSubtitle: {
    color: colors.mutedText,
    fontSize: 16,
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  timerText: {
    color: colors.primary,
    fontSize: 48,
    fontWeight: '900',
    fontFamily: fonts.heading,
  },
  timerLabel: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    marginTop: spacing.xs,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
});
