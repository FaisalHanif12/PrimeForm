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
  DeviceEventEmitter,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInLeft, FadeInRight, SlideInUp } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { useToast } from '../../src/context/ToastContext';
import userProfileService from '../../src/services/userProfileService';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import Sidebar from '../../src/components/Sidebar';
import ProfilePage from '../../src/components/ProfilePage';
import NotificationModal from '../../src/components/NotificationModal';
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
  const { t, language, transliterateText } = useLanguage();
  const { user } = useAuthContext();
  const { showToast } = useToast();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [selectedTab, setSelectedTab] = useState<'streak' | 'history'>('streak');

  useEffect(() => {
    loadStreakData();
  }, []);

  // Listen for completion events to update streak data immediately
  useEffect(() => {
    const listeners = [
      DeviceEventEmitter.addListener('exerciseCompleted', () => {
        // Refresh streak data when exercise is completed
        loadStreakData();
      }),
      DeviceEventEmitter.addListener('mealCompleted', () => {
        // Refresh streak data when meal is completed
        loadStreakData();
      }),
      DeviceEventEmitter.addListener('dayCompleted', () => {
        // Refresh streak data when day is completed
        loadStreakData();
      }),
      DeviceEventEmitter.addListener('workoutProgressUpdated', () => {
        // Refresh streak data when workout progress is updated
        loadStreakData();
      }),
      DeviceEventEmitter.addListener('dietProgressUpdated', () => {
        // Refresh streak data when diet progress is updated
        loadStreakData();
      }),
    ];

    return () => {
      listeners.forEach(listener => {
        try {
          listener.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      });
    };
  }, []);

  // OPTIMIZATION: Calculate from local data - no API call on page visit
  const loadStreakData = async () => {
    try {
      setIsLoading(true);

      // Calculate streak data from local storage only (no API call)
      const response = await streakService.getStreakData(true);
      if (response.success && response.data) {
        setStreakData(response.data);
      }

    } catch (error) {
      // Failed to load streak data
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePress = () => {
    setSidebarVisible(true);
  };

  const handleNotificationPress = () => {
    setNotificationModalVisible(true);
  };

  const handleSidebarMenuPress = async (action: string) => {
    setSidebarVisible(false);
    
    switch (action) {
      case 'profile':
        setShowProfilePage(true);
        break;
      case 'streak':
        // Already on streak page
        break;
      case 'ai-trainer':
        router.push('/(dashboard)/ai-trainer');
        break;
      case 'language':
        router.push('/(dashboard)/language');
        break;
      case 'sport-mode':
        router.push('/(dashboard)/sport-mode');
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
          showToast('error', t('streak.error.logout'));
        }
        break;
      default:
        break;
    }
  };

  // Load user info - fetch from API if cache is empty
  const loadUserInfo = async () => {
    try {
      // First try cache
      const cachedData = userProfileService.getCachedData();
      if (cachedData && cachedData.data) {
        setUserInfo(cachedData.data);
        return;
      }

      // If no cache, fetch from API
      const response = await userProfileService.getUserProfile();
      if (response.success && response.data) {
        setUserInfo(response.data);
      }
    } catch (error) {
      // Failed to load user info
    }
  };

  const handleUpdateUserInfo = (updatedInfo: any) => {
    setUserInfo(updatedInfo);
  };

  // Load user info when profile page is opened
  useEffect(() => {
    if (showProfilePage && !userInfo) {
      loadUserInfo();
    }
  }, [showProfilePage]);

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
            {tab === 'streak' ? t('streak.tab.maintain') : t('streak.tab.history')}
          </Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );

  const renderStreakMaintenance = () => {
    if (!streakData) return null;

    return (
      <View style={styles.streakMaintenanceContainer}>
        {/* Streak Breakdown */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.streakBreakdownSection}>
          <Text style={styles.sectionTitle}>{t('streak.breakdown.title')}</Text>

          <View style={styles.breakdownCard}>
            <View style={styles.breakdownHeader}>
              <View style={styles.breakdownIconContainer}>
                <View style={[styles.breakdownIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.breakdownIconText, { color: colors.primary }]}>W</Text>
                </View>
              </View>
              <View style={styles.breakdownContent}>
                <Text style={styles.breakdownLabel}>{t('streak.workout.title')}</Text>
                <Text style={styles.breakdownSubtext}>{t('streak.workout.subtitle')}</Text>
              </View>
              <View style={styles.breakdownValueContainer}>
                <Text style={styles.breakdownValue}>{streakData.currentWorkoutStreak}</Text>
                <Text style={styles.breakdownDays}>{t('streak.days')}</Text>
              </View>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownStats}>
              <View style={styles.breakdownStat}>
                <Text style={styles.breakdownStatLabel}>{t('streak.best')}</Text>
                <Text style={styles.breakdownStatValue}>{streakData.longestWorkoutStreak}</Text>
              </View>
              <View style={styles.breakdownStat}>
                <Text style={styles.breakdownStatLabel}>{t('streak.thisWeek')}</Text>
                <Text style={styles.breakdownStatValue}>
                  {streakData.weeklyWorkoutCount !== undefined ? streakData.weeklyWorkoutCount : Math.floor((streakData.weeklyConsistency / 100) * 7)}/7
                </Text>
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
                <Text style={styles.breakdownLabel}>{t('streak.diet.title')}</Text>
                <Text style={styles.breakdownSubtext}>{t('streak.diet.subtitle')}</Text>
              </View>
              <View style={styles.breakdownValueContainer}>
                <Text style={styles.breakdownValue}>{streakData.currentDietStreak}</Text>
                <Text style={styles.breakdownDays}>{t('streak.days')}</Text>
              </View>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownStats}>
              <View style={styles.breakdownStat}>
                <Text style={styles.breakdownStatLabel}>{t('streak.best')}</Text>
                <Text style={styles.breakdownStatValue}>{streakData.longestDietStreak}</Text>
              </View>
              <View style={styles.breakdownStat}>
                <Text style={styles.breakdownStatLabel}>{t('streak.thisWeek')}</Text>
                <Text style={styles.breakdownStatValue}>
                  {streakData.weeklyDietCount !== undefined ? streakData.weeklyDietCount : Math.floor((streakData.weeklyConsistency / 100) * 7)}/7
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  };

  const renderHistory = () => {
    if (!streakData) return null;

    // History is now from plan start date (or last 60 days if no plan)
    const history = streakData.streakHistory;
    
    if (history.length === 0) {
      return (
        <Animated.View entering={FadeInUp.delay(300)} style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t('streak.history.title')}</Text>
              <Text style={styles.historySubtitle}>No activity history yet</Text>
            </View>
          </View>
        </Animated.View>
      );
    }

    // Get plan start date from history (first date in history)
    const firstHistoryDate = new Date(history[0].date);
    const lastHistoryDate = new Date(history[history.length - 1].date);
    
    // Group days by month
    const daysByMonth: { [key: string]: Array<{ date: string; workoutCompleted: boolean; dietCompleted: boolean; overallCompleted: boolean }> } = {};
    
    history.forEach((day) => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!daysByMonth[monthKey]) {
        daysByMonth[monthKey] = [];
      }
      daysByMonth[monthKey].push(day);
    });

    // Sort months chronologically (newest first)
    const sortedMonths = Object.keys(daysByMonth).sort().reverse();

    // Helper function to get month name
    const getMonthName = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // Format date range for subtitle - simplified
    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    const subtitle = history.length > 0 
      ? `${formatDate(firstHistoryDate)} - ${formatDate(lastHistoryDate)}`
      : 'No activity yet';

    return (
      <Animated.View entering={FadeInUp.delay(300)} style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t('streak.history.title')}</Text>
            <Text style={styles.historySubtitle}>{subtitle}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {sortedMonths.map((monthKey) => {
            const monthDays = daysByMonth[monthKey];
            const firstDay = monthDays[0];
            const monthName = getMonthName(firstDay.date);

            return (
              <View key={monthKey} style={styles.monthSection}>
                <Text style={styles.monthHeader}>{monthName}</Text>
                <View style={styles.calendarGrid}>
                  {monthDays.map((day, index) => {
                    const date = new Date(day.date);
                    const dayNumber = date.getDate();
                    const isComplete = day.overallCompleted;
                    const isPartial = (day.workoutCompleted || day.dietCompleted) && !isComplete;
                    const isToday = date.toDateString() === new Date().toDateString();

                    return (
                      <View key={`${monthKey}-${index}`} style={[
                        styles.calendarDay,
                        isComplete && styles.calendarDayCompleted,
                        isPartial && styles.calendarDayPartial,
                        isToday && styles.calendarDayToday,
                      ]}>
                        <Text style={[
                          styles.calendarDayNumber,
                          isComplete && styles.calendarDayNumberActive,
                          isPartial && styles.calendarDayNumberPartial,
                          isToday && styles.calendarDayNumberToday
                        ]}>
                          {dayNumber}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
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
            onNotificationPress={handleNotificationPress}
            notificationCount={0}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('streak.loading')}</Text>
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
          onNotificationPress={() => {}}
          notificationCount={0}
        />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.heroSection}>
            <Text style={styles.heroTitle}>{t('streak.title')}</Text>
            <Text style={styles.heroSubtitle}>{t('streak.subtitle')}</Text>
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

        {/* Notification Modal */}
        <NotificationModal
          visible={notificationModalVisible}
          onClose={() => setNotificationModalVisible(false)}
        />

        {/* Profile Page */}
        <ProfilePage
          visible={showProfilePage}
          onClose={() => {
            setShowProfilePage(false);
            setSidebarVisible(true);
          }}
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    fontSize: 20,
    fontWeight: '500',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  heroSubtitle: {
    color: colors.primary,
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
  monthSection: {
    marginBottom: spacing.xl,
  },
  monthHeader: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
    textTransform: 'capitalize',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.lg,
    justifyContent: 'flex-start',
  },
  calendarDay: {
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder + '40',
  },
  calendarDayCompleted: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  calendarDayPartial: {
    backgroundColor: colors.primary + '30',
    borderColor: colors.primary + '60',
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: colors.gold,
  },
  calendarDayNumber: {
    color: colors.mutedText,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },
  calendarDayNumberActive: {
    color: colors.white,
    fontWeight: '700',
  },
  calendarDayNumberPartial: {
    color: colors.primary,
    fontWeight: '600',
  },
  calendarDayNumberToday: {
    color: colors.gold,
    fontWeight: '700',
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 100,
  },
});
