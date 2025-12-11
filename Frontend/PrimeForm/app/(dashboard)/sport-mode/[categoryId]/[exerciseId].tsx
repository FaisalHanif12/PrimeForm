import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
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
  const [isPaused, setIsPaused] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(exercise?.duration || 0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSetComplete();
            return exercise?.duration || 0;
          }
          return prev - 1;
        });
      }, 1000);
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

  const handleBack = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    router.back();
  };

  const handleStart = () => {
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
      setTimeout(() => {
        setIsPaused(false);
      }, 30000);
    } else {
      setIsPlaying(false);
      setIsPaused(false);
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

      {/* Exercise Animation - Full Screen */}
      <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.animationSection}>
        <LinearGradient
          colors={[category.color + '15', colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.animationGradient}
        >
          {/* Exercise Animation */}
          <View style={styles.animationWrapper}>
            <ExerciseAnimation
              exerciseType={exercise.id}
              isVisible={true}
              style={styles.animation}
            />
          </View>

          {/* Status Badge */}
          {isPlaying && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: isPaused ? '#FF9800' : colors.primary }]} />
              <Text style={styles.statusText}>{isPaused ? 'PAUSED' : 'TRAINING'}</Text>
            </Animated.View>
          )}

          {/* Sport Badge */}
          <View style={[styles.sportBadge, { backgroundColor: category.color }]}>
            <Text style={styles.sportIcon}>{category.icon}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Stats Section */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.statsSection}>
        <View style={styles.statsGrid}>
          {/* Time Card */}
          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="time" size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{formatTime(timeRemaining)}</Text>
            <Text style={styles.statLabel}>TIME</Text>
            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: category.color }]} />
            </View>
          </View>

          {/* Reps Card */}
          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.blue + '20' }]}>
              <Ionicons name="repeat" size={24} color={colors.blue} />
            </View>
            <Text style={styles.statValue}>{currentRep}/{exercise.reps}</Text>
            <Text style={styles.statLabel}>REPS</Text>
            <TouchableOpacity
              style={[styles.completeButton, { backgroundColor: colors.blue + '25' }]}
              onPress={handleRepComplete}
              disabled={!isPlaying || isPaused}
            >
              <Text style={[styles.completeButtonText, { color: colors.blue }]}>+1</Text>
            </TouchableOpacity>
          </View>

          {/* Sets Card */}
          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.gold + '20' }]}>
              <Ionicons name="layers" size={24} color={colors.gold} />
            </View>
            <Text style={styles.statValue}>{currentSet}/{exercise.sets}</Text>
            <Text style={styles.statLabel}>SETS</Text>
          </View>
        </View>
      </Animated.View>

      {/* Control Buttons */}
      <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.controlSection}>
        {!isPlaying ? (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: category.color }]}
            onPress={handleStart}
          >
            <Ionicons name="play" size={28} color={colors.white} />
            <Text style={styles.primaryButtonText}>Start Exercise</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: isPaused ? colors.primary : '#FF9800' }]}
              onPress={handlePause}
            >
              <Ionicons name={isPaused ? 'play' : 'pause'} size={24} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: '#FF6B6B' }]}
              onPress={handleReset}
            >
              <Ionicons name="refresh" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
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
    height: screenHeight * 0.45,
    borderRadius: radius.xl,
    margin: spacing.lg,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  animationGradient: {
    flex: 1,
    position: 'relative',
  },
  animationWrapper: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
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
    backgroundColor: colors.surface + 'EE',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    elevation: 4,
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
    letterSpacing: 1,
  },
  sportBadge: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  sportIcon: {
    fontSize: 28,
  },
  statsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.xs,
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  statLabel: {
    fontSize: 10,
    color: colors.mutedText,
    fontFamily: fonts.regular,
    letterSpacing: 1,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.background,
    borderRadius: 2,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  completeButton: {
    marginTop: spacing.xs,
    width: '100%',
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  controlSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
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
  controlRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  errorText: {
    fontSize: 16,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 100,
  },
});
