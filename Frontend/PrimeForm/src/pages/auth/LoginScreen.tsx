import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SimpleInput from '../../components/SimpleInput';
import AuthInput from '../../components/AuthInput';
import AuthButton from '../../components/AuthButton';
import CustomAlert from '../../components/CustomAlert';
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
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
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

  const validatePassword = (password: string) => {
    if (!password.trim()) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
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

  const onLogin = async () => {
    // Force show all validation errors immediately
    setTouched({ email: true, password: true });
    
    if (!validate()) {
      return;
    }
    
    try {
      const ok = await signIn(email, password);
      if (ok) {
        showAlert('success', 'Welcome Back!', 'Login successful! Welcome to PrimeForm.');
        // Placeholder: On success you would route to the app's main area
        // router.replace('/(tabs)/home');
      } else {
        showAlert('error', 'Login Failed', 'Invalid email or password. Please check your credentials and try again.');
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
                  placeholder="Email"
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
                  placeholder="Email"
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
                  onChangeText={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  error={errors.password}
                  leftIcon="lock-closed"
                  placeholder="Password"
                  returnKeyType="done"
                  onSubmitEditing={onLogin}
                />
              )}
            </View>

            <View>
              <AuthButton label="Log In" onPress={onLogin} loading={loading} />
            </View>

            <View>
              <View style={styles.divider} />
              <View style={styles.inlineLinks}>
                <TouchableOpacity 
                  onPress={() => router.push('/auth/signup')}
                  style={styles.linkButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkTextCenterStrong}>Sign Up</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => router.push('/auth/forgot')}
                  style={styles.linkButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    paddingVertical: spacing.md,
    width: '100%',
    minHeight: '100%',
  },
  card: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 420 : Platform.OS === 'ios' ? '92%' : '95%',
    marginTop: spacing.sm,
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


