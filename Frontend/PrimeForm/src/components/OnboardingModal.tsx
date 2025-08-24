import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming,
  withRepeat,
  withDelay
} from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onStart: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export default function OnboardingModal({ 
  visible, 
  onStart, 
  onCancel,
  title,
  description 
}: Props) {
  const { t } = useLanguage();
  const scaleValue = useSharedValue(0.9);
  const opacityValue = useSharedValue(0);
  const logoScaleValue = useSharedValue(0.8);
  const buttonScaleValue = useSharedValue(1);

  const modalTitle = title || t('onboarding.title');

  React.useEffect(() => {
    if (visible) {
      // Main modal animation
      scaleValue.value = withSpring(1, { damping: 20, stiffness: 100 });
      opacityValue.value = withTiming(1, { duration: 400 });
      
      // Logo animation with delay
      logoScaleValue.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 150 }));
      
      // Button pulse animation
      buttonScaleValue.value = withDelay(600, 
        withRepeat(
          withSequence(
            withTiming(1.05, { duration: 800 }),
            withTiming(1, { duration: 800 })
          ),
          -1,
          true
        )
      );
    } else {
      scaleValue.value = withTiming(0.9, { duration: 300 });
      opacityValue.value = withTiming(0, { duration: 300 });
      logoScaleValue.value = withTiming(0.8, { duration: 200 });
      buttonScaleValue.value = 1;
    }
  }, [visible]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: opacityValue.value,
  }));

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScaleValue.value }],
  }));

  const animatedStartButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScaleValue.value }],
  }));

  const handleStart = () => {
    onStart();
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView intensity={80} style={styles.overlay} tint="dark">
        {/* Background decorative elements */}
        <View style={styles.backgroundDecorations}>
          <View style={styles.decorationCircle1} />
          <View style={styles.decorationCircle2} />
          <View style={styles.decorationCircle3} />
        </View>

        <Animated.View entering={FadeInDown.delay(100)} style={styles.modalContainer}>
          <Animated.View 
            style={[styles.modalContent, animatedContainerStyle]}
            entering={FadeInUp.delay(200)}
          >
            {/* PrimeForm Logo */}
            <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
              <View style={styles.logoBackground}>
                <Image 
                  source={require('../../assets/images/PrimeLogo.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.logoGlow} />
            </Animated.View>

            {/* Welcome Badge */}
            <View style={styles.welcomeBadge}>
              <Text style={styles.welcomeText}>✨ Welcome to PrimeForm</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>{modalTitle}</Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <View style={styles.cancelButtonContent}>
                  <Text style={styles.cancelButtonText}>{t('onboarding.cancel')}</Text>
                </View>
              </TouchableOpacity>
              
              <Animated.View style={animatedStartButtonStyle}>
                <TouchableOpacity 
                  style={styles.startButton} 
                  onPress={handleStart}
                  activeOpacity={0.9}
                >
                  <View style={styles.startButtonContent}>
                    <Text style={styles.startButtonText}>{t('onboarding.start')}</Text>
                    <View style={styles.startButtonIcon}>
                      <Text style={styles.startButtonArrow}>→</Text>
                    </View>
                  </View>
                  <View style={styles.startButtonGlow} />
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Bottom accent line */}
            <View style={styles.bottomAccent} />
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backgroundDecorations: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  decorationCircle1: {
    position: 'absolute',
    top: '20%',
    right: '10%',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  decorationCircle2: {
    position: 'absolute',
    bottom: '30%',
    left: '5%',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  decorationCircle3: {
    position: 'absolute',
    top: '60%',
    right: '20%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
  },
  modalContainer: {
    width: '100%',
    maxWidth: Math.min(screenWidth - 32, 400),
  },
  modalContent: {
    backgroundColor: 'rgba(26, 31, 46, 0.95)',
    borderRadius: 28,
    padding: spacing.xl + 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 25,
    },
    shadowOpacity: 0.4,
    shadowRadius: 50,
    elevation: 25,
    backdropFilter: 'blur(20px)',
  },
  logoContainer: {
    marginBottom: spacing.lg + 8,
    alignItems: 'center',
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  logoGlow: {
    // Removed shadow effect
  },
  welcomeBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: spacing.lg,
  },
  welcomeText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.body,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 32,
    letterSpacing: 0.3,
  },

  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginBottom: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: spacing.md + 6,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cancelButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: fonts.body,
    letterSpacing: 0.3,
  },
  startButton: {
    flex: 1.3,
    backgroundColor: colors.gold,
    paddingVertical: spacing.md + 6,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  startButtonText: {
    color: '#000',
    fontSize: typography.body + 1,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  startButtonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonArrow: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
  startButtonGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    backgroundColor: colors.gold,
    borderRadius: 18,
    opacity: 0.3,
    zIndex: -1,
  },
  bottomAccent: {
    width: 60,
    height: 3,
    backgroundColor: colors.gold,
    borderRadius: 2,
    opacity: 0.6,
  },
});
