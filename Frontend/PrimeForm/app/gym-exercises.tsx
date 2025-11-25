import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  Dimensions,
  TextInput 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, FadeInLeft, FadeInRight, SlideInUp } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../src/theme/colors';
import { useAuthContext } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import DecorativeBackground from '../src/components/DecorativeBackground';
import { useToast } from '../src/context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336'
};

const difficultyEmojis = {
  beginner: '🟢',
  intermediate: '🟡',
  advanced: '🔴'
};

export default function GymExercisesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useLanguage();
  const { user } = useAuthContext();
  const { showToast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<'all' | 'home' | 'gym' | 'both'>('all');

  const category = params.category as string;
  const gender = params.gender as string;
  const filter = params.filter as string;
  const categoryName = params.categoryName as string;

  const exercises = exerciseDatabase[category as keyof typeof exerciseDatabase] || [];

  // Filter exercises based on search and filters
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           exercise.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = selectedLocation === 'all' || 
                             exercise.location === selectedLocation || 
                             exercise.location === 'both';
      
      return matchesSearch && matchesLocation;
    });
  }, [exercises, searchQuery, selectedLocation]);

  const handleBack = () => {
    router.back();
  };

  const handleExercisePress = (exercise: any) => {
    router.push({
      pathname: '/exercise-workout',
      params: {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseData: JSON.stringify(exercise),
        category,
        gender,
      },
    });
  };

  const renderExerciseCard = (exercise: any, index: number) => {
    return (
      <Animated.View
        key={exercise.id}
        entering={FadeInUp.delay(index * 100)}
        style={styles.exerciseWrapper}
      >
        <TouchableOpacity
          style={styles.exerciseCard}
          onPress={() => handleExercisePress(exercise)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.exerciseGradient}
          >
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseIconContainer}>
                <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDescription}>{exercise.description}</Text>
              </View>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyEmoji}>{difficultyEmojis[exercise.difficulty as keyof typeof difficultyEmojis]}</Text>
              </View>
            </View>
            
            <View style={styles.exerciseStats}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color={colors.mutedText} />
                <Text style={styles.statText}>{exercise.duration}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={16} color={colors.mutedText} />
                <Text style={styles.statText}>{exercise.calories} cal</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name={exercise.location === 'home' ? 'home' : exercise.location === 'gym' ? 'barbell' : 'location'} size={16} color={colors.mutedText} />
                <Text style={styles.statText}>{exercise.location === 'both' ? 'Home/Gym' : exercise.location}</Text>
              </View>
            </View>

            <View style={styles.muscleTagsContainer}>
              {exercise.primaryMuscles.slice(0, 3).map((muscle: string, idx: number) => (
                <View key={idx} style={styles.muscleTag}>
                  <Text style={styles.muscleTagText}>{muscle}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{categoryName} Exercises</Text>
            <Text style={styles.headerSubtitle}>{filteredExercises.length} exercises available</Text>
          </View>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View entering={FadeInLeft.delay(100)} style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.mutedText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={colors.mutedText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </Animated.View>

        {/* Filters */}
        <Animated.View entering={FadeInRight.delay(200)} style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {/* Location Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Location:</Text>
                <View style={styles.filterButtons}>
                  {['all', 'home', 'gym', 'both'].map((location) => (
                    <TouchableOpacity
                      key={location}
                      style={[
                        styles.filterButton,
                        selectedLocation === location && styles.filterButtonActive
                      ]}
                      onPress={() => setSelectedLocation(location as any)}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        selectedLocation === location && styles.filterButtonTextActive
                      ]}>
                        {location === 'all' ? 'All' : location === 'both' ? 'Both' : location.charAt(0).toUpperCase() + location.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Exercise List */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {filteredExercises.length > 0 ? (
            filteredExercises.map((exercise, index) => renderExerciseCard(exercise, index))
          ) : (
            <Animated.View entering={FadeInUp.delay(300)} style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>🔍</Text>
              <Text style={styles.emptyStateTitle}>No exercises found</Text>
              <Text style={styles.emptyStateText}>Try adjusting your search or filters</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  headerSubtitle: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.body,
    marginLeft: spacing.sm,
    paddingVertical: spacing.sm,
  },
  filtersContainer: {
    paddingVertical: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  filterGroup: {
    alignItems: 'flex-start',
  },
  filterLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginBottom: spacing.sm,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  filterButtonTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
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
    borderRadius: radius.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exerciseGradient: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  exerciseIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  exerciseEmoji: {
    fontSize: 24,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: 4,
  },
  exerciseDescription: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 20,
  },
  difficultyBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyEmoji: {
    fontSize: 20,
  },
  exerciseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    color: colors.mutedText,
    fontSize: 12,
    fontFamily: fonts.body,
    marginLeft: 4,
  },
  muscleTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  muscleTag: {
    backgroundColor: colors.primary + '20',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  muscleTagText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
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
    fontSize: 16,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 50,
  },
});
