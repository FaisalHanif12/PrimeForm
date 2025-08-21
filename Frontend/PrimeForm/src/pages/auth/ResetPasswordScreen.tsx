import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email, token } = useLocalSearchParams();
  const { resetPassword, loading } = useAuth();
  const confirmRef = useRef<TextInput>(null);
  const isAndroid = Platform.select({ android: true, default: false }) as boolean;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [touched, setTouched] = useState<{ password?: boolean; confirmPassword?: boolean }>({});
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'destructive' | 'cancel' }>;
    autoDismiss?: boolean;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    autoDismiss: false,
  });

  const validatePassword = (password: string) => {
    if (!password.trim()) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (!/(?=.*[a-zA-Z])/.test(password)) return 'Password must contain at least one letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    return undefined;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword.trim()) return 'Please confirm your password';
    if (password && confirmPassword && password !== confirmPassword) return 'Passwords do not match';
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

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'destructive' | 'cancel' }>, autoDismiss?: boolean) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      buttons,
      autoDismiss: autoDismiss || false,
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
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
      return;
    }
    
    try {
      const ok = await resetPassword(email as string, token as string, password);
      if (ok) {
        showAlert('success', 'Password Reset!', 'Your password has been reset successfully. Redirecting to login...', undefined, true);
        // Auto navigate after 2 seconds
        setTimeout(() => {
          router.replace('/auth/login');
        }, 2000);
      } else {
        showAlert('error', 'Reset Failed', 'Failed to reset password. Please try again or request a new reset link.');
      }
    } catch (error) {
      showAlert('error', 'Something Went Wrong', 'An unexpected error occurred. Please try again.');
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
            
            <LogoMark subtitle="Create new password" />
            
            <Text style={styles.description}>
              Choose a strong password for your account. Make sure it's something you'll remember!
            </Text>

            <Animated.View entering={FadeInDown}>
              {isAndroid ? (
                <SimpleInput 
                  secureTextEntry 
                  value={password} 
                  onChangeText={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  error={errors.password}
                  placeholder="New Password" 
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
                  placeholder="New Password" 
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
                  placeholder="Confirm New Password" 
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
                  placeholder="Confirm New Password" 
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown}>
              <AuthButton 
                label="Reset Password" 
                onPress={handleResetPassword} 
                loading={loading}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown}>
              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                <Text style={[styles.requirement, password.length >= 6 && styles.requirementMet]}>
                  • At least 6 characters
                </Text>
                <Text style={[styles.requirement, /(?=.*[a-zA-Z])/.test(password) && styles.requirementMet]}>
                  • Contains at least one letter
                </Text>
                <Text style={[styles.requirement, /(?=.*\d)/.test(password) && styles.requirementMet]}>
                  • Contains at least one number
                </Text>
              </View>
            </Animated.View>
            </Animated.View>
          </GlassCard>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
        autoDismiss={alertConfig.autoDismiss}
      />
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
