import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../theme/colors';

export default function AuthNavigator() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
    }}>
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/signup" />
      <Stack.Screen name="auth/forgot" />
    </Stack>
  );
}


