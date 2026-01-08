import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import { useToast } from '../../src/context/ToastContext';
import userProfileService from '../../src/services/userProfileService';
import DashboardHeader from '../../src/components/DashboardHeader';
import Sidebar from '../../src/components/Sidebar';
import ProfilePage from '../../src/components/ProfilePage';
import NotificationModal from '../../src/components/NotificationModal';
import { useAuthContext } from '../../src/context/AuthContext';
import { api } from '../../src/config/api';
import Storage from '../../src/utils/storage';
import { getCurrentUserId, isUsingGuestId } from '../../src/utils/cacheKeys';
import notificationSettingsService from '../../src/services/notificationSettingsService';
import { useNotificationCount } from '../../src/hooks/useNotificationCount';

const { width, height } = Dimensions.get('window');

interface NotificationSettings {
  pushNotifications: boolean;
  workoutReminders: boolean;
  dietReminders: boolean;
}

interface SoftwareUpdate {
  version: string;
  available: boolean;
  size: string;
  releaseDate: string;
  description: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const { user, isAuthenticated, logout } = useAuthContext();
  const { unreadCount } = useNotificationCount();
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    workoutReminders: true,
    dietReminders: true,
  });

  // Software update state - Set available: true when a new version is released
  // For first version (1.0), keep available: false
  // When you release version 1.1 or higher, set available: true and update version number
  const [softwareUpdate, setSoftwareUpdate] = useState<SoftwareUpdate>({
    version: '1.0',
    available: false, // No update available for first version - button will be disabled
    size: '15.2 MB',
    releaseDate: '2024-01-15',
    description: 'Bug fixes and performance improvements'
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  // Debug: Log current user ID on mount and when user changes
  useEffect(() => {
    const checkUserId = async () => {
      const userId = await getCurrentUserId();
      const guestStatus = await isUsingGuestId();
      setCurrentUserId(userId);
      setIsGuest(guestStatus);
    };
    checkUserId();
  }, [user, isAuthenticated]);

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
          // already here
          break;
        case 'subscription':
          router.push('/(dashboard)/subscription');
          break;
        case 'contact':
          router.push('/(dashboard)/contact');
          break;
        case 'logout':
          await logout();
          router.replace('/auth/login');
          break;
        case 'language':
          router.push('/(dashboard)/language');
          break;
        case 'sport-mode':
          router.push('/(dashboard)/sport-mode');
          break;
        default:
          break;
      }
    } catch (error) {
      showToast('error', 'Unable to complete that action. Please try again.');
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

  // Load saved notification settings
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      // Load from notification settings service
      const settings = await notificationSettingsService.getSettings();
      setNotificationSettings(settings);

      // Then try to sync with backend
      try {
        const response = await api.get('/user-profile/notification-settings');
        if (response.success && response.data) {
          const backendSettings = {
            pushNotifications: response.data.pushNotifications ?? true,
            workoutReminders: response.data.workoutReminders ?? true,
            dietReminders: response.data.dietReminders ?? true,
          };
          setNotificationSettings(backendSettings);
          // Save using notification settings service (will update handler)
          await notificationSettingsService.saveSettings(backendSettings);
        }
      } catch (error) {
        // If backend fails, use loaded settings from service
        console.log('Using local notification settings');
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveNotificationSettings = async (settings: NotificationSettings) => {
    try {
      // Save using notification settings service (will update handler)
      await notificationSettingsService.saveSettings(settings);

      // Then sync with backend
      try {
        const response = await api.put('/user-profile/notification-settings', settings);
        if (response.success) {
          showToast('success', 'Notification settings saved successfully!');
        } else {
          showToast('success', 'Settings saved locally!');
        }
      } catch (error: any) {
        // Even if backend fails, settings are saved locally
        showToast('success', 'Settings saved locally!');
      }
    } catch (error) {
      showToast('error', 'Failed to save notification settings');
    }
  };

  const handleNotificationToggle = (key: keyof NotificationSettings, value: boolean) => {
    let newSettings: NotificationSettings;

    // If pushNotifications is turned OFF, automatically turn off all other notifications
    if (key === 'pushNotifications' && !value) {
      newSettings = {
        pushNotifications: false,
        workoutReminders: false,
        dietReminders: false,
      };
    } else {
      newSettings = { ...notificationSettings, [key]: value };
      
      // If pushNotifications is OFF, don't allow enabling other notifications
      if (!notificationSettings.pushNotifications && key !== 'pushNotifications') {
        return; // Don't allow toggling if push notifications are disabled
      }
    }

    setNotificationSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const handleSoftwareUpdate = async () => {
    if (!softwareUpdate.available) {
      showToast('info', 'No updates available');
      return;
    }

    Alert.alert(
      'Software Update',
      `Update to version ${softwareUpdate.version}?\n\n${softwareUpdate.description}\n\nSize: ${softwareUpdate.size}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update Now',
          onPress: async () => {
            setIsUpdating(true);
            try {
              // Simulate update process
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // In a real app, you would trigger the actual update
              showToast('success', 'Update completed successfully!');
              setSoftwareUpdate(prev => ({ ...prev, available: false }));
            } catch (error) {
              showToast('error', 'Update failed. Please try again.');
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

    

  const renderNotificationSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="notifications" size={24} color={colors.gold} />
        <Text style={styles.sectionTitle}>{t('settings.notification.preferences')}</Text>
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>{t('settings.push.notifications')}</Text>
          <Text style={styles.settingDescription}>{t('settings.push.notifications.desc')}</Text>
        </View>
        <Switch
          value={notificationSettings.pushNotifications}
          onValueChange={(value) => handleNotificationToggle('pushNotifications', value)}
          trackColor={{ false: colors.cardBorder, true: colors.gold }}
          thumbColor={notificationSettings.pushNotifications ? colors.white : colors.mutedText}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>{t('settings.workout.reminders')}</Text>
          <Text style={styles.settingDescription}>{t('settings.workout.reminders.desc')}</Text>
        </View>
        <Switch
          value={notificationSettings.workoutReminders}
          onValueChange={(value) => handleNotificationToggle('workoutReminders', value)}
          trackColor={{ false: colors.cardBorder, true: colors.gold }}
          thumbColor={notificationSettings.workoutReminders ? colors.white : colors.mutedText}
          disabled={!notificationSettings.pushNotifications}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>{t('settings.diet.reminders')}</Text>
          <Text style={styles.settingDescription}>{t('settings.diet.reminders.desc')}</Text>
        </View>
        <Switch
          value={notificationSettings.dietReminders}
          onValueChange={(value) => handleNotificationToggle('dietReminders', value)}
          trackColor={{ false: colors.cardBorder, true: colors.gold }}
          thumbColor={notificationSettings.dietReminders ? colors.white : colors.mutedText}
          disabled={!notificationSettings.pushNotifications}
        />
      </View>


    </View>
  );

  const renderSoftwareUpdateSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="cloud-download" size={24} color={colors.gold} />
        <Text style={styles.sectionTitle}>{t('settings.software.updates')}</Text>
      </View>
      
      <View style={styles.updateCard}>
        <View style={styles.updateInfo}>
          <Text style={styles.updateVersion}>Current Version: 1.0</Text>
          {softwareUpdate.available && (
            <>
                             <Text style={styles.updateAvailable}>{t('settings.update.available')} {softwareUpdate.version}</Text>
               <Text style={styles.updateSize}>{t('settings.update.size')} {softwareUpdate.size}</Text>
               <Text style={styles.updateDate}>{t('settings.update.date')} {softwareUpdate.releaseDate}</Text>
              <Text style={styles.updateDescription}>{softwareUpdate.description}</Text>
            </>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.updateButton,
            !softwareUpdate.available && styles.updateButtonDisabled,
            isUpdating && styles.updateButtonUpdating
          ]}
          onPress={handleSoftwareUpdate}
          disabled={!softwareUpdate.available || isUpdating}
        >
          {isUpdating ? (
            <Text style={styles.updateButtonText}>{t('settings.updating')}</Text>
          ) : (
                         <Text style={styles.updateButtonText}>
               {softwareUpdate.available ? t('settings.update.now') : t('settings.up.to.date')}
             </Text>
          )}
        </TouchableOpacity>
      </View>


    </View>
  );

  const renderAppInfoSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="information-circle" size={24} color={colors.gold} />
        <Text style={styles.sectionTitle}>{t('settings.app.information')}</Text>
      </View>
      
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('settings.app.name')}</Text>
          <Text style={styles.infoValue}>Pure Body</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('settings.app.version')}</Text>
          <Text style={styles.infoValue}>1.0</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('settings.app.build')}</Text>
          <Text style={styles.infoValue}>2024.01.001</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('settings.app.platform')}</Text>
          <Text style={styles.infoValue}>Android/iOS</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('settings.app.language')}</Text>
          <Text style={styles.infoValue}>English/Urdu</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <DashboardHeader
        userName={user?.fullName || t('common.user')}
        onProfilePress={handleProfilePress}
        onNotificationPress={handleNotificationPress}
        notificationCount={unreadCount}
      />
      <View style={styles.container}>
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderNotificationSection()}
          {renderSoftwareUpdateSection()}
          {renderAppInfoSection()}
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>

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
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.h4,
    fontWeight: '600',
    color: colors.white,
    marginLeft: spacing.md,
    fontFamily: fonts.heading,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.white,
    marginBottom: spacing.xs,
    fontFamily: fonts.body,
  },
  settingDescription: {
    fontSize: typography.small,
    color: colors.mutedText,
    fontFamily: fonts.body,
  },
  updateCard: {
    backgroundColor: colors.cardBackground,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  updateInfo: {
    marginBottom: spacing.lg,
  },
  updateVersion: {
    fontSize: typography.body,
    color: colors.white,
    marginBottom: spacing.sm,
    fontFamily: fonts.body,
  },
  updateAvailable: {
    fontSize: typography.body,
    color: colors.gold,
    fontWeight: '600',
    marginBottom: spacing.xs,
    fontFamily: fonts.body,
  },
  updateSize: {
    fontSize: typography.small,
    color: colors.mutedText,
    marginBottom: spacing.xs,
    fontFamily: fonts.body,
  },
  updateDate: {
    fontSize: typography.small,
    color: colors.mutedText,
    marginBottom: spacing.sm,
    fontFamily: fonts.body,
  },
  updateDescription: {
    fontSize: typography.small,
    color: colors.mutedText,
    fontFamily: fonts.body,
    lineHeight: 20,
  },
  updateButton: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: colors.cardBorder,
  },
  updateButtonUpdating: {
    backgroundColor: colors.blue,
  },
  updateButtonText: {
    color: colors.background,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  storeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  storeButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '500',
    marginLeft: spacing.sm,
    fontFamily: fonts.body,
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  infoLabel: {
    fontSize: typography.body,
    color: colors.mutedText,
    fontFamily: fonts.body,
  },
  infoValue: {
    fontSize: typography.body,
    color: colors.white,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
