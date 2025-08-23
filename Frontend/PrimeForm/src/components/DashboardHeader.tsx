import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  userName: string;
  onProfilePress: () => void;
  onNotificationPress: () => void;
  notificationCount?: number;
}

export default function DashboardHeader({ 
  userName, 
  onProfilePress, 
  onNotificationPress, 
  notificationCount = 0 
}: Props) {
  const { t } = useLanguage();
  return (
    <Animated.View entering={FadeInUp} style={styles.container}>
      {/* Profile Icon */}
      <TouchableOpacity 
        style={styles.profileButton}
        onPress={onProfilePress}
        activeOpacity={0.7}
      >
        <View style={styles.profileIconContainer}>
          <Ionicons name="person" size={24} color={colors.gold} />
        </View>
      </TouchableOpacity>

      {/* Center - App Brand */}
      <View style={styles.centerContainer}>
        <Text style={styles.brandText}>{t('app.name')}</Text>
      </View>

      {/* Notification Icon */}
      <TouchableOpacity 
        style={styles.notificationButton}
        onPress={onNotificationPress}
        activeOpacity={0.7}
      >
        <View style={styles.notificationIconContainer}>
          <Ionicons name="notifications" size={24} color={colors.gold} />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60, // Status bar padding
    paddingBottom: spacing.lg,
  },
  profileButton: {
    padding: spacing.sm,
  },
  profileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: fonts.brandBold,
    color: colors.white,
    letterSpacing: 1,
  },
  brandAccent: {
    color: colors.gold,
    marginLeft: 2,
  },
  notificationButton: {
    padding: spacing.sm,
  },
  notificationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  notificationCount: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
});

