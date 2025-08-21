import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, ZoomIn, FadeOut } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { colors, spacing, radius, typography, fonts } from '../theme/colors';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'destructive' | 'cancel';
}

interface CustomAlertProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onClose: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

const getAlertIcon = (type: AlertType) => {
  switch (type) {
    case 'success':
      return 'checkmark-circle';
    case 'error':
      return 'close-circle';
    case 'warning':
      return 'warning';
    case 'info':
      return 'information-circle';
    default:
      return 'information-circle';
  }
};

const getAlertColor = (type: AlertType) => {
  switch (type) {
    case 'success':
      return '#10B981';
    case 'error':
      return colors.error;
    case 'warning':
      return '#F59E0B';
    case 'info':
      return colors.gold;
    default:
      return colors.gold;
  }
};

export default function CustomAlert({
  visible,
  type = 'info',
  title,
  message,
  buttons = [{ text: 'OK', onPress: () => {} }],
  onClose,
  autoDismiss = false,
  autoDismissDelay = 2000,
}: CustomAlertProps) {
  
  useEffect(() => {
    if (visible && autoDismiss) {
      const timer = setTimeout(() => {
        onClose();
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }
  }, [visible, autoDismiss, autoDismissDelay, onClose]);

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        entering={FadeIn} 
        exiting={FadeOut}
        style={styles.overlay}
      >
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View 
          entering={ZoomIn} 
          style={styles.alertContainer}
        >
          <View style={styles.alert}>
            <View style={[styles.iconContainer, { backgroundColor: getAlertColor(type) + '20' }]}>
              <Ionicons 
                name={getAlertIcon(type)} 
                size={32} 
                color={getAlertColor(type)} 
              />
            </View>
            
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            
            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'destructive' && styles.destructiveButton,
                    button.style === 'cancel' && styles.cancelButton,
                    buttons.length === 1 && styles.singleButton,
                  ]}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.buttonText,
                    button.style === 'destructive' && styles.destructiveButtonText,
                    button.style === 'cancel' && styles.cancelButtonText,
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContainer: {
    width: width - 60,
    maxWidth: 320,
  },
  alert: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.body,
    fontFamily: fonts.body,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  singleButton: {
    backgroundColor: colors.gold,
  },
  destructiveButton: {
    backgroundColor: colors.error,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.mutedText,
  },
  buttonText: {
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: fonts.body,
    color: '#000',
  },
  destructiveButtonText: {
    color: colors.white,
  },
  cancelButtonText: {
    color: colors.mutedText,
  },
});
