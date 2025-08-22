import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function DashboardLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
    }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
