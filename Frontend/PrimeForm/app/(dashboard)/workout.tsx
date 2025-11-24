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
import WorkoutPlanDisplay from '../../src/components/WorkoutPlanDisplay';
import ExerciseDetailScreen from '../../src/components/ExerciseDetailScreen';
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
  const [userInfo, setUserInfo] = useState<any>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null);
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [generationTimer, setGenerationTimer] = useState(0);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const { showToast } = useToast();

  // Helper function to translate dynamic values (same approach as ProfilePage)
  const translateValue = (value: string, type: 'goal' | 'occupation' | 'equipment') => {
    console.log('🔍 Workout translateValue called with:', { value, type, language });

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
        console.log('🔍 Workout Found Urdu translation:', option.ur);
        return option.ur;
      }
    }
    return value;
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load user info first
        const cachedData = userProfileService.getCachedData();
        if (cachedData) {
          setUserInfo(cachedData.data);
          setIsLoading(false);
          console.log('📦 Using cached user profile data in workout page');
        } else {
          await loadUserInfo();
        }

        // Try to load workout plan from database
        console.log('📱 Attempting to load workout plan from database...');
        const plan = await aiWorkoutService.loadWorkoutPlanFromDatabase();
        if (plan) {
          setWorkoutPlan(plan);
          console.log('✅ Loaded workout plan from database successfully');
        } else {
          console.log('ℹ️ No workout plan found in database');
        }
      } catch (error) {
        console.warn('⚠️ Error during initialization:', error);
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
        router.push('/(dashboard)');
        break;
      case 'edit_profile':
        setShowUserInfoModal(true);
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
          console.error('Logout failed:', error);
          showToast('error', 'Failed to logout. Please try again.');
        }
        break;
      default:
        console.log('Unknown action:', action);
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
        console.log('🚀 Starting workout plan generation...');

        const response = await aiWorkoutService.generateWorkoutPlan(userInfo);

        if (response.success && response.data) {
          setWorkoutPlan(response.data);
          showToast('success', 'Your personalized workout plan is ready!');
          console.log('✅ Workout plan generated and saved successfully');

          // Clear timer and hide modal immediately when plan is ready
          clearInterval(timerInterval);
          setShowGenerationModal(false);
          setGenerationTimer(0);
        } else {
          console.error('❌ Workout plan generation failed:', response.message);
          showToast('error', response.message || 'Failed to generate workout plan');
        }
      } catch (error) {
        console.error('❌ Error generating workout plan:', error);

        // Show interactive error alert instead of console logging
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
        console.log('User profile saved to database:', response.data);
        showToast('success', 'Profile created! Now generating your workout plan...');
        // Here you would typically call the workout plan generation API
        setTimeout(() => {
          showToast('success', 'Your personalized workout plan is ready! This feature will be available soon.');
        }, 2000);
      } else {
        console.error('Failed to save to database:', response.message);
        showToast('error', 'Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save user info:', error);
      showToast('error', 'Failed to save profile. Please check your connection and try again.');
    }
  };

  const handleCancelUserInfo = async () => {
    try {
      setShowUserInfoModal(false);
    } catch (error) {
      console.error('Failed to handle cancellation:', error);
    }
  };

  const loadUserInfo = async () => {
    try {
      console.log('🌐 Loading user info from API in workout page');
      const response = await userProfileService.getUserProfile();

      if (response.success) {
        if (response.data) {
          setUserInfo(response.data);
          console.log('User profile loaded from API:', response.data);
        } else {
          console.log('No profile found for new user:', response.message);
          setUserInfo(null);
        }
      } else {
        console.error('Failed to load user info from backend:', response.message);
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
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
    } else {
      console.log('Feature coming soon:', tab);
    }
  };

  const handleExercisePress = (exercise: WorkoutExercise) => {
    setSelectedExercise(exercise);
    setShowExerciseDetail(true);
  };

  const handleExerciseComplete = (exercise: WorkoutExercise) => {
    showToast('success', `${exercise.name} completed! Great job!`);
    setShowExerciseDetail(false);
    setSelectedExercise(null);
  };

  const handleExerciseBack = () => {
    setShowExerciseDetail(false);
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
      console.log('🔄 Generating new workout plan...');

      // Clear existing plans from database
      try {
        await aiWorkoutService.clearWorkoutPlanFromDatabase();
        console.log('🗑️ Cleared existing plans');
      } catch (error) {
        console.warn('⚠️ Could not clear existing plans:', error);
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
        console.log('✅ New workout plan generated and saved');
      } else {
        console.error('❌ Failed to generate new workout plan:', response.message);
        showToast('error', response.message || 'Failed to generate new workout plan. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error generating new workout plan:', error);

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
      console.log('🗑️ Deleting workout plan and returning to profile summary...');

      // Clear current plan from UI - this will show the profile summary interface
      setWorkoutPlan(null);

      // Clear local storage
      const Storage = await import('../../src/utils/storage');
      await Storage.default.removeItem('cached_workout_plan');
      await Storage.default.removeItem('completed_exercises');
      await Storage.default.removeItem('completed_days');

      showToast('success', 'Workout plan deleted. You can now generate a new plan.');
      console.log('✅ Workout plan deleted - showing profile summary interface');
    } catch (error) {
      console.error('❌ Error deleting workout plan:', error);
      showToast('error', 'Failed to delete workout plan. Please try again.');
    }
  };

  // Render content based on user info status
  const renderContent = () => {
    // Show loading only during initial load or when loading plan
    if ((isLoading && !initialLoadComplete) || isLoadingPlan) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading your workout plan...</Text>
        </View>
      );
    }

    // If user has workout plan, show the workout plan display within the normal layout
    if (workoutPlan && initialLoadComplete) {
      return (
        <WorkoutPlanDisplay
          workoutPlan={workoutPlan}
          onExercisePress={handleExercisePress}
          onDayPress={(day) => {
            console.log('Day pressed:', day);
            // Handle day press - could show day details
          }}
          onGenerateNew={handleDeletePlan}
          isGeneratingNew={isGeneratingPlan}
        />
      );
    }

    if (userInfo) {
      // User has profile - show profile summary and confirm button
      return (
        <View style={styles.profileSummaryContainer}>
          <Text style={styles.profileSummaryTitle}>{t('profile.summary.title')}</Text>

          <View style={styles.profileSummaryCard}>
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('profile.summary.goal')}</Text>
              <Text style={styles.profileSummaryValue}>{translateValue(userInfo.bodyGoal, 'goal')}</Text>
            </View>
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('profile.summary.occupation')}</Text>
              <Text style={styles.profileSummaryValue}>{translateValue(userInfo.occupationType, 'occupation')}</Text>
            </View>
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('profile.summary.equipment')}</Text>
              <Text style={styles.profileSummaryValue}>{translateValue(userInfo.availableEquipment, 'equipment')}</Text>
            </View>
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('profile.summary.medical.conditions')}</Text>
              <Text style={styles.profileSummaryValue}>{userInfo.medicalConditions || t('profile.summary.none')}</Text>
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

    // User has no profile - show beautiful start card
    return (
      <View style={styles.startCardContainer}>
        <View style={styles.startCard}>
          <View style={styles.startCardIconContainer}>
            <Text style={styles.startCardIcon}>🏋️</Text>
          </View>

          <Text style={styles.startCardTitle}>
            {language === 'ur' ? 'کیا آپ ان سوالات کے لیے تیار ہیں جو AI کے ذریعے آپ کا ذاتی ورکاؤٹ پلان بنائیں گے؟' : 'Are you ready for questions that will make your personalized workout through AI?'}
          </Text>

          <Text style={styles.startCardSubtitle}>
            {t('workout.hero.subtitle')}
          </Text>

          <TouchableOpacity
            style={styles.startButton}
            onPress={() => setShowUserInfoModal(true)}
            activeOpacity={0.8}
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

        <NotificationModal
          visible={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
        />

        {showExerciseDetail && selectedExercise && (
          <ExerciseDetailScreen
            exercise={selectedExercise}
            visible={showExerciseDetail}
            onClose={handleExerciseBack}
            onComplete={() => handleExerciseComplete(selectedExercise)}
            selectedDay={null} // This will be handled by WorkoutPlanDisplay
          />
        )}

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
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  startCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  startCardIconContainer: {
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
  startCardIcon: {
    fontSize: 40,
  },
  startCardTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 32,
  },
  startCardSubtitle: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  startButton: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  startButtonText: {
    color: colors.white,
    fontSize: 18,
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
