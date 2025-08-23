 import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import AuthButton from '../../components/AuthButton';

import { colors, spacing, radius } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import DecorativeBackground from '../../components/DecorativeBackground';
import GlassCard from '../../components/GlassCard';
import LogoMark from '../../components/LogoMark';

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { email, type } = useLocalSearchParams();
  const { verifyOTP, loading, sendReset } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Debug parameters
  console.log('OTP Screen - Email param:', email);
  console.log('OTP Screen - Type param:', type);
  console.log('OTP Screen - All params:', useLocalSearchParams());
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);


  const otpRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  useEffect(() => {
    if (lockTimer > 0) {
      const interval = setInterval(() => {
        setLockTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (isLocked) {
      setIsLocked(false);
      setAttempts(0);
    }
  }, [lockTimer, isLocked]);



  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };



  const handleVerifyOTP = async () => {
    if (isLocked) {
      showToast('error', `${t('auth.otp.wait')} ${Math.ceil(lockTimer / 60)} ${t('auth.otp.minutes')}`);
      return;
    }

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      showToast('warning', t('auth.otp.incomplete'));
      return;
    }

    console.log('Verifying OTP:', otpString, 'for email:', email);

    try {
      const response = await verifyOTP(email as string, otpString);
      console.log('OTP Verification Response:', response);
      
      if (response?.success) {
        showToast('success', t('toast.otp.success'));
        setAttempts(0);
        
        // Navigate to reset password screen
        setTimeout(() => {
          router.push({
            pathname: '/auth/reset-password',
            params: { email, otp: otpString }
          });
        }, 1500);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setIsLocked(true);
          setLockTimer(60); // 1 minute lock
          showToast('error', t('auth.otp.locked'));
        } else {
          showToast('error', t('toast.otp.error'));
        }
        
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      showToast('error', t('toast.connection.error'));
    }
  };

  const handleResendOTP = async () => {
    setTimer(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    setAttempts(0); // Reset attempts when getting new code
    setIsLocked(false);
    setLockTimer(0);
    
    try {
      const response = await sendReset(email as string);
      if (response?.success) {
        showToast('success', t('toast.reset.success'));
      } else {
        showToast('error', t('auth.otp.failed'));
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      showToast('error', t('toast.connection.error'));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DecorativeBackground>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
            
            <LogoMark/>
            
            <Text style={styles.description}>
              {t('auth.otp.description')}{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            <Animated.View entering={FadeInDown} style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { otpRefs.current[index] = ref; }}
                  style={[styles.otpInput, digit && styles.otpInputFilled]}
                  value={digit}
                  onChangeText={(value) => handleOTPChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                  textAlign="center"
                />
              ))}
            </Animated.View>

            <Animated.View entering={FadeInDown}>
              <AuthButton 
                label={isLocked ? `Locked (${Math.ceil(lockTimer / 60)}m)` : t('auth.otp.button')} 
                onPress={handleVerifyOTP} 
                loading={loading}
                disabled={isLocked}
              />
            </Animated.View>

            {attempts > 0 && !isLocked && (
              <Animated.View entering={FadeInDown}>
                <Text style={styles.attemptsText}>
                  {3 - attempts} {t('auth.otp.attempts')}
                </Text>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown}>
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>
                  {t('auth.otp.nocode')}
                </Text>
                {canResend ? (
                  <TouchableOpacity onPress={handleResendOTP} style={styles.resendButton}>
                    <Text style={styles.resendButtonText}>{t('auth.otp.resend')}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>
                    {t('auth.otp.resendTimer')} {formatTime(timer)}
                  </Text>
                )}
              </View>
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
  emailText: {
    color: colors.gold,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
    gap: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    flexWrap: 'wrap',
  },
  otpInput: {
    width: Platform.select({
      ios: 52,
      android: 48,
      default: 48
    }),
    height: Platform.select({
      ios: 60,
      android: 56,
      default: 56
    }),
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    backgroundColor: colors.inputBackground,
    color: colors.white,
    fontSize: Platform.select({
      ios: 22,
      android: 20,
      default: 20
    }),
    fontWeight: '600',
  },
  otpInputFilled: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  resendText: {
    color: colors.mutedText,
    fontSize: 15,
    marginBottom: spacing.xs,
  },
  resendButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  resendButtonText: {
    color: colors.gold,
    fontWeight: '600',
    fontSize: 15,
  },
  timerText: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: '500',
  },
  attemptsText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontWeight: '500',
  },
});
