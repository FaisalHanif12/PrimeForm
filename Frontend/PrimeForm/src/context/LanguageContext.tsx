import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import transliterationService from '../services/transliterationService';

type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => Promise<void>;
  isRTL: boolean;
  t: (key: string) => string;
  transliterateText: (text: string) => string;
  transliterateName: (name: string) => string;
  transliterateNumbers: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// Translation dictionaries
const translations = {
  en: {
    // Auth screens
    'auth.login.title': 'Welcome Back',
    'auth.login.subtitle': 'Sign in to continue your fitness journey',
    'auth.login.email': 'Email',
    'auth.login.password': 'Password',
    'auth.login.button': 'Log In',
    'auth.login.forgot': 'Forgot Password?',
    'auth.login.signup': 'Sign Up',
    'auth.login.noAccount': "Don't have an account? ",
    
    'auth.signup.title': 'Create Account',
    'auth.signup.subtitle': 'Join Prime Form today',
    'auth.signup.name': 'Username',
    'auth.signup.email': 'Email',
    'auth.signup.password': 'Password',
    'auth.signup.confirm': 'Confirm Password',
    'auth.signup.button': 'Sign Up',
    'auth.signup.hasAccount': 'Already have an account? ',
    'auth.signup.login': 'Log In',
    
    // Language selection
    'language.choose': 'Choose your preferred language',
    'language.urdu': 'اردو',
    'language.english': 'English',
    
         // Dashboard
     'dashboard.greeting': 'Good Morning',
     'dashboard.subtitle': 'Ready to crush your fitness goals today?',
     'dashboard.overview': "Today's Overview",
     'dashboard.calories': 'Calories left',
     'dashboard.water': 'Water',
     'dashboard.workouts': 'Workouts remaining',
     'dashboard.steps': 'Steps',
     'dashboard.workout.plan': "Today's Workout Plan",
     'dashboard.meal.plan': "Today's Meal Plan",
     'dashboard.view.full.workout': 'View Full Workout',
     'dashboard.view.full.meal': 'View Full Meal Plan',
    
    // Navigation
    'nav.home': 'Home',
    'nav.diet': 'Diet',
    'nav.gym': 'Gym',
    'nav.workout': 'Workout',
    'nav.progress': 'Progress',
    
    // Sidebar
    'sidebar.profile': 'Profile',
    'sidebar.settings': 'Settings',
    'sidebar.subscription': 'Subscription Plan',
    'sidebar.logout': 'Log Out',
    'sidebar.language': 'Language',
    'sidebar.version': 'Version 1.0.0',
    
    // Common
    'common.loading': 'Loading Prime Form...',
    'common.error': 'Something went wrong',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    
    // Validation messages
    'validation.name.required': 'Name is required',
    'validation.name.minLength': 'Name must be at least 2 characters',
    'validation.email.required': 'Email is required',
    'validation.email.invalid': 'Please enter a valid email like user@gmail.com',
    'validation.password.required': 'Password is required',
    'validation.password.minLength': 'At least 6 characters required',
    'validation.password.lowercase': 'One lowercase letter required',
    'validation.password.uppercase': 'One uppercase letter required',
    'validation.password.number': 'One number required',
    'validation.confirm.required': 'Please confirm your password',
    'validation.confirm.mismatch': 'Passwords do not match',
    
    // Toast messages
    'toast.signup.success': 'Account created successfully!',
    'toast.signup.error': 'Failed to create account',
    'toast.login.success': 'Welcome back!',
    'toast.login.error': 'Invalid email or password',
    'toast.validation.error': 'Please complete all requirements before signing up',
    'toast.connection.error': 'Connection error. Please try again.',
    'toast.reset.success': 'Reset code sent to your email!',
    'toast.reset.error': 'Email not found',
    'toast.otp.success': 'OTP verified successfully!',
    'toast.otp.error': 'Invalid or expired OTP',
    'toast.password.success': 'Password reset successfully!',
    'toast.password.error': 'Failed to reset password',
    
    // Forgot Password
    'auth.forgot.title': 'Forgot Password',
    'auth.forgot.description': 'Enter your email address and we\'ll send you a link to reset your password.',
    'auth.forgot.button': 'Send OTP',
    'auth.forgot.sent': 'OTP Sent',
    
    // OTP Verification
    'auth.otp.title': 'Verify OTP',
    'auth.otp.description': 'Enter the 6-digit code sent to your email',
    'auth.otp.button': 'Verify OTP',
    'auth.otp.resend': 'Resend Code',
    'auth.otp.resent': 'Code Sent',
    'auth.otp.placeholder': 'Enter OTP',
    'auth.otp.incomplete': 'Please enter complete 6-digit code',
    'auth.otp.attempts': 'attempts remaining',
    'auth.otp.nocode': 'Didn\'t receive the code?',
    'auth.otp.resendTimer': 'Resend in',
    'auth.otp.locked': 'Too many wrong attempts. Locked for 1 minute.',
    'auth.otp.wait': 'Too many attempts. Wait',
    'auth.otp.minutes': 'minute(s)',
    'auth.otp.failed': 'Failed to resend code',
    
    // Reset Password
    'auth.reset.title': 'Reset Password',
    'auth.reset.description': 'Enter your new password',
    'auth.reset.new': 'New Password',
    'auth.reset.confirm': 'Confirm New Password',
    'auth.reset.button': 'Reset Password',
    
    // Dashboard Stats
    'dashboard.stats.calories': 'Calories left',
    'dashboard.stats.water': 'Water',
    'dashboard.stats.workouts': 'Workouts remaining',
    'dashboard.stats.steps': 'Steps',
    
    // Workout Card
    'workout.pushups': 'Push-Ups',
    'workout.reps': 'reps',
    'workout.sets': 'sets',
    
    // Meal Card
    'meal.breakfast': 'Breakfast',
    'meal.lunch': 'Lunch', 
    'meal.dinner': 'Dinner',
    'meal.snack': 'Snack',
    'meal.calories': 'calories',
    'meal.protein': 'Protein',
    'meal.carbs': 'Carbs',
    'meal.fat': 'Fat',
    
    // App Branding
    'app.name': 'Prime Form',
    
    // Onboarding
    'onboarding.title': 'Are you ready for AI driven questions to personalize your diet and exercise?',
    'onboarding.description': '',
    'onboarding.start': 'Start',
    'onboarding.cancel': 'Cancel',
    
    // Workout Page
    'workout.page.subtitle': 'Track your workouts and build strength',
    'workout.page.comingSoon': 'Workout tracking coming soon!',
    'workout.page.comingSoonDesc': 'We\'re building amazing workout features to help you track your progress and achieve your fitness goals.',
    
    // Diet Page
    'diet.page.subtitle': 'Plan your meals and track nutrition',
    'diet.page.comingSoon': 'Diet planning coming soon!',
    'diet.page.comingSoonDesc': 'We\'re building comprehensive diet tracking features to help you maintain a healthy and balanced nutrition plan.',
    
    // User Info Modal
    'userinfo.title': 'Personalize Your Experience',
    'userinfo.step': 'Step',
    'userinfo.of': 'of',
    'userinfo.personal.info': 'Personal Information',
    'userinfo.goals.preferences': 'Goals & Preferences',
    'userinfo.medical.info': 'Medical Information',
    'userinfo.location': 'Location',
    'userinfo.age': 'Age',
    'userinfo.gender': 'Gender',
    'userinfo.height': 'Height',
    'userinfo.current.weight': 'Current Weight',
    'userinfo.body.goal': 'Body Goal',
    'userinfo.diet.preference': 'Diet Preference',
    'userinfo.occupation': 'Occupation',
    'userinfo.equipment': 'Equipment',
    'userinfo.medical.conditions': 'Medical Conditions',
    'userinfo.country': 'Country',
    'userinfo.years': 'years',
    'userinfo.previous': 'Previous',
    'userinfo.next': 'Next',
    'userinfo.complete': 'Complete',
    'userinfo.cancel': 'Cancel',
    'userinfo.select.country': 'Select your country',
    'userinfo.select.goal': 'Select your goal',
    'userinfo.select.occupation': 'Select your occupation type',
    'userinfo.select.equipment': 'Select available equipment',
    'userinfo.placeholder.medical': 'e.g., diabetes, hypertension, PCOS, heart issues (or none)',
    'userinfo.summary.title': 'Summary',
    'userinfo.summary.text': 'We\'ll use this information to create your personalized diet and workout plans.',
    'userinfo.lifestyle.health': 'Lifestyle & Health',
    'userinfo.diet.preferences': 'Diet Preferences',
    'userinfo.select.diet': 'Select your diet preference',
  },
  ur: {
    // Auth screens
    'auth.login.title': 'خوش آمدید',
    'auth.login.subtitle': 'اپنے فٹنس سفر کو جاری رکھنے کے لیے سائن ان کریں',
    'auth.login.email': 'ای میل',
    'auth.login.password': 'پاس ورڈ',
    'auth.login.button': 'لاگ ان',
    'auth.login.forgot': 'پاس ورڈ بھول گئے؟',
    'auth.login.signup': 'سائن اپ',
    'auth.login.noAccount': 'کیا آپ کا اکاؤنٹ نہیں ہے؟ ',
    
    'auth.signup.title': 'اکاؤنٹ بنائیں',
    'auth.signup.subtitle': 'آج ہی پرائم فارم میں شامل ہوں',
    'auth.signup.name': 'صارف نام',
    'auth.signup.email': 'ای میل',
    'auth.signup.password': 'پاس ورڈ',
    'auth.signup.confirm': 'پاس ورڈ کی تصدیق',
    'auth.signup.button': 'سائن اپ',
    'auth.signup.hasAccount': 'پہلے سے اکاؤنٹ ہے؟ ',
    'auth.signup.login': 'لاگ ان',
    
    // Language selection
    'language.choose': 'اپنی پسندیدہ زبان منتخب کریں',
    'language.urdu': 'اردو',
    'language.english': 'English',
    
         // Dashboard
     'dashboard.greeting': 'صبح بخیر',
     'dashboard.subtitle': 'کیا آپ آج اپنے فٹنس اہداف کو حاصل کرنے کے لیے تیار ہیں؟',
     'dashboard.overview': 'آج کا جائزہ',
     'dashboard.calories': 'باقی کیلوریز',
     'dashboard.water': 'پانی',
     'dashboard.workouts': 'باقی ورکاؤٹس',
     'dashboard.steps': 'قدم',
     'dashboard.workout.plan': 'آج کا ورکاؤٹ پلان',
     'dashboard.meal.plan': 'آج کا کھانے کا پلان',
     'dashboard.view.full.workout': 'مکمل ورکاؤٹ دیکھیں',
     'dashboard.view.full.meal': 'مکمل کھانے کا پلان دیکھیں',
    
    // Navigation
    'nav.home': 'ہوم',
    'nav.diet': 'ڈائٹ',
    'nav.gym': 'جم',
    'nav.workout': 'ورکاؤٹ',
    'nav.progress': 'پیش قدمی',
    
    // Sidebar
    'sidebar.profile': 'پروفائل',
    'sidebar.settings': 'سیٹنگز',
    'sidebar.subscription': 'سبسکرپشن پلان',
    'sidebar.logout': 'لاگ آؤٹ',
    'sidebar.language': 'زبان',
    'sidebar.version': 'ورژن 1.0.0',
    
    // Common
    'common.loading': 'پرائم فارم لوڈ ہو رہا ہے...',
    'common.error': 'کچھ غلط ہو گیا',
    'common.retry': 'دوبارہ کوشش',
    'common.cancel': 'منسوخ',
    'common.save': 'محفوظ',
    
    // Validation messages
    'validation.name.required': 'نام ضروری ہے',
    'validation.name.minLength': 'نام کم از کم 2 حروف کا ہونا چاہیے',
    'validation.email.required': 'ای میل ضروری ہے',
    'validation.email.invalid': 'برائے کرم صحیح ای میل درج کریں جیسے user@gmail.com',
    'validation.password.required': 'پاس ورڈ ضروری ہے',
    'validation.password.minLength': 'کم از کم 6 حروف ضروری ہیں',
    'validation.password.lowercase': 'ایک چھوٹا حرف ضروری ہے',
    'validation.password.uppercase': 'ایک بڑا حرف ضروری ہے',
    'validation.password.number': 'ایک نمبر ضروری ہے',
    'validation.confirm.required': 'برائے کرم پاس ورڈ کی تصدیق کریں',
    'validation.confirm.mismatch': 'پاس ورڈ میں مطابقت نہیں',
    
    // Toast messages
    'toast.signup.success': 'اکاؤنٹ کامیابی سے بن گیا!',
    'toast.signup.error': 'اکاؤنٹ بنانے میں ناکامی',
    'toast.login.success': 'خوش آمدید!',
    'toast.login.error': 'غلط ای میل یا پاس ورڈ',
    'toast.validation.error': 'سائن اپ کرنے سے پہلے تمام ضروریات مکمل کریں',
    'toast.connection.error': 'کنکشن کی خرابی۔ دوبارہ کوشش کریں۔',
    'toast.reset.success': 'ری سیٹ کوڈ آپ کے ای میل پر بھیج دیا گیا!',
    'toast.reset.error': 'ای میل نہیں ملا',
    'toast.otp.success': 'OTP کامیابی سے تصدیق ہو گئی!',
    'toast.otp.error': 'غلط یا ختم ہو چکا OTP',
    'toast.password.success': 'پاس ورڈ کامیابی سے ری سیٹ ہو گیا!',
    'toast.password.error': 'پاس ورڈ ری سیٹ کرنے میں ناکامی',
    
    // Forgot Password
    'auth.forgot.title': 'پاس ورڈ بھول گئے',
    'auth.forgot.description': 'اپنا ای میل ایڈریس درج کریں اور ہم آپ کو پاس ورڈ ری سیٹ کرنے کا لنک بھیجیں گے۔',
    'auth.forgot.button': 'OTP بھیجیں',
    'auth.forgot.sent': 'OTP بھیج دیا',
    
    // OTP Verification
    'auth.otp.title': 'OTP کی تصدیق',
    'auth.otp.description': 'آپ کے ای میل پر بھیجا گیا 6 ہندسوں کا کوڈ درج کریں',
    'auth.otp.button': 'OTP کی تصدیق',
    'auth.otp.resend': 'کوڈ دوبارہ بھیجیں',
    'auth.otp.resent': 'کوڈ بھیج دیا',
    'auth.otp.placeholder': 'OTP درج کریں',
    'auth.otp.incomplete': 'برائے کرم مکمل 6 ہندسوں کا کوڈ درج کریں',
    'auth.otp.attempts': 'کوششیں باقی',
    'auth.otp.nocode': 'کوڈ نہیں ملا؟',
    'auth.otp.resendTimer': 'دوبارہ بھیجیں',
    'auth.otp.locked': 'بہت زیادہ غلط کوششیں۔ 1 منٹ کے لیے بند۔',
    'auth.otp.wait': 'بہت زیادہ کوششیں۔ انتظار کریں',
    'auth.otp.minutes': 'منٹ',
    'auth.otp.failed': 'کوڈ دوبارہ بھیجنے میں ناکامی',
    
    // Reset Password
    'auth.reset.title': 'پاس ورڈ ری سیٹ',
    'auth.reset.description': 'اپنا نیا پاس ورڈ درج کریں',
    'auth.reset.new': 'نیا پاس ورڈ',
    'auth.reset.confirm': 'نیا پاس ورڈ تصدیق',
    'auth.reset.button': 'پاس ورڈ ری سیٹ',
    
    // Dashboard Stats
    'dashboard.stats.calories': 'باقی کیلوریز',
    'dashboard.stats.water': 'پانی',
    'dashboard.stats.workouts': 'باقی ورکاؤٹس',
    'dashboard.stats.steps': 'قدم',
    
    // Workout Card
    'workout.pushups': 'پش اپس',
    'workout.reps': 'بار',
    'workout.sets': 'سیٹس',
    
    // Meal Card
    'meal.breakfast': 'ناشتہ',
    'meal.lunch': 'دوپہر کا کھانا',
    'meal.dinner': 'رات کا کھانا',
    'meal.snack': 'ناشتہ',
    'meal.calories': 'کیلوریز',
    'meal.protein': 'پروٹین',
    'meal.carbs': 'کاربس',
    'meal.fat': 'چربی',
    
    // App Branding
    'app.name': 'پرائم فارم',
    
    // Onboarding
    'onboarding.title': 'کیا آپ اپنی خوراک اور ورزش کو ذاتی بنانے کے لیے AI سے چلنے والے سوالات کے لیے تیار ہیں؟',
    'onboarding.description': '',
    'onboarding.start': 'شروع کریں',
    'onboarding.cancel': 'منسوخ',
    
    // Workout Page
    'workout.page.subtitle': 'اپنی ورکاؤٹس کو ٹریک کریں اور طاقت بنائیں',
    'workout.page.comingSoon': 'ورکاؤٹ ٹریکنگ جلد آ رہی ہے!',
    'workout.page.comingSoonDesc': 'ہم آپ کی پیش رفت کو ٹریک کرنے اور آپ کے فٹنس اہداف کو حاصل کرنے میں مدد کے لیے شاندار ورکاؤٹ فیچرز بنا رہے ہیں۔',
    
    // Diet Page
    'diet.page.subtitle': 'اپنے کھانے کی منصوبہ بندی کریں اور غذائیت کو ٹریک کریں',
    'diet.page.comingSoon': 'ڈائٹ پلاننگ جلد آ رہی ہے!',
    'diet.page.comingSoonDesc': 'ہم آپ کو صحت مند اور متوازن غذائیت کے پلان کو برقرار رکھنے میں مدد کے لیے جامع ڈائٹ ٹریکنگ فیچرز بنا رہے ہیں۔',
    
    // User Info Modal
    'userinfo.title': 'اپنی تجربہ کو پروردہ کریں',
    'userinfo.step': 'قدم',
    'userinfo.of': 'کے',
    'userinfo.personal.info': 'صرف پروفائل',
    'userinfo.goals.preferences': 'اعداد اور پسندیاں',
    'userinfo.medical.info': 'میڈیکل اطلاعات',
    'userinfo.location': 'مقام',
    'userinfo.age': 'عمر',
    'userinfo.gender': 'جنس',
    'userinfo.height': 'قد',
    'userinfo.current.weight': 'ابھی کی وزن',
    'userinfo.body.goal': 'جسم کا مقصد',
    'userinfo.diet.preference': 'خوراک پسندی',
    'userinfo.occupation': 'کام',
    'userinfo.equipment': 'ادائیگی',
    'userinfo.medical.conditions': 'میڈیکل سمندریات',
    'userinfo.country': 'ممالک',
    'userinfo.years': 'سال',
    'userinfo.previous': 'پچھلا',
    'userinfo.next': 'اگلا',
    'userinfo.complete': 'مکمل',
    'userinfo.cancel': 'منسوخ',
    'userinfo.select.country': 'اپنی ممالک دیکھیں',
    'userinfo.select.goal': 'اپنا مقصد دیکھیں',
    'userinfo.select.occupation': 'اپنے کام کی قسم دیکھیں',
    'userinfo.select.equipment': 'موجودہ ادائیگی دیکھیں',
    'userinfo.placeholder.medical': 'جیسے دیاسی، ہیپرتینسی، PCOS، قلب کے مسائل (یا کوئی نہیں)',
    'userinfo.summary.title': 'جائزہ',
    'userinfo.summary.text': 'ہم اس معلومات کو استعمال کریں گے تاکہ آپ کی پروردہ خوراک اور ورکاؤٹ پلان بنائیں۔',
    'userinfo.lifestyle.health': 'لافک اور صحت',
    'userinfo.diet.preferences': 'خوراک پسندیاں',
    'userinfo.select.diet': 'اپنی خوراک پسندی دیکھیں',
  },
};

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('primeform_language_selected');
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ur')) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Failed to load language:', error);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('primeform_language_selected', lang);
      setLanguage(lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  // Transliteration functions
  const transliterateText = (text: string): string => {
    return transliterationService.transliterateText(text, language);
  };

  const transliterateName = (name: string): string => {
    return transliterationService.transliterateName(name, language);
  };

  const transliterateNumbers = (text: string): string => {
    return transliterationService.transliterateNumbers(text, language);
  };



  const value: LanguageContextType = {
    language,
    changeLanguage,
    isRTL: language === 'ur',
    t,
    transliterateText,
    transliterateName,
    transliterateNumbers,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
