import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SimpleInput from '../../components/SimpleInput';
import AuthInput from '../../components/AuthInput';
import AuthButton from '../../components/AuthButton';

import { colors, spacing } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import DecorativeBackground from '../../components/DecorativeBackground';
import GlassCard from '../../components/GlassCard';
import LogoMark from '../../components/LogoMark';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, loading } = useAuth();
  const { login: setAuthUser } = useAuthContext();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const passwordRef = useRef<TextInput>(null);
  const isAndroid = Platform.select({ android: true, default: false }) as boolean;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});


  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return t('validation.email.required');
    if (!emailRegex.test(email)) return t('validation.email.invalid');
    return undefined;
  };

  const validatePassword = (password: string) => {
    if (!password.trim()) return t('validation.password.required');
    if (password.length < 6) return t('validation.password.minLength');
    return undefined;
  };

  const validate = () => {
    const nextErrors: { email?: string; password?: string } = {};
    nextErrors.email = validateEmail(email);
    nextErrors.password = validatePassword(password);
    
    // Remove undefined errors
    Object.keys(nextErrors).forEach(key => {
      if (!nextErrors[key as keyof typeof nextErrors]) {
        delete nextErrors[key as keyof typeof nextErrors];
      }
    });
    
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };



  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched.email) {
      const error = validateEmail(value);
      setErrors(prev => ({ ...prev, email: error }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      const error = validatePassword(value);
      setErrors(prev => ({ ...prev, password: error }));
    }
  };

  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    const error = validateEmail(email);
    setErrors(prev => ({ ...prev, email: error }));
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    const error = validatePassword(password);
    setErrors(prev => ({ ...prev, password: error }));
  };



  const onLogin = async () => {
    // Force show all validation errors immediately
    setTouched({ email: true, password: true });
    
    if (!validate()) {
      return;
    }
    
    try {
      const response = await signIn(email, password);
      if (response?.success) {
        // Set user in auth context
        if (response.data?.user) {
          setAuthUser(response.data.user);
        }
        
        // Mark that user has ever signed up (for future app launches)
        await AsyncStorage.setItem('primeform_has_ever_signed_up', 'true');
        
        // Mark that user has completed signup (for current session access)
        await AsyncStorage.setItem('primeform_signup_completed', 'true');
        
        showToast('success', t('toast.login.success'));
        
        // Auto-navigate to dashboard after toast
        setTimeout(() => {
          router.replace('/(dashboard)');
        }, 1500);
      } else {
        // Handle specific error cases
        if (response?.showSignupButton || 
            response?.message?.includes('Account not found') ||
            response?.message?.includes('not found')) {
          showToast('error', t('toast.login.error'));
        } else {
          showToast('error', t('toast.login.error'));
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('error', t('toast.connection.error'));
    }
  };

  return (
    <DecorativeBackground>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.centerWrap}>
          <GlassCard style={styles.card}>
            <LogoMark />
            <View>
              {isAndroid ? (
                <SimpleInput
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                  autoComplete="off"
                  value={email}
                  onChangeText={handleEmailChange}
                  onBlur={handleEmailBlur}
                  error={errors.email}
                  placeholder={t('auth.login.email')}
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
                  onChangeText={handleEmailChange}
                  onBlur={handleEmailBlur}
                  error={errors.email}
                  leftIcon="mail"
                  placeholder={t('auth.login.email')}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />
              )}
            </View>
            <View>
              {isAndroid ? (
                <SimpleInput
                  ref={passwordRef}
                  secureTextEntry
                  textContentType="password"
                  autoComplete="off"
                  value={password}
                  onChangeText={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  error={errors.password}
                  placeholder={t('auth.login.password')}
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
                  onChangeText={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  error={errors.password}
                  leftIcon="lock-closed"
                  placeholder={t('auth.login.password')}
                  returnKeyType="done"
                  onSubmitEditing={onLogin}
                />
              )}
            </View>

            <View>
              <AuthButton label={t('auth.login.button')} onPress={onLogin} loading={loading} />
            </View>

            <View>
              <View style={styles.divider} />
              <View style={styles.inlineLinks}>
                <TouchableOpacity 
                  onPress={() => router.push('/auth/signup')}
                  style={styles.linkButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkTextCenterStrong}>{t('auth.login.signup')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => router.push('/auth/forgot')}
                  style={styles.linkButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkText}>{t('auth.login.forgot')}</Text>
                </TouchableOpacity>
              </View>
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
    paddingHorizontal: Platform.select({ 
      ios: spacing.lg, 
      android: spacing.md,
      default: spacing.lg 
    }),
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
    maxWidth: Platform.OS === 'web' ? 420 : Platform.OS === 'ios' ? '92%' : '95%',
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: spacing.lg,
    opacity: 0.6,
  },
  linkText: {
    color: colors.gold,
    fontWeight: '600',
    fontSize: 15,
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
    fontSize: 15,
  },
  linkButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
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
    alignItems: 'center',
  },
  bottomText: {
    color: colors.mutedText,
  },
});


