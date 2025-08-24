import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { authService } from '../../src/services/authService';
import { useAuthContext } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import StatsCard from '../../src/components/StatsCard';
import WorkoutPlanCard from '../../src/components/WorkoutPlanCard';
import MealPlanCard from '../../src/components/MealPlanCard';
import Sidebar from '../../src/components/Sidebar';
import UserInfoModal from '../../src/components/UserInfoModal';
import ProfilePage from '../../src/components/ProfilePage';
import AsyncStorage from '@react-native-async-storage/async-storage';


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
  const { logout: authLogout, user } = useAuthContext();
  const { t, transliterateName, transliterateText } = useLanguage();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'diet' | 'gym' | 'workout' | 'progress'>('home');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);


  const loadDashboard = async () => {
    try {
      const response = await authService.getDashboard();
      if (response.success) {
        setDashboardData(response.data);
      } else {
        console.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    checkOnboardingStatus();
    loadUserInfo();
    checkUserInfoStatus();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenPermissionModal = await AsyncStorage.getItem('primeform_permission_modal_seen');
      
      // Show permission modal only for new users who haven't seen it at all
      if (!hasSeenPermissionModal) {
        setShowPermissionModal(true);
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    }
  };

  const handlePermissionStart = async () => {
    try {
      await AsyncStorage.setItem('primeform_permission_modal_seen', 'started');
      setShowPermissionModal(false);
      // Show user info collection modal
      setShowUserInfoModal(true);
    } catch (error) {
      console.error('Failed to save permission status:', error);
    }
  };

  const handlePermissionCancel = async () => {
    try {
      await AsyncStorage.setItem('primeform_permission_modal_seen', 'cancelled');
      setShowPermissionModal(false);
      // After cancelling permission, never show UserInfoModal on dashboard again
    } catch (error) {
      console.error('Failed to save permission status:', error);
    }
  };

  const handleCompleteUserInfo = async (userInfoData: any) => {
    try {
      // Save user info to AsyncStorage for now (will be replaced with API call)
      await AsyncStorage.setItem('primeform_user_info', JSON.stringify(userInfoData));
      await AsyncStorage.setItem('primeform_user_info_completed', 'true');
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

  const checkUserInfoStatus = async () => {
    try {
      const userInfoCompleted = await AsyncStorage.getItem('primeform_user_info_completed');
      const userInfoCancelled = await AsyncStorage.getItem('primeform_user_info_cancelled');
      const permissionCancelled = await AsyncStorage.getItem('primeform_permission_modal_seen');
      
      // Only show user info modal if:
      // 1. User hasn't completed user info collection, AND
      // 2. User previously cancelled user info collection, AND
      // 3. User didn't cancel the permission modal
      if (!userInfoCompleted && userInfoCancelled === 'true' && permissionCancelled !== 'cancelled') {
        setShowUserInfoModal(true);
      }
    } catch (error) {
      console.error('Failed to check user info status:', error);
    }
  };

  const handleUpdateUserInfo = async (updatedUserInfo: any) => {
    try {
      // Save updated user info to AsyncStorage for now (will be replaced with API call)
      await AsyncStorage.setItem('primeform_user_info', JSON.stringify(updatedUserInfo));
      setUserInfo(updatedUserInfo);
      console.log('User info updated:', updatedUserInfo);
    } catch (error) {
      console.error('Failed to update user info:', error);
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
    setSidebarVisible(true);
  };

  const handleNotificationPress = () => {
    console.log('Notifications pressed - feature coming soon');
  };

  const handleTabPress = (tab: 'home' | 'diet' | 'gym' | 'workout' | 'progress') => {
    setActiveTab(tab);
    if (tab === 'workout') {
      router.push('/(dashboard)/workout');
    } else if (tab === 'diet') {
      router.push('/(dashboard)/diet');
    } else {
      console.log('Feature coming soon:', tab);
    }
  };

  const handleSidebarMenuPress = async (action: string) => {
    switch (action) {
      case 'profile':
        setShowProfilePage(true);
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
        await handleLogout();
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Mock data for demonstration
  const mockStats = [
    { label: t('dashboard.stats.calories'), value: '1,200', icon: 'flame', color: colors.gold },
    { label: t('dashboard.stats.water'), value: '2.1', unit: 'L', icon: 'water', color: colors.blue },
    { label: t('dashboard.stats.workouts'), value: '2', icon: 'barbell', color: colors.green },
    { label: t('dashboard.stats.steps'), value: '8,500', icon: 'walk', color: colors.purple },
  ];

  const mockWorkouts = [
    { name: `💪 ${transliterateText('Push-Ups')}`, sets: '3x12', reps: `12 ${t('workout.reps')}`, weight: '' },
    { name: `🦵 ${transliterateText('Leg Press')}`, sets: '4x10', reps: `10 ${t('workout.reps')}`, weight: '120kg' },
    { name: `🏋️ ${transliterateText('Bench Press')}`, sets: '3x8', reps: `8 ${t('workout.reps')}`, weight: '80kg' },
  ];

  const mockMeals = [
    { name: `🥣 ${transliterateText('Chicken Rice')}`, calories: 350, weight: '200g' },
    { name: `🥗 ${transliterateText('Greek Salad')}`, calories: 500, weight: '400g' },
    { name: `🍗 ${transliterateText('Grilled Chicken')}`, calories: 650, weight: '500g' },
  ];

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
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <DashboardHeader 
          userName={transliterateName((user?.fullName || dashboardData.user.fullName).split(' ')[0])}
          onProfilePress={handleProfilePress}
          onNotificationPress={handleNotificationPress}
          notificationCount={dashboardData.notifications.length}
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
            stats={mockStats}
            delay={200}
          />

          {/* Today's Workout Plan */}
          <WorkoutPlanCard
            title={t('dashboard.workout.plan')}
            workouts={mockWorkouts}
            onPress={() => console.log('View workout plan')}
            delay={300}
          />

          {/* Today's Meal Plan */}
          <MealPlanCard
            title={t('dashboard.meal.plan')}
            meals={mockMeals}
            totalCalories={1500}
            onPress={() => console.log('View meal plan')}
            delay={400}
          />

          {/* Extra spacing for bottom navigation */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNavigation 
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />

        {/* Sidebar */}
        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onMenuItemPress={handleSidebarMenuPress}
          userName={transliterateName((user?.fullName || dashboardData.user.fullName).split(' ')[0])}
          userEmail={user?.email || dashboardData.user.email}
          userInfo={userInfo}
        />

        {/* Permission Modal */}
        <Modal
          visible={showPermissionModal}
          transparent
          animationType="fade"
          statusBarTranslucent
        >
          <View style={styles.permissionOverlay}>
            <View style={styles.permissionModal}>
              <View style={styles.permissionHeader}>
                <Text style={styles.permissionTitle}>Welcome to PrimeForm! 🎉</Text>
                <Text style={styles.permissionSubtitle}>
                  To provide you with personalized diet and workout plans, we need to collect some information about you.
                </Text>
              </View>
              
              <View style={styles.permissionButtons}>
                <TouchableOpacity 
                  style={styles.permissionStartButton}
                  onPress={handlePermissionStart}
                  activeOpacity={0.8}
                >
                  <Text style={styles.permissionStartButtonText}>Start</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.permissionCancelButton}
                  onPress={handlePermissionCancel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.permissionCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
  permissionOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  permissionModal: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '80%',
    alignItems: 'center',
  },
  permissionHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  permissionTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  permissionSubtitle: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing.md,
  },
  permissionStartButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  permissionStartButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: typography.body,
  },
  permissionCancelButton: {
    backgroundColor: colors.mutedText,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  permissionCancelButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.body,
  },
});
