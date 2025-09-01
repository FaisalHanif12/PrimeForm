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
  location: 'home' | 'gym' | 'both'; // New field for home vs gym
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  description: string;
}

const menExercises: Exercise[] = [
  // Chest Exercises
  { 
    id: 'pushups', 
    name: 'Push-ups', 
    emoji: '🤸‍♂️', 
    category: 'chest', 
    targetMuscles: ['chest', 'triceps', 'shoulders'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['none'],
    description: 'Classic bodyweight exercise targeting chest, triceps, and shoulders'
  },
  { 
    id: 'benchpress', 
    name: 'Bench Press', 
    emoji: '🏋️‍♂️', 
    category: 'chest', 
    targetMuscles: ['chest', 'triceps', 'shoulders'],
    location: 'gym',
    difficulty: 'intermediate',
    equipment: ['barbell', 'bench'],
    description: 'Compound movement for building chest strength and muscle mass'
  },
  { 
    id: 'incline_press', 
    name: 'Incline Press', 
    emoji: '🏋️‍♂️', 
    category: 'chest', 
    targetMuscles: ['chest', 'triceps', 'shoulders'],
    location: 'gym',
    difficulty: 'intermediate',
    equipment: ['barbell', 'incline_bench'],
    description: 'Targets upper chest muscles for balanced chest development'
  },
  { 
    id: 'dumbbell_press', 
    name: 'Dumbbell Press', 
    emoji: '🏋️‍♂️', 
    category: 'chest', 
    targetMuscles: ['chest', 'triceps', 'shoulders'],
    location: 'both',
    difficulty: 'intermediate',
    equipment: ['dumbbells', 'bench'],
    description: 'Great for muscle balance and range of motion'
  },

  // Back Exercises
  { 
    id: 'pullups', 
    name: 'Pull-ups', 
    emoji: '🏋️‍♂️', 
    category: 'back', 
    targetMuscles: ['back', 'biceps'],
    location: 'both',
    difficulty: 'intermediate',
    equipment: ['pullup_bar'],
    description: 'Excellent upper body strength builder targeting back and biceps'
  },
  { 
    id: 'deadlifts', 
    name: 'Deadlifts', 
    emoji: '🏋️‍♂️', 
    category: 'back', 
    targetMuscles: ['back', 'hamstrings', 'glutes'],
    location: 'gym',
    difficulty: 'advanced',
    equipment: ['barbell', 'weight_plates'],
    description: 'King of all exercises for overall strength and muscle development'
  },
  { 
    id: 'dumbbell_rows', 
    name: 'Dumbbell Rows', 
    emoji: '🏋️‍♂️', 
    category: 'back', 
    targetMuscles: ['back', 'biceps'],
    location: 'both',
    difficulty: 'beginner',
    equipment: ['dumbbells'],
    description: 'Isolated back exercise for muscle definition and strength'
  },
  { 
    id: 'lat_pulldowns', 
    name: 'Lat Pulldowns', 
    emoji: '🏋️‍♂️', 
    category: 'back', 
    targetMuscles: ['back', 'biceps'],
    location: 'gym',
    difficulty: 'beginner',
    equipment: ['lat_pulldown_machine'],
    description: 'Machine-based exercise for building wide back muscles'
  },

  // Arms Exercises
  { 
    id: 'bicepCurls', 
    name: 'Bicep Curls', 
    emoji: '💪‍♂️', 
    category: 'arms', 
    targetMuscles: ['biceps'],
    location: 'both',
    difficulty: 'beginner',
    equipment: ['dumbbells'],
    description: 'Classic bicep isolation exercise for arm development'
  },
  { 
    id: 'tricep_extensions', 
    name: 'Tricep Extensions', 
    emoji: '💪‍♂️', 
    category: 'arms', 
    targetMuscles: ['triceps'],
    location: 'both',
    difficulty: 'beginner',
    equipment: ['dumbbells'],
    description: 'Targets triceps for balanced arm development'
  },
  { 
    id: 'hammer_curls', 
    name: 'Hammer Curls', 
    emoji: '💪‍♂️', 
    category: 'arms', 
    targetMuscles: ['biceps', 'forearms'],
    location: 'both',
    difficulty: 'beginner',
    equipment: ['dumbbells'],
    description: 'Builds biceps and forearm strength simultaneously'
  },

  // Core Exercises
  { 
    id: 'planks', 
    name: 'Planks', 
    emoji: '🧘‍♂️', 
    category: 'core', 
    targetMuscles: ['core', 'shoulders'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['none'],
    description: 'Static core exercise for stability and endurance'
  },
  { 
    id: 'crunches', 
    name: 'Crunches', 
    emoji: '🧘‍♂️', 
    category: 'core', 
    targetMuscles: ['core'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['none'],
    description: 'Basic abdominal exercise for core strength'
  },
  { 
    id: 'russian_twists', 
    name: 'Russian Twists', 
    emoji: '🧘‍♂️', 
    category: 'core', 
    targetMuscles: ['core', 'obliques'],
    location: 'home',
    difficulty: 'intermediate',
    equipment: ['none'],
    description: 'Dynamic core exercise targeting obliques and rotational strength'
  },

  // Legs Exercises
  { 
    id: 'squats', 
    name: 'Squats', 
    emoji: '🏋️‍♂️', 
    category: 'legs', 
    targetMuscles: ['quadriceps', 'glutes'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['none'],
    description: 'Fundamental lower body exercise for strength and mobility'
  },
  { 
    id: 'leg_press', 
    name: 'Leg Press', 
    emoji: '🏋️‍♂️', 
    category: 'legs', 
    targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
    location: 'gym',
    difficulty: 'intermediate',
    equipment: ['leg_press_machine'],
    description: 'Machine-based leg exercise for building strength safely'
  },
  { 
    id: 'calf_raises', 
    name: 'Calf Raises', 
    emoji: '🏋️‍♂️', 
    category: 'legs', 
    targetMuscles: ['calves'],
    location: 'both',
    difficulty: 'beginner',
    equipment: ['dumbbells'],
    description: 'Isolated calf exercise for lower leg development'
  },

  // Shoulders Exercises
  { 
    id: 'shoulderPress', 
    name: 'Shoulder Press', 
    emoji: '🏋️‍♂️', 
    category: 'shoulders', 
    targetMuscles: ['shoulders', 'triceps'],
    location: 'both',
    difficulty: 'intermediate',
    equipment: ['dumbbells'],
    description: 'Compound shoulder exercise for building shoulder strength'
  },
  { 
    id: 'lateral_raises', 
    name: 'Lateral Raises', 
    emoji: '🏋️‍♂️', 
    category: 'shoulders', 
    targetMuscles: ['shoulders'],
    location: 'both',
    difficulty: 'beginner',
    equipment: ['dumbbells'],
    description: 'Isolated lateral deltoid exercise for shoulder width'
  },

  // Cardio Exercises
  { 
    id: 'cycling', 
    name: 'Cycling', 
    emoji: '🚴‍♂️', 
    category: 'cardio', 
    targetMuscles: ['legs', 'glutes', 'core'],
    location: 'both',
    difficulty: 'beginner',
    equipment: ['bicycle'],
    description: 'Low-impact cardio exercise for endurance and leg strength'
  },
  { 
    id: 'jumping_jacks', 
    name: 'Jumping Jacks', 
    emoji: '🤸‍♂️', 
    category: 'cardio', 
    targetMuscles: ['full_body'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['none'],
    description: 'Full body cardio exercise for coordination and fitness'
  },
  { 
    id: 'mountain_climbers', 
    name: 'Mountain Climbers', 
    emoji: '🏃‍♂️', 
    category: 'cardio', 
    targetMuscles: ['core', 'legs', 'shoulders'],
    location: 'home',
    difficulty: 'intermediate',
    equipment: ['none'],
    description: 'Dynamic cardio exercise with core engagement'
  },

  // Full Body Exercises
  { 
    id: 'rowing', 
    name: 'Rowing', 
    emoji: '🚣‍♂️', 
    category: 'full_body', 
    targetMuscles: ['back', 'arms', 'legs'],
    location: 'gym',
    difficulty: 'intermediate',
    equipment: ['rowing_machine'],
    description: 'Full body cardio and strength exercise'
  },
  { 
    id: 'burpees', 
    name: 'Burpees', 
    emoji: '🤸‍♂️', 
    category: 'full_body', 
    targetMuscles: ['full_body'],
    location: 'home',
    difficulty: 'advanced',
    equipment: ['none'],
    description: 'High-intensity full body exercise for conditioning'
  },
];

const womenExercises: Exercise[] = [
  { 
    id: 'squats', 
    name: 'Squats', 
    emoji: '🏋️‍♀️', 
    category: 'legs', 
    targetMuscles: ['quadriceps', 'glutes'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['none'],
    description: 'Fundamental lower body exercise for strength and mobility'
  },
  { 
    id: 'lunges', 
    name: 'Lunges', 
    emoji: '🚶‍♀️', 
    category: 'legs', 
    targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['none'],
    description: 'Unilateral leg exercise for balance and strength'
  },
  { 
    id: 'glute_bridges', 
    name: 'Glute Bridges', 
    emoji: '🧘‍♀️', 
    category: 'glutes', 
    targetMuscles: ['glutes', 'hamstrings'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['none'],
    description: 'Isolated glute exercise for posterior chain strength'
  },
  { 
    id: 'pushups', 
    name: 'Push-ups', 
    emoji: '🤸‍♀️', 
    category: 'chest', 
    targetMuscles: ['chest', 'triceps', 'shoulders'],
    location: 'home',
    difficulty: 'intermediate',
    equipment: ['none'],
    description: 'Classic bodyweight exercise for upper body strength'
  },
  { 
    id: 'planks', 
    name: 'Planks', 
    emoji: '🧘‍♀️', 
    category: 'core', 
    targetMuscles: ['core', 'shoulders'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['none'],
    description: 'Static core exercise for stability and endurance'
  },
  { 
    id: 'mountain_climbers', 
    name: 'Mountain Climbers', 
    emoji: '🏃‍♀️', 
    category: 'cardio', 
    targetMuscles: ['core', 'legs', 'shoulders'],
    location: 'home',
    difficulty: 'intermediate',
    equipment: ['none'],
    description: 'Dynamic cardio exercise with core engagement'
  }, 
  { 
    id: 'tricep_dips', 
    name: 'Tricep Dips', 
    emoji: '💪‍♀️', 
    category: 'arms', 
    targetMuscles: ['triceps', 'shoulders'],
    location: 'home',
    difficulty: 'intermediate',
    equipment: ['chair', 'bench'],
    description: 'Bodyweight tricep exercise using household items'
  },
  { 
    id: 'burpees', 
    name: 'Burpees', 
    emoji: '🤸‍♀️', 
    category: 'full_body', 
    targetMuscles: ['full_body'],
    location: 'home',
    difficulty: 'advanced',
    equipment: ['none'],
    description: 'High-intensity full body exercise for conditioning'
  },
  { 
    id: 'yoga', 
    name: 'Yoga', 
    emoji: '🧘‍♀️', 
    category: 'flexibility', 
    targetMuscles: ['full_body'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['yoga_mat'],
    description: 'Mind-body practice for flexibility and strength'
  },
  { 
    id: 'pilates', 
    name: 'Pilates', 
    emoji: '🧘‍♀️', 
    category: 'core', 
    targetMuscles: ['core', 'flexibility'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['yoga_mat'],
    description: 'Core-focused exercise system for stability and control'
  },
  { 
    id: 'cycling', 
    name: 'Cycling', 
    emoji: '🚴‍♀️', 
    category: 'cardio', 
    targetMuscles: ['legs', 'glutes', 'core'],
    location: 'both',
    difficulty: 'beginner',
    equipment: ['bicycle'],
    description: 'Low-impact cardio exercise for endurance and leg strength'
  },
  { 
    id: 'dance_cardio', 
    name: 'Dance Cardio', 
    emoji: '💃', 
    category: 'cardio', 
    targetMuscles: ['full_body'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['none'],
    description: 'Fun cardio exercise combining dance and fitness'
  },
  { 
    id: 'step_ups', 
    name: 'Step Ups', 
    emoji: '🏃‍♀️', 
    category: 'legs', 
    targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['step', 'bench'],
    description: 'Functional leg exercise for daily movement patterns'
  },
  { 
    id: 'wall_sits', 
    name: 'Wall Sits', 
    emoji: '🧘‍♀️', 
    category: 'legs', 
    targetMuscles: ['quadriceps', 'glutes'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['wall'],
    description: 'Isometric leg exercise for endurance and strength'
  },
  { 
    id: 'arm_circles', 
    name: 'Arm Circles', 
    emoji: '💪‍♀️', 
    category: 'shoulders', 
    targetMuscles: ['shoulders', 'arms'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['none'],
    description: 'Dynamic shoulder mobility and warm-up exercise'
  },
  { 
    id: 'side_planks', 
    name: 'Side Planks', 
    emoji: '🧘‍♀️', 
    category: 'core', 
    targetMuscles: ['core', 'obliques'],
    location: 'home',
    difficulty: 'intermediate',
    equipment: ['none'],
    description: 'Lateral core exercise for oblique strength'
  },
  { 
    id: 'donkey_kicks', 
    name: 'Donkey Kicks', 
    emoji: '🏃‍♀️', 
    category: 'glutes', 
    targetMuscles: ['glutes', 'hamstrings'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['none'],
    description: 'Glute-focused exercise for posterior chain development'
  },
  { 
    id: 'sumo_squats', 
    name: 'Sumo Squats', 
    emoji: '🏋️‍♀️', 
    category: 'legs', 
    targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
    location: 'home',
    difficulty: 'intermediate',
    equipment: ['none'],
    description: 'Wide stance squat variation for inner thigh and glute focus'
  },
  { 
    id: 'fire_hydrants', 
    name: 'Fire Hydrants', 
    emoji: '🐕‍♀️', 
    category: 'glutes', 
    targetMuscles: ['glutes', 'hip_abductors'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['none'],
    description: 'Isolated glute exercise for hip abduction strength'
  },
  { 
    id: 'bird_dogs', 
    name: 'Bird Dogs', 
    emoji: '🐕‍♀️', 
    category: 'core', 
    targetMuscles: ['core', 'back'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['none'],
    description: 'Stability exercise for core and back coordination'
  },
  { 
    id: 'superman_holds', 
    name: 'Superman Holds', 
    emoji: '🦸‍♀️', 
    category: 'back', 
    targetMuscles: ['back', 'glutes'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['none'],
    description: 'Isometric back exercise for spinal erector strength'
  },
  { 
    id: 'incline_pushups', 
    name: 'Incline Push-ups', 
    emoji: '🤸‍♀️', 
    category: 'chest', 
    targetMuscles: ['chest', 'triceps', 'shoulders'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['wall', 'bench'],
    description: 'Easier push-up variation for beginners'
  },
  { 
    id: 'diamond_pushups', 
    name: 'Diamond Push-ups', 
    emoji: '💎‍♀️', 
    category: 'arms', 
    targetMuscles: ['triceps', 'chest'],
    location: 'home',
    difficulty: 'advanced',
    equipment: ['none'],
    description: 'Advanced push-up variation targeting triceps'
  },
  { 
    id: 'calf_raises', 
    name: 'Calf Raises', 
    emoji: '🏃‍♀️', 
    category: 'legs', 
    targetMuscles: ['calves'],
    location: 'home',
    difficulty: 'beginner',
    equipment: ['none'],
    description: 'Isolated calf exercise for lower leg development'
  },
  { 
    id: 'jumping_rope', 
    name: 'Jumping Rope', 
    emoji: '🏃‍♀️', 
    category: 'cardio', 
    targetMuscles: ['legs', 'calves', 'core'],
    location: 'home',
    difficulty: 'intermediate',
    equipment: ['jump_rope'],
    description: 'High-intensity cardio exercise for coordination and fitness'
  },
];

const targetAreas = [
  { id: 'all', label: 'All', emoji: '🏋️' },
  { id: 'chest', label: 'Chest', emoji: '💪' },
  { id: 'back', label: 'Back', emoji: '🦴' },
  { id: 'arms', label: 'Arms', emoji: '💪' },
  { id: 'biceps', label: 'Biceps', emoji: '💪' },
  { id: 'triceps', label: 'Triceps', emoji: '💪' },
  { id: 'forearms', label: 'Forearms', emoji: '💪' },
  { id: 'core', label: 'Core', emoji: '🫁' },
  { id: 'legs', label: 'Legs', emoji: '🦵' },
  { id: 'quadriceps', label: 'Quads', emoji: '🦵' },
  { id: 'hamstrings', label: 'Hamstrings', emoji: '🦵' },
  { id: 'glutes', label: 'Glutes', emoji: '🍑' },
  { id: 'calves', label: 'Calves', emoji: '🦵' },
  { id: 'shoulders', label: 'Shoulders', emoji: '🏋️' },
  { id: 'cardio', label: 'Cardio', emoji: '❤️' },
  { id: 'full_body', label: 'Full Body', emoji: '🤸' },
  { id: 'obliques', label: 'Obliques', emoji: '🫁' },
  { id: 'hip_abductors', label: 'Hip Abductors', emoji: '🦵' },
  { id: 'flexibility', label: 'Flexibility', emoji: '🧘' },
];

const locationFilters = [
  { id: 'all', label: 'All Locations', emoji: '🏠🏋️' },
  { id: 'home', label: 'Home Only', emoji: '🏠' },
  { id: 'gym', label: 'Gym Only', emoji: '🏋️' },
  { id: 'both', label: 'Home & Gym', emoji: '🏠🏋️' },
];

export default function GymScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'men' | 'women'>('men');
  const [selectedTargetArea, setSelectedTargetArea] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  
  const sliderPosition = useSharedValue(selectedSection === 'men' ? 0 : 1);
  
  const animatedSliderStyle = useAnimatedStyle(() => {
    const containerWidth = screenWidth - (spacing.lg * 2) - (spacing.md * 2); // Account for content padding and selector padding
    const sliderWidth = containerWidth * 0.48; // 48% of container
    const maxTranslate = containerWidth - sliderWidth - 8; // Container width minus slider width minus padding
    return {
      transform: [{ translateX: withSpring(sliderPosition.value * maxTranslate, { damping: 20, stiffness: 200 }) }],
    };
  });

  // Filter exercises based on selected target area and location
  const getFilteredExercises = () => {
    const exercises = selectedSection === 'men' ? menExercises : womenExercises;
    
    let filtered = exercises;
    
    // Filter by target area
    if (selectedTargetArea !== 'all') {
      filtered = filtered.filter(exercise => 
        exercise.targetMuscles.some(muscle => muscle === selectedTargetArea)
      );
    }
    
    // Filter by location
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(exercise => exercise.location === selectedLocation);
    }
    
    return filtered;
  };

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
        router.push('/(dashboard)/settings');
        break;
      case 'subscription':
        showToast('info', 'Subscription Plan feature coming soon!');
        break;
      case 'contact':
        router.push('/(dashboard)/contact');
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

  const renderExerciseCard = (exercise: Exercise, index: number) => {
    const getLocationLabel = (location: string) => {
      switch (location) {
        case 'home': return '🏠 Home';
        case 'gym': return '🏋️ Gym';
        case 'both': return '🏠🏋️ Both';
        default: return '';
      }
    };

    return (
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
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseCategory}>{exercise.category.toUpperCase()}</Text>
          
          {/* Location Badge */}
          <View style={styles.locationBadge}>
            <Text style={styles.locationBadgeText}>
              {getLocationLabel(exercise.location)}
            </Text>
          </View>
          
          <View style={styles.targetMusclesContainer}>
            {exercise.targetMuscles.slice(0, 2).map((muscle, idx) => (
              <Text key={idx} style={styles.targetMuscle}>
                {muscle}
              </Text>
            ))} 
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const currentExercises = getFilteredExercises();

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
            <Text style={styles.title}>Gym & Exercises</Text>
            <Text style={styles.subtitle}>
              Discover exercises tailored for your fitness goals and available equipment
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
                    ]}>Men</Text>
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
                    ]}>Women</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Target Area Filter */}
          <Animated.View entering={FadeInUp.delay(300)} style={styles.targetAreaFilter}>
            <View style={styles.targetAreaFilterHeader}>
              <Text style={styles.targetAreaFilterTitle}>Filter by Target Area</Text>
              <Text style={styles.exerciseCount}>
                {currentExercises.length} {currentExercises.length === 1 ? 'exercise' : 'exercises'}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.targetAreaButtonsContainer}
            >
              {targetAreas.map((area, index) => (
                <TouchableOpacity
                  key={area.id}
                  style={[
                    styles.targetAreaButton,
                    selectedTargetArea === area.id && styles.targetAreaButtonActive
                  ]}
                  onPress={() => setSelectedTargetArea(area.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.targetAreaButtonContent}>
                    <Text style={styles.targetAreaButtonEmoji}>{area.emoji}</Text>
                    <Text style={styles.targetAreaButtonLabel}>{area.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Location Filter */}
          <Animated.View entering={FadeInUp.delay(400)} style={styles.locationFilter}>
            <View style={styles.locationFilterHeader}>
              <Text style={styles.locationFilterTitle}>Filter by Location</Text>
              <Text style={styles.exerciseCount}>
                {currentExercises.length} {currentExercises.length === 1 ? 'exercise' : 'exercises'}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.locationButtonsContainer}
            >
              {locationFilters.map((location, index) => (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.locationButton,
                    selectedLocation === location.id && styles.locationButtonActive
                  ]}
                  onPress={() => setSelectedLocation(location.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.locationButtonContent}>
                    <Text style={styles.locationButtonEmoji}>{location.emoji}</Text>
                    <Text style={styles.locationButtonLabel}>{location.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Exercises Grid */}
          <Animated.View entering={FadeInUp.delay(500)} style={styles.exercisesGrid}>
            {currentExercises.length > 0 ? (
              currentExercises.map((exercise, index) => renderExerciseCard(exercise, index))
            ) : (
              <View style={styles.noExercisesContainer}>
                <Text style={styles.noExercisesEmoji}>🏋️</Text>
                <Text style={styles.noExercisesTitle}>No Exercises Found</Text>
                <Text style={styles.noExercisesSubtitle}>
                  Try adjusting your filters to see more exercises
                </Text>
              </View>
            )}
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
          badges={[]}
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
  targetAreaFilter: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  targetAreaFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  targetAreaFilterTitle: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  exerciseCount: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  targetAreaButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingRight: spacing.xl, // Extra right padding to ensure last item is fully visible
  },
  targetAreaButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  targetAreaButtonActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  targetAreaButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  targetAreaButtonEmoji: {
    fontSize: 18,
    color: colors.white,
  },
  targetAreaButtonLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  locationFilter: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  locationFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  locationFilterTitle: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  locationButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingRight: spacing.xl, // Extra right padding to ensure last item is fully visible
  },
  locationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  locationButtonActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  locationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationButtonEmoji: {
    fontSize: 18,
    color: colors.white,
  },
  locationButtonLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.body,
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
  locationBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  locationBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  noExercisesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noExercisesEmoji: {
    fontSize: 60,
    color: colors.mutedText,
    marginBottom: spacing.sm,
  },
  noExercisesTitle: {
    color: colors.white,
    fontSize: typography.h4,
    fontWeight: '700',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  noExercisesSubtitle: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacing: {
    height: 100,
  },
});