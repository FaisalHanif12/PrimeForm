import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Modal, ScrollView, Alert, TouchableOpacity, Dimensions, Image, ActivityIndicator } from 'react-native';
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
import DecorativeBackground from '../../src/components/DecorativeBackground';
import DietPlanDisplay from '../../src/components/DietPlanDisplay';
import LoadingModal from '../../src/components/LoadingModal';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

export default function DietScreen() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const { showToast } = useToast();

  // Helper function to translate dynamic values (same approach as ProfilePage)
  const translateValue = (value: string, type: 'goal' | 'diet') => {
    console.log('🔍 Diet translateValue called with:', { value, type, language });
    
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
        console.log('🔍 Diet Found Urdu translation:', option.ur);
        return option.ur;
      }
    }
    return value;
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          loadUserInfo(),
          loadDietPlan()
        ]);
      } catch (error) {
        console.warn('⚠️ Error during initialization:', error);
      } finally {
        setIsLoadingPlan(false);
        setInitialLoadComplete(true);
      }
    };
    
    initializeData();
  }, []);

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
      // User already has profile, generate diet plan
      setIsGenerating(true);
      try {
        const response = await aiDietService.generateDietPlan(userInfo);
        
        if (response.success && response.data) {
          setDietPlan(response.data);
          showToast('success', 'Your personalized diet plan is ready!');
        } else {
          showToast('error', 'Failed to generate diet plan. Please try again.');
        }
      } catch (error) {
        console.error('Diet generation failed:', error);
        
        // Show interactive error alert instead of console logging
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
      
      console.log('🔍 Diet Page - Full response:', response);
      console.log('🔍 Diet Page - Response.success:', response?.success);
      
      if (response && response.success) {
        setUserInfo(userInfoData);
        setShowUserInfoModal(false);
        console.log('✅ User profile saved to database:', response.data);
        showToast('success', 'Profile created! Now generating your diet plan...');
        
        // Automatically generate diet plan after profile creation
        try {
          setIsGenerating(true);
          const dietResponse = await aiDietService.generateDietPlan(userInfoData);
          
          if (dietResponse.success && dietResponse.data) {
            setDietPlan(dietResponse.data);
            showToast('success', 'Your personalized diet plan is ready!');
          } else {
            showToast('error', 'Profile saved, but diet plan generation failed. Please try again.');
          }
        } catch (error) {
          console.error('Diet generation after profile creation failed:', error);
          showToast('error', 'Profile saved, but diet plan generation failed. Please try again.');
        } finally {
          setIsGenerating(false);
        }
      } else {
        console.error('❌ Failed to save to database:', response?.message || 'Unknown error');
        showToast('error', 'Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('💥 Exception in diet page:', error);
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
      const response = await userProfileService.getUserProfile();
      
      if (response.success) {
        if (response.data) {
          setUserInfo(response.data);
          console.log('User profile loaded:', response.data);
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

  const loadDietPlan = async () => {
    try {
      const dietPlanFromDB = await aiDietService.loadDietPlanFromDatabase();
      if (dietPlanFromDB) {
        setDietPlan(dietPlanFromDB);
        console.log('Diet plan loaded:', dietPlanFromDB);
      }
    } catch (error) {
      console.error('Failed to load diet plan:', error);
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
    } else {
      console.log('Feature coming soon:', tab);
    }
  };

  // Render content based on user info and diet plan status
  const renderContent = () => {
    // Show loading only during initial load or when loading plan
    if ((isLoading && !initialLoadComplete) || isLoadingPlan) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading your diet plan...</Text>
        </View>
      );
    }

    // If user has diet plan, show the diet plan display immediately
    if (dietPlan && userInfo && initialLoadComplete) {
      return (
        <DietPlanDisplay
          dietPlan={dietPlan}
          onGenerateNew={async () => {
            try {
              await aiDietService.clearDietPlanFromDatabase();
              setDietPlan(null);
              showToast('info', 'Previous diet plan cleared. You can now generate a new one.');
            } catch (error) {
              console.error('Failed to clear diet plan:', error);
              showToast('error', 'Failed to clear previous plan. Please try again.');
            }
          }}
          isGeneratingNew={isGenerating}
        />
      );
    }

    if (userInfo) {
      // User has profile but no diet plan - show profile summary and generate button
      return (
        <View style={styles.profileSummaryContainer}>
          <Text style={styles.profileSummaryTitle}>{t('profile.summary.title')}</Text>
          
          <View style={styles.profileSummaryCard}>
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('profile.summary.goal')}</Text>
              <Text style={styles.profileSummaryValue}>{translateValue(userInfo.bodyGoal, 'goal')}</Text>
            </View>
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('profile.summary.diet.preference')}</Text>
              <Text style={styles.profileSummaryValue}>{translateValue(userInfo.dietPreference, 'diet')}</Text>
            </View>
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('profile.summary.current.weight')}</Text>
              <Text style={styles.profileSummaryValue}>{userInfo.currentWeight} kg</Text>
            </View>
            <View style={styles.profileSummaryRow}>
              <Text style={styles.profileSummaryLabel}>{t('profile.summary.target.weight')}</Text>
              <Text style={styles.profileSummaryValue}>{userInfo.targetWeight || 'Not set'} kg</Text>
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

    // User has no profile - show beautiful start card
    return (
      <View style={styles.startCardContainer}>
        <View style={styles.startCard}>
          <View style={styles.startCardIconContainer}>
            <Text style={styles.startCardIcon}>🥗</Text>
          </View>
          
          <Text style={styles.startCardTitle}>
            {language === 'ur' ? 'کیا آپ ان سوالات کے لیے تیار ہیں جو AI کے ذریعے آپ کا ذاتی غذائی پلان بنائیں گے؟' : 'Are you ready for questions that will make your personalized diet through AI?'}
          </Text>
          
          <Text style={styles.startCardSubtitle}>
            {t('diet.hero.subtitle')}
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
          userName={t('common.user')}
          onProfilePress={handleProfilePress}
          onNotificationPress={() => console.log('Notifications pressed')}
          notificationCount={0}
        />

        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        <BottomNavigation 
          activeTab="diet"
          onTabPress={handleTabPress}
        />

        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onMenuItemPress={handleSidebarMenuPress}
          userName={t('common.user')}
          userEmail="user@example.com"
          userInfo={userInfo}
          badges={userInfo?.badges || []}
        />

        <UserInfoModal
          visible={showUserInfoModal}
          onComplete={handleCompleteUserInfo}
          onCancel={handleCancelUserInfo}
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
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: 100, // reserve space for bottom tab that scrolls with content
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
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  startCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
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
});
