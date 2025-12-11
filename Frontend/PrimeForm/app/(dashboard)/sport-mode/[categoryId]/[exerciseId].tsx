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

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise Animation Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.animationSection}>
          {/* White Card Container with Border Radius */}
          <View style={styles.animationCard}>
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
              <Text style={styles.statusText}>{isPaused ? 'PAUSED' : 'IN PROGRESS'}</Text>
            </Animated.View>
          )}

          {/* Sport Badge */}
          <View style={[styles.sportBadge, { backgroundColor: category.color }]}>
            <Text style={styles.sportIcon}>{category.icon}</Text>
          </View>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.statsSection}>
          {/* Time & Progress */}
          <View style={styles.timeCard}>
            <View style={styles.timeHeader}>
              <View style={styles.timeInfo}>
                <Ionicons name="time-outline" size={20} color={colors.mutedText} />
                <Text style={styles.timeLabel}>Time Remaining</Text>
              </View>
              <Text style={styles.timeValue}>{formatTime(timeRemaining)}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: category.color }]} />
            </View>
          </View>

          {/* Reps & Sets Row */}
          <View style={styles.statsRow}>
            {/* Reps */}
            <View style={[styles.miniStatCard, { flex: 1 }]}>
              <View style={styles.miniStatHeader}>
                <Ionicons name="repeat-outline" size={18} color={colors.mutedText} />
                <Text style={styles.miniStatLabel}>Reps</Text>
              </View>
              <Text style={styles.miniStatValue}>{currentRep}/{exercise.reps}</Text>
              {isPlaying && !isPaused && (
                <TouchableOpacity
                  style={[styles.miniCompleteButton, { backgroundColor: category.color }]}
                  onPress={handleRepComplete}
                >
                  <Ionicons name="add" size={16} color={colors.white} />
                  <Text style={styles.miniCompleteText}>Complete</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Sets */}
            <View style={[styles.miniStatCard, { flex: 1 }]}>
              <View style={styles.miniStatHeader}>
                <Ionicons name="layers-outline" size={18} color={colors.mutedText} />
                <Text style={styles.miniStatLabel}>Sets</Text>
              </View>
              <Text style={styles.miniStatValue}>{currentSet}/{exercise.sets}</Text>
              <View style={styles.setsIndicator}>
                {Array.from({ length: exercise.sets }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.setDot,
                      { backgroundColor: index < currentSet ? category.color : colors.cardBorder }
                    ]}
                  />
                ))}
              </View>
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
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
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
  statsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  timeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeLabel: {
    fontSize: 13,
    color: colors.mutedText,
    fontFamily: fonts.regular,
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  miniStatCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  miniStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  miniStatLabel: {
    fontSize: 12,
    color: colors.mutedText,
    fontFamily: fonts.regular,
  },
  miniStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
    marginBottom: spacing.sm,
  },
  miniCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  miniCompleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.bold,
  },
  setsIndicator: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  setDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  controlSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
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
  controlRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: 16,
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
