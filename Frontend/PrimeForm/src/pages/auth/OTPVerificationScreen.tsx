 import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import AuthButton from '../../components/AuthButton';
import CustomAlert from '../../components/CustomAlert';
import { colors, spacing, radius } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import DecorativeBackground from '../../components/DecorativeBackground';
import GlassCard from '../../components/GlassCard';
import LogoMark from '../../components/LogoMark';

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const { verifyOTP, loading } = useAuth();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'destructive' | 'cancel' }>;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

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

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'destructive' | 'cancel' }>) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      buttons,
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

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
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      return;
    }

    try {
      const ok = await verifyOTP(email as string, otpString);
      if (ok) {
        router.push({
          pathname: '/auth/reset-password',
          params: { email, token: otpString }
        });
      } else {
        showAlert('error', 'Invalid Code', 'The verification code you entered is incorrect. Please try again.');
      }
    } catch (error) {
      showAlert('error', 'Verification Failed', 'Something went wrong. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    setTimer(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    // Here you would call the resend OTP API
    showAlert('info', 'Code Sent', 'A new verification code has been sent to your email.');
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
              Enter the 6-digit verification code sent to{'\n'}
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
                label="Verify Code" 
                onPress={handleVerifyOTP} 
                loading={loading}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown}>
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>
                  Didn't receive the code?
                </Text>
                {canResend ? (
                  <TouchableOpacity onPress={handleResendOTP} style={styles.resendButton}>
                    <Text style={styles.resendButtonText}>Resend Code</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>
                    Resend in {formatTime(timer)}
                  </Text>
                )}
              </View>
            </Animated.View>
            </Animated.View>
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
      
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
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
});
