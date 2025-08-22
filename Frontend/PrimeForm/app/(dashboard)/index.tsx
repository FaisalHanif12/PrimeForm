import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { authService } from '../../src/services/authService';
import { useAuthContext } from '../../src/context/AuthContext';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import GlassCard from '../../src/components/GlassCard';


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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


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

  if (loading) {
    return (
      <DecorativeBackground>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
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
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInUp} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <Text style={styles.nameText}>{(user?.fullName || dashboardData.user.fullName).split(' ')[0]} 🏃‍♂️</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Notifications */}
        {dashboardData.notifications.length > 0 && (
          <Animated.View entering={FadeInDown}>
            {dashboardData.notifications.map((notification, index) => (
              <GlassCard key={index} style={[styles.notificationCard, 
                notification.priority === 'high' && styles.highPriorityNotification
              ]}>
                <View style={styles.notificationContent}>
                  <Ionicons 
                    name={notification.type === 'welcome' ? 'sparkles' : 'mail'} 
                    size={20} 
                    color={colors.gold} 
                    style={styles.notificationIcon}
                  />
                  <View style={styles.notificationText}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </Animated.View>
        )}

        {/* Stats Card */}
        <Animated.View entering={FadeInDown}>
          <GlassCard style={styles.statsCard}>
            <Text style={styles.cardTitle}>Your Progress</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{dashboardData.stats.totalWorkouts}</Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{dashboardData.stats.currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{dashboardData.stats.totalCaloriesBurned}</Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{dashboardData.user.daysSinceJoining}</Text>
                <Text style={styles.statLabel}>Days Member</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown}>
          <GlassCard style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {dashboardData.quickActions.map((action, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.actionItem}
                  onPress={() => handleQuickAction(action.action)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Account Info */}
        <Animated.View entering={FadeInDown}>
          <GlassCard style={styles.accountCard}>
            <Text style={styles.cardTitle}>Account Information</Text>
            <View style={styles.accountInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={16} color={colors.mutedText} />
                <Text style={styles.infoText}>{dashboardData.user.email}</Text>
                {dashboardData.user.isEmailVerified ? (
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                ) : (
                  <Ionicons name="alert-circle" size={16} color={colors.gold} />
                )}
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={16} color={colors.mutedText} />
                <Text style={styles.infoText}>
                  Member since {new Date(dashboardData.user.memberSince).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </ScrollView>


    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 60, // Account for status bar
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
  header: {
    marginBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
  },
  nameText: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginTop: spacing.xs,
  },
  logoutButton: {
    padding: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: radius.md,
  },
  notificationCard: {
    marginBottom: spacing.md,
  },
  highPriorityNotification: {
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  notificationMessage: {
    color: colors.mutedText,
    fontSize: typography.small,
    lineHeight: 18,
  },
  statsCard: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    color: colors.white,
    fontSize: typography.subtitle,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statNumber: {
    color: colors.gold,
    fontSize: 28,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: typography.small,
    marginTop: spacing.xs,
  },
  actionsCard: {
    marginBottom: spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  actionTitle: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  actionDescription: {
    color: colors.mutedText,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  accountCard: {
    marginBottom: spacing.lg,
  },
  accountInfo: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    color: colors.white,
    fontSize: typography.small,
    flex: 1,
  },
});
