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
  FadeIn,
} from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../../../src/theme/colors';
import { getExercise, getSportCategory } from '../../../../src/data/sportExercises';
import ExerciseAnimation from '../../../../src/components/ExerciseAnimation';

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
            colors={[category.color + '30', category.color + '15', colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.animationGradient}
          >
            {/* Live Exercise Animation */}
            <View style={styles.liveAnimationWrapper}>
              <ExerciseAnimation
                exerciseType={exercise.id}
                isVisible={true}
                style={styles.liveAnimation}
              />
            </View>

            {/* Status & Title Overlay */}
            {isPlaying && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.statusBadge}>
                <View style={[styles.statusDot, { 
                  backgroundColor: isPaused ? '#FF9800' : colors.primary 
                }]} />
                <Text style={styles.statusText}>
                  {isPaused ? 'PAUSED' : 'IN PROGRESS'}
                </Text>
              </Animated.View>
            )}

            {/* Sport Icon Badge */}
            <View style={[styles.sportBadge, { backgroundColor: category.color }]}>
              <Text style={styles.sportIcon}>{category.icon}</Text>
            </View>
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
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  animationGradient: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: spacing.xl,
  },
  liveAnimationWrapper: {
    width: '80%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveAnimation: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface + 'CC',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  sportBadge: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sportIcon: {
    fontSize: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.white,
    marginTop: spacing.sm,
    fontFamily: fonts.bold,
  },
  statLabel: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 4,
    fontFamily: fonts.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  repButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  repButtonText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  startButton: {
    flex: 1,
  },
  pauseButton: {
    backgroundColor: colors.blue,
  },
  resetButton: {
    backgroundColor: '#FF6B6B',
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  controlButtonTextSmall: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  detailsSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  detailTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  detailText: {
    fontSize: 15,
    color: colors.mutedText,
    lineHeight: 23,
    marginBottom: spacing.lg,
    fontFamily: fonts.regular,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
    lineHeight: 21,
    fontFamily: fonts.regular,
  },
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  muscleChip: {
    backgroundColor: colors.primary + '25',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '50',
  },
  muscleChipText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    fontFamily: fonts.bold,
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

