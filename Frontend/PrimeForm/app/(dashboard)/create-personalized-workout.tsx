import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, ZoomIn, SlideInRight } from 'react-native-reanimated';
import { colors, spacing, fonts, radius } from '../../src/theme/colors';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../src/context/ToastContext';
import { useLanguage } from '../../src/context/LanguageContext';

const { width: screenWidth } = Dimensions.get('window');

// Professional icons for exercises with variety
const exerciseIcons: Record<string, string> = {
  // Chest - Push-up variations
  'military_pushups': 'fitness-outline',
  'staggered_pushups': 'git-compare-outline',
  'wide_arm_pushup': 'expand-outline',
  'decline_pushups': 'trending-down-outline',
  'incline_pushups': 'trending-up-outline',
  'diamond_pushups': 'diamond-outline',
  
  // Back - Pull & Row exercises
  'pullups': 'arrow-up-circle-outline',
  'deadlifts': 'barbell-outline',
  'superman': 'airplane-outline',
  'rows': 'remove-outline',
  
  // Arms - Curl & Press movements
  'bicep_curls': 'refresh-outline',
  'tricep_dips': 'chevron-down-circle-outline',
  'hammer_curls': 'hammer-outline',
  'overhead_press': 'arrow-up-outline',
  'shoulder_press': 'push-outline',
  
  // Legs - Squat & Jump movements
  'squats': 'resize-outline',
  'lunges': 'walk-outline',
  'jump_squats': 'rocket-outline',
  'squat_kicks': 'tennisball-outline',
  'squat_reach': 'hand-right-outline',
  'split_jump': 'flash-outline',
  'leg_press': 'arrows-collapse-outline',
  'single_leg_rotation': 'sync-outline',
  
  // Abs - Core exercises
  'planks': 'remove-circle-outline',
  't_plank': 'git-branch-outline',
  'crunches': 'contrast-outline',
  'sit_ups': 'triangle-outline',
  'flutter_kicks': 'pulse-outline',
  'reverse_crunches': 'return-up-back-outline',
  'deadbug': 'bug-outline',
  'seated_abs_circles': 'disc-outline',
  'frog_press': 'paw-outline',
  
  // Full Body - Cardio & Compound movements
  'burpees': 'flame-outline',
  'jumping_jacks': 'star-outline',
  'running': 'speedometer-outline',
  'punches': 'hand-left-outline',
  'squat_kick': 'football-outline',
};

// All available exercises from all categories
const ALL_EXERCISES = [
  // Chest
  { id: 'military_pushups', name: 'Military Push-ups', category: 'Chest', emoji: '💪', difficulty: 'intermediate', calories: 65 },
  { id: 'staggered_pushups', name: 'Staggered Push-ups', category: 'Chest', emoji: '💪', difficulty: 'intermediate', calories: 80 },
  { id: 'wide_arm_pushup', name: 'Wide Arm Push-up', category: 'Chest', emoji: '💪', difficulty: 'beginner', calories: 55 },
  { id: 'decline_pushups', name: 'Decline Push-ups', category: 'Chest', emoji: '💪', difficulty: 'intermediate', calories: 90 },
  { id: 'incline_pushups', name: 'Incline Push-ups', category: 'Chest', emoji: '💪', difficulty: 'beginner', calories: 40 },
  { id: 'diamond_pushups', name: 'Diamond Push-ups', category: 'Chest', emoji: '💪', difficulty: 'advanced', calories: 75 },
  
  // Back
  { id: 'pullups', name: 'Pull-ups', category: 'Back', emoji: '🏋️', difficulty: 'advanced', calories: 95 },
  { id: 'deadlifts', name: 'Deadlifts', category: 'Back', emoji: '🏋️', difficulty: 'advanced', calories: 140 },
  { id: 'superman', name: 'Superman', category: 'Back', emoji: '🦸', difficulty: 'beginner', calories: 40 },
  { id: 'rows', name: 'Rows', category: 'Back', emoji: '🚣', difficulty: 'intermediate', calories: 85 },
  
  // Arms
  { id: 'bicep_curls', name: 'Bicep Curls', category: 'Arms', emoji: '💪', difficulty: 'beginner', calories: 65 },
  { id: 'tricep_dips', name: 'Tricep Dips', category: 'Arms', emoji: '💪', difficulty: 'intermediate', calories: 70 },
  { id: 'hammer_curls', name: 'Hammer Curls', category: 'Arms', emoji: '🔨', difficulty: 'beginner', calories: 68 },
  { id: 'overhead_press', name: 'Overhead Press', category: 'Arms', emoji: '🏋️', difficulty: 'intermediate', calories: 110 },
  { id: 'shoulder_press', name: 'Shoulder Press', category: 'Arms', emoji: '💪', difficulty: 'intermediate', calories: 35 },
  
  // Legs
  { id: 'squats', name: 'Squats', category: 'Legs', emoji: '🦵', difficulty: 'beginner', calories: 75 },
  { id: 'lunges', name: 'Lunges', category: 'Legs', emoji: '🦵', difficulty: 'beginner', calories: 80 },
  { id: 'jump_squats', name: 'Jump Squats', category: 'Legs', emoji: '⚡', difficulty: 'intermediate', calories: 100 },
  { id: 'squat_kicks', name: 'Squat Kicks', category: 'Legs', emoji: '🥋', difficulty: 'intermediate', calories: 85 },
  { id: 'squat_reach', name: 'Squat Reach', category: 'Legs', emoji: '🤸', difficulty: 'beginner', calories: 65 },
  { id: 'split_jump', name: 'Split Jump', category: 'Legs', emoji: '⚡', difficulty: 'advanced', calories: 95 },
  { id: 'leg_press', name: 'Leg Press', category: 'Legs', emoji: '🏋️', difficulty: 'intermediate', calories: 110 },
  { id: 'single_leg_rotation', name: 'Single Leg Rotation', category: 'Legs', emoji: '🔄', difficulty: 'intermediate', calories: 50 },
  
  // Abs
  { id: 'planks', name: 'Planks', category: 'Abs', emoji: '🏋️', difficulty: 'beginner', calories: 45 },
  { id: 't_plank', name: 'T-Plank', category: 'Abs', emoji: '🏋️', difficulty: 'intermediate', calories: 60 },
  { id: 'crunches', name: 'Crunches', category: 'Abs', emoji: '💪', difficulty: 'beginner', calories: 55 },
  { id: 'sit_ups', name: 'Sit-ups', category: 'Abs', emoji: '💪', difficulty: 'beginner', calories: 60 },
  { id: 'flutter_kicks', name: 'Flutter Kicks', category: 'Abs', emoji: '🦵', difficulty: 'intermediate', calories: 50 },
  { id: 'reverse_crunches', name: 'Reverse Crunches', category: 'Abs', emoji: '💪', difficulty: 'intermediate', calories: 55 },
  { id: 'deadbug', name: 'Dead Bug', category: 'Abs', emoji: '🐛', difficulty: 'beginner', calories: 40 },
  { id: 'seated_abs_circles', name: 'Seated Abs Circles', category: 'Abs', emoji: '🔄', difficulty: 'intermediate', calories: 50 },
  { id: 'frog_press', name: 'Frog Press', category: 'Abs', emoji: '🐸', difficulty: 'beginner', calories: 70 },
  
  // Full Body
  { id: 'burpees', name: 'Burpees', category: 'Full Body', emoji: '🔥', difficulty: 'advanced', calories: 135 },
  { id: 'jumping_jacks', name: 'Jumping Jacks', category: 'Full Body', emoji: '⭐', difficulty: 'beginner', calories: 60 },
  { id: 'running', name: 'Running in Place', category: 'Full Body', emoji: '🏃', difficulty: 'beginner', calories: 80 },
  { id: 'punches', name: 'Punches', category: 'Full Body', emoji: '🥊', difficulty: 'beginner', calories: 85 },
  { id: 'squat_kick', name: 'Squat Kick', category: 'Full Body', emoji: '🥋', difficulty: 'intermediate', calories: 90 },
];

export default function CreatePersonalizedWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { t, language, transliterateText } = useLanguage();
  const [selectedExercises, setSelectedExercises] = useState<typeof ALL_EXERCISES>([]);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [isAddingToExisting, setIsAddingToExisting] = useState(false);

  // Load existing workout if any
  useEffect(() => {
    loadExistingWorkout();
  }, []);

  const loadExistingWorkout = async () => {
    try {
      // ✅ CRITICAL: Use user-specific cache key (same as personalized-workout.tsx)
      const { getCurrentUserId, getUserCacheKey } = await import('../../src/utils/cacheKeys');
      const userId = await getCurrentUserId();
      
      const workoutKey = userId
        ? await getUserCacheKey('personalizedWorkout', userId)
        : 'personalizedWorkout';
      
      const savedWorkout = await AsyncStorage.getItem(workoutKey);
      if (savedWorkout) {
        const existing = JSON.parse(savedWorkout);
        if (existing && existing.length > 0) {
          setSelectedExercises(existing);
          setIsAddingToExisting(true);
        }
      } else {
        // Fallback: check legacy global key for migration
        const legacy = await AsyncStorage.getItem('personalizedWorkout');
        if (legacy) {
          const existing = JSON.parse(legacy);
          if (existing && existing.length > 0) {
            setSelectedExercises(existing);
            setIsAddingToExisting(true);
            // Migrate to user-specific key
            if (userId) {
              await AsyncStorage.setItem(workoutKey, legacy);
              await AsyncStorage.removeItem('personalizedWorkout');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading existing workout:', error);
    }
  };

  // Categories with translation support
  const getCategoryDisplayName = (category: string): string => {
    if (category === 'All') {
      return language === 'ur' ? t('personalized.create.filter.all') : category;
    }
    const categoryKey = category.toLowerCase().replace(' ', '_');
    const translationKey = `gym.category.${categoryKey}`;
    const translated = t(translationKey);
    // If translation exists and is different from key, use it; otherwise use original
    return translated !== translationKey ? translated : category;
  };

  const categories = ['All', 'Chest', 'Back', 'Arms', 'Legs', 'Abs', 'Full Body'];

  // Filter out already selected exercises from the display
  const availableExercises = ALL_EXERCISES.filter(
    exercise => !selectedExercises.find(selected => selected.id === exercise.id)
  );

  const filteredExercises = filterCategory === 'All' 
    ? availableExercises 
    : availableExercises.filter(ex => ex.category === filterCategory);

  const handleToggleExercise = (exercise: typeof ALL_EXERCISES[0]) => {
    // Check if exercise is already selected
    const isAlreadySelected = selectedExercises.find(selected => selected.id === exercise.id);
    if (isAlreadySelected) {
      // Don't allow removing when in add mode - just ignore
      return;
    }
    
    // Only allow adding exercises up to 8 total
    if (selectedExercises.length >= 8) {
      showToast('warning', t('personalized.create.max.exercises'));
      return;
    }
    setSelectedExercises([...selectedExercises, exercise]);
  };

  const handleSaveWorkout = async () => {
    if (selectedExercises.length === 0) {
      showToast('warning', t('personalized.create.min.exercises'));
      return;
    }

    try {
      // ✅ CRITICAL: Use user-specific cache key for account-specific data
      const { getCurrentUserId, getUserCacheKey } = await import('../../src/utils/cacheKeys');
      const userId = await getCurrentUserId();
      
      if (!userId) {
        showToast('error', t('personalized.create.auth.error'));
        return;
      }

      const personalizedWorkoutKey = await getUserCacheKey('personalizedWorkout', userId);
      await AsyncStorage.setItem(personalizedWorkoutKey, JSON.stringify(selectedExercises));
      
      // Also clear old global key if it exists (migration)
      await AsyncStorage.removeItem('personalizedWorkout');
      
      showToast('success', t('personalized.create.save.success').replace('{count}', String(selectedExercises.length)));
      // Navigate to the personalized workout screen instead of going back
      router.replace('/(dashboard)/personalized-workout');
    } catch (error) {
      showToast('error', t('personalized.create.save.error'));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return colors.primary;
      case 'intermediate': return colors.gold;
      case 'advanced': return '#FF3B30';
      default: return colors.primary;
    }
  };

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.springify()} 
          style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {isAddingToExisting ? t('personalized.create.add.more') : t('personalized.create.title')}
            </Text>
            <Text style={styles.headerSubtitle}>
              {selectedExercises.length}/8 {t('personalized.create.selected')}
            </Text>
          </View>
          <View style={styles.selectionBadge}>
            <Text style={styles.selectionBadgeText}>{selectedExercises.length}/8</Text>
          </View>
        </Animated.View>

        {/* Category Filter */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.filterSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {categories.map((category, index) => (
              <Animated.View key={category} entering={SlideInRight.delay(150 + index * 50).springify()}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setFilterCategory(category)}
                  style={[
                    styles.filterChip,
                    filterCategory === category && styles.filterChipActive
                  ]}
                >
                  <Text style={[
                    styles.filterChipText,
                    filterCategory === category && styles.filterChipTextActive
                  ]}>
                    {getCategoryDisplayName(category)}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Exercises List - Horizontal Cards */}
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {filteredExercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
              <Text style={styles.emptyStateText}>{t('personalized.create.empty.all.selected')}</Text>
              <Text style={styles.emptyStateSubtext}>
                {isAddingToExisting 
                  ? t('personalized.create.empty.add.more.text')
                  : t('personalized.create.empty.save.text')}
              </Text>
            </View>
          ) : (
            filteredExercises.map((exercise, index) => {
              return (
                <Animated.View
                  key={exercise.id}
                  entering={FadeInUp.delay(200 + index * 30).springify()}
                  style={styles.exerciseCardWrapper}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleToggleExercise(exercise)}
                    style={styles.exerciseCard}
                  >
                    <LinearGradient
                      colors={[colors.surface, colors.cardBackground] as [string, string]}
                      style={styles.exerciseCardGradient}
                    >
                      {/* Left Side - Icon */}
                      <View style={styles.exerciseIconContainer}>
                        <Ionicons 
                          name={exerciseIcons[exercise.id] as any || 'fitness-outline'} 
                          size={32} 
                          color={colors.primary} 
                        />
                      </View>

                      {/* Middle - Exercise Info */}
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName} numberOfLines={1}>
                          {language === 'ur' ? transliterateText(exercise.name) : exercise.name}
                        </Text>
                        <View style={styles.exerciseMeta}>
                          <View style={styles.categoryTag}>
                            <Text style={styles.categoryTagText}>
                              {getCategoryDisplayName(exercise.category)}
                            </Text>
                          </View>
                          <View style={[
                            styles.difficultyDot,
                            { backgroundColor: getDifficultyColor(exercise.difficulty) }
                          ]} />
                        </View>
                      </View>

                      {/* Right Side - Add Icon */}
                      <View style={styles.addIconContainer}>
                        <Ionicons name="add-circle" size={28} color={colors.primary} />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Save Button */}
        {selectedExercises.length > 0 && (
          <Animated.View 
            entering={SlideInRight.springify()} 
            style={styles.saveButtonContainer}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSaveWorkout}
              style={styles.saveButton}
            >
              <LinearGradient
                colors={[colors.primary, colors.primary + 'DD'] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={28} color={colors.white} />
                <Text style={styles.saveButtonText}>
                  {t('personalized.create.save.button')} ({selectedExercises.length})
                </Text>
                <Ionicons name="arrow-forward" size={24} color={colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  headerSubtitle: {
    color: colors.mutedText,
    fontSize: 13,
    fontFamily: fonts.body,
    marginTop: 2,
  },
  selectionBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionBadgeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },

  // Filter Section
  filterSection: {
    marginBottom: spacing.md,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary + '30',
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  filterChipTextActive: {
    color: colors.white,
  },

  // Exercises List - Horizontal Cards
  exerciseCardWrapper: {
    marginBottom: spacing.md,
  },
  exerciseCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  exerciseCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  exerciseIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.cardBackground,
  },
  categoryTagText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  difficultyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  addIconContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: spacing.xl,
  },
  emptyStateText: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.white,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.mutedText,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Save Button
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  saveButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.heading,
  },
});

