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
  Modal,
  ActivityIndicator,
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
  targetWeight: string;
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
  onUpdateUserInfo?: (userInfo: UserInfo | { age: number } & Omit<UserInfo, 'age'>) => void;
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
  const { t, language, transliterateText } = useLanguage();
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
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasCheckedExisting, setHasCheckedExisting] = useState(false);
  const [editedUserInfo, setEditedUserInfo] = useState<UserInfo>({
    country: '',
    age: '',
    gender: '',
    height: '',
    currentWeight: '',
    targetWeight: '',
    bodyGoal: '',
    medicalConditions: '',
    occupationType: '',
    availableEquipment: '',
    dietPreference: ''
  });

  // Sync editedUserInfo when userInfo prop changes (no API call - data comes from parent)
  useEffect(() => {
    if (userInfo) {
      // Convert UserProfile format to UserInfo format for editing
      const convertedUserInfo: UserInfo = {
        country: (userInfo as any).country || '',
        age: (userInfo as any).age ? String((userInfo as any).age) : '',
        gender: (userInfo as any).gender || '',
        height: (userInfo as any).height || '',
        currentWeight: (userInfo as any).currentWeight || '',
        targetWeight: (userInfo as any).targetWeight || '',
        bodyGoal: (userInfo as any).bodyGoal || '',
        medicalConditions: (userInfo as any).medicalConditions || '',
        occupationType: (userInfo as any).occupationType || '',
        availableEquipment: (userInfo as any).availableEquipment || '',
        dietPreference: (userInfo as any).dietPreference || '',
      };
      setEditedUserInfo(convertedUserInfo);
      setLoadError(null);
      setHasCheckedExisting(true);
    }
    // Note: No API call here - profile data is passed from parent component
    // API is only called when user saves/updates their profile
  }, [userInfo]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setIsInitialLoading(false);
      setLoadError(null);
      setHasCheckedExisting(false);
      setIsEditing(false);
    }
  }, [visible]);

  // ✅ CRITICAL: Check for cached profile when modal opens
  // This ensures profile data is loaded even if parent component hasn't loaded it yet
  useEffect(() => {
    let isCancelled = false;

    const checkProfile = async () => {
      // Only check if modal is visible and we don't already have userInfo
      if (!visible) {
        return;
      }

      // If we already have userInfo from parent, don't reload
      if (userInfo) {
        setHasCheckedExisting(true);
        return;
      }

      // If we've already checked and found nothing, don't check again
      if (hasCheckedExisting) {
        return;
      }

      console.log('🔍 ProfilePage: Loading profile from cache...');

      // First, quickly check cached data (fast, no loading needed)
      try {
        const cachedData = await userProfileService.getCachedData();
        console.log('🔍 ProfilePage: Cached data result:', cachedData ? 'found' : 'not found');
        
        if (cachedData && cachedData.success && cachedData.data) {
          // Validate cached data belongs to current user
          const { getCurrentUserId, validateCachedData } = await import('../utils/cacheKeys');
          const userId = await getCurrentUserId();
          if (userId && validateCachedData(cachedData.data, userId)) {
            console.log('✅ ProfilePage: Valid cached profile found, updating parent');
            // We have cached profile data - use it immediately
            if (onUpdateUserInfo) {
              onUpdateUserInfo(cachedData.data as any);
            }
            setHasCheckedExisting(true);
            return; // Don't make API call if we have valid cached data
          } else {
            console.log('⚠️ ProfilePage: Cached data validation failed');
          }
        }
      } catch (error) {
        console.error('❌ ProfilePage: Error loading cached data:', error);
        // Ignore cache errors, continue to check API
      }

      // No cached data found - check API
      console.log('🔍 ProfilePage: No cached data, checking API...');
      setHasCheckedExisting(true);
      setIsInitialLoading(false);

      // Check API in background (non-blocking)
      // This ensures we catch any profile that might exist on server but wasn't cached
      try {
        const response = await userProfileService.getUserProfile();

        if (isCancelled) return;

        // ✅ CRITICAL: Handle undefined/null responses gracefully
        if (response && typeof response === 'object' && 'success' in response) {
          if (response.success && response.data) {
            console.log('✅ ProfilePage: Profile found on server, updating parent');
            // We found a profile on server - update parent
            if (onUpdateUserInfo) {
              onUpdateUserInfo(response.data as any);
            }
          } else {
            console.log('ℹ️ ProfilePage: No profile found on server');
          }
        } else {
          // Response is not in expected format - log for debugging
          console.warn('⚠️ ProfilePage: Unexpected response format:', response);
        }
        // If no profile found, that's fine - user can create one
      } catch (error) {
        console.error('❌ ProfilePage: Error loading from API:', error);
        // Ignore API errors - user can still create profile
      }
    };

    // Always check when modal becomes visible
    if (visible) {
      checkProfile();
    }

    return () => {
      isCancelled = true;
    };
  }, [visible, userInfo, hasCheckedExisting, onUpdateUserInfo]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // Convert age to number for backend compatibility
      const ageNumber = parseInt(editedUserInfo.age, 10);
      
      // Validate age conversion
      if (isNaN(ageNumber) || ageNumber < 13 || ageNumber > 120) {
        showToast('error', 'Please enter a valid age between 13 and 120');
        return;
      }

      // Convert localized values back to English for backend compatibility
      const processedUserInfo = {
        ...editedUserInfo,
        age: ageNumber, // Ensure age is a number
        country: getEnglishValue(editedUserInfo.country, countries),
        gender: getEnglishValue(editedUserInfo.gender, genderOptions),
        bodyGoal: getEnglishValue(editedUserInfo.bodyGoal, bodyGoals),
        occupationType: getEnglishValue(editedUserInfo.occupationType, occupationTypes),
        availableEquipment: getEnglishValue(editedUserInfo.availableEquipment, equipmentOptions),
        dietPreference: getEnglishValue(editedUserInfo.dietPreference, dietPreferences),
        // Always send targetWeight so clearing the field removes it server-side
        targetWeight: editedUserInfo.targetWeight?.trim?.() ?? ''
      };

      // Update in backend database
      const response = await userProfileService.createOrUpdateProfile(processedUserInfo);
      
      if (response.success) {
        if (onUpdateUserInfo) {
          onUpdateUserInfo(processedUserInfo);
        }
        setIsEditing(false);
        showToast('success', 'Profile information updated successfully in database!');
      } else {
        showToast('error', `Failed to update profile: ${response.message}`);
      }
    } catch (error) {
      showToast('error', 'Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditedUserInfo(userInfo || {
      country: '', age: '', gender: '', height: '', currentWeight: '', targetWeight: '',
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
        if (onUpdateUserInfo) {
          onUpdateUserInfo(newUserInfo);
        }
        setShowUserInfoModal(false);
        showToast('success', 'Profile information completed successfully in database!');
      } else {
        showToast('error', 'Failed to save profile. Please try again.');
      }
    } catch (error) {
      showToast('error', 'Failed to save profile. Please check your connection and try again.');
    }
  };

  const renderInfoSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderInfoRow = (label: string, value: string, field?: keyof UserInfo) => {
    // For dynamic values, use transliteration if in Urdu mode
    // Convert value to string and handle null/undefined
    const valueStr = value != null ? String(value) : '';
    const displayValue = valueStr ? (language === 'ur' ? transliterateText(valueStr) : valueStr) : '';
    const displayLabel = t(label);
    const notSpecifiedText = t('profile.notSpecified');
    
    return (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{displayLabel}</Text>
        {isEditing && field ? (
          <TextInput
            style={styles.editInput}
            value={value}
            onChangeText={(text) => handleUpdateField(field, text)}
            placeholder={`Enter ${label.toLowerCase()}`}
            placeholderTextColor={colors.mutedText}
          />
        ) : (
          <Text style={styles.infoValue}>{displayValue || notSpecifiedText}</Text>
        )}
      </View>
    );
  };

  const renderPickerRow = (label: string, value: string, field: keyof UserInfo, options: { en: string; ur: string }[]) => {
    const displayLabel = t(label);
    const notSpecifiedText = t('profile.notSpecified');
    const selectText = t('profile.select');
    
    return (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{displayLabel}</Text>
        {isEditing ? (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={value}
              onValueChange={(val) => handleUpdateField(field, val)}
              style={styles.picker}
            >
              <Picker.Item label={selectText} value="" />
              {options.map(option => (
                <Picker.Item key={option.en} label={getLocalizedText(option)} value={getLocalizedText(option)} />
              ))}
            </Picker>
          </View>
        ) : (
          <Text style={styles.infoValue}>
            {value ? getLocalizedValue(value, options) : notSpecifiedText}
          </Text>
        )}
      </View>
    );
  };

  const renderProfileContent = () => {
    // Only show loading if we're actively checking and haven't determined status yet
    // For new users, we immediately show profile creation form
    if (isInitialLoading && !hasCheckedExisting) {
      return (
        <View style={styles.noProfileSection}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.noProfileText}>{t('profile.loading')}</Text>
        </View>
      );
    }

    if (loadError) {
      return (
        <View style={styles.noProfileSection}>
          <View style={styles.noProfileIcon}>
            <Text style={styles.noProfileEmoji}>⚠️</Text>
          </View>
          <Text style={styles.noProfileTitle}>{t('profile.error.title')}</Text>
          <Text style={styles.noProfileText}>{loadError}</Text>
          <TouchableOpacity
            style={styles.createProfileButton}
            onPress={() => {
              // Allow retry
              setHasCheckedExisting(false);
              setLoadError(null);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.createProfileButtonText}>{t('profile.error.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // For new users (no userInfo and checked), immediately show profile creation form
    // This is the critical fix - don't wait for API, show form immediately
    if (!userInfo && hasCheckedExisting) {
      // No profile exists yet - immediately show profile creation form
      return (
        <View style={styles.noProfileSection}>
          <View style={styles.noProfileIcon}>
            <Text style={styles.noProfileEmoji}>👤</Text>
          </View>
          <Text style={styles.noProfileTitle}>{t('profile.complete.title')}</Text>
          <Text style={styles.noProfileText}>{t('profile.complete.text')}</Text>
          <TouchableOpacity 
            style={styles.createProfileButton}
            onPress={() => setShowUserInfoModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.createProfileButtonText}>{t('profile.complete.button')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Profile exists - show full profile (safe guard for missing props)
    const safeUserInfo = userInfo || {} as any;
    const displayValue = (field: keyof UserInfo) => {
      const val = isEditing ? editedUserInfo[field] : safeUserInfo[field];
      return val != null ? String(val) : '';
    };
    const displayGoal = (isEditing ? editedUserInfo.bodyGoal : safeUserInfo.bodyGoal) || '';

    return (
      <ScrollView style={styles.profileContent} showsVerticalScrollIndicator={false}>
        {/* Personal Information */}
        {renderInfoSection(t('profile.sections.personal'), (
          <>
            {renderPickerRow('profile.fields.country', displayValue('country'), 'country', countries)}
            {renderInfoRow('profile.fields.age', displayValue('age'), 'age')}
            {renderPickerRow('profile.fields.gender', displayValue('gender'), 'gender', genderOptions)}
            {renderInfoRow('profile.fields.height', displayValue('height'), 'height')}
            {renderInfoRow('profile.fields.weight', displayValue('currentWeight'), 'currentWeight')}
            {/* Show target weight field if body goal requires it */}
            {(displayGoal === 'Lose Fat' || displayGoal === 'Gain Muscle' || displayGoal === 'چربی کم کریں' || displayGoal === 'پٹھے بنائیں') && (
              renderInfoRow('profile.fields.targetWeight', displayValue('targetWeight'), 'targetWeight')
            )}
          </>
        ))}

        {/* Goals & Preferences */}
        {renderInfoSection(t('profile.sections.goals'), (
          <>
            {renderPickerRow('profile.fields.bodyGoal', displayValue('bodyGoal'), 'bodyGoal', bodyGoals)}
            {renderPickerRow('profile.fields.dietPreference', displayValue('dietPreference'), 'dietPreference', dietPreferences)}
          </>
        ))}

        {/* Lifestyle & Health */}
        {renderInfoSection(t('profile.sections.lifestyle'), (
          <>
            {renderPickerRow('profile.fields.occupation', displayValue('occupationType'), 'occupationType', occupationTypes)}
            {renderPickerRow('profile.fields.equipment', displayValue('availableEquipment'), 'availableEquipment', equipmentOptions)}
            {renderInfoRow('profile.fields.medical', displayValue('medicalConditions'), 'medicalConditions')}
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
    backgroundColor: colors.background,
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
