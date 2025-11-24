import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function DashboardLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
      animation: 'slide_from_right',
    }}>
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Dashboard',
        }}
      />
      <Stack.Screen 
        name="workout" 
        options={{
          title: 'Workout',
        }}
      />
      <Stack.Screen 
        name="diet" 
        options={{
          title: 'Diet',
        }}
      />
      <Stack.Screen 
        name="gym" 
        options={{
          title: 'Gym',
        }}
      />
            <Stack.Screen
              name="progress"
              options={{
                title: 'Progress',
              }}
            />
            <Stack.Screen
              name="streak"
              options={{
                title: 'Streak Tracker',
              }}
            />
            <Stack.Screen
              name="ai-trainer"
              options={{
                title: 'AI Trainer',
              }}
            />
      <Stack.Screen 
        name="settings" 
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen 
        name="subscription" 
        options={{
          title: 'Subscription',
        }}
      />
      <Stack.Screen 
        name="contact" 
        options={{
          title: 'Contact Us',
        }}
      />
      <Stack.Screen 
        name="language" 
        options={{
          title: 'Language',
        }}
      />
    </Stack>
  );
}
