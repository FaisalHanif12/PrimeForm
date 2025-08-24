import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  TextInput,
  Dimensions,
  Alert
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  onComplete: (userInfo: UserInfo) => void;
  onCancel: () => void;
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

export default function UserInfoModal({ visible, onComplete, onCancel }: Props) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [userInfo, setUserInfo] = useState<UserInfo>({
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

  const totalSteps = 4;

  const updateUserInfo = (field: keyof UserInfo, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Validate required fields
    const requiredFields = ['country', 'age', 'gender', 'height', 'currentWeight', 'bodyGoal'];
    const missingFields = requiredFields.filter(field => !userInfo[field as keyof UserInfo]);
    
    if (missingFields.length > 0) {
      Alert.alert('Missing Information', 'Please fill in all required fields before continuing.');
      return;
    }

    onComplete(userInfo);
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('userinfo.personal.info')}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.country')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={userInfo.country}
            onValueChange={(value) => updateUserInfo('country', value)}
            style={styles.picker}
          >
            <Picker.Item label={t('userinfo.select.country')} value="" />
            {countries.map(country => (
              <Picker.Item key={country} label={country} value={country} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.age')}</Text>
        <TextInput
          style={styles.textInput}
          value={userInfo.age}
          onChangeText={(value) => updateUserInfo('age', value)}
          placeholder="25"
          placeholderTextColor={colors.mutedText}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.gender')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={userInfo.gender}
            onValueChange={(value) => updateUserInfo('gender', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select your gender" value="" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.height')}</Text>
        <TextInput
          style={styles.textInput}
          value={userInfo.height}
          onChangeText={(value) => updateUserInfo('height', value)}
          placeholder="175 cm"
          placeholderTextColor={colors.mutedText}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Physical Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Height *</Text>
        <TextInput
          style={styles.textInput}
          value={userInfo.height}
          onChangeText={(value) => updateUserInfo('height', value)}
          placeholder={'e.g., 5\'8" or 172 cm'}
          placeholderTextColor={colors.mutedText}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.current.weight')} *</Text>
        <TextInput
          style={styles.textInput}
          value={userInfo.currentWeight}
          onChangeText={(value) => updateUserInfo('currentWeight', value)}
          placeholder="e.g., 70 kg or 154 lbs"
          placeholderTextColor={colors.mutedText}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.body.goal')} *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={userInfo.bodyGoal}
            onValueChange={(value) => updateUserInfo('bodyGoal', value)}
            style={styles.picker}
          >
            <Picker.Item label={t('userinfo.select.goal')} value="" />
            {bodyGoals.map(goal => (
              <Picker.Item key={goal} label={goal} value={goal} />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Lifestyle & Health</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Medical Conditions</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={userInfo.medicalConditions}
          onChangeText={(value) => updateUserInfo('medicalConditions', value)}
          placeholder="e.g., diabetes, hypertension, PCOS, heart issues (or none)"
          placeholderTextColor={colors.mutedText}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.occupation')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={userInfo.occupationType}
            onValueChange={(value) => updateUserInfo('occupationType', value)}
            style={styles.picker}
          >
            <Picker.Item label={t('userinfo.select.occupation')} value="" />
            {occupationTypes.map(type => (
              <Picker.Item key={type} label={type} value={type} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.equipment')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={userInfo.availableEquipment}
            onValueChange={(value) => updateUserInfo('availableEquipment', value)}
            style={styles.picker}
          >
            <Picker.Item label={t('userinfo.select.equipment')} value="" />
            {equipmentOptions.map(equipment => (
              <Picker.Item key={equipment} label={equipment} value={equipment} />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('userinfo.diet.preferences')}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.diet.preference')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={userInfo.dietPreference}
            onValueChange={(value) => updateUserInfo('dietPreference', value)}
            style={styles.picker}
          >
            <Picker.Item label={t('userinfo.select.diet')} value="" />
            {dietPreferences.map(pref => (
              <Picker.Item key={pref} label={pref} value={pref} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>{t('userinfo.summary.title')}</Text>
        <Text style={styles.summaryText}>
          {t('userinfo.summary.text')}
        </Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView intensity={80} style={styles.overlay} tint="dark">
        <Animated.View entering={FadeInDown.delay(100)} style={styles.modalContainer}>
          <Animated.View 
            style={styles.modalContent}
            entering={FadeInUp.delay(200)}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{t('userinfo.title')}</Text>
              <Text style={styles.subtitle}>{t('userinfo.step')} {currentStep} {t('userinfo.of')} {totalSteps}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(currentStep / totalSteps) * 100}%` }
                  ]} 
                />
              </View>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContent}
              bounces={true}
              alwaysBounceVertical={false}
            >
              {renderCurrentStep()}
            </ScrollView>

            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
              {currentStep > 1 && (
                <TouchableOpacity 
                  style={styles.secondaryButton} 
                  onPress={prevStep}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>{t('userinfo.previous')}</Text>
                </TouchableOpacity>
              )}
              
              {currentStep < totalSteps ? (
                <TouchableOpacity 
                  style={styles.primaryButton} 
                  onPress={nextStep}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>{t('userinfo.next')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.primaryButton} 
                  onPress={handleComplete}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>{t('userinfo.complete')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>{t('userinfo.cancel')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    // Ensure overlay allows for full content scrolling
  },
  modalContainer: {
    width: '100%',
    maxWidth: Math.min(screenWidth - 32, 450),
    // Remove maxHeight constraint to allow full content
    // Allow modal to expand as needed
    maxHeight: screenHeight * 0.95, // Allow up to 95% of screen height
  },
  modalContent: {
    backgroundColor: 'rgba(26, 31, 46, 0.95)',
    borderRadius: 28,
    padding: spacing.xl + 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 25,
    },
    shadowOpacity: 0.4,
    shadowRadius: 50,
    elevation: 25,
    // Remove height constraints to allow content to expand
    // Ensure content can scroll within the modal
    maxHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.mutedText,
    fontFamily: fonts.body,
  },
  progressContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 3,
  },
  content: {
    width: '100%',
    marginBottom: spacing.lg,
    // Ensure content can scroll properly
    flexGrow: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.md,
  },
  stepContainer: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: fonts.heading,
    color: colors.white,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.body,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.body,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    color: colors.white,
    backgroundColor: 'transparent',
  },
  summaryContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fonts.heading,
    color: colors.gold,
    marginBottom: spacing.xs,
  },
  summaryText: {
    fontSize: 14,
    color: colors.mutedText,
    fontFamily: fonts.body,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginBottom: spacing.md,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.gold,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  cancelButtonText: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
});
