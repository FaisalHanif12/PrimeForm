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
        id: 'cricket-1',
        name: 'Shadow Batting',
        description: 'Practice batting technique without a ball to improve form and muscle memory',
        duration: 180,
        reps: 20,
        sets: 3,
        difficulty: 'Beginner',
        muscles: ['Shoulders', 'Core', 'Forearms', 'Legs'],
        equipment: ['Cricket Bat (optional)'],
        instructions: [
          'Stand in your batting stance',
          'Visualize the ball coming towards you',
          'Execute your batting strokes in slow motion',
          'Focus on proper technique and follow-through',
          'Repeat with different shot types (drive, pull, cut)',
        ],
      },
      {
        id: 'cricket-2',
        name: 'Fast Bowling Action',
        description: 'Build bowling speed and accuracy through proper technique',
        duration: 240,
        reps: 15,
        sets: 4,
        difficulty: 'Intermediate',
        muscles: ['Shoulders', 'Core', 'Back', 'Legs'],
        equipment: ['Cricket Ball', 'Stumps'],
        instructions: [
          'Start with a smooth run-up',
          'Load through your back foot',
          'Drive through with your front leg',
          'Rotate shoulders powerfully',
          'Follow through completely',
        ],
      },
      {
        id: 'cricket-3',
        name: 'Slip Catching Drills',
        description: 'Enhance reaction time and catching technique for slip fielding',
        duration: 150,
        reps: 25,
        sets: 3,
        difficulty: 'Intermediate',
        muscles: ['Hands', 'Forearms', 'Core', 'Legs'],
        equipment: ['Cricket Ball', 'Partner'],
        instructions: [
          'Assume slip fielding position',
          'Stay low with knees bent',
          'Keep hands ready at waist height',
          'React quickly to catches',
          'Watch the ball into your hands',
        ],
      },
      {
        id: 'cricket-4',
        name: 'Yorker Defense Training',
        description: 'Practice defending yorker deliveries to improve footwork',
        duration: 200,
        reps: 30,
        sets: 3,
        difficulty: 'Advanced',
        muscles: ['Legs', 'Core', 'Forearms', 'Wrists'],
        equipment: ['Cricket Bat', 'Cricket Ball', 'Bowling Machine'],
        instructions: [
          'Set up in batting stance',
          'Watch for yorker length delivery',
          'Move feet quickly to the pitch',
          'Get bat down in time',
          'Dig out the yorker with proper technique',
        ],
      },
      {
        id: 'cricket-5',
        name: 'Spin Bowling Practice',
        description: 'Develop finger and wrist strength for spin bowling variations',
        duration: 180,
        reps: 20,
        sets: 4,
        difficulty: 'Advanced',
        muscles: ['Wrists', 'Fingers', 'Forearms', 'Shoulders'],
        equipment: ['Cricket Ball', 'Practice Net'],
        instructions: [
          'Grip the ball correctly for your spin type',
          'Focus on wrist/finger position',
          'Use smooth bowling action',
          'Snap wrist/fingers at release',
          'Aim for consistent line and length',
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
        id: 'football-1',
        name: 'Cone Dribbling',
        description: 'Improve ball control and agility through cone weaving',
        duration: 120,
        reps: 10,
        sets: 3,
        difficulty: 'Beginner',
        muscles: ['Legs', 'Core', 'Ankles'],
        equipment: ['Football', '5-8 Cones'],
        instructions: [
          'Set up cones in a straight line 1m apart',
          'Dribble through cones using both feet',
          'Keep ball close to your feet',
          'Look up while dribbling',
          'Accelerate after the last cone',
        ],
      },
      {
        id: 'football-2',
        name: 'Wall Passing',
        description: 'Enhance passing accuracy and first touch control',
        duration: 180,
        reps: 30,
        sets: 3,
        difficulty: 'Beginner',
        muscles: ['Legs', 'Core', 'Ankles'],
        equipment: ['Football', 'Wall'],
        instructions: [
          'Stand 3-5m from a wall',
          'Pass ball against wall with inside of foot',
          'Control the return with first touch',
          'Alternate between left and right foot',
          'Increase pace gradually',
        ],
      },
      {
        id: 'football-3',
        name: 'Power Shooting',
        description: 'Develop shooting power and accuracy from distance',
        duration: 240,
        reps: 15,
        sets: 4,
        difficulty: 'Intermediate',
        muscles: ['Legs', 'Core', 'Hip Flexors'],
        equipment: ['Football', 'Goal', 'Markers'],
        instructions: [
          'Place ball 20-25m from goal',
          'Approach at angle for power',
          'Plant foot beside the ball',
          'Strike through center with laces',
          'Follow through toward target',
        ],
      },
      {
        id: 'football-4',
        name: 'Sprint & Shoot',
        description: 'Combine speed training with finishing under fatigue',
        duration: 300,
        reps: 12,
        sets: 3,
        difficulty: 'Advanced',
        muscles: ['Legs', 'Core', 'Cardio'],
        equipment: ['Football', 'Goal', 'Cones'],
        instructions: [
          'Sprint 30m to the ball',
          'Take one touch to control',
          'Shoot immediately with second touch',
          'Vary shooting angles and techniques',
          'Walk back for recovery between reps',
        ],
      },
      {
        id: 'football-5',
        name: 'Rondo Training',
        description: 'Small-sided possession game to improve passing and movement',
        duration: 360,
        reps: 1,
        sets: 3,
        difficulty: 'Advanced',
        muscles: ['Legs', 'Core', 'Cardio', 'Mind'],
        equipment: ['Football', 'Cones', '4-6 Players'],
        instructions: [
          'Form a circle with passers on outside',
          '1-2 defenders in the middle',
          'Complete 10 passes without interception',
          'Limit to 1-2 touches per player',
          'Rotate defenders after each set',
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
        id: 'tennis-1',
        name: 'Forehand Shadow Swings',
        description: 'Practice forehand technique without the ball',
        duration: 120,
        reps: 30,
        sets: 3,
        difficulty: 'Beginner',
        muscles: ['Shoulders', 'Core', 'Forearms', 'Legs'],
        equipment: ['Tennis Racket'],
        instructions: [
          'Stand in ready position',
          'Turn shoulders and prepare racket',
          'Step forward with opposite foot',
          'Swing through contact zone',
          'Follow through over opposite shoulder',
        ],
      },
      {
        id: 'tennis-2',
        name: 'Serve Practice',
        description: 'Improve serve consistency and power',
        duration: 240,
        reps: 20,
        sets: 4,
        difficulty: 'Intermediate',
        muscles: ['Shoulders', 'Core', 'Back', 'Legs'],
        equipment: ['Tennis Racket', 'Tennis Balls', 'Court'],
        instructions: [
          'Start with feet shoulder-width apart',
          'Toss ball high and slightly in front',
          'Bend knees and arch back',
          'Explode upward and hit at highest point',
          'Follow through across body',
        ],
      },
      {
        id: 'tennis-3',
        name: 'Backhand Slice',
        description: 'Master the backhand slice for defensive and approach shots',
        duration: 180,
        reps: 25,
        sets: 3,
        difficulty: 'Intermediate',
        muscles: ['Shoulders', 'Forearms', 'Core', 'Legs'],
        equipment: ['Tennis Racket', 'Tennis Balls'],
        instructions: [
          'Prepare racket high with continental grip',
          'Turn sideways to the ball',
          'Slice down and through the ball',
          'Keep wrist firm throughout',
          'Finish with racket pointing at target',
        ],
      },
      {
        id: 'tennis-4',
        name: 'Volley Training',
        description: 'Develop net play skills and quick reflexes',
        duration: 200,
        reps: 40,
        sets: 4,
        difficulty: 'Advanced',
        muscles: ['Forearms', 'Shoulders', 'Core', 'Legs'],
        equipment: ['Tennis Racket', 'Tennis Balls', 'Partner/Ball Machine'],
        instructions: [
          'Position yourself at net',
          'Stay on your toes with knees bent',
          'Keep racket head up',
          'Use short punching motion',
          'React quickly to direction changes',
        ],
      },
      {
        id: 'tennis-5',
        name: 'Court Sprint Intervals',
        description: 'Enhance court coverage and stamina with sprint training',
        duration: 300,
        reps: 8,
        sets: 3,
        difficulty: 'Advanced',
        muscles: ['Legs', 'Cardio', 'Core'],
        equipment: ['Tennis Court', 'Cones'],
        instructions: [
          'Start at baseline center',
          'Sprint to right sideline and touch',
          'Sprint to left sideline and touch',
          'Sprint to net and touch',
          'Backpedal to baseline, rest 30 seconds',
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
        id: 'baseball-1',
        name: 'Batting Tee Work',
        description: 'Perfect your swing mechanics with tee drills',
        duration: 180,
        reps: 25,
        sets: 3,
        difficulty: 'Beginner',
        muscles: ['Core', 'Shoulders', 'Forearms', 'Legs'],
        equipment: ['Baseball Bat', 'Batting Tee', 'Baseballs'],
        instructions: [
          'Set tee at waist height',
          'Assume proper batting stance',
          'Load hands and rotate hips',
          'Drive through ball with level swing',
          'Follow through completely',
        ],
      },
      {
        id: 'baseball-2',
        name: 'Pitching Mechanics',
        description: 'Develop proper pitching form and arm strength',
        duration: 240,
        reps: 20,
        sets: 4,
        difficulty: 'Intermediate',
        muscles: ['Shoulders', 'Core', 'Legs', 'Back'],
        equipment: ['Baseball', 'Mound', 'Catcher'],
        instructions: [
          'Start in wind-up position',
          'Lift leg to balance point',
          'Drive toward plate with back leg',
          'Release ball at high point',
          'Follow through with full body rotation',
        ],
      },
      {
        id: 'baseball-3',
        name: 'Ground Ball Fielding',
        description: 'Master infield ground ball technique',
        duration: 150,
        reps: 30,
        sets: 3,
        difficulty: 'Beginner',
        muscles: ['Legs', 'Core', 'Hands', 'Back'],
        equipment: ['Baseball', 'Glove', 'Partner'],
        instructions: [
          'Get in athletic ready position',
          'Move feet to get in front of ball',
          'Lower glove to ground',
          'Field ball out in front',
          'Bring ball to throwing position',
        ],
      },
      {
        id: 'baseball-4',
        name: 'Fly Ball Tracking',
        description: 'Improve outfield fly ball reads and catches',
        duration: 200,
        reps: 20,
        sets: 3,
        difficulty: 'Intermediate',
        muscles: ['Legs', 'Core', 'Vision', 'Cardio'],
        equipment: ['Baseball', 'Glove', 'Partner/Fungo Bat'],
        instructions: [
          'Read the ball off the bat',
          'Get a good first step',
          'Track ball while running',
          'Position yourself under the ball',
          'Catch with two hands when possible',
        ],
      },
      {
        id: 'baseball-5',
        name: 'Double Play Turns',
        description: 'Execute quick and accurate double play pivots',
        duration: 180,
        reps: 25,
        sets: 4,
        difficulty: 'Advanced',
        muscles: ['Legs', 'Core', 'Arms', 'Agility'],
        equipment: ['Baseball', 'Glove', 'Base', '2+ Partners'],
        instructions: [
          'Receive throw while approaching base',
          'Touch base with either foot',
          'Clear the bag quickly',
          'Set feet and throw to first',
          'Practice different pivot techniques',
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

