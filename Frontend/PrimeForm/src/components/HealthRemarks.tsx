import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { colors, spacing, fonts, radius } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

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
  const { t, language, transliterateNumbers } = useLanguage();
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  const generateHealthInsights = (): HealthInsight[] => {
    if (!progressStats) return [];

    const insights: HealthInsight[] = [];

    // Adaptive Calorie Balance Analysis
    const calorieBalance = progressStats.caloriesConsumed - progressStats.caloriesBurned;
    const calorieRatio = progressStats.caloriesConsumed / progressStats.targetCalories;
    const netCalorieBalance = Math.abs(calorieBalance);

    if (calorieRatio > 1.3) {
      const percent = Math.round((calorieRatio - 1) * 100);
      insights.push({
        category: 'critical',
        title: t('health.insight.calorie.surplus.significant'),
        message: t('health.insight.calorie.surplus.significant.message').replace('{percent}', String(percent)),
        recommendation: t('health.insight.calorie.surplus.significant.recommendation'),
        icon: '🚨',
        color: colors.error
      });
    } else if (calorieRatio > 1.15) {
      const percent = Math.round((calorieRatio - 1) * 100);
      insights.push({
        category: 'warning',
        title: t('health.insight.calorie.surplus.moderate'),
        message: t('health.insight.calorie.surplus.moderate.message').replace('{percent}', String(percent)),
        recommendation: t('health.insight.calorie.surplus.moderate.recommendation'),
        icon: '⚠️',
        color: colors.warning
      });
    } else if (calorieRatio < 0.7) {
      const percent = Math.round((1 - calorieRatio) * 100);
      insights.push({
        category: 'critical',
        title: t('health.insight.calorie.low.dangerous'),
        message: t('health.insight.calorie.low.dangerous.message').replace('{percent}', String(percent)),
        recommendation: t('health.insight.calorie.low.dangerous.recommendation'),
        icon: '🚨',
        color: colors.error
      });
    } else if (calorieRatio < 0.85) {
      const percent = Math.round((1 - calorieRatio) * 100);
      insights.push({
        category: 'warning',
        title: t('health.insight.calorie.low'),
        message: t('health.insight.calorie.low.message').replace('{percent}', String(percent)),
        recommendation: t('health.insight.calorie.low.recommendation'),
        icon: '🍽️',
        color: colors.warning
      });
    } else {
      insights.push({
        category: 'excellent',
        title: t('health.insight.calorie.optimal'),
        message: t('health.insight.calorie.optimal.message'),
        recommendation: t('health.insight.calorie.optimal.recommendation'),
        icon: '🎯',
        color: colors.green
      });
    }

    // Progressive Workout Analysis
    const workoutCompletion = progressStats.workoutsCompleted / progressStats.totalWorkouts;
    const workoutGap = progressStats.totalWorkouts - progressStats.workoutsCompleted;

    if (workoutCompletion >= 0.95) {
      const percent = Math.round(workoutCompletion * 100);
      insights.push({
        category: 'excellent',
        title: t('health.insight.workout.elite'),
        message: t('health.insight.workout.elite.message').replace('{percent}', String(percent)),
        recommendation: t('health.insight.workout.elite.recommendation'),
        icon: '👑',
        color: colors.gold
      });
    } else if (workoutCompletion >= 0.8) {
      const percent = Math.round(workoutCompletion * 100);
      insights.push({
        category: 'good',
        title: t('health.insight.workout.strong'),
        message: t('health.insight.workout.strong.message').replace('{percent}', String(percent)),
        recommendation: t('health.insight.workout.strong.recommendation'),
        icon: '💪',
        color: colors.primary
      });
    } else if (workoutCompletion >= 0.6) {
      const periodText = period === 'daily' ? t('progress.period.daily') : period === 'weekly' ? t('progress.period.weekly') : t('progress.period.monthly');
      insights.push({
        category: 'warning',
        title: t('health.insight.workout.inconsistent'),
        message: t('health.insight.workout.inconsistent.message').replace('{missed}', String(workoutGap)).replace('{period}', periodText),
        recommendation: t('health.insight.workout.inconsistent.recommendation'),
        icon: '📅',
        color: colors.warning
      });
    } else {
      const percent = Math.round(workoutCompletion * 100);
      insights.push({
        category: 'critical',
        title: t('health.insight.workout.low'),
        message: t('health.insight.workout.low.message').replace('{percent}', String(percent)),
        recommendation: t('health.insight.workout.low.recommendation'),
        icon: '🆘',
        color: colors.error
      });
    }

    // Adaptive Hydration Analysis
    const hydrationRatio = progressStats.waterIntake / progressStats.targetWater;
    const waterDeficit = progressStats.targetWater - progressStats.waterIntake;

    if (hydrationRatio >= 1.2) {
      const percent = Math.round((hydrationRatio - 1) * 100);
      insights.push({
        category: 'excellent',
        title: t('health.insight.hydration.optimal.plus'),
        message: t('health.insight.hydration.optimal.plus.message').replace('{percent}', String(percent)),
        recommendation: t('health.insight.hydration.optimal.plus.recommendation'),
        icon: '💎',
        color: colors.blue
      });
    } else if (hydrationRatio >= 0.9) {
      const percent = Math.round(hydrationRatio * 100);
      insights.push({
        category: 'good',
        title: t('health.insight.hydration.good'),
        message: t('health.insight.hydration.good.message').replace('{percent}', String(percent)),
        recommendation: t('health.insight.hydration.good.recommendation'),
        icon: '💧',
        color: colors.primary
      });
    } else if (hydrationRatio >= 0.7) {
      const deficit = language === 'ur' ? transliterateNumbers(parseFloat(waterDeficit.toFixed(1))) : waterDeficit.toFixed(1);
      insights.push({
        category: 'warning',
        title: t('health.insight.hydration.mild'),
        message: t('health.insight.hydration.mild.message').replace('{deficit}', deficit),
        recommendation: t('health.insight.hydration.mild.recommendation'),
        icon: '🚰',
        color: colors.warning
      });
    } else {
      const deficit = language === 'ur' ? transliterateNumbers(parseFloat(waterDeficit.toFixed(1))) : waterDeficit.toFixed(1);
      insights.push({
        category: 'critical',
        title: t('health.insight.hydration.severe'),
        message: t('health.insight.hydration.severe.message').replace('{deficit}', deficit),
        recommendation: t('health.insight.hydration.severe.recommendation'),
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
        const percent = Math.round(mealCompletion * 100);
        insights.push({
          category: 'critical',
          title: t('health.insight.nutrition.abandoned'),
          message: t('health.insight.nutrition.abandoned.message').replace('{percent}', String(percent)),
          recommendation: t('health.insight.nutrition.abandoned.recommendation'),
          icon: '🍽️',
          color: colors.error
        });
      } else if (proteinRatio < 0.15) {
        const percent = Math.round(proteinRatio * 100);
        insights.push({
          category: 'warning',
          title: t('health.insight.nutrition.protein.deficiency'),
          message: t('health.insight.nutrition.protein.deficiency.message').replace('{percent}', String(percent)),
          recommendation: t('health.insight.nutrition.protein.deficiency.recommendation'),
          icon: '🥩',
          color: colors.warning
        });
      } else if (proteinRatio >= 0.25 && proteinRatio <= 0.35 && 
                 carbRatio >= 0.35 && carbRatio <= 0.55 && 
                 fatRatio >= 0.20 && fatRatio <= 0.35) {
        insights.push({
          category: 'excellent',
          title: t('health.insight.nutrition.macro.perfect'),
          message: t('health.insight.nutrition.macro.perfect.message'),
          recommendation: t('health.insight.nutrition.macro.perfect.recommendation'),
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
        title: t('health.insight.progress.transformation'),
        message: t('health.insight.progress.transformation.message'),
        recommendation: t('health.insight.progress.transformation.recommendation'),
        icon: '🌟',
        color: colors.gold
      });
    } else if (overallProgress >= 0.7) {
      insights.push({
        category: 'good',
        title: t('health.insight.progress.foundation'),
        message: t('health.insight.progress.foundation.message'),
        recommendation: t('health.insight.progress.foundation.recommendation'),
        icon: '🏗️',
        color: colors.primary
      });
    } else if (overallProgress >= 0.5) {
      insights.push({
        category: 'warning',
        title: t('health.insight.progress.plateau'),
        message: t('health.insight.progress.plateau.message'),
        recommendation: t('health.insight.progress.plateau.recommendation'),
        icon: '📈',
        color: colors.warning
      });
    } else {
      insights.push({
        category: 'critical',
        title: t('health.insight.progress.intervention'),
        message: t('health.insight.progress.intervention.message'),
        recommendation: t('health.insight.progress.intervention.recommendation'),
        icon: '🚨',
        color: colors.error
      });
    }

    return insights;
  };

  const healthInsights = generateHealthInsights();

  // Calculate real-time health score based on accumulated data
  const calculateHealthScore = (): number => {
    if (!progressStats) return 0;

    // Workout completion score (30% weight) - capped at 100
    const workoutScore = progressStats.totalWorkouts > 0 
      ? Math.min((progressStats.workoutsCompleted / progressStats.totalWorkouts) * 100, 100)
      : 0;

    // Meal completion score (25% weight) - capped at 100
    const mealScore = progressStats.totalMeals > 0 
      ? Math.min((progressStats.mealsCompleted / progressStats.totalMeals) * 100, 100)
      : 0;

    // Hydration score (20% weight) - capped at 100
    const hydrationRatio = progressStats.targetWater > 0 
      ? Math.min(progressStats.waterIntake / progressStats.targetWater, 1.0) 
      : 0;
    const hydrationScore = Math.min(hydrationRatio * 100, 100); // Max out at 100

    // Calorie balance score (25% weight) - more accurate calculation
    let calorieScore = 0;
    if (progressStats.targetCalories > 0) {
      const calorieRatio = progressStats.caloriesConsumed / progressStats.targetCalories;
      // More accurate scoring: perfect at 100%, with smooth falloff
      if (calorieRatio >= 0.90 && calorieRatio <= 1.10) {
        calorieScore = 100; // Within 10% of target = perfect
      } else if (calorieRatio >= 0.85 && calorieRatio <= 1.15) {
        calorieScore = 95; // Within 15% of target = excellent
      } else if (calorieRatio >= 0.75 && calorieRatio <= 1.25) {
        calorieScore = 85; // Within 25% of target = very good
      } else if (calorieRatio >= 0.65 && calorieRatio <= 1.35) {
        calorieScore = 70; // Within 35% of target = good
      } else if (calorieRatio >= 0.50 && calorieRatio <= 1.50) {
        calorieScore = 50; // Within 50% of target = moderate
      } else {
        calorieScore = Math.max(25, 100 - Math.abs(calorieRatio - 1) * 100); // Gradual falloff
      }
    } else {
      // If no target calories, give full score (can't penalize for missing data)
      calorieScore = 100;
    }

    // Weighted average
    let totalScore = (
      (workoutScore * 0.30) +
      (mealScore * 0.25) +
      (hydrationScore * 0.20) +
      (calorieScore * 0.25)
    );

    // ✅ PERFECT SCORE LOGIC: If all three main metrics (workouts, meals, hydration) are 100%,
    // then the overall score should be 100, regardless of calories
    // This ensures that when everything is complete, the score reflects that
    if (workoutScore === 100 && mealScore === 100 && hydrationScore === 100) {
      totalScore = 100;
    }

    // Cap at 100
    return Math.min(Math.round(totalScore), 100);
  };

  const healthScore = calculateHealthScore();

  // Get score color and status based on score value
  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.green;
    if (score >= 60) return colors.primary;
    if (score >= 40) return colors.warning;
    return colors.error;
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return t('health.score.status.excellent');
    if (score >= 60) return t('health.score.status.good');
    if (score >= 40) return t('health.score.status.needs.improvement');
    return t('health.score.status.critical');
  };

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

  const scoreColor = getScoreColor(healthScore);

  return (
    <Animated.View entering={FadeInUp.delay(900)} style={styles.container}>
      {/* Overall Health Score - Now at the TOP */}
      <Animated.View entering={FadeInUp.delay(950)} style={[styles.healthScoreContainer, { borderColor: scoreColor + '60' }]}>
        <Text style={styles.healthScoreTitle}>{t('health.score.title')}</Text>
        <View style={[styles.healthScoreCircle, { borderColor: scoreColor, backgroundColor: scoreColor + '15' }]}>
          <Text style={[styles.healthScoreValue, { color: scoreColor }]}>
            {language === 'ur' ? transliterateNumbers(healthScore) : healthScore}
          </Text>
          <Text style={styles.healthScoreLabel}>/ {language === 'ur' ? transliterateNumbers(100) : 100}</Text>
        </View>
        <View style={[styles.scoreStatusBadge, { backgroundColor: scoreColor + '20' }]}>
          <Text style={[styles.scoreStatusText, { color: scoreColor }]}>{getScoreStatus(healthScore)}</Text>
        </View>
        <Text style={styles.healthScoreDescription}>
          {t('health.score.based.on')
            .replace('{workouts}', language === 'ur' ? transliterateNumbers(progressStats?.workoutsCompleted || 0) : String(progressStats?.workoutsCompleted || 0))
            .replace('{meals}', language === 'ur' ? transliterateNumbers(progressStats?.mealsCompleted || 0) : String(progressStats?.mealsCompleted || 0))
            .replace('{water}', language === 'ur' ? transliterateNumbers(parseFloat((progressStats?.waterIntake?.toFixed(1) || 0))) : (progressStats?.waterIntake?.toFixed(1) || '0'))}
        </Text>
      </Animated.View>

      {/* Health Insights Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('health.insights.title')}</Text>
        <Text style={styles.subtitle}>{t('health.insights.subtitle')}</Text>
      </View>

      <View style={styles.insightsContainer}>
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
                    {t(`health.insights.category.${insight.category}`)}
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
                  <Text style={styles.recommendationLabel}>{t('health.insights.recommendation')}</Text>
                  <Text style={styles.recommendationText}>{insight.recommendation}</Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
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
    // No maxHeight - let parent ScrollView handle scrolling
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
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  healthScoreTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.lg,
  },
  healthScoreCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.primary + '15',
    borderWidth: 5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  healthScoreValue: {
    color: colors.primary,
    fontSize: 42,
    fontWeight: '900',
    fontFamily: fonts.heading,
  },
  healthScoreLabel: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  scoreStatusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  scoreStatusText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.heading,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  healthScoreDescription: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 18,
  },
});
