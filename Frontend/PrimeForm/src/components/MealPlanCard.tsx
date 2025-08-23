import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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
  onPress?: () => void;
  delay?: number;
}

export default function MealPlanCard({ title, meals, totalCalories, onPress, delay = 0 }: Props) {
  const { t } = useLanguage();
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
              {meals.map((meal, index) => (
                <View key={index} style={styles.mealItem}>
                  <View style={styles.mealIcon}>
                    <Ionicons name="restaurant" size={16} color={colors.mutedText} />
                  </View>
                  
                  <View style={styles.mealContent}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <View style={styles.mealDetails}>
                      <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                      <Text style={styles.mealWeight}>{meal.weight}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
            
            {onPress && (
              <TouchableOpacity style={styles.viewAllButton} onPress={onPress}>
                <Text style={styles.viewAllText}>{t('dashboard.view.full.meal')}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.gold} />
              </TouchableOpacity>
            )}
          </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

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
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  calorieCount: {
    color: colors.gold,
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
  mealDetails: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mealCalories: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '600',
  },
  mealWeight: {
    color: colors.mutedText,
    fontSize: typography.small,
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
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
});

