import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions, Image, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, FadeIn, SlideInRight, SlideInLeft, ZoomIn } from 'react-native-reanimated';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import { useLanguage } from '../../src/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

type DifficultyLevel = 'beginner' | 'medium' | 'advanced';

// Helper function to get Icons8 icon URL
const getIconUrl = (iconId: string, size: number = 64): string => {
  // Icons8 uses different URL formats based on icon ID format
  // For numeric IDs, use the standard format
  // For alphanumeric IDs (like from newer platforms), use a different format
  if (/^\d+$/.test(iconId)) {
    return `https://img.icons8.com/ios/${size}/${iconId}.png`;
  }
  // For newer icon formats, try the icon name format
  return `https://img.icons8.com/ios-filled/${size}/${iconId}.png`;
};

// Map exercise types to Icons8 icon IDs
const getExerciseIconId = (exerciseId: string, level: DifficultyLevel): string => {
  const iconMap: Record<string, Record<DifficultyLevel, string>> = {
    pushups: {
      beginner: '25247', // Push icon
      medium: '55884',
      advanced: '71222',
    },
    squats: {
      beginner: '3728', // Exercise icon
      medium: '70867',
      advanced: '9769',
    },
    pullups: {
      beginner: 'bjD9GUOFPcKw', // Pull up bar
      medium: 'c2E2guqKEP3Q',
      advanced: 'fDk83CIGXN0s',
    },
    bicepCurls: {
      beginner: '9782', // Curls with dumbbells
      medium: '7657',
      advanced: '70866',
    },
    shoulderPress: {
      beginner: '9782',
      medium: '7657',
      advanced: '70866',
    },
    planks: {
      beginner: '3728',
      medium: '70867',
      advanced: '9769',
    },
    cycling: {
      beginner: '3728',
      medium: '70867',
      advanced: '9769',
    },
    deadlifts: {
      beginner: '9782',
      medium: '7657',
      advanced: '70866',
    },
    benchpress: {
      beginner: '9782',
      medium: '7657',
      advanced: '70866',
    },
    lunges: {
      beginner: '3728',
      medium: '70867',
      advanced: '9769',
    },
    mountain_climbers: {
      beginner: '3728',
      medium: '70867',
      advanced: '9769',
    },
    tricep_dips: {
      beginner: '25247',
      medium: '55884',
      advanced: '71222',
    },
    burpees: {
      beginner: '7661', // Workout icon
      medium: '71097',
      advanced: '9848',
    },
    yoga: {
      beginner: '3728',
      medium: '70867',
      advanced: '9769',
    },
    pilates: {
      beginner: '3728',
      medium: '70867',
      advanced: '9769',
    },
  };
  
  return iconMap[exerciseId]?.[level] || '3728';
};

interface ExerciseLevel {
  level: DifficultyLevel;
  title: string;
  duration: string;
  reps: string;
  sets: string;
  description: string;
  tips: string[];
  emoji: string;
}

const getExerciseLevels = (exerciseId: string): ExerciseLevel[] => {
  const baseExercises: Record<string, ExerciseLevel[]> = {
    pushups: [
      {
        level: 'beginner',
        title: 'Knee Push-ups',
        duration: '10-15 minutes',
        reps: '5-8',
        sets: '2-3',
        description: 'Start with knee push-ups to build basic strength. Keep your body straight from knees to head.',
        tips: ['Keep core engaged', 'Lower slowly', 'Push up explosively', 'Rest 60 seconds between sets'],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Standard Push-ups',
        duration: '15-20 minutes',
        reps: '8-12',
        sets: '3-4',
        description: 'Classic push-ups with proper form. Maintain straight line from head to heels.',
        tips: ['Hands shoulder-width apart', 'Lower chest to ground', 'Keep elbows at 45°', 'Rest 45 seconds between sets'],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Diamond Push-ups',
        duration: '20-25 minutes',
        reps: '10-15',
        sets: '4-5',
        description: 'Advanced variation targeting triceps. Form diamond shape with hands under chest.',
        tips: ['Hands form diamond', 'Slow controlled movement', 'Focus on triceps', 'Rest 30 seconds between sets'],
        emoji: '🔴'
      }
    ],
    squats: [
      {
        level: 'beginner',
        title: 'Bodyweight Squats',
        duration: '10-15 minutes',
        reps: '8-12',
        sets: '2-3',
        description: 'Basic squat movement focusing on proper form and depth.',
        tips: ['Feet shoulder-width apart', 'Lower until thighs parallel', 'Keep chest up', 'Rest 60 seconds between sets'],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Jump Squats',
        duration: '15-20 minutes',
        reps: '10-15',
        sets: '3-4',
        description: 'Add explosive jump to increase intensity and power.',
        tips: ['Land softly', 'Full squat depth', 'Explosive jump up', 'Rest 45 seconds between sets'],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Pistol Squats',
        duration: '20-25 minutes',
        reps: '5-8 each leg',
        sets: '4-5',
        description: 'Single-leg squat requiring balance, strength, and flexibility.',
        tips: ['Use wall for support initially', 'Keep extended leg straight', 'Control the movement', 'Rest 30 seconds between sets'],
        emoji: '🔴'
      }
    ],
    // Add more exercises with similar structure
    pullups: [
      {
        level: 'beginner',
        title: 'Assisted Pull-ups',
        duration: '10-15 minutes',
        reps: '3-5',
        sets: '2-3',
        description: 'Use resistance band or assisted machine to build strength.',
        tips: ['Full range of motion', 'Control the descent', 'Engage lats', 'Rest 90 seconds between sets'],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Standard Pull-ups',
        duration: '15-20 minutes',
        reps: '5-8',
        sets: '3-4',
        description: 'Classic pull-up with chin over bar.',
        tips: ['Dead hang start', 'Pull chest to bar', 'Controlled descent', 'Rest 60 seconds between sets'],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Weighted Pull-ups',
        duration: '20-25 minutes',
        reps: '6-10',
        sets: '4-5',
        description: 'Add weight for increased difficulty and strength gains.',
        tips: ['Start with light weight', 'Maintain form', 'Full range of motion', 'Rest 45 seconds between sets'],
        emoji: '🔴'
      }
    ],
    bicepCurls: [
      {
        level: 'beginner',
        title: 'Dumbbell Bicep Curls',
        duration: '10-15 minutes',
        reps: '10-12',
        sets: '2-3',
        description: 'Basic bicep curls to build arm strength and definition.',
        tips: [
          'Stand with feet shoulder-width apart, dumbbells at sides',
          'Keep your elbows close to your body throughout',
          'Curl dumbbells up to shoulder level, not higher',
          'Lower dumbbells slowly to full arm extension'
        ],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Alternating Bicep Curls',
        duration: '15-20 minutes',
        reps: '12-15 each arm',
        sets: '3-4',
        description: 'Alternate arms to increase focus and control.',
        tips: [
          'Curl one arm while keeping the other at your side',
          'Maintain controlled movement on both up and down',
          'Keep your core engaged to prevent body sway',
          'Focus on bicep contraction at the top of each curl'
        ],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Hammer Curls',
        duration: '20-25 minutes',
        reps: '10-12',
        sets: '4-5',
        description: 'Target both biceps and forearms with hammer grip.',
        tips: [
          'Hold dumbbells with palms facing each other',
          'Keep your wrists straight throughout the movement',
          'Curl both arms simultaneously for maximum intensity',
          'Lower dumbbells slowly to maximize muscle engagement'
        ],
        emoji: '🔴'
      }
    ],
    shoulderPress: [
      {
        level: 'beginner',
        title: 'Dumbbell Shoulder Press',
        duration: '15-20 minutes',
        reps: '8-10',
        sets: '2-3',
        description: 'Build shoulder strength with proper pressing form.',
        tips: [
          'Sit with back straight, dumbbells at shoulder level',
          'Press dumbbells up until arms are fully extended',
          'Keep your core engaged to prevent back arching',
          'Lower dumbbells slowly back to starting position'
        ],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Standing Shoulder Press',
        duration: '20-25 minutes',
        reps: '8-12',
        sets: '3-4',
        description: 'Standing variation for core engagement and stability.',
        tips: [
          'Stand with feet shoulder-width apart, core tight',
          'Press dumbbells up in a straight line overhead',
          'Keep your head forward, not leaning back',
          'Control the descent to maintain shoulder stability'
        ],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Arnold Press',
        duration: '25-30 minutes',
        reps: '8-10',
        sets: '4-5',
        description: 'Advanced variation with rotation for full shoulder development.',
        tips: [
          'Start with dumbbells at chest level, palms facing you',
          'Rotate palms forward as you press up',
          'Rotate palms back as you lower dumbbells',
          'Focus on smooth rotation throughout the movement'
        ],
        emoji: '🔴'
      }
    ],
    planks: [
      {
        level: 'beginner',
        title: 'Knee Planks',
        duration: '10-15 minutes',
        reps: '3 x 20 seconds',
        sets: '2-3',
        description: 'Build core strength with modified plank position.',
        tips: [
          'Start on your knees with forearms on the ground',
          'Keep your body straight from knees to head',
          'Engage your core muscles throughout the hold',
          'Breathe steadily and maintain the position'
        ],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Standard Planks',
        duration: '15-20 minutes',
        reps: '3 x 45 seconds',
        sets: '3-4',
        description: 'Classic plank for core and shoulder stability.',
        tips: [
          'Hold body in straight line from head to heels',
          'Keep your core tight and glutes engaged',
          'Don\'t let your hips sag or rise',
          'Focus on breathing steadily throughout the hold'
        ],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Side Planks',
        duration: '20-25 minutes',
        reps: '3 x 30 seconds each side',
        sets: '4-5',
        description: 'Target obliques and improve lateral stability.',
        tips: [
          'Stack your feet and lift your hips high',
          'Keep your body in a straight line from head to feet',
          'Engage your obliques to maintain position',
          'Hold each side for equal time to maintain balance'
        ],
        emoji: '🔴'
      }
    ],
    cycling: [
      {
        level: 'beginner',
        title: 'Stationary Cycling',
        duration: '20-30 minutes',
        reps: 'N/A',
        sets: '1',
        description: 'Low-impact cardio to build endurance and leg strength.',
        tips: [
          'Adjust seat height so knee is slightly bent at bottom',
          'Keep your back straight and shoulders relaxed',
          'Pedal at a comfortable, steady pace',
          'Focus on smooth, circular pedaling motion'
        ],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Interval Cycling',
        duration: '25-35 minutes',
        reps: 'N/A',
        sets: '1',
        description: 'Alternate between high and low intensity for cardio fitness.',
        tips: [
          'Warm up for 5 minutes at easy pace',
          'Alternate 2 minutes hard, 1 minute easy',
          'Keep your core engaged during high-intensity intervals',
          'Cool down for 5 minutes at easy pace'
        ],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Hill Climbing',
        duration: '30-45 minutes',
        reps: 'N/A',
        sets: '1',
        description: 'Simulate hill climbing for maximum leg strength and endurance.',
        tips: [
          'Increase resistance to simulate uphill climbs',
          'Maintain steady cadence even with high resistance',
          'Keep your upper body still and relaxed',
          'Focus on pushing through your legs and glutes'
        ],
        emoji: '🔴'
      }
    ],
    deadlifts: [
      {
        level: 'beginner',
        title: 'Bodyweight Deadlifts',
        duration: '15-20 minutes',
        reps: '8-12',
        sets: '2-3',
        description: 'Learn proper hip hinge movement without weight.',
        tips: [
          'Stand with feet hip-width apart, knees slightly bent',
          'Hinge at your hips, pushing your butt back',
          'Keep your back straight and chest up throughout',
          'Return to standing by squeezing your glutes'
        ],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Dumbbell Deadlifts',
        duration: '20-25 minutes',
        reps: '8-12',
        sets: '3-4',
        description: 'Add weight while maintaining perfect form.',
        tips: [
          'Hold dumbbells in front of your thighs',
          'Hinge at hips, keeping dumbbells close to your legs',
          'Lower until you feel a stretch in your hamstrings',
          'Drive through your heels to return to standing'
        ],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Barbell Deadlifts',
        duration: '25-30 minutes',
        reps: '5-8',
        sets: '4-5',
        description: 'Full barbell deadlifts for maximum strength gains.',
        tips: [
          'Bar should be over mid-foot, close to your shins',
          'Grip bar with hands shoulder-width apart',
          'Keep bar close to your body throughout the lift',
          'Drive through your heels and squeeze glutes at the top'
        ],
        emoji: '🔴'
      }
    ],
    benchpress: [
      {
        level: 'beginner',
        title: 'Dumbbell Bench Press',
        duration: '15-20 minutes',
        reps: '8-12',
        sets: '2-3',
        description: 'Learn proper pressing form with dumbbells.',
        tips: [
          'Lie on bench with feet flat on the ground',
          'Hold dumbbells at chest level, palms facing forward',
          'Press dumbbells up until arms are fully extended',
          'Lower dumbbells slowly back to starting position'
        ],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Barbell Bench Press',
        duration: '20-25 minutes',
        reps: '6-10',
        sets: '3-4',
        description: 'Classic barbell bench press for chest development.',
        tips: [
          'Grip bar slightly wider than shoulder width',
          'Keep your shoulder blades retracted throughout',
          'Lower bar to your mid-chest, not your neck',
          'Press bar up in a straight line over your chest'
        ],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Incline Bench Press',
        duration: '25-30 minutes',
        reps: '6-10',
        sets: '4-5',
        description: 'Target upper chest with inclined bench press.',
        tips: [
          'Set bench to 30-45 degree incline',
          'Focus on upper chest activation',
          'Keep your core tight and feet planted',
          'Control the weight throughout the movement'
        ],
        emoji: '🔴'
      }
    ],
    lunges: [
      {
        level: 'beginner',
        title: 'Stationary Lunges',
        duration: '15-20 minutes',
        reps: '8-10 each leg',
        sets: '2-3',
        description: 'Basic lunge movement to build leg strength and balance.',
        tips: [
          'Step forward with one leg, keeping back leg stationary',
          'Lower until both knees are at 90-degree angles',
          'Keep your front knee aligned with your toes',
          'Push back to starting position using your front leg'
        ],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Walking Lunges',
        duration: '20-25 minutes',
        reps: '10-12 each leg',
        sets: '3-4',
        description: 'Dynamic lunges to improve coordination and strength.',
        tips: [
          'Take a step forward and lower into lunge position',
          'Keep your torso upright and core engaged',
          'Push off your back foot to step forward',
          'Maintain steady rhythm and controlled movement'
        ],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Jumping Lunges',
        duration: '25-30 minutes',
        reps: '8-10 each leg',
        sets: '4-5',
        description: 'Explosive lunges for power and cardiovascular fitness.',
        tips: [
          'Start in lunge position with both knees bent',
          'Explode upward, switching leg positions mid-air',
          'Land softly in opposite lunge position',
          'Immediately go into next jump without pausing'
        ],
        emoji: '🔴'
      }
    ],
    mountain_climbers: [
      {
        level: 'beginner',
        title: 'Slow Mountain Climbers',
        duration: '10-15 minutes',
        reps: '20-30 total',
        sets: '2-3',
        description: 'Build core strength with controlled mountain climber movement.',
        tips: [
          'Start in plank position with hands under shoulders',
          'Bring one knee toward your chest slowly',
          'Keep your core engaged and hips level',
          'Return to plank and repeat with other leg'
        ],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Standard Mountain Climbers',
        duration: '15-20 minutes',
        reps: '30-40 total',
        sets: '3-4',
        description: 'Classic mountain climbers for cardio and core strength.',
        tips: [
          'Maintain plank position throughout the movement',
          'Alternate legs in a running motion',
          'Keep your hips level and core tight',
          'Increase speed while maintaining form'
        ],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Cross-Body Mountain Climbers',
        duration: '20-25 minutes',
        reps: '40-50 total',
        sets: '4-5',
        description: 'Advanced variation targeting obliques and coordination.',
        tips: [
          'Bring knee toward opposite elbow across your body',
          'Engage your obliques during the cross-body movement',
          'Keep your hips stable and core engaged',
          'Maintain steady rhythm and controlled movement'
        ],
        emoji: '🔴'
      }
    ],
    tricep_dips: [
      {
        level: 'beginner',
        title: 'Chair Dips',
        duration: '10-15 minutes',
        reps: '5-8',
        sets: '2-3',
        description: 'Basic tricep dips using a chair or bench for support.',
        tips: [
          'Sit on edge of chair with hands gripping the seat',
          'Slide your butt off the chair, keeping hands in place',
          'Lower your body by bending your elbows to 90 degrees',
          'Push back up using your triceps, not your legs'
        ],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Parallel Bar Dips',
        duration: '15-20 minutes',
        reps: '8-12',
        sets: '3-4',
        description: 'Classic tricep dips on parallel bars or dip station.',
        tips: [
          'Grip parallel bars with arms fully extended',
          'Lower your body by bending your elbows',
          'Keep your body upright and core engaged',
          'Push back up to starting position using triceps'
        ],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Weighted Dips',
        duration: '20-25 minutes',
        reps: '6-10',
        sets: '4-5',
        description: 'Add weight for increased tricep strength and development.',
        tips: [
          'Attach weight belt or hold dumbbell between your feet',
          'Maintain strict form throughout the movement',
          'Lower slowly and control the descent',
          'Focus on tricep engagement during the push-up phase'
        ],
        emoji: '🔴'
      }
    ],
    burpees: [
      {
        level: 'beginner',
        title: 'Modified Burpees',
        duration: '15-20 minutes',
        reps: '5-8',
        sets: '2-3',
        description: 'Simplified burpees to build endurance and coordination.',
        tips: [
          'Start standing, then squat down and place hands on ground',
          'Step back one leg at a time to plank position',
          'Step forward one leg at a time, then stand up',
          'Add a small jump at the end for full movement'
        ],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Standard Burpees',
        duration: '20-25 minutes',
        reps: '8-12',
        sets: '3-4',
        description: 'Full burpees with push-up and explosive jump.',
        tips: [
          'Drop to plank position and do a push-up',
          'Jump your feet forward to squat position',
          'Explode upward with a vertical jump',
          'Land softly and immediately go into next rep'
        ],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Burpee Pull-ups',
        duration: '25-30 minutes',
        reps: '6-10',
        sets: '4-5',
        description: 'Advanced burpees combined with pull-ups for maximum intensity.',
        tips: [
          'Complete full burpee with push-up and jump',
          'Grab pull-up bar and perform a pull-up',
          'Drop down and immediately start next burpee',
          'Maintain explosive power throughout the set'
        ],
        emoji: '🔴'
      }
    ],
    yoga: [
      {
        level: 'beginner',
        title: 'Basic Yoga Flow',
        duration: '20-30 minutes',
        reps: 'N/A',
        sets: '1',
        description: 'Gentle yoga sequence for flexibility and relaxation.',
        tips: [
          'Start with simple poses like child\'s pose and cat-cow',
          'Focus on breathing deeply throughout each pose',
          'Hold each pose for 3-5 breaths',
          'Listen to your body and don\'t force any positions'
        ],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Vinyasa Flow',
        duration: '30-45 minutes',
        reps: 'N/A',
        sets: '1',
        description: 'Dynamic yoga flow connecting breath with movement.',
        tips: [
          'Flow smoothly from one pose to the next',
          'Coordinate your breath with each movement',
          'Maintain steady rhythm and controlled transitions',
          'Focus on building heat and increasing flexibility'
        ],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Power Yoga',
        duration: '45-60 minutes',
        reps: 'N/A',
        sets: '1',
        description: 'Intense yoga practice for strength and endurance.',
        tips: [
          'Combine strength poses with dynamic movements',
          'Hold challenging poses for extended periods',
          'Focus on building both strength and flexibility',
          'Maintain steady breathing during intense sequences'
        ],
        emoji: '🔴'
      }
    ],
    pilates: [
      {
        level: 'beginner',
        title: 'Mat Pilates Basics',
        duration: '20-30 minutes',
        reps: 'N/A',
        sets: '1',
        description: 'Fundamental Pilates movements on the mat.',
        tips: [
          'Focus on engaging your core throughout each exercise',
          'Move slowly and with control',
          'Keep your spine neutral and pelvis stable',
          'Breathe deeply and rhythmically'
        ],
        emoji: '🟢'
      },
      {
        level: 'medium',
        title: 'Intermediate Mat Work',
        duration: '30-45 minutes',
        reps: 'N/A',
        sets: '1',
        description: 'More challenging Pilates exercises for core strength.',
        tips: [
          'Combine multiple movements in flowing sequences',
          'Focus on precision and control',
          'Engage multiple muscle groups simultaneously',
          'Maintain proper alignment throughout'
        ],
        emoji: '🟡'
      },
      {
        level: 'advanced',
        title: 'Advanced Pilates',
        duration: '45-60 minutes',
        reps: 'N/A',
        sets: '1',
        description: 'Complex Pilates movements for advanced practitioners.',
        tips: [
          'Execute complex movements with perfect form',
          'Focus on mind-body connection',
          'Challenge your balance and coordination',
          'Maintain control throughout advanced sequences'
        ],
        emoji: '🔴'
      }
    ]
  };

  return baseExercises[exerciseId] || baseExercises.pushups;
};

const getExerciseVideo = (exerciseId: string): string => {
  // Short exercise demonstration videos
  const videoMap: Record<string, string> = {
    pushups: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    squats: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    pullups: 'https://file-examples.com/storage/fe68c1b7c66d5b2b9c2568b/2017/10/file_example_MP4_480_1_5MG.mp4',
    lunges: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    planks: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    deadlifts: 'https://file-examples.com/storage/fe68c1b7c66d5b2b9c2568b/2017/10/file_example_MP4_480_1_5MG.mp4',
    benchpress: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    bicepCurls: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    shoulderPress: 'https://file-examples.com/storage/fe68c1b7c66d5b2b9c2568b/2017/10/file_example_MP4_480_1_5MG.mp4',
    cycling: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    rowing: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    jumping_jacks: 'https://file-examples.com/storage/fe68c1b7c66d5b2b9c2568b/2017/10/file_example_MP4_480_1_5MG.mp4',
    // Add more as needed
  };
  
  return videoMap[exerciseId] || 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4';
};

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>('beginner');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [iconLoadErrors, setIconLoadErrors] = useState<Record<string, boolean>>({});
  const [isStarting, setIsStarting] = useState(false);

  const exerciseId = params.exerciseId as string;
  const exerciseName = params.exerciseName as string;
  const exerciseEmoji = params.exerciseEmoji as string;
  const category = params.category as string;
  const targetMuscles = JSON.parse(params.targetMuscles as string || '[]');

  const exerciseLevels = getExerciseLevels(exerciseId);
  const currentLevel = exerciseLevels.find(level => level.level === selectedLevel) || exerciseLevels[0];
  const videoUrl = getExerciseVideo(exerciseId);

  const handleBack = () => {
    router.back();
  };

  const handleStartWorkout = () => {
    setIsStarting(true);
    setTimeout(() => {
      setIsStarting(false);
      // Navigate to workout player or show workout started
    }, 1500);
  };

  const renderDifficultyButton = (level: ExerciseLevel, index: number) => {
    const isSelected = selectedLevel === level.level;
    
    // Gradient colors based on difficulty level
    const getGradientColors = (): [string, string] => {
      switch (level.level) {
        case 'beginner':
          return ['#00C97C', '#00A066'];
        case 'medium':
          return ['#FFB800', '#FF8A00'];
        case 'advanced':
          return ['#FF3B30', '#C91F16'];
        default:
          return [colors.primary, colors.primaryDark];
      }
    };

    const getDifficultyColor = () => {
      switch (level.level) {
        case 'beginner':
          return '#00C97C';
        case 'medium':
          return '#FFB800';
        case 'advanced':
          return '#FF3B30';
        default:
          return colors.primary;
      }
    };

    const getLevelIcon = () => {
      switch (level.level) {
        case 'beginner':
          return 'leaf-outline';
        case 'medium':
          return 'flash-outline';
        case 'advanced':
          return 'flame-outline';
        default:
          return 'fitness-outline';
      }
    };

    return (
      <Animated.View
        key={level.level}
        entering={SlideInRight.delay(200 + index * 100).springify()}
        style={styles.difficultyButtonWrapper}
      >
        <TouchableOpacity
          style={[
            styles.difficultyButton,
            isSelected && styles.difficultyButtonActive
          ]}
          onPress={() => setSelectedLevel(level.level)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isSelected ? getGradientColors() : ['rgba(26, 28, 36, 0.8)', 'rgba(26, 28, 36, 0.6)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.difficultyGradient}
          >
            {/* Glowing Effect for Selected */}
            {isSelected && (
              <View style={[styles.glowEffect, { backgroundColor: getDifficultyColor() }]} />
            )}

            {/* Icon Container */}
            <View style={[
              styles.difficultyIconContainer,
              isSelected && { 
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderColor: 'rgba(255, 255, 255, 0.4)'
              }
            ]}>
              <Ionicons 
                name={getLevelIcon() as any} 
                size={32} 
                color={isSelected ? colors.white : getDifficultyColor()} 
              />
            </View>

            {/* Content */}
            <View style={styles.difficultyContent}>
              <Text style={[
                styles.difficultyText,
                isSelected && styles.difficultyTextActive
              ]}>
                {level.title}
              </Text>
              <View style={styles.difficultyMeta}>
                <Text style={[
                  styles.difficultySubtext,
                  isSelected && styles.difficultySubtextActive
                ]}>
                  {t(`exercise.detail.${level.level}`)}
                </Text>
                <View style={[
                  styles.difficultyDot,
                  { backgroundColor: getDifficultyColor() }
                ]} />
              </View>
            </View>

            {/* Stats Preview */}
            <View style={styles.difficultyStats}>
              <View style={styles.miniStat}>
                <Ionicons name="time-outline" size={14} color={isSelected ? colors.white : colors.mutedText} />
                <Text style={[styles.miniStatText, isSelected && { color: colors.white }]}>
                  {level.duration.split('-')[0]}
                </Text>
              </View>
              <View style={styles.miniStat}>
                <Ionicons name="repeat-outline" size={14} color={isSelected ? colors.white : colors.mutedText} />
                <Text style={[styles.miniStatText, isSelected && { color: colors.white }]}>
                  {level.sets}
                </Text>
              </View>
            </View>

            {/* Selection Indicator */}
            {isSelected && (
              <Animated.View 
                entering={ZoomIn.springify()}
                style={styles.selectedIndicator}
              >
                <Ionicons name="checkmark-circle" size={28} color={colors.white} />
              </Animated.View>
            )}

            {/* Border Accent */}
            {isSelected && (
              <View style={[styles.accentBorder, { backgroundColor: getDifficultyColor() }]} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Modern Header with Gradient */}
        <Animated.View entering={FadeInDown.springify()} style={styles.headerContainer}>
          <LinearGradient
            colors={['rgba(0, 201, 124, 0.15)', 'rgba(0, 0, 0, 0)']}
            style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
          >
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
              <View style={styles.backButtonGradient}>
                <Ionicons name="arrow-back" size={24} color={colors.white} />
              </View>
            </TouchableOpacity>

            {/* Header Info */}
            <View style={styles.headerInfo}>
              <Animated.View entering={FadeIn.delay(200)} style={styles.headerBadge}>
                <Ionicons name="barbell-outline" size={14} color={colors.primary} />
                <Text style={styles.headerBadgeText}>{t(`category.${category}`)}</Text>
              </Animated.View>
            </View>

            {/* Favorite Button */}
            <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.8}>
              <View style={styles.favoriteButtonGradient}>
                <Ionicons name="heart-outline" size={24} color={colors.white} />
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
        
        {/* Hero Exercise Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.heroCard}>
          <LinearGradient
            colors={['rgba(26, 28, 36, 0.95)', 'rgba(18, 20, 26, 0.98)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCardGradient}
          >
            {/* Animated Background Pattern */}
            <View style={styles.heroPattern}>
              <View style={[styles.patternCircle, { top: -20, right: -20 }]} />
              <View style={[styles.patternCircle, { bottom: -30, left: -30 }]} />
            </View>

            {/* Exercise Icon */}
            <Animated.View entering={ZoomIn.delay(300).springify()} style={styles.heroIconContainer}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.heroIconGradient}
              >
                <Text style={styles.heroEmoji}>{exerciseEmoji}</Text>
              </LinearGradient>
            </Animated.View>

            {/* Exercise Title */}
            <Animated.Text entering={FadeIn.delay(400)} style={styles.heroTitle}>
              {t(`exercise.${exerciseId}`)}
            </Animated.Text>

            {/* Quick Stats Row */}
            <Animated.View entering={SlideInLeft.delay(500).springify()} style={styles.quickStatsRow}>
              <View style={styles.quickStat}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={styles.quickStatText}>{currentLevel.duration}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.quickStat}>
                <Ionicons name="repeat-outline" size={18} color={colors.gold} />
                <Text style={styles.quickStatText}>{currentLevel.sets} sets</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.quickStat}>
                <Ionicons name="fitness-outline" size={18} color="#FF3B30" />
                <Text style={styles.quickStatText}>{currentLevel.reps}</Text>
              </View>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Target Muscles - Modern Pills */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIconBox}>
                  <Ionicons name="body-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>{t('exercise.detail.targetMuscles')}</Text>
              </View>
              <View style={styles.muscleCount}>
                <Text style={styles.muscleCountText}>{targetMuscles.length}</Text>
              </View>
            </View>
            <View style={styles.musclesContainer}>
              {targetMuscles.map((muscle: string, index: number) => (
                <Animated.View 
                  key={index}
                  entering={SlideInLeft.delay(300 + index * 50).springify()}
                >
                  <LinearGradient
                    colors={['rgba(0, 201, 124, 0.2)', 'rgba(0, 201, 124, 0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.muscleTag}
                  >
                    <View style={styles.muscleDot} />
                    <Text style={styles.muscleText}>{t(`muscle.${muscle}`)}</Text>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  </LinearGradient>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Video Player - Premium Design */}
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIconBox}>
                  <Ionicons name="play-circle-outline" size={20} color={colors.gold} />
                </View>
                <Text style={styles.sectionTitle}>{t('exercise.detail.demonstration')}</Text>
              </View>
              <TouchableOpacity style={styles.fullscreenBtn}>
                <Ionicons name="expand-outline" size={18} color={colors.mutedText} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.videoCard}>
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.95)']}
                style={styles.videoContainer}
              >
                <Video
                  source={{ uri: videoUrl }}
                  style={styles.video}
                  useNativeControls={isVideoPlaying}
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping
                  shouldPlay={isVideoPlaying}
                  onPlaybackStatusUpdate={(status) => {
                    if (status.isLoaded) {
                      setIsVideoPlaying(status.isPlaying || false);
                    }
                  }}
                />
                {!isVideoPlaying && (
                  <TouchableOpacity 
                    style={styles.videoOverlay}
                    onPress={() => setIsVideoPlaying(true)}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      style={styles.playButtonGradient}
                    >
                      <Ionicons name="play" size={40} color={colors.white} />
                    </LinearGradient>
                    <Text style={styles.videoText}>{t('exercise.detail.tapToPlay')}</Text>
                    <View style={styles.videoBadge}>
                      <Ionicons name="videocam" size={14} color={colors.white} />
                      <Text style={styles.videoBadgeText}>HD</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Video Info Bar */}
                <View style={styles.videoInfoBar}>
                  <View style={styles.videoInfoItem}>
                    <Ionicons name="time-outline" size={14} color={colors.white} />
                    <Text style={styles.videoInfoText}>2:30</Text>
                  </View>
                  <View style={styles.videoInfoItem}>
                    <Ionicons name="eye-outline" size={14} color={colors.white} />
                    <Text style={styles.videoInfoText}>12.5K</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Difficulty Levels */}
          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIconBox}>
                  <Ionicons name="speedometer-outline" size={20} color="#FFB800" />
                </View>
                <Text style={styles.sectionTitle}>{t('exercise.detail.chooseLevel')}</Text>
              </View>
              <View style={styles.levelIndicator}>
                <View style={[styles.levelDot, { backgroundColor: '#00C97C' }]} />
                <View style={[styles.levelDot, { backgroundColor: '#FFB800' }]} />
                <View style={[styles.levelDot, { backgroundColor: '#FF3B30' }]} />
              </View>
            </View>
            <View style={styles.difficultyButtons}>
              {exerciseLevels.map((level, index) => renderDifficultyButton(level, index))}
            </View>
          </Animated.View>

          {/* Exercise Details - Premium Card */}
          <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.section}>
            <LinearGradient
              colors={['rgba(26, 28, 36, 0.95)', 'rgba(18, 20, 26, 0.98)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.detailsCard}
            >
              {/* Header with Level Badge */}
              <View style={styles.detailsHeader}>
                <View>
                  <Text style={styles.detailsTitle}>{currentLevel.title}</Text>
                  <Text style={styles.detailsSubtitle}>Workout Plan</Text>
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.detailsEmoji}>{currentLevel.emoji}</Text>
                </View>
              </View>
              
              <Text style={styles.detailsDescription}>{currentLevel.description}</Text>
              
              {/* Stats Grid - Modern Design */}
              <View style={styles.statsGrid}>
                <Animated.View entering={SlideInLeft.delay(600).springify()} style={styles.statCard}>
                  <LinearGradient
                    colors={['rgba(0, 201, 124, 0.15)', 'rgba(0, 201, 124, 0.05)']}
                    style={styles.statCardGradient}
                  >
                    <View style={styles.statIconBox}>
                      <Ionicons name="time-outline" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.statLabel}>{t('exercise.detail.duration')}</Text>
                    <Text style={styles.statValue}>{currentLevel.duration}</Text>
                  </LinearGradient>
                </Animated.View>

                <Animated.View entering={SlideInLeft.delay(650).springify()} style={styles.statCard}>
                  <LinearGradient
                    colors={['rgba(255, 184, 0, 0.15)', 'rgba(255, 184, 0, 0.05)']}
                    style={styles.statCardGradient}
                  >
                    <View style={styles.statIconBox}>
                      <Ionicons name="repeat-outline" size={24} color={colors.gold} />
                    </View>
                    <Text style={styles.statLabel}>{t('exercise.detail.reps')}</Text>
                    <Text style={styles.statValue}>{currentLevel.reps}</Text>
                  </LinearGradient>
                </Animated.View>

                <Animated.View entering={SlideInLeft.delay(700).springify()} style={styles.statCard}>
                  <LinearGradient
                    colors={['rgba(255, 59, 48, 0.15)', 'rgba(255, 59, 48, 0.05)']}
                    style={styles.statCardGradient}
                  >
                    <View style={styles.statIconBox}>
                      <Ionicons name="layers-outline" size={24} color="#FF3B30" />
                    </View>
                    <Text style={styles.statLabel}>{t('exercise.detail.sets')}</Text>
                    <Text style={styles.statValue}>{currentLevel.sets}</Text>
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Pro Tips */}
              <View style={styles.tipsSection}>
                <View style={styles.tipsSectionHeader}>
                  <View style={styles.tipsIconBox}>
                    <Ionicons name="bulb" size={20} color={colors.gold} />
                  </View>
                  <Text style={styles.tipsTitle}>{t('exercise.detail.proTips')}</Text>
                </View>
                {currentLevel.tips.map((tip, index) => (
                  <Animated.View 
                    key={index}
                    entering={SlideInRight.delay(750 + index * 50).springify()}
                    style={styles.tipItem}
                  >
                    <View style={styles.tipIconContainer}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.tipText}>{tip}</Text>
                  </Animated.View>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Floating Action Button - Start Workout */}
        <Animated.View 
          entering={SlideInLeft.delay(800).springify()}
          style={[styles.floatingButton, { bottom: insets.bottom + spacing.lg }]}
        >
          <TouchableOpacity 
            style={styles.startButtonWrapper}
            onPress={handleStartWorkout}
            activeOpacity={0.95}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startButton}
            >
              {isStarting ? (
                <Animated.View entering={ZoomIn} style={styles.loadingContainer}>
                  <Ionicons name="checkmark-circle" size={28} color={colors.white} />
                  <Text style={styles.startButtonText}>Starting...</Text>
                </Animated.View>
              ) : (
                <>
                  <View style={styles.startButtonContent}>
                    <Ionicons name="play-circle" size={28} color={colors.white} />
                    <Text style={styles.startButtonText}>{t('exercise.detail.startWorkout')}</Text>
                  </View>
                  <View style={styles.startButtonIcon}>
                    <Ionicons name="arrow-forward" size={22} color={colors.white} />
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
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
    backgroundColor: 'rgba(26, 28, 36, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  backButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0, 201, 124, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 124, 0.3)',
  },
  headerBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 28, 36, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  favoriteButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero Card
  heroCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  heroCardGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 124, 0.2)',
  },
  heroPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  patternCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 201, 124, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 124, 0.1)',
  },
  heroIconContainer: {
    marginBottom: spacing.lg,
  },
  heroIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  heroEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  heroTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
  },
  quickStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickStatText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  
  // Section Styles
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },

  // Muscle Tags
  muscleCount: {
    backgroundColor: 'rgba(0, 201, 124, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    minWidth: 28,
    alignItems: 'center',
  },
  muscleCountText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  musclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  muscleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 124, 0.3)',
  },
  muscleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  muscleText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  // Video Section
  fullscreenBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoCard: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  videoContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    height: 220,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  playButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  videoText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  videoBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  videoBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  videoInfoBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  videoInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoInfoText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  // Difficulty Section
  levelIndicator: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  difficultyButtons: {
    gap: spacing.md,
  },
  difficultyButtonWrapper: {
    marginBottom: spacing.sm,
  },
  difficultyButton: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  difficultyButtonActive: {
    borderColor: 'rgba(0, 201, 124, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  difficultyGradient: {
    padding: spacing.lg,
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  difficultyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  difficultyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  difficultyText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: 4,
  },
  difficultyTextActive: {
    fontSize: 17,
    fontWeight: '800',
  },
  difficultyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  difficultySubtext: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  difficultySubtextActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniStatText: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  selectedIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  accentBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  // Details Card
  detailsCard: {
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailsTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: fonts.heading,
    letterSpacing: -0.5,
  },
  detailsSubtitle: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  detailsEmoji: {
    fontSize: 24,
  },
  detailsDescription: {
    color: colors.mutedText,
    fontSize: 15,
    fontFamily: fonts.body,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
  },
  statCardGradient: {
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 100,
    justifyContent: 'space-between',
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: 11,
    fontFamily: fonts.body,
    marginBottom: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  statValue: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    fontFamily: fonts.heading,
    textAlign: 'center',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: spacing.xl,
  },

  // Tips Section
  tipsSection: {
    gap: spacing.md,
  },
  tipsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipsIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  tipItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tipIconContainer: {
    marginTop: 2,
  },
  tipText: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 22,
    flex: 1,
  },
  // Floating Action Button
  floatingButton: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 100,
  },
  startButtonWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: 64,
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  startButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: fonts.heading,
    letterSpacing: -0.5,
  },
  startButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    justifyContent: 'center',
  },
  bottomSpacing: {
    height: 120,
  },
});