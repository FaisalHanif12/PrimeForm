import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Dimensions,
  Animated as RNAnimated,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, ZoomIn, SlideInUp } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../src/theme/colors';
import { useAuthContext } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import DecorativeBackground from '../src/components/DecorativeBackground';
import { useToast } from '../src/context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import ExerciseAnimation from '../src/components/ExerciseAnimation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Lottie animation URLs from LottieFiles (using actual gym animations)
const getLottieAnimation = (exerciseId: string): string => {
  const animationMap: Record<string, string> = {
    // Push-ups animation
    pushups: 'https://assets5.lottiefiles.com/packages/lf20_DMgKk1.json',
    // Squats animation  
    squats: 'https://assets2.lottiefiles.com/packages/lf20_kkflmtur.json',
    // Pull-ups animation
    pullups: 'https://assets4.lottiefiles.com/packages/lf20_xxbxrj1b.json',
    // Bicep curls animation
    bicep_curls: 'https://assets8.lottiefiles.com/packages/lf20_puciaact.json',
    // Plank animation
    planks: 'https://assets1.lottiefiles.com/packages/lf20_xxnrjkd9.json',
    // Burpees animation
    burpees: 'https://assets9.lottiefiles.com/packages/lf20_gkgqj2yq.json',
    // Default gym animation
    default: 'https://assets10.lottiefiles.com/packages/lf20_phjjbfh5.json'
  };
  
  return animationMap[exerciseId] || animationMap.default;
};

type WorkoutPhase = 'prepare' | 'workout' | 'rest' | 'complete';

export default function WorkoutPlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useLanguage();
  const { user } = useAuthContext();
  const { showToast } = useToast();

  const exerciseId = params.exerciseId as string;
  const exerciseName = params.exerciseName as string;
  const exerciseData = JSON.parse(params.exerciseData as string || '{}');
  const level = JSON.parse(params.level as string || '{}');

  const [currentPhase, setCurrentPhase] = useState<WorkoutPhase>('prepare');
  const [currentSet, setCurrentSet] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(5); // 5 second prepare time
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedSets, setCompletedSets] = useState<Set<number>>(new Set());


  const timerRef = useRef<number | null>(null);
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  const animationUrl = getLottieAnimation(exerciseId);

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

  // Phase transition effect removed - using reanimated entrance animations instead

  const handleTimerComplete = () => {
    switch (currentPhase) {
      case 'prepare':
        setCurrentPhase('workout');
        setTimeRemaining(60); // 60 seconds workout time
        showToast('success', 'Start exercising!');
        break;
      case 'workout':
        const newCompleted = new Set(completedSets);
        newCompleted.add(currentSet);
        setCompletedSets(newCompleted);
        
        if (currentSet < level.sets) {
          setCurrentPhase('rest');
          setTimeRemaining(level.restTime);
          showToast('success', `Set ${currentSet} complete! Rest time.`);
        } else {
          setCurrentPhase('complete');
          showToast('success', 'Workout complete! Great job!');
        }
        break;
      case 'rest':
        setCurrentSet(prev => prev + 1);
        setCurrentPhase('workout');
        setTimeRemaining(60);
        showToast('info', `Starting set ${currentSet + 1}`);
        break;
    }
  };

  const startWorkout = () => {
    setCurrentPhase('prepare');
    setTimeRemaining(5);
    setIsPlaying(true);
    setIsPaused(false);
    showToast('success', 'Get ready!');
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
            router.back();
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

  const getPhaseInfo = () => {
    switch (currentPhase) {
      case 'prepare':
        return {
          title: 'Get Ready!',
          subtitle: 'Prepare for your workout',
          emoji: '⚡',
          color: [colors.blue, '#3B82F6']
        };
      case 'workout':
        return {
          title: 'Work Out!',
          subtitle: `Set ${currentSet} of ${level.sets}`,
          emoji: '💪',
          color: [colors.primary, colors.primaryDark]
        };
      case 'rest':
        return {
          title: 'Rest Time',
          subtitle: 'Take a break',
          emoji: '😌',
          color: [colors.green, '#10B981']
        };
      case 'complete':
        return {
          title: 'Complete!',
          subtitle: 'Great job!',
          emoji: '🎉',
          color: [colors.gold, '#F59E0B']
        };
    }
  };

  const phaseInfo = getPhaseInfo();

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
            <Text style={styles.headerSubtitle}>{level.title}</Text>
          </View>
        </Animated.View>

        <View style={styles.container}>
          {/* Exercise Animation - Bigger and More Elegant */}
          <Animated.View 
            entering={ZoomIn} 
            style={styles.animationContainer}
          >
            <View style={styles.animationWrapper}>
              <ExerciseAnimation
                exerciseType={exerciseName}
                isVisible={currentPhase === 'workout' || exerciseName.toLowerCase().includes('push')}
                style={styles.lottieAnimation}
              />
              {currentPhase === 'prepare' && (
                <View style={styles.prepareOverlay}>
                  <Text style={styles.prepareText}>Get Ready!</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Compact Timer Section */}
          <Animated.View entering={SlideInUp.delay(200)} style={styles.timerSection}>
            <LinearGradient
              colors={phaseInfo.color as [string, string]}
              style={styles.timerGradient}
            >
              <RNAnimated.View style={[styles.timerContent, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.timerHeader}>
                  <View style={styles.timerTextContainer}>
                    <Text style={styles.phaseTitle}>{phaseInfo.title}</Text>
                    <Text style={styles.phaseSubtitle}>{phaseInfo.subtitle}</Text>
                  </View>
                </View>
                <Text style={styles.timerTime}>{formatTime(timeRemaining)}</Text>
              </RNAnimated.View>
            </LinearGradient>
          </Animated.View>

          {/* Progress Bar */}
          <Animated.View entering={FadeInUp.delay(300)} style={styles.progressSection}>
            <Text style={styles.progressTitle}>Progress</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(completedSets.size / level.sets) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {completedSets.size} of {level.sets} sets completed
            </Text>
          </Animated.View>

          {/* Controls */}
          {currentPhase !== 'complete' && (
            <Animated.View entering={FadeInUp.delay(400)} style={styles.controlsSection}>
              {!isPlaying ? (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={startWorkout}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="play" size={24} color={colors.white} />
                    <Text style={styles.buttonText}>Start Workout</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={styles.controlButtons}>
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
                </View>
              )}
            </Animated.View>
          )}

          {/* Completion Screen */}
          {currentPhase === 'complete' && (
            <Animated.View entering={ZoomIn} style={styles.completionSection}>
              <LinearGradient
                colors={[colors.green, '#10B981']}
                style={styles.completionGradient}
              >
                <Text style={styles.completionEmoji}>🎉</Text>
                <Text style={styles.completionTitle}>Workout Complete!</Text>
                <Text style={styles.completionSubtitle}>
                  Great job completing your {level.title.toLowerCase()}
                </Text>
                <View style={styles.completionStats}>
                  <View style={styles.completionStat}>
                    <Text style={styles.completionStatValue}>{level.sets}</Text>
                    <Text style={styles.completionStatLabel}>Sets</Text>
                  </View>
                  <View style={styles.completionStat}>
                    <Text style={styles.completionStatValue}>{Math.floor(level.duration / 60)}</Text>
                    <Text style={styles.completionStatLabel}>Minutes</Text>
                  </View>
                  <View style={styles.completionStat}>
                    <Text style={styles.completionStatValue}>{level.calories}</Text>
                    <Text style={styles.completionStatLabel}>Calories</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => router.back()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}
        </View>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    marginTop: spacing.md,
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  
  // Animation Section - Reduced size for better footer visibility
  animationContainer: {
    height: screenHeight * 0.35, // 35% of screen height
    marginBottom: spacing.lg,
  },
  animationWrapper: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    position: 'relative',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  lottieAnimation: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  prepareOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prepareText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
    fontFamily: fonts.heading,
  },

  // Timer Section
  timerSection: {
    marginBottom: spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  timerGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  timerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  timerTextContainer: {
    alignItems: 'center',
  },
  phaseTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: 2,
  },
  phaseSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: fonts.body,
  },
  timerTime: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
    fontFamily: fonts.heading,
    textAlign: 'center',
  },

  // Progress Section
  progressSection: {
    marginBottom: spacing.xl,
  },
  progressTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    textAlign: 'center',
  },

  // Controls Section
  controlsSection: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
  },
  startButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  buttonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
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

  // Completion Section
  completionSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    margin: spacing.lg,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  completionGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  completionEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  completionTitle: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  completionSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 18,
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  completionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.xl,
  },
  completionStat: {
    alignItems: 'center',
  },
  completionStatValue: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: fonts.heading,
  },
  completionStatLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: fonts.body,
    marginTop: 4,
  },
  doneButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.lg,
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
});
