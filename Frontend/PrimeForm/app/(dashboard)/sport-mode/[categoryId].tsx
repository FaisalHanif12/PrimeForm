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
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../../src/theme/colors';
import { getSportCategory, getTranslatedSportName, getTranslatedExerciseName } from '../../../src/data/sportExercises';
import { useLanguage } from '../../../src/context/LanguageContext';

const { width: screenWidth } = Dimensions.get('window');

export default function SportCategoryPage() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const category = getSportCategory(categoryId);
  const { t, language, transliterateText } = useLanguage();

  const handleBack = () => {
    router.back();
  };

  const handleExercisePress = (exerciseId: string) => {
    router.push(`/(dashboard)/sport-mode/${categoryId}/${exerciseId}` as any);
  };

  if (!category) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('sportMode.category.notFound')}</Text>
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
            <Text style={styles.headerTitle}>
              {getTranslatedSportName(category.id, t, language)}
            </Text>
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
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t('sportMode.category.exercises')}</Text>
              <Text style={styles.sectionSubtitle}>
                {category.exercises.length} {t('sportMode.category.exercisesCount')}
              </Text>
            </View>
          </View>
          
          {category.exercises.map((exercise, index) => (
            <Animated.View
              key={exercise.id}
              entering={FadeInRight.delay(200 + index * 100).duration(600)}
            >
              <TouchableOpacity
                style={styles.exerciseCard}
                onPress={() => handleExercisePress(exercise.id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.surface, colors.surface + 'F0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cardGradient}
                >
                  {/* Left Section - Number Only */}
                  <View style={styles.leftSection}>
                    <View style={[styles.exerciseNumber, { backgroundColor: category.color }]}>
                      <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                    </View>
                  </View>

                  {/* Middle Section - Content */}
                  <View style={styles.middleSection}>
                    <View style={styles.titleRow}>
                      <Text style={styles.exerciseName} numberOfLines={1}>
                        {getTranslatedExerciseName(exercise.id, t, language)}
                      </Text>
                      <View style={[styles.difficultyBadge, { 
                        backgroundColor: getDifficultyColor(exercise.difficulty) + '20',
                      }]}>
                        <Text style={[styles.difficultyText, { color: getDifficultyColor(exercise.difficulty) }]}>
                          {exercise.difficulty === 'Beginner' ? t('sportMode.difficulty.beginner') :
                           exercise.difficulty === 'Intermediate' ? t('sportMode.difficulty.intermediate') :
                           exercise.difficulty === 'Advanced' ? t('sportMode.difficulty.advanced') :
                           exercise.difficulty}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.exerciseDescription} numberOfLines={2}>
                      {language === 'ur' ? transliterateText(exercise.description) : exercise.description}
                    </Text>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={14} color={colors.mutedText} />
                        <Text style={styles.statText}>{Math.floor(exercise.duration / 60)} {t('sportMode.stats.min')}</Text>
                      </View>

                      <View style={styles.statDivider} />

                      <View style={styles.statItem}>
                        <Ionicons name="repeat-outline" size={14} color={colors.mutedText} />
                        <Text style={styles.statText}>{exercise.reps} {t('sportMode.stats.reps')}</Text>
                      </View>

                      <View style={styles.statDivider} />

                      <View style={styles.statItem}>
                        <Ionicons name="layers-outline" size={14} color={colors.mutedText} />
                        <Text style={styles.statText}>{exercise.sets} {t('sportMode.stats.sets')}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Right Section - Arrow */}
                  <View style={styles.rightSection}>
                    <View style={[styles.arrowCircle, { backgroundColor: category.color + '20' }]}>
                      <Ionicons name="chevron-forward" size={20} color={category.color} />
                    </View>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl * 2,
  },
  exerciseList: {
    gap: spacing.md,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
    fontFamily: fonts.headingBold,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.mutedText,
    fontFamily: fonts.regular,
  },
  exerciseCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  leftSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  middleSection: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  exerciseName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  exerciseDescription: {
    fontSize: 13,
    color: colors.mutedText,
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: fonts.bold,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.mutedText,
    fontFamily: fonts.regular,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.cardBorder,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 100,
  },
});

