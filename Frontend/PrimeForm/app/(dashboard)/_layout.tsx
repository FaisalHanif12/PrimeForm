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
    </Stack>
  );
}
