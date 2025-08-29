import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useAuthContext } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import Sidebar from '../../src/components/Sidebar';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import { useToast } from '../../src/context/ToastContext';

const { width: screenWidth } = Dimensions.get('window');

interface Exercise {
  id: string;
  name: string;
  emoji: string;
  category: string;
  targetMuscles: string[];
}

const menExercises: Exercise[] = [
  { id: 'pushups', name: 'Push-ups', emoji: '🏃‍♂️', category: 'chest', targetMuscles: ['chest', 'triceps', 'shoulders'] },
  { id: 'pullups', name: 'Pull-ups', emoji: '🏋️‍♂️', category: 'back', targetMuscles: ['back', 'biceps'] },
  { id: 'squats', name: 'Squats', emoji: '🏋️‍♂️', category: 'legs', targetMuscles: ['quadriceps', 'glutes'] },
  { id: 'deadlifts', name: 'Deadlifts', emoji: '🏋️‍♂️', category: 'back', targetMuscles: ['back', 'hamstrings', 'glutes'] },
  { id: 'benchpress', name: 'Bench Press', emoji: '🏋️‍♂️', category: 'chest', targetMuscles: ['chest', 'triceps', 'shoulders'] },
  { id: 'bicepCurls', name: 'Bicep Curls', emoji: '💪‍♂️', category: 'arms', targetMuscles: ['biceps'] },
  { id: 'shoulderPress', name: 'Shoulder Press', emoji: '🏋️‍♂️', category: 'shoulders', targetMuscles: ['shoulders', 'triceps'] },
  { id: 'planks', name: 'Planks', emoji: '🧘‍♂️', category: 'core', targetMuscles: ['core', 'shoulders'] },
  { id: 'cycling', name: 'Cycling', emoji: '🚴‍♂️', category: 'cardio', targetMuscles: ['legs', 'glutes', 'core'] },
  { id: 'rowing', name: 'Rowing', emoji: '🚣‍♂️', category: 'full_body', targetMuscles: ['back', 'arms', 'legs'] },
  { id: 'jumping_jacks', name: 'Jumping Jacks', emoji: '🤸‍♂️', category: 'cardio', targetMuscles: ['full_body'] },
  { id: 'dumbbell_rows', name: 'Dumbbell Rows', emoji: '🏋️‍♂️', category: 'back', targetMuscles: ['back', 'biceps'] },
];

const womenExercises: Exercise[] = [
  { id: 'squats', name: 'Squats', emoji: '🏋️‍♀️', category: 'legs', targetMuscles: ['quadriceps', 'glutes'] },
  { id: 'lunges', name: 'Lunges', emoji: '🚶‍♀️', category: 'legs', targetMuscles: ['quadriceps', 'glutes', 'hamstrings'] },
  { id: 'glute_bridges', name: 'Glute Bridges', emoji: '🧘‍♀️', category: 'glutes', targetMuscles: ['glutes', 'hamstrings'] },
  { id: 'pushups', name: 'Push-ups', emoji: '🤸‍♀️', category: 'chest', targetMuscles: ['chest', 'triceps', 'shoulders'] },
  { id: 'planks', name: 'Planks', emoji: '🧘‍♀️', category: 'core', targetMuscles: ['core', 'shoulders'] },
  { id: 'mountain_climbers', name: 'Mountain Climbers', emoji: '🏃‍♀️', category: 'cardio', targetMuscles: ['core', 'legs', 'shoulders'] },
  { id: 'tricep_dips', name: 'Tricep Dips', emoji: '💪‍♀️', category: 'arms', targetMuscles: ['triceps', 'shoulders'] },
  { id: 'burpees', name: 'Burpees', emoji: '🤸‍♀️', category: 'full_body', targetMuscles: ['full_body'] },
  { id: 'yoga', name: 'Yoga', emoji: '🧘‍♀️', category: 'flexibility', targetMuscles: ['full_body'] },
  { id: 'pilates', name: 'Pilates', emoji: '🧘‍♀️', category: 'core', targetMuscles: ['core', 'flexibility'] },
  { id: 'cycling', name: 'Cycling', emoji: '🚴‍♀️', category: 'cardio', targetMuscles: ['legs', 'glutes', 'core'] },
  { id: 'dance_cardio', name: 'Dance Cardio', emoji: '💃', category: 'cardio', targetMuscles: ['full_body'] },
];

export default function GymScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'men' | 'women'>('men');
  
  const sliderPosition = useSharedValue(selectedSection === 'men' ? 0 : 1);
  
  const animatedSliderStyle = useAnimatedStyle(() => {
    const containerWidth = screenWidth - (spacing.lg * 2) - (spacing.md * 2); // Account for content padding and selector padding
    const sliderWidth = containerWidth * 0.48; // 48% of container
    const maxTranslate = containerWidth - sliderWidth - 8; // Container width minus slider width minus padding
    return {
      transform: [{ translateX: withSpring(sliderPosition.value * maxTranslate, { damping: 20, stiffness: 200 }) }],
    };
  });

  const handleProfilePress = () => {
    setSidebarVisible(true);
  };

  const handleSidebarMenuPress = async (action: string) => {
    switch (action) {
      case 'profile':
        router.push('/(dashboard)');
        break;
      case 'edit_profile':
        showToast('info', 'Edit profile feature coming soon!');
        break;
      case 'settings':
        showToast('info', 'Settings feature coming soon!');
        break;
      case 'subscription':
        showToast('info', 'Subscription Plan feature coming soon!');
        break;
      case 'logout':
        try {
          const { authService } = await import('../../src/services/authService');
          await authService.logout();
          router.replace('/auth/login');
        } catch (error) {
          console.error('Logout failed:', error);
          showToast('error', 'Failed to logout. Please try again.');
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
    setSidebarVisible(false);
  };

  const handleTabPress = (tab: 'home' | 'diet' | 'gym' | 'workout' | 'progress') => {
    if (tab === 'home') {
      router.push('/(dashboard)');
    } else if (tab === 'diet') {
      router.push('/(dashboard)/diet');
    } else if (tab === 'workout') {
      router.push('/(dashboard)/workout');
    } else {
      console.log('Feature coming soon:', tab);
    }
  };

  const handleExercisePress = (exercise: Exercise) => {
    router.push({
      pathname: '/(dashboard)/exercise-detail',
      params: {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseEmoji: exercise.emoji,
        category: exercise.category,
        targetMuscles: JSON.stringify(exercise.targetMuscles),
      },
    });
  };

  const renderExerciseCard = (exercise: Exercise, index: number) => (
    <Animated.View
      key={exercise.id}
      entering={FadeInUp.delay(index * 100)}
      style={styles.exerciseCard}
    >
      <TouchableOpacity
        style={styles.exerciseCardContent}
        onPress={() => handleExercisePress(exercise)}
        activeOpacity={0.8}
      >
        <View style={styles.exerciseEmojiContainer}>
          <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
        </View>
        <Text style={styles.exerciseName}>{t(`exercise.${exercise.id}`)}</Text>
        <Text style={styles.exerciseCategory}>{t(`category.${exercise.category}`).toUpperCase()}</Text>
        <View style={styles.targetMusclesContainer}>
          {exercise.targetMuscles.slice(0, 2).map((muscle, idx) => (
            <Text key={idx} style={styles.targetMuscle}>
              {t(`muscle.${muscle}`)}
            </Text>
          ))} 
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const currentExercises = selectedSection === 'men' ? menExercises : womenExercises;

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        <DashboardHeader
          userName={user?.fullName || 'User'}
          onProfilePress={handleProfilePress}
          onNotificationPress={() => console.log('Notifications pressed')}
          notificationCount={0}
        />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <Animated.View entering={FadeInUp} style={styles.headerSection}>
            <Text style={styles.title}>{t('gym.title')}</Text>
            <Text style={styles.subtitle}>
              {t('gym.subtitle')}
            </Text>
          </Animated.View>

          {/* Section Selector */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.sectionSelector}>
            <View style={styles.modernToggleWrapper}>
              <View style={styles.modernToggleTrack}>
                <Animated.View 
                   style={[
                     styles.modernToggleSlider,
                     animatedSliderStyle
                   ]} 
                 />
                
                <TouchableOpacity
                   style={styles.modernToggleButton}
                   onPress={() => {
                     setSelectedSection('men');
                     sliderPosition.value = 0;
                   }}
                   activeOpacity={0.8}
                 >
                  <View style={styles.modernToggleContent}>
                    <View style={[
                      styles.modernIconWrapper,
                      selectedSection === 'men' && styles.modernIconWrapperActive
                    ]}>
                                          <Text style={[
                      styles.toggleEmoji,
                      selectedSection === 'men' && styles.toggleEmojiActive
                    ]}>
                      🏋️‍♂️
                    </Text>
                    </View>
                    <Text style={[
                      styles.modernToggleLabel,
                      selectedSection === 'men' && styles.modernToggleLabelActive
                    ]}>{t('gym.men')}</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                   style={styles.modernToggleButton}
                   onPress={() => {
                     setSelectedSection('women');
                     sliderPosition.value = 1;
                   }}
                   activeOpacity={0.8}
                 >
                  <View style={styles.modernToggleContent}>
                    <View style={[
                      styles.modernIconWrapper,
                      selectedSection === 'women' && styles.modernIconWrapperActive
                    ]}>
                                          <Text style={[
                      styles.toggleEmoji,
                      selectedSection === 'women' && styles.toggleEmojiActive
                    ]}>
                      🏃‍♀️
                    </Text>
                    </View>
                    <Text style={[
                      styles.modernToggleLabel,
                      selectedSection === 'women' && styles.modernToggleLabelActive
                    ]}>{t('gym.women')}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Exercises Grid */}
          <Animated.View entering={FadeInUp.delay(400)} style={styles.exercisesGrid}>
            {currentExercises.map((exercise, index) => renderExerciseCard(exercise, index))}
          </Animated.View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        <BottomNavigation activeTab="gym" onTabPress={handleTabPress} />

        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onMenuItemPress={handleSidebarMenuPress}
          userName={user?.fullName || 'User'}
          userEmail={user?.email || 'user@example.com'}
          userInfo={null}
        />
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
    paddingTop: 0,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '700',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionSelector: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  modernToggleWrapper: {
    alignItems: 'center',
  },
  modernToggleTrack: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 28,
    padding: 4,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    shadowColor: colors.gold,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modernToggleSlider: {
     position: 'absolute',
     top: 4,
     left: 4,
     width: '48%',
     height: 48,
     backgroundColor: colors.gold,
     borderRadius: 24,
     shadowColor: colors.gold,
     shadowOffset: {
       width: 0,
       height: 4,
     },
     shadowOpacity: 0.4,
     shadowRadius: 8,
     elevation: 6,
   },
  modernToggleButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  modernToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernIconWrapper: {
     width: 24,
     height: 24,
     borderRadius: 12,
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: spacing.sm,
     backgroundColor: 'transparent',
   },
   modernIconWrapperActive: {
     backgroundColor: 'transparent',
   },
 
  modernToggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.5,
  },
  modernToggleLabelActive: {
    color: colors.white,
    fontSize: 15,
  },
  toggleEmoji: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  toggleEmojiActive: {
    fontSize: 18,
    color: colors.white,
  },
  exercisesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  exerciseCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  exerciseCardContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  exerciseEmojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  exerciseEmoji: {
    fontSize: 32,
    textAlign: 'center',
  },
  
  exerciseName: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '700',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  exerciseCategory: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  targetMusclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  targetMuscle: {
    color: colors.mutedText,
    fontSize: 11,
    fontFamily: fonts.body,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  bottomSpacing: {
    height: 100,
  },
});