import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import DashboardHeader from '../../src/components/DashboardHeader';
import { useAuthContext } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { colors, spacing, fonts, typography, radius } from '../../src/theme/colors';
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
  targetProtein: number;
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

export default function ProgressDetailsScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'weekly' | 'monthly'>('weekly');
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [charts, setCharts] = useState<ProgressCharts | null>(null);
  const timelineScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const [weeks, months] = await Promise.all([
          progressService.getAvailableWeeks(),
          progressService.getAvailableMonths(),
        ]);
        setAvailableWeeks(weeks);
        setAvailableMonths(months);
        if (weeks.length > 0) setSelectedWeek(weeks[weeks.length - 1]);
        if (months.length > 0) setSelectedMonth(months[months.length - 1]);
      } catch (error) {
        console.error('Error loading available periods:', error);
        // Set defaults if loading fails
        setAvailableWeeks([1]);
        setAvailableMonths([1]);
        setSelectedWeek(1);
        setSelectedMonth(1);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Auto-select current period when switching modes and reset scroll position
  useEffect(() => {
    // Reset horizontal scroll position when switching modes
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollTo({ x: 0, animated: false });
    }
    
    if (mode === 'weekly' && availableWeeks.length > 0 && !selectedWeek) {
      setSelectedWeek(availableWeeks[availableWeeks.length - 1]);
    }
    if (mode === 'monthly' && availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [mode, availableWeeks, availableMonths]);

  useEffect(() => {
    const loadDetails = async () => {
      if (mode === 'weekly' && !selectedWeek) return;
      if (mode === 'monthly' && !selectedMonth) return;
      try {
        setIsLoading(true);
        const period = mode;
        
        // Load stats for the selected week/month - ensures exact data
        const statsResponse = await progressService.getProgressStats(
          period,
          mode === 'weekly' ? selectedWeek || undefined : undefined,
          mode === 'monthly' ? selectedMonth || undefined : undefined,
          false // Use cached data for performance, but ensure it's synced
        );
        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data as ProgressStats);
        } else {
          console.warn('Failed to load stats:', statsResponse.message);
        }

        // Load chart data showing trend leading up to selected week/month
        const chartsResponse = await progressService.getChartData(
          period,
          mode === 'weekly' ? selectedWeek || undefined : undefined,
          mode === 'monthly' ? selectedMonth || undefined : undefined,
          false // Use cached data for performance
        );
        if (chartsResponse.success && chartsResponse.data) {
          setCharts({
            calories: chartsResponse.data.calories,
            workouts: chartsResponse.data.workouts,
            water: chartsResponse.data.water,
          });
        } else {
          console.warn('Failed to load charts:', chartsResponse.message);
          setCharts(null);
        }
      } catch (error) {
        console.error('Error loading progress details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDetails();
  }, [mode, selectedWeek, selectedMonth]);

  const currentPeriodLabel =
    mode === 'weekly'
      ? selectedWeek
        ? `Week ${selectedWeek}`
        : 'Week'
      : selectedMonth
        ? `Month ${selectedMonth}`
        : 'Month';

  const overallCompletion = (() => {
    if (!stats) return 0;
    const workoutCompletion = stats.totalWorkouts > 0 ? stats.workoutsCompleted / stats.totalWorkouts : 0;
    const mealCompletion = stats.totalMeals > 0 ? stats.mealsCompleted / stats.totalMeals : 0;
    const hydrationRatio = stats.targetWater > 0 ? stats.waterIntake / stats.targetWater : 0;
    return Math.round(((workoutCompletion + mealCompletion + hydrationRatio) / 3) * 100);
  })();

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        <DashboardHeader
          userName={user?.fullName || t('common.user')}
          onProfilePress={() => {}}
          onNotificationPress={() => {}}
          notificationCount={0}
        />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Detailed Progress</Text>
            <Text style={styles.heroSubtitle}>
              Explore your weekly and monthly analytics
            </Text>
          </View>

          {/* Mode selector */}
          <View style={styles.modeSelector}>
            {(['weekly', 'monthly'] as const).map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.modeButton,
                  mode === value && styles.modeButtonActive,
                ]}
                onPress={() => setMode(value)}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === value && styles.modeButtonTextActive,
                  ]}
                >
                  {value === 'weekly' ? 'Weekly' : 'Monthly'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Period selector */}
          <View style={styles.timelineSection}>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineTitle}>
                {mode === 'weekly' ? 'Select Week' : 'Select Month'}
              </Text>
              <Text style={styles.timelineSubtitle}>{currentPeriodLabel}</Text>
            </View>

            {isLoading && (mode === 'weekly' ? availableWeeks.length === 0 : availableMonths.length === 0) ? (
              <View style={styles.timelineLoading}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.timelineLoadingText}>Loading {mode === 'weekly' ? 'weeks' : 'months'}...</Text>
              </View>
            ) : (
              <ScrollView
                ref={timelineScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timelineScrollContent}
                style={styles.timelineScrollView}
                key={mode} // Force re-render when mode changes to reset scroll
              >
                {(mode === 'weekly' ? availableWeeks : availableMonths).length === 0 ? (
                  <View style={styles.timelineEmpty}>
                    <Text style={styles.timelineEmptyText}>
                      No {mode === 'weekly' ? 'weeks' : 'months'} available yet
                    </Text>
                  </View>
                ) : (
                  (mode === 'weekly' ? availableWeeks : availableMonths).map((value) => {
                    const isSelected =
                      mode === 'weekly'
                        ? selectedWeek === value
                        : selectedMonth === value;
                    const isCurrent =
                      mode === 'weekly'
                        ? value === availableWeeks[availableWeeks.length - 1]
                        : value === availableMonths[availableMonths.length - 1];

                    return (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.timelineCard,
                          isSelected && styles.timelineCardSelected,
                        ]}
                        onPress={() =>
                          mode === 'weekly'
                            ? setSelectedWeek(value)
                            : setSelectedMonth(value)
                        }
                        activeOpacity={0.9}
                      >
                        {isCurrent && <Text style={styles.timelineNowBadge}>NOW</Text>}
                        <Text style={styles.timelineValue}>
                          {mode === 'weekly' ? `W${value}` : `M${value}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>

          {/* Summary card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{currentPeriodLabel} Summary</Text>
            {isLoading || !stats ? (
              <View style={styles.summaryLoading}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Calories</Text>
                    <Text style={styles.summaryValue}>
                      {Math.round(stats.caloriesConsumed)}/{Math.round(stats.targetCalories)} kcal
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Water</Text>
                    <Text style={styles.summaryValue}>
                      {stats.waterIntake.toFixed(1)}/{stats.targetWater.toFixed(1)} L
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Workouts</Text>
                    <Text style={styles.summaryValue}>
                      {stats.workoutsCompleted}/{stats.totalWorkouts}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Meals</Text>
                    <Text style={styles.summaryValue}>
                      {stats.mealsCompleted}/{stats.totalMeals}
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryProgressWrapper}>
                  <View style={styles.summaryProgressBar}>
                    <View
                      style={[
                        styles.summaryProgressFill,
                        { width: `${overallCompletion}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.summaryProgressText}>
                    Overall completion {overallCompletion}%
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Charts */}
          {charts && (
            <View style={styles.chartsSection}>
              <ProgressChart
                title="Calories Trend"
                data={charts.calories}
                type="line"
                period={mode}
              />
              <ProgressChart
                title="Workout Performance"
                data={charts.workouts}
                type="bar"
                period={mode}
              />
              <ProgressChart
                title="Water Hydration"
                data={charts.water}
                type="bar"
                period={mode}
              />
            </View>
          )}

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </ScrollView>
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
    paddingBottom: spacing.xl * 2,
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
  // Mode selector
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeButtonText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },
  modeButtonTextActive: {
    color: colors.white,
  },

  // Timeline
  timelineSection: {
    marginBottom: spacing.xl,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timelineTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  timelineSubtitle: {
    color: colors.mutedText,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  timelineScrollView: {
    minHeight: 80,
  },
  timelineScrollContent: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  timelineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  timelineLoadingText: {
    color: colors.mutedText,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  timelineEmpty: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  timelineEmptyText: {
    color: colors.mutedText,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  timelineCard: {
    width: screenWidth / 4.5,
    height: 70,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  timelineCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timelineValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: fonts.heading,
  },
  timelineNowBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    color: colors.background,
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 9,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },

  // Summary
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontFamily: fonts.body,
    marginBottom: 2,
  },
  summaryValue: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  summaryProgressWrapper: {
    marginTop: spacing.md,
  },
  summaryProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cardBorder,
    overflow: 'hidden',
  },
  summaryProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  summaryProgressText: {
    marginTop: spacing.xs,
    color: colors.mutedText,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  summaryLoading: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },

  chartsSection: {
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  backButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },
});


