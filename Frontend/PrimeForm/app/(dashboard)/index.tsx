import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
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
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
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
    console.log('Tab pressed:', tab, '- feature coming soon');
  };

  const handleSidebarMenuPress = async (action: string) => {
    switch (action) {
      case 'profile':
        console.log('Profile - feature coming soon');
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
          userName={transliterateName(user?.fullName || dashboardData.user.fullName)}
          userEmail={user?.email || dashboardData.user.email}
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
});
