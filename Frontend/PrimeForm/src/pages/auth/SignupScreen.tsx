import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput, ScrollView, Modal } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import AuthInput from '../../components/AuthInput';
import SimpleInput from '../../components/SimpleInput';
import AuthButton from '../../components/AuthButton';

import { colors, spacing, fonts, radius } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import DecorativeBackground from '../../components/DecorativeBackground';
import GlassCard from '../../components/GlassCard';
import LogoMark from '../../components/LogoMark';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  const { login: setAuthUser } = useAuthContext();
  const { showToast } = useToast();
  const { t, changeLanguage, isRTL } = useLanguage();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const isAndroid = Platform.select({ android: true, default: false }) as boolean;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showRequirements, setShowRequirements] = useState(false);
  const [showLanguageOverlay, setShowLanguageOverlay] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; password?: boolean; confirm?: boolean }>({});


  const validateName = (name: string) => {
    if (!name.trim()) return t('validation.name.required');
    if (name.trim().length < 2) return t('validation.name.minLength');
    return undefined;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return t('validation.email.required');
    if (!emailRegex.test(email)) return t('validation.email.invalid');
    return undefined;
  };

  const validatePassword = (password: string) => {
    const issues = [];
    if (!password.trim()) return t('validation.password.required');
    if (password.length < 6) issues.push(t('validation.password.minLength'));
    if (!/(?=.*[a-z])/.test(password)) issues.push(t('validation.password.lowercase'));
    if (!/(?=.*[A-Z])/.test(password)) issues.push(t('validation.password.uppercase'));
    if (!/(?=.*\d)/.test(password)) issues.push(t('validation.password.number'));
    return issues.length > 0 ? issues[0] : undefined;
  };

  const validateConfirm = (confirm: string, password: string) => {
    if (!confirm.trim()) return t('validation.confirm.required');
    if (password && confirm && password !== confirm) return t('validation.confirm.mismatch');
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

  // Check if language already selected - DISABLED for auth pages
  // useEffect(() => {
  //   const checkLanguage = async () => {
  //     const chosen = await AsyncStorage.getItem('primeform_language_selected');
  //     if (!chosen) {
  //       setShowLanguageOverlay(true);
  //     }
  //   };
  //   checkLanguage();
  // }, []);

  const chooseLanguage = async (lang: 'en' | 'ur') => {
    await changeLanguage(lang);
    setShowLanguageOverlay(false);
  };


  const onSignup = async () => {
    // Force validation for all fields
    setTouched({ name: true, email: true, password: true, confirm: true });

    const isValid = validate();
    console.log('Validation result:', isValid);
    console.log('Current errors:', errors);
    console.log('Form data:', { fullName: name, email, password, confirm });

    if (!isValid) {
      showToast('error', t('toast.validation.error'));
      return;
    }

    try {
      const response = await signUp({ fullName: name, email, password });
      if (response?.success) {
        // Set user in auth context for automatic login
        if (response.data?.user) {
          setAuthUser(response.data.user);
        }

        // Mark that user has ever signed up (for future app launches)
        await AsyncStorage.setItem('primeform_has_ever_signed_up', 'true');
        
        // Mark that user has completed signup (for current session access)
        await AsyncStorage.setItem('primeform_signup_completed', 'true');

        showToast('success', t('toast.signup.success'));

        // Auto-navigate to dashboard after toast
        setTimeout(() => {
          router.replace('/(dashboard)');
        }, 1500);
      } else {
        showToast('error', response?.message || t('toast.signup.error'));
      }
    } catch (error) {
      console.error('Signup error:', error);
      showToast('error', t('toast.connection.error'));
    }
  };

  return (
    <DecorativeBackground>
      {/* Language selection overlay */}
      {showLanguageOverlay && (
        <BlurView intensity={50} style={styles.overlayAbsolute} tint="dark">
          <Animated.View entering={FadeInDown} style={styles.languageCard}>
            <Text style={styles.modalTitle}>{t('language.choose')}</Text>
            <View style={styles.langButtonsRow}>
              <TouchableOpacity style={styles.langButton} onPress={() => chooseLanguage('ur')}>
                <Text style={styles.langButtonText}>{t('language.urdu')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.langButton} onPress={() => chooseLanguage('en')}>
                <Text style={styles.langButtonText}>{t('language.english')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </BlurView>
      )}

      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          indicatorStyle="white"
        >
          <Animated.View entering={FadeInUp} style={styles.centerWrap}>
            <GlassCard style={styles.card}>

              <LogoMark />
              <Animated.View entering={FadeInDown}>
                {isAndroid ? (
                  <SimpleInput
                    value={name}
                    onChangeText={handleNameChange}
                    onBlur={handleNameBlur}
                    error={errors.name}
                    placeholder={t('auth.signup.name')}
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
                    placeholder={t('auth.signup.name')}
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
                    placeholder={t('auth.signup.email')}
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
                    placeholder={t('auth.signup.email')}
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
                    placeholder={t('auth.signup.password')}
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
                    placeholder={t('auth.signup.password')}
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
                    placeholder={t('auth.signup.confirm')}
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
                    placeholder={t('auth.signup.confirm')}
                    returnKeyType="done"
                    onSubmitEditing={onSignup}
                  />
                )}
              </Animated.View>


              {/* Requirements Panel */}
              {showRequirements && (
                <Animated.View entering={FadeInDown}>
                  <View style={styles.requirementsPanel}>
                    <Text style={styles.requirementsTitle}>{t('requirements.title')}</Text>

                    <View style={styles.requirementSection}>
                      <Text style={styles.sectionTitle}>{t('requirements.email.section')}</Text>
                      <Text style={styles.requirementText}>{t('requirements.email.valid')}</Text>
                      <Text style={styles.requirementText}>{t('requirements.email.noSpaces')}</Text>
                    </View>

                    <View style={styles.requirementSection}>
                      <Text style={styles.sectionTitle}>{t('requirements.password.section')}</Text>
                      <Text style={[styles.requirementText, password.length >= 6 && styles.requirementMet]}>
                        {t('requirements.password.length')}
                      </Text>
                      <Text style={[styles.requirementText, /(?=.*[a-zA-Z])/.test(password) && styles.requirementMet]}>
                        {t('requirements.password.letter')}
                      </Text>
                      <Text style={[styles.requirementText, /(?=.*\d)/.test(password) && styles.requirementMet]}>
                        {t('requirements.password.number')}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              )}

              <Animated.View entering={FadeInDown}>
                <AuthButton label={t('auth.signup.button')} onPress={onSignup} loading={loading} />
              </Animated.View>
              <Animated.View entering={FadeInDown}>
                <View style={styles.bottomRow}>
                  <Text style={styles.bottomText}>{t('auth.signup.hasAccount')}</Text>
                  <Link href="/auth/login" asChild>
                    <TouchableOpacity style={styles.linkButton} activeOpacity={0.7}>
                      <Text style={styles.linkText}>{t('auth.signup.login')}</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </Animated.View>
            </GlassCard>
          </Animated.View>
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
  // Language modal styles
  overlayAbsolute: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  languageCard: {
    backgroundColor: 'rgba(25,35,75,0.95)',
    padding: spacing.xl,
    borderRadius: radius.md,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  langButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  langButton: {
    flex: 1,
    marginHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  langButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
});


