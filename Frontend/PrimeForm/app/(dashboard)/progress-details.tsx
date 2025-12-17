import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, DeviceEventEmitter } from 'react-native';
import { useRouter } from 'expo-router';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import Sidebar from '../../src/components/Sidebar';
import ProfilePage from '../../src/components/ProfilePage';
import NotificationModal from '../../src/components/NotificationModal';
import { useAuthContext } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { useToast } from '../../src/context/ToastContext';
import { useNotifications } from '../../src/contexts/NotificationContext';
import { colors, spacing, fonts, typography, radius } from '../../src/theme/colors';
import ProgressChart, { ProgressChartData } from '../../src/components/ProgressChart';
import progressService from '../../src/services/progressService';
import userProfileService from '../../src/services/userProfileService';

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
  const { t, language, transliterateNumbers } = useLanguage();
  const { showToast } = useToast();
  const { unreadCount } = useNotifications();

  const [mode, setMode] = useState<'weekly' | 'monthly'>('weekly');
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false); // PERFORMANCE: Start with false - defer loading
  const [isLoadingCharts, setIsLoadingCharts] = useState(false); // PERFORMANCE: Separate loading state for charts
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [charts, setCharts] = useState<ProgressCharts | null>(null);
  const [chartsLoaded, setChartsLoaded] = useState(false); // PERFORMANCE: Track if charts have been loaded
  const timelineScrollRef = useRef<ScrollView>(null);
  const chartsSectionRef = useRef<View>(null); // PERFORMANCE: Ref for charts section
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // PERFORMANCE: Memoized per-period stats & charts (past periods become immutable snapshots)
  const [statsByPeriod, setStatsByPeriod] = useState<Record<string, ProgressStats>>({});
  const [chartsByPeriod, setChartsByPeriod] = useState<Record<string, ProgressCharts>>({});

  const periodKey = useMemo(() => {
    if (mode === 'weekly') {
      return selectedWeek != null ? `w:${selectedWeek}` : '';
    }
    return selectedMonth != null ? `m:${selectedMonth}` : '';
  }, [mode, selectedWeek, selectedMonth]);

  const isCurrentPeriod = useMemo(() => {
    if (mode === 'weekly' && selectedWeek && availableWeeks.length > 0) {
      return selectedWeek === availableWeeks[availableWeeks.length - 1];
    }
    if (mode === 'monthly' && selectedMonth && availableMonths.length > 0) {
      return selectedMonth === availableMonths[availableMonths.length - 1];
    }
    return false;
  }, [mode, selectedWeek, selectedMonth, availableWeeks, availableMonths]);

  // PERFORMANCE: Load available weeks/months only (uses cached data, no API calls)
  useEffect(() => {
    const init = async () => {
      try {
        // PERFORMANCE: These functions now use cached results - no API calls if cache exists
        const [weeks, months] = await Promise.all([
          progressService.getAvailableWeeks(false), // Use cache
          progressService.getAvailableMonths(false), // Use cache
        ]);
        setAvailableWeeks(weeks);
        setAvailableMonths(months);
        // Auto-select current period only if available
        if (weeks.length > 0 && mode === 'weekly') {
          setSelectedWeek(weeks[weeks.length - 1]);
        }
        if (months.length > 0 && mode === 'monthly') {
          setSelectedMonth(months[months.length - 1]);
        }
      } catch (error) {
        // Set defaults if loading fails
        setAvailableWeeks([1]);
        setAvailableMonths([1]);
        if (mode === 'weekly') setSelectedWeek(1);
        if (mode === 'monthly') setSelectedMonth(1);
      }
    };
    init();
  }, []); // Only run once on mount

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

  // Preload profile data once (prefer cache, fallback to API) to avoid spinner in ProfilePage
  useEffect(() => {
    if (profileLoaded || userInfo) return;

    const loadProfile = async () => {
      try {
        const cached = await userProfileService.getCachedData();
        if (cached?.data) {
          setUserInfo(cached.data);
          setProfileLoaded(true);
          return;
        }
        const resp = await userProfileService.getUserProfile();
        if (resp.success && resp.data) {
          setUserInfo(resp.data);
          setProfileLoaded(true);
        }
      } catch (error) {
        // swallow; ProfilePage handles empty state
      }
    };

    loadProfile();
  }, [profileLoaded, userInfo]);

  // Ensure profile data is loaded when opening ProfilePage from this screen (fallback)
  useEffect(() => {
    const loadProfileIfNeeded = async () => {
      if (!showProfilePage || userInfo || profileLoaded) return;
      try {
        const cached = await userProfileService.getCachedData();
        if (cached?.data) {
          setUserInfo(cached.data);
          setProfileLoaded(true);
          return;
        }
        const resp = await userProfileService.getUserProfile();
        if (resp.success && resp.data) {
          setUserInfo(resp.data);
          setProfileLoaded(true);
        }
      } catch (error) {
        // If loading fails, we leave userInfo null; ProfilePage will show an error state
      }
    };
    loadProfileIfNeeded();
  }, [showProfilePage, userInfo, profileLoaded]);

  // ✅ CRITICAL: Listen for real-time updates to refresh progress data
  useEffect(() => {
    const listeners = [
      DeviceEventEmitter.addListener('exerciseCompleted', () => {
        progressService.invalidateCaches();
        // Force refresh stats and charts for current period
        if (isCurrentPeriod) {
          const loadStats = async () => {
            try {
              setIsLoading(true);
              const period = mode;
              const statsResponse = await progressService.getProgressStats(
                period,
                mode === 'weekly' ? selectedWeek || undefined : undefined,
                mode === 'monthly' ? selectedMonth || undefined : undefined,
                true // Force refresh for real-time updates
              );
              if (statsResponse.success && statsResponse.data) {
                const nextStats = statsResponse.data as ProgressStats;
                setStats(nextStats);
                setStatsByPeriod(prev => ({
                  ...prev,
                  [periodKey]: nextStats,
                }));
              }
              // ✅ CRITICAL: Also refresh charts for real-time updates with force refresh
              if (chartsLoaded) {
                setChartsLoaded(false);
                // Force refresh charts to get latest data
                const refreshCharts = async () => {
                  try {
                    setIsLoadingCharts(true);
                    const period = mode;
                    const chartsResponse = await progressService.getChartData(
                      period,
                      mode === 'weekly' ? selectedWeek || undefined : undefined,
                      mode === 'monthly' ? selectedMonth || undefined : undefined,
                      true // ✅ CRITICAL: Force refresh for real-time updates
                    );
                    if (chartsResponse.success && chartsResponse.data) {
                      const nextCharts: ProgressCharts = {
                        calories: chartsResponse.data.calories,
                        workouts: chartsResponse.data.workouts,
                        water: chartsResponse.data.water,
                      };
                      setCharts(nextCharts);
                      setChartsByPeriod(prev => ({
                        ...prev,
                        [periodKey]: nextCharts,
                      }));
                      setChartsLoaded(true);
                    }
                  } catch (error) {
                    // Error loading charts
                  } finally {
                    setIsLoadingCharts(false);
                  }
                };
                refreshCharts();
              }
            } catch (error) {
              // Error loading stats
            } finally {
              setIsLoading(false);
            }
          };
          loadStats();
        }
      }),
      DeviceEventEmitter.addListener('mealCompleted', () => {
        progressService.invalidateCaches();
        // Force refresh stats and charts for current period
        if (isCurrentPeriod) {
          const loadStats = async () => {
            try {
              setIsLoading(true);
              const period = mode;
              const statsResponse = await progressService.getProgressStats(
                period,
                mode === 'weekly' ? selectedWeek || undefined : undefined,
                mode === 'monthly' ? selectedMonth || undefined : undefined,
                true // Force refresh for real-time updates
              );
              if (statsResponse.success && statsResponse.data) {
                const nextStats = statsResponse.data as ProgressStats;
                setStats(nextStats);
                setStatsByPeriod(prev => ({
                  ...prev,
                  [periodKey]: nextStats,
                }));
              }
              // ✅ CRITICAL: Also refresh charts for real-time updates with force refresh
              if (chartsLoaded) {
                setChartsLoaded(false);
                // Force refresh charts to get latest data
                const refreshCharts = async () => {
                  try {
                    setIsLoadingCharts(true);
                    const period = mode;
                    const chartsResponse = await progressService.getChartData(
                      period,
                      mode === 'weekly' ? selectedWeek || undefined : undefined,
                      mode === 'monthly' ? selectedMonth || undefined : undefined,
                      true // ✅ CRITICAL: Force refresh for real-time updates
                    );
                    if (chartsResponse.success && chartsResponse.data) {
                      const nextCharts: ProgressCharts = {
                        calories: chartsResponse.data.calories,
                        workouts: chartsResponse.data.workouts,
                        water: chartsResponse.data.water,
                      };
                      setCharts(nextCharts);
                      setChartsByPeriod(prev => ({
                        ...prev,
                        [periodKey]: nextCharts,
                      }));
                      setChartsLoaded(true);
                    }
                  } catch (error) {
                    // Error loading charts
                  } finally {
                    setIsLoadingCharts(false);
                  }
                };
                refreshCharts();
              }
            } catch (error) {
              // Error loading stats
            } finally {
              setIsLoading(false);
            }
          };
          loadStats();
        }
      }),
      DeviceEventEmitter.addListener('waterIntakeUpdated', () => {
        progressService.invalidateCaches();
        // Force refresh stats and charts for current period
        if (isCurrentPeriod) {
          const loadStats = async () => {
            try {
              setIsLoading(true);
              const period = mode;
              const statsResponse = await progressService.getProgressStats(
                period,
                mode === 'weekly' ? selectedWeek || undefined : undefined,
                mode === 'monthly' ? selectedMonth || undefined : undefined,
                true // Force refresh for real-time updates
              );
              if (statsResponse.success && statsResponse.data) {
                const nextStats = statsResponse.data as ProgressStats;
                setStats(nextStats);
                setStatsByPeriod(prev => ({
                  ...prev,
                  [periodKey]: nextStats,
                }));
              }
              // ✅ CRITICAL: Also refresh charts for real-time updates with force refresh
              if (chartsLoaded) {
                setChartsLoaded(false);
                // Force refresh charts to get latest data
                const refreshCharts = async () => {
                  try {
                    setIsLoadingCharts(true);
                    const period = mode;
                    const chartsResponse = await progressService.getChartData(
                      period,
                      mode === 'weekly' ? selectedWeek || undefined : undefined,
                      mode === 'monthly' ? selectedMonth || undefined : undefined,
                      true // ✅ CRITICAL: Force refresh for real-time updates
                    );
                    if (chartsResponse.success && chartsResponse.data) {
                      const nextCharts: ProgressCharts = {
                        calories: chartsResponse.data.calories,
                        workouts: chartsResponse.data.workouts,
                        water: chartsResponse.data.water,
                      };
                      setCharts(nextCharts);
                      setChartsByPeriod(prev => ({
                        ...prev,
                        [periodKey]: nextCharts,
                      }));
                      setChartsLoaded(true);
                    }
                  } catch (error) {
                    // Error loading charts
                  } finally {
                    setIsLoadingCharts(false);
                  }
                };
                refreshCharts();
              }
            } catch (error) {
              // Error loading stats
            } finally {
              setIsLoading(false);
            }
          };
          loadStats();
        }
      }),
      DeviceEventEmitter.addListener('dietProgressUpdated', () => {
        progressService.invalidateCaches();
        // Force refresh stats and charts for current period
        if (isCurrentPeriod) {
          const loadStats = async () => {
            try {
              setIsLoading(true);
              const period = mode;
              const statsResponse = await progressService.getProgressStats(
                period,
                mode === 'weekly' ? selectedWeek || undefined : undefined,
                mode === 'monthly' ? selectedMonth || undefined : undefined,
                true // Force refresh for real-time updates
              );
              if (statsResponse.success && statsResponse.data) {
                const nextStats = statsResponse.data as ProgressStats;
                setStats(nextStats);
                setStatsByPeriod(prev => ({
                  ...prev,
                  [periodKey]: nextStats,
                }));
              }
              // ✅ CRITICAL: Also refresh charts for real-time updates with force refresh
              if (chartsLoaded) {
                setChartsLoaded(false);
                // Force refresh charts to get latest data
                const refreshCharts = async () => {
                  try {
                    setIsLoadingCharts(true);
                    const period = mode;
                    const chartsResponse = await progressService.getChartData(
                      period,
                      mode === 'weekly' ? selectedWeek || undefined : undefined,
                      mode === 'monthly' ? selectedMonth || undefined : undefined,
                      true // ✅ CRITICAL: Force refresh for real-time updates
                    );
                    if (chartsResponse.success && chartsResponse.data) {
                      const nextCharts: ProgressCharts = {
                        calories: chartsResponse.data.calories,
                        workouts: chartsResponse.data.workouts,
                        water: chartsResponse.data.water,
                      };
                      setCharts(nextCharts);
                      setChartsByPeriod(prev => ({
                        ...prev,
                        [periodKey]: nextCharts,
                      }));
                      setChartsLoaded(true);
                    }
                  } catch (error) {
                    // Error loading charts
                  } finally {
                    setIsLoadingCharts(false);
                  }
                };
                refreshCharts();
              }
            } catch (error) {
              // Error loading stats
            } finally {
              setIsLoading(false);
            }
          };
          loadStats();
        }
      }),
      DeviceEventEmitter.addListener('workoutProgressUpdated', () => {
        progressService.invalidateCaches();
        // Force refresh stats and charts for current period
        if (isCurrentPeriod) {
          const loadStats = async () => {
            try {
              setIsLoading(true);
              const period = mode;
              const statsResponse = await progressService.getProgressStats(
                period,
                mode === 'weekly' ? selectedWeek || undefined : undefined,
                mode === 'monthly' ? selectedMonth || undefined : undefined,
                true // Force refresh for real-time updates
              );
              if (statsResponse.success && statsResponse.data) {
                const nextStats = statsResponse.data as ProgressStats;
                setStats(nextStats);
                setStatsByPeriod(prev => ({
                  ...prev,
                  [periodKey]: nextStats,
                }));
              }
              // ✅ CRITICAL: Also refresh charts for real-time updates with force refresh
              if (chartsLoaded) {
                setChartsLoaded(false);
                // Force refresh charts to get latest data
                const refreshCharts = async () => {
                  try {
                    setIsLoadingCharts(true);
                    const period = mode;
                    const chartsResponse = await progressService.getChartData(
                      period,
                      mode === 'weekly' ? selectedWeek || undefined : undefined,
                      mode === 'monthly' ? selectedMonth || undefined : undefined,
                      true // ✅ CRITICAL: Force refresh for real-time updates
                    );
                    if (chartsResponse.success && chartsResponse.data) {
                      const nextCharts: ProgressCharts = {
                        calories: chartsResponse.data.calories,
                        workouts: chartsResponse.data.workouts,
                        water: chartsResponse.data.water,
                      };
                      setCharts(nextCharts);
                      setChartsByPeriod(prev => ({
                        ...prev,
                        [periodKey]: nextCharts,
                      }));
                      setChartsLoaded(true);
                    }
                  } catch (error) {
                    // Error loading charts
                  } finally {
                    setIsLoadingCharts(false);
                  }
                };
                refreshCharts();
              }
            } catch (error) {
              // Error loading stats
            } finally {
              setIsLoading(false);
            }
          };
          loadStats();
        }
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
  }, [mode, selectedWeek, selectedMonth, periodKey, isCurrentPeriod]);

  // PERFORMANCE: Load stats only when period is selected (deferred loading)
  useEffect(() => {
    const loadStats = async () => {
      if (mode === 'weekly' && !selectedWeek) return;
      if (mode === 'monthly' && !selectedMonth) return;
      if (!periodKey) return;

      // PERFORMANCE: For past periods, use memoized snapshot and skip recomputation / DB calls
      if (!isCurrentPeriod && statsByPeriod[periodKey]) {
        setStats(statsByPeriod[periodKey]);
        return;
      }
      
      try {
        setIsLoading(true);
        const period = mode;
        
        // PERFORMANCE: Load stats (uses cached data if available)
        const statsResponse = await progressService.getProgressStats(
          period,
          mode === 'weekly' ? selectedWeek || undefined : undefined,
          mode === 'monthly' ? selectedMonth || undefined : undefined,
          false // Use cached data for performance
        );
        if (statsResponse.success && statsResponse.data) {
          const nextStats = statsResponse.data as ProgressStats;
          setStats(nextStats);
          // Memoize snapshot keyed by period (both current and past); current can be refreshed on next call
          setStatsByPeriod(prev => ({
            ...prev,
            [periodKey]: nextStats,
          }));
        }
      } catch (error) {
        // Error loading stats
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
    // PERFORMANCE: Reset charts loaded flag when period changes
    setChartsLoaded(false);
    setCharts(null);
  }, [mode, selectedWeek, selectedMonth, periodKey, isCurrentPeriod]);

  // PERFORMANCE: Lazy load charts - only load when user scrolls near charts section or explicitly requests
  const loadCharts = useCallback(async () => {
    if (chartsLoaded) return; // Already loaded
    
    if (mode === 'weekly' && !selectedWeek) return;
    if (mode === 'monthly' && !selectedMonth) return;
    if (!periodKey) return;

    // PERFORMANCE: For past periods, reuse memoized charts and skip service call
    if (!isCurrentPeriod && chartsByPeriod[periodKey]) {
      setCharts(chartsByPeriod[periodKey]);
      setChartsLoaded(true);
      return;
    }
    
    try {
      setIsLoadingCharts(true);
      const period = mode;
      
      // PERFORMANCE: Load charts (uses cached data if available)
      const chartsResponse = await progressService.getChartData(
        period,
        mode === 'weekly' ? selectedWeek || undefined : undefined,
        mode === 'monthly' ? selectedMonth || undefined : undefined,
        false // Use cached data for performance
      );
      if (chartsResponse.success && chartsResponse.data) {
        const nextCharts: ProgressCharts = {
          calories: chartsResponse.data.calories,
          workouts: chartsResponse.data.workouts,
          water: chartsResponse.data.water,
        };
        setCharts(nextCharts);
        setChartsByPeriod(prev => ({
          ...prev,
          [periodKey]: nextCharts,
        }));
        setChartsLoaded(true);
      }
    } catch (error) {
      // Error loading charts
    } finally {
      setIsLoadingCharts(false);
    }
  }, [mode, selectedWeek, selectedMonth, chartsLoaded, periodKey, isCurrentPeriod]);

  const currentPeriodLabel =
    mode === 'weekly'
      ? selectedWeek
        ? `${t('progress.details.timeline.week')} ${language === 'ur' ? transliterateNumbers(selectedWeek) : selectedWeek}`
        : t('progress.details.timeline.week')
      : selectedMonth
        ? `${t('progress.details.timeline.month')} ${language === 'ur' ? transliterateNumbers(selectedMonth) : selectedMonth}`
        : t('progress.details.timeline.month');

  const overallCompletion = useMemo(() => {
    if (!stats) return 0;
    const workoutCompletion = stats.totalWorkouts > 0 ? stats.workoutsCompleted / stats.totalWorkouts : 0;
    const mealCompletion = stats.totalMeals > 0 ? stats.mealsCompleted / stats.totalMeals : 0;
    const hydrationRatio = stats.targetWater > 0 ? stats.waterIntake / stats.targetWater : 0;
    return Math.round(((workoutCompletion + mealCompletion + hydrationRatio) / 3) * 100);
  }, [stats]);

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
    } else if (tab === 'progress') {
      // Navigate back to main progress page
      router.push('/(dashboard)/progress');
    }
  };

  const metricPercentages = stats
    ? {
        calories:
          stats.targetCalories > 0
            ? Math.min(100, Math.round((stats.caloriesConsumed / stats.targetCalories) * 100))
            : 0,
        water:
          stats.targetWater > 0
            ? Math.min(100, Math.round((stats.waterIntake / stats.targetWater) * 100))
            : 0,
        workouts:
          stats.totalWorkouts > 0
            ? Math.min(100, Math.round((stats.workoutsCompleted / stats.totalWorkouts) * 100))
            : 0,
        meals:
          stats.totalMeals > 0
            ? Math.min(100, Math.round((stats.mealsCompleted / stats.totalMeals) * 100))
            : 0,
      }
    : {
        calories: 0,
        water: 0,
        workouts: 0,
        meals: 0,
      };

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
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>{t('progress.details.hero.title')}</Text>
            <Text style={styles.heroSubtitle}>
              {t('progress.details.hero.subtitle')}
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
                  {t(`progress.details.mode.${value}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Period selector */}
          <View style={styles.timelineSection}>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineTitle}>
                {mode === 'weekly' ? t('progress.details.timeline.select.week') : t('progress.details.timeline.select.month')}
              </Text>
              <Text style={styles.timelineSubtitle}>{currentPeriodLabel}</Text>
            </View>

            {isLoading && (mode === 'weekly' ? availableWeeks.length === 0 : availableMonths.length === 0) ? (
              <View style={styles.timelineLoading}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.timelineLoadingText}>
                  {mode === 'weekly' ? t('progress.details.loading.weeks') : t('progress.details.loading.months')}
                </Text>
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
                      {mode === 'weekly' ? t('progress.details.empty.weeks') : t('progress.details.empty.months')}
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
                        {isCurrent && <Text style={styles.timelineNowBadge}>{t('progress.details.timeline.now')}</Text>}
                        <Text style={styles.timelineValue}>
                          {mode === 'weekly' ? `${t('progress.details.timeline.week').charAt(0).toUpperCase()}${language === 'ur' ? transliterateNumbers(value) : value}` : `${t('progress.details.timeline.month').charAt(0).toUpperCase()}${language === 'ur' ? transliterateNumbers(value) : value}`}
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
            <Text style={styles.summaryTitle}>
              {t('progress.details.summary.title').replace('{period}', currentPeriodLabel)}
            </Text>
            {isLoading || !stats ? (
              <View style={styles.summaryLoading}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <>
                {/* Metric grid - 2 cards per row */}
                <View style={styles.metricGrid}>
                  {/* Row 1: Calories & Water */}
                  <View style={styles.metricRow}>
                    {/* Calories */}
                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>{t('progress.details.metric.calories')}</Text>
                      <Text style={styles.metricValue}>
                        {language === 'ur' ? transliterateNumbers(Math.round(stats.caloriesConsumed)) : Math.round(stats.caloriesConsumed)}/{language === 'ur' ? transliterateNumbers(Math.round(stats.targetCalories)) : Math.round(stats.targetCalories)} {t('dashboard.stats.kcal')}
                      </Text>
                      <Text style={styles.metricSubLabel}>
                        {metricPercentages.calories}% {t('progress.details.metric.of.target')}
                      </Text>
                      <View style={styles.metricBar}>
                        <View
                          style={[
                            styles.metricBarFill,
                            { width: `${metricPercentages.calories}%`, backgroundColor: colors.primary },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Water */}
                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>{t('progress.details.metric.water')}</Text>
                      <Text style={styles.metricValue}>
                        {language === 'ur' ? transliterateNumbers(parseFloat(stats.waterIntake.toFixed(1))) : stats.waterIntake.toFixed(1)}/{language === 'ur' ? transliterateNumbers(parseFloat(stats.targetWater.toFixed(1))) : stats.targetWater.toFixed(1)} L
                      </Text>
                      <Text style={styles.metricSubLabel}>
                        {metricPercentages.water}% {t('progress.details.metric.of.target')}
                      </Text>
                      <View style={styles.metricBar}>
                        <View
                          style={[
                            styles.metricBarFill,
                            { width: `${metricPercentages.water}%`, backgroundColor: colors.blue },
                          ]}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Row 2: Workouts & Meals */}
                  <View style={styles.metricRow}>
                    {/* Workouts */}
                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>{t('progress.details.metric.workouts')}</Text>
                      <Text style={styles.metricValue}>
                        {language === 'ur' ? transliterateNumbers(stats.workoutsCompleted) : stats.workoutsCompleted}/{language === 'ur' ? transliterateNumbers(stats.totalWorkouts) : stats.totalWorkouts}
                      </Text>
                      <Text style={styles.metricSubLabel}>
                        {metricPercentages.workouts}% {t('progress.details.metric.complete')}
                      </Text>
                      <View style={styles.metricBar}>
                        <View
                          style={[
                            styles.metricBarFill,
                            { width: `${metricPercentages.workouts}%`, backgroundColor: colors.gold },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Meals */}
                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>{t('progress.details.metric.meals')}</Text>
                      <Text style={styles.metricValue}>
                        {language === 'ur' ? transliterateNumbers(stats.mealsCompleted) : stats.mealsCompleted}/{language === 'ur' ? transliterateNumbers(stats.totalMeals) : stats.totalMeals}
                      </Text>
                      <Text style={styles.metricSubLabel}>
                        {metricPercentages.meals}% {t('progress.details.metric.complete')}
                      </Text>
                      <View style={styles.metricBar}>
                        <View
                          style={[
                            styles.metricBarFill,
                            { width: `${metricPercentages.meals}%`, backgroundColor: colors.green },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Overall completion */}
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
                    {t('progress.details.summary.overall')} {overallCompletion}%
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Charts Section - PERFORMANCE: Lazy loaded */}
          <View
            ref={chartsSectionRef}
            style={styles.chartsSection}
            onLayout={() => {
              // PERFORMANCE: Load charts when section comes into view
              if (!chartsLoaded && (selectedWeek || selectedMonth)) {
                loadCharts();
              }
            }}
          >
            {isLoadingCharts ? (
              <View style={styles.chartsLoading}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.chartsLoadingText}>{t('progress.details.loading.charts')}</Text>
              </View>
            ) : charts ? (
              <>
                <ProgressChart
                  title={t('progress.chart.calories')}
                  data={charts.calories}
                  type="line"
                  period={mode}
                />
                <ProgressChart
                  title={t('progress.chart.workouts')}
                  data={charts.workouts}
                  type="bar"
                  period={mode}
                />
                <ProgressChart
                  title={t('progress.chart.water')}
                  data={charts.water}
                  type="bar"
                  period={mode}
                />
              </>
            ) : (
              <View style={styles.chartsPlaceholder}>
                <Text style={styles.chartsPlaceholderText}>
                  {t('progress.details.charts.placeholder')}
                </Text>
              </View>
            )}
          </View>
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
    paddingBottom: spacing.xl * 4, // Extra padding to ensure water hydration card is fully visible
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
    textAlign: 'center',
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

  // Metric grid
  metricGrid: {
    marginBottom: spacing.lg,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 130,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'space-between',
  },
  metricLabel: {
    color: colors.mutedText,
    fontSize: 13,
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  metricValue: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  metricSubLabel: {
    color: colors.mutedText,
    fontSize: 11,
    fontFamily: fonts.body,
    marginBottom: spacing.sm,
    fontWeight: '400',
  },
  metricBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cardBorder,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  chartsSection: {
    marginBottom: spacing.xl,
    gap: spacing.lg,
    minHeight: 200,
  },
  chartsLoading: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  chartsLoadingText: {
    color: colors.mutedText,
    fontSize: typography.body,
    marginTop: spacing.md,
    fontFamily: fonts.body,
  },
  chartsPlaceholder: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  chartsPlaceholderText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
});


