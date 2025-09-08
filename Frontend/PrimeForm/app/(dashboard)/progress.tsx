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
import Animated, { FadeInUp, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { useToast } from '../../src/context/ToastContext';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import Sidebar from '../../src/components/Sidebar';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import ProgressChart from '../../src/components/ProgressChart';
import HealthRemarks from '../../src/components/HealthRemarks';
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
  workoutsCompleted: number;
  totalWorkouts: number;
  mealsCompleted: number;
  totalMeals: number;
  currentStreak: number;
  longestStreak: number;
  weightProgress: number;
  bodyFatProgress: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color: string;
    strokeWidth: number;
  }[];
}

export default function ProgressScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuthContext();
  const { showToast } = useToast();
  
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [chartData, setChartData] = useState<{
    calories: ChartData;
    macros: ChartData;
    workouts: ChartData;
    water: ChartData;
  } | null>(null);
  const [healthRemarks, setHealthRemarks] = useState<string[]>([]);

  useEffect(() => {
    loadProgressData();
  }, [selectedPeriod, selectedWeek, selectedMonth]);

  const loadProgressData = async () => {
    try {
      setIsLoading(true);
      
      // Load available weeks and months
      const weeks = await progressService.getAvailableWeeks();
      const months = await progressService.getAvailableMonths();
      setAvailableWeeks(weeks);
      setAvailableMonths(months);
      
      // Set default selections if not already set
      if (selectedPeriod === 'weekly' && !selectedWeek && weeks.length > 0) {
        setSelectedWeek(weeks[weeks.length - 1]); // Current week
      }
      if (selectedPeriod === 'monthly' && !selectedMonth && months.length > 0) {
        setSelectedMonth(months[months.length - 1]); // Current month
      }
      
      // Load progress statistics with period filters
      const statsResponse = await progressService.getProgressStats(
        selectedPeriod, 
        selectedPeriod === 'weekly' ? selectedWeek || weeks[weeks.length - 1] : undefined,
        selectedPeriod === 'monthly' ? selectedMonth || months[months.length - 1] : undefined
      );
      if (statsResponse.success && statsResponse.data) {
        setProgressStats(statsResponse.data);
      }

      // Load chart data
      const chartResponse = await progressService.getChartData(selectedPeriod);
      if (chartResponse.success && chartResponse.data) {
        setChartData(chartResponse.data);
      }

      // Load health remarks
      const remarksResponse = await progressService.getHealthRemarks();
      if (remarksResponse.success && remarksResponse.data) {
        setHealthRemarks(remarksResponse.data);
      }

    } catch (error) {
      console.error('Failed to load progress data:', error);
      showToast('error', 'Failed to load progress data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePress = () => {
    setSidebarVisible(true);
  };

  const handleSidebarMenuPress = async (action: string) => {
    switch (action) {
      case 'profile':
        router.push('/(dashboard)');
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
    }
    // Already on progress page
  };

  const renderPeriodSelector = () => (
    <Animated.View entering={FadeInUp.delay(200)} style={styles.periodSelectorContainer}>
      {/* Main Period Selector */}
      <View style={styles.periodSelector}>
        {(['daily', 'weekly', 'monthly'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive
            ]}
            onPress={() => {
              setSelectedPeriod(period);
              // Reset sub-selections when changing period
              if (period !== 'weekly') setSelectedWeek(null);
              if (period !== 'monthly') setSelectedMonth(null);
            }}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive
            ]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sub-Period Selector for Weekly */}
      {selectedPeriod === 'weekly' && availableWeeks.length > 1 && (
        <View style={styles.subPeriodSelector}>
          <Text style={styles.subPeriodLabel}>Week:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subPeriodScroll}>
            {availableWeeks.map((week) => (
              <TouchableOpacity
                key={week}
                style={[
                  styles.subPeriodButton,
                  selectedWeek === week && styles.subPeriodButtonActive
                ]}
                onPress={() => setSelectedWeek(week)}
              >
                <Text style={[
                  styles.subPeriodButtonText,
                  selectedWeek === week && styles.subPeriodButtonTextActive
                ]}>
                  {week}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Sub-Period Selector for Monthly */}
      {selectedPeriod === 'monthly' && availableMonths.length > 1 && (
        <View style={styles.subPeriodSelector}>
          <Text style={styles.subPeriodLabel}>Month:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subPeriodScroll}>
            {availableMonths.map((month) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.subPeriodButton,
                  selectedMonth === month && styles.subPeriodButtonActive
                ]}
                onPress={() => setSelectedMonth(month)}
              >
                <Text style={[
                  styles.subPeriodButtonText,
                  selectedMonth === month && styles.subPeriodButtonTextActive
                ]}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </Animated.View>
  );

  const renderOverviewCards = () => {
    if (!progressStats) return null;

    const cards = [
      {
        title: 'Calories Balance',
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
                      {card.consumed}/{card.target} {card.unit}
                    </Text>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${Math.min((card.consumed! / card.target!) * 100, 100)}%`,
                            backgroundColor: card.color 
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.percentageText}>
                      {Math.round(Math.min((card.consumed! / card.target!) * 100, 100))}% of Goal
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

    const totalMacros = progressStats.protein + progressStats.carbs + progressStats.fats;
    const macros = [
      { name: 'Protein', value: progressStats.protein, color: colors.primary, percentage: (progressStats.protein / totalMacros) * 100 },
      { name: 'Carbs', value: progressStats.carbs, color: colors.gold, percentage: (progressStats.carbs / totalMacros) * 100 },
      { name: 'Fats', value: progressStats.fats, color: colors.green, percentage: (progressStats.fats / totalMacros) * 100 }
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
                <Text style={styles.macroValue}>{macro.value}g</Text>
                <Text style={styles.macroPercentage}>{macro.percentage.toFixed(1)}%</Text>
                <View style={styles.macroBar}>
                  <View 
                    style={[
                      styles.macroBarFill, 
                      { 
                        width: `${macro.percentage}%`,
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

  const renderCharts = () => {
    if (!chartData) return null;

    return (
      <Animated.View entering={FadeInUp.delay(800)} style={styles.chartsSection}>
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
          title="Hydration Tracking"
          data={chartData.water}
          type="area"
          period={selectedPeriod}
        />
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
            <Text style={styles.heroTitle}>Your Progress</Text>
            <Text style={styles.heroSubtitle}>Track your fitness journey</Text>
          </Animated.View>

          {/* Period Selector */}
          {renderPeriodSelector()}

          {/* Overview Cards */}
          {renderOverviewCards()}

          {/* Macronutrients */}
          {renderMacronutrients()}

          {/* Charts */}
          {renderCharts()}

          {/* Health Remarks */}
          <HealthRemarks 
            remarks={healthRemarks}
            progressStats={progressStats}
            period={selectedPeriod}
          />

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
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
  },

  // Period Selector
  periodSelectorContainer: {
    marginBottom: spacing.xl,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xs,
    marginBottom: spacing.md,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subPeriodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface + '80',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  subPeriodLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginRight: spacing.sm,
    minWidth: 50,
  },
  subPeriodScroll: {
    flex: 1,
  },
  subPeriodButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.cardBorder + '30',
    minWidth: 35,
    alignItems: 'center',
  },
  subPeriodButtonActive: {
    backgroundColor: colors.primary,
  },
  subPeriodButtonText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  subPeriodButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
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

  // Bottom Spacing
  bottomSpacing: {
    height: 100,
  },
});
