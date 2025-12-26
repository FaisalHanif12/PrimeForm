import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fonts, radius } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons,
  onClose,
}) => {
  const { language } = useLanguage();
  const isRTL = language === 'ur';

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        
        <View style={styles.alertContainer}>
          <View style={[styles.alertBox, isRTL && styles.alertBoxRTL]}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons 
                  name={buttons.some(b => b.style === 'destructive') ? "alert-circle" : "information-circle"} 
                  size={32} 
                  color={buttons.some(b => b.style === 'destructive') ? '#FF6B6B' : colors.primary} 
                />
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.title, isRTL && styles.titleRTL]}>
              {title}
            </Text>

            {/* Message */}
            <Text style={[styles.message, isRTL && styles.messageRTL]}>
              {message}
            </Text>

            {/* Buttons */}
            <View style={[styles.buttonContainer, isRTL && styles.buttonContainerRTL]}>
              {buttons.map((button, index) => {
                const isDestructive = button.style === 'destructive';
                const isCancel = button.style === 'cancel';
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      isDestructive && styles.destructiveButton,
                      isCancel && styles.cancelButton,
                      !isCancel && !isDestructive && styles.primaryButton,
                      buttons.length === 2 && index === 0 && styles.buttonLeft,
                      buttons.length === 2 && index === 1 && styles.buttonRight,
                    ]}
                    onPress={() => handleButtonPress(button)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isDestructive && styles.destructiveButtonText,
                        isCancel && styles.cancelButtonText,
                        !isCancel && !isDestructive && styles.primaryButtonText,
                        isRTL && styles.buttonTextRTL,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  alertBox: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  alertBoxRTL: {
    direction: 'rtl',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontFamily: fonts.bold,
  },
  titleRTL: {
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  message: {
    fontSize: 15,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    fontFamily: fonts.regular,
  },
  messageRTL: {
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  buttonContainerRTL: {
    flexDirection: 'row-reverse',
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonLeft: {
    marginRight: 6,
  },
  buttonRight: {
    marginLeft: 6,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  destructiveButton: {
    backgroundColor: '#FF6B6B',
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.bold,
  },
  buttonTextRTL: {
    textAlign: 'center',
  },
  primaryButtonText: {
    color: colors.white,
  },
  cancelButtonText: {
    color: colors.mutedText,
  },
  destructiveButtonText: {
    color: colors.white,
  },
});

export default CustomAlert;

