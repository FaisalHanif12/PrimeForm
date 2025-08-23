import { Stack } from 'expo-router';
import { colors } from '../src/theme/colors';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';
import { LanguageProvider } from '../src/context/LanguageContext';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <Stack screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="auth/signup" />
            <Stack.Screen name="auth/forgot" />
            <Stack.Screen name="auth/otp-verification" />
            <Stack.Screen name="auth/reset-password" />
            <Stack.Screen name="(dashboard)" />
          </Stack>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
