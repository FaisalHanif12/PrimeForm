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
        id: 'burpees',
        name: 'Burpees',
        description: 'Ultimate full-body conditioning for cricket match endurance and explosiveness',
        duration: 270,
        reps: 20,
        sets: 3,
        difficulty: 'Advanced',
        muscles: ['Full Body', 'Cardio', 'Core', 'Endurance'],
        equipment: ['None'],
        instructions: [
          'Start in standing position',
          'Drop into squat position and place hands on ground',
          'Jump feet back into plank position',
          'Perform a push-up',
          'Jump feet forward and explode upward with a jump',
        ],
      },
      {
        id: 'lunges',
        name: 'Walking Lunges',
        description: 'Build powerful leg strength for running between wickets and explosive fielding',
        duration: 240,
        reps: 20,
        sets: 3,
        difficulty: 'Intermediate',
        muscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves'],
        equipment: ['None'],
        instructions: [
          'Take a long stride forward with one leg',
          'Lower your body until both knees are at 90 degrees',
          'Push through front heel to stand',
          'Step forward with opposite leg',
          'Maintain upright posture throughout',
        ],
      },
      {
        id: 'planks',
        name: 'Plank Hold',
        description: 'Develop rock-solid core stability essential for powerful bowling and batting',
        duration: 180,
        reps: 3,
        sets: 3,
        difficulty: 'Beginner',
        muscles: ['Core', 'Abs', 'Shoulders', 'Glutes'],
        equipment: ['None'],
        instructions: [
          'Start in forearm plank position',
          'Keep body in straight line from head to heels',
          'Engage core muscles',
          'Hold position for 45-60 seconds',
          'Breathe steadily throughout',
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
        id: 'jump_squats',
        name: 'Jump Squats',
        description: 'Build explosive leg power for jumping headers, sprinting, and powerful shots',
        duration: 180,
        reps: 15,
        sets: 3,
        difficulty: 'Advanced',
        muscles: ['Quadriceps', 'Glutes', 'Calves', 'Core'],
        equipment: ['None'],
        instructions: [
          'Stand with feet shoulder-width apart',
          'Squat down to parallel position',
          'Explode upward with maximum force',
          'Land softly on the balls of your feet',
          'Immediately go into next repetition',
        ],
      },
      {
        id: 'burpees',
        name: 'Burpees',
        description: 'Total body conditioning for 90-minute match endurance and explosive power',
        duration: 270,
        reps: 20,
        sets: 3,
        difficulty: 'Advanced',
        muscles: ['Full Body', 'Cardio', 'Core', 'Endurance'],
        equipment: ['None'],
        instructions: [
          'Start in standing position',
          'Drop into squat and place hands on ground',
          'Jump feet back into plank position',
          'Perform a push-up',
          'Jump feet forward and explode upward with a jump',
        ],
      },
      {
        id: 'running',
        name: 'Running in Place',
        description: 'High-intensity cardio training for match-long stamina and quick recovery',
        duration: 300,
        reps: 1,
        sets: 3,
        difficulty: 'Beginner',
        muscles: ['Cardio', 'Legs', 'Core'],
        equipment: ['None'],
        instructions: [
          'Lift knees high and pump arms vigorously',
          'Maintain steady pace for full duration',
          'Focus on controlled breathing',
          'Build cardiovascular endurance',
          'Simulate match running intensity',
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
        description: 'Master explosive lateral movement and split-step power for rapid court coverage',
        duration: 192,
        reps: 16,
        sets: 3,
        difficulty: 'Advanced',
        muscles: ['Quadriceps', 'Glutes', 'Calves', 'Core'],
        equipment: ['None'],
        instructions: [
          'Start in lunge position',
          'Jump explosively and switch legs in mid-air',
          'Land softly in opposite lunge',
          'Maintain balance and control',
          'Mimics tennis split-step movement',
        ],
      },
      {
        id: 'burpees',
        name: 'Burpees',
        description: 'Build match-level endurance and explosive power for long rallies',
        duration: 270,
        reps: 20,
        sets: 3,
        difficulty: 'Advanced',
        muscles: ['Full Body', 'Cardio', 'Core', 'Endurance'],
        equipment: ['None'],
        instructions: [
          'Start in standing position',
          'Drop into squat and place hands on ground',
          'Jump feet back into plank position',
          'Perform a push-up',
          'Jump feet forward and explode upward with a jump',
        ],
      },
      {
        id: 'planks',
        name: 'Plank Hold',
        description: 'Develop core stability essential for powerful serves and consistent groundstrokes',
        duration: 180,
        reps: 3,
        sets: 3,
        difficulty: 'Beginner',
        muscles: ['Core', 'Abs', 'Shoulders', 'Glutes'],
        equipment: ['None'],
        instructions: [
          'Start in forearm plank position',
          'Keep body in straight line from head to heels',
          'Engage core muscles throughout',
          'Hold position for 45-60 seconds',
          'Breathe steadily and maintain form',
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
        id: 'deadlifts',
        name: 'Deadlifts',
        description: 'Build explosive posterior chain power for batting velocity and pitching speed',
        duration: 360,
        reps: 12,
        sets: 4,
        difficulty: 'Advanced',
        muscles: ['Lower Back', 'Hamstrings', 'Glutes', 'Traps'],
        equipment: ['Barbell'],
        instructions: [
          'Stand with feet hip-width apart, bar over mid-foot',
          'Grip bar just outside legs',
          'Keep back straight, hinge at hips',
          'Drive through heels to lift bar',
          'Essential for batting and pitching power',
        ],
      },
      {
        id: 'military_pushups',
        name: 'Military Push-ups',
        description: 'Develop upper body strength critical for throwing power and bat control',
        duration: 216,
        reps: 20,
        sets: 3,
        difficulty: 'Intermediate',
        muscles: ['Chest', 'Triceps', 'Shoulders', 'Core'],
        equipment: ['None'],
        instructions: [
          'Start in plank position with hands shoulder-width',
          'Keep body perfectly straight',
          'Lower chest to ground with elbows at 45 degrees',
          'Push back up explosively',
          'Maintain strict form throughout',
        ],
      },
      {
        id: 'jump_squats',
        name: 'Jump Squats',
        description: 'Explosive leg power for base running speed and batting stance stability',
        duration: 180,
        reps: 15,
        sets: 3,
        difficulty: 'Advanced',
        muscles: ['Quadriceps', 'Glutes', 'Calves', 'Core'],
        equipment: ['None'],
        instructions: [
          'Stand with feet shoulder-width apart',
          'Squat down to parallel',
          'Explode upward with maximum force',
          'Land softly and immediately repeat',
          'Focus on powerful leg drive',
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

