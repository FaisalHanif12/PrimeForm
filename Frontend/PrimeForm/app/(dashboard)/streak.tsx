import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInLeft, FadeInRight, SlideInUp } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { useToast } from '../../src/context/ToastContext';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import Sidebar from '../../src/components/Sidebar';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import streakService from '../../src/services/streakService';

const { width: screenWidth } = Dimensions.get('window');

interface StreakData {
  currentWorkoutStreak: number;
  currentDietStreak: number;
  currentOverallStreak: number;
  longestWorkoutStreak: number;
  longestDietStreak: number;
  longestOverallStreak: number;
  weeklyConsistency: number;
  monthlyConsistency: number;
  totalActiveDays: number;
  streakHistory: Array<{
    date: string;
    workoutCompleted: boolean;
    dietCompleted: boolean;
    overallCompleted: boolean;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: string;
    category: 'workout' | 'diet' | 'overall';
  }>;
  milestones: Array<{
    target: number;
    achieved: boolean;
    category: 'workout' | 'diet' | 'overall';
    title: string;
  }>;
}

export default function StreakScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuthContext();
  const { showToast } = useToast();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [selectedTab, setSelectedTab] = useState<'streak' | 'history'>('streak');

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      setIsLoading(true);

      // Check if user has premium subscription
      const hasSubscription = await checkPremiumSubscription();
      if (!hasSubscription) {
        showToast('warning', 'Streak Tracker is available for Premium subscribers only.');
        router.push('/(dashboard)/subscription');
        return;
      }

      const response = await streakService.getStreakData();
      if (response.success && response.data) {
        setStreakData(response.data);
      }

    } catch (error) {
      console.error('Failed to load streak data:', error);
      showToast('error', 'Failed to load streak data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPremiumSubscription = async (): Promise<boolean> => {
    // TODO: Implement actual subscription check
    // For now, return true for development
    return true;
  };

  const handleProfilePress = () => {
    setSidebarVisible(true);
  };

  const handleSidebarMenuPress = async (action: string) => {
    switch (action) {
      case 'profile':
        router.push('/(dashboard)');
        break;
      case 'streak':
        // Already on streak page
        break;
      case 'ai-trainer':
        router.push('/(dashboard)/ai-trainer');
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

  const handleTabPress = (tab: 'home' | 'diet' | 'gym' | 'workout' | 'progress') => {
    if (tab === 'home') {
      router.push('/(dashboard)');
    } else if (tab === 'workout') {
      router.push('/(dashboard)/workout');
    } else if (tab === 'diet') {
      router.push('/(dashboard)/diet');
    } else if (tab === 'gym') {
      router.push('/(dashboard)/gym');
    } else if (tab === 'progress') {
      router.push('/(dashboard)/progress');
    }
  };

  const renderTabSelector = () => (
    <Animated.View entering={FadeInUp.delay(200)} style={styles.tabSelector}>
      {(['streak', 'history'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tabButton,
            selectedTab === tab && styles.tabButtonActive
          ]}
          onPress={() => setSelectedTab(tab)}
        >
          <Text style={[
            styles.tabButtonText,
            selectedTab === tab && styles.tabButtonTextActive
          ]}>
            {tab === 'streak' ? 'Maintain Streak' : 'History'}
          </Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );

  const renderStreakMaintenance = () => {
    if (!streakData) return null;

    return (
      <View style={styles.streakMaintenanceContainer}>
        {/* Main Streak Card */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.mainStreakCard}>
          <View style={styles.mainStreakHeader}>
            <Text style={styles.mainStreakLabel}>Current Streak</Text>
            <View style={styles.streakBadge}>
              <View style={styles.streakBadgeDot} />
              <Text style={styles.streakBadgeText}>Active</Text>
            </View>
          </View>

          <View style={styles.mainStreakContent}>
            <Text style={styles.mainStreakValue}>{streakData.currentOverallStreak}</Text>
            <Text style={styles.mainStreakUnit}>Days</Text>
          </View>

          <View style={styles.streakProgressBar}>
            <View style={[styles.streakProgressFill, { width: `${Math.min((streakData.currentOverallStreak / 30) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.streakProgressText}>
            {streakData.currentOverallStreak < 30 ? `${30 - streakData.currentOverallStreak} days to 30-day milestone` : 'Milestone achieved!'}
          </Text>
        </Animated.View>

        {/* Streak Breakdown */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.streakBreakdownSection}>
          <Text style={styles.sectionTitle}>Streak Breakdown</Text>

          <View style={styles.breakdownCard}>
            <View style={styles.breakdownHeader}>
              <View style={styles.breakdownIconContainer}>
                <View style={[styles.breakdownIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.breakdownIconText, { color: colors.primary }]}>W</Text>
                </View>
              </View>
              <View style={styles.breakdownContent}>
                <Text style={styles.breakdownLabel}>Workout Streak</Text>
                <Text style={styles.breakdownSubtext}>Consecutive workout days</Text>
              </View>
              <View style={styles.breakdownValueContainer}>
                <Text style={styles.breakdownValue}>{streakData.currentWorkoutStreak}</Text>
                <Text style={styles.breakdownDays}>days</Text>
              </View>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownStats}>
              <View style={styles.breakdownStat}>
                <Text style={styles.breakdownStatLabel}>Best</Text>
                <Text style={styles.breakdownStatValue}>{streakData.longestWorkoutStreak}</Text>
              </View>
              <View style={styles.breakdownStat}>
                <Text style={styles.breakdownStatLabel}>This Week</Text>
                <Text style={styles.breakdownStatValue}>{Math.floor((streakData.weeklyConsistency / 100) * 7)}/7</Text>
              </View>
            </View>
          </View>

          <View style={styles.breakdownCard}>
            <View style={styles.breakdownHeader}>
              <View style={styles.breakdownIconContainer}>
                <View style={[styles.breakdownIcon, { backgroundColor: colors.green + '20' }]}>
                  <Text style={[styles.breakdownIconText, { color: colors.green }]}>D</Text>
                </View>
              </View>
              <View style={styles.breakdownContent}>
                <Text style={styles.breakdownLabel}>Diet Streak</Text>
                <Text style={styles.breakdownSubtext}>Consecutive nutrition days</Text>
              </View>
              <View style={styles.breakdownValueContainer}>
                <Text style={styles.breakdownValue}>{streakData.currentDietStreak}</Text>
                <Text style={styles.breakdownDays}>days</Text>
              </View>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownStats}>
              <View style={styles.breakdownStat}>
                <Text style={styles.breakdownStatLabel}>Best</Text>
                <Text style={styles.breakdownStatValue}>{streakData.longestDietStreak}</Text>
              </View>
              <View style={styles.breakdownStat}>
                <Text style={styles.breakdownStatLabel}>This Week</Text>
                <Text style={styles.breakdownStatValue}>{Math.floor((streakData.weeklyConsistency / 100) * 7)}/7</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Consistency Stats */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.consistencyStatsSection}>
          <Text style={styles.sectionTitle}>Consistency Overview</Text>

          <View style={styles.consistencyGrid}>
            <View style={styles.consistencyStatCard}>
              <Text style={styles.consistencyStatValue}>{streakData.weeklyConsistency}%</Text>
              <Text style={styles.consistencyStatLabel}>Weekly</Text>
              <View style={styles.miniProgressBar}>
                <View style={[styles.miniProgressFill, { width: `${streakData.weeklyConsistency}%` }]} />
              </View>
            </View>

            <View style={styles.consistencyStatCard}>
              <Text style={styles.consistencyStatValue}>{streakData.monthlyConsistency}%</Text>
              <Text style={styles.consistencyStatLabel}>Monthly</Text>
              <View style={styles.miniProgressBar}>
                <View style={[styles.miniProgressFill, { width: `${streakData.monthlyConsistency}%` }]} />
              </View>
            </View>

            <View style={styles.consistencyStatCard}>
              <Text style={styles.consistencyStatValue}>{streakData.totalActiveDays}</Text>
              <Text style={styles.consistencyStatLabel}>Total Days</Text>
              <Text style={styles.consistencyStatSubtext}>All time active</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  };

  const renderHistory = () => {
    if (!streakData) return null;

    const last30Days = streakData.streakHistory.slice(-30);

    return (
      <Animated.View entering={FadeInUp.delay(300)} style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.sectionTitle}>Activity History</Text>
            <Text style={styles.historySubtitle}>Last 30 days of activity</Text>
          </View>
        </View>

        <View style={styles.calendarGrid}>
          {last30Days.map((day, index) => {
            const date = new Date(day.date);
            const dayNumber = date.getDate();
            const isComplete = day.overallCompleted;
            const isPartial = (day.workoutCompleted || day.dietCompleted) && !isComplete;

            return (
              <View key={index} style={[
                styles.calendarDay,
                isComplete && styles.calendarDayCompleted,
                isPartial && styles.calendarDayPartial,
              ]}>
                <Text style={[
                  styles.calendarDayNumber,
                  isComplete && styles.calendarDayNumberActive,
                  isPartial && styles.calendarDayNumberPartial
                ]}>
                  {dayNumber}
                </Text>
                {(isComplete || isPartial) && (
                  <View style={styles.calendarDayDots}>
                    {day.workoutCompleted && (
                      <View style={[styles.activityDot, { backgroundColor: colors.primary }]} />
                    )}
                    {day.dietCompleted && (
                      <View style={[styles.activityDot, { backgroundColor: colors.green }]} />
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Workout</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, { backgroundColor: colors.green }]} />
            <Text style={styles.legendText}>Diet</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, { backgroundColor: colors.cardBorder }]} />
            <Text style={styles.legendText}>Missed</Text>
          </View>
        </View>
      </Animated.View>
    );
  };


  if (isLoading) {
    return (
      <DecorativeBackground>
        <SafeAreaView style={styles.safeArea}>
          <DashboardHeader
            userName={user?.fullName || t('common.user')}
            onProfilePress={handleProfilePress}
            onNotificationPress={() => console.log('Notifications pressed')}
            notificationCount={0}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your streak data...</Text>
          </View>
          <BottomNavigation
            activeTab=""
            onTabPress={handleTabPress}
          />
        </SafeAreaView>
      </DecorativeBackground>
    );
  }

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        <DashboardHeader
          userName={user?.fullName || t('common.user')}
          onProfilePress={handleProfilePress}
          onNotificationPress={() => console.log('Notifications pressed')}
          notificationCount={0}
        />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.heroSection}>
            <Text style={styles.heroTitle}>Streak Tracker</Text>
            <Text style={styles.heroSubtitle}>Track your consistency and maintain momentum</Text>
          </Animated.View>

          {/* Tab Selector */}
          {renderTabSelector()}

          {/* Content */}
          {selectedTab === 'streak' && renderStreakMaintenance()}
          {selectedTab === 'history' && renderHistory()}

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        <BottomNavigation
          activeTab=""
          onTabPress={handleTabPress}
        />

        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onMenuItemPress={handleSidebarMenuPress}
          userName={user?.fullName || t('common.user')}
          userEmail={user?.email || 'user@example.com'}
          userInfo={null}
          badges={[]}
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
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    marginTop: spacing.md,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    color: colors.mutedText,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
  },

  // Tab Selector
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },
  tabButtonTextActive: {
    color: colors.white,
  },

  // Section Title
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.lg,
    letterSpacing: 0.3,
  },

  // Streak Maintenance
  streakMaintenanceContainer: {
    gap: spacing.xl,
  },

  // Main Streak Card
  mainStreakCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.primary + '40',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  mainStreakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  mainStreakLabel: {
    color: colors.mutedText,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.body,
    letterSpacing: 0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.green + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  streakBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  streakBadgeText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  mainStreakContent: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  mainStreakValue: {
    color: colors.white,
    fontSize: 72,
    fontWeight: '900',
    fontFamily: fonts.heading,
    lineHeight: 80,
  },
  mainStreakUnit: {
    color: colors.mutedText,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginTop: spacing.xs,
    letterSpacing: 1,
  },
  streakProgressBar: {
    height: 8,
    backgroundColor: colors.cardBorder + '40',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  streakProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  streakProgressText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
  },

  // Streak Breakdown Section
  streakBreakdownSection: {
    gap: spacing.md,
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  breakdownIconContainer: {
    marginRight: spacing.md,
  },
  breakdownIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdownIconText: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: fonts.heading,
  },
  breakdownContent: {
    flex: 1,
  },
  breakdownLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs / 2,
  },
  breakdownSubtext: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  breakdownValueContainer: {
    alignItems: 'flex-end',
  },
  breakdownValue: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
    fontFamily: fonts.heading,
  },
  breakdownDays: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.cardBorder + '60',
    marginVertical: spacing.md,
  },
  breakdownStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  breakdownStat: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownStatLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
  },
  breakdownStatValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: fonts.heading,
  },

  // Consistency Stats Section
  consistencyStatsSection: {
    gap: spacing.md,
  },
  consistencyGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  consistencyStatCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  consistencyStatValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  consistencyStatLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  consistencyStatSubtext: {
    color: colors.mutedText + '80',
    fontSize: 11,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  miniProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.cardBorder + '40',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },

  // History Section
  historyContainer: {
    gap: spacing.xl,
  },
  historyHeader: {
    marginBottom: spacing.md,
  },
  historySubtitle: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
    marginTop: spacing.xs,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  calendarDay: {
    width: (screenWidth - spacing.lg * 2 - spacing.xs * 6) / 7,
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  calendarDayCompleted: {
    backgroundColor: colors.green + '15',
    borderColor: colors.green + '60',
  },
  calendarDayPartial: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary + '60',
  },
  calendarDayNumber: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs / 2,
  },
  calendarDayNumberActive: {
    color: colors.white,
  },
  calendarDayNumberPartial: {
    color: colors.white,
  },
  calendarDayDots: {
    flexDirection: 'row',
    gap: 3,
  },
  activityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendIndicator: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 100,
  },
});
