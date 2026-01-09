import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import { useToast } from '../../src/context/ToastContext';
import userProfileService from '../../src/services/userProfileService';
import DashboardHeader from '../../src/components/DashboardHeader';
import Sidebar from '../../src/components/Sidebar';
import BottomNavigation from '../../src/components/BottomNavigation';
import NotificationModal from '../../src/components/NotificationModal';
import ProfilePage from '../../src/components/ProfilePage';
import { useAuthContext } from '../../src/context/AuthContext';
import { useNotificationCount } from '../../src/hooks/useNotificationCount';

interface LanguageOption {
  code: 'en' | 'ur';
  name: string;
  nativeName: string;
  flag: string;
  description: string;
}

const languages: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    description: 'Primary language for the app interface and content',
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    flag: '🇵🇰',
    description: 'زبان اور مواد کے لیے بنیادی زبان',
  },
];

export default function LanguagePreferencesPage() {
  const router = useRouter();
  const { language, changeLanguage, t } = useLanguage();
  const { showToast } = useToast();
  const { user } = useAuthContext();
  const { unreadCount } = useNotificationCount();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

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
        case 'settings':
          router.push('/(dashboard)/settings');
          break;
        case 'subscription':
          router.push('/(dashboard)/subscription');
          break;
        case 'contact':
          router.push('/(dashboard)/contact');
          break;
        case 'language':
          // Already on language page
          break;
        case 'sport-mode':
          router.push('/(dashboard)/sport-mode');
          break;
        case 'logout':
          // Handle logout
          break;
        default:
          break;
      }
    } catch (error) {
      showToast('error', t('language.preferences.actionFailed'));
    }
  };

  const handleLanguageSelect = async (lang: 'en' | 'ur') => {
    if (lang === language) return;

    setIsChanging(true);

    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await changeLanguage(lang);
      const languageName = languages.find(l => l.code === lang)?.name || lang.toUpperCase();
      showToast('success', `${t('language.preferences.changed')} ${languageName}`);
    } catch (error) {
      showToast('error', t('language.preferences.changeFailed'));
    } finally {
      setTimeout(() => setIsChanging(false), 300);
    }
  };

  const handleTabPress = (tab: 'home' | 'diet' | 'gym' | 'workout' | 'progress') => {
    switch (tab) {
      case 'home':
        router.push('/(dashboard)');
        break;
      case 'diet':
        router.push('/(dashboard)/diet');
        break;
      case 'gym':
        router.push('/(dashboard)/gym');
        break;
      case 'workout':
        router.push('/(dashboard)/workout');
        break;
      case 'progress':
        router.push('/(dashboard)/progress');
        break;
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <DashboardHeader
        userName={user?.fullName || t('common.user')}
        onProfilePress={handleProfilePress}
        onNotificationPress={handleNotificationPress}
        notificationCount={unreadCount}
      />

      {/* Sidebar */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onMenuItemPress={handleSidebarMenuPress}
        userName={user?.fullName || 'Guest User'}
        userEmail={user?.email || 'guest@purebody.com'}
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>{t('language.preferences.title')}</Text>
          <Text style={styles.heroSubtitle}>
            {t('language.preferences.subtitle')}
          </Text>
        </View>

        {/* Current Language Badge */}
        <View style={styles.currentLanguageSection}>
          <View style={styles.currentLanguageBadge}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={styles.currentLanguageText}>
              {t('language.preferences.current')}: {languages.find(l => l.code === language)?.name}
            </Text>
          </View>
        </View>

        {/* Language Options */}
        <View style={styles.languagesSection}>
          <Text style={styles.sectionTitle}>{t('language.preferences.available')}</Text>
          <Text style={styles.sectionSubtitle}>{t('language.preferences.select')}</Text>

          {languages.map((lang) => {
            const isSelected = language === lang.code;
            const isDisabled = isChanging;

            return (
              <Animated.View
                key={lang.code}
                style={[
                  styles.languageCard,
                  isSelected && styles.languageCardSelected,
                  { transform: [{ scale: isSelected ? scaleAnim : 1 }] },
                ]}
              >
                <TouchableOpacity
                  style={styles.languageCardContent}
                  onPress={() => handleLanguageSelect(lang.code)}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  {/* Flag & Language Info */}
                  <View style={styles.languageInfo}>
                    <View style={styles.flagContainer}>
                      <Text style={styles.flagEmoji}>{lang.flag}</Text>
                    </View>
                    <View style={styles.languageTextContainer}>
                      <View style={styles.languageNameRow}>
                        <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
                          {lang.name}
                        </Text>
                        {isSelected && (
                          <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>{t('language.preferences.active')}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.languageNative, isSelected && styles.languageNativeSelected]}>
                        {lang.nativeName}
                      </Text>
                      <Text style={styles.languageDescription}>{lang.description}</Text>
                    </View>
                  </View>

                  {/* Selection Indicator - Radio Button Style */}
                  <View style={styles.selectionIndicator}>
                    <View style={styles.radioOuter}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab="language" 
        onTabPress={handleTabPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '500',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
    textAlign: 'center',
    opacity: 0.9,
  },
  heroSubtitle: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Current Language Section
  currentLanguageSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  currentLanguageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  currentLanguageText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.body,
  },

  // Languages Section
  languagesSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
    marginBottom: spacing.lg,
  },

  // Language Card
  languageCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  languageCardSelected: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    elevation: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  languageCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  flagEmoji: {
    fontSize: 32,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  languageName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  languageNameSelected: {
    color: colors.gold,
  },
  languageNative: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
  },
  languageNativeSelected: {
    color: colors.white,
  },
  languageDescription: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '400',
    fontFamily: fonts.body,
    lineHeight: 18,
    opacity: 0.8,
  },
  activeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  activeBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.heading,
    textTransform: 'uppercase',
  },

  // Selection Indicator - Radio Button Style
  selectionIndicator: {
    marginLeft: spacing.md,
  },
  radioOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  radioInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },

  // Selected Progress Bar
  selectedProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.cardBorder + '30',
  },
  selectedProgressFill: {
    height: '100%',
    backgroundColor: colors.gold,
    width: '100%',
  },

  // Info Section
  infoSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  infoText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.body,
    lineHeight: 20,
  },
});

