import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, typography, fonts } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import OnboardingModal from '../../src/components/OnboardingModal';
import UserInfoModal from '../../src/components/UserInfoModal';
import Sidebar from '../../src/components/Sidebar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DietScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
    loadUserInfo();
    checkUserInfoStatus();
  }, []);

  // Check user info status every time page comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkUserInfoStatus();
      return () => {
        // Cleanup when page loses focus
        // This ensures modal state is properly managed
      };
    }, [])
  );

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenDashboardOnboarding = await AsyncStorage.getItem('primeform_dashboard_onboarding_seen');
      const hasSeenDietOnboarding = await AsyncStorage.getItem('primeform_diet_onboarding_seen');
      
      // Show modal if user cancelled dashboard onboarding AND hasn't started diet onboarding
      if (hasSeenDashboardOnboarding === 'cancelled' && hasSeenDietOnboarding !== 'started') {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    }
  };

  const checkUserInfoStatus = async () => {
    try {
      const userInfoCompleted = await AsyncStorage.getItem('primeform_user_info_completed');
      const userInfoCancelled = await AsyncStorage.getItem('primeform_user_info_cancelled');
      const permissionCancelled = await AsyncStorage.getItem('primeform_permission_modal_seen');
      
      // Show user info modal if:
      // 1. User hasn't completed user info collection, AND
      // 2. Either user previously cancelled user info collection OR user cancelled permission modal
      if (!userInfoCompleted && (userInfoCancelled === 'true' || permissionCancelled === 'cancelled')) {
        // Small delay to ensure smooth modal appearance
        setTimeout(() => {
          setShowUserInfoModal(true);
        }, 100);
      }
    } catch (error) {
      console.error('Failed to check user info status:', error);
    }
  };

  const handleStartOnboarding = async () => {
    try {
      await AsyncStorage.setItem('primeform_diet_onboarding_seen', 'started');
      setShowOnboarding(false);
      // Show user info collection modal
      setShowUserInfoModal(true);
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
    }
  };

  const handleCancelOnboarding = async () => {
    try {
      await AsyncStorage.setItem('primeform_diet_onboarding_seen', 'cancelled');
      setShowOnboarding(false);
      // After cancelling onboarding, check if we should show user info modal
      checkUserInfoStatus();
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
    }
  };

  const handleCompleteUserInfo = async (userInfoData: any) => {
    try {
      // Save user info to AsyncStorage for now (will be replaced with API call)
      await AsyncStorage.setItem('primeform_user_info', JSON.stringify(userInfoData));
      await AsyncStorage.setItem('primeform_user_info_completed', 'true');
      await AsyncStorage.removeItem('primeform_user_info_cancelled'); // Remove cancellation flag
      setUserInfo(userInfoData);
      setShowUserInfoModal(false);
      console.log('User info completed:', userInfoData);
    } catch (error) {
      console.error('Failed to save user info:', error);
    }
  };

  const handleCancelUserInfo = async () => {
    try {
      // Mark that user cancelled user info collection
      await AsyncStorage.setItem('primeform_user_info_cancelled', 'true');
      setShowUserInfoModal(false);
    } catch (error) {
      console.error('Failed to save cancellation status:', error);
    }
  };

  const loadUserInfo = async () => {
    try {
      const savedUserInfo = await AsyncStorage.getItem('primeform_user_info');
      if (savedUserInfo) {
        setUserInfo(JSON.parse(savedUserInfo));
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const handleProfilePress = () => {
    setSidebarVisible(true);
  };

  const handleSidebarMenuPress = async (action: string) => {
    switch (action) {
      case 'profile':
        console.log('Profile - feature coming soon');
        break;
      case 'edit_profile':
        // Show user info modal for editing
        setShowUserInfoModal(true);
        break;
      case 'settings':
        console.log('Settings - feature coming soon');
        break;
      case 'subscription':
        console.log('Subscription Plan - feature coming soon');
        break;
      case 'logout':
        console.log('Logout - feature coming soon');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleTabPress = (tab: 'home' | 'diet' | 'gym' | 'workout' | 'progress') => {
    if (tab === 'home') {
      router.push('/(dashboard)');
    } else if (tab === 'workout') {
      router.push('/(dashboard)/workout');
    } else {
      console.log('Feature coming soon:', tab);
    }
  };

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <DashboardHeader 
          userName="User"
          onProfilePress={handleProfilePress}
          onNotificationPress={() => console.log('Notifications pressed')}
          notificationCount={0}
        />

        {/* Content */}
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Page Title */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.pageHeader}>
            <Text style={styles.pageTitle}>{t('nav.diet')}</Text>
            <Text style={styles.pageSubtitle}>{t('diet.page.subtitle')}</Text>
          </Animated.View>

          {/* Simple Content */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.simpleContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🥗</Text>
            </View>
          </Animated.View>

          {/* Extra spacing for bottom navigation */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNavigation 
          activeTab="diet"
          onTabPress={handleTabPress}
        />

        {/* Sidebar */}
        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onMenuItemPress={handleSidebarMenuPress}
          userName="User"
          userEmail="user@example.com"
          userInfo={userInfo}
        />

        {/* Onboarding Modal */}
        <OnboardingModal
          visible={showOnboarding}
          onStart={handleStartOnboarding}
          onCancel={handleCancelOnboarding}
          title={t('onboarding.title')}
          description={t('onboarding.description')}
        />

        {/* User Info Modal */}
        <UserInfoModal
          visible={showUserInfoModal}
          onComplete={handleCompleteUserInfo}
          onCancel={handleCancelUserInfo}
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
  },
  pageHeader: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  pageTitle: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  pageSubtitle: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    lineHeight: 22,
  },
  simpleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoEmoji: {
    fontSize: 60,
  },
  simpleMessage: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  bottomSpacing: {
    height: 100, // Space for bottom navigation
  },
});
