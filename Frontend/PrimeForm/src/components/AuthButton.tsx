import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../theme/colors';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function AuthButton({ label, onPress, loading, disabled, style }: Props) {
  const isDisabled = disabled || loading;
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1500 }), -1, true);
  }, [pulse]);

  const glow = useAnimatedStyle(() => ({
    shadowOpacity: 0.35 + pulse.value * 0.2,
    transform: [{ scale: 1 + pulse.value * 0.01 }],
  }));

  const handlePress = () => {
    if (!isDisabled && onPress) {
      console.log('🔘 AuthButton pressed - label:', label);
      onPress();
    } else {
      console.log('⚠️ AuthButton blocked', { isDisabled, disabled, loading, hasOnPress: !!onPress });
    }
  };

  return (
    <Animated.View style={glow} pointerEvents="box-none">
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={handlePress} 
        disabled={isDisabled} 
        style={[isDisabled && styles.buttonDisabled, style]}
      >
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          colors={[ colors.primary, '#2C3C54', '#0A0F1A' ]}
          style={styles.button}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.label}>{label}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(146, 180, 216, 0.35)',
    shadowColor: '#0A1829',
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  label: {
    color: colors.white,
    fontSize: typography.subtitle,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});


