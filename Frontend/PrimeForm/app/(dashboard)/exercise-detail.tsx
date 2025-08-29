import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Video, ResizeMode } from 'expo-av';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import { useLanguage } from '../../src/context/LanguageContext';

const { width: screenWidth } = Dimensions.get('window');

type DifficultyLevel = 'beginner' | 'medium' | 'advanced';

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
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>('beginner');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

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

  const renderDifficultyButton = (level: ExerciseLevel) => {
    const isSelected = selectedLevel === level.level;
    return (
      <TouchableOpacity
        key={level.level}
        style={[
          styles.difficultyButton,
          isSelected && styles.difficultyButtonActive
        ]}
        onPress={() => setSelectedLevel(level.level)}
        activeOpacity={0.8}
      >
        <Text style={styles.difficultyEmoji}>{level.emoji}</Text>
        <Text style={[
          styles.difficultyText,
          isSelected && styles.difficultyTextActive
        ]}>
          {level.title}
        </Text>
        <Text style={[
          styles.difficultySubtext,
          isSelected && styles.difficultySubtextActive
        ]}>
          {t(`exercise.detail.${level.level}`)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Exercise Header Info */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.exerciseHeader}>
          <View style={styles.exerciseEmojiContainer}>
            <Text style={styles.exerciseEmoji}>{exerciseEmoji}</Text>
          </View>
          <View style={styles.exerciseInfo}>
            <Text style={styles.headerTitle}>{t(`exercise.${exerciseId}`)}</Text>
            <Text style={styles.headerCategory}>{t(`category.${category}`)}</Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Target Muscles */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.musclesSection}>
            <Text style={styles.sectionTitle}>{t('exercise.detail.targetMuscles')}</Text>
            <View style={styles.musclesContainer}>
              {targetMuscles.map((muscle: string, index: number) => (
                <View key={index} style={styles.muscleTag}>
                  <Text style={styles.muscleText}>{t(`muscle.${muscle}`)}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Video Player */}
          <Animated.View entering={FadeInUp.delay(300)} style={styles.videoSection}>
            <Text style={styles.sectionTitle}>{t('exercise.detail.demonstration')}</Text>
            <View style={styles.videoContainer}>
              <Video
                source={{ uri: videoUrl }}
                style={styles.video}
                useNativeControls
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
                  activeOpacity={0.8}
                >
                  <Text style={styles.playButton}>▶️</Text>
                  <Text style={styles.videoText}>{t('exercise.detail.tapToPlay')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Difficulty Levels */}
          <Animated.View entering={FadeInUp.delay(400)} style={styles.difficultySection}>
            <Text style={styles.sectionTitle}>{t('exercise.detail.chooseLevel')}</Text>
            <View style={styles.difficultyButtons}>
              {exerciseLevels.map(renderDifficultyButton)}
            </View>
          </Animated.View>

          {/* Exercise Details */}
          <Animated.View entering={FadeInUp.delay(500)} style={styles.detailsSection}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>{currentLevel.title}</Text>
              <Text style={styles.detailsEmoji}>{currentLevel.emoji}</Text>
            </View>
            
            <Text style={styles.detailsDescription}>{currentLevel.description}</Text>
            
            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('exercise.detail.duration')}</Text>
                <Text style={styles.statValue}>{currentLevel.duration}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('exercise.detail.reps')}</Text>
                <Text style={styles.statValue}>{currentLevel.reps}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('exercise.detail.sets')}</Text>
                <Text style={styles.statValue}>{currentLevel.sets}</Text>
              </View>
            </View>

            {/* Tips */}
            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>{t('exercise.detail.proTips')}</Text>
              {currentLevel.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Start Workout Button */}
          <Animated.View entering={FadeInUp.delay(600)} style={styles.startSection}>
            <TouchableOpacity style={styles.startButton} activeOpacity={0.8}>
              <Text style={styles.startButtonText}>{t('exercise.detail.startWorkout')}</Text>
              <Text style={styles.fitnessIcon}>💪</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Bottom Spacing */}
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
    justifyContent: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  exerciseEmojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  exerciseEmoji: {
    fontSize: 32,
    textAlign: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },

  headerTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  headerCategory: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
    letterSpacing: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },
  musclesSection: {
    marginBottom: spacing.xl,
  },
  musclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  muscleTag: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  muscleText: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  videoSection: {
    marginBottom: spacing.xl,
  },
  videoContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    position: 'relative',
    height: 200,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  videoText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  difficultySection: {
    marginBottom: spacing.xl,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  difficultyButtonActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  difficultyEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  difficultyText: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: 2,
  },
  difficultyTextActive: {
    color: colors.white,
  },
  difficultySubtext: {
    color: colors.mutedText,
    fontSize: 10,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  difficultySubtextActive: {
    color: colors.white,
  },
  detailsSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.xl,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailsTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
    flex: 1,
  },
  detailsEmoji: {
    fontSize: 24,
  },
  detailsDescription: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.gold,
    fontSize: typography.body,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  tipsSection: {
    marginTop: spacing.md,
  },
  tipsTitle: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginBottom: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  tipBullet: {
    color: colors.gold,
    fontSize: typography.body,
    fontWeight: '700',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  tipText: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontFamily: fonts.body,
    lineHeight: 20,
    flex: 1,
  },
  startSection: {
    marginBottom: spacing.xl,
  },
  startButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  startButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  bottomSpacing: {
    height: 50,
  },
  backArrow: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  playButton: {
    fontSize: 60,
    textAlign: 'center',
  },
  fitnessIcon: {
    fontSize: 20,
    color: colors.white,
  },
});