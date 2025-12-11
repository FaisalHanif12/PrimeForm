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
import Animated, { FadeInDown, FadeInLeft, FadeIn } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../../src/theme/colors';
import { getSportCategory } from '../../../src/data/sportExercises';
import ExerciseAnimation from '../../../src/components/ExerciseAnimation';

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
        {/* Sport Description Banner */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.descriptionBanner}>
          <LinearGradient
            colors={[category.color + '25', category.color + '10']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerGradient}
          >
            <Ionicons name="information-circle-outline" size={24} color={category.color} />
            <Text style={styles.bannerText}>{category.description}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Exercise List */}
        <View style={styles.exerciseList}>
          <Text style={styles.sectionTitle}>Sport-Specific Exercises</Text>
          <Text style={styles.sectionSubtitle}>
            Master these {category.exercises.length} exercises to excel in {category.name}
          </Text>
          
          {category.exercises.map((exercise, index) => (
            <Animated.View
              key={exercise.id}
              entering={FadeInDown.delay(300 + index * 150).duration(700)}
            >
              <TouchableOpacity
                style={styles.exerciseCard}
                onPress={() => handleExercisePress(exercise.id)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.surface, colors.background + '50']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  {/* Animation Preview */}
                  <View style={styles.animationPreview}>
                    <View style={styles.animationContainer}>
                      <ExerciseAnimation
                        exerciseType={exercise.id}
                        isVisible={true}
                        style={styles.animationStyle}
                      />
                    </View>
                    <View style={[styles.exerciseNumber, { backgroundColor: category.color }]}>
                      <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                    </View>
                  </View>

                  {/* Content */}
                  <View style={styles.exerciseContent}>
                    <View style={styles.exerciseHeader}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <View style={[styles.difficultyBadge, { 
                        backgroundColor: getDifficultyColor(exercise.difficulty) + '25',
                        borderColor: getDifficultyColor(exercise.difficulty) + '50',
                      }]}>
                        <View style={[styles.difficultyDot, { backgroundColor: getDifficultyColor(exercise.difficulty) }]} />
                        <Text style={[styles.difficultyText, { color: getDifficultyColor(exercise.difficulty) }]}>
                          {exercise.difficulty}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.exerciseDescription} numberOfLines={2}>
                      {exercise.description}
                    </Text>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <View style={[styles.statIconCircle, { backgroundColor: colors.blue + '20' }]}>
                          <Ionicons name="time" size={14} color={colors.blue} />
                        </View>
                        <Text style={styles.statText}>{Math.floor(exercise.duration / 60)} min</Text>
                      </View>

                      <View style={styles.statDivider} />

                      <View style={styles.statItem}>
                        <View style={[styles.statIconCircle, { backgroundColor: colors.gold + '20' }]}>
                          <Ionicons name="repeat" size={14} color={colors.gold} />
                        </View>
                        <Text style={styles.statText}>{exercise.reps} reps</Text>
                      </View>

                      <View style={styles.statDivider} />

                      <View style={styles.statItem}>
                        <View style={[styles.statIconCircle, { backgroundColor: colors.primary + '20' }]}>
                          <Ionicons name="layers" size={14} color={colors.primary} />
                        </View>
                        <Text style={styles.statText}>{exercise.sets} sets</Text>
                      </View>
                    </View>

                    {/* Muscles */}
                    <View style={styles.muscleSection}>
                      <Ionicons name="fitness-outline" size={14} color={colors.mutedText} />
                      <View style={styles.muscleChips}>
                        {exercise.muscles.slice(0, 2).map((muscle, idx) => (
                          <Text key={idx} style={styles.muscleText}>{muscle}</Text>
                        ))}
                        {exercise.muscles.length > 2 && (
                          <Text style={styles.muscleMore}>+{exercise.muscles.length - 2} more</Text>
                        )}
                      </View>
                    </View>

                    {/* Start Button */}
                    <TouchableOpacity 
                      style={[styles.startButton, { backgroundColor: category.color }]}
                      onPress={() => handleExercisePress(exercise.id)}
                    >
                      <Ionicons name="play-circle" size={20} color={colors.white} />
                      <Text style={styles.startButtonText}>Start Exercise</Text>
                      <Ionicons name="chevron-forward" size={18} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
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
    paddingBottom: spacing.xl * 2,
  },
  descriptionBanner: {
    marginBottom: spacing.xl,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  bannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  exerciseList: {
    gap: spacing.lg,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
    fontFamily: fonts.headingBold,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.mutedText,
    marginBottom: spacing.lg,
    fontFamily: fonts.regular,
  },
  exerciseCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardGradient: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.xl,
  },
  animationPreview: {
    height: 200,
    backgroundColor: colors.background + '50',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationContainer: {
    width: '70%',
    height: '100%',
  },
  animationStyle: {
    width: '100%',
    height: '100%',
  },
  exerciseNumber: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  exerciseNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  exerciseContent: {
    padding: spacing.lg,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  exerciseName: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginRight: spacing.sm,
    fontFamily: fonts.bold,
  },
  exerciseDescription: {
    fontSize: 14,
    color: colors.mutedText,
    lineHeight: 20,
    marginBottom: spacing.md,
    fontFamily: fonts.regular,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    gap: 4,
    borderWidth: 1,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    justifyContent: 'center',
  },
  statIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
    fontFamily: fonts.semiBold,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.cardBorder,
  },
  muscleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  muscleText: {
    fontSize: 12,
    color: colors.mutedText,
    fontFamily: fonts.regular,
  },
  muscleMore: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: fonts.semiBold,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  errorText: {
    fontSize: 16,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 100,
  },
});

