import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthInput from '../../components/AuthInput';
import SimpleInput from '../../components/SimpleInput';
import AuthButton from '../../components/AuthButton';

import { colors, spacing } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthContext } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import DecorativeBackground from '../../components/DecorativeBackground';
import GlassCard from '../../components/GlassCard';
import LogoMark from '../../components/LogoMark';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email, otp } = useLocalSearchParams();
  const { resetPassword, loading } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const { login: setAuthUser } = useAuthContext();
  const confirmRef = useRef<TextInput>(null);
  const isAndroid = Platform.select({ android: true, default: false }) as boolean;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [touched, setTouched] = useState<{ password?: boolean; confirmPassword?: boolean }>({});


  const validatePassword = (password: string) => {
    const issues = [];
    if (!password.trim()) return t('validation.password.required');
    if (password.length < 6) issues.push(t('validation.password.minLength'));
    if (!/(?=.*[a-z])/.test(password)) issues.push(t('validation.password.lowercase'));
    if (!/(?=.*[A-Z])/.test(password)) issues.push(t('validation.password.uppercase'));
    if (!/(?=.*\d)/.test(password)) issues.push(t('validation.password.number'));
    return issues.length > 0 ? issues[0] : undefined;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword.trim()) return t('validation.confirm.required');
    if (password && confirmPassword && password !== confirmPassword) return t('validation.confirm.mismatch');
    return undefined;
  };

  const validate = () => {
    const next: { password?: string; confirmPassword?: string } = {};
    next.password = validatePassword(password);
    next.confirmPassword = validateConfirmPassword(confirmPassword, password);
    
    // Remove undefined errors
    Object.keys(next).forEach(key => {
      if (!next[key as keyof typeof next]) {
        delete next[key as keyof typeof next];
      }
    });
    
    setErrors(next);
    return Object.keys(next).length === 0;
  };





  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      const error = validatePassword(value);
      setErrors(prev => ({ ...prev, password: error }));
    }
    if (touched.confirmPassword) {
      const confirmError = validateConfirmPassword(confirmPassword, value);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (touched.confirmPassword) {
      const error = validateConfirmPassword(value, password);
      setErrors(prev => ({ ...prev, confirmPassword: error }));
    }
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    const error = validatePassword(password);
    setErrors(prev => ({ ...prev, password: error }));
  };

  const handleConfirmPasswordBlur = () => {
    setTouched(prev => ({ ...prev, confirmPassword: true }));
    const error = validateConfirmPassword(confirmPassword, password);
    setErrors(prev => ({ ...prev, confirmPassword: error }));
  };

  const handleResetPassword = async () => {
    setTouched({ password: true, confirmPassword: true });
    
    if (!validate()) {
      showToast('error', 'Please complete all password requirements');
      return;
    }
    
    try {
      const response = await resetPassword(email as string, otp as string, password);
      console.log('Reset password response:', response);
      
      if (response?.success) {
        // Password reset successful - redirect to login page
        // User should login with their new password (no auto-login)
        
        // Clear only the auth token and signup completion flag
        // Keep has_ever_signed_up and language selection to prevent re-showing those modals
        await AsyncStorage.multiRemove([
          'authToken',
          'primeform_signup_completed'
        ]);
        
        showToast('success', t('toast.password.success'));
        
        // Navigate to login page after successful reset
        setTimeout(() => {
          router.replace('/auth/login');
        }, 1500);
      } else {
        showToast('error', response?.message || t('toast.password.error'));
      }
    } catch (error) {
      console.error('Reset password error:', error);
      showToast('error', t('toast.connection.error'));
    }
  };

  return (
    <DecorativeBackground>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          indicatorStyle="white"
        >
          <View style={styles.centerWrap}>
            <GlassCard style={styles.card}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color={colors.gold} />
              </TouchableOpacity>
            </View>
            <Animated.View entering={FadeInUp}>
            
            <LogoMark subtitle={t('auth.reset.description')}/>
            
            <Text style={styles.description}>
              {t('auth.reset.description')}
            </Text>

            <Animated.View entering={FadeInDown}>
              {isAndroid ? (
                <SimpleInput 
                  secureTextEntry 
                  value={password} 
                  onChangeText={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  error={errors.password}
                  placeholder={t('auth.reset.new')} 
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  blurOnSubmit={false}
                />
              ) : (
                <AuthInput 
                  secureTextEntry 
                  textContentType="newPassword"
                  autoComplete="password-new"
                  value={password} 
                  onChangeText={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  error={errors.password} 
                  leftIcon="lock-closed" 
                  placeholder={t('auth.reset.new')} 
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  blurOnSubmit={false}
                />
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown}>
              {isAndroid ? (
                <SimpleInput 
                  ref={confirmRef}
                  secureTextEntry 
                  value={confirmPassword} 
                  onChangeText={handleConfirmPasswordChange}
                  onBlur={handleConfirmPasswordBlur}
                  error={errors.confirmPassword}
                  placeholder={t('auth.reset.confirm')} 
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
              ) : (
                <AuthInput 
                  ref={confirmRef}
                  secureTextEntry 
                  textContentType="newPassword"
                  autoComplete="password-new"
                  value={confirmPassword} 
                  onChangeText={handleConfirmPasswordChange}
                  onBlur={handleConfirmPasswordBlur}
                  error={errors.confirmPassword} 
                  leftIcon="shield-checkmark" 
                  placeholder={t('auth.reset.confirm')} 
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown}>
              <AuthButton 
                label={t('auth.reset.button')} 
                onPress={handleResetPassword} 
                loading={loading} 
              />
            </Animated.View>
           
            </Animated.View>
          </GlassCard>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Platform.select({ 
      ios: spacing.lg, 
      android: spacing.md,
      default: spacing.lg 
    }),
    paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    paddingBottom: spacing.xl,
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    width: '100%',
    minHeight: '100%',
  },
  card: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 420 : Platform.OS === 'ios' ? '92%' : '95%',
    marginTop: spacing.md,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: -spacing.lg,
    marginTop: -spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 22,
    alignSelf: 'flex-start',
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    color: colors.mutedText,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  passwordRequirements: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  requirementsTitle: {
    color: colors.gold,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  requirement: {
    color: colors.mutedText,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  requirementMet: {
    color: '#10B981',
  },
});
