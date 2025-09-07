import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
} from 'react-native';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { DietMeal } from '../services/aiDietService';

interface MealDetailScreenProps {
  meal: DietMeal | null;
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
  isCompleted?: boolean;
  canComplete?: boolean; // Based on day status
}

export default function MealDetailScreen({
  meal,
  visible,
  onClose,
  onComplete,
  isCompleted = false,
  canComplete = true,
}: MealDetailScreenProps) {
  const [portionMultiplier, setPortionMultiplier] = useState(1);

  if (!meal) return null;

  const handleCompletemeal = () => {
    if (onComplete && canComplete) {
      onComplete();
      onClose();
    }
  };

  const adjustedCalories = Math.round(meal.calories * portionMultiplier);
  const adjustedProtein = Math.round(meal.protein * portionMultiplier);
  const adjustedCarbs = Math.round(meal.carbs * portionMultiplier);
  const adjustedFats = Math.round(meal.fats * portionMultiplier);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meal Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Meal Info Card */}
          <View style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <View style={styles.mealIcon}>
                <Text style={styles.mealEmoji}>{meal.emoji}</Text>
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealTime}>Prep time: {meal.preparationTime}</Text>
              </View>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓</Text>
                </View>
              )}
            </View>

            {/* Nutrition Facts */}
            <View style={styles.nutritionSection}>
              <Text style={styles.sectionTitle}>Nutrition Facts</Text>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{adjustedCalories}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{adjustedProtein}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{adjustedCarbs}g</Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{adjustedFats}g</Text>
                  <Text style={styles.nutritionLabel}>Fats</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Portion Control */}
          <View style={styles.portionCard}>
            <Text style={styles.sectionTitle}>Portion Size</Text>
            <View style={styles.portionControls}>
              <TouchableOpacity 
                style={[styles.portionButton, portionMultiplier <= 0.5 && styles.portionButtonDisabled]}
                onPress={() => setPortionMultiplier(Math.max(0.5, portionMultiplier - 0.25))}
                disabled={portionMultiplier <= 0.5}
              >
                <Text style={styles.portionButtonText}>−</Text>
              </TouchableOpacity>
              
              <View style={styles.portionDisplay}>
                <Text style={styles.portionValue}>{portionMultiplier}x</Text>
                <Text style={styles.portionLabel}>servings</Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.portionButton, portionMultiplier >= 3 && styles.portionButtonDisabled]}
                onPress={() => setPortionMultiplier(Math.min(3, portionMultiplier + 0.25))}
                disabled={portionMultiplier >= 3}
              >
                <Text style={styles.portionButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.ingredientsCard}>
            <Text style={styles.sectionTitle}>🛒 Ingredients</Text>
            <View style={styles.ingredientsList}>
              {meal.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.ingredientBullet}>•</Text>
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Instructions */}
          {meal.instructions && (
            <View style={styles.instructionsCard}>
              <Text style={styles.sectionTitle}>👨‍🍳 Instructions</Text>
              <Text style={styles.instructionsText}>{meal.instructions}</Text>
            </View>
          )}

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.sectionTitle}>💡 Meal Tips</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tipText}>
                • Prepare ingredients in advance for quicker cooking
              </Text>
              <Text style={styles.tipText}>
                • Focus on fresh, high-quality ingredients
              </Text>
              <Text style={styles.tipText}>
                • Adjust seasoning to your taste preferences
              </Text>
              <Text style={styles.tipText}>
                • Store leftovers properly for meal prep
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        {canComplete && !isCompleted && (
          <View style={styles.bottomAction}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompletemeal}
            >
              <Text style={styles.completeButtonText}>
                Mark as Eaten ✓
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBorder + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  
  // Meal Card
  mealCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  mealIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  mealEmoji: {
    fontSize: 32,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  mealTime: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  completedBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },

  // Nutrition Section
  nutritionSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  nutritionLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },

  // Portion Card
  portionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  portionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  portionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionButtonDisabled: {
    backgroundColor: colors.cardBorder,
    opacity: 0.5,
  },
  portionButtonText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
  },
  portionDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  portionValue: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  portionLabel: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
  },

  // Ingredients Card
  ingredientsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  ingredientsList: {
    gap: spacing.sm,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ingredientBullet: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  ingredientText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.body,
    flex: 1,
    lineHeight: 22,
  },

  // Instructions Card
  instructionsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  instructionsText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.body,
    lineHeight: 24,
  },

  // Tips Card
  tipsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tipsList: {
    gap: spacing.sm,
  },
  tipText: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
  },

  // Bottom Action
  bottomAction: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  completeButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  completeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
});
