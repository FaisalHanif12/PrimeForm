import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInLeft } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../../src/theme/colors';
import { getSportCategory } from '../../../src/data/sportExercises';

const { width: screenWidth } = Dimensions.get('window');

export default function SportCategoryPage() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const category = getSportCategory(categoryId);

  const handleBack = () => {
    router.back();
  };

  const handleExercisePress = (exerciseId: string) => {
    router.push(`/(dashboard)/sport-mode/${categoryId}/${exerciseId}` as any);
  };

  if (!category) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Category not found</Text>
      </View>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return colors.primary;
      case 'Intermediate':
        return '#FF9800';
      case 'Advanced':
        return '#F44336';
      default:
        return colors.mutedText;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerIcon}>{category.icon}</Text>
            <Text style={styles.headerTitle}>{category.name}</Text>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise List */}
        <View style={styles.exerciseList}>
          <Text style={styles.sectionTitle}>Available Exercises</Text>
          {category.exercises.map((exercise, index) => (
            <Animated.View
              key={exercise.id}
              entering={FadeInLeft.delay(200 + index * 100).duration(600)}
            >
              <TouchableOpacity
                style={styles.exerciseCard}
                onPress={() => handleExercisePress(exercise.id)}
                activeOpacity={0.8}
              >
                <View style={styles.exerciseNumber}>
                  <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                </View>

                <View style={styles.exerciseContent}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDescription} numberOfLines={2}>
                    {exercise.description}
                  </Text>

                  <View style={styles.exerciseMeta}>
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }]}>
                      <Text style={[styles.difficultyText, { color: getDifficultyColor(exercise.difficulty) }]}>
                        {exercise.difficulty}
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={16} color={colors.mutedText} />
                      <Text style={styles.metaText}>{Math.floor(exercise.duration / 60)} min</Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Ionicons name="repeat-outline" size={16} color={colors.mutedText} />
                      <Text style={styles.metaText}>{exercise.reps} reps</Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Ionicons name="layers-outline" size={16} color={colors.mutedText} />
                      <Text style={styles.metaText}>{exercise.sets} sets</Text>
                    </View>
                  </View>

                  <View style={styles.muscleChips}>
                    {exercise.muscles.slice(0, 3).map((muscle, idx) => (
                      <View key={idx} style={styles.muscleChip}>
                        <Text style={styles.muscleChipText}>{muscle}</Text>
                      </View>
                    ))}
                    {exercise.muscles.length > 3 && (
                      <View style={styles.muscleChip}>
                        <Text style={styles.muscleChipText}>+{exercise.muscles.length - 3}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={[styles.exerciseArrow, { backgroundColor: category.color + '15' }]}>
                  <Ionicons name="play" size={20} color={category.color} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  headerIcon: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.headingBold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  exerciseList: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.md,
    fontFamily: fonts.headingBold,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exerciseNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  exerciseNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: fonts.bold,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
    fontFamily: fonts.bold,
  },
  exerciseDescription: {
    fontSize: 14,
    color: colors.mutedText,
    lineHeight: 20,
    marginBottom: spacing.sm,
    fontFamily: fonts.regular,
  },
  exerciseMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.mutedText,
    fontFamily: fonts.regular,
  },
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  muscleChip: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  muscleChipText: {
    fontSize: 11,
    color: colors.mutedText,
    fontFamily: fonts.regular,
  },
  exerciseArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 100,
  },
});

