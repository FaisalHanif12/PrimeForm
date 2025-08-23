import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';

interface WorkoutItem {
  name: string;
  sets: string;
  reps?: string;
  weight?: string;
}

interface Props {
  title: string;
  workouts: WorkoutItem[];
  onPress?: () => void;
  delay?: number;
}

export default function WorkoutPlanCard({ title, workouts, onPress, delay = 0 }: Props) {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay)} 
      style={styles.container}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.iconContainer}>
                <Ionicons name="fitness" size={20} color={colors.gold} />
              </View>
            </View>
            
            <View style={styles.workoutList}>
              {workouts.map((workout, index) => (
                <View key={index} style={styles.workoutItem}>
                  <View style={styles.workoutIcon}>
                    <Ionicons name="barbell" size={16} color={colors.mutedText} />
                  </View>
                  
                  <View style={styles.workoutContent}>
                    <Text style={styles.workoutName}>{workout.name}</Text>
                    <View style={styles.workoutDetails}>
                      <Text style={styles.workoutSets}>{workout.sets}</Text>
                      {workout.reps && (
                        <Text style={styles.workoutReps}>{workout.reps}</Text>
                      )}
                      {workout.weight && (
                        <Text style={styles.workoutWeight}>{workout.weight}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
            
            {onPress && (
              <TouchableOpacity style={styles.viewAllButton} onPress={onPress}>
                <Text style={styles.viewAllText}>View Full Workout</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.gold} />
              </TouchableOpacity>
            )}
          </View>
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: typography.subtitle,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutList: {
    marginBottom: spacing.md,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  workoutIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  workoutContent: {
    flex: 1,
  },
  workoutName: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '500',
    fontFamily: fonts.body,
    marginBottom: 2,
  },
  workoutDetails: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  workoutSets: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '600',
  },
  workoutReps: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
  workoutWeight: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  viewAllText: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
});

