import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions, Alert, Pressable, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, ZoomIn, SlideInRight, FadeIn } from 'react-native-reanimated';
import { colors, spacing, fonts, radius } from '../../src/theme/colors';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserCacheKey, getCurrentUserId } from '../../src/utils/cacheKeys';
import { useToast } from '../../src/context/ToastContext';
import ExerciseAnimation from '../../src/components/ExerciseAnimation';

const { width: screenWidth } = Dimensions.get('window');

interface Exercise {
  id: string;
  name: string;
  category: string;
  emoji: string;
  difficulty: string;
  calories?: number;
}

// Professional icons for exercises with variety
const exerciseIcons: Record<string, string> = {
  // Chest - Push-up variations
  'military_pushups': 'fitness-outline',
  'staggered_pushups': 'git-compare-outline',
  'wide_arm_pushup': 'expand-outline',
  'decline_pushups': 'trending-down-outline',
  'incline_pushups': 'trending-up-outline',
  'diamond_pushups': 'diamond-outline',
  
  // Back - Pull & Row exercises
  'pullups': 'arrow-up-circle-outline',
  'deadlifts': 'barbell-outline',
  'superman': 'airplane-outline',
  'rows': 'remove-outline',
  
  // Arms - Curl & Press movements
  'bicep_curls': 'refresh-outline',
  'tricep_dips': 'chevron-down-circle-outline',
  'hammer_curls': 'hammer-outline',
  'overhead_press': 'arrow-up-outline',
  'shoulder_press': 'push-outline',
  
  // Legs - Squat & Jump movements
  'squats': 'resize-outline',
  'lunges': 'walk-outline',
  'jump_squats': 'rocket-outline',
  'squat_kicks': 'tennisball-outline',
  'squat_reach': 'hand-right-outline',
  'split_jump': 'flash-outline',
  'leg_press': 'arrows-collapse-outline',
  'single_leg_rotation': 'sync-outline',
  
  // Abs - Core exercises
  'planks': 'remove-circle-outline',
  't_plank': 'git-branch-outline',
  'crunches': 'contrast-outline',
  'sit_ups': 'triangle-outline',
  'flutter_kicks': 'pulse-outline',
  'reverse_crunches': 'return-up-back-outline',
  'deadbug': 'bug-outline',
  'seated_abs_circles': 'disc-outline',
  'frog_press': 'paw-outline',
  
  // Full Body - Cardio & Compound movements
  'burpees': 'flame-outline',
  'jumping_jacks': 'star-outline',
  'running': 'speedometer-outline',
  'punches': 'hand-left-outline',
  'squat_kick': 'football-outline',
};

export default function PersonalizedWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<number | null>(null);

  useEffect(() => {
    loadWorkout();
    checkTodayCompletion();
  }, []);

  // ✅ OPTIMIZATION: Re-check completion status when screen comes into focus
  // Only check if it's been more than 10 seconds since last check to prevent rapid successive calls
  const lastCompletionCheck = React.useRef<number>(0);
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // Debounce rapid focus changes (e.g., keyboard show/hide)
      if (now - lastCompletionCheck.current > 10000) {
        checkTodayCompletion();
        lastCompletionCheck.current = now;
      }
    }, [])
  );

  const getStorageKeys = async () => {
    const userId = await getCurrentUserId();
    const workoutKey = userId
      ? await getUserCacheKey('personalizedWorkout', userId)
      : 'personalizedWorkout';
    const completionKey = userId
      ? await getUserCacheKey('lastWorkoutCompletion', userId)
      : 'lastWorkoutCompletion';
    return { workoutKey, completionKey };
  };

  const loadWorkout = async () => {
    try {
      const { workoutKey } = await getStorageKeys();
      const savedWorkout = await AsyncStorage.getItem(workoutKey);
      if (savedWorkout) {
        setExercises(JSON.parse(savedWorkout));
      } else {
        // Fallback: migrate legacy global key if present
        if (workoutKey !== 'personalizedWorkout') {
          const legacy = await AsyncStorage.getItem('personalizedWorkout');
          if (legacy) {
            await AsyncStorage.setItem(workoutKey, legacy);
            await AsyncStorage.removeItem('personalizedWorkout');
            setExercises(JSON.parse(legacy));
            return;
          }
        }
        router.back();
      }
    } catch (error) {
      showToast('error', 'Failed to load workout');
    }
  };

  const checkTodayCompletion = async () => {
    try {
      const { completionKey } = await getStorageKeys();
      const lastCompletionDate = await AsyncStorage.getItem(completionKey);
      const today = new Date().toDateString();
      
      // Explicitly set the state based on whether dates match
      if (lastCompletionDate === today) {
        setTodayCompleted(true);
      } else {
        setTodayCompleted(false);
      }
    } catch (error) {
      console.error('Error checking today completion:', error);
      setTodayCompleted(false);
    }
  };

  const handleStartWorkout = () => {
    if (todayCompleted) {
      showToast('info', "You've already completed today's workout! Come back tomorrow.");
      return;
    }
    setIsWorkoutStarted(true);
    setCurrentExerciseIndex(0);
    setCompletedExercises([]);
  };

  const handleCompleteExercise = () => {
    const newCompleted = [...completedExercises, currentExerciseIndex];
    setCompletedExercises(newCompleted);

    if (currentExerciseIndex < exercises.length - 1) {
      // Move to next exercise
      setTimeout(() => {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      }, 500);
    } else {
      // All exercises completed
      handleWorkoutComplete();
    }
  };

  const handleWorkoutComplete = async () => {
    try {
      // Calculate total calories burned
      const totalCalories = exercises.reduce((sum, ex) => sum + (ex.calories || 60), 0);
      
      const today = new Date().toDateString();
      const { completionKey } = await getStorageKeys();
      await AsyncStorage.setItem(completionKey, today);
      setTodayCompleted(true);
      setIsWorkoutStarted(false);
      showToast('success', `🎉 Workout Complete! You burned ${totalCalories} calories!`);
      
      setTimeout(() => {
        router.back();
      }, 2500);
    } catch (error) {
      showToast('error', 'Failed to save completion');
    }
  };

  const handleDeleteWorkout = () => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete your personalized workout? You will need to create a new one.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove both the workout and the completion date
              const { workoutKey, completionKey } = await getStorageKeys();
              await AsyncStorage.removeItem(workoutKey);
              await AsyncStorage.removeItem(completionKey);
              showToast('success', 'Workout deleted');
              router.back();
            } catch (error) {
              showToast('error', 'Failed to delete workout');
            }
          },
        },
      ]
    );
  };

  const handleReorderToggle = () => {
    setIsReorderMode(!isReorderMode);
  };

  const handleMoveExercise = (fromIndex: number, toIndex: number) => {
    const newExercises = [...exercises];
    const [movedExercise] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, movedExercise);
    setExercises(newExercises);
  };

  const handleSaveOrder = async () => {
    try {
      const { workoutKey } = await getStorageKeys();
      await AsyncStorage.setItem(workoutKey, JSON.stringify(exercises));
      showToast('success', 'Exercise order saved!');
      setIsReorderMode(false);
    } catch (error) {
      showToast('error', 'Failed to save order');
    }
  };

  const handleDeleteExercise = (index: number) => {
    setExerciseToDelete(index);
    setShowDeleteModal(true);
  };

  const confirmDeleteExercise = async () => {
    if (exerciseToDelete === null) return;
    
    try {
      const newExercises = exercises.filter((_, i) => i !== exerciseToDelete);
      
      if (newExercises.length === 0) {
        // If no exercises left, delete the entire workout
        const { workoutKey, completionKey } = await getStorageKeys();
        await AsyncStorage.removeItem(workoutKey);
        await AsyncStorage.removeItem(completionKey);
        showToast('success', 'Workout deleted');
        setShowDeleteModal(false);
        router.back();
      } else {
        // Update with remaining exercises
        setExercises(newExercises);
        const { workoutKey } = await getStorageKeys();
        await AsyncStorage.setItem(workoutKey, JSON.stringify(newExercises));
        showToast('success', 'Exercise removed');
        setShowDeleteModal(false);
        setExerciseToDelete(null);
      }
    } catch (error) {
      showToast('error', 'Failed to remove exercise');
      setShowDeleteModal(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setExerciseToDelete(null);
  };

  const currentExercise = exercises[currentExerciseIndex];
  const progress = exercises.length > 0 ? ((completedExercises.length / exercises.length) * 100) : 0;

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.springify()} 
          style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>My Daily Workout</Text>
            <Text style={styles.headerSubtitle}>{exercises.length} exercises</Text>
          </View>
          <View style={styles.headerRight}>
            {!isWorkoutStarted && !todayCompleted && (
              <TouchableOpacity 
                style={[styles.reorderButton, isReorderMode && styles.reorderButtonActive]} 
                onPress={handleReorderToggle} 
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={isReorderMode ? "checkmark" : "swap-vertical"} 
                  size={22} 
                  color={isReorderMode ? colors.primary : colors.white} 
                />
              </TouchableOpacity>
            )}
            {!isWorkoutStarted && !todayCompleted && exercises.length < 8 && (
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={() => router.push('/(dashboard)/create-personalized-workout')} 
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={22} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {!isWorkoutStarted ? (
            /* Overview Mode */
            <>
              {/* Status Card */}
              <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.statusCard}>
                <LinearGradient
                  colors={
                    todayCompleted 
                      ? [colors.primary + '30', colors.primary + '20'] as [string, string]
                      : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] as [string, string]
                  }
                  style={styles.statusGradient}
                >
                  <Ionicons 
                    name={todayCompleted ? "checkmark-circle" : "calendar"} 
                    size={48} 
                    color={todayCompleted ? colors.primary : colors.white} 
                  />
                  <Text style={styles.statusTitle}>
                    {todayCompleted ? "Today's Workout Complete!" : "Ready to Start?"}
                  </Text>
                  <Text style={styles.statusSubtitle}>
                    {todayCompleted 
                      ? "Great job! Come back tomorrow for your next workout." 
                      : "Complete all exercises to finish your daily goal."}
                  </Text>
                </LinearGradient>
              </Animated.View>

              {/* Exercises List */}
              <View style={styles.exercisesList}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Your Exercises</Text>
                  {isReorderMode && (
                    <TouchableOpacity onPress={handleSaveOrder} style={styles.saveOrderButton}>
                      <Text style={styles.saveOrderText}>Save Order</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {exercises.map((exercise, index) => (
                  <Animated.View
                    key={exercise.id}
                    entering={FadeInUp.delay(200 + index * 50).springify()}
                    style={styles.exerciseItem}
                  >
                    <LinearGradient
                      colors={[colors.surface, colors.cardBackground] as [string, string]}
                      style={styles.exerciseItemGradient}
                    >
                      {isReorderMode && (
                        <View style={styles.reorderControls}>
                          <TouchableOpacity
                            onPress={() => index > 0 && handleMoveExercise(index, index - 1)}
                            disabled={index === 0}
                            style={[styles.reorderArrow, index === 0 && styles.reorderArrowDisabled]}
                          >
                            <Ionicons 
                              name="chevron-up" 
                              size={20} 
                              color={index === 0 ? colors.cardBorder : colors.primary} 
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => index < exercises.length - 1 && handleMoveExercise(index, index + 1)}
                            disabled={index === exercises.length - 1}
                            style={[styles.reorderArrow, index === exercises.length - 1 && styles.reorderArrowDisabled]}
                          >
                            <Ionicons 
                              name="chevron-down" 
                              size={20} 
                              color={index === exercises.length - 1 ? colors.cardBorder : colors.primary} 
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                      <View style={styles.exerciseItemIconContainer}>
                        <Ionicons 
                          name={exerciseIcons[exercise.id] as any || 'fitness-outline'} 
                          size={28} 
                          color={colors.primary} 
                        />
                      </View>
                      <View style={styles.exerciseItemInfo}>
                        <Text style={styles.exerciseItemName}>{exercise.name}</Text>
                        <View style={styles.exerciseItemMeta}>
                          <Text style={styles.exerciseItemCategory}>{exercise.category}</Text>
                          <View style={styles.calorieTag}>
                            <Ionicons name="flame" size={12} color={colors.primary} />
                            <Text style={styles.calorieText}>{exercise.calories || 60} cal</Text>
                          </View>
                        </View>
                      </View>
                      {isReorderMode ? (
                        <View style={styles.orderNumber}>
                          <Text style={styles.orderNumberText}>{index + 1}</Text>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          onPress={() => handleDeleteExercise(index)}
                          style={styles.exerciseDeleteButton}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                      )}
                    </LinearGradient>
                  </Animated.View>
                ))}
              </View>
            </>
          ) : (
            /* Workout Mode */
            <>
              {/* Progress Bar */}
              <Animated.View entering={FadeInUp.springify()} style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressText}>
                    Exercise {currentExerciseIndex + 1} of {exercises.length}
                  </Text>
                  <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>
              </Animated.View>

              {/* Current Exercise Card */}
              {currentExercise && (
                <Animated.View entering={ZoomIn.springify()} style={styles.currentExerciseCard}>
                  <LinearGradient
                    colors={[colors.surface, colors.surface]}
                    style={styles.currentExerciseGradient}
                  >
                    {/* Exercise Animation */}
                    <View style={styles.exerciseAnimationContainer}>
                      <ExerciseAnimation 
                        exerciseType={currentExercise.id}
                        isVisible={true}
                        style={styles.exerciseAnimation}
                      />
                    </View>

                    {/* Exercise Info */}
                    <View style={styles.currentExerciseInfo}>
                      <Text style={styles.currentExerciseName}>{currentExercise.name}</Text>
                      <View style={styles.currentExerciseTags}>
                        <View style={styles.currentExerciseTag}>
                          <Text style={styles.currentExerciseTagText}>{currentExercise.category}</Text>
                        </View>
                        <View style={styles.currentCalorieTag}>
                          <Ionicons name="flame" size={16} color={colors.primary} />
                          <Text style={styles.currentCalorieText}>{currentExercise.calories || 60} cal</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </Animated.View>
              )}

              {/* Completed Exercises Tracker */}
              <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.completedSection}>
                <Text style={styles.completedTitle}>Completed Exercises</Text>
                <View style={styles.completedGrid}>
                  {exercises.map((exercise, index) => {
                    const isCompleted = completedExercises.includes(index);
                    const isCurrent = index === currentExerciseIndex;
                    
                    return (
                      <View
                        key={exercise.id}
                        style={[
                          styles.completedDot,
                          isCompleted && styles.completedDotActive,
                          isCurrent && styles.completedDotCurrent,
                        ]}
                      >
                        {isCompleted && (
                          <Ionicons name="checkmark" size={16} color={colors.white} />
                        )}
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            </>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Action Button */}
        <Animated.View 
          entering={FadeInUp.delay(400).springify()} 
          style={styles.actionButtonContainer}
        >
          {!isWorkoutStarted ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleStartWorkout}
              style={styles.actionButton}
              disabled={todayCompleted}
            >
              <LinearGradient
                colors={
                  todayCompleted 
                    ? [colors.cardBorder, colors.surface] as [string, string]
                    : [colors.primary, colors.primary + 'DD'] as [string, string]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButtonGradient}
              >
                <Ionicons 
                  name={todayCompleted ? "checkmark-circle" : "play-circle"} 
                  size={28} 
                  color={colors.white} 
                />
                <Text style={styles.actionButtonText}>
                  {todayCompleted ? "Completed Today" : "Start Workout"}
                </Text>
                {!todayCompleted && <Ionicons name="arrow-forward" size={24} color={colors.white} />}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleCompleteExercise}
              style={styles.actionButton}
            >
              <LinearGradient
                colors={[colors.primary, colors.primary + 'DD'] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={28} color={colors.white} />
                <Text style={styles.actionButtonText}>
                  {currentExerciseIndex === exercises.length - 1 
                    ? "Finish Workout" 
                    : "Complete Exercise"}
                </Text>
                <Ionicons name="arrow-forward" size={24} color={colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>
      </SafeAreaView>

      {/* Custom Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={ZoomIn.springify()} style={styles.modalContainer}>
            <LinearGradient
              colors={[colors.surface, colors.cardBackground] as [string, string]}
              style={styles.modalGradient}
            >
              {/* Icon */}
              <View style={styles.modalIcon}>
                <Ionicons name="warning" size={48} color="#FF3B30" />
              </View>

              {/* Title */}
              <Text style={styles.modalTitle}>Remove Exercise</Text>

              {/* Message */}
              <Text style={styles.modalMessage}>
                {exerciseToDelete !== null && 
                  `Are you sure you want to remove "${exercises[exerciseToDelete]?.name}" from your workout?`
                }
              </Text>

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={cancelDelete}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalDeleteButton}
                  onPress={confirmDeleteExercise}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#FF3B30', '#FF3B30DD'] as [string, string]}
                    style={styles.modalDeleteGradient}
                  >
                    <Text style={styles.modalDeleteText}>Remove</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  headerSubtitle: {
    color: colors.mutedText,
    fontSize: 13,
    fontFamily: fonts.body,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reorderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  reorderButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  // Status Card
  statusCard: {
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  statusGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  statusTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  statusSubtitle: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },

  // Exercises List
  exercisesList: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  saveOrderButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  saveOrderText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },
  exerciseItem: {
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  exerciseItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  exerciseItemIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseItemInfo: {
    flex: 1,
  },
  exerciseItemName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginBottom: 4,
  },
  exerciseItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exerciseItemCategory: {
    color: colors.mutedText,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  calorieTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  calorieText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  reorderControls: {
    flexDirection: 'column',
    marginRight: spacing.sm,
  },
  reorderArrow: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '20',
    borderRadius: 16,
    marginVertical: 2,
  },
  reorderArrowDisabled: {
    backgroundColor: colors.surface,
    opacity: 0.3,
  },
  orderNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNumberText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  exerciseDeleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  // Progress Section
  progressSection: {
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },
  progressPercentage: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },

  // Current Exercise Card
  currentExerciseCard: {
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  currentExerciseGradient: {
    padding: spacing.lg,
  },
  exerciseAnimationContainer: {
    height: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  exerciseAnimation: {
    width: '100%',
    height: '100%',
  },
  currentExerciseInfo: {
    alignItems: 'center',
  },
  currentExerciseName: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  currentExerciseTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  currentExerciseTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.cardBackground,
  },
  currentExerciseTagText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  currentCalorieTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.primary + '20',
  },
  currentCalorieText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.body,
  },

  // Completed Section
  completedSection: {
    marginBottom: spacing.lg,
  },
  completedTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },
  completedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  completedDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  completedDotCurrent: {
    borderColor: colors.primary,
    borderWidth: 3,
  },

  // Action Button
  actionButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  actionButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.heading,
  },

  // Custom Delete Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF3B3020',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    color: colors.mutedText,
    fontSize: 16,
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },
  modalDeleteButton: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  modalDeleteGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalDeleteText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
});

