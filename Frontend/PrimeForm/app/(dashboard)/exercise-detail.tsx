import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, FadeIn, SlideInRight } from 'react-native-reanimated';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fonts, radius } from '../../src/theme/colors';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import { useLanguage } from '../../src/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import ExerciseAnimation from '../../src/components/ExerciseAnimation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type DifficultyLevel = 'beginner' | 'medium' | 'advanced';

interface ExerciseLevel {
  level: DifficultyLevel;
  title: string;
  duration: string;
  reps: string;
  sets: string;
  description: string;
  emoji: string;
}

const getExerciseLevels = (exerciseId: string): ExerciseLevel[] => {
  const baseExercises: Record<string, ExerciseLevel[]> = {
    pushups: [
      {
        level: 'beginner',
        title: 'Knee Push-ups',
        duration: '10-15 minutes',
        reps: '5-8',
        sets: '2-3',
        description: 'Start with knee push-ups to build basic strength. Keep your body straight from knees to head.',
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Standard Push-ups',
        duration: '15-20 minutes',
        reps: '8-12',
        sets: '3-4',
        description: 'Classic push-ups with proper form. Maintain straight line from head to heels.',
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Diamond Push-ups',
        duration: '20-25 minutes',
        reps: '10-15',
        sets: '4-5',
        description: 'Advanced variation targeting triceps. Form diamond shape with hands under chest.',
        emoji: '🔴'
      }
    ],
    squats: [
      {
        level: 'beginner',
        title: 'Bodyweight Squats',
        duration: '10-15 minutes',
        reps: '8-12',
        sets: '2-3',
        description: 'Basic squat movement focusing on proper form and depth.',
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Jump Squats',
        duration: '15-20 minutes',
        reps: '10-15',
        sets: '3-4',
        description: 'Add explosive jump to increase intensity and power.',
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Pistol Squats',
        duration: '20-25 minutes',
        reps: '5-8 each leg',
        sets: '4-5',
        description: 'Single-leg squat requiring balance, strength, and flexibility.',
        emoji: '🔴'
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
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showFullscreenVideo, setShowFullscreenVideo] = useState(false);

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
    // Navigate to workout player
    router.push({
      pathname: '/workout-player',
      params: {
        exerciseId,
        exerciseName,
        level: selectedLevel,
      }
    });
  };

    const getDifficultyColor = () => {
    switch (selectedLevel) {
      case 'beginner': return colors.primary;
      case 'medium': return colors.gold;
      case 'advanced': return '#FF3B30';
      default: return colors.primary;
    }
  };

  const renderDifficultyButton = (level: ExerciseLevel, index: number) => {
    const isSelected = selectedLevel === level.level;
    const levelColor = level.level === 'beginner' ? colors.primary : level.level === 'medium' ? colors.gold : '#FF3B30';

    return (
      <Animated.View 
        key={level.level}
        entering={SlideInRight.delay(100 * index).springify()}
        style={styles.levelButtonWrapper}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedLevel(level.level)}
        style={[
            styles.levelButton,
            isSelected && { borderColor: levelColor, borderWidth: 2 }
        ]}
      >
        <LinearGradient
            colors={isSelected ? [levelColor + '30', levelColor + '15'] : [colors.surface, colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
            style={styles.levelButtonGradient}
          >
            <View style={styles.levelButtonContent}>
              <View style={styles.levelHeaderRow}>
                <View style={[styles.levelDotLarge, { backgroundColor: levelColor }]} />
                <Text style={[styles.levelTitle, isSelected && { color: colors.white }]}>
              {level.title}
            </Text>
          </View>

              <Text style={styles.levelDescription} numberOfLines={2}>
                {level.description}
              </Text>

              <View style={styles.levelStatsRow}>
                <View style={styles.levelStat}>
                  <Ionicons name="time-outline" size={14} color={levelColor} />
                  <Text style={styles.levelStatText}>{level.duration}</Text>
                </View>
                <View style={styles.levelStat}>
                  <Ionicons name="repeat-outline" size={14} color={levelColor} />
                  <Text style={styles.levelStatText}>{level.sets} sets</Text>
                </View>
                <View style={styles.levelStat}>
                  <Ionicons name="fitness-outline" size={14} color={levelColor} />
                  <Text style={styles.levelStatText}>{level.reps}</Text>
                </View>
              </View>
          </View>

          {isSelected && (
              <View style={styles.selectedCheckmark}>
                <Ionicons name="checkmark-circle" size={24} color={levelColor} />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Compact Header */}
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
          {/* Hero Card with Animation - Full Screen */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.heroCard}>
            <LinearGradient
              colors={[colors.surface, colors.surface]}
              style={styles.heroCardGradient}
            >
              {/* Exercise Animation Section - Full Card */}
              <View style={styles.animationSection}>
                <ExerciseAnimation
                  exerciseType={exerciseId}
                  isVisible={true}
                  style={styles.exerciseAnimationContainer}
                />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Difficulty Levels Section */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="speedometer-outline" size={22} color={colors.primary} />
                <Text style={styles.sectionTitle}>Choose Your Level</Text>
            </View>
              <View style={styles.levelIndicatorsRow}>
                <View style={[styles.levelDotSmall, { backgroundColor: colors.primary }]} />
                <View style={[styles.levelDotSmall, { backgroundColor: colors.gold }]} />
                <View style={[styles.levelDotSmall, { backgroundColor: '#FF3B30' }]} />
              </View>
              </View>

            <View style={styles.levelsContainer}>
              {exerciseLevels.map((level, index) => renderDifficultyButton(level, index))}
              </View>
          </Animated.View>

          {/* Description Section */}
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.section}>
            <View style={styles.descriptionCard}>
              <View style={styles.descriptionHeader}>
                <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
                <Text style={styles.descriptionTitle}>About This Exercise</Text>
                </View>
              <Text style={styles.descriptionText}>{currentLevel.description}</Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Start Workout Button - Fixed at Bottom */}
        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.startButtonContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleStartWorkout}
            style={styles.startButton}
          >
            <LinearGradient
              colors={[getDifficultyColor(), getDifficultyColor() + 'CC']}
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
    paddingBottom: 100, // Space for fixed button
  },
  
  // Header Styles
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
    height: 400,
    backgroundColor: colors.background,
  },
  exerciseAnimationContainer: {
    flex: 1,
  },
  exerciseInfoOverlay: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  exerciseTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.heading,
  },
  fullscreenButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: colors.background,
  },
  statPillText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.body,
  },

  // Section Styles
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.heading,
  },
  levelIndicatorsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  levelDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Difficulty Levels
  levelsContainer: {
    gap: spacing.md,
  },
  levelButtonWrapper: {
    width: '100%',
  },
  levelButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  levelButtonGradient: {
    padding: spacing.lg,
    position: 'relative',
  },
  levelButtonContent: {
    gap: spacing.sm,
  },
  levelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  levelDotLarge: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.heading,
  },
  levelDescription: {
    fontSize: 14,
    color: colors.mutedText,
    fontFamily: fonts.body,
    lineHeight: 20,
  },
  levelStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  levelStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  levelStatText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  selectedCheckmark: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },

  // Description Card
  descriptionCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.heading,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.mutedText,
    fontFamily: fonts.body,
    lineHeight: 22,
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
