import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Modal, ScrollView, Alert, TouchableOpacity, Dimensions, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp, FadeInLeft, FadeInRight, SlideInUp } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import userProfileService from '../../src/services/userProfileService';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import Sidebar from '../../src/components/Sidebar';
import UserInfoModal from '../../src/components/UserInfoModal';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

export default function DietScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    loadUserInfo();
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
        Alert.alert('Settings', 'Settings feature coming soon!');
        break;
      case 'subscription':
        Alert.alert('Subscription', 'Subscription Plan feature coming soon!');
        break;
      case 'logout':
        try {
          const { authService } = await import('../../src/services/authService');
          await authService.logout();
          router.replace('/auth/login');
        } catch (error) {
          console.error('Logout failed:', error);
          Alert.alert('Error', 'Failed to logout. Please try again.');
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleGenerateClick = () => {
    if (userInfo) {
      // User already has profile, show success message
      Alert.alert('Success', 'Your diet plan is being generated! This feature will be available soon.');
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
        Alert.alert('Success', 'Profile created! Now generating your diet plan...');
        // Here you would typically call the diet plan generation API
        setTimeout(() => {
          Alert.alert('Success', 'Your personalized diet plan is ready! This feature will be available soon.');
        }, 2000);
      } else {
        console.error('❌ Failed to save to database:', response?.message || 'Unknown error');
        Alert.alert('Error', 'Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('💥 Exception in diet page:', error);
      Alert.alert('Error', 'Failed to save profile. Please check your connection and try again.');
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
          {/* Hero Section with Gradient */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.heroSection}>
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)']}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroIconContainer}>
                  <Text style={styles.heroIcon}>🥗</Text>
                </View>
                <Text style={styles.heroTitle}>{t('diet.hero.title')}</Text>
                <Text style={styles.heroSubtitle}>
                  {t('diet.hero.subtitle')}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Magic Message */}
          <Animated.View entering={FadeInUp.delay(300)} style={styles.magicSection}>
            <Text style={styles.magicText}>{t('diet.magic.message')}</Text>
          </Animated.View>

          {/* Generate Button */}
          <Animated.View entering={FadeInUp.delay(500)} style={styles.generateSection}>
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={handleGenerateClick}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.gold, colors.goldDark]}
                style={styles.generateButtonGradient}
              >
                <Text style={styles.generateButtonIcon}>🚀</Text>
                <Text style={styles.generateButtonText}>{t('diet.generate.button')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>



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
        />

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
  bottomSpacing: {
    height: 100,
  },
  
  // Hero Section
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

  // Quick Actions
  quickActionsSection: {
    marginBottom: spacing.xl,
  },
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



  // Features Section
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
  
  // New styles for simplified design
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
  generateSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
