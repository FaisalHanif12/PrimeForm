import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { colors, spacing, fonts, radius } from '../../../../src/theme/colors';
import { getExercise, getSportCategory } from '../../../../src/data/sportExercises';
import ExerciseAnimation from '../../../../src/components/ExerciseAnimation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ExercisePlayerPage() {
  const { categoryId, exerciseId } = useLocalSearchParams<{ categoryId: string; exerciseId: string }>();
  const exercise = getExercise(categoryId, exerciseId);
  const category = getSportCategory(categoryId);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSet, setCurrentSet] = useState(0);
  const [completedSets, setCompletedSets] = useState<number[]>([]);

  const handleBack = () => {
    router.back();
  };

  const handleStart = () => {
    setIsPlaying(true);
    setCurrentSet(0);
    setCompletedSets([]);
  };

  const handleSetComplete = (setNumber: number) => {
    if (!exercise) return;
    
    if (!completedSets.includes(setNumber)) {
      const newCompletedSets = [...completedSets, setNumber];
      setCompletedSets(newCompletedSets);
      setCurrentSet(setNumber);
      
      // Check if all sets are complete
      if (newCompletedSets.length === exercise.sets) {
        // Exercise complete!
        setTimeout(() => {
          setIsPlaying(false);
          setCurrentSet(0);
          setCompletedSets([]);
        }, 1000);
      }
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentSet(0);
    setCompletedSets([]);
  };

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

  if (!exercise || !category) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Exercise not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.surface, colors.background]}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{exercise.name}</Text>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(exercise.difficulty) }]}>
              {exercise.difficulty}
            </Text>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise Animation Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.animationSection}>
          <View style={styles.animationCard}>
            <ExerciseAnimation
              exerciseType={exercise.id}
              isVisible={true}
              style={styles.animation}
            />
          </View>

          {/* Sport Badge */}
          <View style={[styles.sportBadge, { backgroundColor: category.color }]}>
            <Text style={styles.sportIcon}>{category.icon}</Text>
          </View>
        </Animated.View>

        {/* Exercise Info Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Ionicons name="repeat-outline" size={20} color={colors.mutedText} />
              <Text style={styles.infoLabel}>Reps per set</Text>
              <Text style={styles.infoValue}>{exercise.reps}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Ionicons name="layers-outline" size={20} color={colors.mutedText} />
              <Text style={styles.infoLabel}>Total sets</Text>
              <Text style={styles.infoValue}>{exercise.sets}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Sets Tracking Section */}
        {isPlaying && (
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.setsSection}>
            <Text style={styles.setsTitle}>Complete Your Sets</Text>
            <Text style={styles.setsSubtitle}>Tap each set when you finish {exercise.reps} reps</Text>
            
            <View style={styles.setsGrid}>
              {Array.from({ length: exercise.sets }).map((_, index) => {
                const setNumber = index + 1;
                const isCompleted = completedSets.includes(setNumber);
                
                return (
                  <TouchableOpacity
                    key={setNumber}
                    style={[
                      styles.setCard,
                      isCompleted && { backgroundColor: category.color, borderColor: category.color }
                    ]}
                    onPress={() => handleSetComplete(setNumber)}
                    disabled={isCompleted}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark-circle" size={32} color={colors.white} />
                    ) : (
                      <View style={[styles.setNumberCircle, { borderColor: category.color }]}>
                        <Text style={[styles.setNumber, { color: category.color }]}>{setNumber}</Text>
                      </View>
                    )}
                    <Text style={[styles.setLabel, isCompleted && { color: colors.white }]}>
                      {isCompleted ? 'Completed' : `Set ${setNumber}`}
                    </Text>
                    <Text style={[styles.setReps, isCompleted && { color: colors.white + 'CC' }]}>
                      {exercise.reps} reps
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Control Buttons */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.controlSection}>
          {!isPlaying ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: category.color }]}
              onPress={handleStart}
            >
              <Ionicons name="play" size={28} color={colors.white} />
              <Text style={styles.primaryButtonText}>Start Exercise</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.resetButton]}
              onPress={handleReset}
            >
              <Ionicons name="refresh" size={24} color={colors.white} />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background + '80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  headerSpacer: {
    width: 40,
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
  animationSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    position: 'relative',
  },
  animationCard: {
    height: screenHeight * 0.48,
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    padding: spacing.lg,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  sportBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sportIcon: {
    fontSize: 26,
  },
  infoSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.mutedText,
    fontFamily: fonts.regular,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  infoDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.cardBorder,
  },
  setsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  setsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
    marginBottom: spacing.xs,
  },
  setsSubtitle: {
    fontSize: 13,
    color: colors.mutedText,
    fontFamily: fonts.regular,
    marginBottom: spacing.lg,
  },
  setsGrid: {
    gap: spacing.md,
  },
  setCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  setNumberCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumber: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  setLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  setReps: {
    fontSize: 13,
    color: colors.mutedText,
    fontFamily: fonts.regular,
  },
  controlSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  resetButtonText: {
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
