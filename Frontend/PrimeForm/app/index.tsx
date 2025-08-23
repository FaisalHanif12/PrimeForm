import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import { colors, spacing, typography } from '../src/theme/colors';
import DecorativeBackground from '../src/components/DecorativeBackground';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const { t } = useLanguage();
  const [firstLaunch, setFirstLaunch] = useState<boolean | null>(null); // null until checked

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem('primeform_first_launch');
        if (value === null) {
          // First time ever
          await AsyncStorage.setItem('primeform_first_launch', 'false');
          setFirstLaunch(true);
        } else {
          setFirstLaunch(false);
        }
      } catch (e) {
        console.warn('First launch check failed', e);
        setFirstLaunch(false);
      }
    };
    checkFirstLaunch();
  }, []);

  const showLoader = isLoading || firstLaunch === null;

  if (showLoader) {
    return (
      <DecorativeBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </DecorativeBackground>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(dashboard)" />;
  }

  // Not authenticated
  if (firstLaunch) {
    return <Redirect href="/auth/signup" />;
  }

  return <Redirect href="/auth/login" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    color: colors.white,
    fontSize: typography.body,
    textAlign: 'center',
  },
});
