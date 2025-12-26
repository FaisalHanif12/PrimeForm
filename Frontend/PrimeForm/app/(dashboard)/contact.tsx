import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  TextInput,
  Alert,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import { useToast } from '../../src/context/ToastContext';
import userProfileService from '../../src/services/userProfileService';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import DashboardHeader from '../../src/components/DashboardHeader';
import Sidebar from '../../src/components/Sidebar';
import ProfilePage from '../../src/components/ProfilePage';
import NotificationModal from '../../src/components/NotificationModal';
import { useAuthContext } from '../../src/context/AuthContext';
import api from '../../src/config/api';

const { width: screenWidth } = Dimensions.get('window');

interface ContactForm {
  name: string;
  email: string;
  problem: string;
}

export default function ContactPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const { user, isAuthenticated, logout } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    problem: ''
  });

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showToast('error', t('contact.validation.name'));
      return false;
    }
    if (!formData.email.trim()) {
      showToast('error', t('contact.validation.email'));
      return false;
    }
    if (!formData.email.includes('@')) {
      showToast('error', t('contact.validation.emailInvalid'));
      return false;
    }
    if (!formData.problem.trim()) {
      showToast('error', t('contact.validation.problem'));
      return false;
    }
    if (formData.problem.trim().length < 10) {
      showToast('error', t('contact.validation.problemMin'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Call backend to send email (server handles SMTP)
      const response = await api.post('/contact/send-email', {
        name: formData.name,
        email: formData.email,
        problem: formData.problem,
      });

      if (response && response.success) {
        showToast('success', t('contact.success'));
        setFormData({ name: '', email: '', problem: '' });
      } else {
        showToast('error', response?.message || t('contact.error.send'));
      }
    } catch (error: any) {
      showToast('error', error?.message || t('contact.error.message'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfilePress = () => {
    setSidebarVisible(true);
  };

  const handleNotificationPress = () => {
    setNotificationModalVisible(true);
  };

  const handleSidebarMenuPress = async (action: string) => {
    setSidebarVisible(false);
    
    try {
      switch (action) {
        case 'profile':
          setShowProfilePage(true);
          break;
        case 'streak':
          router.push('/(dashboard)/streak');
          break;
        case 'ai-trainer':
          router.push('/(dashboard)/ai-trainer');
          break;
        case 'language':
          router.push('/(dashboard)/language');
          break;
        case 'sport-mode':
          router.push('/(dashboard)/sport-mode');
          break;
        case 'settings':
          router.push('/(dashboard)/settings');
          break;
        case 'subscription':
          router.push('/(dashboard)/subscription');
          break;
        case 'contact':
          // Already here
          break;
        case 'logout':
          await logout();
          router.replace('/auth/login');
          break;
        case 'language':
          break;
        default:
          break;
      }
    } catch (error) {
      showToast('error', t('contact.error.general'));
    }
  };

  // Load user info - fetch from API if cache is empty
  const loadUserInfo = async () => {
    try {
      // First try cache
      const cachedData = userProfileService.getCachedData();
      if (cachedData && cachedData.data) {
        setUserInfo(cachedData.data);
        return;
      }

      // If no cache, fetch from API
      const response = await userProfileService.getUserProfile();
      if (response.success && response.data) {
        setUserInfo(response.data);
      }
    } catch (error) {
      // Failed to load user info
    }
  };

  const handleUpdateUserInfo = (updatedInfo: any) => {
    setUserInfo(updatedInfo);
  };

  // Load user info when profile page is opened
  useEffect(() => {
    if (showProfilePage && !userInfo) {
      loadUserInfo();
    }
  }, [showProfilePage]);

  const renderContactForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <View style={styles.formIconContainer}>
          <Ionicons name="mail" size={32} color={colors.gold} />
        </View>
        <Text style={styles.formTitle}>{t('contact.title')}</Text>
        <Text style={styles.formSubtitle}>
          {t('contact.subtitle')}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('contact.form.name')} *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.name}
          onChangeText={(text) => handleInputChange('name', text)}
          placeholder={t('contact.form.name.placeholder')}
          placeholderTextColor={colors.mutedText}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('contact.form.email')} *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.email}
          onChangeText={(text) => handleInputChange('email', text)}
          placeholder={t('contact.form.email.placeholder')}
          placeholderTextColor={colors.mutedText}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('contact.form.problem')} *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.problem}
          onChangeText={(text) => handleInputChange('problem', text)}
          placeholder={t('contact.form.problem.placeholder')}
          placeholderTextColor={colors.mutedText}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>
          {formData.problem.length}/500 {t('contact.form.characters')}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          isSubmitting && styles.submitButtonDisabled
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <View style={styles.submitButtonContent}>
            <Ionicons name="hourglass-outline" size={20} color={colors.background} />
            <Text style={styles.submitButtonText}>{t('contact.form.sending')}</Text>
          </View>
        ) : (
          <View style={styles.submitButtonContent}>
            <Ionicons name="send" size={20} color={colors.background} />
            <Text style={styles.submitButtonText}>{t('contact.form.send')}</Text>
          </View>
        )}
      </TouchableOpacity>


    </View>
  );

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        <DashboardHeader
          userName={user?.fullName || t('common.user')}
          onProfilePress={handleProfilePress}
          onNotificationPress={handleNotificationPress}
          notificationCount={0}
        />
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {renderContactForm()}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onMenuItemPress={handleSidebarMenuPress}
          userName={user?.fullName || t('common.user')}
          userEmail={user?.email || 'user@purebody.com'}
          isGuest={!isAuthenticated}
          userInfo={null}
          badges={[]}
        />

        {/* Notification Modal */}
        <NotificationModal
          visible={notificationModalVisible}
          onClose={() => setNotificationModalVisible(false)}
        />

        {/* Profile Page */}
        <ProfilePage
          visible={showProfilePage}
          onClose={() => {
            setShowProfilePage(false);
            setSidebarVisible(true);
          }}
          userInfo={userInfo}
          onUpdateUserInfo={handleUpdateUserInfo}
        />
      </SafeAreaView>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  formContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
   formHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  formIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 201, 124, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  formTitle: {
    fontSize: typography.h3,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: typography.body,
    color: colors.mutedText,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.white,
    fontFamily: fonts.body,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.white,
    fontSize: typography.body,
    fontFamily: fonts.body,
  },
  textArea: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
  characterCount: {
    fontSize: typography.small,
    color: colors.mutedText,
    fontFamily: fonts.body,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  submitButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  submitButtonDisabled: {
    backgroundColor: colors.cardBorder,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: fonts.body,
  },

  bottomSpacing: {
    height: 100,
  },
});
