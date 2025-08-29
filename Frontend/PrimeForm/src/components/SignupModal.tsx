import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeInUp, 
  FadeInDown,  
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onSignup: () => void;
  onClose: () => void;
  featureName?: string;
}

export default function SignupModal({ 
  visible, 
  onSignup, 
  onClose,
  featureName = 'this feature'
}: Props) {
  const { t, language } = useLanguage();
  const scaleValue = useSharedValue(0.9);
  const opacityValue = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      scaleValue.value = withSpring(1, { damping: 20, stiffness: 100 });
      opacityValue.value = withTiming(1, { duration: 400 });
    } else {
      scaleValue.value = withTiming(0.9, { duration: 300 });
      opacityValue.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: opacityValue.value,
  }));

  // Language-specific content
  const content = {
    en: {
      title: 'Unlock Premium Features',
      description: `Sign up to access `,
      benefits: [
        { icon: '✨', text: 'AI-powered personalized plans' },
        { icon: '📊', text: 'Progress tracking & analytics' },
        { icon: '🎯', text: 'Custom workout & diet plans' }
      ],
      signupButton: 'Sign Up',
      closeButton: '×'
    },
    ur: {
      title: 'پریمیم فیچرز کو انلاک کریں',
      description: `  رسائی حاصل کرنے کے لیے سائن اپ کریں`,
      benefits: [
        { icon: '✨', text: 'AI سے چلنے والے ذاتی پلانز' },
        { icon: '📊', text: 'پیش رفت کی نگرانی اور تجزیہ' },
        { icon: '🎯', text: 'کسٹم ورکاؤٹ اور ڈائٹ پلانز' }
      ],
      signupButton: 'رجسٹر کریں',
      closeButton: '×'
    }
  };

  const currentContent = content[language];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView intensity={80} style={styles.overlay} tint="dark">
        <Animated.View entering={FadeInDown.delay(100)} style={styles.modalContainer}>
          <Animated.View 
            style={[styles.modalContent, animatedContainerStyle]}
            entering={FadeInUp.delay(200)}
          >
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>{currentContent.closeButton}</Text>
            </TouchableOpacity>

            {/* Header Section */}
            <View style={styles.headerSection}>
              {/* Lock Icon */}
              <View style={styles.lockIcon}>
                <Text style={styles.lockText}>🔒</Text>
              </View>
            </View>

            {/* Content Section */}
            <View style={styles.contentSection}>
              {/* Title */}
              <Text style={[styles.title, language === 'ur' && styles.titleUrdu]}>
                {currentContent.title}
              </Text>
              
              {/* Description */}
              <Text style={[styles.description, language === 'ur' && styles.descriptionUrdu]}>
                {currentContent.description}
              </Text>

              {/* Benefits List */}
              <View style={styles.benefitsList}>
                {currentContent.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <View style={styles.benefitIcon}>
                      <Text style={styles.benefitIconText}>{benefit.icon}</Text>
                    </View>
                    <Text style={[styles.benefitText, language === 'ur' && styles.benefitTextUrdu]}>
                      {benefit.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Action Section */}
            <View style={styles.actionSection}>
              {/* Signup Button */}
              <TouchableOpacity 
                style={styles.signupButton} 
                onPress={onSignup}
                activeOpacity={0.9}
              >
                <Text style={styles.signupButtonText}>{currentContent.signupButton}</Text>
                <View style={styles.signupButtonArrow}>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </TouchableOpacity>
            </View>
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
  modalContainer: {
    width: '100%',
    maxWidth: Math.min(screenWidth - 40, 380),
  },
  modalContent: {
    backgroundColor: 'rgba(26, 31, 46, 0.95)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
    backdropFilter: 'blur(20px)',
    position: 'relative',
    overflow: 'hidden',
  },
  
  // Close Button
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
  },
  
  // Header Section
  headerSection: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 24,
  },
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  lockText: {
    fontSize: 36,
    textAlign: 'center',
    lineHeight: 72,
  },

  // Content Section
  contentSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  titleUrdu: {
    fontFamily: fonts.body,
    lineHeight: 30,
  },
  description: {
    fontSize: 15,
    color: colors.mutedText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  descriptionUrdu: {
    fontFamily: fonts.body,
    lineHeight: 24,
  },

  // Benefits List
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitIconText: {
    fontSize: 18,
  },
  benefitText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  benefitTextUrdu: {
    fontFamily: fonts.body,
    lineHeight: 22,
  },

  // Action Section
  actionSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  signupButton: {
    backgroundColor: colors.gold,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    gap: 12,
  },
  signupButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.body,
    letterSpacing: 0.5,
  },
  signupButtonArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
  },
  arrowText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
    textAlignVertical: 'center',
    includeFontPadding: false,
    height: 28,
    width: 28,
  },
});

