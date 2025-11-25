import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  Dimensions,
  Animated as RNAnimated,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, FadeInLeft, FadeInRight, SlideInUp, ZoomIn } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../src/theme/colors';
import { useAuthContext } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import DecorativeBackground from '../src/components/DecorativeBackground';
import { useToast } from '../src/context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

interface ExerciseLevel {
  level: DifficultyLevel;
  title: string;
  duration: number; // in seconds
  sets: number;
  reps: string;
  restTime: number; // in seconds
  description: string;
  tips: string[];
  emoji: string;
  calories: number;
}

// Enhanced exercise levels with precise timing
const getExerciseLevels = (exerciseId: string): ExerciseLevel[] => {
  const levelConfigs: Record<string, ExerciseLevel[]> = {
    pushups: [
      {
        level: 'beginner',
        title: 'Knee Push-ups',
        duration: 480, // 8 minutes
        sets: 3,
        reps: '5-8',
        restTime: 60,
        description: 'Modified push-ups on knees to build foundational strength',
        tips: ['Keep body straight from knees to head', 'Lower chest to ground', 'Push up slowly and controlled'],
        emoji: '🟢',
        calories: 40
      },
      {
        level: 'intermediate',
        title: 'Standard Push-ups',
        duration: 720, // 12 minutes
        sets: 4,
        reps: '8-12',
        restTime: 45,
        description: 'Classic push-ups with full body engagement',
        tips: ['Maintain straight plank position', 'Lower until chest nearly touches ground', 'Keep core tight throughout'],
        emoji: '🟡',
        calories: 60
      },
      {
        level: 'advanced',
        title: 'Diamond Push-ups',
        duration: 900, // 15 minutes
        sets: 5,
        reps: '10-15',
        restTime: 30,
        description: 'Advanced variation targeting triceps with diamond hand position',
        tips: ['Form diamond with thumbs and index fingers', 'Keep elbows close to body', 'Focus on tricep engagement'],
        emoji: '🔴',
        calories: 80
      }
    ],
    squats: [
      {
        level: 'beginner',
        title: 'Bodyweight Squats',
        duration: 600, // 10 minutes
        sets: 3,
        reps: '8-12',
        restTime: 60,
        description: 'Basic squat movement focusing on proper form',
        tips: ['Feet shoulder-width apart', 'Lower until thighs parallel to ground', 'Keep chest up and core engaged'],
        emoji: '🟢',
        calories: 50
      },
      {
        level: 'intermediate',
        title: 'Jump Squats',
        duration: 840, // 14 minutes
        sets: 4,
        reps: '10-15',
        restTime: 45,
        description: 'Explosive squat variation for power development',
        tips: ['Explode up from squat position', 'Land softly on balls of feet', 'Immediately descend into next rep'],
        emoji: '🟡',
        calories: 80
      },
      {
        level: 'advanced',
        title: 'Pistol Squats',
        duration: 1080, // 18 minutes
        sets: 5,
        reps: '5-8 each leg',
        restTime: 60,
        description: 'Single-leg squats requiring exceptional balance and strength',
        tips: ['Extend one leg forward', 'Lower on single leg', 'Use wall for support if needed'],
        emoji: '🔴',
        calories: 100
      }
    ],
    // Add more exercises as needed
    default: [
      {
        level: 'beginner',
        title: 'Basic Movement',
        duration: 600,
        sets: 3,
        reps: '8-12',
        restTime: 60,
        description: 'Beginner-friendly approach to this exercise',
        tips: ['Focus on form over speed', 'Take your time', 'Listen to your body'],
        emoji: '🟢',
        calories: 45
      },
      {
        level: 'intermediate',
        title: 'Standard Movement',
        duration: 900,
        sets: 4,
        reps: '10-15',
        restTime: 45,
        description: 'Intermediate level with increased intensity',
        tips: ['Maintain proper form', 'Increase range of motion', 'Focus on muscle engagement'],
        emoji: '🟡',
        calories: 70
      },
      {
        level: 'advanced',
        title: 'Advanced Movement',
        duration: 1200,
        sets: 5,
        reps: '12-20',
        restTime: 30,
        description: 'Advanced variation for experienced athletes',
        tips: ['Perfect form essential', 'Maximum range of motion', 'Mind-muscle connection'],
        emoji: '🔴',
        calories: 95
      }
    ]
  };

  return levelConfigs[exerciseId] || levelConfigs.default;
};

// Demo video URLs (using placeholder videos for now)
const getDemoVideo = (exerciseId: string): string => {
  const videoMap: Record<string, string> = {
    pushups: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    squats: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    pullups: 'https://file-examples.com/storage/fe68c1b7c66d5b2b9c2568b/2017/10/file_example_MP4_480_1_5MG.mp4',
    // Add more as needed
  };
  
  return videoMap[exerciseId] || 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4';
};

export default function ExerciseWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useLanguage();
  const { user } = useAuthContext();
  const { showToast } = useToast();

  const exerciseId = params.exerciseId as string;
  const exerciseName = params.exerciseName as string;
  const exerciseData = JSON.parse(params.exerciseData as string || '{}');
  const category = params.category as string;
  const gender = params.gender as string;

  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>('beginner');
  const [currentPhase, setCurrentPhase] = useState<'select' | 'demo' | 'workout' | 'rest' | 'complete'>('select');
  const [currentSet, setCurrentSet] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedSets, setCompletedSets] = useState<Set<number>>(new Set());

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  const exerciseLevels = getExerciseLevels(exerciseId);
  const currentLevel = exerciseLevels.find(level => level.level === selectedLevel) || exerciseLevels[0];
  const videoUrl = getDemoVideo(exerciseId);

  // Timer effect
  useEffect(() => {
    if (isPlaying && !isPaused && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, isPaused, timeRemaining]);

  // Pulse animation for timer
  useEffect(() => {
    if (isPlaying && !isPaused) {
      const pulse = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          RNAnimated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isPlaying, isPaused]);

  const handleTimerComplete = () => {
    if (currentPhase === 'workout') {
      // Workout set complete, move to rest
      const newCompleted = new Set(completedSets);
      newCompleted.add(currentSet);
      setCompletedSets(newCompleted);
      
      if (currentSet < currentLevel.sets) {
        setCurrentPhase('rest');
        setTimeRemaining(currentLevel.restTime);
        showToast('success', `Set ${currentSet} complete! Rest time.`);
      } else {
        setCurrentPhase('complete');
        showToast('success', 'Workout complete! Great job!');
      }
    } else if (currentPhase === 'rest') {
      // Rest complete, move to next set
      setCurrentSet(prev => prev + 1);
      setCurrentPhase('workout');
      setTimeRemaining(60); // Standard workout time per set
      showToast('info', `Starting set ${currentSet + 1}`);
    }
  };

  const startWorkout = () => {
    // Navigate to the new workout player with Lottie animations
    router.push({
      pathname: '/workout-player',
      params: {
        exerciseId,
        exerciseName,
        exerciseData: JSON.stringify(exerciseData),
        level: JSON.stringify(currentLevel),
      },
    });
  };

  const pauseResume = () => {
    setIsPaused(!isPaused);
    showToast('info', isPaused ? 'Workout resumed' : 'Workout paused');
  };

  const stopWorkout = () => {
    Alert.alert(
      'Stop Workout',
      'Are you sure you want to stop the workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            setCurrentPhase('select');
            setIsPlaying(false);
            setIsPaused(false);
            setCurrentSet(1);
            setCompletedSets(new Set());
            setTimeRemaining(0);
          }
        }
      ]
    );
  };

  const handleBack = () => {
    if (isPlaying) {
      Alert.alert(
        'Workout in Progress',
        'You have an active workout. Do you want to stop and go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop & Go Back',
            style: 'destructive',
            onPress: () => router.back()
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderDifficultySelector = () => (
    <Animated.View entering={FadeInUp.delay(200)} style={styles.difficultySection}>
      <Text style={styles.sectionTitle}>Choose Your Level</Text>
      <View style={styles.difficultyButtons}>
        {exerciseLevels.map((level, index) => (
          <Animated.View key={level.level} entering={FadeInUp.delay(300 + (index * 100))}>
            <TouchableOpacity
              style={[
                styles.difficultyCard,
                selectedLevel === level.level && styles.difficultyCardActive
              ]}
              onPress={() => setSelectedLevel(level.level)}
              activeOpacity={0.8}
            >
              <View style={styles.difficultyCardContent}>
                <View style={[
                  styles.difficultyIconContainer,
                  { backgroundColor: selectedLevel === level.level ? colors.primary + '20' : colors.surface }
                ]}>
                  <Text style={styles.difficultyEmoji}>{level.emoji}</Text>
                </View>
                
                <View style={styles.difficultyInfo}>
                  <Text style={[
                    styles.difficultyTitle,
                    selectedLevel === level.level && styles.difficultyTitleActive
                  ]}>
                    {level.title}
                  </Text>
                  <Text style={[
                    styles.difficultyLevel,
                    selectedLevel === level.level && styles.difficultyLevelActive
                  ]}>
                    {level.level.toUpperCase()}
                  </Text>
                  <View style={styles.difficultyStatsRow}>
                    <Text style={styles.difficultyStatItem}>{level.sets} sets</Text>
                    <Text style={styles.difficultyStatItem}>•</Text>
                    <Text style={styles.difficultyStatItem}>{level.reps} reps</Text>
                    <Text style={styles.difficultyStatItem}>•</Text>
                    <Text style={styles.difficultyStatItem}>{Math.floor(level.duration / 60)} min</Text>
                  </View>
                </View>
                
                {selectedLevel === level.level && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  // Demo section removed as requested

  const renderWorkoutTimer = () => (
    <Animated.View entering={ZoomIn} style={styles.timerContainer}>
      <LinearGradient
        colors={currentPhase === 'workout' ? [colors.primary, colors.primaryDark] : [colors.blue, '#3B82F6']}
        style={styles.timerGradient}
      >
        <RNAnimated.View style={[styles.timerContent, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.timerPhase}>
            {currentPhase === 'workout' ? '💪 WORKOUT' : '😌 REST'}
          </Text>
          <Text style={styles.timerTime}>{formatTime(timeRemaining)}</Text>
          <Text style={styles.timerSet}>Set {currentSet} of {currentLevel.sets}</Text>
        </RNAnimated.View>
      </LinearGradient>
    </Animated.View>
  );

  const renderWorkoutControls = () => (
    <Animated.View entering={SlideInUp.delay(100)} style={styles.controlsContainer}>
      <TouchableOpacity
        style={styles.controlButton}
        onPress={pauseResume}
        activeOpacity={0.8}
      >
        <Ionicons name={isPaused ? 'play' : 'pause'} size={24} color={colors.white} />
        <Text style={styles.controlButtonText}>
          {isPaused ? 'Resume' : 'Pause'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.controlButton, styles.stopButton]}
        onPress={stopWorkout}
        activeOpacity={0.8}
      >
        <Ionicons name="stop" size={24} color={colors.white} />
        <Text style={styles.controlButtonText}>Stop</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderWorkoutComplete = () => (
    <Animated.View entering={ZoomIn} style={styles.completeContainer}>
      <LinearGradient
        colors={[colors.green, '#10B981']}
        style={styles.completeGradient}
      >
        <Text style={styles.completeEmoji}>🎉</Text>
        <Text style={styles.completeTitle}>Workout Complete!</Text>
        <Text style={styles.completeSubtitle}>Great job finishing your {selectedLevel} workout</Text>
        <View style={styles.completeStats}>
          <View style={styles.completeStat}>
            <Text style={styles.completeStatValue}>{currentLevel.sets}</Text>
            <Text style={styles.completeStatLabel}>Sets</Text>
          </View>
          <View style={styles.completeStat}>
            <Text style={styles.completeStatValue}>{Math.floor(currentLevel.duration / 60)}</Text>
            <Text style={styles.completeStatLabel}>Minutes</Text>
          </View>
          <View style={styles.completeStat}>
            <Text style={styles.completeStatValue}>{currentLevel.calories}</Text>
            <Text style={styles.completeStatLabel}>Calories</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.completeButtonText}>Done</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{exerciseName}</Text>
            <Text style={styles.headerSubtitle}>{exerciseData.description || 'Exercise workout'}</Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Exercise Info Card */}
          <Animated.View entering={FadeInUp} style={styles.exerciseInfoCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.exerciseInfoGradient}
            >
              <View style={styles.exerciseInfoHeader}>
                <Text style={styles.exerciseInfoEmoji}>{exerciseData.emoji}</Text>
                <View style={styles.exerciseInfoText}>
                  <Text style={styles.exerciseInfoName}>{exerciseName}</Text>
                  <Text style={styles.exerciseInfoDescription}>{currentLevel.description}</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Difficulty Selector */}
          {currentPhase === 'select' && renderDifficultySelector()}

          {/* Exercise Details */}
          {currentPhase === 'select' && (
            <Animated.View entering={FadeInUp.delay(500)} style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Exercise Tips</Text>
              <View style={styles.tipsContainer}>
                {currentLevel.tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Workout Timer */}
          {(currentPhase === 'workout' || currentPhase === 'rest') && renderWorkoutTimer()}

          {/* Workout Controls */}
          {(currentPhase === 'workout' || currentPhase === 'rest') && renderWorkoutControls()}

          {/* Workout Complete */}
          {currentPhase === 'complete' && renderWorkoutComplete()}

          {/* Start Button */}
          {currentPhase === 'select' && (
            <Animated.View entering={FadeInUp.delay(600)} style={styles.startSection}>
              <TouchableOpacity
                style={styles.startButton}
                onPress={startWorkout}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.startButtonGradient}
                >
                  <Ionicons name="play" size={24} color={colors.white} />
                  <Text style={styles.startButtonText}>Start Workout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

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
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  headerSubtitle: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    marginTop: 2,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  
  // Exercise Info Card
  exerciseInfoCard: {
    marginBottom: spacing.xl,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  exerciseInfoGradient: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  exerciseInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseInfoEmoji: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  exerciseInfoText: {
    flex: 1,
  },
  exerciseInfoName: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: 4,
  },
  exerciseInfoDescription: {
    color: colors.mutedText,
    fontSize: 16,
    fontFamily: fonts.body,
    lineHeight: 22,
  },

  // Section Title
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },

  // Difficulty Section
  difficultySection: {
    marginBottom: spacing.xl,
  },
  difficultyButtons: {
    gap: spacing.md,
  },
  difficultyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  difficultyCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  difficultyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  difficultyEmoji: {
    fontSize: 24,
  },
  difficultyInfo: {
    flex: 1,
  },
  difficultyTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: 4,
  },
  difficultyTitleActive: {
    color: colors.primary,
  },
  difficultyLevel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  difficultyLevelActive: {
    color: colors.primary,
  },
  difficultyStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  difficultyStatItem: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  selectedIndicator: {
    marginLeft: spacing.sm,
  },

  // Demo Section
  demoSection: {
    marginBottom: spacing.xl,
  },
  videoContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: 200,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    gap: spacing.sm,
  },
  demoButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.body,
  },

  // Timer Container
  timerContainer: {
    marginBottom: spacing.xl,
    borderRadius: radius.lg,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  timerGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  timerContent: {
    alignItems: 'center',
  },
  timerPhase: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
    letterSpacing: 2,
  },
  timerTime: {
    color: colors.white,
    fontSize: 48,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
  },
  timerSet: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.body,
  },

  // Controls
  controlsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  stopButton: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error,
  },
  controlButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.body,
  },

  // Complete Section
  completeContainer: {
    marginBottom: spacing.xl,
    borderRadius: radius.lg,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  completeGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  completeEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  completeTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  completeSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  completeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.xl,
  },
  completeStat: {
    alignItems: 'center',
  },
  completeStatValue: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: fonts.heading,
  },
  completeStatLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 4,
  },
  completeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  completeButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },

  // Details Section
  detailsSection: {
    marginBottom: spacing.xl,
  },
  tipsContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  tipBullet: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  tipText: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
    flex: 1,
  },

  // Start Section
  startSection: {
    marginBottom: spacing.xl,
  },
  startButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  startButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },

  bottomSpacing: {
    height: 50,
  },
});
