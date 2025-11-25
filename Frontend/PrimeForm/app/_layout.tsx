import { Stack } from 'expo-router';
import { colors } from '../src/theme/colors';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import NotificationHandler from '../src/components/NotificationHandler';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <NotificationHandler>
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
                <Stack.Screen
                  name="gym-exercises"
                  options={{
                    presentation: 'card',
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen
                  name="exercise-workout"
                  options={{
                    presentation: 'fullScreenModal',
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="workout-player"
                  options={{
                    presentation: 'fullScreenModal',
                    animation: 'slide_from_bottom',
                  }}
                />
              </Stack>
            </NotificationHandler>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
