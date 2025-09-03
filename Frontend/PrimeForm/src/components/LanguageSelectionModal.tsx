import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Image } from 'react-native';
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

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onLanguageSelect: (language: 'en' | 'ur') => void;
  onBack?: () => void;
}

export default function LanguageSelectionModal({ 
  visible, 
  onLanguageSelect,
  onBack
}: Props) {
  const { t, language } = useLanguage();
  const scaleValue = useSharedValue(0.9);
  const opacityValue = useSharedValue(0);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleLanguageSelect = (language: 'en' | 'ur') => {
    if (isProcessing) return; // Prevent multiple rapid clicks
    
    console.log('🌍 Language selected:', language);
    setIsProcessing(true);
    
    // Add a small delay to ensure smooth animation
    setTimeout(() => {
      onLanguageSelect(language);
      setIsProcessing(false);
    }, 100);
  };

  const handleBack = () => {
    if (isProcessing) return; // Prevent multiple rapid clicks
    
    console.log('🔙 Close button pressed - setting English as default');
    setIsProcessing(true);
    
    if (onBack) {
      onBack();
    } else {
      // Default behavior: set English and close modal
      onLanguageSelect('en');
    }
    
    setIsProcessing(false);
  };

  // Language-specific content
  const content = {
    en: {
      welcome: 'Welcome to PrimeForm! 🎉',
      title: 'Choose Your Language',
      description: 'Select your preferred language to get started with your fitness journey',
      english: {
        label: '🇺🇸 English',
        subtext: 'Continue in English'
      },
      urdu: {
        label: '🇵🇰 اردو',
        subtext: 'اردو میں جاری رکھیں'
      }
    },
    ur: {
      welcome: 'پرائم فارم میں خوش آمدید! 🎉',
      title: 'اپنی زبان منتخب کریں',
      description: 'اپنی فٹنس سفر شروع کرنے کے لیے اپنی پسندیدہ زبان منتخب کریں',
      english: {
        label: '🇺🇸 English',
        subtext: 'Continue in English'
      },
      urdu: {
        label: '🇵🇰 اردو',
        subtext: 'اردو میں جاری رکھیں'
      }
    }
  };

  // Use English content for initial display, then switch to selected language
  const currentContent = content[language] || content.en;

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
            {/* Close Button - Right Side */}
            <TouchableOpacity 
              style={[
                styles.closeButton,
                isProcessing && styles.closeButtonDisabled
              ]} 
              onPress={handleBack}
              activeOpacity={0.6}
              pressRetentionOffset={20}
              disabled={isProcessing}
            >
              <View style={styles.closeButtonIconContainer}>
                <Text style={styles.closeButtonText}>✕</Text>
              </View>
            </TouchableOpacity>

            {/* PrimeForm Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoBackground}>
                <Image 
                  source={require('../../assets/images/PrimeLogo.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Welcome Text */}
            <Text style={[styles.welcomeText, language === 'ur' && styles.welcomeTextUrdu]}>
              {currentContent.welcome}
            </Text>
            
            {/* Title */}
            <Text style={[styles.title, language === 'ur' && styles.titleUrdu]}>
              {currentContent.title}
            </Text>
            
            {/* Description */}
            <Text style={[styles.description, language === 'ur' && styles.descriptionUrdu]}>
              {currentContent.description}
            </Text>

            {/* Language Options */}
            <View style={styles.languageContainer}>
              <TouchableOpacity 
                style={[
                  styles.languageButton,
                  isProcessing && styles.languageButtonDisabled
                ]} 
                onPress={() => handleLanguageSelect('en')}
                activeOpacity={0.7}
                pressRetentionOffset={20}
                disabled={isProcessing}
              >
                <View style={styles.languageButtonContent}>
                  <Text style={styles.languageButtonText}>{currentContent.english.label}</Text>
                  <Text style={styles.languageButtonSubtext}>{currentContent.english.subtext}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.languageButton,
                  isProcessing && styles.languageButtonDisabled
                ]} 
                onPress={() => handleLanguageSelect('ur')}
                activeOpacity={0.7}
                pressRetentionOffset={20}
                disabled={isProcessing}
              >
                <View style={styles.languageButtonContent}>
                  <Text style={styles.languageButtonText}>{currentContent.urdu.label}</Text>
                  <Text style={styles.languageButtonSubtext}>{currentContent.urdu.subtext}</Text>
                </View>
              </TouchableOpacity>
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
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 201, 124, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 124, 0.3)',
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  welcomeText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  welcomeTextUrdu: {
    fontFamily: fonts.body,
    lineHeight: 24,
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
  titleUrdu: {
    fontFamily: fonts.body,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    color: colors.mutedText,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  descriptionUrdu: {
    fontFamily: fonts.body,
    lineHeight: 28,
  },
  languageContainer: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  languageButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: spacing.md + 6,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 80,
  },
  languageButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonText: {
    color: colors.white,
    fontSize: typography.body + 1,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  languageButtonSubtext: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  languageButtonDisabled: {
    opacity: 0.6,
    backgroundColor: 'transparent',
  },
  bottomAccent: {
    width: 60,
    height: 3,
    backgroundColor: colors.gold,
    borderRadius: 2,
    opacity: 0.6,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButtonIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 20,
  },
  closeButtonDisabled: {
    opacity: 0.6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

