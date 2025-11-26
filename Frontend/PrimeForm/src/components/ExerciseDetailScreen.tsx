import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  Animated,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, fonts, radius } from '../theme/colors';
import { WorkoutExercise } from '../services/aiWorkoutService';

const { width: screenWidth } = Dimensions.get('window');

interface ExerciseDetailScreenProps {
  exercise: WorkoutExercise | null;
  visible: boolean;
  onClose: () => void;
  onComplete?: () => Promise<void>;
  isCompleted?: boolean;
  canComplete?: boolean;
  selectedDay?: any;
}

export default function ExerciseDetailScreen({
  exercise,
  visible,
  onClose,
  onComplete,
  isCompleted = false,
  canComplete = true,
  selectedDay,
}: ExerciseDetailScreenProps) {
  const [completedSets, setCompletedSets] = useState<Set<number>>(new Set());
  const [isCompleting, setIsCompleting] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  // Reset state when modal opens with a new exercise
  useEffect(() => {
    if (visible && exercise) {
      console.log('🔄 ExerciseDetailScreen: Opening with exercise:', exercise.name);
      setCompletedSets(new Set());
      setIsCompleting(false);
    }
  }, [visible, exercise?.name]);

  // Animate modal entrance
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  if (!exercise) return null;

  const handleSetComplete = (setNumber: number) => {
    if (!canComplete) return;
    
    const newCompletedSets = new Set(completedSets);
    if (completedSets.has(setNumber)) {
      newCompletedSets.delete(setNumber);
    } else {
      newCompletedSets.add(setNumber);
    }
    setCompletedSets(newCompletedSets);
  };

  const handleCompleteExercise = async () => {
    if (!canComplete || isCompleting) {
      console.log('⚠️ Cannot complete - already completing or not allowed');
      return;
    }
    
    if (completedSets.size !== exercise.sets) {
      Alert.alert(
        'Complete All Sets',
        `Please complete all ${exercise.sets} sets before marking this exercise as complete.`,
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('========================================');
    console.log('✅ ExerciseDetailScreen: All sets completed, processing...');
    console.log('   Exercise:', exercise.name);
    console.log('   Completed sets:', Array.from(completedSets));
    console.log('========================================');
    
    setIsCompleting(true);

    try {
      // Mark exercise as complete in backend
      if (onComplete) {
        console.log('🔄 Calling onComplete to mark exercise as complete...');
        await onComplete();
        console.log('✅ Exercise marked as complete in backend');
      }
      
      // Close this modal - parent will handle showing completion screen
      console.log('🚪 Closing detail modal...');
      onClose();
      console.log('✅ Detail modal closed, parent will show completion screen');
      
    } catch (error) {
      console.error('❌ Error completing exercise:', error);
      Alert.alert('Error', 'Failed to complete exercise. Please try again.');
      setIsCompleting(false);
    }
  };

  const allSetsCompleted = completedSets.size === exercise.sets;
  const completionPercentage = (completedSets.size / exercise.sets) * 100;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <SafeAreaView style={styles.safeContainer}>
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => {
                console.log('🚪 Close button pressed, closing modal');
                onClose();
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Exercise Details</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Exercise Info Card */}
            <View style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseIcon}>
                  <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseStats}>
                    {exercise.sets} sets × {exercise.reps} reps
                  </Text>
                </View>
                {isCompleted && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>✓</Text>
                  </View>
                )}
              </View>

              <View style={styles.exerciseDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rest Time</Text>
                  <Text style={styles.detailValue}>{exercise.rest}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Target Muscles</Text>
                  <Text style={styles.detailValue}>{exercise.targetMuscles.join(', ')}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Calories Burned</Text>
                  <Text style={styles.detailValue}>{exercise.caloriesBurned} kcal</Text>
                </View>
              </View>
            </View>

            {/* Progress Card */}
            {canComplete && !isCompleted && (
              <View style={styles.progressCard}>
                <Text style={styles.sectionTitle}>Progress</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${completionPercentage}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {completedSets.size} of {exercise.sets} sets completed ({Math.round(completionPercentage)}%)
                </Text>
              </View>
            )}

            {/* Set Tracker */}
            {canComplete && !isCompleted && (
              <View style={styles.setTracker}>
                <Text style={styles.sectionTitle}>Track Your Sets</Text>
                <View style={styles.setsGrid}>
                  {Array.from({ length: exercise.sets }, (_, index) => {
                    const setNumber = index + 1;
                    const isSetCompleted = completedSets.has(setNumber);
                    
                    return (
                      <TouchableOpacity
                        key={setNumber}
                        style={[
                          styles.setButton,
                          isSetCompleted && styles.setButtonCompleted,
                        ]}
                        onPress={() => handleSetComplete(setNumber)}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.setButtonText,
                          isSetCompleted && styles.setButtonTextCompleted,
                        ]}>
                          {setNumber}
                        </Text>
                        <Text style={[
                          styles.setRepsText,
                          isSetCompleted && styles.setRepsTextCompleted,
                        ]}>
                          {exercise.reps} reps
                        </Text>
                        {isSetCompleted && (
                          <Text style={styles.setCheckmark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Exercise Tips */}
            <View style={styles.tipsSection}>
              <Text style={styles.sectionTitle}>💡 Exercise Tips</Text>
              <View style={styles.tipCard}>
                <Text style={styles.tipText}>
                  • Focus on proper form over speed
                </Text>
                <Text style={styles.tipText}>
                  • Breathe steadily throughout the movement
                </Text>
                <Text style={styles.tipText}>
                  • Take the full rest time between sets
                </Text>
                <Text style={styles.tipText}>
                  • Stop if you feel any pain or discomfort
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action */}
          {canComplete && !isCompleted && (
            <View style={styles.bottomAction}>
              <TouchableOpacity
                style={[
                  styles.completeButton,
                  allSetsCompleted && styles.completeButtonActive,
                  isCompleting && styles.completeButtonDisabled,
                ]}
                onPress={handleCompleteExercise}
                disabled={!allSetsCompleted || isCompleting}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.completeButtonText,
                  allSetsCompleted && styles.completeButtonTextActive,
                  isCompleting && styles.completeButtonTextDisabled,
                ]}>
                  {isCompleting 
                    ? 'Completing...' 
                    : allSetsCompleted 
                      ? 'Complete Exercise ✓' 
                      : `Complete ${completedSets.size}/${exercise.sets} sets`
                  }
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBorder + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  exerciseIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  exerciseEmoji: {
    fontSize: 32,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  exerciseStats: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  completedBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  exerciseDetails: {
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder + '30',
  },
  detailLabel: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  detailValue: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.cardBorder + '30',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  setTracker: {
    marginBottom: spacing.lg,
  },
  setsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  setButton: {
    width: (screenWidth - spacing.lg * 2 - spacing.md * 2) / 3,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.cardBorder,
    position: 'relative',
  },
  setButtonCompleted: {
    backgroundColor: colors.green + '20',
    borderColor: colors.green,
  },
  setButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  setButtonTextCompleted: {
    color: colors.green,
  },
  setRepsText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  setRepsTextCompleted: {
    color: colors.green + 'CC',
  },
  setCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    color: colors.green,
    fontSize: 16,
    fontWeight: '900',
  },
  tipsSection: {
    marginBottom: spacing.xl,
  },
  tipCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tipText: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  bottomAction: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  completeButton: {
    backgroundColor: colors.cardBorder,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  completeButtonActive: {
    backgroundColor: colors.primary,
  },
  completeButtonDisabled: {
    backgroundColor: colors.cardBorder + '50',
  },
  completeButtonText: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  completeButtonTextActive: {
    color: colors.white,
  },
  completeButtonTextDisabled: {
    color: colors.mutedText + '80',
  },
});
