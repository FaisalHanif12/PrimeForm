import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Dimensions,
  Platform,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, FadeIn, SlideInRight, SlideInLeft, ZoomIn } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../src/theme/colors';
import { useAuthContext } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import DecorativeBackground from '../src/components/DecorativeBackground';
import { useToast } from '../src/context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Icons8 Exercise Icon Mapping
const exerciseIcons: Record<string, string> = {
  // Chest exercises
  pushups: 'https://img.icons8.com/ios-filled/100/FFFFFF/push.png',
  bench_press: 'https://img.icons8.com/ios-filled/100/FFFFFF/bench-press.png',
  chest_flyes: 'https://img.icons8.com/ios-filled/100/FFFFFF/dumbbell.png',
  incline_pushups: 'https://img.icons8.com/ios-filled/100/FFFFFF/push.png',
  dips: 'https://img.icons8.com/ios-filled/100/FFFFFF/parallel-tasks.png',
  diamond_pushups: 'https://img.icons8.com/ios-filled/100/FFFFFF/push.png',
  wall_pushups: 'https://img.icons8.com/ios-filled/100/FFFFFF/push.png',
  decline_pushups: 'https://img.icons8.com/ios-filled/100/FFFFFF/push.png',
  
  // Back exercises
  pullups: 'https://img.icons8.com/ios-filled/100/FFFFFF/pull-up.png',
  rows: 'https://img.icons8.com/ios-filled/100/FFFFFF/barbell.png',
  superman: 'https://img.icons8.com/ios-filled/100/FFFFFF/superman.png',
  lat_pulldowns: 'https://img.icons8.com/ios-filled/100/FFFFFF/barbell.png',
  reverse_flyes: 'https://img.icons8.com/ios-filled/100/FFFFFF/dumbbell.png',
  face_pulls: 'https://img.icons8.com/ios-filled/100/FFFFFF/barbell.png',
  
  // Arms exercises
  bicep_curls: 'https://img.icons8.com/ios-filled/100/FFFFFF/curls-with-dumbbells.png',
  tricep_dips: 'https://img.icons8.com/ios-filled/100/FFFFFF/parallel-tasks.png',
  hammer_curls: 'https://img.icons8.com/ios-filled/100/FFFFFF/dumbbell.png',
  overhead_press: 'https://img.icons8.com/ios-filled/100/FFFFFF/barbell.png',
  arm_circles: 'https://img.icons8.com/ios-filled/100/FFFFFF/exercise.png',
  
  // Legs exercises
  squats: 'https://img.icons8.com/ios-filled/100/FFFFFF/squats.png',
  lunges: 'https://img.icons8.com/ios-filled/100/FFFFFF/leg.png',
  calf_raises: 'https://img.icons8.com/ios-filled/100/FFFFFF/leg.png',
  wall_sit: 'https://img.icons8.com/ios-filled/100/FFFFFF/chair.png',
  jump_squats: 'https://img.icons8.com/ios-filled/100/FFFFFF/squats.png',
  step_ups: 'https://img.icons8.com/ios-filled/100/FFFFFF/stairs.png',
  
  // Abs exercises
  planks: 'https://img.icons8.com/ios-filled/100/FFFFFF/plank.png',
  crunches: 'https://img.icons8.com/ios-filled/100/FFFFFF/exercise.png',
  mountain_climbers: 'https://img.icons8.com/ios-filled/100/FFFFFF/exercise.png',
  bicycle_crunches: 'https://img.icons8.com/ios-filled/100/FFFFFF/cycling.png',
  leg_raises: 'https://img.icons8.com/ios-filled/100/FFFFFF/leg.png',
  russian_twists: 'https://img.icons8.com/ios-filled/100/FFFFFF/exercise.png',
  dead_bug: 'https://img.icons8.com/ios-filled/100/FFFFFF/exercise.png',
  
  // Full body exercises
  burpees: 'https://img.icons8.com/ios-filled/100/FFFFFF/exercise.png',
  jumping_jacks: 'https://img.icons8.com/ios-filled/100/FFFFFF/jumping-rope.png',
  deadlifts: 'https://img.icons8.com/ios-filled/100/FFFFFF/barbell.png',
  thrusters: 'https://img.icons8.com/ios-filled/100/FFFFFF/barbell.png',
  bear_crawl: 'https://img.icons8.com/ios-filled/100/FFFFFF/bear.png',
  turkish_getup: 'https://img.icons8.com/ios-filled/100/FFFFFF/exercise.png',
  high_knees: 'https://img.icons8.com/ios-filled/100/FFFFFF/running.png',
  squat_to_press: 'https://img.icons8.com/ios-filled/100/FFFFFF/squats.png',
};

// Enhanced exercise database with comprehensive data and animations
const exerciseDatabase = {
  chest: [
    {
      id: 'military_pushups',
      name: 'Military Push-ups',
      emoji: '💪',
      difficulty: 'intermediate',
      location: 'home',
      duration: '12-18 min',
      calories: 65,
      equipment: 'None',
      primaryMuscles: ['Chest', 'Triceps'],
      secondaryMuscles: ['Shoulders', 'Core'],
      description: 'Strict form push-ups for maximum muscle engagement',
      tips: ['Keep body perfectly straight', 'Elbows at 45 degrees', 'Control tempo'],
    },
    {
      id: 'staggered_pushups',
      name: 'Staggered Push-ups',
      emoji: '⚡',
      difficulty: 'advanced',
      location: 'home',
      duration: '15-20 min',
      calories: 80,
      equipment: 'None',
      primaryMuscles: ['Chest', 'Core'],
      secondaryMuscles: ['Shoulders', 'Triceps'],
      description: 'Unilateral push-up variation for strength imbalance',
      tips: ['One hand forward', 'Switch sides evenly', 'Maintain stability'],
    },
    {
      id: 'wide_arm_pushup',
      name: 'Wide Arm Push-ups',
      emoji: '🦅',
      difficulty: 'intermediate',
      location: 'home',
      duration: '10-15 min',
      calories: 55,
      equipment: 'None',
      primaryMuscles: ['Outer Chest', 'Shoulders'],
      secondaryMuscles: ['Triceps'],
      description: 'Wide grip variation targeting outer chest',
      tips: ['Hands wider than shoulders', 'Focus on chest stretch', 'Control descent'],
    },
    {
      id: 'decline_pushups',
      name: 'Decline Push-ups',
      emoji: '📉',
      difficulty: 'advanced',
      location: 'home',
      duration: '15-20 min',
      calories: 90,
      equipment: 'Chair/Bench',
      primaryMuscles: ['Upper Chest', 'Shoulders'],
      secondaryMuscles: ['Triceps'],
      description: 'Elevated feet push-ups for upper chest focus',
      tips: ['Feet elevated', 'Increase difficulty gradually', 'Full range of motion'],
    },
    {
      id: 'incline_pushups',
      name: 'Incline Push-ups',
      emoji: '📐',
      difficulty: 'beginner',
      location: 'home',
      duration: '8-12 min',
      calories: 40,
      equipment: 'Chair/Bench',
      primaryMuscles: ['Lower Chest', 'Triceps'],
      secondaryMuscles: ['Shoulders'],
      description: 'Hands elevated for easier variation',
      tips: ['Hands on elevated surface', 'Good for beginners', 'Build strength gradually'],
    },
    {
      id: 'diamond_pushups',
      name: 'Diamond Push-ups',
      emoji: '💎',
      difficulty: 'advanced',
      location: 'home',
      duration: '12-18 min',
      calories: 75,
      equipment: 'None',
      primaryMuscles: ['Triceps', 'Inner Chest'],
      secondaryMuscles: ['Shoulders'],
      description: 'Hands together for tricep and inner chest focus',
      tips: ['Form diamond with hands', 'Keep elbows tucked', 'Controlled movement'],
    }
  ],
  back: [
    {
      id: 'pullups',
      name: 'Pull-ups',
      emoji: '🆙',
      difficulty: 'advanced',
      location: 'both',
      duration: '15-22 min',
      calories: 95,
      equipment: 'Pull-up bar',
      primaryMuscles: ['Lats', 'Upper Back'],
      secondaryMuscles: ['Biceps', 'Forearms'],
      description: 'Ultimate back builder for width and strength',
      tips: ['Dead hang start', 'Pull chest to bar', 'Controlled descent'],
    },
    {
      id: 'deadlifts',
      name: 'Deadlifts',
      emoji: '🏋️',
      difficulty: 'advanced',
      location: 'gym',
      duration: '25-30 min',
      calories: 140,
      equipment: 'Barbell',
      primaryMuscles: ['Lower Back', 'Hamstrings'],
      secondaryMuscles: ['Glutes', 'Traps'],
      description: 'King of all exercises for posterior chain',
      tips: ['Bar close to shins', 'Hinge at hips', 'Keep back straight'],
    },
    {
      id: 'superman',
      name: 'Superman',
      emoji: '🦸',
      difficulty: 'beginner',
      location: 'home',
      duration: '10-15 min',
      calories: 40,
      equipment: 'None',
      primaryMuscles: ['Lower Back', 'Glutes'],
      secondaryMuscles: ['Hamstrings'],
      description: 'Bodyweight lower back strengthening',
      tips: ['Lie face down', 'Lift arms and legs', 'Hold for 3 seconds'],
    },
    {
      id: 'rows',
      name: 'Cable Rows',
      emoji: '🚣',
      difficulty: 'intermediate',
      location: 'gym',
      duration: '18-22 min',
      calories: 85,
      equipment: 'Cable machine',
      primaryMuscles: ['Mid Back', 'Lats'],
      secondaryMuscles: ['Biceps', 'Rear Delts'],
      description: 'Constant tension rowing for back thickness',
      tips: ['Pull to lower chest', 'Squeeze shoulder blades', 'Control the weight'],
    }
  ],
  arms: [
    {
      id: 'bicep_curls',
      name: 'Barbell Curls',
      emoji: '💪',
      difficulty: 'beginner',
      location: 'both',
      duration: '12-18 min',
      calories: 65,
      equipment: 'Barbell/Dumbbells',
      primaryMuscles: ['Biceps'],
      secondaryMuscles: ['Forearms'],
      description: 'Classic bicep builder for arm mass',
      tips: ['Keep elbows stationary', 'Full range of motion', 'Controlled tempo'],
    },
    {
      id: 'tricep_dips',
      name: 'Tricep Pushdowns',
      emoji: '⬇️',
      difficulty: 'intermediate',
      location: 'gym',
      duration: '12-16 min',
      calories: 70,
      equipment: 'Cable machine',
      primaryMuscles: ['Triceps'],
      secondaryMuscles: ['Forearms'],
      description: 'Isolation exercise for tricep definition',
      tips: ['Keep elbows tucked', 'Push down fully', 'Squeeze at bottom'],
    },
    {
      id: 'hammer_curls',
      name: 'Hammer Curls',
      emoji: '🔨',
      difficulty: 'intermediate',
      location: 'both',
      duration: '15-18 min',
      calories: 68,
      equipment: 'Dumbbells',
      primaryMuscles: ['Biceps', 'Brachialis'],
      secondaryMuscles: ['Forearms'],
      description: 'Neutral grip for balanced arm development',
      tips: ['Palms facing each other', 'No wrist rotation', 'Controlled movement'],
    },
    {
      id: 'overhead_press',
      name: 'Clean and Press',
      emoji: '🙋',
      difficulty: 'advanced',
      location: 'gym',
      duration: '20-25 min',
      calories: 110,
      equipment: 'Barbell',
      primaryMuscles: ['Shoulders', 'Triceps'],
      secondaryMuscles: ['Core', 'Legs'],
      description: 'Full body compound movement',
      tips: ['Clean to shoulders', 'Press overhead', 'Full body power'],
    },
    {
      id: 'shoulder_press',
      name: 'Shoulder Stretch',
      emoji: '🤸',
      difficulty: 'beginner',
      location: 'home',
      duration: '8-12 min',
      calories: 35,
      equipment: 'None',
      primaryMuscles: ['Shoulders', 'Upper Back'],
      secondaryMuscles: ['Arms'],
      description: 'Mobility and flexibility for shoulders',
      tips: ['Hold each stretch 30s', 'No bouncing', 'Breathe deeply'],
    }
  ],
  legs: [
    {
      id: 'squats',
      name: 'Bodyweight Squats',
      emoji: '🏋️',
      difficulty: 'beginner',
      location: 'home',
      duration: '12-18 min',
      calories: 75,
      equipment: 'None',
      primaryMuscles: ['Quadriceps', 'Glutes'],
      secondaryMuscles: ['Hamstrings', 'Core'],
      description: 'Fundamental lower body strength builder',
      tips: ['Feet shoulder-width', 'Depth to parallel', 'Drive through heels'],
    },
    {
      id: 'lunges',
      name: 'Walking Lunges',
      emoji: '🦵',
      difficulty: 'intermediate',
      location: 'both',
      duration: '15-20 min',
      calories: 80,
      equipment: 'None/Dumbbells',
      primaryMuscles: ['Quadriceps', 'Glutes'],
      secondaryMuscles: ['Hamstrings', 'Calves'],
      description: 'Dynamic unilateral leg developer',
      tips: ['Long stride forward', '90-degree angles', 'Maintain balance'],
    },
    {
      id: 'jump_squats',
      name: 'Jump Squats',
      emoji: '⚡',
      difficulty: 'advanced',
      location: 'home',
      duration: '10-15 min',
      calories: 100,
      equipment: 'None',
      primaryMuscles: ['Quadriceps', 'Glutes'],
      secondaryMuscles: ['Calves', 'Core'],
      description: 'Explosive power and plyometric training',
      tips: ['Squat low', 'Explode upward', 'Soft landing'],
    },
    {
      id: 'squat_kicks',
      name: 'Squat Kicks',
      emoji: '🥋',
      difficulty: 'intermediate',
      location: 'home',
      duration: '12-18 min',
      calories: 85,
      equipment: 'None',
      primaryMuscles: ['Legs', 'Core'],
      secondaryMuscles: ['Glutes', 'Hip Flexors'],
      description: 'Squat with alternating kicks for balance',
      tips: ['Squat then kick', 'Alternate legs', 'Keep balance'],
    },
    {
      id: 'squat_reach',
      name: 'Squat Reach',
      emoji: '🙌',
      difficulty: 'beginner',
      location: 'home',
      duration: '10-15 min',
      calories: 65,
      equipment: 'None',
      primaryMuscles: ['Legs', 'Core'],
      secondaryMuscles: ['Shoulders'],
      description: 'Squat with overhead reach for mobility',
      tips: ['Squat deep', 'Reach overhead', 'Full extension'],
    },
    {
      id: 'split_jump',
      name: 'Split Jumps',
      emoji: '✂️',
      difficulty: 'advanced',
      location: 'home',
      duration: '12-16 min',
      calories: 95,
      equipment: 'None',
      primaryMuscles: ['Quadriceps', 'Glutes'],
      secondaryMuscles: ['Calves', 'Core'],
      description: 'Explosive lunge jumps for power',
      tips: ['Jump and switch legs', 'Land softly', 'Maintain rhythm'],
    },
    {
      id: 'leg_press',
      name: 'Leg Press',
      emoji: '🦿',
      difficulty: 'intermediate',
      location: 'gym',
      duration: '18-22 min',
      calories: 110,
      equipment: 'Leg press machine',
      primaryMuscles: ['Quadriceps', 'Glutes'],
      secondaryMuscles: ['Hamstrings'],
      description: 'Machine-based quad and glute builder',
      tips: ['Full range of motion', 'Controlled tempo', 'Press through heels'],
    },
    {
      id: 'single_leg_rotation',
      name: 'Single Leg Hip Rotation',
      emoji: '🔄',
      difficulty: 'intermediate',
      location: 'home',
      duration: '10-14 min',
      calories: 50,
      equipment: 'None',
      primaryMuscles: ['Hip Flexors', 'Glutes'],
      secondaryMuscles: ['Core', 'Balance'],
      description: 'Hip mobility and stability exercise',
      tips: ['Balance on one leg', 'Rotate hip', 'Control movement'],
    }
  ],
  abs: [
    {
      id: 'planks',
      name: 'Plank Hold',
      emoji: '🏗️',
      difficulty: 'beginner',
      location: 'home',
      duration: '8-12 min',
      calories: 45,
      equipment: 'None',
      primaryMuscles: ['Core', 'Abs'],
      secondaryMuscles: ['Shoulders', 'Glutes'],
      description: 'Isometric core strength and stability',
      tips: ['Body in straight line', 'Engage core', 'Hold 30-60 seconds'],
    },
    {
      id: 't_plank',
      name: 'T-Plank',
      emoji: '🔀',
      difficulty: 'intermediate',
      location: 'home',
      duration: '10-15 min',
      calories: 60,
      equipment: 'None',
      primaryMuscles: ['Core', 'Obliques'],
      secondaryMuscles: ['Shoulders', 'Balance'],
      description: 'Plank with rotation for obliques',
      tips: ['Side plank position', 'Rotate torso', 'Extend arm up'],
    },
    {
      id: 'crunches',
      name: 'Elbow to Knee Crunches',
      emoji: '✖️',
      difficulty: 'intermediate',
      location: 'home',
      duration: '10-14 min',
      calories: 55,
      equipment: 'None',
      primaryMuscles: ['Abs', 'Obliques'],
      secondaryMuscles: ['Hip Flexors'],
      description: 'Alternating crunch for full ab engagement',
      tips: ['Touch elbow to opposite knee', 'Slow controlled reps', 'Squeeze at top'],
    },
    {
      id: 'sit_ups',
      name: 'Sit-ups',
      emoji: '⬆️',
      difficulty: 'beginner',
      location: 'home',
      duration: '12-16 min',
      calories: 60,
      equipment: 'None',
      primaryMuscles: ['Abs', 'Hip Flexors'],
      secondaryMuscles: ['Core'],
      description: 'Classic full sit-up for ab strength',
      tips: ['Feet anchored', 'Full range of motion', 'Control the descent'],
    },
    {
      id: 'flutter_kicks',
      name: 'Flutter Kicks',
      emoji: '🏊',
      difficulty: 'intermediate',
      location: 'home',
      duration: '8-12 min',
      calories: 50,
      equipment: 'None',
      primaryMuscles: ['Lower Abs', 'Hip Flexors'],
      secondaryMuscles: ['Core'],
      description: 'Alternating leg raises for lower abs',
      tips: ['Small rapid movements', 'Keep legs straight', 'Press lower back down'],
    },
    {
      id: 'reverse_crunches',
      name: 'Reverse Crunches',
      emoji: '🔙',
      difficulty: 'intermediate',
      location: 'home',
      duration: '10-14 min',
      calories: 55,
      equipment: 'None',
      primaryMuscles: ['Lower Abs'],
      secondaryMuscles: ['Hip Flexors'],
      description: 'Targets hard-to-reach lower abs',
      tips: ['Lift hips off ground', 'Bring knees to chest', 'Controlled movement'],
    },
    {
      id: 'deadbug',
      name: 'Dead Bug',
      emoji: '🪲',
      difficulty: 'beginner',
      location: 'home',
      duration: '8-12 min',
      calories: 40,
      equipment: 'None',
      primaryMuscles: ['Core', 'Abs'],
      secondaryMuscles: ['Hip Flexors'],
      description: 'Core stability and coordination',
      tips: ['Back flat on ground', 'Opposite arm and leg', 'Slow tempo'],
    },
    {
      id: 'seated_abs_circles',
      name: 'Seated Ab Circles',
      emoji: '⭕',
      difficulty: 'intermediate',
      location: 'home',
      duration: '10-14 min',
      calories: 50,
      equipment: 'None',
      primaryMuscles: ['Obliques', 'Core'],
      secondaryMuscles: ['Hip Flexors'],
      description: 'Circular motion for complete core activation',
      tips: ['Lean back slightly', 'Draw circles with torso', 'Both directions'],
    },
    {
      id: 'frog_press',
      name: 'Frog Press',
      emoji: '🐸',
      difficulty: 'advanced',
      location: 'home',
      duration: '12-16 min',
      calories: 70,
      equipment: 'None',
      primaryMuscles: ['Lower Abs', 'Core'],
      secondaryMuscles: ['Hip Flexors'],
      description: 'Advanced lower ab exercise',
      tips: ['Knees bent position', 'Press legs out', 'Control the movement'],
    }
  ],
  full_body: [
    {
      id: 'burpees',
      name: 'Burpees',
      emoji: '🔥',
      difficulty: 'advanced',
      location: 'home',
      duration: '12-18 min',
      calories: 135,
      equipment: 'None',
      primaryMuscles: ['Full Body', 'Cardio'],
      secondaryMuscles: ['Core', 'Endurance'],
      description: 'Ultimate full-body conditioning exercise',
      tips: ['Squat, plank, push-up, jump', 'Explosive movement', 'Keep pace steady'],
    },
    {
      id: 'jumping_jacks',
      name: 'Jumping Jacks',
      emoji: '🤸',
      difficulty: 'beginner',
      location: 'home',
      duration: '8-12 min',
      calories: 60,
      equipment: 'None',
      primaryMuscles: ['Cardio', 'Legs'],
      secondaryMuscles: ['Arms', 'Shoulders'],
      description: 'Classic warm-up and cardio exercise',
      tips: ['Jump feet apart', 'Arms overhead', 'Maintain rhythm'],
    },
    {
      id: 'running',
      name: 'Running in Place',
      emoji: '🏃',
      difficulty: 'beginner',
      location: 'home',
      duration: '10-15 min',
      calories: 80,
      equipment: 'None',
      primaryMuscles: ['Cardio', 'Legs'],
      secondaryMuscles: ['Core'],
      description: 'Cardio exercise for endurance',
      tips: ['Lift knees high', 'Pump arms', 'Steady pace'],
    },
    {
      id: 'punches',
      name: 'Shadow Boxing',
      emoji: '🥊',
      difficulty: 'intermediate',
      location: 'home',
      duration: '12-16 min',
      calories: 85,
      equipment: 'None',
      primaryMuscles: ['Arms', 'Shoulders'],
      secondaryMuscles: ['Core', 'Cardio'],
      description: 'Boxing punches for cardio and arms',
      tips: ['Mix jabs and crosses', 'Rotate hips', 'Keep guard up'],
    },
    {
      id: 'squat_kick',
      name: 'Squat Kick',
      emoji: '🦵',
      difficulty: 'intermediate',
      location: 'home',
      duration: '12-16 min',
      calories: 90,
      equipment: 'None',
      primaryMuscles: ['Legs', 'Core'],
      secondaryMuscles: ['Glutes', 'Balance'],
      description: 'Squat combined with front kick',
      tips: ['Squat low', 'Kick forward', 'Alternate legs'],
    }
  ]
};

const difficultyColors = {
  beginner: '#00C97C',
  intermediate: '#FFB800',
  advanced: '#FF3B30'
};

export default function GymExercisesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useLanguage();
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  
  const category = params.category as string;
  const gender = params.gender as string;
  const filter = params.filter as string;
  const categoryName = params.categoryName as string;

  const allExercises = exerciseDatabase[category as keyof typeof exerciseDatabase] || [];
  
  // Show all exercises without filtering
  const exercises = allExercises;

  const handleBack = () => {
    router.back();
  };

  const handleExercisePress = (exercise: any) => {
    router.push({
      pathname: '/(dashboard)/exercise-detail',
      params: {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseEmoji: exercise.emoji,
        category,
        calories: exercise.calories.toString(),
        targetMuscles: JSON.stringify(exercise.primaryMuscles),
      },
    });
  };

  // Calculate stats
  const totalCalories = exercises.reduce((sum, ex) => sum + ex.calories, 0);
  const avgDuration = Math.round(exercises.reduce((sum, ex) => {
    const duration = parseInt(ex.duration.split('-')[0]);
    return sum + duration;
  }, 0) / (exercises.length || 1));

  // Optimized with useCallback to prevent re-creation on every render
  const renderExerciseCard = useCallback(({ item: exercise, index }: { item: any; index: number }) => {
    // Get difficulty color and icon
    const difficultyColor = difficultyColors[exercise.difficulty as keyof typeof difficultyColors];
    const iconUrl = exerciseIcons[exercise.id] || exerciseIcons.pushups;
    
    return (
      <Animated.View
        entering={SlideInRight.delay(100 + index * 50).springify()}
        style={styles.exerciseWrapper}
      >
        <TouchableOpacity
          style={styles.exerciseCard}
          onPress={() => handleExercisePress(exercise)}
          activeOpacity={0.9}
        >
          <LinearGradient
            // Match card styling used in dashboard/gym cards for consistency
            // Use a single solid color for uniform card background
            colors={[colors.surface, colors.surface] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.exerciseCardGradient}
          >
            {/* Accent Border - Always Green */}
            <View style={[styles.accentBorder, { backgroundColor: colors.primary }]} />
            
            {/* Card Content */}
            <View style={styles.cardContent}>
              {/* Left Side - Icon */}
              <View style={styles.cardLeft}>
                <LinearGradient
                  colors={[colors.primary + '25', colors.primary + '10']}
                  style={styles.exerciseIconContainer}
                >
                  <Image 
                    source={{ uri: iconUrl }}
                    style={styles.exerciseIcon}
                    resizeMode="contain"
                  />
                  {/* Difficulty Dot Indicator */}
                  <View style={[styles.miniDifficultyDot, { backgroundColor: difficultyColor }]} />
                </LinearGradient>
            </View>
            
              {/* Middle - Info */}
              <View style={styles.cardMiddle}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDescription} numberOfLines={2}>
                  {exercise.description}
                </Text>
                
                {/* Inline Stats */}
                <View style={styles.inlineStats}>
                  <View style={styles.inlineStat}>
                    <Ionicons name="time-outline" size={14} color={colors.primary} />
                    <Text style={styles.inlineStatText}>{exercise.duration}</Text>
                </View>
                  <View style={styles.statDivider} />
                  <View style={styles.inlineStat}>
                    <Ionicons name="flame-outline" size={14} color={colors.gold} />
                    <Text style={styles.inlineStatText}>{exercise.calories}</Text>
              </View>
                  <View style={styles.statDivider} />
                  <View style={styles.inlineStat}>
                  <Ionicons 
                      name={exercise.location === 'home' ? 'home-outline' : exercise.location === 'gym' ? 'barbell-outline' : 'location-outline'} 
                      size={14} 
                      color={colors.mutedText} 
                    />
              </View>
            </View>

                {/* Muscle Tags */}
                <View style={styles.muscleTagsRow}>
                  {exercise.primaryMuscles.slice(0, 2).map((muscle: string, idx: number) => (
                    <View key={idx} style={styles.muscleTagMini}>
                      <View style={[styles.muscleDot, { backgroundColor: colors.primary }]} />
                      <Text style={styles.muscleTagMiniText}>{muscle}</Text>
                </View>
              ))}
                  {exercise.primaryMuscles.length > 2 && (
                    <View style={styles.moreTag}>
                      <Text style={styles.moreTagText}>+{exercise.primaryMuscles.length - 2}</Text>
                    </View>
                  )}
                </View>
            </View>

              {/* Right Side - Arrow */}
              <View style={styles.cardRight}>
                <View style={[styles.arrowCircle, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }, []);

  // Key extractor for FlatList
  const keyExtractor = useCallback((item: any) => item.id, []);

  // Empty component
  const renderEmptyComponent = useCallback(() => (
    <Animated.View entering={ZoomIn.delay(300).springify()} style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <Ionicons name="search-outline" size={48} color={colors.mutedText} />
      </View>
      <Text style={styles.emptyStateTitle}>No exercises found</Text>
      <Text style={styles.emptyStateText}>
        Try adjusting your filters to see more exercises
      </Text>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => router.back()}
      >
        <Text style={styles.resetButtonText}>Go Back</Text>
      </TouchableOpacity>
    </Animated.View>
  ), [router]);

  // Footer component
  const renderFooter = useCallback(() => (
    <View style={styles.bottomSpacing} />
  ), []);

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Premium Header with Gradient */}
        <Animated.View entering={FadeInDown.springify()} style={styles.headerContainer}>
          <LinearGradient
            colors={['rgba(0, 201, 124, 0.15)', 'rgba(0, 0, 0, 0)']}
            style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
          >
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>

            {/* Header Content */}
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{categoryName} Exercises</Text>
          </View>

            {/* Filter Button - Removed */}
            <View style={{ width: 44 }} />
          </LinearGradient>
        </Animated.View>

        {/* Stats Summary Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.statsCard}>
          <LinearGradient
            // Uniform card background to match exercise cards
            colors={[colors.surface, colors.surface] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsCardGradient}
          >
            <View style={styles.statBox}>
              <View style={styles.statIconBox}>
                <Ionicons name="flash" size={20} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{exercises.length}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statsCardDivider} />
            <View style={styles.statBox}>
              <View style={styles.statIconBox}>
                <Ionicons name="flame" size={20} color={colors.gold} />
              </View>
              <Text style={styles.statValue}>{totalCalories}</Text>
              <Text style={styles.statLabel}>Total Cal</Text>
            </View>
            <View style={styles.statsCardDivider} />
            <View style={styles.statBox}>
              <View style={styles.statIconBox}>
                <Ionicons name="time" size={20} color="#FF3B30" />
              </View>
              <Text style={styles.statValue}>{avgDuration}m</Text>
              <Text style={styles.statLabel}>Avg Time</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Filter Chips - Removed */}

        {/* Exercise List - Optimized with FlatList */}
        <FlatList
          data={exercises}
          renderItem={renderExerciseCard}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={renderFooter}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
        />
      </SafeAreaView>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  
  // Header Styles
  headerContainer: {
    position: 'relative',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerContent: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: fonts.heading,
    letterSpacing: -0.5,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 201, 124, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 124, 0.3)',
  },
  headerBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  // Stats Summary Card
  statsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  statsCardGradient: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: 2,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsCardDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.sm,
  },

  // Filter Chips
  filtersSection: {
    marginBottom: spacing.md,
  },
  filterChipsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterChipActive: {
    borderColor: colors.primary,
  },
  filterChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterChipText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  // Exercise Cards
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  exerciseWrapper: {
    marginBottom: spacing.md,
  },
  exerciseCard: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  exerciseCardGradient: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    position: 'relative',
  },
  accentBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingLeft: spacing.lg,
    gap: spacing.md,
  },
  cardLeft: {
    position: 'relative',
  },
  exerciseIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  exerciseIcon: {
    width: 40,
    height: 40,
    tintColor: colors.white,
  },
  miniDifficultyDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.background,
  },
  cardMiddle: {
    flex: 1,
    gap: 6,
  },
  exerciseName: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: fonts.heading,
    letterSpacing: -0.3,
  },
  exerciseDescription: {
    color: colors.mutedText,
    fontSize: 12,
    fontFamily: fonts.body,
    lineHeight: 18,
  },
  inlineStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  inlineStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineStatText: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  muscleTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  muscleTagMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  muscleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  muscleTagMiniText: {
    color: colors.mutedText,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  moreTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  moreTagText: {
    color: colors.mutedText,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  cardRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 3,
    paddingHorizontal: spacing.xl,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyStateTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  resetButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  resetButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  bottomSpacing: {
    height: 80,
  },
});
