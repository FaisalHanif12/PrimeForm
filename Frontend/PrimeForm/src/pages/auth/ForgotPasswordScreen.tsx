import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
// Removed Animated wrappers around inputs to avoid focus issues
import AuthInput from '../../components/AuthInput';
import AuthButton from '../../components/AuthButton';
import { colors, spacing } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import DecorativeBackground from '../../components/DecorativeBackground';
import GlassCard from '../../components/GlassCard';
import LogoMark from '../../components/LogoMark';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendReset, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();

  const onSubmit = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setError(undefined);
    const ok = await sendReset(email);
    if (ok) router.replace('/auth/login');
  };

  return (
    <DecorativeBackground>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.centerWrap}>
          <GlassCard style={styles.card}>
            <LogoMark />
            <AuthInput keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} error={error} leftIcon="mail" placeholder="Email/Username" />
            <AuthButton label="Send Reset Link" onPress={onSubmit} loading={loading} />
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    marginTop: spacing.md,
  },
});


