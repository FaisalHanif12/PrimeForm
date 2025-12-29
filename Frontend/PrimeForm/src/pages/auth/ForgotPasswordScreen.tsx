import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import AuthInput from '../../components/AuthInput';
import SimpleInput from '../../components/SimpleInput';
import AuthButton from '../../components/AuthButton';

import { colors, spacing } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import DecorativeBackground from '../../components/DecorativeBackground';
import GlassCard from '../../components/GlassCard';
import LogoMark from '../../components/LogoMark';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendReset, loading } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const isAndroid = Platform.select({ android: true, default: false }) as boolean;

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);


  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return t('validation.email.required');
    if (!emailRegex.test(email)) return t('validation.email.invalid');
    return undefined;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched) {
      const emailError = validateEmail(value);
      setError(emailError);
    }
  };



  const handleEmailBlur = () => {
    setTouched(true);
    const emailError = validateEmail(email);
    setError(emailError);
  };



  const onSubmit = async () => {
    console.log('🔵 onSubmit called - email:', email, 'loading:', loading, 'isSubmitted:', isSubmitted);
    
    // Prevent multiple submissions
    if (loading || isSubmitted) {
      console.log('⚠️ Button already processing, ignoring click');
      return;
    }
    
    setTouched(true);
    const emailError = validateEmail(email);
    
    if (emailError) {
      setError(emailError);
      console.log('❌ Email validation error:', emailError);
      return;
    }
    
    setError(undefined);
    console.log('✅ Email validated, calling sendReset...');
    
    try {
      const response = await sendReset(email);
      console.log('📧 Forgot password response:', response);
      
      if (response?.success) {
        setIsSubmitted(true);
        showToast('success', response.message || t('toast.reset.success'));
        
        // Navigate to OTP screen immediately after showing toast
        setTimeout(() => {
          router.push({
            pathname: '/auth/otp-verification',
            params: { email, type: 'reset' }
          });
        }, 1500);
      } else {
        // Show the actual error message from the API if available
        const errorMessage = response?.message || t('toast.reset.error');
        setError(errorMessage);
        showToast('error', errorMessage);
        console.log('❌ API error:', errorMessage);
      }
    } catch (error) {
      console.error('💥 Forgot password error:', error);
      const errorMessage = error instanceof Error ? error.message : t('toast.connection.error');
      setError(errorMessage);
      showToast('error', errorMessage);
    }
  };

  const handleBack = () => {
    // Navigate back to login screen
    // Using replace ensures we don't create navigation loops
    router.replace('/auth/login');
  };

  return (
    <DecorativeBackground>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.centerWrap}>
          <GlassCard style={styles.card}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color={colors.gold} />
              </TouchableOpacity>
            </View>
            <Animated.View entering={FadeInUp}>
            <LogoMark/>
            <Text style={styles.description}>
              {t('auth.forgot.description')}
            </Text>
            <Animated.View entering={FadeInDown}>
              {isAndroid ? (
                <SimpleInput 
                  keyboardType="email-address" 
                  autoCapitalize="none" 
                  value={email} 
                  onChangeText={handleEmailChange}
                  onBlur={handleEmailBlur}
                  error={error}
                  placeholder={t('auth.login.email')} 
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
                  onChangeText={handleEmailChange}
                  onBlur={handleEmailBlur}
                  error={error} 
                  leftIcon="mail" 
                  placeholder={t('auth.login.email')} 
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                />
              )}
            </Animated.View>
            <Animated.View entering={FadeInDown} style={{ width: '100%' }}>
              <AuthButton 
                label={isSubmitted ? t('auth.forgot.sent') : t('auth.forgot.button')} 
                onPress={() => {
                  console.log('🔘 Button pressed!');
                  onSubmit();
                }} 
                loading={loading}
                disabled={isSubmitted || loading}
              />
            </Animated.View>
            </Animated.View>
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
    paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    width: '100%',
    minHeight: '100%',
  },
  card: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 420 : Platform.OS === 'ios' ? '92%' : '95%',
    marginTop: spacing.sm,
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
    marginBottom: spacing.lg,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  linkText: {
    color: colors.gold,
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  linkButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});


