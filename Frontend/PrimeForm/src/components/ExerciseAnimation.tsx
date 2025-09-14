import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors, spacing, fonts } from '../theme/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Import the Lottie animation
const pushupAnimation = require('../../assets/animations/Pushup.json');

interface ExerciseAnimationProps {
  exerciseType: string;
  isVisible: boolean;
  onAnimationComplete?: () => void;
  style?: any;
}

const ExerciseAnimation: React.FC<ExerciseAnimationProps> = ({
  exerciseType,
  isVisible,
  onAnimationComplete,
  style,
}) => {
  const breathingAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // For non-push-up exercises, start breathing animation
    if (!exerciseType.toLowerCase().includes('push')) {
      const createBreathingLoop = () => {
        Animated.sequence([
          Animated.timing(breathingAnimation, {
            toValue: 1.1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(breathingAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          createBreathingLoop();
        });
      };

      createBreathingLoop();
    }
  }, [exerciseType, breathingAnimation]);

  if (!isVisible) return null;

  const isPushUpExercise = exerciseType.toLowerCase().includes('push');

  if (isPushUpExercise) {
    // Lottie push-up animation
    return (
      <View style={[styles.container, style]}>
        <LottieView
          source={pushupAnimation}
          autoPlay
          loop
          style={styles.lottieAnimation}
          resizeMode="contain"
        />
      </View>
    );
  }

  // For non-push-up exercises, show a simple animated emoji
  return (
    <View style={[styles.container, style]}>
      <View style={styles.fallbackContainer}>
        <Animated.Text 
          style={[
            styles.fallbackEmoji,
            {
              transform: [{ scale: breathingAnimation }]
            }
          ]}
        >
          💪
        </Animated.Text>
        <Text style={styles.fallbackText}>{exerciseType}</Text>
        <Text style={styles.fallbackSubtext}>Exercise in progress</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
    minHeight: 300,
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  fallbackEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  fallbackText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  fallbackSubtext: {
    color: colors.mutedText,
    fontSize: 16,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
});

export default ExerciseAnimation;
