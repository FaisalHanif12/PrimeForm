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
  onUpdateUserInfo: (userInfo: UserInfo) => void;
}

const countries = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'India', 'Pakistan',
  'China', 'Japan', 'Brazil', 'Mexico', 'South Africa', 'Nigeria', 'Egypt', 'Saudi Arabia'
];

const bodyGoals = [
  'Lose Fat', 'Gain Muscle', 'Maintain Weight', 'General Training', 'Improve Fitness'
];

const occupationTypes = [
  'Sedentary Desk Job', 'Active Job', 'Shift Worker', 'Student', 'Retired', 'Other'
];

const equipmentOptions = [
  'None', 'Basic Dumbbells', 'Resistance Bands', 'Home Gym', 'Full Gym Access'
];

const dietPreferences = [
  'Vegetarian', 'Non-Vegetarian', 'Vegan', 'Flexitarian', 'Pescatarian'
];

export default function ProfilePage({ visible, onClose, userInfo, onUpdateUserInfo }: Props) {
  const { t } = useLanguage();
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

  useEffect(() => {
    if (userInfo) {
      setEditedUserInfo(userInfo);
    }
  }, [userInfo]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdateUserInfo(editedUserInfo);
    setIsEditing(false);
    Alert.alert('Success', 'Profile information updated successfully!');
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

  const handleCompleteUserInfo = (newUserInfo: UserInfo) => {
    onUpdateUserInfo(newUserInfo);
    setShowUserInfoModal(false);
    Alert.alert('Success', 'Profile information completed successfully!');
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
        <Text style={styles.infoValue}>{value || 'Not specified'}</Text>
      )}
    </View>
  );

  const renderPickerRow = (label: string, value: string, field: keyof UserInfo, options: string[]) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {isEditing ? (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={value}
            onValueChange={(val) => handleUpdateField(field, val)}
            style={styles.picker}
          >
            <Picker.Item label="Select..." value="" />
            {options.map(option => (
              <Picker.Item key={option} label={option} value={option} />
            ))}
          </Picker>
        </View>
      ) : (
        <Text style={styles.infoValue}>{value || 'Not specified'}</Text>
      )}
    </View>
  );

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
              <Text style={styles.headerTitle}>Profile</Text>
              <View style={styles.headerActions}>
                {!isEditing ? (
                  <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.editActions}>
                    <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {!userInfo || Object.values(userInfo).every(val => !val) ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>Complete Your Profile</Text>
                  <Text style={styles.emptyStateText}>
                    To get personalized diet and workout plans, we need some information about you.
                  </Text>
                  <TouchableOpacity 
                    style={styles.completeProfileButton}
                    onPress={() => setShowUserInfoModal(true)}
                  >
                    <Text style={styles.completeProfileButtonText}>Complete Profile</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Basic Information */}
                  {renderInfoSection('Basic Information', (
                    <>
                      {renderInfoRow('Country', editedUserInfo.country, 'country')}
                      {renderInfoRow('Age', editedUserInfo.age, 'age')}
                      {renderPickerRow('Gender', editedUserInfo.gender, 'gender', ['Male', 'Female', 'Other'])}
                    </>
                  ))}

                  {/* Physical Information */}
                  {renderInfoSection('Physical Information', (
                    <>
                      {renderInfoRow('Height', editedUserInfo.height, 'height')}
                      {renderInfoRow('Current Weight', editedUserInfo.currentWeight, 'currentWeight')}
                      {renderPickerRow('Body Goal', editedUserInfo.bodyGoal, 'bodyGoal', bodyGoals)}
                    </>
                  ))}

                  {/* Lifestyle & Health */}
                  {renderInfoSection('Lifestyle & Health', (
                    <>
                      {renderInfoRow('Medical Conditions', editedUserInfo.medicalConditions, 'medicalConditions')}
                      {renderPickerRow('Occupation Type', editedUserInfo.occupationType, 'occupationType', occupationTypes)}
                      {renderPickerRow('Available Equipment', editedUserInfo.availableEquipment, 'availableEquipment', equipmentOptions)}
                    </>
                  ))}

                  {/* Diet Preferences */}
                  {renderInfoSection('Diet Preferences', (
                    <>
                      {renderPickerRow('Diet Preference', editedUserInfo.dietPreference, 'dietPreference', dietPreferences)}
                    </>
                  ))}
                </>
              )}
            </ScrollView>
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
});
