import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, typography, fonts } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import OnboardingModal from '../../src/components/OnboardingModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DietScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

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

  const handleStartOnboarding = async () => {
    try {
      await AsyncStorage.setItem('primeform_diet_onboarding_seen', 'started');
      setShowOnboarding(false);
      // Here you would navigate to the actual onboarding questions
      console.log('Starting diet onboarding questions...');
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
    }
  };

  const handleCancelOnboarding = async () => {
    try {
      await AsyncStorage.setItem('primeform_diet_onboarding_seen', 'cancelled');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
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
          onProfilePress={() => console.log('Profile pressed')}
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

          {/* Coming Soon Content */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.comingSoonContainer}>
            <View style={styles.comingSoonIcon}>
              <Text style={styles.comingSoonEmoji}>🥗</Text>
            </View>
            <Text style={styles.comingSoonTitle}>{t('diet.page.comingSoon')}</Text>
            <Text style={styles.comingSoonDescription}>
              {t('diet.page.comingSoonDesc')}
            </Text>
          </Animated.View>

          {/* Extra spacing for bottom navigation */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNavigation 
          activeTab="diet"
          onTabPress={handleTabPress}
        />

        {/* Onboarding Modal */}
        <OnboardingModal
          visible={showOnboarding}
          onStart={handleStartOnboarding}
          onCancel={handleCancelOnboarding}
          title={t('onboarding.title')}
          description={t('onboarding.description')}
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
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  comingSoonIcon: {
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
  comingSoonEmoji: {
    fontSize: 60,
  },
  comingSoonTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  comingSoonDescription: {
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
