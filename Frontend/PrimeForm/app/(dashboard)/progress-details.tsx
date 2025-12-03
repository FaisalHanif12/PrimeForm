import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import DashboardHeader from '../../src/components/DashboardHeader';
import { useAuthContext } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { colors, spacing, fonts, typography, radius } from '../../src/theme/colors';

export default function ProgressDetailsScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { t } = useLanguage();

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        <DashboardHeader
          userName={user?.fullName || t('common.user')}
          onProfilePress={() => {}}
          onNotificationPress={() => {}}
          notificationCount={0}
        />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Detailed Progress</Text>
          <Text style={styles.subtitle}>
            A deeper breakdown of your calories, workouts, water intake and macronutrients will
            appear here.
          </Text>

          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderIcon}>📊</Text>
            <Text style={styles.placeholderTitle}>Coming Soon</Text>
            <Text style={styles.placeholderText}>
              We&apos;ll soon add rich weekly and monthly insights, comparisons and AI-guided
              recommendations on this page.
            </Text>
          </View>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    marginBottom: spacing.xl,
  },
  placeholderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: spacing.xl,
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  placeholderTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  backButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },
});


