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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import { useToast } from '../../src/context/ToastContext';
import DashboardHeader from '../../src/components/DashboardHeader';
import Sidebar from '../../src/components/Sidebar';
import { useAuthContext } from '../../src/context/AuthContext';

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
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    workoutReminders: true,
    dietReminders: true,
  });

  const [softwareUpdate, setSoftwareUpdate] = useState<SoftwareUpdate>({
    version: '1.0',
    available: true,
    size: '15.2 MB',
    releaseDate: '2024-01-15',
    description: 'Bug fixes and performance improvements'
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleProfilePress = () => {
    setSidebarVisible(true);
  };

  const handleNotificationPress = () => {
    showToast('info', 'Notifications are coming soon!');
  };

  const handleSidebarMenuPress = async (action: string) => {
    try {
      switch (action) {
        case 'profile':
          router.push('/(dashboard)');
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
        default:
          console.log('Unknown sidebar action:', action);
      }
    } catch (error) {
      console.error('Sidebar action failed:', error);
      showToast('error', 'Unable to complete that action. Please try again.');
    } finally {
      setSidebarVisible(false);
    }
  };

  // Load saved notification settings
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      // In a real app, you would load these from AsyncStorage or your backend
      // For now, we'll use the default values
      console.log('Loading notification settings...');
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const saveNotificationSettings = async (settings: NotificationSettings) => {
    try {
      // In a real app, you would save these to AsyncStorage or your backend
      console.log('Saving notification settings:', settings);
      showToast('success', 'Notification settings saved successfully!');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      showToast('error', 'Failed to save notification settings');
    }
  };

  const handleNotificationToggle = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
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
          <Text style={styles.infoValue}>PrimeForm</Text>
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
        notificationCount={0}
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
        userEmail={user?.email || 'user@primeform.com'}
        isGuest={!isAuthenticated}
        userInfo={null}
        badges={[]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
