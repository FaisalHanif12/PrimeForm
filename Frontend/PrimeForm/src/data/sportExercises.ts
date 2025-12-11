import { colors } from '../theme/colors';

export interface SportExercise {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  reps: number;
  sets: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  muscles: string[];
  equipment: string[];
  instructions: string[];
  animationUrl?: string;
  videoUrl?: string;
  thumbnail?: string;
}

export interface SportCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string[];
  description: string;
  exercises: SportExercise[];
}

export const sportCategories: SportCategory[] = [
  {
    id: 'cricket',
    name: 'Cricket',
    icon: '🏏',
    color: '#4CAF50',
    gradient: ['#4CAF50', '#81C784'],
    description: 'Cricket-specific training exercises for batting, bowling, and fielding',
    exercises: [
      {
        id: 'punches',
        name: 'Shadow Boxing',
        description: 'Rotational power and upper body explosiveness for batting strokes and bowling action',
        duration: 240,
        reps: 30,
        sets: 3,
        difficulty: 'Intermediate',
        muscles: ['Arms', 'Shoulders', 'Core', 'Cardio'],
        equipment: ['None'],
        instructions: [
          'Stand in athletic batting stance',
          'Practice explosive punching with full hip and shoulder rotation',
          'Simulate batting swing mechanics through rotational power',
          'Focus on quick, powerful movements',
          'Engage core throughout for stability',
        ],
      },
      {
        id: 'jump_squats',
        name: 'Jump Squats',
        description: 'Explosive leg power essential for powerful batting shots and fast bowling',
        duration: 180,
        reps: 15,
        sets: 3,
        difficulty: 'Advanced',
        muscles: ['Quadriceps', 'Glutes', 'Calves', 'Core'],
        equipment: ['None'],
        instructions: [
          'Start in athletic stance with feet shoulder-width apart',
          'Squat down powerfully then explode upward',
          'Build explosive leg drive for bowling and batting',
          'Land softly and immediately repeat',
          'Maintain balance and control throughout',
        ],
      },
      {
        id: 't_plank',
        name: 'T-Plank',
        description: 'Core rotational strength crucial for bowling action and batting power transfer',
        duration: 180,
        reps: 12,
        sets: 3,
        difficulty: 'Intermediate',
        muscles: ['Core', 'Obliques', 'Shoulders', 'Balance'],
        equipment: ['None'],
        instructions: [
          'Start in side plank position',
          'Rotate torso and extend arm upward',
          'Build rotational core strength for cricket movements',
          'Hold and control the rotation',
          'Switch sides evenly',
        ],
      },
    ],
  },
  {
    id: 'football',
    name: 'Football',
    icon: '⚽',
    color: '#2196F3',
    gradient: ['#2196F3', '#64B5F6'],
    description: 'Football drills for dribbling, passing, shooting, and conditioning',
    exercises: [
      {
        id: 'lunges',
        name: 'Walking Lunges',
        description: 'Single-leg strength and stability for quick direction changes and powerful shooting',
        duration: 240,
        reps: 20,
        sets: 3,
        difficulty: 'Intermediate',
        muscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves'],
        equipment: ['None'],
        instructions: [
          'Take long strides forward alternating legs',
          'Build unilateral leg strength for agility',
          'Lower body until both knees at 90 degrees',
          'Essential for powerful kicking and sprinting',
          'Maintain upright posture throughout',
        ],
      },
      {
        id: 'squat_kicks',
        name: 'Squat Kicks',
        description: 'Football-specific movement combining squats with kicking motion for game-ready legs',
        duration: 210,
        reps: 18,
        sets: 3,
        difficulty: 'Intermediate',
        muscles: ['Legs', 'Core', 'Glutes', 'Hip Flexors'],
        equipment: ['None'],
        instructions: [
          'Perform squat then explosively kick forward',
          'Directly mimics football kicking motion',
          'Alternate legs for balanced development',
          'Focus on balance and control',
          'Build kicking power and leg endurance',
        ],
      },
      {
        id: 'running',
        name: 'Running in Place',
        description: 'High-intensity cardio endurance training for 90-minute match fitness',
        duration: 300,
        reps: 1,
        sets: 3,
        difficulty: 'Beginner',
        muscles: ['Cardio', 'Legs', 'Core'],
        equipment: ['None'],
        instructions: [
          'Lift knees high and pump arms vigorously',
          'Build cardiovascular endurance for full matches',
          'Maintain steady, sustainable pace',
          'Essential for constant movement on field',
          'Focus on breathing rhythm',
        ],
      },
    ],
  },
  {
    id: 'tennis',
    name: 'Tennis',
    icon: '🎾',
    color: '#FF9800',
    gradient: ['#FF9800', '#FFB74D'],
    description: 'Tennis drills for serves, groundstrokes, and court movement',
    exercises: [
      {
        id: 'split_jump',
        name: 'Split Jumps',
        description: 'Explosive lateral movement and split-step power for quick court coverage',
        duration: 180,
        reps: 16,
        sets: 3,
        difficulty: 'Advanced',
        muscles: ['Quadriceps', 'Glutes', 'Calves', 'Core'],
        equipment: ['None'],
        instructions: [
          'Jump explosively and switch legs mid-air',
          'Mimics tennis split-step and lateral movement',
          'Land softly in opposite lunge position',
          'Build explosive court coverage ability',
          'Maintain balance and control',
        ],
      },
      {
        id: 'overhead_press',
        name: 'Overhead Press',
        description: 'Shoulder strength and power for explosive serves and overhead smashes',
        duration: 240,
        reps: 12,
        sets: 3,
        difficulty: 'Advanced',
        muscles: ['Shoulders', 'Triceps', 'Core', 'Legs'],
        equipment: ['Barbell/Dumbbells'],
        instructions: [
          'Press weight overhead with full extension',
          'Build shoulder power for serves and smashes',
          'Engage core for stability',
          'Focus on controlled, powerful movement',
          'Essential for racquet sport power',
        ],
      },
      {
        id: 'flutter_kicks',
        name: 'Flutter Kicks',
        description: 'Core stability and hip flexor endurance for quick footwork and court agility',
        duration: 180,
        reps: 30,
        sets: 3,
        difficulty: 'Intermediate',
        muscles: ['Lower Abs', 'Hip Flexors', 'Core'],
        equipment: ['None'],
        instructions: [
          'Perform rapid alternating leg raises',
          'Build core stability for quick direction changes',
          'Keep legs straight and movements small',
          'Essential for tennis footwork',
          'Maintain lower back contact with ground',
        ],
      },
    ],
  },
  {
    id: 'baseball',
    name: 'Baseball',
    icon: '⚾',
    color: '#F44336',
    gradient: ['#F44336', '#E57373'],
    description: 'Baseball training for hitting, pitching, and fielding excellence',
    exercises: [
      {
        id: 'hammer_curls',
        name: 'Hammer Curls',
        description: 'Forearm and bicep strength for powerful batting grip and throwing velocity',
        duration: 220,
        reps: 15,
        sets: 3,
        difficulty: 'Intermediate',
        muscles: ['Biceps', 'Brachialis', 'Forearms'],
        equipment: ['Dumbbells'],
        instructions: [
          'Curl dumbbells with neutral grip (palms facing)',
          'Build grip strength for bat control',
          'Essential for throwing power and bat speed',
          'Control movement throughout',
          'Focus on forearm engagement',
        ],
      },
      {
        id: 'squats',
        name: 'Bodyweight Squats',
        description: 'Lower body foundation for powerful batting stance and explosive base running',
        duration: 200,
        reps: 20,
        sets: 3,
        difficulty: 'Beginner',
        muscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
        equipment: ['None'],
        instructions: [
          'Squat to parallel with controlled form',
          'Build leg strength for batting power',
          'Drive through heels to stand',
          'Essential for explosive base running',
          'Maintain upright posture',
        ],
      },
      {
        id: 'deadbug',
        name: 'Dead Bug',
        description: 'Core stability and coordination essential for pitching mechanics and rotational power',
        duration: 180,
        reps: 20,
        sets: 3,
        difficulty: 'Beginner',
        muscles: ['Core', 'Abs', 'Hip Flexors'],
        equipment: ['None'],
        instructions: [
          'Lie on back, extend opposite arm and leg',
          'Build core stability for pitching control',
          'Move slowly with control',
          'Essential for rotational baseball movements',
          'Keep lower back pressed to ground',
        ],
      },
    ],
  },
];

export const getSportCategory = (categoryId: string): SportCategory | undefined => {
  return sportCategories.find(cat => cat.id === categoryId);
};

export const getExercise = (categoryId: string, exerciseId: string): SportExercise | undefined => {
  const category = getSportCategory(categoryId);
  return category?.exercises.find(ex => ex.id === exerciseId);
};

