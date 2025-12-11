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

const { width: screenWidth } = Dimensions.get('window');

// All available exercises from all categories
const ALL_EXERCISES = [
  // Chest
  { id: 'military_pushups', name: 'Military Push-ups', category: 'Chest', emoji: '💪', difficulty: 'intermediate' },
  { id: 'staggered_pushups', name: 'Staggered Push-ups', category: 'Chest', emoji: '💪', difficulty: 'intermediate' },
  { id: 'wide_arm_pushup', name: 'Wide Arm Push-up', category: 'Chest', emoji: '💪', difficulty: 'beginner' },
  { id: 'decline_pushups', name: 'Decline Push-ups', category: 'Chest', emoji: '💪', difficulty: 'intermediate' },
  { id: 'incline_pushups', name: 'Incline Push-ups', category: 'Chest', emoji: '💪', difficulty: 'beginner' },
  { id: 'diamond_pushups', name: 'Diamond Push-ups', category: 'Chest', emoji: '💪', difficulty: 'advanced' },
  
  // Back
  { id: 'pullups', name: 'Pull-ups', category: 'Back', emoji: '🏋️', difficulty: 'advanced' },
  { id: 'deadlifts', name: 'Deadlifts', category: 'Back', emoji: '🏋️', difficulty: 'advanced' },
  { id: 'superman', name: 'Superman', category: 'Back', emoji: '🦸', difficulty: 'beginner' },
  { id: 'rows', name: 'Rows', category: 'Back', emoji: '🚣', difficulty: 'intermediate' },
  
  // Arms
  { id: 'bicep_curls', name: 'Bicep Curls', category: 'Arms', emoji: '💪', difficulty: 'beginner' },
  { id: 'tricep_dips', name: 'Tricep Dips', category: 'Arms', emoji: '💪', difficulty: 'intermediate' },
  { id: 'hammer_curls', name: 'Hammer Curls', category: 'Arms', emoji: '🔨', difficulty: 'beginner' },
  { id: 'overhead_press', name: 'Overhead Press', category: 'Arms', emoji: '🏋️', difficulty: 'intermediate' },
  { id: 'shoulder_press', name: 'Shoulder Press', category: 'Arms', emoji: '💪', difficulty: 'intermediate' },
  
  // Legs
  { id: 'squats', name: 'Squats', category: 'Legs', emoji: '🦵', difficulty: 'beginner' },
  { id: 'lunges', name: 'Lunges', category: 'Legs', emoji: '🦵', difficulty: 'beginner' },
  { id: 'jump_squats', name: 'Jump Squats', category: 'Legs', emoji: '⚡', difficulty: 'intermediate' },
  { id: 'squat_kicks', name: 'Squat Kicks', category: 'Legs', emoji: '🥋', difficulty: 'intermediate' },
  { id: 'squat_reach', name: 'Squat Reach', category: 'Legs', emoji: '🤸', difficulty: 'beginner' },
  { id: 'split_jump', name: 'Split Jump', category: 'Legs', emoji: '⚡', difficulty: 'advanced' },
  { id: 'leg_press', name: 'Leg Press', category: 'Legs', emoji: '🏋️', difficulty: 'intermediate' },
  { id: 'single_leg_rotation', name: 'Single Leg Rotation', category: 'Legs', emoji: '🔄', difficulty: 'intermediate' },
  
  // Abs
  { id: 'planks', name: 'Planks', category: 'Abs', emoji: '🏋️', difficulty: 'beginner' },
  { id: 't_plank', name: 'T-Plank', category: 'Abs', emoji: '🏋️', difficulty: 'intermediate' },
  { id: 'crunches', name: 'Crunches', category: 'Abs', emoji: '💪', difficulty: 'beginner' },
  { id: 'sit_ups', name: 'Sit-ups', category: 'Abs', emoji: '💪', difficulty: 'beginner' },
  { id: 'flutter_kicks', name: 'Flutter Kicks', category: 'Abs', emoji: '🦵', difficulty: 'intermediate' },
  { id: 'reverse_crunches', name: 'Reverse Crunches', category: 'Abs', emoji: '💪', difficulty: 'intermediate' },
  { id: 'deadbug', name: 'Dead Bug', category: 'Abs', emoji: '🐛', difficulty: 'beginner' },
  { id: 'seated_abs_circles', name: 'Seated Abs Circles', category: 'Abs', emoji: '🔄', difficulty: 'intermediate' },
  { id: 'frog_press', name: 'Frog Press', category: 'Abs', emoji: '🐸', difficulty: 'beginner' },
  
  // Full Body
  { id: 'burpees', name: 'Burpees', category: 'Full Body', emoji: '🔥', difficulty: 'advanced' },
  { id: 'jumping_jacks', name: 'Jumping Jacks', category: 'Full Body', emoji: '⭐', difficulty: 'beginner' },
  { id: 'running', name: 'Running in Place', category: 'Full Body', emoji: '🏃', difficulty: 'beginner' },
  { id: 'punches', name: 'Punches', category: 'Full Body', emoji: '🥊', difficulty: 'beginner' },
  { id: 'squat_kick', name: 'Squat Kick', category: 'Full Body', emoji: '🥋', difficulty: 'intermediate' },
];

export default function CreatePersonalizedWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [selectedExercises, setSelectedExercises] = useState<typeof ALL_EXERCISES>([]);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const categories = ['All', 'Chest', 'Back', 'Arms', 'Legs', 'Abs', 'Full Body'];

  const filteredExercises = filterCategory === 'All' 
    ? ALL_EXERCISES 
    : ALL_EXERCISES.filter(ex => ex.category === filterCategory);

  const handleToggleExercise = (exercise: typeof ALL_EXERCISES[0]) => {
    if (selectedExercises.find(ex => ex.id === exercise.id)) {
      // Remove from selection
      setSelectedExercises(selectedExercises.filter(ex => ex.id !== exercise.id));
    } else {
      // Add to selection (max 8)
      if (selectedExercises.length >= 8) {
        showToast('warning', 'You can select maximum 8 exercises');
        return;
      }
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const handleSaveWorkout = async () => {
    if (selectedExercises.length === 0) {
      showToast('warning', 'Please select at least one exercise');
      return;
    }

    try {
      await AsyncStorage.setItem('personalizedWorkout', JSON.stringify(selectedExercises));
      showToast('success', `Your personalized workout with ${selectedExercises.length} exercises is ready!`);
      router.back();
    } catch (error) {
      showToast('error', 'Failed to save workout. Please try again.');
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
            <Text style={styles.headerTitle}>Create Your Workout</Text>
            <Text style={styles.headerSubtitle}>Select up to 8 exercises</Text>
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
                    {category}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Exercises Grid */}
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.exercisesGrid}>
            {filteredExercises.map((exercise, index) => {
              const isSelected = !!selectedExercises.find(ex => ex.id === exercise.id);
              
              return (
                <Animated.View
                  key={exercise.id}
                  entering={ZoomIn.delay(200 + index * 50).springify()}
                  style={styles.exerciseCardWrapper}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleToggleExercise(exercise)}
                    style={[
                      styles.exerciseCard,
                      isSelected && styles.exerciseCardSelected
                    ]}
                  >
                    <LinearGradient
                      colors={
                        isSelected 
                          ? [colors.primary + '30', colors.primary + '20'] as [string, string]
                          : [colors.surface, colors.cardBackground] as [string, string]
                      }
                      style={styles.exerciseCardGradient}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <View style={styles.selectionIndicator}>
                          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                        </View>
                      )}

                      {/* Exercise Emoji */}
                      <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
                      
                      {/* Exercise Name */}
                      <Text style={styles.exerciseName} numberOfLines={2}>
                        {exercise.name}
                      </Text>
                      
                      {/* Category Tag */}
                      <View style={styles.categoryTag}>
                        <Text style={styles.categoryTagText}>{exercise.category}</Text>
                      </View>

                      {/* Difficulty Dot */}
                      <View style={[
                        styles.difficultyDot,
                        { backgroundColor: getDifficultyColor(exercise.difficulty) }
                      ]} />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

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
                  Save My Workout ({selectedExercises.length})
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

  // Exercises Grid
  exercisesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  exerciseCardWrapper: {
    width: (screenWidth - spacing.lg * 2 - spacing.md) / 2,
  },
  exerciseCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  exerciseCardSelected: {
    borderColor: colors.primary,
  },
  exerciseCardGradient: {
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
    position: 'relative',
  },
  selectionIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 10,
  },
  exerciseEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  exerciseName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  categoryTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.cardBackground,
    marginBottom: spacing.xs,
  },
  categoryTagText: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: spacing.xs,
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

