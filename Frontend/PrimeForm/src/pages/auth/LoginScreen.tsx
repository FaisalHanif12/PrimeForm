import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SimpleInput from '../../components/SimpleInput';
// Removed Animated wrappers around inputs to avoid focus issues
import AuthInput from '../../components/AuthInput';
import AuthButton from '../../components/AuthButton';
import { colors, spacing } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import DecorativeBackground from '../../components/DecorativeBackground';
import GlassCard from '../../components/GlassCard';
import LogoMark from '../../components/LogoMark';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, loading } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const isAndroid = Platform.select({ android: true, default: false }) as boolean;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const nextErrors: { email?: string; password?: string } = {};
    if (!email.trim()) nextErrors.email = 'Email is required';
    if (!password.trim()) nextErrors.password = 'Password is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onLogin = async () => {
    if (!validate()) return;
    const ok = await signIn(email, password);
    if (ok) {
      // Placeholder: On success you would route to the app's main area
      // router.replace('/(tabs)/home');
    }
  };

  return (
    <DecorativeBackground>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.centerWrap}>
          <GlassCard style={styles.card}>
            <LogoMark />
            {isAndroid ? (
              <SimpleInput
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
                autoComplete="off"
                value={email}
                onChangeText={setEmail}
                placeholder="Email/Username"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
            ) : (
              <AuthInput
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                leftIcon="mail"
                placeholder="Email/Username"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
            )}
            {isAndroid ? (
              <SimpleInput
                ref={passwordRef}
                secureTextEntry
                textContentType="password"
                autoComplete="off"
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                returnKeyType="done"
                onSubmitEditing={onLogin}
              />
            ) : (
              <AuthInput
                ref={passwordRef}
                secureTextEntry
                textContentType="password"
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                leftIcon="lock-closed"
                placeholder="Password"
                returnKeyType="done"
                onSubmitEditing={onLogin}
              />
            )}

            <AuthButton label="Log In" onPress={onLogin} loading={loading} />

            <View style={styles.divider} />
            <View style={styles.inlineLinks}>
              <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                <Text style={styles.linkTextCenterStrong}>Sign Up</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/auth/forgot')}>
                <Text style={styles.linkText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Social login removed as requested; single link row below */}
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
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: spacing.md,
  },
  linkText: {
    color: colors.gold,
    fontWeight: '600',
  },
  linkTextCenter: {
    color: colors.white,
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: 0,
  },
  linkTextCenterStrong: {
    color: colors.white,
    fontWeight: '800',
    textAlign: 'left',
  },
  linkBottom: {
    alignSelf: 'center',
    marginTop: spacing.lg,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  inlineLinks: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomText: {
    color: colors.mutedText,
  },
  // social buttons removed
});


