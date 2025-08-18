import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// Removed Animated wrappers around inputs to avoid focus issues
import AuthInput from '../../components/AuthInput';
import SimpleInput from '../../components/SimpleInput';
import AuthButton from '../../components/AuthButton';
import { colors, spacing } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import DecorativeBackground from '../../components/DecorativeBackground';
import GlassCard from '../../components/GlassCard';
import LogoMark from '../../components/LogoMark';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendReset, loading } = useAuth();
  const isAndroid = Platform.select({ android: true, default: false }) as boolean;

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
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.gold} />
            </TouchableOpacity>
            <LogoMark />
            {isAndroid ? (
              <SimpleInput 
                keyboardType="email-address" 
                autoCapitalize="none" 
                value={email} 
                onChangeText={setEmail} 
                placeholder="Email/Username" 
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
            ) : (
              <AuthInput 
                keyboardType="email-address" 
                autoCapitalize="none" 
                textContentType="emailAddress"
                autoComplete="email"
                value={email} 
                onChangeText={setEmail} 
                error={error} 
                leftIcon="mail" 
                placeholder="Email/Username" 
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
            )}
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
    paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.md,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    width: '100%',
  },
  card: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 520 : '95%',
    marginTop: spacing.md,
  },
  backButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    zIndex: 10,
    padding: spacing.xs,
  },
});


