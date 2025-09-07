import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { colors, spacing, fonts } from '../theme/colors';

interface LoadingModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  type: 'workout' | 'diet';
}

export default function LoadingModal({ 
  visible, 
  title, 
  subtitle,
  type 
}: LoadingModalProps) {
  const [countdown, setCountdown] = useState(10);
  const [spinValue] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      setCountdown(10);
      startSpinAnimation();
      startCountdown();
    }
  }, [visible]);

  const startSpinAnimation = () => {
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getIcon = () => {
    return type === 'workout' ? '💪' : '🥗';
  };

  const getGradientColors = () => {
    return type === 'workout' ? [colors.primary, colors.gold] : [colors.gold, colors.green];
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Animated Background */}
          <View style={styles.backgroundAnimation}>
            <Animated.View 
              style={[
                styles.animatedCircle,
                styles.circle1,
                { transform: [{ rotate: spin }] }
              ]} 
            />
            <Animated.View 
              style={[
                styles.animatedCircle,
                styles.circle2,
                { transform: [{ rotate: spin }] }
              ]} 
            />
          </View>

          {/* Main Content */}
          <View style={styles.contentContainer}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.mainIcon}>{getIcon()}</Text>
            </View>

            {/* Spinning Loader */}
            <View style={styles.loaderContainer}>
              <Animated.View 
                style={[
                  styles.spinner,
                  { transform: [{ rotate: spin }] }
                ]}
              >
                <View style={styles.spinnerInner} />
                <View style={styles.spinnerOuter} />
              </Animated.View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>
            
            {/* Subtitle */}
            {subtitle && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}

            {/* Countdown */}
            <View style={styles.countdownContainer}>
              <View style={styles.countdownCircle}>
                <Text style={styles.countdownNumber}>{countdown}</Text>
              </View>
              <Text style={styles.countdownLabel}>
                {countdown > 1 ? 'seconds remaining' : 'almost done...'}
              </Text>
            </View>

            {/* Progress Dots */}
            <View style={styles.progressDots}>
              {[...Array(3)].map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      opacity: spinValue.interpolate({
                        inputRange: [0, 0.33, 0.66, 1],
                        outputRange: index === 0 ? [1, 0.3, 0.3, 1] : 
                                   index === 1 ? [0.3, 1, 0.3, 0.3] : 
                                   [0.3, 0.3, 1, 0.3],
                      }),
                    }
                  ]}
                />
              ))}
            </View>

            {/* Status Text */}
            <Text style={styles.statusText}>
              {countdown > 7 ? 'Analyzing your profile...' :
               countdown > 4 ? 'Generating personalized plan...' :
               countdown > 1 ? 'Finalizing recommendations...' :
               'Almost ready!'}
            </Text>
          </View>
        </View>
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
  },
  modalContainer: {
    width: '85%',
    maxWidth: 350,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },

  // Background Animation
  backgroundAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedCircle: {
    position: 'absolute',
    borderRadius: 200,
    borderWidth: 1,
    borderColor: colors.gold + '20',
  },
  circle1: {
    width: 200,
    height: 200,
  },
  circle2: {
    width: 300,
    height: 300,
    borderColor: colors.primary + '15',
  },

  // Content
  contentContainer: {
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  mainIcon: {
    fontSize: 48,
  },

  // Spinner
  loaderContainer: {
    marginBottom: spacing.xl,
  },
  spinner: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerOuter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.cardBorder + '30',
    borderTopColor: colors.gold,
  },
  spinnerInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.cardBorder + '20',
    borderRightColor: colors.primary,
  },

  // Text
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Countdown
  countdownContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  countdownCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.gold + '20',
    borderWidth: 2,
    borderColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  countdownNumber: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: fonts.heading,
  },
  countdownLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },

  // Progress Dots
  progressDots: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },

  // Status
  statusText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.body,
    textAlign: 'center',
  },
});
