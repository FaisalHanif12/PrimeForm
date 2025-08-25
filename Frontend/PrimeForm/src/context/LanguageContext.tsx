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
    'sidebar.profile.details': 'Profile Details',
    'sidebar.view.profile': 'View Full Profile',
    
    // Common
    'common.loading': 'Loading Prime Form...',
    'common.error': 'Something went wrong',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    
    // Brand
    'brand.primeform': 'PRIMEFORM',
    
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
    
    // Diet Page
    'diet.page.title': 'Diet Plan',
    'diet.page.subtitle': 'Your personalized nutrition guide',
    'diet.page.generate.title': 'Generate Your Diet Plan',
    'diet.page.generate.description': 'Click to provide your information and get a personalized diet plan tailored to your goals',
    'diet.page.generate.button': 'Generate Diet Plan',
    'diet.page.features.title': 'What You\'ll Get',
    'diet.page.features.personalized.title': 'Personalized Plans',
    'diet.page.features.personalized.text': 'Custom nutrition plans based on your body, goals, and preferences',
    'diet.page.features.nutrition.title': 'Nutrition Analysis',
    'diet.page.features.nutrition.text': 'Detailed breakdown of calories, macros, and micronutrients',
    'diet.page.features.meals.title': 'Meal Suggestions',
    'diet.page.features.meals.text': 'Delicious meal ideas that fit your dietary requirements',
    'diet.page.features.tracking.title': 'Progress Tracking',
    'diet.page.features.tracking.text': 'Monitor your nutrition journey and see results',
    'diet.page.content.title': 'Your Personalized Diet Plan',
    'diet.page.content.description': 'Based on your profile, your personalized diet plan will appear here with detailed meal suggestions, nutrition information, and progress tracking.',
    
    // Workout Page
    'workout.page.title': 'Workout Plan',
    'workout.page.subtitle': 'Your personalized fitness guide',
    'workout.page.generate.title': 'Generate Your Workout Plan',
    'workout.page.generate.description': 'Click to provide your information and get a personalized workout plan designed for your fitness level',
    'workout.page.generate.button': 'Generate Workout Plan',
    'workout.page.features.title': 'What You\'ll Get',
    'workout.page.features.personalized.title': 'Personalized Plans',
    'workout.page.features.personalized.text': 'Custom workout routines based on your fitness level and goals',
    'workout.page.features.progress.title': 'Progress Tracking',
    'workout.page.features.progress.text': 'Monitor your strength gains and fitness improvements',
    'workout.page.features.exercises.title': 'Exercise Library',
    'workout.page.features.exercises.text': 'Access to hundreds of exercises with proper form guides',
    'workout.page.features.tracking.title': 'Workout Logging',
    'workout.page.features.tracking.text': 'Track your workouts and maintain consistency',
    'workout.page.content.title': 'Your Personalized Workout Plan',
    'workout.page.content.description': 'Based on your profile, your personalized workout plan will appear here with exercise routines, sets, reps, and progress tracking.',
    
    // Diet & Workout Page Content
    'diet.hero.title': 'Smart Diet Planning',
    'diet.hero.subtitle': 'Personalized nutrition plans tailored to your goals and lifestyle',
    'diet.generate.button': 'Generate My Diet Plan',
    'diet.features.title': 'Why Choose Our Diet Plans?',
    'diet.features.personalized.title': 'Personalized',
    'diet.features.personalized.text': 'Tailored to your body type, goals, and dietary preferences',
    'diet.features.science.title': 'Science-Based',
    'diet.features.science.text': 'Backed by nutrition science and expert recommendations',
    'diet.features.delicious.title': 'Delicious',
    'diet.features.delicious.text': 'Flavorful recipes that make healthy eating enjoyable',
    'diet.features.tracking.title': 'Easy Tracking',
    'diet.features.tracking.text': 'Monitor your progress and stay accountable',
    'diet.magic.message': 'You are one click away from magic! ✨',
    
    'workout.hero.title': 'Smart Workout Plans',
    'workout.hero.subtitle': 'Personalized training programs designed for your fitness level and goals',
    'workout.generate.button': 'Create My Workout Plan',
    'workout.features.title': 'Why Choose Our Workout Plans?',
    'workout.features.personalized.title': 'Personalized',
    'workout.features.personalized.text': 'Tailored to your fitness level, goals, and available equipment',
    'workout.features.progressive.title': 'Progressive',
    'workout.features.progressive.text': 'Gradually increase intensity to avoid plateaus and injuries',
    'workout.features.varied.title': 'Varied',
    'workout.features.varied.text': 'Mix of strength, cardio, and flexibility for balanced fitness',
    'workout.features.trackable.title': 'Trackable',
    'workout.features.trackable.text': 'Monitor progress and stay motivated with detailed analytics',
    'workout.magic.message': 'You are one click away from magic! ✨',
    
    // Dropdown Options
    'dropdown.select.country': '🌍 Select your country',
    'dropdown.select.gender': '👤 Select gender',
    'dropdown.select.goal': '🎯 Select your goal',
    'dropdown.select.occupation': '💼 Select occupation type',
    'dropdown.select.equipment': '🏋️ Select available equipment',
    'dropdown.select.diet': '🥗 Select diet preference',
    
    // Body Goals
    'goal.lose.fat': '🔥 Lose Fat',
    'goal.gain.muscle': '💪 Gain Muscle',
    'goal.maintain.weight': '⚖️ Maintain Weight',
    'goal.general.training': '🏃‍♂️ General Training',
    'goal.improve.fitness': '🌟 Improve Fitness',
    
    // Occupation Types
    'occupation.sedentary': '🪑 Sedentary Desk Job',
    'occupation.active': '🏃‍♂️ Active Job',
    'occupation.shift': '⏰ Shift Worker',
    'occupation.student': '📚 Student',
    'occupation.retired': '🌅 Retired',
    'occupation.other': '🔧 Other',
    
    // Equipment Options
    'equipment.none': '❌ None',
    'equipment.dumbbells': '💪 Basic Dumbbells',
    'equipment.bands': '🎯 Resistance Bands',
    'equipment.home.gym': '🏠 Home Gym',
    'equipment.full.gym': '🏢 Full Gym Access',
    
    // Diet Preferences
    'diet.vegetarian': '🥬 Vegetarian',
    'diet.non.vegetarian': '🍖 Non-Vegetarian',
    'diet.vegan': '🌱 Vegan',
    'diet.flexitarian': '🥄 Flexitarian',
    'diet.pescatarian': '🐟 Pescatarian',
    
    // Validation Messages
    'validation.country.required': 'Please select your country',
    'validation.age.required': 'Please enter your age',
    'validation.gender.required': 'Please select your gender',
    'validation.height.required': 'Please enter your height',
    'validation.weight.required': 'Please enter your current weight',
    'validation.goal.required': 'Please select your body goal',
    'validation.occupation.required': 'Please select your occupation type',
    'validation.equipment.required': 'Please select your available equipment',
    'validation.diet.required': 'Please select your diet preference',
    
    // Input Placeholders
    'placeholder.height': '175 cm or 5\'8 inches',
    'placeholder.weight': '70 kg or 154 lbs',
    'placeholder.age': '25',
    'placeholder.medical': 'e.g., diabetes, hypertension, PCOS, heart issues (or none)',
    
    // Step Titles
    'step.personal.info': 'Personal Information',
    'step.physical.info': 'Physical Information',
    'step.lifestyle.health': 'Lifestyle & Health',
    'step.diet.preferences': 'Diet Preferences',
    
    // Alert Messages
    'alert.incomplete.title': 'Incomplete Information',
    'alert.incomplete.message': 'Please fill in all required fields in {step} before continuing.',
    'alert.missing.title': 'Missing Information',
    'alert.missing.message': 'Please fill in all required fields before completing.',
    'alert.invalid.age': 'Invalid Age',
    'alert.invalid.age.message': 'Please enter a valid age between 13 and 120 years.',
    
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
    
    // Requirements Panel
    'requirements.title': 'Email & Password Requirements',
    'requirements.email.section': '📧 Email Format:',
    'requirements.email.valid': '• Must be a valid email (e.g., user@gmail.com)',
    'requirements.email.noSpaces': '• Cannot contain spaces',
    'requirements.password.section': '🔒 Password Requirements:',
    'requirements.password.length': '• At least 6 characters long',
    'requirements.password.letter': '• Contains at least one letter (a-z, A-Z)',
    'requirements.password.number': '• Contains at least one number (0-9)',
    
    // Common User
    'common.user': 'User',
    
    // Gender Options
    'gender.select': 'Select your gender',
    'gender.male': 'Male',
    'gender.female': 'Female',
    'gender.other': 'Other',
    
    // Permission Modal
    'permission.title': 'Welcome to PrimeForm! 🎉',
    'permission.subtitle': 'To provide you with personalized diet and workout plans, we need to collect some information about you.',
    'permission.start': 'Start',
    'permission.cancel': 'Cancel',

    // Profile Page
    'profile.noProfile.title': 'Complete Your Profile',
    'profile.noProfile.text': 'To get personalized diet and workout plans, we need some information about you.',
    'profile.noProfile.button': 'Create Profile',
    'profile.sections.personal': 'Personal Information',
    'profile.sections.goals': 'Goals & Preferences',
    'profile.sections.lifestyle': 'Lifestyle & Health',
    'profile.fields.country': 'Country',
    'profile.fields.age': 'Age',
    'profile.fields.gender': 'Gender',
    'profile.fields.height': 'Height',
    'profile.fields.weight': 'Current Weight',
    'profile.fields.bodyGoal': 'Body Goal',
    'profile.fields.dietPreference': 'Diet Preference',
    'profile.fields.occupation': 'Occupation',
    'profile.fields.equipment': 'Available Equipment',
    'profile.fields.medical': 'Medical Conditions',
    'profile.title': 'Profile',
    'profile.edit': 'Edit',
    'profile.cancel': 'Cancel',
    'profile.save': 'Save',
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
    'sidebar.profile.details': 'پروفائل کی تفصیلات',
    'sidebar.view.profile': 'مکمل پروفائل دیکھیں',
    
    // Common
    'common.loading': 'پرائم فارم لوڈ ہو رہا ہے...',
    'common.error': 'کچھ غلط ہو گیا',
    'common.retry': 'دوبارہ کوشش',
    'common.cancel': 'منسوخ',
    'common.save': 'محفوظ',
    
    // Brand
    'brand.primeform': 'پرائم فارم',
    
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
    
    // Requirements Panel
    'requirements.title': 'ای میل اور پاس ورڈ کی ضروریات',
    'requirements.email.section': '📧 ای میل فارمیٹ:',
    'requirements.email.valid': '• صحیح ای میل (جیسے user@gmail.com) ہونا چاہیے',
    'requirements.email.noSpaces': '• فاصلے شامل نہیں ہونا چاہیے',
    'requirements.password.section': '🔒 پاس ورڈ کی ضروریات:',
    'requirements.password.length': '• کم از کم 6 حروف لمبا ہونا چاہیے',
    'requirements.password.letter': '• کم از کم ایک لیٹر (a-z, A-Z) شامل ہونا چاہیے',
    'requirements.password.number': '• کم از کم ایک نمبر (0-9) شامل ہونا چاہیے',
    
    // Common User
    'common.user': 'صارف',
    
    // Gender Options
    'gender.select': 'اپنا جنس منتخب کریں',
    'gender.male': 'مرد',
    'gender.female': 'خوراں',
    'gender.other': 'دیگر',
    
    // Permission Modal
    'permission.title': 'پرائم فارم میں خوش آمدید! 🎉',
    'permission.subtitle': 'آپ کو صرف پروردہ خوراک اور ورکاؤٹ پلان کے لیے آپ کے لیے کچھ معلومات لےنا پڑے گی۔',
    'permission.start': 'شروع کریں',
    'permission.cancel': 'منسوخ',

    // Profile Page
    'profile.noProfile.title': 'اپنی پروفائل کو پروردہ کریں',
    'profile.noProfile.text': 'آپ کو صرف پروردہ خوراک اور ورکاؤٹ پلان کے لیے آپ کے لیے کچھ معلومات لےنا پڑے گی۔',
    'profile.noProfile.button': 'پروفائل بنائیں',
    'profile.sections.personal': 'صرف پروفائل',
    'profile.sections.goals': 'اعداد اور پسندیاں',
    'profile.sections.lifestyle': 'لافک اور صحت',
    'profile.fields.country': 'ممالک',
    'profile.fields.age': 'عمر',
    'profile.fields.gender': 'جنس',
    'profile.fields.height': 'قد',
    'profile.fields.weight': 'ابھی کی وزن',
    'profile.fields.bodyGoal': 'جسم کا مقصد',
    'profile.fields.dietPreference': 'خوراک پسندی',
    'profile.fields.occupation': 'کام',
    'profile.fields.equipment': 'موجودہ ادائیگی',
    'profile.fields.medical': 'میڈیکل سمندریات',
    
    // Diet & Workout Page Content
    'diet.hero.title': 'ذہین ڈائٹ پلاننگ',
    'diet.hero.subtitle': 'آپ کے اہداف اور طرز زندگی کے مطابق ذاتی غذائی پلان',
    'diet.generate.button': 'میرا ڈائٹ پلان بنائیں',
    'diet.features.title': 'ہمارے ڈائٹ پلانز کیوں منتخب کریں؟',
    'diet.features.personalized.title': 'ذاتی',
    'diet.features.personalized.text': 'آپ کے جسم کی قسم، اہداف اور غذائی ترجیحات کے مطابق',
    'diet.features.science.title': 'سائنس پر مبنی',
    'diet.features.science.text': 'غذائیت کی سائنس اور ماہرین کی سفارشات کی حمایت',
    'diet.features.delicious.title': 'لذیذ',
    'diet.features.delicious.text': 'ذائقہ دار ترکیبیں جو صحت مند کھانے کو لطف اندوز بناتی ہیں',
    'diet.features.tracking.title': 'آسان ٹریکنگ',
    'diet.features.tracking.text': 'اپنی پیش رفت کی نگرانی کریں اور ذمہ دار رہیں',
    'diet.magic.message': 'آپ جادو سے صرف ایک کلک دور ہیں! ✨',
    
    'workout.hero.title': 'ذہین ورکاؤٹ پلانز',
    'workout.hero.subtitle': 'آپ کی فٹنس لیول اور اہداف کے لیے ڈیزائن کردہ ذاتی تربیتی پروگرام',
    'workout.generate.button': 'میرا ورکاؤٹ پلان بنائیں',
    'workout.features.title': 'ہمارے ورکاؤٹ پلانز کیوں منتخب کریں؟',
    'workout.features.personalized.title': 'ذاتی',
    'workout.features.personalized.text': 'آپ کی فٹنس لیول، اہداف اور دستیاب سامان کے مطابق',
    'workout.features.progressive.title': 'ترقی پسند',
    'workout.features.progressive.text': 'پلیٹیوز اور چوٹوں سے بچنے کے لیے شدت میں بتدریج اضافہ',
    'workout.features.varied.title': 'متنوع',
    'workout.features.varied.text': 'متوازن فٹنس کے لیے طاقت، کارڈیو اور لچک کا مکس',
    'workout.features.trackable.title': 'ٹریک کرنے کے قابل',
    'workout.features.trackable.text': 'تفصیلی تجزیات کے ساتھ پیش رفت کی نگرانی کریں اور حوصلہ برقرار رکھیں',
    'workout.magic.message': 'آپ جادو سے صرف ایک کلک دور ہیں! ✨',
    
    // Dropdown Options
    'dropdown.select.country': '🌍 اپنا ملک منتخب کریں',
    'dropdown.select.gender': '👤 جنس منتخب کریں',
    'dropdown.select.goal': '🎯 اپنا مقصد منتخب کریں',
    'dropdown.select.occupation': '💼 کام کی قسم منتخب کریں',
    'dropdown.select.equipment': '🏋️ دستیاب سامان منتخب کریں',
    'dropdown.select.diet': '🥗 غذائی ترجیح منتخب کریں',
    
    // Body Goals
    'goal.lose.fat': '🔥 چربی کم کریں',
    'goal.gain.muscle': '💪 پٹھے بنائیں',
    'goal.maintain.weight': '⚖️ وزن برقرار رکھیں',
    'goal.general.training': '🏃‍♂️ عمومی تربیت',
    'goal.improve.fitness': '🌟 فٹنس بہتر کریں',
    
    // Occupation Types
    'occupation.sedentary': '🪑 بیٹھے ہوئے ڈیسک کا کام',
    'occupation.active': '🏃‍♂️ متحرک کام',
    'occupation.shift': '⏰ شفٹ ورکر',
    'occupation.student': '📚 طالب علم',
    'occupation.retired': '🌅 ریٹائرڈ',
    'occupation.other': '🔧 دیگر',
    
    // Equipment Options
    'equipment.none': '❌ کوئی نہیں',
    'equipment.dumbbells': '💪 بنیادی ڈمبلز',
    'equipment.bands': '🎯 مزاحمتی بینڈز',
    'equipment.home.gym': '🏠 گھریلو جم',
    'equipment.full.gym': '🏢 مکمل جم تک رسائی',
    
    // Diet Preferences
    'diet.vegetarian': '🥬 سبزی خور',
    'diet.non.vegetarian': '🍖 سبزی خور نہیں',
    'diet.vegan': '🌱 ویگن',
    'diet.flexitarian': '🥄 فلیکسیٹیرین',
    'diet.pescatarian': '🐟 پیسکیٹیرین',
    
    // Validation Messages
    'validation.country.required': 'برائے کرم اپنا ملک منتخب کریں',
    'validation.age.required': 'برائے کرم اپنی عمر درج کریں',
    'validation.gender.required': 'برائے کرم اپنی جنس منتخب کریں',
    'validation.height.required': 'برائے کرم اپنی قد درج کریں',
    'validation.weight.required': 'برائے کرم اپنا موجودہ وزن درج کریں',
    'validation.goal.required': 'برائے کرم اپنا جسمانی مقصد منتخب کریں',
    'validation.occupation.required': 'برائے کرم اپنی کام کی قسم منتخب کریں',
    'validation.equipment.required': 'برائے کرم اپنا دستیاب سامان منتخب کریں',
    'validation.diet.required': 'برائے کرم اپنی غذائی ترجیح منتخب کریں',
    
    // Step Titles
    'step.personal.info': 'ذاتی معلومات',
    'step.physical.info': 'جسمانی معلومات',
    'step.lifestyle.health': 'طرز زندگی اور صحت',
    'step.diet.preferences': 'غذائی ترجیحات',
    
    // Alert Messages
    'alert.incomplete.title': 'نامکمل معلومات',
    'alert.incomplete.message': 'برائے کرم جاری رکھنے سے پہلے {step} میں تمام ضروری فیلڈز پُر کریں۔',
    'alert.missing.title': 'غائب معلومات',
    'alert.missing.message': 'برائے کرم مکمل کرنے سے پہلے تمام ضروری فیلڈز پُر کریں۔',
    'alert.invalid.age': 'غلط عمر',
    'alert.invalid.age.message': 'برائے کرم 13 سے 120 سال کے درمیان صحیح عمر درج کریں۔',
    
    // Input Placeholders
    'placeholder.height': '175 سینٹی میٹر یا 5\'8 انچ',
    'placeholder.weight': '70 کلوگرام یا 154 پاؤنڈ',
    'placeholder.age': '25',
    'placeholder.medical': 'جیسے ذیابیطس، ہائی بلڈ پریشر، PCOS، دل کے مسائل (یا کوئی نہیں)',
    
    // Profile Actions
    'profile.title': 'پروفائل',
    'profile.edit': 'ترمیم',
    'profile.cancel': 'منسوخ کریں',
    'profile.save': 'محفوظ کریں',
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
