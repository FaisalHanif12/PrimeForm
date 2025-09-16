import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fonts } from '../theme/colors';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastNotificationProps {
  visible: boolean;
  type: ToastType;
  message: string;
  position?: 'top' | 'bottom';
  duration?: number;
  onHide: () => void;
}

const getToastConfig = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        backgroundColor: '#10B981',
        icon: 'checkmark-circle' as const,
        textColor: '#FFFFFF'
      };
    case 'error':
      return {
        backgroundColor: '#EF4444',
        icon: 'close-circle' as const,
        textColor: '#FFFFFF'
      };
    case 'warning':
      return {
        backgroundColor: '#F59E0B',
        icon: 'warning' as const,
        textColor: '#000000'
      };
    case 'info':
      return {
        backgroundColor: colors.primary,
        icon: 'information-circle' as const,
        textColor: '#FFFFFF'
      };
    default:
      return {
        backgroundColor: colors.primary,
        icon: 'information-circle' as const,
        textColor: '#FFFFFF'
      };
  }
};

export default function ToastNotification({
  visible,
  type,
  message,
  position = 'top',
  duration = 3000,
  onHide,
}: ToastNotificationProps) {
  const slideAnim = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in and fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: position === 'top' ? -100 : 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible && (slideAnim as any)._value === (position === 'top' ? -100 : 100)) {
    return null;
  }

  const config = getToastConfig(type);

  return (
    <View style={[styles.container, position === 'top' ? styles.topContainer : styles.bottomContainer]}>
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: config.backgroundColor,
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Ionicons 
          name={config.icon} 
          size={20} 
          color={config.textColor} 
          style={styles.icon}
        />
        <Text style={[styles.message, { color: config.textColor }]} numberOfLines={2}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: spacing.md,
  },
  topContainer: {
    top: Platform.OS === 'ios' ? 60 : 40,
  },
  bottomContainer: {
    bottom: Platform.OS === 'ios' ? 40 : 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    marginHorizontal: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: width - (spacing.md * 2),
  },
  icon: {
    marginRight: spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.body,
    lineHeight: 20,
  },
});
