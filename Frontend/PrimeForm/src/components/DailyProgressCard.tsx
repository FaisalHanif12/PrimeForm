import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';

interface DailyProgressCardProps {
  dayName: string;
  date: string;
  status: 'completed' | 'rest' | 'upcoming' | 'missed';
  onPress?: () => void;
}

export default function DailyProgressCard({ 
  dayName, 
  date, 
  status, 
  onPress 
}: DailyProgressCardProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          backgroundColor: colors.green,
          icon: '✅',
          label: 'Done',
          textColor: colors.white
        };
      case 'rest':
        return {
          backgroundColor: colors.surface,
          icon: '😴',
          label: 'Rest',
          textColor: colors.white
        };
      case 'upcoming':
        return {
          backgroundColor: colors.surface,
          icon: '',
          label: 'Upc',
          textColor: colors.white
        };
      case 'missed':
        return {
          backgroundColor: colors.error,
          icon: '❌',
          label: 'Missed',
          textColor: colors.white
        };
      default:
        return {
          backgroundColor: colors.surface,
          icon: '',
          label: 'Upc',
          textColor: colors.white
        };
    }
  };

  const config = getStatusConfig();

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: config.backgroundColor }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{config.icon}</Text>
      </View>
      
      <Text style={[styles.label, { color: config.textColor }]}>
        {config.label}
      </Text>
      
      <Text style={[styles.dayName, { color: config.textColor }]}>
        {dayName}
      </Text>
      
      <Text style={[styles.date, { color: config.textColor }]}>
        {date}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 80,
    height: 100,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  iconContainer: {
    marginBottom: spacing.xs,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.body,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  dayName: {
    fontSize: typography.body,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: 10,
    fontFamily: fonts.body,
  },
});
