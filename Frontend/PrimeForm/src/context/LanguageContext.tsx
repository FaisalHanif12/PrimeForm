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
     'dashboard.workout.plan': "Today's AI Workout Plan",
     'dashboard.meal.plan': "Today's AI Meal Plan",
     'dashboard.view.full.workout': 'View Full AI Workout',
     'dashboard.view.full.meal': 'View Full AI Meal Plan',
    
    // Navigation
    'nav.home': 'Home',
    'nav.diet': 'AI Diet',
    'nav.gym': 'Gym',
    'nav.workout': 'AI Workout',
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
    'sidebar.tapToChange': 'Tap to change',
    'sidebar.upgrade': 'UPGRADE',
    'sidebar.appName': 'PrimeForm',
    
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
    'onboarding.title': 'Are you ready for AI driven questions to personalize your AI diet and workout plan?',
    'onboarding.description': '',
    'onboarding.start': 'Start',
    'onboarding.cancel': 'Cancel',
    'onboarding.workout.title': 'Are you ready for AI-driven questions to personalize your workout plan?',
    
    // Workout Page
    
    // Diet Page
    'diet.page.title': 'AI Diet Plan',
    'diet.page.subtitle': 'Your personalized AI nutrition guide',
    'diet.page.generate.title': 'Generate Your AI Diet Plan',
    'diet.page.generate.description': 'Click to provide your information and get a personalized AI diet plan tailored to your goals',
    'diet.page.generate.button': 'Generate AI Diet Plan',
    'diet.page.features.title': 'What You\'ll Get from AI',
    'diet.page.features.personalized.title': 'Personalized Plans',
    'diet.page.features.personalized.text': 'Custom AI nutrition plans based on your body, goals, and preferences',
    'diet.page.features.nutrition.title': 'Nutrition Analysis',
    'diet.page.features.nutrition.text': 'AI detailed breakdown of calories, macros, and micronutrients',
    'diet.page.features.meals.title': 'Meal Suggestions',
    'diet.page.features.meals.text': 'AI delicious meal ideas that fit your dietary requirements',
    'diet.page.features.tracking.title': 'Progress Tracking',
    'diet.page.features.tracking.text': 'AI monitor your nutrition journey and see results',
    'diet.page.content.title': 'Your Personalized AI Diet Plan',
    'diet.page.content.description': 'Based on your profile, your personalized AI diet plan will appear here with detailed meal suggestions, nutrition information, and progress tracking.',
    
    // Workout Page
    'workout.page.title': 'AI Workout Plan',
    'workout.page.subtitle': 'Your personalized AI fitness guide',
    'workout.page.generate.title': 'Generate Your AI Workout Plan',
    'workout.page.generate.description': 'Click to provide your information and get a personalized AI workout plan designed for your fitness level',
    'workout.page.generate.button': 'Generate AI Workout Plan',
    'workout.page.features.title': 'What You\'ll Get from AI',
    'workout.page.features.personalized.title': 'Personalized Plans',
    'workout.page.features.personalized.text': 'Custom AI workout routines based on your fitness level and goals',
    'workout.page.features.progress.title': 'Progress Tracking',
    'workout.page.features.progress.text': 'AI monitor your strength gains and fitness improvements',
    'workout.page.features.exercises.title': 'Exercise Library',
    'workout.page.features.exercises.text': 'AI access to hundreds of exercises with proper form guides',
    'workout.page.features.tracking.title': 'Workout Logging',
    'workout.page.features.tracking.text': 'AI track your workouts and maintain consistency',
    'workout.page.content.title': 'Your Personalized AI Workout Plan',
    'workout.page.content.description': 'Based on your profile, your personalized AI workout plan will appear here with exercise routines, sets, reps, and progress tracking.',
    
    // Diet & Workout Page Content
    'diet.hero.title': 'AI Smart Diet Planning',
    'diet.hero.subtitle': 'Personalized AI nutrition plans tailored to your goals and lifestyle',
    'diet.generate.button': 'Generate My AI Diet Plan',
    'diet.features.title': 'Why Choose Our AI Diet Plans?',
    'diet.features.personalized.title': 'Personalized',
    'diet.features.personalized.text': 'AI tailored to your body type, goals, and dietary preferences',
    'diet.features.science.title': 'Science-Based',
    'diet.features.science.text': 'Backed by AI nutrition science and expert recommendations',
    'diet.features.delicious.title': 'Delicious',
    'diet.features.delicious.text': 'AI flavorful recipes that make healthy eating enjoyable',
    'diet.features.tracking.title': 'Easy Tracking',
    'diet.features.tracking.text': 'AI monitor your progress and stay accountable',
    'diet.magic.message': 'You are one click away from AI magic! ✨',
    
    'workout.hero.title': 'AI Smart Workout Plans',
    'workout.hero.subtitle': 'Personalized AI training programs designed for your fitness level and goals',
    'workout.generate.button': 'Create My AI Workout Plan',
    'workout.features.title': 'Why Choose Our AI Workout Plans?',
    'workout.features.personalized.title': 'Personalized',
    'workout.features.personalized.text': 'AI tailored to your fitness level, goals, and available equipment',
    'workout.features.progressive.title': 'Progressive',
    'workout.features.progressive.text': 'AI gradually increases intensity to avoid plateaus and injuries',
    'workout.features.varied.title': 'Varied',
    'workout.features.varied.text': 'AI mix of strength, cardio, and flexibility for balanced fitness',
    'workout.features.trackable.title': 'Trackable',
    'workout.features.trackable.text': 'AI monitor progress and stay motivated with detailed analytics',
    'workout.magic.message': 'You are one click away from AI magic! ✨',
    
    // Profile Summary
    'profile.summary.title': 'Your AI Profile Summary',
    'profile.summary.goal': 'Goal:',
    'profile.summary.diet.preference': 'Diet Preference:',
    'profile.summary.current.weight': 'Current Weight:',
    'profile.summary.target.weight': 'Target Weight:',
    'profile.summary.occupation': 'Occupation:',
    'profile.summary.equipment': 'Equipment:',
    'profile.summary.medical.conditions': 'Medical Conditions:',
    'profile.summary.none': 'None',
    'profile.summary.confirm.generate': 'Confirm Generate AI Plan',
    
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
    
    // Body Goals (Urdu)
    'goal.lose.fat.ur': '🔥 چربی کم کریں',
    'goal.gain.muscle.ur': '💪 پٹھے بنائیں',
    'goal.maintain.weight.ur': '⚖️ وزن برقرار رکھیں',
    'goal.general.training.ur': '🏃‍♂️ عمومی تربیت',
    'goal.improve.fitness.ur': '🌟 فٹنس بہتر کریں',
    
    // Occupation Types
    'occupation.sedentary': '🪑 Sedentary Desk Job',
    'occupation.active': '🏃‍♂️ Active Job',
    'occupation.shift': '⏰ Shift Worker',
    'occupation.student': '📚 Student',
    'occupation.retired': '🌅 Retired',
    'occupation.other': '🔧 Other',
    
    // Occupation Types (Urdu)
    'occupation.sedentary.ur': '🪑 بیٹھے ہوئے ڈیسک کا کام',
    'occupation.active.ur': '🏃‍♂️ متحرک کام',
    'occupation.shift.ur': '⏰ شفٹ ورکر',
    'occupation.student.ur': '📚 طالب علم',
    'occupation.retired.ur': '🌅 ریٹائرڈ',
    'occupation.other.ur': '🔧 دیگر',
    
    // Equipment Options
    'equipment.none': '❌ None',
    'equipment.dumbbells': '💪 Basic Dumbbells',
    'equipment.bands': '🎯 Resistance Bands',
    'equipment.home.gym': '🏠 Home Gym',
    'equipment.full.gym': '🏢 Full Gym Access',
    
    // Equipment Options (Urdu)
    'equipment.none.ur': '❌ کوئی نہیں',
    'equipment.dumbbells.ur': '💪 بنیادی ڈمبلز',
    'equipment.bands.ur': '🎯 مزاحمتی بینڈز',
    'equipment.home.gym.ur': '🏠 گھریلو جم',
    'equipment.full.gym.ur': '🏢 مکمل جم تک رسائی',
    
    // Diet Preferences
    'diet.vegetarian': '🥬 Vegetarian',
    'diet.non.vegetarian': '🍖 Non-Vegetarian',
    'diet.vegan': '🌱 Vegan',
    'diet.flexitarian': '🥄 Flexitarian',
    'diet.pescatarian': '🐟 Pescatarian',
    
    // Diet Preferences (Urdu)
    'diet.vegetarian.ur': '🥬 سبزی خور',
    'diet.non.vegetarian.ur': '🍖 سبزی خور نہیں',
    'diet.vegan.ur': '🌱 ویگن',
    'diet.flexitarian.ur': '🥄 فلیکسیٹیرین',
    'diet.pescatarian.ur': '🐟 پیسکیٹیرین',
    
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
    'userinfo.title': 'Personalize Your AI Experience',
    'userinfo.step': 'AI Step',
    'userinfo.of': 'of',
    'userinfo.personal.info': 'AI Personal Information',
    'userinfo.goals.preferences': 'AI Goals & Preferences',
    'userinfo.medical.info': 'AI Medical Information',
    'userinfo.location': 'AI Location',
    'userinfo.age': 'AI Age',
    'userinfo.gender': 'AI Gender',
    'userinfo.height': 'AI Height',
    'userinfo.current.weight': 'AI Current Weight',
    'userinfo.body.goal': 'AI Body Goal',
    'userinfo.diet.preference': 'AI Diet Preference',
    'userinfo.occupation': 'AI Occupation',
    'userinfo.equipment': 'AI Equipment',
    'userinfo.medical.conditions': 'AI Medical Conditions',
    'userinfo.country': 'AI Country',
    'userinfo.years': 'AI years',
    'userinfo.previous': 'Previous AI Step',
    'userinfo.next': 'Next AI Step',
    'userinfo.complete': 'Complete AI Profile',
    'userinfo.cancel': 'Cancel',
    'userinfo.select.country': 'Select your AI country',
    'userinfo.select.goal': 'Select your AI goal',
    'userinfo.select.occupation': 'Select your AI occupation type',
    'userinfo.select.equipment': 'Select AI available equipment',
    'userinfo.placeholder.medical': 'e.g., diabetes, hypertension, PCOS, heart issues (or none)',
    'userinfo.summary.title': 'AI Summary',
    'userinfo.summary.text': 'We\'ll use this information to create your personalized AI diet and workout plans.',
    'userinfo.lifestyle.health': 'AI Lifestyle & Health',
    'userinfo.diet.preferences': 'AI Diet Preferences',
    'userinfo.select.diet': 'Select your AI diet preference',
    
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
    'permission.title': 'Welcome to AI PrimeForm! 🎉',
    'permission.subtitle': 'To provide you with personalized AI diet and workout plans, we need to collect some information about you.',
    'permission.start': 'Start',
    'permission.cancel': 'Cancel',

    // Profile Page
    'profile.noProfile.title': 'Complete Your AI Profile',
    'profile.noProfile.text': 'To get personalized AI diet and workout plans, we need some information about you.',
    'profile.noProfile.button': 'Create AI Profile',
    'profile.sections.personal': 'AI Personal Information',
    'profile.sections.goals': 'AI Goals & Preferences',
    'profile.sections.lifestyle': 'AI Lifestyle & Health',
    'profile.fields.country': 'Country',
    'profile.fields.age': 'Age',
    'profile.fields.gender': 'Gender',
    'profile.fields.height': 'Height',
    'profile.fields.weight': 'Current Weight',
    'profile.fields.bodyGoal': 'AI Body Goal',
    'profile.fields.dietPreference': 'AI Diet Preference',
    'profile.fields.occupation': 'AI Occupation',
    'profile.fields.equipment': 'AI Available Equipment',
    'profile.fields.medical': 'AI Medical Conditions',
    'profile.title': 'AI Profile',
    'profile.edit': 'Edit AI Profile',
    'profile.cancel': 'Cancel',
    'profile.save': 'Save AI Profile',
    'profile.notSpecified': 'Not specified',
    'profile.select': 'AI Select...',
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
     'dashboard.workout.plan': 'آج کا AI ورکاؤٹ پلان',
     'dashboard.meal.plan': 'آج کا AI کھانے کا پلان',
     'dashboard.view.full.workout': 'مکمل AI ورکاؤٹ دیکھیں',
     'dashboard.view.full.meal': 'مکمل AI کھانے کا پلان دیکھیں',
    
    // Navigation
    'nav.home': 'ہوم',
    'nav.diet': 'AI ڈائٹ',
    'nav.gym': 'جم',
    'nav.workout': 'AI ورکاؤٹ',
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
    'sidebar.tapToChange': 'تبدیل کرنے کے لیے ٹیپ کریں',
    'sidebar.upgrade': 'اپ گریڈ',
    'sidebar.appName': 'پرائم فارم',
    
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
    'onboarding.title': 'کیا آپ اپنی AI ڈائٹ اور ورکاؤٹ پلان کو ذاتی بنانے کے لیے AI سے چلنے والے سوالات کے لیے تیار ہیں؟',
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
    
    // Diet Page
    'diet.page.title': 'ڈائٹ پلان',
    'diet.page.subtitle': 'آپ کی ذاتی غذائی رہنمائی',
    'diet.page.generate.title': 'اپنا ڈائٹ پلان بنائیں',
    'diet.page.generate.description': 'اپنی معلومات فراہم کرنے اور اپنے اہداف کے مطابق ذاتی ڈائٹ پلان حاصل کرنے کے لیے کلک کریں',
    'diet.page.generate.button': 'ڈائٹ پلان بنائیں',
    'diet.page.features.title': 'آپ کو کیا ملے گا',
    'diet.page.features.personalized.title': 'ذاتی پلانز',
    'diet.page.features.personalized.text': 'آپ کے جسم، اہداف اور ترجیحات پر مبنی کسٹم غذائی پلانز',
    'diet.page.features.nutrition.title': 'غذائیت کا تجزیہ',
    'diet.page.features.nutrition.text': 'کیلوریز، میکروز اور مائیکرو نیوٹرینٹس کی تفصیلی تقسیم',
    'diet.page.features.meals.title': 'کھانے کے مشورے',
    'diet.page.features.meals.text': 'آپ کی غذائی ضروریات کے مطابق لذیذ کھانے کے خیالات',
    'diet.page.features.tracking.title': 'پیش رفت کی نگرانی',
    'diet.page.features.tracking.text': 'اپنی غذائی سفر کی نگرانی کریں اور نتائج دیکھیں',
    'diet.page.content.title': 'آپ کا ذاتی ڈائٹ پلان',
    'diet.page.content.description': 'آپ کی پروفائل کے مطابق، آپ کا ذاتی ڈائٹ پلان یہاں تفصیلی کھانے کے مشوروں، غذائی معلومات اور پیش رفت کی نگرانی کے ساتھ ظاہر ہوگا۔',
    
    // Workout Page
    'workout.page.title': 'ورکاؤٹ پلان',
    'workout.page.subtitle': 'آپ کی ذاتی فٹنس رہنمائی',
    'workout.page.generate.title': 'اپنا ورکاؤٹ پلان بنائیں',
    'workout.page.generate.description': 'اپنی معلومات فراہم کرنے اور آپ کی فٹنس لیول کے لیے ڈیزائن کردہ ذاتی ورکاؤٹ پلان حاصل کرنے کے لیے کلک کریں',
    'workout.page.generate.button': 'ورکاؤٹ پلان بنائیں',
    'workout.page.features.title': 'آپ کو کیا ملے گا',
    'workout.page.features.personalized.title': 'ذاتی پلانز',
    'workout.page.features.personalized.text': 'آپ کی فٹنس لیول اور اہداف پر مبنی کسٹم ورکاؤٹ روٹینز',
    'workout.page.features.progress.title': 'پیش رفت کی نگرانی',
    'workout.page.features.progress.text': 'اپنی طاقت میں اضافے اور فٹنس میں بہتری کی نگرانی کریں',
    'workout.page.features.exercises.title': 'ورزش کی لائبریری',
    'workout.page.features.exercises.text': 'درست فارم گائیڈز کے ساتھ سینکڑوں ورزشوں تک رسائی',
    'workout.page.features.tracking.title': 'ورکاؤٹ لاگنگ',
    'workout.page.features.tracking.text': 'اپنے ورکاؤٹس کی نگرانی کریں اور مستقل مزاجی برقرار رکھیں',
    'workout.page.content.title': 'آپ کا ذاتی ورکاؤٹ پلان',
    'workout.page.content.description': 'آپ کی پروفائل کے مطابق، آپ کا ذاتی ورکاؤٹ پلان یہاں ورزش کی روٹینز، سیٹس، ریپس اور پیش رفت کی نگرانی کے ساتھ ظاہر ہوگا۔',
    
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
    
    // Profile Summary
    'profile.summary.title': 'آپ کی پروفائل کا خلاصہ',
    'profile.summary.goal': 'مقصد:',
    'profile.summary.diet.preference': 'غذائی ترجیح:',
    'profile.summary.current.weight': 'موجودہ وزن:',
    'profile.summary.target.weight': 'ہدف وزن:',
    'profile.summary.occupation': 'کام کی قسم:',
    'profile.summary.equipment': 'سامان:',
    'profile.summary.medical.conditions': 'طبی حالات:',
    'profile.summary.none': 'کوئی نہیں',
    'profile.summary.confirm.generate': 'تصدیق کریں',
    
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
    'profile.notSpecified': 'متعلق نہیں',
    'profile.select': 'منتخب کریں...',
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
