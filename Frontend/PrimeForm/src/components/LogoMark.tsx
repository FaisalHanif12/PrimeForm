import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing } from '../theme/colors';

type Props = {
  subtitle?: string;
};

export default function LogoMark({ subtitle }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(700)} style={styles.container}>
      <Image source={require('../../assets/images/PrimeLogo.png')} style={styles.icon} />
      <Text style={styles.title}>PRIMEFORM</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 100,
    height: 100,
    marginBottom: 10,
    // Preserve original icon colors to match brand artwork
  },
  title: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: spacing.lg,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-light',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    marginTop: 4,
    color: colors.mutedText,
  },
});


