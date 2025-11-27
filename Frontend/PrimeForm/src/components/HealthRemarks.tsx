import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { colors, spacing, fonts, radius } from '../theme/colors';

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

interface HealthRemarksProps {
  remarks: string[];
  progressStats: ProgressStats | null;
  period: 'daily' | 'weekly' | 'monthly';
}

interface HealthInsight {
  category: 'excellent' | 'good' | 'warning' | 'critical';
  title: string;
  message: string;
  recommendation: string;
  icon: string;
  color: string;
}

export default function HealthRemarks({ remarks, progressStats, period }: HealthRemarksProps) {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  const generateHealthInsights = (): HealthInsight[] => {
    if (!progressStats) return [];

    const insights: HealthInsight[] = [];

    // Adaptive Calorie Balance Analysis
    const calorieBalance = progressStats.caloriesConsumed - progressStats.caloriesBurned;
    const calorieRatio = progressStats.caloriesConsumed / progressStats.targetCalories;
    const netCalorieBalance = Math.abs(calorieBalance);

    if (calorieRatio > 1.3) {
      insights.push({
        category: 'critical',
        title: 'Significant Calorie Surplus',
        message: `You're consuming ${Math.round((calorieRatio - 1) * 100)}% excess calories. This may slow your progress.`,
        recommendation: 'Immediate action needed: Reduce portion sizes by 20% and add 15 minutes of cardio daily.',
        icon: '🚨',
        color: colors.error
      });
    } else if (calorieRatio > 1.15) {
      insights.push({
        category: 'warning',
        title: 'Moderate Calorie Surplus',
        message: `You're ${Math.round((calorieRatio - 1) * 100)}% above your calorie target.`,
        recommendation: 'Fine-tune your portions or increase workout intensity to maintain balance.',
        icon: '⚠️',
        color: colors.warning
      });
    } else if (calorieRatio < 0.7) {
      insights.push({
        category: 'critical',
        title: 'Dangerously Low Calorie Intake',
        message: `You're consuming ${Math.round((1 - calorieRatio) * 100)}% fewer calories than needed.`,
        recommendation: 'Critical: Increase food intake immediately. Consider adding healthy snacks between meals.',
        icon: '🚨',
        color: colors.error
      });
    } else if (calorieRatio < 0.85) {
      insights.push({
        category: 'warning',
        title: 'Low Calorie Intake',
        message: `You're under-eating by ${Math.round((1 - calorieRatio) * 100)}%.`,
        recommendation: 'Add nutrient-dense foods to meet your energy needs for optimal performance.',
        icon: '🍽️',
        color: colors.warning
      });
    } else {
      insights.push({
        category: 'excellent',
        title: 'Optimal Calorie Balance',
        message: 'Your calorie intake perfectly aligns with your goals!',
        recommendation: 'Excellent! Maintain this balance while monitoring your body\'s response.',
        icon: '🎯',
        color: colors.green
      });
    }

    // Progressive Workout Analysis
    const workoutCompletion = progressStats.workoutsCompleted / progressStats.totalWorkouts;
    const workoutGap = progressStats.totalWorkouts - progressStats.workoutsCompleted;

    if (workoutCompletion >= 0.95) {
      insights.push({
        category: 'excellent',
        title: 'Elite Performance Level',
        message: `Outstanding! ${Math.round(workoutCompletion * 100)}% completion rate achieved.`,
        recommendation: 'You\'re ready for advanced challenges. Consider progressive overload or new exercise variations.',
        icon: '👑',
        color: colors.gold
      });
    } else if (workoutCompletion >= 0.8) {
      insights.push({
        category: 'good',
        title: 'Strong Consistency',
        message: `Great work! ${Math.round(workoutCompletion * 100)}% workout completion.`,
        recommendation: 'You\'re building excellent habits. Push for 90%+ to reach the next level.',
        icon: '💪',
        color: colors.primary
      });
    } else if (workoutCompletion >= 0.6) {
      insights.push({
        category: 'warning',
        title: 'Inconsistent Training',
        message: `You've missed ${workoutGap} workouts this ${period}. Progress may be slower.`,
        recommendation: 'Schedule specific workout times and set reminders. Consistency beats intensity.',
        icon: '📅',
        color: colors.warning
      });
    } else {
      insights.push({
        category: 'critical',
        title: 'Training Frequency Too Low',
        message: `Only ${Math.round(workoutCompletion * 100)}% completion. Your goals are at risk.`,
        recommendation: 'Emergency plan: Start with 15-minute daily sessions. Build the habit first, intensity later.',
        icon: '🆘',
        color: colors.error
      });
    }

    // Adaptive Hydration Analysis
    const hydrationRatio = progressStats.waterIntake / progressStats.targetWater;
    const waterDeficit = progressStats.targetWater - progressStats.waterIntake;

    if (hydrationRatio >= 1.2) {
      insights.push({
        category: 'excellent',
        title: 'Optimal Hydration Plus',
        message: `Excellent! You're exceeding hydration goals by ${Math.round((hydrationRatio - 1) * 100)}%.`,
        recommendation: 'Perfect hydration supports peak performance. Monitor urine color for optimal levels.',
        icon: '💎',
        color: colors.blue
      });
    } else if (hydrationRatio >= 0.9) {
      insights.push({
        category: 'good',
        title: 'Good Hydration',
        message: `You're at ${Math.round(hydrationRatio * 100)}% of your hydration target.`,
        recommendation: 'Almost perfect! Add one more glass to reach optimal hydration.',
        icon: '💧',
        color: colors.primary
      });
    } else if (hydrationRatio >= 0.7) {
      insights.push({
        category: 'warning',
        title: 'Mild Dehydration Risk',
        message: `You need ${waterDeficit.toFixed(1)}L more water to meet daily goals.`,
        recommendation: 'Set hourly water reminders. Dehydration reduces performance by up to 25%.',
        icon: '🚰',
        color: colors.warning
      });
    } else {
      insights.push({
        category: 'critical',
        title: 'Severe Dehydration Risk',
        message: `Critical water deficit: ${waterDeficit.toFixed(1)}L below target.`,
        recommendation: 'Immediate action: Drink water now. Set alarms every 30 minutes.',
        icon: '🚨',
        color: colors.error
      });
    }

    // Progressive Nutrition Analysis
    const mealCompletion = progressStats.mealsCompleted / progressStats.totalMeals;
    const totalMacros = progressStats.protein + progressStats.carbs + progressStats.fats;
    
    if (totalMacros > 0) {
      const proteinRatio = progressStats.protein / totalMacros;
      const carbRatio = progressStats.carbs / totalMacros;
      const fatRatio = progressStats.fats / totalMacros;

      if (mealCompletion < 0.5) {
        insights.push({
          category: 'critical',
          title: 'Nutrition Plan Abandoned',
          message: `Only ${Math.round(mealCompletion * 100)}% of planned meals consumed.`,
          recommendation: 'Critical: Your nutrition is derailing your fitness goals. Meal prep this weekend!',
          icon: '🍽️',
          color: colors.error
        });
      } else if (proteinRatio < 0.15) {
        insights.push({
          category: 'warning',
          title: 'Protein Deficiency Alert',
          message: `Protein is only ${Math.round(proteinRatio * 100)}% of your intake.`,
          recommendation: 'Add protein to every meal: eggs, chicken, beans, or protein shakes.',
          icon: '🥩',
          color: colors.warning
        });
      } else if (proteinRatio >= 0.25 && proteinRatio <= 0.35 && 
                 carbRatio >= 0.35 && carbRatio <= 0.55 && 
                 fatRatio >= 0.20 && fatRatio <= 0.35) {
        insights.push({
          category: 'excellent',
          title: 'Perfect Macro Distribution',
          message: 'Your macronutrient balance is scientifically optimal!',
          recommendation: 'Outstanding nutrition! This balance maximizes performance and recovery.',
          icon: '⚖️',
          color: colors.green
        });
      }
    }

    // Adaptive Progress Motivation
    const overallProgress = (workoutCompletion + mealCompletion + hydrationRatio) / 3;

    if (overallProgress >= 0.9) {
      insights.push({
        category: 'excellent',
        title: 'Transformation in Progress',
        message: 'You\'re operating at elite level across all metrics!',
        recommendation: 'Incredible dedication! Document your progress and inspire others.',
        icon: '🌟',
        color: colors.gold
      });
    } else if (overallProgress >= 0.7) {
      insights.push({
        category: 'good',
        title: 'Solid Foundation Built',
        message: 'You\'re building strong healthy habits consistently.',
        recommendation: 'Great momentum! Focus on the weakest area to accelerate progress.',
        icon: '🏗️',
        color: colors.primary
      });
    } else if (overallProgress >= 0.5) {
      insights.push({
        category: 'warning',
        title: 'Progress Plateau Risk',
        message: 'Your consistency is wavering. Results may stall.',
        recommendation: 'Refocus time! Pick ONE area to improve this week, then build on success.',
        icon: '📈',
        color: colors.warning
      });
    } else {
      insights.push({
        category: 'critical',
        title: 'Immediate Intervention Needed',
        message: 'Your fitness goals are seriously at risk.',
        recommendation: 'Emergency reset: Choose just 3 simple daily habits. Master basics before advancing.',
        icon: '🚨',
        color: colors.error
      });
    }

    return insights;
  };

  const healthInsights = generateHealthInsights();

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'excellent':
        return { backgroundColor: colors.gold + '20', borderColor: colors.gold + '40' };
      case 'good':
        return { backgroundColor: colors.green + '20', borderColor: colors.green + '40' };
      case 'warning':
        return { backgroundColor: colors.warning + '20', borderColor: colors.warning + '40' };
      case 'critical':
        return { backgroundColor: colors.error + '20', borderColor: colors.error + '40' };
      default:
        return { backgroundColor: colors.surface, borderColor: colors.cardBorder };
    }
  };

  return (
    <Animated.View entering={FadeInUp.delay(900)} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Insights & Recommendations</Text>
        <Text style={styles.subtitle}>AI-powered analysis of your progress</Text>
      </View>

      <ScrollView style={styles.insightsContainer} showsVerticalScrollIndicator={false}>
        {healthInsights.map((insight, index) => (
          <Animated.View
            key={index}
            entering={FadeInLeft.delay(1000 + index * 100)}
            style={[styles.insightCard, getCategoryStyle(insight.category)]}
          >
            <TouchableOpacity
              style={styles.insightHeader}
              onPress={() => setExpandedInsight(expandedInsight === index ? null : index)}
              activeOpacity={0.8}
            >
              <View style={styles.insightHeaderLeft}>
                <Text style={styles.insightIcon}>{insight.icon}</Text>
                <View style={styles.insightHeaderText}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightCategory}>
                    {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.expandIcon}>
                {expandedInsight === index ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {expandedInsight === index && (
              <Animated.View entering={FadeInUp.delay(200)} style={styles.insightContent}>
                <Text style={styles.insightMessage}>{insight.message}</Text>
                <View style={styles.recommendationContainer}>
                  <Text style={styles.recommendationLabel}>💡 Recommendation:</Text>
                  <Text style={styles.recommendationText}>{insight.recommendation}</Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        ))}

        {/* Overall Health Score */}
        <Animated.View entering={FadeInUp.delay(1400)} style={styles.healthScoreContainer}>
          <Text style={styles.healthScoreTitle}>Overall Health Score</Text>
          <View style={styles.healthScoreCircle}>
            <Text style={styles.healthScoreValue}>
              {Math.round(
                (healthInsights.filter(i => i.category === 'excellent').length * 100 +
                 healthInsights.filter(i => i.category === 'good').length * 80 +
                 healthInsights.filter(i => i.category === 'warning').length * 60 +
                 healthInsights.filter(i => i.category === 'critical').length * 40) /
                healthInsights.length
              )}
            </Text>
            <Text style={styles.healthScoreLabel}>/ 100</Text>
          </View>
          <Text style={styles.healthScoreDescription}>
            Based on your current progress and consistency
          </Text>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  insightsContainer: {
    maxHeight: 600,
  },
  insightCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  insightHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  insightHeaderText: {
    flex: 1,
  },
  insightTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  insightCategory: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
    textTransform: 'uppercase',
  },
  expandIcon: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '600',
  },
  insightContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder + '30',
  },
  insightMessage: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  recommendationContainer: {
    backgroundColor: colors.cardBorder + '20',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  recommendationLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
  },
  recommendationText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
    lineHeight: 20,
  },
  healthScoreContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  healthScoreTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.lg,
  },
  healthScoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '20',
    borderWidth: 4,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  healthScoreValue: {
    color: colors.primary,
    fontSize: 36,
    fontWeight: '900',
    fontFamily: fonts.heading,
  },
  healthScoreLabel: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  healthScoreDescription: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
  },
});
