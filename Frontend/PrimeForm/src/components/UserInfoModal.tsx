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
  targetWeight: string;
  bodyGoal: string;
  medicalConditions: string;
  occupationType: string;
  availableEquipment: string;
  dietPreference: string;
}

interface Props {
  visible: boolean;
  onComplete: (userInfo: UserInfo | { age: number } & Omit<UserInfo, 'age'>) => void;
  onCancel: () => void;
}

// Prioritized countries list - most important countries first
const countries = [
  // Top tier - Most common
  { en: 'United States', ur: 'ریاستہائے متحدہ' },
  { en: 'Pakistan', ur: 'پاکستان' },
  { en: 'United Kingdom', ur: 'برطانیہ' },
  { en: 'Canada', ur: 'کینیڈا' },
  { en: 'Australia', ur: 'آسٹریلیا' },
  // Second tier - Major countries
  { en: 'Germany', ur: 'جرمنی' },
  { en: 'France', ur: 'فرانس' },
  { en: 'Brazil', ur: 'برازیل' },
  { en: 'Japan', ur: 'جاپان' },
  { en: 'China', ur: 'چین' },
  { en: 'Mexico', ur: 'میکسیکو' },
  // Third tier - Other significant countries
  { en: 'South Korea', ur: 'جنوبی کوریا' },
  { en: 'Italy', ur: 'اٹلی' },
  { en: 'Spain', ur: 'ہسپانیہ' },
  { en: 'Netherlands', ur: 'نیدرلینڈز' },
  { en: 'Switzerland', ur: 'سوئٹزرلینڈ' },
  { en: 'Sweden', ur: 'سویڈن' },
  { en: 'Norway', ur: 'ناروے' },
  { en: 'Denmark', ur: 'ڈنمارک' },
  { en: 'Finland', ur: 'فن لینڈ' },
  { en: 'Belgium', ur: 'بیلجیم' },
  { en: 'Austria', ur: 'آسٹریا' },
  { en: 'Portugal', ur: 'پرتگال' },
  { en: 'Poland', ur: 'پولینڈ' },
  { en: 'Czech Republic', ur: 'چیک جمہوریہ' },
  { en: 'Hungary', ur: 'ہنگری' },
  { en: 'Romania', ur: 'رومانیہ' },
  { en: 'Bulgaria', ur: 'بلغاریہ' },
  { en: 'Greece', ur: 'یونان' },
  { en: 'Turkey', ur: 'ترکی' },
  { en: 'Russia', ur: 'روس' },
  { en: 'Ukraine', ur: 'یوکرین' },
  { en: 'Belarus', ur: 'بیلاروس' },
  { en: 'Latvia', ur: 'لٹویا' },
  { en: 'Lithuania', ur: 'لتھوانیا' },
  { en: 'Estonia', ur: 'اسٹونیا' },
  { en: 'India', ur: 'بھارت' },
  { en: 'Bangladesh', ur: 'بنگلہ دیش' },
  { en: 'Sri Lanka', ur: 'سری لنکا' },
  { en: 'Nepal', ur: 'نیپال' },
  { en: 'Myanmar', ur: 'میانمار' },
  { en: 'Thailand', ur: 'تھائی لینڈ' },
  { en: 'Vietnam', ur: 'ویتنام' },
  { en: 'Cambodia', ur: 'کمبوڈیا' },
  { en: 'Laos', ur: 'لاؤس' },
  { en: 'Malaysia', ur: 'ملائیشیا' },
  { en: 'Singapore', ur: 'سنگاپور' },
  { en: 'Indonesia', ur: 'انڈونیشیا' },
  { en: 'Philippines', ur: 'فلپائن' },
  { en: 'Taiwan', ur: 'تائیوان' },
  { en: 'Hong Kong', ur: 'ہانگ کانگ' },
  { en: 'South Africa', ur: 'جنوبی افریقہ' },
  { en: 'Nigeria', ur: 'نائجیریا' },
  { en: 'Kenya', ur: 'کینیا' },
  { en: 'Ghana', ur: 'گھانا' },
  { en: 'Uganda', ur: 'یوگنڈا' },
  { en: 'Tanzania', ur: 'تنزانیہ' },
  { en: 'Ethiopia', ur: 'ایتھوپیا' },
  { en: 'Morocco', ur: 'مراکش' },
  { en: 'Egypt', ur: 'مصر' },
  { en: 'Tunisia', ur: 'تونس' },
  { en: 'Algeria', ur: 'الجزائر' },
  { en: 'Libya', ur: 'لیبیا' },
  { en: 'Sudan', ur: 'سوڈان' },
  { en: 'Chad', ur: 'چاڈ' },
  { en: 'Niger', ur: 'نائجر' },
  { en: 'Mali', ur: 'مالی' },
  { en: 'Senegal', ur: 'سینیگال' },
  { en: 'Guinea', ur: 'گنی' },
  { en: 'Sierra Leone', ur: 'سیرا لیون' },
  { en: 'Liberia', ur: 'لائبیریا' },
  { en: 'Ivory Coast', ur: 'آئیوری کوسٹ' },
  { en: 'Burkina Faso', ur: 'برکینا فاسو' },
  { en: 'Saudi Arabia', ur: 'سعودی عرب' },
  { en: 'UAE', ur: 'متحدہ عرب امارات' },
  { en: 'Qatar', ur: 'قطر' },
  { en: 'Kuwait', ur: 'کویت' },
  { en: 'Bahrain', ur: 'بحرین' },
  { en: 'Oman', ur: 'عمان' },
  { en: 'Yemen', ur: 'یمن' },
  { en: 'Jordan', ur: 'اردن' },
  { en: 'Lebanon', ur: 'لبنان' },
  { en: 'Syria', ur: 'شام' },
  { en: 'Iraq', ur: 'عراق' },
  { en: 'Iran', ur: 'ایران' },
  { en: 'Afghanistan', ur: 'افغانستان' }
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

export default function UserInfoModal({ visible, onComplete, onCancel }: Props) {
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [userInfo, setUserInfo] = useState<UserInfo>({
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
  const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({});

  // Helper function to get localized text
  const getLocalizedText = (item: { en: string; ur: string }) => {
    return language === 'ur' ? item.ur : item.en;
  };

  // Helper function to convert localized values back to English for backend
  const getEnglishValue = (localizedValue: string, items: { en: string; ur: string }[]) => {
    const item = items.find(item => item.en === localizedValue || item.ur === localizedValue);
    return item ? item.en : localizedValue;
  };

  const totalSteps = 4;

  const updateUserInfo = (field: keyof UserInfo, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const validateCurrentStep = () => {
    const errors: {[key: string]: boolean} = {};
    
    switch (currentStep) {
      case 1:
        if (!userInfo.country) errors.country = true;
        if (!userInfo.age) errors.age = true;
        if (!userInfo.gender) errors.gender = true;
        if (!userInfo.height) errors.height = true;
        break;
      case 2:
        if (!userInfo.currentWeight) errors.currentWeight = true;
        if (!userInfo.bodyGoal) errors.bodyGoal = true;
        // Validate target weight only if body goal requires it
        if ((userInfo.bodyGoal === 'Lose Fat' || userInfo.bodyGoal === 'Gain Muscle') && !userInfo.targetWeight) {
          errors.targetWeight = true;
        }
        break;
      case 3:
        if (!userInfo.occupationType) errors.occupationType = true;
        if (!userInfo.availableEquipment) errors.availableEquipment = true;
        break;
      case 4:
        if (!userInfo.dietPreference) errors.dietPreference = true;
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      if (validateCurrentStep()) {
        setCurrentStep(currentStep + 1);
      }
      // No alert - just show the red error lines under inputs
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (validateCurrentStep()) {
      // Convert age to number for backend compatibility
      const ageNumber = parseInt(userInfo.age, 10);
      
      // Validate age conversion
      if (isNaN(ageNumber) || ageNumber < 13 || ageNumber > 120) {
        // Show error under age input instead of alert
        setValidationErrors(prev => ({ ...prev, age: true }));
        return;
      }
      
      const processedUserInfo = {
        ...userInfo,
        age: ageNumber,
        // Convert localized values back to English for backend compatibility
        country: getEnglishValue(userInfo.country, countries),
        gender: getEnglishValue(userInfo.gender, genderOptions),
        bodyGoal: getEnglishValue(userInfo.bodyGoal, bodyGoals),
        occupationType: getEnglishValue(userInfo.occupationType, occupationTypes),
        availableEquipment: getEnglishValue(userInfo.availableEquipment, equipmentOptions),
        dietPreference: getEnglishValue(userInfo.dietPreference, dietPreferences)
      };
      onComplete(processedUserInfo);
    }
    // No alert - just show the red error lines under inputs
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('step.personal.info')}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.country')} *</Text>
        <View style={[styles.pickerContainer, validationErrors.country && styles.inputError]}>
          <Picker
            selectedValue={userInfo.country}
            onValueChange={(value) => updateUserInfo('country', value)}
            style={styles.picker}
          >
            <Picker.Item label={t('dropdown.select.country')} value="" />
            {countries.map(country => (
              <Picker.Item key={country.en} label={`🏳️ ${getLocalizedText(country)}`} value={getLocalizedText(country)} />
            ))}
          </Picker>
        </View>
        {validationErrors.country && (
          <Text style={styles.errorText}>{t('validation.country.required')}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.age')} *</Text>
        <TextInput
          style={[styles.textInput, validationErrors.age && styles.inputError]}
          value={userInfo.age}
          onChangeText={(value) => updateUserInfo('age', value)}
          placeholder={t('placeholder.age')}
          placeholderTextColor={colors.mutedText}
          keyboardType="numeric"
        />
        {validationErrors.age && (
          <Text style={styles.errorText}>{t('validation.age.required')}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.gender')} *</Text>
        <View style={[styles.pickerContainer, validationErrors.gender && styles.inputError]}>
          <Picker
            selectedValue={userInfo.gender}
            onValueChange={(value) => updateUserInfo('gender', value)}
            style={styles.picker}
          >
            <Picker.Item label={t('dropdown.select.gender')} value="" />
            {genderOptions.map(gender => (
              <Picker.Item 
                key={gender.en} 
                label={`${gender.en === 'male' ? '👨' : gender.en === 'female' ? '👩' : '🌈'} ${getLocalizedText(gender)}`} 
                value={getLocalizedText(gender)} 
              />
            ))}
          </Picker>
        </View>
        {validationErrors.gender && (
          <Text style={styles.errorText}>{t('validation.gender.required')}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.height')} *</Text>
        <TextInput
          style={[styles.textInput, validationErrors.height && styles.inputError]}
          value={userInfo.height}
          onChangeText={(value) => updateUserInfo('height', value)}
          placeholder={t('placeholder.height')}
          placeholderTextColor={colors.mutedText}
        />
        {validationErrors.height && (
          <Text style={styles.errorText}>{t('validation.height.required')}</Text>
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('step.physical.info')}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.current.weight')} *</Text>
        <TextInput
          style={[styles.textInput, validationErrors.currentWeight && styles.inputError]}
          value={userInfo.currentWeight}
          onChangeText={(value) => updateUserInfo('currentWeight', value)}
          placeholder={t('placeholder.weight')}
          placeholderTextColor={colors.mutedText}
        />
        {validationErrors.currentWeight && (
          <Text style={styles.errorText}>{t('validation.weight.required')}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.body.goal')} *</Text>
        <View style={[styles.pickerContainer, validationErrors.bodyGoal && styles.inputError]}>
          <Picker
            selectedValue={userInfo.bodyGoal}
            onValueChange={(value) => updateUserInfo('bodyGoal', value)}
            style={styles.picker}
          >
            <Picker.Item label={t('dropdown.select.goal')} value="" />
            {bodyGoals.map(goal => (
              <Picker.Item 
                key={goal.en} 
                label={`${goal.en === 'Lose Fat' ? '🔥' : goal.en === 'Gain Muscle' ? '💪' : goal.en === 'Maintain Weight' ? '⚖️' : goal.en === 'General Training' ? '🏃‍♂️' : '🌟'} ${getLocalizedText(goal)}`} 
                value={getLocalizedText(goal)} 
              />
            ))}
          </Picker>
        </View>
        {validationErrors.bodyGoal && (
          <Text style={styles.errorText}>{t('validation.goal.required')}</Text>
        )}
      </View>

      {/* Conditional Target Weight Field */}
      {(userInfo.bodyGoal === 'Lose Fat' || userInfo.bodyGoal === 'Gain Muscle') && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('profile.summary.target.weight')} *</Text>
          <TextInput
            style={[styles.textInput, validationErrors.targetWeight && styles.inputError]}
            value={userInfo.targetWeight}
            onChangeText={(value) => updateUserInfo('targetWeight', value)}
            placeholder={
              language === 'ur'
                ? userInfo.bodyGoal === 'Lose Fat'
                  ? 'آپ کتنا وزن کم کرنا چاہتے ہیں؟ (کلوگرام میں)'
                  : 'آپ کتنا وزن بڑھانا چاہتے ہیں؟ (کلوگرام میں)'
                : userInfo.bodyGoal === 'Lose Fat'
                  ? 'How many kg do you want to lose?'
                  : 'How many kg do you want to gain?'
            }
            placeholderTextColor={colors.mutedText}
            keyboardType="numeric"
          />
          {validationErrors.targetWeight && (
            <Text style={styles.errorText}>{t('validation.weight.required')}</Text>
          )}
        </View>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('step.lifestyle.health')}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Medical Conditions (Optional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={userInfo.medicalConditions}
          onChangeText={(value) => updateUserInfo('medicalConditions', value)}
          placeholder={t('placeholder.medical')}
          placeholderTextColor={colors.mutedText}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.occupation')} *</Text>
        <View style={[styles.pickerContainer, validationErrors.occupationType && styles.inputError]}>
          <Picker
            selectedValue={userInfo.occupationType}
            onValueChange={(value) => updateUserInfo('occupationType', value)}
            style={styles.picker}
          >
            <Picker.Item label={t('dropdown.select.occupation')} value="" />
            {occupationTypes.map(type => (
              <Picker.Item 
                key={type.en} 
                label={`${type.en === 'Sedentary Desk Job' ? '🪑' : type.en === 'Active Job' ? '🏃‍♂️' : type.en === 'Shift Worker' ? '⏰' : type.en === 'Student' ? '📚' : type.en === 'Retired' ? '🌅' : '🔧'} ${getLocalizedText(type)}`} 
                value={getLocalizedText(type)} 
              />
            ))}
          </Picker>
        </View>
        {validationErrors.occupationType && (
          <Text style={styles.errorText}>{t('validation.occupation.required')}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.equipment')} *</Text>
        <View style={[styles.pickerContainer, validationErrors.availableEquipment && styles.inputError]}>
          <Picker
            selectedValue={userInfo.availableEquipment}
            onValueChange={(value) => updateUserInfo('availableEquipment', value)}
            style={styles.picker}
          >
            <Picker.Item label={t('dropdown.select.equipment')} value="" />
            {equipmentOptions.map(equipment => (
              <Picker.Item 
                key={equipment.en} 
                label={`${equipment.en === 'None' ? '❌' : equipment.en === 'Basic Dumbbells' ? '💪' : equipment.en === 'Resistance Bands' ? '🎯' : equipment.en === 'Home Gym' ? '🏠' : '🏢'} ${getLocalizedText(equipment)}`} 
                value={getLocalizedText(equipment)} 
              />
            ))}
          </Picker>
        </View>
        {validationErrors.availableEquipment && (
          <Text style={styles.errorText}>{t('validation.equipment.required')}</Text>
        )}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('step.diet.preferences')}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('userinfo.diet.preference')} *</Text>
        <View style={[styles.pickerContainer, validationErrors.dietPreference && styles.inputError]}>
          <Picker
            selectedValue={userInfo.dietPreference}
            onValueChange={(value) => updateUserInfo('dietPreference', value)}
            style={styles.picker}
          >
            <Picker.Item label={t('dropdown.select.diet')} value="" />
            {dietPreferences.map(pref => (
              <Picker.Item 
                key={pref.en} 
                label={`${pref.en === 'Vegetarian' ? '🥬' : pref.en === 'Non-Vegetarian' ? '🍖' : pref.en === 'Vegan' ? '🌱' : pref.en === 'Flexitarian' ? '🥄' : '🐟'} ${getLocalizedText(pref)}`} 
                value={getLocalizedText(pref)} 
              />
            ))}
          </Picker>
        </View>
        {validationErrors.dietPreference && (
          <Text style={styles.errorText}>{t('validation.diet.required')}</Text>
        )}
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
                  <Text style={styles.primaryButtonText}>
                    {t('userinfo.next')}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.primaryButton} 
                  onPress={handleComplete}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>
                    {t('userinfo.complete')}
                  </Text>
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
  },
  modalContainer: {
    width: '100%',
    maxWidth: Math.min(screenWidth - 32, 450),
    maxHeight: screenHeight * 0.95,
  },
  modalContent: {
    backgroundColor: 'rgba(19, 25, 34, 0.95)',
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
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  content: {
    width: '100%',
    marginBottom: spacing.lg,
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
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  summaryContainer: {
    backgroundColor: 'rgba(0, 201, 124, 0.1)',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 124, 0.3)',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fonts.heading,
    color: colors.primary,
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
    backgroundColor: colors.primary,
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
