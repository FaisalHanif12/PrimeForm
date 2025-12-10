import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, FadeIn, SlideInDown } from 'react-native-reanimated';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fonts, radius } from '../../src/theme/colors';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import { useLanguage } from '../../src/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import ExerciseAnimation from '../../src/components/ExerciseAnimation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface ExerciseLevel {
  level: DifficultyLevel;
  title: string;
  sets: number;
  repsPerSet: string;
  description: string;
}

const getExerciseLevels = (exerciseId: string): ExerciseLevel[] => {
  const baseExercises: Record<string, ExerciseLevel[]> = {
    pushups: [
      {
        level: 'easy',
        title: 'Easy',
        sets: 2,
        repsPerSet: '8-12',
        description: 'Perfect for beginners starting their fitness journey'
      },
      {
        level: 'medium',
        title: 'Medium',
        sets: 4,
        repsPerSet: '15-20',
        description: 'Ideal for intermediate level with moderate challenge'
      },
      {
        level: 'hard',
        title: 'Hard',
        sets: 6,
        repsPerSet: '20-30',
        description: 'Advanced level for experienced athletes'
      }
    ],
    squats: [
      {
        level: 'easy',
        title: 'Easy',
        sets: 2,
        repsPerSet: '12-15',
        description: 'Perfect for beginners starting their fitness journey'
      },
      {
        level: 'medium',
        title: 'Medium',
        sets: 4,
        repsPerSet: '20-25',
        description: 'Ideal for intermediate level with moderate challenge'
      },
      {
        level: 'hard',
        title: 'Hard',
        sets: 6,
        repsPerSet: '30-40',
        description: 'Advanced level for experienced athletes'
      }
    ],
  };
  
  return baseExercises[exerciseId] || baseExercises['pushups'];
};

const getExerciseVideo = (exerciseId: string): string => {
  const videos: Record<string, string> = {
    pushups: 'https://www.w3schools.com/html/mov_bbb.mp4',
    squats: 'https://www.w3schools.com/html/mov_bbb.mp4',
  };
  return videos[exerciseId] || videos['pushups'];
};

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>('medium');
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [showFullscreenVideo, setShowFullscreenVideo] = useState(false);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [isBreakTime, setIsBreakTime] = useState(false);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(30); // 30 seconds break

  const exerciseId = params.exerciseId as string || 'pushups';
  const exerciseName = params.exerciseName as string || 'Push-ups';
  const exerciseEmoji = params.exerciseEmoji as string || '💪';
  const category = params.category as string || 'chest';

  const exerciseLevels = getExerciseLevels(exerciseId);
  const currentLevel = exerciseLevels.find(level => level.level === selectedLevel) || exerciseLevels[0];
  const videoUrl = getExerciseVideo(exerciseId);

  const handleBack = () => {
    router.back();
  };

  const handleStartWorkout = () => {
    setIsWorkoutStarted(true);
    setCurrentSet(1);
    setIsBreakTime(false);
  };

  const handleCompleteSet = () => {
    if (currentSet < currentLevel.sets) {
      // Start break time
      setIsBreakTime(true);
      setBreakTimeRemaining(30);
      
      // Start countdown
      const interval = setInterval(() => {
        setBreakTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Move to next set
            setCurrentSet((prevSet) => prevSet + 1);
            setIsBreakTime(false);
            setBreakTimeRemaining(30);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Workout complete
      setIsWorkoutStarted(false);
      setCurrentSet(1);
      setIsBreakTime(false);
    }
  };

  const handleSkipBreak = () => {
    setCurrentSet((prevSet) => prevSet + 1);
    setIsBreakTime(false);
    setBreakTimeRemaining(30);
  };

  const handleStopWorkout = () => {
    setIsWorkoutStarted(false);
    setCurrentSet(1);
    setIsBreakTime(false);
    setBreakTimeRemaining(30);
  };

    const getDifficultyColor = () => {
    switch (selectedLevel) {
      case 'easy': return colors.primary;
      case 'medium': return colors.gold;
      case 'hard': return '#FF3B30';
      default: return colors.primary;
    }
  };

  const getLevelIcon = (level: DifficultyLevel) => {
    switch (level) {
      case 'easy': return 'leaf-outline';
      case 'medium': return 'flash-outline';
      case 'hard': return 'flame-outline';
      default: return 'fitness-outline';
    }
  };

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerCategory}>{category.toUpperCase()}</Text>
          </View>

          <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.8}>
            <Ionicons name="heart-outline" size={24} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Card with Animation & Exercise Info */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.heroCard}>
            <LinearGradient
              colors={[colors.surface, colors.surface]}
              style={styles.heroCardGradient}
            >
              {/* Exercise Animation Section */}
              <View style={styles.animationSection}>
                {/* Fullscreen Button */}
                <TouchableOpacity 
                  style={styles.fullscreenIconButton}
                  onPress={() => setShowFullscreenVideo(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.fullscreenIconBox}>
                    <Ionicons name="expand-outline" size={22} color={colors.white} />
                  </View>
                </TouchableOpacity>
                
                {/* Exercise Icon & Title - Centered */}
                <View style={styles.exerciseContentCenter}>
                  <View style={styles.exerciseIconRow}>
                    <Text style={styles.exerciseEmoji}>{exerciseEmoji}</Text>
            </View>
                  <Text style={styles.exerciseTitle}>{exerciseName}</Text>
                  <Text style={styles.exerciseSubtitle}>Exercise in progress</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Workout Tracker - Show when workout started */}
          {isWorkoutStarted ? (
            <Animated.View entering={FadeInUp.springify()} style={styles.workoutTrackerSection}>
              {/* Workout Progress Header */}
              <View style={styles.workoutHeader}>
                <View style={styles.workoutHeaderLeft}>
                  <Ionicons name="fitness" size={24} color={colors.primary} />
                  <Text style={styles.workoutHeaderTitle}>Workout in Progress</Text>
                </View>
                <TouchableOpacity onPress={handleStopWorkout} style={styles.stopButton}>
                  <Ionicons name="stop-circle-outline" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>

              {/* Set Progress Card */}
              <View style={styles.setProgressCard}>
                <LinearGradient
                  colors={[colors.primary + '20', colors.primary + '10'] as [string, string]}
                  style={styles.setProgressGradient}
                >
                  <Text style={styles.setProgressLabel}>
                    {isBreakTime ? 'Break Time' : `Set ${currentSet} of ${currentLevel.sets}`}
                  </Text>
                  <Text style={styles.setProgressValue}>
                    {isBreakTime ? `${breakTimeRemaining}s` : `${currentLevel.repsPerSet} reps`}
                  </Text>
                  <Text style={styles.setProgressSubtext}>
                    {isBreakTime ? 'Rest and recover' : 'Complete this set'}
                  </Text>

                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${(currentSet / currentLevel.sets) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {currentSet} / {currentLevel.sets} sets completed
                  </Text>
                </LinearGradient>
              </View>

              {/* Action Button */}
              {isBreakTime ? (
                <View style={styles.breakActions}>
                  <TouchableOpacity
                    style={styles.skipBreakButton}
                    onPress={handleSkipBreak}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[colors.gold, colors.gold + 'CC'] as [string, string]}
                      style={styles.skipBreakGradient}
                    >
                      <Ionicons name="play-skip-forward" size={22} color={colors.white} />
                      <Text style={styles.skipBreakText}>Skip Break</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.completeSetButton}
                  onPress={handleCompleteSet}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primary + 'CC'] as [string, string]}
                    style={styles.completeSetGradient}
                  >
                    <Ionicons name="checkmark-circle" size={28} color={colors.white} />
                    <Text style={styles.completeSetText}>
                      {currentSet === currentLevel.sets ? 'Finish Workout' : 'Complete Set'}
                    </Text>
                    <Ionicons name="arrow-forward" size={24} color={colors.white} />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </Animated.View>
          ) : (
            /* Difficulty Selector - Show when workout not started */
            <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.selectorSection}>
            <View style={styles.selectorHeader}>
              <Ionicons name="speedometer-outline" size={22} color={colors.primary} />
              <Text style={styles.selectorTitle}>Choose Your Level</Text>
              <View style={styles.levelIndicators}>
                <View style={[styles.levelDot, { backgroundColor: colors.primary }]} />
                <View style={[styles.levelDot, { backgroundColor: colors.gold }]} />
                <View style={[styles.levelDot, { backgroundColor: '#FF3B30' }]} />
            </View>
            </View>

            {/* Dropdown Selector - Always Green */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setShowLevelPicker(!showLevelPicker)}
              style={styles.dropdownButton}
            >
              <LinearGradient
                colors={[colors.primary + '25', colors.primary + '15'] as [string, string]}
                style={styles.dropdownGradient}
              >
                <View style={styles.dropdownLeft}>
                  <View style={[styles.levelIconBox, { backgroundColor: colors.primary + '35' }]}>
                    <Ionicons name={getLevelIcon(selectedLevel) as any} size={24} color={colors.primary} />
            </View>
                  <View style={styles.dropdownInfo}>
                    <Text style={styles.dropdownLabel}>{currentLevel.title}</Text>
                    <Text style={styles.dropdownSubtext}>{currentLevel.description}</Text>
                  </View>
                </View>
                <Ionicons 
                  name={showLevelPicker ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color={colors.mutedText} 
                />
              </LinearGradient>
            </TouchableOpacity>

            {/* Dropdown Options */}
            {showLevelPicker && (
              <Animated.View entering={SlideInDown.springify()} style={styles.dropdownOptions}>
                {exerciseLevels.map((level) => {
                  const isSelected = selectedLevel === level.level;
                  const levelColor = level.level === 'easy' ? colors.primary : level.level === 'medium' ? colors.gold : '#FF3B30';
                  
                  return (
                    <TouchableOpacity
                      key={level.level}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedLevel(level.level);
                        setShowLevelPicker(false);
                      }}
                      style={[
                        styles.dropdownOption,
                        isSelected && { borderColor: levelColor, borderWidth: 2 }
                      ]}
                    >
                      <LinearGradient
                        colors={isSelected ? [levelColor + '25', levelColor + '15'] as [string, string] : [colors.background, colors.background] as [string, string]}
                        style={styles.dropdownOptionGradient}
                      >
                        <View style={styles.optionLeft}>
                          <View style={[styles.optionDot, { backgroundColor: levelColor }]} />
                          <Text style={[styles.optionTitle, isSelected && { color: colors.white }]}>
                            {level.title}
                          </Text>
              </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={24} color={levelColor} />
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
          </Animated.View>
            )}

            {/* Workout Details Card */}
            <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.detailsCard}>
              <LinearGradient
                colors={[colors.surface, colors.surface]}
                style={styles.detailsGradient}
              >
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <View style={[styles.detailIconBox, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="repeat" size={28} color={colors.primary} />
              </View>
                    <Text style={styles.detailValue}>{currentLevel.sets}</Text>
                    <Text style={styles.detailLabel}>Sets</Text>
            </View>

                  <View style={styles.detailDivider} />

                  <View style={styles.detailItem}>
                    <View style={[styles.detailIconBox, { backgroundColor: colors.gold + '20' }]}>
                      <Ionicons name="fitness" size={28} color={colors.gold} />
                </View>
                    <Text style={styles.detailValue}>{currentLevel.repsPerSet}</Text>
                    <Text style={styles.detailLabel}>Reps per Set</Text>
            </View>
              </View>
              </LinearGradient>
            </Animated.View>
          </Animated.View>
          )}
        </ScrollView>

        {/* Start Workout Button - Always Green - Only show when workout not started */}
        {!isWorkoutStarted && (
          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.startButtonContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleStartWorkout}
            style={styles.startButton}
          >
            <LinearGradient
              colors={[colors.primary, colors.primary + 'CC'] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startButtonGradient}
            >
              <Ionicons name="play-circle" size={28} color={colors.white} />
              <Text style={styles.startButtonText}>Start Workout</Text>
              <Ionicons name="arrow-forward" size={24} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        )}

        {/* Fullscreen Video Modal */}
        <Modal
          visible={showFullscreenVideo}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setShowFullscreenVideo(false)}
        >
          <View style={styles.fullscreenModal}>
            <TouchableOpacity 
              style={styles.closeFullscreenButton}
              onPress={() => setShowFullscreenVideo(false)}
            >
              <Ionicons name="close" size={32} color={colors.white} />
            </TouchableOpacity>
            <Video
              source={{ uri: videoUrl }}
              style={styles.fullscreenVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
            />
          </View>
        </Modal>
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
    paddingBottom: 100,
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
  headerCategory: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    letterSpacing: 0.5,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  // Hero Card with Animation
  heroCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  heroCardGradient: {
    overflow: 'hidden',
  },
  animationSection: {
    height: 340,
    backgroundColor: colors.background,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenIconButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
  },
  fullscreenIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(18, 20, 26, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  exerciseContentCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIconRow: {
    marginBottom: spacing.sm,
  },
  exerciseEmoji: {
    fontSize: 48,
  },
  exerciseTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  exerciseSubtitle: {
    fontSize: 14,
    color: colors.mutedText,
    fontFamily: fonts.body,
  },

  // Selector Section
  selectorSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  selectorTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.heading,
  },
  levelIndicators: {
    flexDirection: 'row',
    gap: 6,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Dropdown Selector
  dropdownButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  dropdownGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  levelIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownInfo: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.heading,
    marginBottom: 2,
  },
  dropdownSubtext: {
    fontSize: 12,
    color: colors.mutedText,
    fontFamily: fonts.body,
  },

  // Dropdown Options
  dropdownOptions: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dropdownOption: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dropdownOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.mutedText,
    fontFamily: fonts.heading,
  },

  // Details Card
  detailsCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  detailsGradient: {
    padding: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  detailValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    fontFamily: fonts.heading,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.mutedText,
    fontFamily: fonts.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.cardBorder,
  },

  // Workout Tracker Styles
  workoutTrackerSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  workoutHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  workoutHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.heading,
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  setProgressCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  setProgressGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  setProgressLabel: {
    fontSize: 14,
    color: colors.mutedText,
    fontFamily: fonts.body,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  setProgressValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.white,
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  setProgressSubtext: {
    fontSize: 16,
    color: colors.mutedText,
    fontFamily: fonts.body,
    marginBottom: spacing.lg,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: colors.mutedText,
    fontFamily: fonts.body,
  },
  breakActions: {
    gap: spacing.md,
  },
  skipBreakButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  skipBreakGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  skipBreakText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    fontFamily: fonts.heading,
  },
  completeSetButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  completeSetGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  completeSetText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.heading,
  },

  // Start Button
  startButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  startButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.heading,
  },

  // Fullscreen Modal
  fullscreenModal: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFullscreenButton: {
    position: 'absolute',
    top: 50,
    right: spacing.lg,
    zIndex: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenVideo: {
    width: screenWidth,
    height: screenHeight,
  },
});
