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
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history' | 'achievements'>('overview');

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
      {(['overview', 'history', 'achievements'] as const).map((tab) => (
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
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );

  const renderOverview = () => {
    if (!streakData) return null;

    return (
      <View style={styles.overviewContainer}>
        {/* Current Streaks */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.streakSection}>
          <Text style={styles.sectionTitle}>🔥 Current Streaks</Text>
          <View style={styles.streakGrid}>
            <View style={styles.streakCard}>
              <View style={styles.streakHeader}>
                <Text style={styles.streakIcon}>💪</Text>
                <Text style={styles.streakLabel}>Workout</Text>
              </View>
              <Text style={styles.streakValue}>{streakData.currentWorkoutStreak}</Text>
              <Text style={styles.streakUnit}>days</Text>
            </View>
            
            <View style={styles.streakCard}>
              <View style={styles.streakHeader}>
                <Text style={styles.streakIcon}>🥗</Text>
                <Text style={styles.streakLabel}>Diet</Text>
              </View>
              <Text style={styles.streakValue}>{streakData.currentDietStreak}</Text>
              <Text style={styles.streakUnit}>days</Text>
            </View>
            
            <View style={[styles.streakCard, styles.streakCardPrimary]}>
              <View style={styles.streakHeader}>
                <Text style={styles.streakIcon}>⭐</Text>
                <Text style={styles.streakLabel}>Overall</Text>
              </View>
              <Text style={[styles.streakValue, styles.streakValuePrimary]}>
                {streakData.currentOverallStreak}
              </Text>
              <Text style={styles.streakUnit}>days</Text>
            </View>
          </View>
        </Animated.View>

        {/* Best Streaks */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.bestStreakSection}>
          <Text style={styles.sectionTitle}>🏆 Personal Records</Text>
          <View style={styles.bestStreakGrid}>
            <View style={styles.bestStreakCard}>
              <Text style={styles.bestStreakIcon}>💪</Text>
              <Text style={styles.bestStreakValue}>{streakData.longestWorkoutStreak}</Text>
              <Text style={styles.bestStreakLabel}>Best Workout Streak</Text>
            </View>
            
            <View style={styles.bestStreakCard}>
              <Text style={styles.bestStreakIcon}>🥗</Text>
              <Text style={styles.bestStreakValue}>{streakData.longestDietStreak}</Text>
              <Text style={styles.bestStreakLabel}>Best Diet Streak</Text>
            </View>
            
            <View style={styles.bestStreakCard}>
              <Text style={styles.bestStreakIcon}>⭐</Text>
              <Text style={styles.bestStreakValue}>{streakData.longestOverallStreak}</Text>
              <Text style={styles.bestStreakLabel}>Best Overall Streak</Text>
            </View>
          </View>
        </Animated.View>

        {/* Consistency Metrics */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.consistencySection}>
          <Text style={styles.sectionTitle}>📊 Consistency</Text>
          <View style={styles.consistencyGrid}>
            <View style={styles.consistencyCard}>
              <Text style={styles.consistencyLabel}>Weekly</Text>
              <View style={styles.consistencyBar}>
                <View 
                  style={[
                    styles.consistencyFill, 
                    { width: `${streakData.weeklyConsistency}%` }
                  ]} 
                />
              </View>
              <Text style={styles.consistencyValue}>{streakData.weeklyConsistency}%</Text>
            </View>
            
            <View style={styles.consistencyCard}>
              <Text style={styles.consistencyLabel}>Monthly</Text>
              <View style={styles.consistencyBar}>
                <View 
                  style={[
                    styles.consistencyFill, 
                    { width: `${streakData.monthlyConsistency}%` }
                  ]} 
                />
              </View>
              <Text style={styles.consistencyValue}>{streakData.monthlyConsistency}%</Text>
            </View>
            
            <View style={styles.consistencyCard}>
              <Text style={styles.consistencyLabel}>Total Active Days</Text>
              <Text style={styles.totalDaysValue}>{streakData.totalActiveDays}</Text>
              <Text style={styles.totalDaysLabel}>days</Text>
            </View>
          </View>
        </Animated.View>

        {/* Milestones */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.milestonesSection}>
          <Text style={styles.sectionTitle}>🎯 Milestones</Text>
          <View style={styles.milestonesGrid}>
            {streakData.milestones.map((milestone, index) => (
              <View key={index} style={[
                styles.milestoneCard,
                milestone.achieved && styles.milestoneCardAchieved
              ]}>
                <Text style={[
                  styles.milestoneTarget,
                  milestone.achieved && styles.milestoneTargetAchieved
                ]}>
                  {milestone.target}
                </Text>
                <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                {milestone.achieved && (
                  <Text style={styles.milestoneAchieved}>✓ Achieved</Text>
                )}
              </View>
            ))}
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
        <Text style={styles.sectionTitle}>📅 Last 30 Days</Text>
        <View style={styles.calendarGrid}>
          {last30Days.map((day, index) => (
            <View key={index} style={[
              styles.calendarDay,
              day.overallCompleted && styles.calendarDayCompleted,
              day.workoutCompleted && !day.dietCompleted && styles.calendarDayPartial,
              !day.workoutCompleted && day.dietCompleted && styles.calendarDayPartial,
            ]}>
              <Text style={styles.calendarDayNumber}>
                {new Date(day.date).getDate()}
              </Text>
              <View style={styles.calendarDayIndicators}>
                <View style={[
                  styles.calendarIndicator,
                  day.workoutCompleted && styles.calendarIndicatorActive
                ]}>
                  <Text style={styles.calendarIndicatorText}>W</Text>
                </View>
                <View style={[
                  styles.calendarIndicator,
                  day.dietCompleted && styles.calendarIndicatorActive
                ]}>
                  <Text style={styles.calendarIndicatorText}>D</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
        
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.green }]} />
            <Text style={styles.legendText}>Both Complete</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.gold }]} />
            <Text style={styles.legendText}>Partial</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.cardBorder }]} />
            <Text style={styles.legendText}>Missed</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderAchievements = () => {
    if (!streakData) return null;

    return (
      <Animated.View entering={FadeInUp.delay(300)} style={styles.achievementsContainer}>
        <Text style={styles.sectionTitle}>🏅 Achievements</Text>
        <View style={styles.achievementsList}>
          {streakData.achievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementCard}>
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
                <Text style={styles.achievementDate}>
                  Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={[
                styles.achievementBadge,
                { backgroundColor: 
                  achievement.category === 'workout' ? colors.primary :
                  achievement.category === 'diet' ? colors.green : colors.gold
                }
              ]}>
                <Text style={styles.achievementBadgeText}>
                  {achievement.category.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
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
            activeTab="progress"
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
            <Text style={styles.heroTitle}>🔥 Streak Tracker</Text>
            <Text style={styles.heroSubtitle}>Premium Feature - Track Your Consistency</Text>
          </Animated.View>

          {/* Tab Selector */}
          {renderTabSelector()}

          {/* Content */}
          {selectedTab === 'overview' && renderOverview()}
          {selectedTab === 'history' && renderHistory()}
          {selectedTab === 'achievements' && renderAchievements()}

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        <BottomNavigation 
          activeTab="progress"
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
    fontSize: 32,
    fontWeight: '900',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '600',
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

  // Overview
  overviewContainer: {
    gap: spacing.xl,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.lg,
  },

  // Streak Section
  streakSection: {
    marginBottom: spacing.lg,
  },
  streakGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  streakCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  streakCardPrimary: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  streakHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  streakIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  streakLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  streakValue: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
    fontFamily: fonts.heading,
  },
  streakValuePrimary: {
    color: colors.primary,
  },
  streakUnit: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },

  // Best Streak Section
  bestStreakSection: {
    marginBottom: spacing.lg,
  },
  bestStreakGrid: {
    gap: spacing.md,
  },
  bestStreakCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  bestStreakIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  bestStreakValue: {
    color: colors.gold,
    fontSize: 24,
    fontWeight: '900',
    fontFamily: fonts.heading,
    marginRight: spacing.md,
  },
  bestStreakLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.heading,
    flex: 1,
  },

  // Consistency Section
  consistencySection: {
    marginBottom: spacing.lg,
  },
  consistencyGrid: {
    gap: spacing.md,
  },
  consistencyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  consistencyLabel: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginBottom: spacing.sm,
  },
  consistencyBar: {
    height: 8,
    backgroundColor: colors.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  consistencyFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  consistencyValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    textAlign: 'right',
  },
  totalDaysValue: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '900',
    fontFamily: fonts.heading,
    textAlign: 'center',
  },
  totalDaysLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
  },

  // Milestones Section
  milestonesSection: {
    marginBottom: spacing.lg,
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  milestoneCard: {
    width: (screenWidth - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  milestoneCardAchieved: {
    borderColor: colors.green,
    backgroundColor: colors.green + '10',
  },
  milestoneTarget: {
    color: colors.mutedText,
    fontSize: 24,
    fontWeight: '900',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  milestoneTargetAchieved: {
    color: colors.green,
  },
  milestoneTitle: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  milestoneAchieved: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },

  // History
  historyContainer: {
    gap: spacing.lg,
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
    borderRadius: radius.sm,
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  calendarDayCompleted: {
    backgroundColor: colors.green + '20',
    borderColor: colors.green,
  },
  calendarDayPartial: {
    backgroundColor: colors.gold + '20',
    borderColor: colors.gold,
  },
  calendarDayNumber: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginBottom: 2,
  },
  calendarDayIndicators: {
    flexDirection: 'row',
    gap: 2,
  },
  calendarIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIndicatorActive: {
    backgroundColor: colors.primary,
  },
  calendarIndicatorText: {
    fontSize: 6,
    fontWeight: '700',
    color: colors.white,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },

  // Achievements
  achievementsContainer: {
    gap: spacing.lg,
  },
  achievementsList: {
    gap: spacing.md,
  },
  achievementCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  achievementContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  achievementTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  achievementDescription: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
  },
  achievementDate: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  achievementBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  achievementBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: fonts.heading,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 100,
  },
});
