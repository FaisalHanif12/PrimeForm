import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import AuthInput from '../../components/AuthInput';
import SimpleInput from '../../components/SimpleInput';
import AuthButton from '../../components/AuthButton';
import CustomAlert from '../../components/CustomAlert';
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
  const [touched, setTouched] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched) {
      const emailError = validateEmail(value);
      setError(emailError);
    }
  };

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

  const handleEmailBlur = () => {
    setTouched(true);
    const emailError = validateEmail(email);
    setError(emailError);
  };

  const onSubmit = async () => {
    setTouched(true);
    const emailError = validateEmail(email);
    
    if (emailError) {
      setError(emailError);
      return;
    }
    
    setError(undefined);
    
    try {
      const ok = await sendReset(email);
      if (ok) {
        setIsSubmitted(true);
        // Navigate directly to OTP screen without showing alert
        router.push({
          pathname: '/auth/otp-verification',
          params: { email }
        });
      } else {
        showAlert('error', 'Email Not Found', 'Email address not found. Please check and try again.');
      }
    } catch (error) {
      showAlert('error', 'Something Went Wrong', 'An unexpected error occurred. Please try again.');
    }
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
              Enter your email address and we'll send you a link to reset your password.
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
                  placeholder="Email" 
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
                  placeholder="Email" 
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                />
              )}
            </Animated.View>
            <Animated.View entering={FadeInDown}>
              <AuthButton 
                label={isSubmitted ? "Reset Link Sent" : "Send Reset Link"} 
                onPress={onSubmit} 
                loading={loading}
                disabled={isSubmitted}
              />
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


