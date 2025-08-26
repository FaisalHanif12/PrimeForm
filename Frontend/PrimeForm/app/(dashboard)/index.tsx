import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Dimensions, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useAuthContext } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import userProfileService from '../../src/services/userProfileService';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import Sidebar from '../../src/components/Sidebar';
import UserInfoModal from '../../src/components/UserInfoModal';
import ProfilePage from '../../src/components/ProfilePage';
import StatsCard from '../../src/components/StatsCard';
import WorkoutPlanCard from '../../src/components/WorkoutPlanCard';
import MealPlanCard from '../../src/components/MealPlanCard';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import { useToast } from '../../src/context/ToastContext';


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
  // Removed permission modal state
  const [backendAvailable, setBackendAvailable] = useState(false); // Start with backend unavailable
  const [offlineMode, setOfflineMode] = useState(true); // Start in offline mode
  const { showToast } = useToast();


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
          fullName: user?.fullName || 'User',
          email: user?.email || 'user@example.com',
          isEmailVerified: true,
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
        // Show profile page
        setShowProfilePage(true);
        break;
      case 'edit_profile':
        // Show user info modal for editing
        setShowUserInfoModal(true);
        break;
              case 'settings':
          showToast('info', 'Settings feature coming soon!');
          break;
        case 'subscription':
          showToast('info', 'Subscription Plan feature coming soon!');
          break;
      case 'logout':
        // Actually perform logout
        try {
          await authLogout();
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
  // Removed permissionOverlay styles
  // Removed permissionModal styles
  // Removed permissionHeader styles
  // Removed permissionTitle styles
  // Removed permissionSubtitle styles
  // Removed permissionButtons styles
  // Removed permissionStartButton styles
  // Removed permissionStartButtonText styles
  // Removed permissionCancelButton styles
  // Removed permissionCancelButtonText styles
});
