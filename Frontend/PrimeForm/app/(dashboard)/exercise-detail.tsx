import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Video, ResizeMode } from 'expo-av';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import DecorativeBackground from '../../src/components/DecorativeBackground';

const { width: screenWidth } = Dimensions.get('window');

type DifficultyLevel = 'beginner' | 'medium' | 'advanced';

interface ExerciseLevel {
  level: DifficultyLevel;
  title: string;
  duration: string;
  reps: string;
  sets: string;
  description: string;
  tips: string[];
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
        tips: ['Keep core engaged', 'Lower slowly', 'Push up explosively', 'Rest 60 seconds between sets'],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Standard Push-ups',
        duration: '15-20 minutes',
        reps: '8-12',
        sets: '3-4',
        description: 'Classic push-ups with proper form. Maintain straight line from head to heels.',
        tips: ['Hands shoulder-width apart', 'Lower chest to ground', 'Keep elbows at 45°', 'Rest 45 seconds between sets'],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Diamond Push-ups',
        duration: '20-25 minutes',
        reps: '10-15',
        sets: '4-5',
        description: 'Advanced variation targeting triceps. Form diamond shape with hands under chest.',
        tips: ['Hands form diamond', 'Slow controlled movement', 'Focus on triceps', 'Rest 30 seconds between sets'],
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
        tips: ['Feet shoulder-width apart', 'Lower until thighs parallel', 'Keep chest up', 'Rest 60 seconds between sets'],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Jump Squats',
        duration: '15-20 minutes',
        reps: '10-15',
        sets: '3-4',
        description: 'Add explosive jump to increase intensity and power.',
        tips: ['Land softly', 'Full squat depth', 'Explosive jump up', 'Rest 45 seconds between sets'],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Pistol Squats',
        duration: '20-25 minutes',
        reps: '5-8 each leg',
        sets: '4-5',
        description: 'Single-leg squat requiring balance, strength, and flexibility.',
        tips: ['Use wall for support initially', 'Keep extended leg straight', 'Control the movement', 'Rest 30 seconds between sets'],
        emoji: '🔴'
      }
    ],
    // Add more exercises with similar structure
    pullups: [
      {
        level: 'beginner',
        title: 'Assisted Pull-ups',
        duration: '10-15 minutes',
        reps: '3-5',
        sets: '2-3',
        description: 'Use resistance band or assisted machine to build strength.',
        tips: ['Full range of motion', 'Control the descent', 'Engage lats', 'Rest 90 seconds between sets'],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Standard Pull-ups',
        duration: '15-20 minutes',
        reps: '5-8',
        sets: '3-4',
        description: 'Classic pull-up with chin over bar.',
        tips: ['Dead hang start', 'Pull chest to bar', 'Controlled descent', 'Rest 60 seconds between sets'],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Weighted Pull-ups',
        duration: '20-25 minutes',
        reps: '6-10',
        sets: '4-5',
        description: 'Add weight for increased difficulty and strength gains.',
        tips: ['Start with light weight', 'Maintain form', 'Full range of motion', 'Rest 45 seconds between sets'],
        emoji: '🔴'
      }
    ]
  };

  return baseExercises[exerciseId] || baseExercises.pushups;
};

const getExerciseVideo = (exerciseId: string): string => {
  // Short exercise demonstration videos
  const videoMap: Record<string, string> = {
    pushups: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    squats: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    pullups: 'https://file-examples.com/storage/fe68c1b7c66d5b2b9c2568b/2017/10/file_example_MP4_480_1_5MG.mp4',
    lunges: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    planks: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    deadlifts: 'https://file-examples.com/storage/fe68c1b7c66d5b2b9c2568b/2017/10/file_example_MP4_480_1_5MG.mp4',
    benchpress: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    bicepCurls: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    shoulderPress: 'https://file-examples.com/storage/fe68c1b7c66d5b2b9c2568b/2017/10/file_example_MP4_480_1_5MG.mp4',
    cycling: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    rowing: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    jumping_jacks: 'https://file-examples.com/storage/fe68c1b7c66d5b2b9c2568b/2017/10/file_example_MP4_480_1_5MG.mp4',
    // Add more as needed
  };
  
  return videoMap[exerciseId] || 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4';
};

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>('beginner');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const exerciseId = params.exerciseId as string;
  const exerciseName = params.exerciseName as string;
  const exerciseIcon = params.exerciseIcon as string;
  const category = params.category as string;
  const targetMuscles = JSON.parse(params.targetMuscles as string || '[]');

  const exerciseLevels = getExerciseLevels(exerciseId);
  const currentLevel = exerciseLevels.find(level => level.level === selectedLevel) || exerciseLevels[0];
  const videoUrl = getExerciseVideo(exerciseId);

  const handleBack = () => {
    router.back();
  };

  const renderDifficultyButton = (level: ExerciseLevel) => {
    const isSelected = selectedLevel === level.level;
    return (
      <TouchableOpacity
        key={level.level}
        style={[
          styles.difficultyButton,
          isSelected && styles.difficultyButtonActive
        ]}
        onPress={() => setSelectedLevel(level.level)}
        activeOpacity={0.8}
      >
        <Text style={styles.difficultyEmoji}>{level.emoji}</Text>
        <Text style={[
          styles.difficultyText,
          isSelected && styles.difficultyTextActive
        ]}>
          {level.title}
        </Text>
        <Text style={[
          styles.difficultySubtext,
          isSelected && styles.difficultySubtextActive
        ]}>
          {level.level.toUpperCase()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Exercise Header Info */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.exerciseHeader}>
          <View style={styles.exerciseEmojiContainer}>
            <Ionicons name={exerciseIcon as any} size={28} color={colors.gold} />
          </View>
          <View style={styles.exerciseInfo}>
            <Text style={styles.headerTitle}>{exerciseName}</Text>
            <Text style={styles.headerCategory}>{category.toUpperCase()}</Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Target Muscles */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.musclesSection}>
            <Text style={styles.sectionTitle}>Target Muscles</Text>
            <View style={styles.musclesContainer}>
              {targetMuscles.map((muscle: string, index: number) => (
                <View key={index} style={styles.muscleTag}>
                  <Text style={styles.muscleText}>{muscle}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Video Player */}
          <Animated.View entering={FadeInUp.delay(300)} style={styles.videoSection}>
            <Text style={styles.sectionTitle}>Exercise Demonstration</Text>
            <View style={styles.videoContainer}>
              <Video
                source={{ uri: videoUrl }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                shouldPlay={isVideoPlaying}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded) {
                    setIsVideoPlaying(status.isPlaying || false);
                  }
                }}
              />
              {!isVideoPlaying && (
                <TouchableOpacity 
                  style={styles.videoOverlay}
                  onPress={() => setIsVideoPlaying(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="play-circle" size={60} color={colors.gold} />
                  <Text style={styles.videoText}>Tap to play demonstration</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Difficulty Levels */}
          <Animated.View entering={FadeInUp.delay(400)} style={styles.difficultySection}>
            <Text style={styles.sectionTitle}>Choose Your Level</Text>
            <View style={styles.difficultyButtons}>
              {exerciseLevels.map(renderDifficultyButton)}
            </View>
          </Animated.View>

          {/* Exercise Details */}
          <Animated.View entering={FadeInUp.delay(500)} style={styles.detailsSection}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>{currentLevel.title}</Text>
              <Text style={styles.detailsEmoji}>{currentLevel.emoji}</Text>
            </View>
            
            <Text style={styles.detailsDescription}>{currentLevel.description}</Text>
            
            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{currentLevel.duration}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Reps</Text>
                <Text style={styles.statValue}>{currentLevel.reps}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Sets</Text>
                <Text style={styles.statValue}>{currentLevel.sets}</Text>
              </View>
            </View>

            {/* Tips */}
            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
              {currentLevel.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Start Workout Button */}
          <Animated.View entering={FadeInUp.delay(600)} style={styles.startSection}>
            <TouchableOpacity style={styles.startButton} activeOpacity={0.8}>
              <Text style={styles.startButtonText}>Start Workout</Text>
              <Ionicons name="fitness" size={20} color={colors.white} />
            </TouchableOpacity>
          </Animated.View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  exerciseEmojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  exerciseInfo: {
    flex: 1,
  },

  headerTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  headerCategory: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
    letterSpacing: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },
  musclesSection: {
    marginBottom: spacing.xl,
  },
  musclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  muscleTag: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  muscleText: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  videoSection: {
    marginBottom: spacing.xl,
  },
  videoContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    position: 'relative',
    height: 200,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  videoText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  difficultySection: {
    marginBottom: spacing.xl,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  difficultyButtonActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  difficultyEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  difficultyText: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: 2,
  },
  difficultyTextActive: {
    color: colors.white,
  },
  difficultySubtext: {
    color: colors.mutedText,
    fontSize: 10,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  difficultySubtextActive: {
    color: colors.white,
  },
  detailsSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.xl,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailsTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
    flex: 1,
  },
  detailsEmoji: {
    fontSize: 24,
  },
  detailsDescription: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.gold,
    fontSize: typography.body,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  tipsSection: {
    marginTop: spacing.md,
  },
  tipsTitle: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginBottom: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  tipBullet: {
    color: colors.gold,
    fontSize: typography.body,
    fontWeight: '700',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  tipText: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontFamily: fonts.body,
    lineHeight: 20,
    flex: 1,
  },
  startSection: {
    marginBottom: spacing.xl,
  },
  startButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  startButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  bottomSpacing: {
    height: 50,
  },
});