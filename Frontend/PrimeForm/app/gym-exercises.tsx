import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
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

// Enhanced exercise database with comprehensive data
const exerciseDatabase = {
  chest: [
    {
      id: 'pushups',
      name: 'Push-ups',
      emoji: '💪',
      difficulty: 'beginner',
      location: 'home',
      duration: '10-15 min',
      calories: 50,
      equipment: 'None',
      primaryMuscles: ['Chest', 'Triceps'],
      secondaryMuscles: ['Shoulders', 'Core'],
      description: 'Classic bodyweight exercise for upper body strength',
      tips: ['Keep body straight', 'Lower chest to ground', 'Push up explosively'],
    },
    {
      id: 'bench_press',
      name: 'Bench Press',
      emoji: '🏋️',
      difficulty: 'intermediate',
      location: 'gym',
      duration: '20-25 min',
      calories: 120,
      equipment: 'Barbell, Bench',
      primaryMuscles: ['Chest', 'Triceps'],
      secondaryMuscles: ['Shoulders'],
      description: 'King of chest exercises for mass and strength',
      tips: ['Grip slightly wider than shoulders', 'Lower bar to chest', 'Press in straight line'],
    },
    {
      id: 'chest_flyes',
      name: 'Chest Flyes',
      emoji: '🦅',
      difficulty: 'intermediate',
      location: 'gym',
      duration: '15-20 min',
      calories: 80,
      equipment: 'Dumbbells, Bench',
      primaryMuscles: ['Chest'],
      secondaryMuscles: ['Shoulders'],
      description: 'Isolation exercise for chest definition',
      tips: ['Slight bend in elbows', 'Feel stretch at bottom', 'Squeeze at top'],
    },
    {
      id: 'incline_pushups',
      name: 'Incline Push-ups',
      emoji: '📐',
      difficulty: 'beginner',
      location: 'home',
      duration: '8-12 min',
      calories: 40,
      equipment: 'Chair/Couch',
      primaryMuscles: ['Upper Chest', 'Triceps'],
      secondaryMuscles: ['Shoulders'],
      description: 'Easier variation targeting upper chest',
      tips: ['Hands on elevated surface', 'Keep body straight', 'Control the movement'],
    },
    {
      id: 'dips',
      name: 'Chest Dips',
      emoji: '⬇️',
      difficulty: 'advanced',
      location: 'both',
      duration: '15-20 min',
      calories: 100,
      equipment: 'Parallel bars/Chair',
      primaryMuscles: ['Lower Chest', 'Triceps'],
      secondaryMuscles: ['Shoulders'],
      description: 'Advanced bodyweight exercise for lower chest',
      tips: ['Lean forward slightly', 'Lower until stretch', 'Push up powerfully'],
    },
    {
      id: 'diamond_pushups',
      name: 'Diamond Push-ups',
      emoji: '💎',
      difficulty: 'advanced',
      location: 'home',
      duration: '12-18 min',
      calories: 70,
      equipment: 'None',
      primaryMuscles: ['Triceps', 'Chest'],
      secondaryMuscles: ['Shoulders'],
      description: 'Advanced push-up variation for tricep focus',
      tips: ['Form diamond with hands', 'Keep elbows close', 'Control descent'],
    },
    {
      id: 'wall_pushups',
      name: 'Wall Push-ups',
      emoji: '🧱',
      difficulty: 'beginner',
      location: 'home',
      duration: '5-10 min',
      calories: 25,
      equipment: 'Wall',
      primaryMuscles: ['Chest', 'Triceps'],
      secondaryMuscles: ['Shoulders'],
      description: 'Beginner-friendly wall variation',
      tips: ['Stand arms length from wall', 'Keep body straight', 'Push away from wall'],
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
      description: 'Advanced variation with feet elevated',
      tips: ['Feet on elevated surface', 'Maintain straight line', 'Control the movement'],
    }
  ],
  back: [
    {
      id: 'pullups',
      name: 'Pull-ups',
      emoji: '🆙',
      difficulty: 'advanced',
      location: 'both',
      duration: '15-20 min',
      calories: 90,
      equipment: 'Pull-up bar',
      primaryMuscles: ['Lats', 'Rhomboids'],
      secondaryMuscles: ['Biceps', 'Rear Delts'],
      description: 'Ultimate back exercise for width and strength',
      tips: ['Dead hang start', 'Pull chest to bar', 'Control the descent'],
    },
    {
      id: 'rows',
      name: 'Bent-over Rows',
      emoji: '🚣',
      difficulty: 'intermediate',
      location: 'gym',
      duration: '18-22 min',
      calories: 110,
      equipment: 'Barbell/Dumbbells',
      primaryMuscles: ['Lats', 'Rhomboids'],
      secondaryMuscles: ['Biceps', 'Rear Delts'],
      description: 'Essential rowing movement for back thickness',
      tips: ['Hinge at hips', 'Pull to lower chest', 'Squeeze shoulder blades'],
    },
    {
      id: 'superman',
      name: 'Superman',
      emoji: '🦸',
      difficulty: 'beginner',
      location: 'home',
      duration: '10-15 min',
      calories: 35,
      equipment: 'None',
      primaryMuscles: ['Lower Back', 'Glutes'],
      secondaryMuscles: ['Hamstrings'],
      description: 'Bodyweight exercise for lower back strength',
      tips: ['Lie face down', 'Lift chest and legs', 'Hold at top'],
    },
    {
      id: 'lat_pulldowns',
      name: 'Lat Pulldowns',
      emoji: '⬇️',
      difficulty: 'intermediate',
      location: 'gym',
      duration: '15-20 min',
      calories: 85,
      equipment: 'Cable machine',
      primaryMuscles: ['Lats', 'Rhomboids'],
      secondaryMuscles: ['Biceps'],
      description: 'Cable exercise for lat development',
      tips: ['Pull to upper chest', 'Squeeze shoulder blades', 'Control the weight'],
    },
    {
      id: 'reverse_flyes',
      name: 'Reverse Flyes',
      emoji: '🔄',
      difficulty: 'intermediate',
      location: 'both',
      duration: '12-15 min',
      calories: 60,
      equipment: 'Dumbbells/Bands',
      primaryMuscles: ['Rear Delts', 'Rhomboids'],
      secondaryMuscles: ['Traps'],
      description: 'Isolation for rear delts and upper back',
      tips: ['Slight bend in elbows', 'Squeeze shoulder blades', 'Control movement'],
    },
    {
      id: 'face_pulls',
      name: 'Face Pulls',
      emoji: '👤',
      difficulty: 'beginner',
      location: 'both',
      duration: '10-12 min',
      calories: 45,
      equipment: 'Resistance band/Cable',
      primaryMuscles: ['Rear Delts', 'Rhomboids'],
      secondaryMuscles: ['Traps'],
      description: 'Great exercise for posture improvement',
      tips: ['Pull to face level', 'External rotation', 'Squeeze at end'],
    }
  ],
  arms: [
    {
      id: 'bicep_curls',
      name: 'Bicep Curls',
      emoji: '💪',
      difficulty: 'beginner',
      location: 'both',
      duration: '12-18 min',
      calories: 60,
      equipment: 'Dumbbells/Water bottles',
      primaryMuscles: ['Biceps'],
      secondaryMuscles: ['Forearms'],
      description: 'Classic arm exercise for bicep development',
      tips: ['Keep elbows at sides', 'Curl to shoulder level', 'Lower slowly'],
    },
    {
      id: 'tricep_dips',
      name: 'Tricep Dips',
      emoji: '⬇️',
      difficulty: 'intermediate',
      location: 'both',
      duration: '10-15 min',
      calories: 70,
      equipment: 'Chair/Bench',
      primaryMuscles: ['Triceps'],
      secondaryMuscles: ['Shoulders', 'Chest'],
      description: 'Bodyweight exercise for tricep strength',
      tips: ['Hands on edge', 'Lower until 90 degrees', 'Push up using triceps'],
    },
    {
      id: 'hammer_curls',
      name: 'Hammer Curls',
      emoji: '🔨',
      difficulty: 'intermediate',
      location: 'both',
      duration: '15-20 min',
      calories: 65,
      equipment: 'Dumbbells',
      primaryMuscles: ['Biceps', 'Forearms'],
      secondaryMuscles: ['Brachialis'],
      description: 'Neutral grip curls for balanced arm development',
      tips: ['Palms face each other', 'Keep wrists straight', 'Control the movement'],
    },
    {
      id: 'overhead_press',
      name: 'Overhead Press',
      emoji: '🙋',
      difficulty: 'intermediate',
      location: 'both',
      duration: '15-20 min',
      calories: 85,
      equipment: 'Dumbbells/Barbell',
      primaryMuscles: ['Shoulders', 'Triceps'],
      secondaryMuscles: ['Core'],
      description: 'Compound movement for shoulder and arm strength',
      tips: ['Press straight up', 'Keep core tight', 'Lower with control'],
    },
    {
      id: 'arm_circles',
      name: 'Arm Circles',
      emoji: '🔄',
      difficulty: 'beginner',
      location: 'home',
      duration: '5-8 min',
      calories: 30,
      equipment: 'None',
      primaryMuscles: ['Shoulders'],
      secondaryMuscles: ['Arms'],
      description: 'Dynamic warm-up and shoulder mobility exercise',
      tips: ['Start small then bigger', 'Control the movement', 'Both directions'],
    }
  ],
  legs: [
    {
      id: 'squats',
      name: 'Squats',
      emoji: '🏋️',
      difficulty: 'beginner',
      location: 'both',
      duration: '15-20 min',
      calories: 80,
      equipment: 'None/Barbell',
      primaryMuscles: ['Quadriceps', 'Glutes'],
      secondaryMuscles: ['Hamstrings', 'Calves'],
      description: 'King of leg exercises for overall lower body',
      tips: ['Feet shoulder-width apart', 'Lower until thighs parallel', 'Drive through heels'],
    },
    {
      id: 'lunges',
      name: 'Lunges',
      emoji: '🦵',
      difficulty: 'beginner',
      location: 'both',
      duration: '12-18 min',
      calories: 70,
      equipment: 'None/Dumbbells',
      primaryMuscles: ['Quadriceps', 'Glutes'],
      secondaryMuscles: ['Hamstrings', 'Calves'],
      description: 'Unilateral leg exercise for balance and strength',
      tips: ['Step forward', 'Lower until 90 degrees', 'Push back to start'],
    },
    {
      id: 'calf_raises',
      name: 'Calf Raises',
      emoji: '📈',
      difficulty: 'beginner',
      location: 'both',
      duration: '8-12 min',
      calories: 40,
      equipment: 'None/Step',
      primaryMuscles: ['Calves'],
      secondaryMuscles: [],
      description: 'Simple exercise for calf muscle development',
      tips: ['Rise up on toes', 'Hold at top', 'Lower slowly'],
    },
    {
      id: 'wall_sit',
      name: 'Wall Sit',
      emoji: '🪑',
      difficulty: 'intermediate',
      location: 'home',
      duration: '10-15 min',
      calories: 55,
      equipment: 'Wall',
      primaryMuscles: ['Quadriceps', 'Glutes'],
      secondaryMuscles: ['Core'],
      description: 'Isometric exercise for leg endurance',
      tips: ['Back against wall', 'Thighs parallel to ground', 'Hold position'],
    },
    {
      id: 'jump_squats',
      name: 'Jump Squats',
      emoji: '⚡',
      difficulty: 'advanced',
      location: 'home',
      duration: '12-15 min',
      calories: 95,
      equipment: 'None',
      primaryMuscles: ['Quadriceps', 'Glutes'],
      secondaryMuscles: ['Calves'],
      description: 'Explosive squat variation for power',
      tips: ['Squat down', 'Jump up explosively', 'Land softly'],
    },
    {
      id: 'step_ups',
      name: 'Step-ups',
      emoji: '🪜',
      difficulty: 'intermediate',
      location: 'both',
      duration: '12-18 min',
      calories: 75,
      equipment: 'Step/Bench',
      primaryMuscles: ['Quadriceps', 'Glutes'],
      secondaryMuscles: ['Calves'],
      description: 'Functional leg exercise using elevation',
      tips: ['Step up with full foot', 'Drive through heel', 'Control descent'],
    }
  ],
  abs: [
    {
      id: 'planks',
      name: 'Planks',
      emoji: '🏗️',
      difficulty: 'beginner',
      location: 'home',
      duration: '10-15 min',
      calories: 45,
      equipment: 'None',
      primaryMuscles: ['Core', 'Abs'],
      secondaryMuscles: ['Shoulders', 'Glutes'],
      description: 'Isometric exercise for core stability',
      tips: ['Keep body straight', 'Engage core', 'Breathe steadily'],
    },
    {
      id: 'crunches',
      name: 'Crunches',
      emoji: '🔄',
      difficulty: 'beginner',
      location: 'home',
      duration: '8-12 min',
      calories: 35,
      equipment: 'None',
      primaryMuscles: ['Upper Abs'],
      secondaryMuscles: ['Core'],
      description: 'Classic ab exercise for upper abdominal strength',
      tips: ['Hands behind head', 'Lift shoulder blades', 'Squeeze abs at top'],
    },
    {
      id: 'mountain_climbers',
      name: 'Mountain Climbers',
      emoji: '⛰️',
      difficulty: 'intermediate',
      location: 'home',
      duration: '10-15 min',
      calories: 80,
      equipment: 'None',
      primaryMuscles: ['Core', 'Abs'],
      secondaryMuscles: ['Shoulders', 'Legs'],
      description: 'Dynamic cardio exercise for core and conditioning',
      tips: ['Start in plank', 'Alternate legs quickly', 'Keep hips level'],
    },
    {
      id: 'bicycle_crunches',
      name: 'Bicycle Crunches',
      emoji: '🚴',
      difficulty: 'intermediate',
      location: 'home',
      duration: '10-15 min',
      calories: 60,
      equipment: 'None',
      primaryMuscles: ['Abs', 'Obliques'],
      secondaryMuscles: ['Core'],
      description: 'Dynamic ab exercise targeting obliques',
      tips: ['Alternate elbow to knee', 'Keep steady rhythm', 'Full extension'],
    },
    {
      id: 'leg_raises',
      name: 'Leg Raises',
      emoji: '🦵',
      difficulty: 'intermediate',
      location: 'home',
      duration: '8-12 min',
      calories: 50,
      equipment: 'None',
      primaryMuscles: ['Lower Abs'],
      secondaryMuscles: ['Hip Flexors'],
      description: 'Targets lower abdominal muscles',
      tips: ['Legs straight', 'Lift to 90 degrees', 'Lower with control'],
    },
    {
      id: 'russian_twists',
      name: 'Russian Twists',
      emoji: '🌪️',
      difficulty: 'intermediate',
      location: 'home',
      duration: '8-12 min',
      calories: 55,
      equipment: 'None/Weight',
      primaryMuscles: ['Obliques', 'Core'],
      secondaryMuscles: ['Abs'],
      description: 'Rotational core exercise for obliques',
      tips: ['Lean back slightly', 'Twist side to side', 'Keep core engaged'],
    },
    {
      id: 'dead_bug',
      name: 'Dead Bug',
      emoji: '🪲',
      difficulty: 'beginner',
      location: 'home',
      duration: '8-12 min',
      calories: 40,
      equipment: 'None',
      primaryMuscles: ['Core', 'Abs'],
      secondaryMuscles: ['Hip Flexors'],
      description: 'Core stability exercise lying on back',
      tips: ['Keep back flat', 'Opposite arm and leg', 'Slow controlled movement'],
    }
  ],
  full_body: [
    {
      id: 'burpees',
      name: 'Burpees',
      emoji: '🔥',
      difficulty: 'advanced',
      location: 'home',
      duration: '15-20 min',
      calories: 150,
      equipment: 'None',
      primaryMuscles: ['Full Body'],
      secondaryMuscles: [],
      description: 'Ultimate full-body conditioning exercise',
      tips: ['Squat down', 'Jump back to plank', 'Jump up explosively'],
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
      secondaryMuscles: ['Arms', 'Core'],
      description: 'Classic cardio exercise for warm-up and conditioning',
      tips: ['Jump feet apart', 'Raise arms overhead', 'Land softly'],
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
      primaryMuscles: ['Hamstrings', 'Glutes', 'Back'],
      secondaryMuscles: ['Traps', 'Core'],
      description: 'Compound exercise for posterior chain strength',
      tips: ['Bar close to shins', 'Hinge at hips', 'Drive through heels'],
    },
    {
      id: 'thrusters',
      name: 'Thrusters',
      emoji: '🚀',
      difficulty: 'advanced',
      location: 'both',
      duration: '15-20 min',
      calories: 130,
      equipment: 'Dumbbells/Barbell',
      primaryMuscles: ['Full Body'],
      secondaryMuscles: ['Core'],
      description: 'Compound movement combining squat and press',
      tips: ['Squat down', 'Press up explosively', 'Full body movement'],
    },
    {
      id: 'bear_crawl',
      name: 'Bear Crawl',
      emoji: '🐻',
      difficulty: 'intermediate',
      location: 'home',
      duration: '8-12 min',
      calories: 85,
      equipment: 'None',
      primaryMuscles: ['Full Body', 'Core'],
      secondaryMuscles: ['Shoulders'],
      description: 'Animal movement for full-body conditioning',
      tips: ['Hands and feet only', 'Keep knees low', 'Move opposite limbs'],
    },
    {
      id: 'turkish_getup',
      name: 'Turkish Get-up',
      emoji: '🔄',
      difficulty: 'advanced',
      location: 'both',
      duration: '15-20 min',
      calories: 110,
      equipment: 'Kettlebell/Dumbbell',
      primaryMuscles: ['Full Body', 'Core'],
      secondaryMuscles: ['Stability'],
      description: 'Complex movement from lying to standing',
      tips: ['Start light weight', 'Focus on form', 'Slow controlled movement'],
    },
    {
      id: 'high_knees',
      name: 'High Knees',
      emoji: '🏃',
      difficulty: 'beginner',
      location: 'home',
      duration: '5-10 min',
      calories: 70,
      equipment: 'None',
      primaryMuscles: ['Legs', 'Core'],
      secondaryMuscles: ['Cardio'],
      description: 'Dynamic cardio exercise for leg drive',
      tips: ['Knees to chest level', 'Pump arms', 'Stay on balls of feet'],
    },
    {
      id: 'squat_to_press',
      name: 'Squat to Press',
      emoji: '🏋️‍♀️',
      difficulty: 'intermediate',
      location: 'both',
      duration: '12-18 min',
      calories: 100,
      equipment: 'Dumbbells',
      primaryMuscles: ['Full Body'],
      secondaryMuscles: ['Core'],
      description: 'Combination squat and overhead press',
      tips: ['Squat with weights at shoulders', 'Press up as you stand', 'Control the movement'],
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

  const renderExerciseCard = (exercise: any, index: number) => {
    // Get difficulty color and icon
    const difficultyColor = difficultyColors[exercise.difficulty as keyof typeof difficultyColors];
    const iconUrl = exerciseIcons[exercise.id] || exerciseIcons.pushups;
    
    return (
      <Animated.View
        key={exercise.id}
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
  };

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

        {/* Exercise List */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {exercises.length > 0 ? (
            exercises.map((exercise, index) => renderExerciseCard(exercise, index))
          ) : (
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
                onPress={() => {
                  // No filters to reset
                }}
              >
                <Text style={styles.resetButtonText}>Go Back</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
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
