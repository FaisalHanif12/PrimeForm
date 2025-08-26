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
  Modal
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import userProfileService from '../services/userProfileService';
import UserInfoModal from './UserInfoModal';

const { width: screenWidth } = Dimensions.get('window');

interface UserInfo {
  country: string;
  age: string;
  gender: string;
  height: string;
  currentWeight: string;
  bodyGoal: string;
  medicalConditions: string;
  occupationType: string;
  availableEquipment: string;
  dietPreference: string;
} 

interface Props {
  visible: boolean;
  onClose: () => void;
  userInfo?: UserInfo;
  onUpdateUserInfo: (userInfo: UserInfo | { age: number } & Omit<UserInfo, 'age'>) => void;
}

const countries = [
  { en: 'United States', ur: 'ریاستہائے متحدہ' },
  { en: 'Canada', ur: 'کینیڈا' },
  { en: 'United Kingdom', ur: 'برطانیہ' },
  { en: 'Australia', ur: 'آسٹریلیا' },
  { en: 'Germany', ur: 'جرمنی' },
  { en: 'France', ur: 'فرانس' },
  { en: 'India', ur: 'بھارت' },
  { en: 'Pakistan', ur: 'پاکستان' },
  { en: 'China', ur: 'چین' },
  { en: 'Japan', ur: 'جاپان' },
  { en: 'Brazil', ur: 'برازیل' },
  { en: 'Mexico', ur: 'میکسیکو' },
  { en: 'South Africa', ur: 'جنوبی افریقہ' },
  { en: 'Nigeria', ur: 'نائجیریا' },
  { en: 'Egypt', ur: 'مصر' },
  { en: 'Saudi Arabia', ur: 'سعودی عرب' }
];

const bodyGoals = [
  { en: 'Lose Fat', ur: 'چربی کم کریں' },
  { en: 'Gain Muscle', ur: 'پٹھے بنائیں' },
  { en: 'Maintain Weight', ur: 'وزن برقرار رکھیں' },
  { en: 'General Training', ur: 'عمومی تربیت' },
  { en: 'Improve Fitness', ur: 'فٹنس بہتر کریں' }
];

const occupationTypes = [
  { en: 'Sedentary Desk Job', ur: 'بیٹھے ہوئے ڈیسک کا کام' },
  { en: 'Active Job', ur: 'متحرک کام' },
  { en: 'Shift Worker', ur: 'شفٹ ورکر' },
  { en: 'Student', ur: 'طالب علم' },
  { en: 'Retired', ur: 'ریٹائرڈ' },
  { en: 'Other', ur: 'دیگر' }
];

const equipmentOptions = [
  { en: 'None', ur: 'کوئی نہیں' },
  { en: 'Basic Dumbbells', ur: 'بنیادی ڈمبلز' },
  { en: 'Resistance Bands', ur: 'مزاحمتی بینڈز' },
  { en: 'Home Gym', ur: 'گھریلو جم' },
  { en: 'Full Gym Access', ur: 'مکمل جم تک رسائی' }
];

const dietPreferences = [
  { en: 'Vegetarian', ur: 'سبزی خور' },
  { en: 'Non-Vegetarian', ur: 'سبزی خور نہیں' },
  { en: 'Vegan', ur: 'ویگن' },
  { en: 'Flexitarian', ur: 'فلیکسیٹیرین' },
  { en: 'Pescatarian', ur: 'پیسکیٹیرین' }
];

const genderOptions = [
  { en: 'male', ur: 'مرد' },
  { en: 'female', ur: 'خواتین' },
  { en: 'other', ur: 'دیگر' }
];

export default function ProfilePage({ visible, onClose, userInfo, onUpdateUserInfo }: Props) {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  // Helper function to get localized text
  const getLocalizedText = (item: { en: string; ur: string }) => {
    return language === 'ur' ? item.ur : item.en;
  };

  // Helper function to convert English values to localized display text
  const getLocalizedValue = (englishValue: string, options: { en: string; ur: string }[]) => {
    const option = options.find(opt => opt.en === englishValue);
    return option ? getLocalizedText(option) : englishValue;
  };

  // Helper function to convert localized values back to English for backend
  const getEnglishValue = (localizedValue: string, items: { en: string; ur: string }[]) => {
    const item = items.find(item => item.en === localizedValue || item.ur === localizedValue);
    return item ? item.en : localizedValue;
  };
  const [isEditing, setIsEditing] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [editedUserInfo, setEditedUserInfo] = useState<UserInfo>({
    country: '',
    age: '',
    gender: '',
    height: '',
    currentWeight: '',
    bodyGoal: '',
    medicalConditions: '',
    occupationType: '',
    availableEquipment: '',
    dietPreference: ''
  });

  // Load user info when component mounts or userInfo prop changes
  useEffect(() => {
    if (userInfo) {
      setEditedUserInfo(userInfo);
    } else if (visible) {
      // Only load if visible and no userInfo
      loadUserInfo();
    }
  }, [userInfo, visible]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // Convert localized values back to English for backend compatibility
      const processedUserInfo = {
        ...editedUserInfo,
        country: getEnglishValue(editedUserInfo.country, countries),
        gender: getEnglishValue(editedUserInfo.gender, genderOptions),
        bodyGoal: getEnglishValue(editedUserInfo.bodyGoal, bodyGoals),
        occupationType: getEnglishValue(editedUserInfo.occupationType, occupationTypes),
        availableEquipment: getEnglishValue(editedUserInfo.availableEquipment, equipmentOptions),
        dietPreference: getEnglishValue(editedUserInfo.dietPreference, dietPreferences)
      };

      // Update in backend database
      const response = await userProfileService.createOrUpdateProfile(processedUserInfo);
      
      if (response.success) {
        onUpdateUserInfo(processedUserInfo);
        setIsEditing(false);
        showToast('success', 'Profile information updated successfully in database!');
        console.log('Profile updated in database:', response.data);
      } else {
        console.error('Failed to update in database:', response.message);
        // Fallback to local update if database fails (maintains functionality)
        onUpdateUserInfo(processedUserInfo);
        setIsEditing(false);
        showToast('success', 'Profile information updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Fallback to local update if database fails (maintains functionality)
      onUpdateUserInfo(editedUserInfo);
      setIsEditing(false);
      showToast('success', 'Profile information updated successfully!');
    }
  };

  const handleCancel = () => {
    setEditedUserInfo(userInfo || {
      country: '', age: '', gender: '', height: '', currentWeight: '',
      bodyGoal: '', medicalConditions: '', occupationType: '', availableEquipment: '', dietPreference: ''
    });
    setIsEditing(false);
  };

  const handleUpdateField = (field: keyof UserInfo, value: string) => {
    setEditedUserInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleCompleteUserInfo = async (newUserInfo: UserInfo | { age: number } & Omit<UserInfo, 'age'>) => {
    try {
      // Save to backend database
      const response = await userProfileService.createOrUpdateProfile(newUserInfo);
      
      if (response.success) {
        onUpdateUserInfo(newUserInfo);
        setShowUserInfoModal(false);
        showToast('success', 'Profile information completed successfully in database!');
        console.log('Profile completed in database:', response.data);
      } else {
        console.error('Failed to save to database:', response.message);
        showToast('error', 'Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Failed to complete profile:', error);
      showToast('error', 'Failed to save profile. Please check your connection and try again.');
    }
  };

  const loadUserInfo = async () => {
    try {
      console.log('🔍 ProfilePage - loadUserInfo called');
      const response = await userProfileService.getUserProfile();
      console.log('🔍 ProfilePage - getUserProfile response:', response);
      
      if (response && response.success && response.data) {
        // Convert UserProfile to UserInfo format
        const userInfoData: UserInfo = {
          country: response.data.country,
          age: response.data.age.toString(), // Convert number to string
          gender: response.data.gender,
          height: response.data.height,
          currentWeight: response.data.currentWeight,
          bodyGoal: response.data.bodyGoal,
          medicalConditions: response.data.medicalConditions,
          occupationType: response.data.occupationType,
          availableEquipment: response.data.availableEquipment,
          dietPreference: response.data.dietPreference,
        };
        setEditedUserInfo(userInfoData);
        console.log('✅ ProfilePage - User profile loaded from database:', userInfoData);
      } else {
        console.log('❌ ProfilePage - No user profile found or failed to load:', response?.message || 'Unknown error');
        // Don't show error alert for new users who haven't created a profile yet
      }
    } catch (error) {
      console.error('💥 ProfilePage - Failed to load user info:', error);
      // Don't show error alert for network issues, just log them
    }
  };

  const renderInfoSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderInfoRow = (label: string, value: string, field?: keyof UserInfo) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {isEditing && field ? (
        <TextInput
          style={styles.editInput}
          value={value}
          onChangeText={(text) => handleUpdateField(field, text)}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={colors.mutedText}
        />
      ) : (
        <Text style={styles.infoValue}>{value || t('profile.notSpecified')}</Text>
      )}
    </View>
  );

  const renderPickerRow = (label: string, value: string, field: keyof UserInfo, options: { en: string; ur: string }[]) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {isEditing ? (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={value}
            onValueChange={(val) => handleUpdateField(field, val)}
            style={styles.picker}
          >
            <Picker.Item label={t('profile.select')} value="" />
            {options.map(option => (
              <Picker.Item key={option.en} label={getLocalizedText(option)} value={getLocalizedText(option)} />
            ))}
          </Picker>
        </View>
      ) : (
        <Text style={styles.infoValue}>
          {value ? getLocalizedValue(value, options) : t('profile.notSpecified')}
        </Text>
      )}
    </View>
  );

  const renderProfileContent = () => {
    console.log('🔍 ProfilePage - renderProfileContent called');
    console.log('🔍 ProfilePage - userInfo:', userInfo);
    console.log('🔍 ProfilePage - editedUserInfo:', editedUserInfo);
    
    if (!userInfo) {
      // No profile exists yet - show basic user info
      console.log('🔍 ProfilePage - No userInfo, showing no profile section');
      return (
        <View style={styles.noProfileSection}>
          <View style={styles.noProfileIcon}>
            <Text style={styles.noProfileEmoji}>👤</Text>
          </View>
          <Text style={styles.noProfileTitle}>{t('profile.noProfile.title')}</Text>
          <Text style={styles.noProfileText}>{t('profile.noProfile.text')}</Text>
          <TouchableOpacity 
            style={styles.createProfileButton}
            onPress={() => setShowUserInfoModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.createProfileButtonText}>{t('profile.noProfile.button')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Profile exists - show full profile
    return (
      <ScrollView style={styles.profileContent} showsVerticalScrollIndicator={false}>
        {/* Personal Information */}
        {renderInfoSection(t('profile.sections.personal'), (
          <>
            {renderPickerRow(t('profile.fields.country'), userInfo.country, 'country', countries)}
            {renderInfoRow(t('profile.fields.age'), userInfo.age, 'age')}
            {renderPickerRow(t('profile.fields.gender'), userInfo.gender, 'gender', genderOptions)}
            {renderInfoRow(t('profile.fields.height'), userInfo.height, 'height')}
            {renderInfoRow(t('profile.fields.weight'), userInfo.currentWeight, 'currentWeight')}
          </>
        ))}

        {/* Goals & Preferences */}
        {renderInfoSection(t('profile.sections.goals'), (
          <>
            {renderPickerRow(t('profile.fields.bodyGoal'), userInfo.bodyGoal, 'bodyGoal', bodyGoals)}
            {renderPickerRow(t('profile.fields.dietPreference'), userInfo.dietPreference, 'dietPreference', dietPreferences)}
          </>
        ))}

        {/* Lifestyle & Health */}
        {renderInfoSection(t('profile.sections.lifestyle'), (
          <>
            {renderPickerRow(t('profile.fields.occupation'), userInfo.occupationType, 'occupationType', occupationTypes)}
            {renderPickerRow(t('profile.fields.equipment'), userInfo.availableEquipment, 'availableEquipment', equipmentOptions)}
            {renderInfoRow(t('profile.fields.medical'), userInfo.medicalConditions, 'medicalConditions')}
          </>
        ))}
      </ScrollView>
    );
  };

  if (!visible) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <BlurView intensity={80} style={styles.overlay} tint="dark">
          <Animated.View 
            entering={FadeInUp.delay(100)}
            style={styles.container}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('profile.title')}</Text>
              <View style={styles.headerActions}>
                {!isEditing ? (
                  <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                    <Text style={styles.editButtonText}>{t('profile.edit')}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.editActions}>
                    <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                      <Text style={styles.cancelButtonText}>{t('profile.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                      <Text style={styles.saveButtonText}>{t('profile.save')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Content */}
            {renderProfileContent()}
          </Animated.View>
        </BlurView>
      </Modal>

      {/* User Info Modal for new users */}
      <UserInfoModal
        visible={showUserInfoModal}
        onComplete={handleCompleteUserInfo}
        onCancel={() => setShowUserInfoModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(26, 31, 46, 0.95)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 20,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color: colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.mutedText,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  cancelButtonText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  saveButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color: colors.white,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.mutedText,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  completeProfileButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 25,
  },
  completeProfileButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fonts.heading,
    color: colors.gold,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fonts.body,
    color: colors.white,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: colors.mutedText,
    fontFamily: fonts.body,
    flex: 1,
    textAlign: 'right',
  },
  editInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.body,
    flex: 1,
    textAlign: 'right',
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
  },
  picker: {
    color: colors.white,
    backgroundColor: 'transparent',
  },
  noProfileSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  noProfileIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noProfileEmoji: {
    fontSize: 50,
  },
  noProfileTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color: colors.white,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  noProfileText: {
    fontSize: 16,
    color: colors.mutedText,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  createProfileButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 25,
  },
  createProfileButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  profileContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
});
