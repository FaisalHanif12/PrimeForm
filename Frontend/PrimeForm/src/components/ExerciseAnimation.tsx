import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors } from '../theme/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ExerciseAnimationProps {
  exerciseType: string;
  isVisible: boolean;
  onAnimationComplete?: () => void;
  style?: any;
}

// Animation mapping for all 38 exercises
const exerciseAnimations: Record<string, any> = {
  // Chest exercises
  military_pushups: require('../../assets/Drafts/Military Push Ups.json'),
  staggered_pushups: require('../../assets/Drafts/Staggered_push_ups.json'),
  wide_arm_pushup: require('../../assets/Drafts/Wide_arm_push_up.json'),
  decline_pushups: require('../../assets/Drafts/Inchworm.json'),
  incline_pushups: require('../../assets/Drafts/Step Up On Chair.json'),
  diamond_pushups: require('../../assets/Drafts/Military Push Ups.json'),
  
  // Back exercises
  pullups: require('../../assets/Drafts/Pull ups.json'),
  deadlifts: require('../../assets/Drafts/Deadlifts exercise.json'),
  superman: require('../../assets/Drafts/Cobras.json'),
  rows: require('../../assets/Drafts/Men doing rope exercise.json'),
  
  // Arms exercises
  bicep_curls: require('../../assets/Drafts/Barbell curl.json'),
  tricep_dips: require('../../assets/Drafts/Triceps Push down.json'),
  hammer_curls: require('../../assets/Drafts/Barbell curl.json'),
  overhead_press: require('../../assets/Drafts/Double Arm Clean and Press Barbell.json'),
  shoulder_press: require('../../assets/Drafts/Shoulder Stretch.json'),
  
  // Legs exercises
  squats: require('../../assets/Drafts/Character squat animation.json'),
  lunges: require('../../assets/Drafts/Lunge.json'),
  jump_squats: require('../../assets/Drafts/Jumping_squats.json'),
  squat_kicks: require('../../assets/Drafts/Squat kicks.json'),
  squat_reach: require('../../assets/Drafts/Squat Reach.json'),
  split_jump: require('../../assets/Drafts/Split Jump Exercise.json'),
  leg_press: require('../../assets/Drafts/Women Leg Press workout Routine at Home.json'),
  single_leg_rotation: require('../../assets/Drafts/Single Leg Hip Rotation.json'),
  
  // Abs exercises
  planks: require('../../assets/Drafts/Plank.json'),
  t_plank: require('../../assets/Drafts/T Plank Exercise.json'),
  crunches: require('../../assets/Drafts/Elbow To Knee Crunch (Right).json'),
  sit_ups: require('../../assets/Drafts/Man Doing Sit Up Exercise for ABS.json'),
  flutter_kicks: require('../../assets/Drafts/Flutter Kicks.json'),
  reverse_crunches: require('../../assets/Drafts/Reverse Crunches.json'),
  deadbug: require('../../assets/Drafts/Deadbug fitness exercise.json'),
  seated_abs_circles: require('../../assets/Drafts/Seated abs circles.json'),
  frog_press: require('../../assets/Drafts/Frog Press.json'),
  
  // Full body exercises
  burpees: require('../../assets/Drafts/Burpee and Jump Exercise.json'),
  jumping_jacks: require('../../assets/Drafts/Jumping Jack.json'),
  butterfly: require('../../assets/Drafts/Butterfly Exercise.json'),
  running: require('../../assets/Drafts/Running Boy.json'),
  punches: require('../../assets/Drafts/Punches.json'),
  squat_kick: require('../../assets/Drafts/Squat Kick.json'),
};

const ExerciseAnimation: React.FC<ExerciseAnimationProps> = ({
  exerciseType,
  isVisible,
  onAnimationComplete,
  style,
}) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (isVisible && animationRef.current) {
      animationRef.current.play();
    }
  }, [isVisible, exerciseType]);

  if (!isVisible) return null;

  const animation = exerciseAnimations[exerciseType];

  if (!animation) {
    // Fallback to first available animation if specific one not found
    const fallbackAnimation = exerciseAnimations['military_pushups'];
    return (
      <View style={[styles.container, style]}>
        <LottieView
          ref={animationRef}
          source={fallbackAnimation}
          autoPlay
          loop
          style={styles.animation}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <LottieView
        ref={animationRef}
        source={animation}
        autoPlay
        loop
        style={styles.animation}
        onAnimationFinish={onAnimationComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});

export default ExerciseAnimation;
