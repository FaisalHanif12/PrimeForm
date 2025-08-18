import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput } from 'react-native';
import { Link, useRouter } from 'expo-router';
// Removed Animated wrappers around inputs to avoid focus issues
import AuthInput from '../../components/AuthInput';
import SimpleInput from '../../components/SimpleInput';
import AuthButton from '../../components/AuthButton';
import { colors, spacing } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import DecorativeBackground from '../../components/DecorativeBackground';
import GlassCard from '../../components/GlassCard';
import LogoMark from '../../components/LogoMark';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const isAndroid = Platform.select({ android: true, default: false }) as boolean;

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
            {isAndroid ? (
              <SimpleInput 
                value={name} 
                onChangeText={setName} 
                placeholder="Name" 
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                blurOnSubmit={false}
              />
            ) : (
            <AuthInput 
              value={name} 
              onChangeText={setName} 
              error={errors.name} 
              leftIcon="person" 
              placeholder="Name" 
              autoCapitalize="words"
              textContentType="name"
              autoComplete="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
            />
            )}
            {isAndroid ? (
              <SimpleInput 
                ref={emailRef}
                keyboardType="email-address" 
                autoCapitalize="none" 
                value={email} 
                onChangeText={setEmail} 
                placeholder="Email" 
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
            ) : (
            <AuthInput 
              ref={emailRef}
              keyboardType="email-address" 
              autoCapitalize="none" 
              textContentType="emailAddress"
              autoComplete="email"
              value={email} 
              onChangeText={setEmail} 
              error={errors.email} 
              leftIcon="mail" 
              placeholder="Email" 
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
            )}
            {isAndroid ? (
              <SimpleInput 
                ref={passwordRef}
                secureTextEntry 
                value={password} 
                onChangeText={setPassword} 
                placeholder="Password" 
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                blurOnSubmit={false}
              />
            ) : (
            <AuthInput 
              ref={passwordRef}
              secureTextEntry 
              textContentType="newPassword"
              autoComplete="password-new"
              value={password} 
              onChangeText={setPassword} 
              error={errors.password} 
              leftIcon="lock-closed" 
              placeholder="Password" 
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              blurOnSubmit={false}
            />
            )}
            {isAndroid ? (
              <SimpleInput 
                ref={confirmRef}
                secureTextEntry 
                value={confirm} 
                onChangeText={setConfirm} 
                placeholder="Confirm Password" 
                returnKeyType="done"
                onSubmitEditing={onSignup}
              />
            ) : (
            <AuthInput 
              ref={confirmRef}
              secureTextEntry 
              textContentType="newPassword"
              autoComplete="password-new"
              value={confirm} 
              onChangeText={setConfirm} 
              error={errors.confirm} 
              leftIcon="shield-checkmark" 
              placeholder="Confirm Password" 
              returnKeyType="done"
              onSubmitEditing={onSignup}
            />
            )}
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
    paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.md,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    width: '100%',
  },
  card: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 520 : '95%',
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


