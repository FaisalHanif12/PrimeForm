import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
// Removed Animated wrappers around inputs to avoid focus issues
import AuthInput from '../../components/AuthInput';
import AuthButton from '../../components/AuthButton';
import { colors, spacing } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import DecorativeBackground from '../../components/DecorativeBackground';
import GlassCard from '../../components/GlassCard';
import LogoMark from '../../components/LogoMark';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});

  const validate = () => {
    const next: { name?: string; email?: string; password?: string; confirm?: string } = {};
    if (!name.trim()) next.name = 'Name is required';
    if (!email.trim()) next.email = 'Email is required';
    if (!password.trim()) next.password = 'Password is required';
    if (!confirm.trim()) next.confirm = 'Please confirm password';
    if (password && confirm && password !== confirm) next.confirm = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSignup = async () => {
    if (!validate()) return;
    const ok = await signUp({ name, email, password });
    if (ok) router.replace('/auth/login');
  };

  return (
    <DecorativeBackground>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.centerWrap}>
          <GlassCard style={styles.card}>
            <LogoMark />
            <AuthInput value={name} onChangeText={setName} error={errors.name} leftIcon="person" placeholder="Name" />
            <AuthInput keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} error={errors.email} leftIcon="mail" placeholder="Email" />
            <AuthInput secureTextEntry value={password} onChangeText={setPassword} error={errors.password} leftIcon="lock-closed" placeholder="Password" />
            <AuthInput secureTextEntry value={confirm} onChangeText={setConfirm} error={errors.confirm} leftIcon="shield-checkmark" placeholder="Confirm Password" />
            <AuthButton label="Sign Up" onPress={onSignup} loading={loading} />
            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>Already have an account? </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Login</Text>
                </TouchableOpacity>
              </Link>
            </View>
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
    paddingTop: spacing.md,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    marginTop: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  bottomText: {
    color: colors.mutedText,
  },
  linkText: {
    color: colors.gold,
    fontWeight: '600',
  },
});


