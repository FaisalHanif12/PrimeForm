import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../theme/colors';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

const CARD_RADIUS = 22;

export default function GlassCard({ children, style }: Props) {
  return (
    <View style={[styles.wrapper, style]}>
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={["rgba(255,255,255,0.12)", colors.cardBorder, "rgba(255,255,255,0.06)"]}
        style={styles.borderLayer}
      >
        <View style={styles.surface}>
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={45}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
          ) : null}
          <View style={styles.inner}>{children}</View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: CARD_RADIUS,
    // Avoid overflow clipping on Android to prevent TextInput caret rendering issues
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
    shadowColor: '#0A0F1A',
    shadowOpacity: 0.55,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
  },
  borderLayer: {
    borderRadius: CARD_RADIUS,
    padding: 1,
  },
  surface: {
    padding: spacing.xl,
    backgroundColor: 'rgba(17, 25, 40, 0.6)',
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    // Avoid overflow clipping on Android to prevent TextInput caret rendering issues
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
  },
  inner: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
});


