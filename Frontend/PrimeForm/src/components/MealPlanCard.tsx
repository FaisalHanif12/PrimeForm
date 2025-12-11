import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

interface MealItem {
  name: string;
  calories: number;
  weight: string;
}

interface Props {
  title: string;
  meals: MealItem[];
  totalCalories: number;
  completedMeals?: Set<string>;
  onPress?: () => void;
  delay?: number;
}

const MealPlanCard = React.memo(({ title, meals, totalCalories, completedMeals = new Set(), onPress, delay = 0 }: Props) => {
  const { t } = useLanguage();
  
  // Helper function to check if meal is completed
  const isMealCompleted = (meal: MealItem): boolean => {
    // Get today's date in local timezone to avoid UTC offset
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const year = todayDate.getFullYear();
    const month = String(todayDate.getMonth() + 1).padStart(2, '0');
    const day = String(todayDate.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    const originalName = meal.name.replace(/^[🌅🌞🌙🍎]+\s*/, '').replace(/^(Breakfast|Lunch|Dinner|Snack \d+):\s*/, '');
    
    return Array.from(completedMeals).some(completedKey => 
      typeof completedKey === 'string' && completedKey.includes(today) && completedKey.includes(originalName)
    );
  };
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay)} 
      style={styles.container}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.calorieContainer}>
                <Text style={styles.calorieCount}>{totalCalories}</Text>
                <Text style={styles.calorieLabel}>kcal</Text>
              </View>
            </View>
            
            <View style={styles.mealList}>
              {meals.map((meal, index) => {
                const isCompleted = isMealCompleted(meal);
                return (
                <View key={index} style={[
                  styles.mealItem,
                  isCompleted && styles.mealItemCompleted
                ]}>
                  <View style={styles.mealIcon}>
                    <Ionicons name="restaurant" size={16} color={colors.mutedText} />
                  </View>
                  
                  <View style={styles.mealContent}>
                    <Text style={[styles.mealName, isCompleted && styles.mealNameCompleted]}>{meal.name}</Text>
                    <View style={styles.mealDetails}>
                      <Text style={[styles.mealCalories, isCompleted && styles.mealCaloriesCompleted]}>{meal.calories} kcal</Text>
                      <Text style={[styles.mealWeight, isCompleted && styles.mealWeightCompleted]}>{meal.weight}</Text>
                    </View>
                  </View>
                  
                  {isCompleted && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedIcon}>✓</Text>
                    </View>
                  )}
                </View>
                );
              })}
            </View>
            
            {onPress && (
              <TouchableOpacity style={styles.viewAllButton} onPress={onPress}>
                <Text style={styles.viewAllText}>{t('dashboard.view.full.meal')}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: typography.subtitle,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },
  calorieContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 201, 124, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  calorieCount: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  calorieLabel: {
    color: colors.mutedText,
    fontSize: 10,
    fontFamily: fonts.body,
  },
  mealList: {
    marginBottom: spacing.md,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  mealIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  mealContent: {
    flex: 1,
  },
  mealName: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '500',
    fontFamily: fonts.body,
    marginBottom: 2,
  },
  mealNameCompleted: {
    color: colors.mutedText,
    textDecorationLine: 'line-through',
  },
  mealDetails: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mealCalories: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '600',
  },
  mealCaloriesCompleted: {
    color: colors.mutedText,
    textDecorationLine: 'line-through',
  },
  mealWeight: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
  mealWeightCompleted: {
    color: colors.mutedText + '80',
    textDecorationLine: 'line-through',
  },
  // Completion Styles
  mealItemCompleted: {
    opacity: 0.7,
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedIcon: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
});

export default MealPlanCard;
