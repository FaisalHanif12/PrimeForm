import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';

interface DailyProgressCardProps {
  dayName: string;
  date: string;
  status: 'completed' | 'rest' | 'upcoming' | 'missed' | 'in_progress';
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
          icon: '✓',
          label: 'Done',
          textColor: colors.white,
          borderColor: colors.green
        };
      case 'in_progress':
        return {
          backgroundColor: colors.primary,
          icon: '🔥',
          label: 'Today',
          textColor: colors.white,
          borderColor: colors.primary
        };
      case 'rest':
        return {
          backgroundColor: '#4A5568',
          icon: '🏃‍♂️',
          label: 'Active',
          textColor: colors.white,
          borderColor: '#4A5568'
        };
      case 'upcoming':
        return {
          backgroundColor: colors.surface,
          icon: '📅',
          label: 'Next',
          textColor: colors.white,
          borderColor: colors.cardBorder
        };
      case 'missed':
        return {
          backgroundColor: colors.error,
          icon: '✗',
          label: 'Missed',
          textColor: colors.white,
          borderColor: colors.error
        };
      default:
        return {
          backgroundColor: colors.surface,
          icon: '',
          label: 'Upc',
          textColor: colors.white,
          borderColor: colors.cardBorder
        };
    }
  };

  const config = getStatusConfig();

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor
        }
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Icon at the top */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{config.icon}</Text>
      </View>
      
      {/* Status label */}
      <Text style={[styles.label, { color: config.textColor }]}>
        {config.label}
      </Text>
      
      {/* Day name */}
      <Text style={[styles.dayName, { color: config.textColor }]}>
        {dayName}
      </Text>
      
      {/* Date */}
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
    borderWidth: 1,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: spacing.xs,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.body,
    fontWeight: '500',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  date: {
    fontSize: 10,
    fontFamily: fonts.body,
    textAlign: 'center',
    opacity: 0.8,
  },
});