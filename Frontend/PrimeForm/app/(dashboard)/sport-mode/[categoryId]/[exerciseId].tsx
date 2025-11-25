import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../../../src/theme/colors';
import { getExercise, getSportCategory } from '../../../../src/data/sportExercises';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ExercisePlayerPage() {
  const { categoryId, exerciseId } = useLocalSearchParams<{ categoryId: string; exerciseId: string }>();
  const exercise = getExercise(categoryId, exerciseId);
  const category = getSportCategory(categoryId);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(exercise?.duration || 0);
  const [showInstructions, setShowInstructions] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      // Start timer
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSetComplete();
            return exercise?.duration || 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start animation
      startExerciseAnimation();
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, isPaused]);

  const startExerciseAnimation = () => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    rotation.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 500 }),
        withTiming(-10, { duration: 1000 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      false
    );
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  const handleBack = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    router.back();
  };

  const handleStart = () => {
    setShowInstructions(false);
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentRep(0);
    setCurrentSet(1);
    setTimeRemaining(exercise?.duration || 0);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentRep(0);
    setCurrentSet(1);
    setTimeRemaining(exercise?.duration || 0);
    setShowInstructions(true);
  };

  const handleRepComplete = () => {
    if (!exercise) return;
    
    if (currentRep < exercise.reps) {
      setCurrentRep(currentRep + 1);
    }
  };

  const handleSetComplete = () => {
    if (!exercise) return;

    if (currentSet < exercise.sets) {
      setCurrentSet(currentSet + 1);
      setCurrentRep(0);
      setIsPaused(true);
      // Auto-resume after 30 seconds rest
      setTimeout(() => {
        setIsPaused(false);
      }, 30000);
    } else {
      // Exercise complete!
      setIsPlaying(false);
      setIsPaused(false);
      alert('🎉 Exercise Complete! Great work!');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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

  const progress = exercise ? ((exercise.duration - timeRemaining) / exercise.duration) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>{exercise.name}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise Animation Display */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.animationContainer}>
          <LinearGradient
            colors={[category.color + '20', category.color + '10']}
            style={styles.animationGradient}
          >
            <Animated.View style={[styles.exerciseIcon, animatedStyle]}>
              <Text style={styles.exerciseIconText}>{category.icon}</Text>
            </Animated.View>

            {isPlaying && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {isPaused ? '⏸ PAUSED' : '▶ TRAINING'}
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Timer & Stats */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={32} color={colors.primary} />
            <Text style={styles.statValue}>{formatTime(timeRemaining)}</Text>
            <Text style={styles.statLabel}>Time Remaining</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: category.color }]} />
            </View>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="repeat-outline" size={32} color={colors.blue} />
            <Text style={styles.statValue}>{currentRep}/{exercise.reps}</Text>
            <Text style={styles.statLabel}>Reps</Text>
            <TouchableOpacity
              style={[styles.repButton, { backgroundColor: colors.blue + '20' }]}
              onPress={handleRepComplete}
              disabled={!isPlaying || isPaused}
            >
              <Text style={[styles.repButtonText, { color: colors.blue }]}>Complete Rep</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="layers-outline" size={32} color={colors.gold} />
            <Text style={styles.statValue}>{currentSet}/{exercise.sets}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
        </Animated.View>

        {/* Controls */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.controls}>
          {!isPlaying ? (
            <TouchableOpacity
              style={[styles.controlButton, styles.startButton, { backgroundColor: category.color }]}
              onPress={handleStart}
            >
              <Ionicons name="play" size={28} color={colors.white} />
              <Text style={styles.controlButtonText}>Start Exercise</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.controlButton, styles.pauseButton]}
                onPress={handlePause}
              >
                <Ionicons name={isPaused ? 'play' : 'pause'} size={24} color={colors.white} />
                <Text style={styles.controlButtonTextSmall}>{isPaused ? 'Resume' : 'Pause'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.resetButton]}
                onPress={handleReset}
              >
                <Ionicons name="refresh" size={24} color={colors.white} />
                <Text style={styles.controlButtonTextSmall}>Reset</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        {/* Exercise Details */}
        {showInstructions && (
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.detailsSection}>
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Ionicons name="information-circle" size={24} color={colors.primary} />
                <Text style={styles.detailTitle}>About This Exercise</Text>
              </View>
              <Text style={styles.detailText}>{exercise.description}</Text>

              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }]}>
                <Text style={[styles.difficultyText, { color: getDifficultyColor(exercise.difficulty) }]}>
                  Difficulty: {exercise.difficulty}
                </Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Ionicons name="list" size={24} color={colors.primary} />
                <Text style={styles.detailTitle}>Instructions</Text>
              </View>
              {exercise.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>

            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Ionicons name="fitness" size={24} color={colors.primary} />
                <Text style={styles.detailTitle}>Target Muscles</Text>
              </View>
              <View style={styles.muscleChips}>
                {exercise.muscles.map((muscle, index) => (
                  <View key={index} style={styles.muscleChip}>
                    <Text style={styles.muscleChipText}>{muscle}</Text>
                  </View>
                ))}
              </View>
            </View>

            {exercise.equipment.length > 0 && (
              <View style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Ionicons name="barbell" size={24} color={colors.primary} />
                  <Text style={styles.detailTitle}>Equipment Needed</Text>
                </View>
                <View style={styles.equipmentList}>
                  {exercise.equipment.map((item, index) => (
                    <View key={index} style={styles.equipmentItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      <Text style={styles.equipmentText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        )}
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
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  animationContainer: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    margin: spacing.lg,
  },
  animationGradient: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  exerciseIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  exerciseIconText: {
    fontSize: 80,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginTop: spacing.xs,
    fontFamily: fonts.bold,
  },
  statLabel: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
    fontFamily: fonts.regular,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.background,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  repButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  repButtonText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startButton: {
    flex: 1,
  },
  pauseButton: {
    backgroundColor: colors.blue,
  },
  resetButton: {
    backgroundColor: colors.cardBorder,
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  controlButtonTextSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    fontFamily: fonts.semiBold,
  },
  detailsSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  detailText: {
    fontSize: 15,
    color: colors.mutedText,
    lineHeight: 22,
    marginBottom: spacing.md,
    fontFamily: fonts.regular,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: fonts.bold,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: colors.mutedText,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  muscleChip: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  muscleChipText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  equipmentList: {
    gap: spacing.sm,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  equipmentText: {
    fontSize: 14,
    color: colors.mutedText,
    fontFamily: fonts.regular,
  },
  errorText: {
    fontSize: 16,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 100,
  },
});

