import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function DashboardLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
      animation: 'fade',
      animationDuration: 200,
      fullScreenGestureEnabled: false,
    }}>
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Dashboard',
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="workout" 
        options={{
          title: 'Workout',
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="diet" 
        options={{
          title: 'Diet',
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="gym" 
        options={{
          title: 'Gym',
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="progress"
        options={{
          title: 'Progress',
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="progress-details"
        options={{
          title: 'Progress Details',
          animation: 'fade',
        }}
      />
            <Stack.Screen
              name="streak"
              options={{
                title: 'Streak Tracker',
                animation: 'fade',
              }}
            />
            <Stack.Screen
              name="ai-trainer"
              options={{
                title: 'AI Trainer',
                animation: 'fade',
              }}
            />
      <Stack.Screen 
        name="settings" 
        options={{
          title: 'Settings',
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="subscription" 
        options={{
          title: 'Subscription',
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="contact" 
        options={{
          title: 'Contact Us',
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="language" 
        options={{
          title: 'Language',
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="sport-mode" 
        options={{
          title: 'Sport Mode',
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="exercise-detail" 
        options={{
          title: 'Exercise Detail',
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="create-personalized-workout" 
        options={{
          title: 'Create Personalized Workout',
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="personalized-workout" 
        options={{
          title: 'Personalized Workout',
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
