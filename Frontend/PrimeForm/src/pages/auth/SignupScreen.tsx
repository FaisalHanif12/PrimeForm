import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import AuthInput from '../../components/AuthInput';
import SimpleInput from '../../components/SimpleInput';
import AuthButton from '../../components/AuthButton';
import CustomAlert from '../../components/CustomAlert';
import { colors, spacing, fonts, radius } from '../../theme/colors';
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
  const [showRequirements, setShowRequirements] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; password?: boolean; confirm?: boolean }>({});
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

  const validateName = (name: string) => {
    if (!name.trim()) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    return undefined;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email like user@gmail.com';
    return undefined;
  };

  const validatePassword = (password: string) => {
    if (!password.trim()) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    // More relaxed validation for better UX
    if (!/(?=.*[a-zA-Z])/.test(password)) return 'Password must contain at least one letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    return undefined;
  };

  const validateConfirm = (confirm: string, password: string) => {
    if (!confirm.trim()) return 'Please confirm your password';
    if (password && confirm && password !== confirm) return 'Passwords do not match';
    return undefined;
  };

  const validate = () => {
    const next: { name?: string; email?: string; password?: string; confirm?: string } = {};
    next.name = validateName(name);
    next.email = validateEmail(email);
    next.password = validatePassword(password);
    next.confirm = validateConfirm(confirm, password);
    
    // Remove undefined errors
    Object.keys(next).forEach(key => {
      if (!next[key as keyof typeof next]) {
        delete next[key as keyof typeof next];
      }
    });
    
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (touched.name) {
      const error = validateName(value);
      setErrors(prev => ({ ...prev, name: error }));
    }
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
    if (touched.confirm) {
      const confirmError = validateConfirm(confirm, value);
      setErrors(prev => ({ ...prev, confirm: confirmError }));
    }
  };

  const handleConfirmChange = (value: string) => {
    setConfirm(value);
    if (touched.confirm) {
      const error = validateConfirm(value, password);
      setErrors(prev => ({ ...prev, confirm: error }));
    }
  };

  const handleNameBlur = () => {
    setTouched(prev => ({ ...prev, name: true }));
    const error = validateName(name);
    setErrors(prev => ({ ...prev, name: error }));
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

  const handleConfirmBlur = () => {
    setTouched(prev => ({ ...prev, confirm: true }));
    const error = validateConfirm(confirm, password);
    setErrors(prev => ({ ...prev, confirm: error }));
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

  const onSignup = async () => {
    // Force validation for all fields
    setTouched({ name: true, email: true, password: true, confirm: true });
    
    const isValid = validate();
    console.log('Validation result:', isValid);
    console.log('Current errors:', errors);
    console.log('Form data:', { name, email, password, confirm });
    
    if (!isValid) {
      return;
    }
    
    try {
      const ok = await signUp({ name, email, password });
      if (ok) {
        showAlert('success', 'Account Created!', 'Your account has been created successfully. Redirecting to login...', undefined, true);
        // Auto navigate after 2 seconds
        setTimeout(() => {
          router.replace('/auth/login');
        }, 2000);
      } else {
        showAlert('error', 'Registration Failed', 'Failed to create account. Please try again.');
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
          <Animated.View entering={FadeInUp} style={styles.centerWrap}>
            <GlassCard style={styles.card}>
              {/* Info Icon - Top Right Corner */}
              <TouchableOpacity 
                style={styles.infoIconButton}
                onPress={() => setShowRequirements(!showRequirements)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={showRequirements ? "information-circle" : "information-circle-outline"} 
                  size={24} 
                  color={colors.gold} 
                />
              </TouchableOpacity>
              
              <LogoMark />
            <Animated.View entering={FadeInDown}>
              {isAndroid ? (
                <SimpleInput 
                  value={name} 
                  onChangeText={handleNameChange}
                  onBlur={handleNameBlur}
                  error={errors.name}
                  placeholder="Username" 
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  blurOnSubmit={false}
                />
              ) : (
              <AuthInput 
                value={name} 
                onChangeText={handleNameChange}
                onBlur={handleNameBlur}
                error={errors.name} 
                leftIcon="person" 
                placeholder="Username" 
                autoCapitalize="words"
                textContentType="name"
                autoComplete="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                blurOnSubmit={false}
              />
              )}
            </Animated.View>
            <Animated.View entering={FadeInDown}>
              {isAndroid ? (
                <SimpleInput 
                  ref={emailRef}
                  keyboardType="email-address" 
                  autoCapitalize="none" 
                  value={email} 
                  onChangeText={handleEmailChange}
                  onBlur={handleEmailBlur}
                  error={errors.email}
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
                onChangeText={handleEmailChange}
                onBlur={handleEmailBlur}
                error={errors.email} 
                leftIcon="mail" 
                placeholder="Email" 
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
              )}
            </Animated.View>
            <Animated.View entering={FadeInDown}>
              {isAndroid ? (
                <SimpleInput 
                  ref={passwordRef}
                  secureTextEntry 
                  value={password} 
                  onChangeText={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  error={errors.password}
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
                onChangeText={handlePasswordChange}
                onBlur={handlePasswordBlur}
                error={errors.password} 
                leftIcon="lock-closed" 
                placeholder="Password" 
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
                  value={confirm} 
                  onChangeText={handleConfirmChange}
                  onBlur={handleConfirmBlur}
                  error={errors.confirm}
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
                onChangeText={handleConfirmChange}
                onBlur={handleConfirmBlur}
                error={errors.confirm} 
                leftIcon="shield-checkmark" 
                placeholder="Confirm Password" 
                returnKeyType="done"
                onSubmitEditing={onSignup}
              />
              )}
            </Animated.View>


            {/* Requirements Panel */}
            {showRequirements && (
              <Animated.View entering={FadeInDown}>
                <View style={styles.requirementsPanel}>
                  <Text style={styles.requirementsTitle}>Email & Password Requirements</Text>
                  
                  <View style={styles.requirementSection}>
                    <Text style={styles.sectionTitle}>📧 Email Format:</Text>
                    <Text style={styles.requirementText}>• Must be a valid email (e.g., user@gmail.com)</Text>
                    <Text style={styles.requirementText}>• Cannot contain spaces</Text>
                  </View>
                  
                  <View style={styles.requirementSection}>
                    <Text style={styles.sectionTitle}>🔒 Password Requirements:</Text>
                    <Text style={[styles.requirementText, password.length >= 6 && styles.requirementMet]}>
                      • At least 6 characters long
                    </Text>
                    <Text style={[styles.requirementText, /(?=.*[a-zA-Z])/.test(password) && styles.requirementMet]}>
                      • Contains at least one letter (a-z, A-Z)
                    </Text>
                    <Text style={[styles.requirementText, /(?=.*\d)/.test(password) && styles.requirementMet]}>
                      • Contains at least one number (0-9)
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown}>
              <AuthButton label="Sign Up" onPress={onSignup} loading={loading} />
            </Animated.View>
            <Animated.View entering={FadeInDown}>
              <View style={styles.bottomRow}>
                <Text style={styles.bottomText}>Already have an account? </Text>
                <Link href="/auth/login" asChild>
                  <TouchableOpacity style={styles.linkButton} activeOpacity={0.7}>
                    <Text style={styles.linkText}>Log In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </Animated.View>
          </GlassCard>
        </Animated.View>
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
    paddingVertical: spacing.md,
    width: '100%',
    minHeight: '100%',
  },
  card: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 420 : Platform.OS === 'ios' ? '92%' : '95%',
    marginTop: spacing.sm,
    position: 'relative',
  },
  infoIconButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 10,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  bottomText: {
    color: colors.mutedText,
    fontSize: 15,
  },
  linkText: {
    color: colors.gold,
    fontWeight: '600',
    fontSize: 15,
  },
  linkButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },

  requirementsPanel: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  requirementsTitle: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
    fontFamily: fonts.body,
  },
  requirementSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
    fontFamily: fonts.body,
  },
  requirementText: {
    color: colors.mutedText,
    fontSize: 13,
    marginBottom: spacing.xs / 2,
    fontFamily: fonts.body,
    lineHeight: 18,
  },
  requirementMet: {
    color: '#10B981',
  },
});


