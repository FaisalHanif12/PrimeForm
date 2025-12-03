import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInUp, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { useToast } from '../../src/context/ToastContext';
import NotificationModal from '../../src/components/NotificationModal';
import { useNotifications } from '../../src/contexts/NotificationContext';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import Sidebar from '../../src/components/Sidebar';
import ProfilePage from '../../src/components/ProfilePage';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import userProfileService from '../../src/services/userProfileService';
import HealthRemarks from '../../src/components/HealthRemarks';
import ProgressChart, { ProgressChartData } from '../../src/components/ProgressChart';
import progressService from '../../src/services/progressService';

const { width: screenWidth } = Dimensions.get('window');

interface ProgressStats {
  caloriesConsumed: number;
  caloriesBurned: number;
  targetCalories: number;
  waterIntake: number;
  targetWater: number;
  protein: number;
  carbs: number;
  fats: number;
  targetProtein: number; // ✅ Added target macros
  targetCarbs: number;
  targetFats: number;
  workoutsCompleted: number;
  totalWorkouts: number;
  mealsCompleted: number;
  totalMeals: number;
  currentStreak: number;
  longestStreak: number;
  weightProgress: number;
  bodyFatProgress: number;
}

interface ProgressCharts {
  calories: ProgressChartData;
  workouts: ProgressChartData;
  water: ProgressChartData;
}

export default function ProgressScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const { unreadCount } = useNotifications();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [healthRemarks, setHealthRemarks] = useState<string[]>([]);
  const [chartData, setChartData] = useState<ProgressCharts | null>(null);

  // Track if initial load has happened
  const [hasLoadedInitially, setHasLoadedInitially] = React.useState(false);
  
  // Use ref to always access latest selectedPeriod in event listeners
  const selectedPeriodRef = useRef(selectedPeriod);
  
  // Keep ref updated when selectedPeriod changes
  useEffect(() => {
    selectedPeriodRef.current = selectedPeriod;
  }, [selectedPeriod]);

  // OPTIMIZATION: Load progress data with optional force refresh
  const loadProgressData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      // Use ref to get latest selectedPeriod (for event listeners)
      const currentPeriod = selectedPeriodRef.current;

      // Load progress statistics with period filters
      const statsResponse = await progressService.getProgressStats(
        currentPeriod,
        undefined,
        undefined,
        forceRefresh
      );
      if (statsResponse.success && statsResponse.data) {
        setProgressStats(statsResponse.data);
      }

      // Load detailed chart analytics (trend over time) only for weekly/monthly
      if (currentPeriod === 'weekly' || currentPeriod === 'monthly') {
        const chartsResponse = await progressService.getChartData(
          currentPeriod,
          undefined,
          undefined,
          forceRefresh
        );
        if (chartsResponse.success && chartsResponse.data) {
          setChartData({
            calories: chartsResponse.data.calories,
            workouts: chartsResponse.data.workouts,
            water: chartsResponse.data.water,
          });
        }
      } else {
        // For daily view we don't show detailed analytics
        setChartData(null);
      }

      // Load health remarks (no need to force refresh - static content)
      const remarksResponse = await progressService.getHealthRemarks();
      if (remarksResponse.success && remarksResponse.data) {
        setHealthRemarks(remarksResponse.data);
      }

    } catch (error) {
      showToast('error', 'Failed to load progress data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Reload when period changes (after initial load)
  useEffect(() => {
    if (hasLoadedInitially) {
      loadProgressData();
    }
  }, [selectedPeriod, hasLoadedInitially, loadProgressData]);

  // OPTIMIZATION: Don't reload data on every focus - only load once initially
  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedInitially) {
        loadProgressData();
        setHasLoadedInitially(true);
      }
    }, [hasLoadedInitially, loadProgressData])
  );

  // Listen for progress updates from workout and diet screens - only refresh on actions
  useEffect(() => {
    const listeners = [
      DeviceEventEmitter.addListener('exerciseCompleted', () => {
        progressService.invalidateCaches(); // PERFORMANCE: Clear cache before refresh
        loadProgressData(true); // Force refresh after action - uses latest selectedPeriod via ref
      }),
      DeviceEventEmitter.addListener('mealCompleted', () => {
        progressService.invalidateCaches(); // PERFORMANCE: Clear cache before refresh
        loadProgressData(true); // Force refresh after action - uses latest selectedPeriod via ref
      }),
      DeviceEventEmitter.addListener('dayCompleted', () => {
        progressService.invalidateCaches(); // PERFORMANCE: Clear cache before refresh
        loadProgressData(true); // Force refresh after action - uses latest selectedPeriod via ref
      }),
      DeviceEventEmitter.addListener('workoutProgressUpdated', () => {
        progressService.invalidateCaches(); // PERFORMANCE: Clear cache before refresh
        loadProgressData(true); // Force refresh after action - uses latest selectedPeriod via ref
      }),
      DeviceEventEmitter.addListener('dietProgressUpdated', () => {
        progressService.invalidateCaches(); // PERFORMANCE: Clear cache before refresh
        loadProgressData(true); // Force refresh after action - uses latest selectedPeriod via ref
      }),
      DeviceEventEmitter.addListener('waterIntakeUpdated', () => {
        progressService.invalidateCaches(); // PERFORMANCE: Clear cache before refresh
        loadProgressData(true); // Force refresh after action - uses latest selectedPeriod via ref
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
  }, [loadProgressData]); // ✅ Fixed: Now includes loadProgressData so it uses latest selectedPeriod via ref

  const handleProfilePress = () => {
    setSidebarVisible(true);
  };

  const handleUpdateUserInfo = async (updatedUserInfo: any) => {
    try {
      const response = await userProfileService.createOrUpdateProfile(updatedUserInfo);
      if (response.success) {
        setUserInfo(updatedUserInfo);
      } else {
        showToast('error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      showToast('error', 'Failed to update profile. Please check your connection and try again.');
    }
  };

  // Load user info when profile page is opened if it's missing
  useEffect(() => {
    if (showProfilePage && !userInfo) {
      const loadUserInfo = async () => {
        try {
          const cachedData = userProfileService.getCachedData();
          if (cachedData && cachedData.data) {
            setUserInfo(cachedData.data);
          } else {
            const response = await userProfileService.getUserProfile();
            if (response.success && response.data) {
              setUserInfo(response.data);
            }
          }
        } catch (error) {
          // Failed to load user info
        }
      };
      loadUserInfo();
    }
  }, [showProfilePage]);

  const handleSidebarMenuPress = async (action: string) => {
    switch (action) {
      case 'profile':
        setShowProfilePage(true);
        break;
      case 'sport-mode':
        router.push('/(dashboard)/sport-mode');
        break;
      case 'streak':
        router.push('/(dashboard)/streak');
        break;
      case 'ai-trainer':
        router.push('/(dashboard)/ai-trainer');
        break;
      case 'language':
        router.push('/(dashboard)/language');
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
          showToast('error', 'Failed to logout. Please try again.');
        }
        break;
      default:
        break;
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
    }
    // Already on progress page
  };

  const renderOverviewCards = () => {
    if (!progressStats) return null;

    const cards = [
      {
        title: 'Calories',
        consumed: progressStats.caloriesConsumed,
        burned: progressStats.caloriesBurned,
        target: progressStats.targetCalories,
        icon: '🔥',
        color: colors.primary,
        unit: 'kcal'
      },
      {
        title: 'Water Intake',
        consumed: progressStats.waterIntake,
        target: progressStats.targetWater,
        icon: '💧',
        color: colors.blue,
        unit: 'L'
      },
      {
        title: 'Workouts',
        completed: progressStats.workoutsCompleted,
        total: progressStats.totalWorkouts,
        icon: '💪',
        color: colors.gold,
        unit: 'sessions'
      },
      {
        title: 'Meals',
        completed: progressStats.mealsCompleted,
        total: progressStats.totalMeals,
        icon: '🍽️',
        color: colors.green,
        unit: 'meals'
      }
    ];

    return (
      <Animated.View entering={FadeInUp.delay(300)} style={styles.overviewSection}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.cardsGrid}>
          {cards.map((card, index) => (
            <Animated.View
              key={card.title}
              entering={FadeInLeft.delay(400 + index * 100)}
              style={styles.overviewCard}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{card.icon}</Text>
                <Text style={styles.cardTitle}>{card.title}</Text>
              </View>

              <View style={styles.cardContent}>
                {card.consumed !== undefined && card.burned !== undefined ? (
                  // Calories card with consumed/burned
                  <>
                    <View style={styles.calorieRow}>
                      <Text style={styles.calorieLabel}>Consumed</Text>
                      <Text style={[styles.calorieValue, { color: colors.primary }]}>
                        {card.consumed} {card.unit}
                      </Text>
                    </View>
                    <View style={styles.calorieRow}>
                      <Text style={styles.calorieLabel}>Burned</Text>
                      <Text style={[styles.calorieValue, { color: colors.gold }]}>
                        {card.burned} {card.unit}
                      </Text>
                    </View>
                    <View style={styles.calorieRow}>
                      <Text style={styles.calorieLabel}>Net</Text>
                      <Text style={[styles.calorieValue, {
                        color: (card.consumed - card.burned) > 0 ? colors.green : colors.error
                      }]}>
                        {Math.abs(card.consumed - card.burned)} {card.unit}
                      </Text>
                    </View>
                  </>
                ) : card.completed !== undefined && card.total !== undefined ? (
                  // Progress card with completed/total
                  <>
                    <Text style={styles.progressText}>
                      {card.completed}/{card.total}
                    </Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${(card.completed / card.total) * 100}%`,
                            backgroundColor: card.color
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.percentageText}>
                      {Math.round((card.completed / card.total) * 100)}% Complete
                    </Text>
                  </>
                ) : (
                  // Simple consumed/target card
                  <>
                    <Text style={styles.progressText}>
                      {/* ✅ FIXED: Handle NaN values gracefully */}
                      {isNaN(card.consumed!) ? 0 : card.consumed}/{isNaN(card.target!) ? 0 : card.target} {card.unit}
                    </Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(((!isNaN(card.consumed!) && !isNaN(card.target!) && card.target! > 0) ? (card.consumed! / card.target!) * 100 : 0), 100)}%`,
                            backgroundColor: card.color
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.percentageText}>
                      {/* ✅ FIXED: Handle NaN values gracefully */}
                      {Math.round(Math.min(((!isNaN(card.consumed!) && !isNaN(card.target!) && card.target! > 0) ? (card.consumed! / card.target!) * 100 : 0), 100))}% of Goal
                    </Text>
                  </>
                )}
              </View>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderMacronutrients = () => {
    if (!progressStats) return null;

    // ✅ FIXED: Calculate percentage based on target macros, not consumed macros
    // This shows progress toward target, not distribution of consumed macros
    const macros = [
      { 
        name: 'Protein', 
        value: progressStats.protein, 
        target: progressStats.targetProtein || 0,
        color: colors.primary, 
        percentage: (progressStats.targetProtein > 0 && !isNaN(progressStats.targetProtein)) 
          ? Math.min((progressStats.protein / progressStats.targetProtein) * 100, 100) 
          : 0
      },
      { 
        name: 'Carbs', 
        value: progressStats.carbs, 
        target: progressStats.targetCarbs || 0,
        color: colors.gold, 
        percentage: (progressStats.targetCarbs > 0 && !isNaN(progressStats.targetCarbs)) 
          ? Math.min((progressStats.carbs / progressStats.targetCarbs) * 100, 100) 
          : 0
      },
      { 
        name: 'Fats', 
        value: progressStats.fats, 
        target: progressStats.targetFats || 0,
        color: colors.green, 
        percentage: (progressStats.targetFats > 0 && !isNaN(progressStats.targetFats)) 
          ? Math.min((progressStats.fats / progressStats.targetFats) * 100, 100) 
          : 0
      }
    ];

    return (
      <Animated.View entering={FadeInUp.delay(600)} style={styles.macroSection}>
        <Text style={styles.sectionTitle}>Macronutrients</Text>
        <View style={styles.macroCard}>
          <View style={styles.macroChart}>
            {macros.map((macro, index) => (
              <View key={macro.name} style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <View style={[styles.macroColor, { backgroundColor: macro.color }]} />
                  <Text style={styles.macroName}>{macro.name}</Text>
                </View>
                <Text style={styles.macroValue}>
                  {/* ✅ FIXED: Show consumed/target format, handle NaN */}
                  {isNaN(macro.value) ? 0 : macro.value}g / {isNaN(macro.target) ? 0 : macro.target}g
                </Text>
                <Text style={styles.macroPercentage}>
                  {/* ✅ FIXED: Show percentage of target, handle NaN */}
                  {isNaN(macro.percentage) ? 0 : macro.percentage.toFixed(1)}% of Target
                </Text>
                <View style={styles.macroBar}>
                  <View
                    style={[
                      styles.macroBarFill,
                      {
                        width: `${Math.min(isNaN(macro.percentage) ? 0 : macro.percentage, 100)}%`,
                        backgroundColor: macro.color
                      }
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderAnalyticsCharts = () => {
    if (!chartData) return null;

    return (
      <Animated.View entering={FadeInUp.delay(650)} style={styles.chartsSection}>
        <Text style={styles.sectionTitle}>Detailed Analytics</Text>

        <ProgressChart
          title="Calories Trend"
          data={chartData.calories}
          type="line"
          period={selectedPeriod}
        />

        <ProgressChart
          title="Workout Performance"
          data={chartData.workouts}
          type="bar"
          period={selectedPeriod}
        />

        <ProgressChart
          title="Water Hydration"
          data={chartData.water}
          type="bar"
          period={selectedPeriod}
        />
      </Animated.View>
    );
  };

  const renderStreakInfo = () => {
    if (!progressStats) return null;

    return (
      <Animated.View entering={FadeInRight.delay(700)} style={styles.streakSection}>
        <Text style={styles.sectionTitle}>Consistency</Text>
        <View style={styles.streakCard}>
          <View style={styles.streakItem}>
            <Text style={styles.streakIcon}>🔥</Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakValue}>{progressStats.currentStreak}</Text>
              <Text style={styles.streakLabel}>Current Streak</Text>
            </View>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakIcon}>🏆</Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakValue}>{progressStats.longestStreak}</Text>
              <Text style={styles.streakLabel}>Best Streak</Text>
            </View>
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
            onNotificationPress={() => setShowNotificationModal(true)}
            notificationCount={unreadCount}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your progress...</Text>
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
          onNotificationPress={() => setShowNotificationModal(true)}
          notificationCount={unreadCount}
        />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.heroSection}>
            <Text style={styles.heroTitle}>Your Progress</Text>
            <Text style={styles.heroSubtitle}>Track your fitness journey</Text>
          </Animated.View>

          {/* Period Selector (Daily / Weekly / Monthly) */}
          <Animated.View entering={FadeInUp.delay(150)} style={styles.periodSelectorContainer}>
            <View style={styles.periodSelector}>
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.periodButtonActive,
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      selectedPeriod === period && styles.periodButtonTextActive,
                    ]}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Overview Cards */}
          {renderOverviewCards()}

          {/* Macronutrients */}
          {renderMacronutrients()}

          {/* Detailed Analytics under Macronutrients (only for weekly/monthly) */}
          {selectedPeriod !== 'daily' && renderAnalyticsCharts()}

          {/* Health Remarks */}
          <HealthRemarks
            remarks={healthRemarks}
            progressStats={progressStats}
            period={selectedPeriod}
          />

          {/* More Details button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.moreDetailsButton}
              activeOpacity={0.9}
              onPress={() => router.push('/(dashboard)/progress-details')}
            >
              <Text style={styles.moreDetailsIcon}>📊</Text>
              <Text style={styles.moreDetailsText}>More Detailed Analytics</Text>
            </TouchableOpacity>
          </View>
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
          userInfo={userInfo}
          badges={userInfo?.badges || []}
        />

        <ProfilePage
          visible={showProfilePage}
          onClose={() => setShowProfilePage(false)}
          userInfo={userInfo}
          onUpdateUserInfo={handleUpdateUserInfo}
        />

        <NotificationModal
          visible={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
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
    paddingBottom: spacing.xl * 4, // Extra space so footer button stays above bottom navbar
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
    fontSize: 25,
    fontWeight: '600',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.xs,
    opacity: 0.9,
  },
  heroSubtitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
  },

  // Period Selector (Daily / Weekly / Monthly)
  periodSelectorContainer: {
    marginBottom: spacing.xl,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },
  periodButtonTextActive: {
    color: colors.white,
  },

  // Overview Section
  overviewSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.lg,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  overviewCard: {
    width: (screenWidth - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  cardTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    flex: 1,
  },
  cardContent: {
    gap: spacing.sm,
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calorieLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  calorieValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  progressText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: fonts.heading,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
  },

  // Macro Section
  macroSection: {
    marginBottom: spacing.xl,
  },
  macroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  macroChart: {
    gap: spacing.md,
  },
  macroItem: {
    gap: spacing.xs,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  macroColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  macroName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.heading,
    flex: 1,
  },
  macroValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  macroPercentage: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  macroBar: {
    height: 8,
    backgroundColor: colors.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Streak Section
  streakSection: {
    marginBottom: spacing.xl,
  },
  streakCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  streakItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  streakIcon: {
    fontSize: 32,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '900',
    fontFamily: fonts.heading,
  },
  streakLabel: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.cardBorder,
    marginHorizontal: spacing.md,
  },

  // Charts Section
  chartsSection: {
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },

  // Footer
  footer: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl * 1.5,
  },
  moreDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  moreDetailsIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  moreDetailsText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },
});
