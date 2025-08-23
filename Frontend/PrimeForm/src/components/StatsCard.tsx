import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';

interface StatItem {
  label: string;
  value: string | number;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface Props {
  title: string;
  stats: StatItem[];
  delay?: number;
}

export default function StatsCard({ title, stats, delay = 0 }: Props) {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay)} 
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <View style={[styles.iconContainer, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon} size={18} color={stat.color} />
              </View>
              
              <View style={styles.statContent}>
                <View style={styles.valueContainer}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  {stat.unit && <Text style={styles.statUnit}>{stat.unit}</Text>}
                </View>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  title: {
    color: colors.white,
    fontSize: typography.subtitle,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  statContent: {
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  statUnit: {
    color: colors.mutedText,
    fontSize: 11,
    fontFamily: fonts.body,
    marginLeft: 2,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: 11,
    fontFamily: fonts.body,
    marginTop: 2,
  },
});

