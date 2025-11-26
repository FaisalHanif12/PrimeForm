import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fonts, radius } from '../theme/colors';
import { WorkoutExercise } from '../services/aiWorkoutService';

const { width: screenWidth } = Dimensions.get('window');

interface ExerciseCompletionScreenProps {
  exercise: WorkoutExercise | null;
  visible: boolean;
  onClose: () => void;
  onBackToWorkout: () => void;
}

export default function ExerciseCompletionScreen({
  exercise,
  visible,
  onClose,
  onBackToWorkout,
}: ExerciseCompletionScreenProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [checkmarkScale] = useState(new Animated.Value(0));
  const [glowAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      checkmarkScale.setValue(0);
      glowAnim.setValue(0);

      // Animate entrance
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(checkmarkScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }
  }, [visible]);

  if (!exercise) return null;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.surface, colors.background]}
            style={styles.gradient}
          >
            {/* Success Icon with Glow */}
            <View style={styles.successIconContainer}>
              <Animated.View 
                style={[
                  styles.successGlow,
                  { opacity: glowOpacity }
                ]}
              />
              <Animated.View 
                style={[
                  styles.successIcon,
                  { transform: [{ scale: checkmarkScale }] }
                ]}
              >
                <Text style={styles.successCheckmark}>✓</Text>
              </Animated.View>
            </View>

            {/* Success Message */}
            <Text style={styles.successTitle}>Incredible Work!</Text>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.subtitle}>Exercise Completed Successfully</Text>
            
            {/* Stats Grid */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>💪</Text>
                </View>
                <Text style={styles.statValue}>{exercise.sets}</Text>
                <Text style={styles.statLabel}>Sets</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>🔄</Text>
                </View>
                <Text style={styles.statValue}>{exercise.reps}</Text>
                <Text style={styles.statLabel}>Reps</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>🔥</Text>
                </View>
                <Text style={styles.statValue}>{exercise.caloriesBurned}</Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>
            </View>

            {/* Motivational Message */}
            <View style={styles.messageCard}>
              <Text style={styles.messageIcon}>🎯</Text>
              <Text style={styles.messageText}>
                You're crushing your goals! Every rep brings you closer to the stronger version of yourself. Keep pushing forward!
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onBackToWorkout}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary, '#00C6FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.primaryButtonText}>Continue Workout</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Finish for Today</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  gradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  successIconContainer: {
    position: 'relative',
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.green,
    opacity: 0.3,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  successCheckmark: {
    color: colors.white,
    fontSize: 52,
    fontWeight: '900',
    fontFamily: fonts.heading,
  },
  successTitle: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '900',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  exerciseName: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardBorder + '20',
    borderRadius: 20,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder + '30',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    alignItems: 'center',
  },
  messageIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  messageText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  gradientButton: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: fonts.heading,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.cardBorder + '50',
  },
  secondaryButtonText: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
});
