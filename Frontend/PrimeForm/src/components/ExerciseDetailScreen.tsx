import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { WorkoutExercise } from '../services/aiWorkoutService';
import ExerciseAnimation from './ExerciseAnimation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ExerciseDetailScreenProps {
  exercise: WorkoutExercise | null;
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
  isCompleted?: boolean;
  canComplete?: boolean; // Based on day status
}

export default function ExerciseDetailScreen({
  exercise,
  visible,
  onClose,
  onComplete,
  isCompleted = false,
  canComplete = true,
}: ExerciseDetailScreenProps) {
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState<Set<number>>(new Set());
  const [isWorkoutMode, setIsWorkoutMode] = useState(false);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [currentRep, setCurrentRep] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);

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

  const handleCompleteExercise = () => {
    if (onComplete && canComplete) {
      onComplete();
      onClose();
    }
  };

  const handleStartWorkout = () => {
    setIsWorkoutMode(true);
    setWorkoutStarted(true);
    setCurrentRep(0);
  };

  const handleRepComplete = () => {
    const newRep = currentRep + 1;
    setCurrentRep(newRep);
    
    if (newRep >= exercise.reps) {
      // Set completed
      const newCompletedSets = new Set(completedSets);
      newCompletedSets.add(currentSet);
      setCompletedSets(newCompletedSets);
      
      // Start rest period
      setIsResting(true);
      setRestTimeLeft(parseInt(exercise.rest.replace(/\D/g, '')) || 60);
      
      // Reset for next set
      setCurrentRep(0);
      setCurrentSet(prev => prev + 1);
    }
  };

  const handleRestComplete = () => {
    setIsResting(false);
    setRestTimeLeft(0);
  };

  const handleWorkoutComplete = () => {
    setIsWorkoutMode(false);
    setWorkoutStarted(false);
    if (onComplete && canComplete) {
      onComplete();
    }
  };

  const allSetsCompleted = completedSets.size === exercise.sets;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exercise Details</Text>
          <View style={styles.placeholder} />
        </View>

        {isWorkoutMode ? (
          // Workout Mode with Animation
          <View style={styles.workoutContainer}>
            {/* Animation Section */}
            <View style={styles.animationSection}>
              <ExerciseAnimation
                exerciseType={exercise.name}
                isVisible={workoutStarted && !isResting}
                style={styles.animationContainer}
              />
            </View>

            {/* Workout Progress */}
            <View style={styles.workoutProgress}>
              <Text style={styles.workoutTitle}>
                {isResting ? 'Rest Time' : `${exercise.name} - Set ${currentSet}`}
              </Text>
              
              {isResting ? (
                <View style={styles.restContainer}>
                  <Text style={styles.restTime}>{restTimeLeft}s</Text>
                  <Text style={styles.restText}>Take a break and prepare for the next set</Text>
                  <TouchableOpacity
                    style={styles.restButton}
                    onPress={handleRestComplete}
                  >
                    <Text style={styles.restButtonText}>Start Next Set</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.repContainer}>
                  <Text style={styles.repCount}>{currentRep} / {exercise.reps}</Text>
                  <Text style={styles.repLabel}>Reps Completed</Text>
                  <TouchableOpacity
                    style={styles.repButton}
                    onPress={handleRepComplete}
                  >
                    <Text style={styles.repButtonText}>Complete Rep</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Workout Stats */}
            <View style={styles.workoutStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{completedSets.size}</Text>
                <Text style={styles.statLabel}>Sets Done</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{exercise.sets}</Text>
                <Text style={styles.statLabel}>Total Sets</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{exercise.caloriesBurned}</Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>
            </View>
          </View>
        ) : (
          // Normal Exercise Details
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
        )}

        {/* Bottom Action */}
        {canComplete && !isCompleted && !isWorkoutMode && (
          <View style={styles.bottomAction}>
            <TouchableOpacity
              style={styles.startWorkoutButton}
              onPress={handleStartWorkout}
            >
              <Text style={styles.startWorkoutButtonText}>🚀 Start Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.completeButton,
                allSetsCompleted && styles.completeButtonActive,
              ]}
              onPress={handleCompleteExercise}
              disabled={!allSetsCompleted}
            >
              <Text style={[
                styles.completeButtonText,
                allSetsCompleted && styles.completeButtonTextActive,
              ]}>
                {allSetsCompleted ? 'Complete Exercise ✓' : `Complete ${completedSets.size}/${exercise.sets} sets`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Workout Mode Bottom Action */}
        {isWorkoutMode && allSetsCompleted && (
          <View style={styles.bottomAction}>
            <TouchableOpacity
              style={styles.workoutCompleteButton}
              onPress={handleWorkoutComplete}
            >
              <Text style={styles.workoutCompleteButtonText}>🎉 Complete Workout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  setTracker: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
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
  completeButtonText: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  completeButtonTextActive: {
    color: colors.white,
  },

  // Workout Mode Styles
  workoutContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  animationSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  animationContainer: {
    width: '100%',
    height: 300,
  },
  workoutProgress: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  workoutTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  restContainer: {
    alignItems: 'center',
  },
  restTime: {
    color: colors.primary,
    fontSize: 48,
    fontWeight: '900',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
  },
  restText: {
    color: colors.mutedText,
    fontSize: 16,
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  restButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  restButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  repContainer: {
    alignItems: 'center',
  },
  repCount: {
    color: colors.primary,
    fontSize: 36,
    fontWeight: '900',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
  },
  repLabel: {
    color: colors.mutedText,
    fontSize: 16,
    fontFamily: fonts.body,
    marginBottom: spacing.lg,
  },
  repButton: {
    backgroundColor: colors.green,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  repButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    margin: spacing.lg,
    marginTop: 0,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  startWorkoutButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  startWorkoutButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  workoutCompleteButton: {
    backgroundColor: colors.green,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  workoutCompleteButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
});