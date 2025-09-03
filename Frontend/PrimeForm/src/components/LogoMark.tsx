import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, spacing, fonts } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

type Props = {
  subtitle?: string;
};

export default function LogoMark({ subtitle }: Props) {
  const { t } = useLanguage();
  
  return (
    <Animated.View entering={FadeIn} style={styles.container}>
      <Image source={require('../../assets/images/Primelogo1.png')} style={styles.icon} />
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>{t('brand.primeform')}</Text>
      </View>
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
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  titleText: {
    color: colors.white,
    fontSize: 38,
    fontWeight: '300',
    letterSpacing: 4,
    fontFamily: fonts.brand,
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    // Add elegant shadow effect
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '400',
    fontFamily: fonts.body,
    letterSpacing: 1,
  },
});


