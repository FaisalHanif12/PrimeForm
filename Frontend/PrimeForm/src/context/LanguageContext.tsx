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
  hasSelectedLanguage: boolean;
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
    'auth.signup.subtitle': 'Join Pure Body today',
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
    'sidebar.subscription.description': 'Get AI workout plans, diet plans & more',
    'sidebar.logout': 'Log Out',
    'sidebar.language': 'Language',
    'sidebar.version': 'Version 1.0.0',
    'sidebar.profile.details': 'Profile Details',
    'sidebar.view.profile': 'View Full Profile',
    'sidebar.tapToChange': 'Tap to change',
    'sidebar.upgrade': 'UPGRADE',
    'sidebar.appName': 'Pure Body',

    // Common
    'common.loading': 'Loading Pure Body...',
    'common.error': 'Something went wrong',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
    'common.save': 'Save',

    // Brand
    'brand.primeform': 'PURE BODY',

    // Settings Page
    'settings.notification.preferences': 'Notification Preferences',
    'settings.push.notifications': 'Push Notifications',
    'settings.push.notifications.desc': 'Receive notifications on your device',
    'settings.workout.reminders': 'Workout Reminders',
    'settings.workout.reminders.desc': 'Get reminded about your workout schedule',
    'settings.diet.reminders': 'Diet Reminders',
    'settings.diet.reminders.desc': 'Get reminded about meal times and nutrition',
    'settings.progress.updates': 'Progress Updates',
    'settings.progress.updates.desc': 'Get notified about your fitness progress',
    'settings.software.updates': 'Software Updates',
    'settings.software.updates.desc': 'Get notified about app updates',

    'settings.current.version': 'Current Version: 1.0.0',
    'settings.update.available': 'Update Available:',
    'settings.update.size': 'Size:',
    'settings.update.date': 'Release Date:',
    'settings.update.now': 'Update Now',
    'settings.up.to.date': 'Up to Date',
    'settings.updating': 'Updating...',
    'settings.open.app.store': 'Open App Store',
    'settings.app.information': 'App Information',
    'settings.app.name': 'App Name',
    'settings.app.version': 'Version',
    'settings.app.build': 'Build',
    'settings.app.platform': 'Platform',
    'settings.app.language': 'Language',
    'settings.app.language.english': 'English',
    'settings.app.language.urdu': 'اردو',

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
    'app.name': 'Pure Body',

    // Gym Section
    'gym.title': 'Gym Exercises',
    'gym.subtitle': 'Choose your section and start your fitness journey',
    'gym.men': 'MEN',
    'gym.women': 'WOMEN',
    'gym.filterBy': 'Filter by Target Area',
    'gym.filterByLocation': 'Filter by Location',
    'gym.noExercises': 'No exercises found',
    'gym.noExercisesSubtitle': 'Try selecting a different target area or section',

    // Exercise Names
    'exercise.pushups': 'Push-ups',
    'exercise.pullups': 'Pull-ups',
    'exercise.squats': 'Squats',
    'exercise.deadlifts': 'Deadlifts',
    'exercise.benchpress': 'Bench Press',
    'exercise.bicepCurls': 'Bicep Curls',
    'exercise.shoulderPress': 'Shoulder Press',
    'exercise.planks': 'Planks',
    'exercise.cycling': 'Cycling',
    'exercise.rowing': 'Rowing',
    'exercise.jumping_jacks': 'Jumping Jacks',
    'exercise.dumbbell_rows': 'Dumbbell Rows',
    'exercise.lunges': 'Lunges',
    'exercise.glute_bridges': 'Glute Bridges',
    'exercise.mountain_climbers': 'Mountain Climbers',
    'exercise.tricep_dips': 'Tricep Dips',
    'exercise.burpees': 'Burpees',
    'exercise.yoga': 'Yoga',
    'exercise.pilates': 'Pilates',
    'exercise.dance_cardio': 'Dance Cardio',

    // Exercise Categories
    'category.chest': 'chest',
    'category.back': 'back',
    'category.legs': 'legs',
    'category.arms': 'arms',
    'category.shoulders': 'shoulders',
    'category.core': 'core',
    'category.cardio': 'cardio',
    'category.full_body': 'full body',
    'category.glutes': 'glutes',
    'category.flexibility': 'flexibility',

    // Muscle Groups
    'muscle.chest': 'chest',
    'muscle.triceps': 'triceps',
    'muscle.shoulders': 'shoulders',
    'muscle.back': 'back',
    'muscle.biceps': 'biceps',
    'muscle.quadriceps': 'quadriceps',
    'muscle.glutes': 'glutes',
    'muscle.hamstrings': 'hamstrings',
    'muscle.core': 'core',
    'muscle.legs': 'legs',
    'muscle.arms': 'arms',
    'muscle.full_body': 'full body',
    'muscle.flexibility': 'flexibility',

    // Exercise Detail Page
    'exercise.detail.targetMuscles': 'Target Muscles',
    'exercise.detail.demonstration': 'Exercise Demonstration',
    'exercise.detail.tapToPlay': 'Tap to play demonstration',
    'exercise.detail.chooseLevel': 'Choose Your Level',
    'exercise.detail.duration': 'Duration',
    'exercise.detail.reps': 'Reps',
    'exercise.detail.sets': 'Sets',
    'exercise.detail.proTips': '💡 Pro Tips',
    'exercise.detail.startWorkout': 'Start Workout',
    'exercise.detail.beginner': 'BEGINNER',
    'exercise.detail.medium': 'MEDIUM',
    'exercise.detail.advanced': 'ADVANCED',

    // Onboarding
    'onboarding.title': 'Are you ready for AI driven questions to personalize your AI diet and workout plan?',
    'onboarding.description': '',
    'onboarding.start': 'Start',
    'onboarding.cancel': 'Cancel',

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
    'profile.summary.title': 'Your Profile Summary',
    'profile.summary.goal': 'Goal:',
    'profile.summary.diet.preference': 'Diet Preference:',
    'profile.summary.current.weight': 'Current Weight:',
    'profile.summary.target.weight': 'Target Weight:',
    'profile.summary.occupation': 'Occupation:',
    'profile.summary.equipment': 'Equipment:',
    'profile.summary.medical.conditions': 'Medical Conditions:',
    'profile.summary.none': 'None',
    'profile.summary.confirm.generate': 'Confirm Generate',

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
    'userinfo.title': 'Tell us about yourself',
    'userinfo.step': 'Step',
    'userinfo.of': 'of',
    'userinfo.personal.info': 'Personal information',
    'userinfo.goals.preferences': 'Goals & preferences',
    'userinfo.medical.info': 'Medical information',
    'userinfo.location': 'Location',
    'userinfo.age': 'Age',
    'userinfo.gender': 'Gender',
    'userinfo.height': 'Height',
    'userinfo.current.weight': 'Current weight',
    'userinfo.body.goal': 'Body goal',
    'userinfo.diet.preference': 'Diet preference',
    'userinfo.occupation': 'Occupation',
    'userinfo.equipment': 'Equipment',
    'userinfo.medical.conditions': 'Medical conditions',
    'userinfo.country': 'Country',
    'userinfo.years': 'years',
    'userinfo.previous': 'Previous',
    'userinfo.next': 'Next',
    'userinfo.complete': 'Complete profile',
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
    'permission.title': 'Welcome to AI Pure Body! 🎉',
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
    'profile.edit': 'Edit Profile',
    'profile.cancel': 'Cancel',
    'profile.save': 'Save Profile',
    'profile.notSpecified': 'Not specified',
    'profile.select': 'AI Select...',

    // Location Labels
    'location.home': 'Home',
    'location.gym': 'Gym',
    'location.both': 'Both',

    // Language Preferences Page
    'language.preferences.title': 'Language Preferences',
    'language.preferences.subtitle': 'Choose your preferred language for the app interface',
    'language.preferences.current': 'Current',
    'language.preferences.available': 'Available Languages',
    'language.preferences.select': 'Select a language to change',
    'language.preferences.active': 'Active',
    'language.preferences.changed': 'Language changed to',
    'language.preferences.changeFailed': 'Failed to change language. Please try again.',
    'language.preferences.actionFailed': 'Unable to complete that action. Please try again.',

    // Contact Page
    'contact.title': 'Get in Touch',
    'contact.subtitle': 'Have a question or need help? Send us a message and we\'ll get back to you as soon as possible.',
    'contact.form.name': 'Full Name',
    'contact.form.name.placeholder': 'Enter your full name',
    'contact.form.email': 'Email Address',
    'contact.form.email.placeholder': 'Enter your email address',
    'contact.form.problem': 'Describe Your Problem',
    'contact.form.problem.placeholder': 'Please describe your problem or question in detail...',
    'contact.form.characters': 'characters',
    'contact.form.sending': 'Sending...',
    'contact.form.send': 'Send Message',
    'contact.validation.name': 'Please enter your name',
    'contact.validation.email': 'Please enter your email',
    'contact.validation.emailInvalid': 'Please enter a valid email address',
    'contact.validation.problem': 'Please describe your problem',
    'contact.validation.problemMin': 'Please provide more details about your problem (at least 10 characters)',
    'contact.success': 'Message sent successfully! We\'ll get back to you soon.',
    'contact.error.send': 'Failed to send email. Please try again.',
    'contact.error.message': 'Failed to send message. Please try again later.',
    'contact.error.general': 'Something went wrong. Please try again.',

    // AI Trainer Page
    'aiTrainer.title': 'AI Trainer',
    'aiTrainer.subtitle': 'Your Personal Fitness Coach',
    'aiTrainer.loading': 'Initializing AI Trainer...',
    'aiTrainer.loadMore': 'Load previous messages',
    'aiTrainer.placeholder': 'Ask about your workout and diet...',
    'aiTrainer.welcome': 'Hello {name}! I\'m your AI Trainer. I\'m here to help you optimize your workouts, nutrition, and overall fitness journey. What would you like to know?',
    'aiTrainer.welcome.guest': 'Hello there! I\'m your AI Trainer. I\'m here to help you optimize your workouts, nutrition, and overall fitness journey. What would you like to know?',
    'aiTrainer.premiumOnly': 'AI Trainer is available for Premium subscribers only.',
    'aiTrainer.error.loadHistory': 'Failed to load chat history.',
    'aiTrainer.error.loadConversation': 'Failed to load conversation.',
    'aiTrainer.success.newChat': 'New chat started',
    'aiTrainer.error.newChat': 'Failed to create new chat.',
    'aiTrainer.error.send': 'Failed to send message. Please try again.',
    'aiTrainer.error.logout': 'Failed to logout.',
    'aiTrainer.limit.reached': 'You have reached today\'s limit of 3 messages to the AI Trainer. Please come back tomorrow.',
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
    'auth.signup.subtitle': 'آج ہی پیور باڈی میں شامل ہوں',
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
    'nav.diet': 'ذہین ڈائٹ',
    'nav.gym': 'جم',
    'nav.workout': 'ذہین ورکاؤٹ',
    'nav.progress': 'پیش قدمی',

    // Sidebar
    'sidebar.profile': 'پروفائل',
    'sidebar.settings': 'سیٹنگز',
    'sidebar.subscription': 'سبسکرپشن پلان',
    'sidebar.subscription.description': 'AI ورکاؤٹ پلانز، ڈائٹ پلانز اور مزید حاصل کریں',
    'sidebar.logout': 'لاگ آؤٹ',
    'sidebar.language': 'زبان',
    'sidebar.version': 'ورژن 1.0.0',
    'sidebar.profile.details': 'پروفائل کی تفصیلات',
    'sidebar.view.profile': 'مکمل پروفائل دیکھیں',
    'sidebar.tapToChange': 'تبدیل کرنے کے لیے ٹیپ کریں',
    'sidebar.upgrade': 'اپ گریڈ',
    'sidebar.appName': 'پیور باڈی',

    // Common
    'common.loading': 'پیور باڈی لوڈ ہو رہا ہے...',
    'common.error': 'کچھ غلط ہو گیا',
    'common.retry': 'دوبارہ کوشش',
    'common.cancel': 'منسوخ',
    'common.save': 'محفوظ',

    // Brand
    'brand.primeform': 'پیور باڈی',

    // Settings Page
    'settings.notification.preferences': 'نوٹیفیکیشن کی ترجیحات',
    'settings.push.notifications': 'پش نوٹیفیکیشنز',
    'settings.push.notifications.desc': 'اپنے ڈیوائس پر نوٹیفیکیشنز وصول کریں',
    'settings.workout.reminders': 'ورکاؤٹ یاد دہانیاں',
    'settings.workout.reminders.desc': 'اپنے ورکاؤٹ شیڈول کے بارے میں یاد دہانی حاصل کریں',
    'settings.diet.reminders': 'کھانے کی یاد دہانیاں',
    'settings.diet.reminders.desc': 'کھانے کے اوقات اور غذائیت کے بارے میں یاد دہانی حاصل کریں',
    'settings.progress.updates': 'پیش قدمی کی اپ ڈیٹس',
    'settings.progress.updates.desc': 'اپنی فٹنس پیش قدمی کے بارے میں مطلع کریں',
    'settings.software.updates': 'سافٹ ویئر اپ ڈیٹس',
    'settings.software.updates.desc': 'ایپ اپ ڈیٹس کے بارے میں مطلع کریں',

    'settings.current.version': 'موجودہ ورژن: 1.0.0',
    'settings.update.available': 'اپ ڈیٹ دستیاب:',
    'settings.update.size': 'سائز:',
    'settings.update.date': 'ریلیز کی تاریخ:',
    'settings.update.now': 'اب اپ ڈیٹ کریں',
    'settings.up.to.date': 'تازہ ترین',
    'settings.updating': 'اپ ڈیٹ ہو رہا ہے...',
    'settings.open.app.store': 'ایپ اسٹور کھولیں',
    'settings.app.information': 'ایپ کی معلومات',
    'settings.app.name': 'ایپ کا نام',
    'settings.app.version': 'ورژن',
    'settings.app.build': 'بلڈ',
    'settings.app.platform': 'پلیٹ فارم',
    'settings.app.language': 'زبان',
    'settings.app.language.english': 'انگریزی',
    'settings.app.language.urdu': 'اردو',

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
    'app.name': 'پیور باڈی',

    // Onboarding
    'onboarding.title': 'کیا آپ اپنی AI ڈائٹ اور ورکاؤٹ پلان کو ذاتی بنانے کے لیے AI سے چلنے والے سوالات کے لیے تیار ہیں؟',
    'onboarding.description': '',
    'onboarding.start': 'شروع کریں',
    'onboarding.cancel': 'منسوخ',

    // Workout Page
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
    'permission.title': 'پیور باڈی میں خوش آمدید! 🎉',
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

    // Gym Section
    'gym.title': '💪 جم ایکسرسائز',
    'gym.subtitle': 'اپنا سیکشن منتخب کریں اور اپنا فٹنس سفر شروع کریں',
    'gym.men': 'مرد',
    'gym.women': 'خواتین',
    'gym.filterBy': 'ٹارگٹ ایریا کے مطابق فلٹر کریں',
    'gym.filterByLocation': 'مقام کے مطابق فلٹر کریں',
    'gym.noExercises': 'کوئی ورزش نہیں ملی',
    'gym.noExercisesSubtitle': 'مختلف ٹارگٹ ایریا یا سیکشن منتخب کرنے کی کوشش کریں',

    // Exercise Names
    'exercise.pushups': 'پش اپس',
    'exercise.pullups': 'پل اپس',
    'exercise.squats': 'اسکواٹس',
    'exercise.deadlifts': 'ڈیڈ لفٹس',
    'exercise.benchpress': 'بینچ پریس',
    'exercise.bicepCurls': 'بائسپ کرلز',
    'exercise.shoulderPress': 'شولڈر پریس',
    'exercise.planks': 'پلانکس',
    'exercise.cycling': 'سائیکلنگ',
    'exercise.rowing': 'رونگ',
    'exercise.jumping_jacks': 'جمپنگ جیکس',
    'exercise.dumbbell_rows': 'ڈمبل رو',
    'exercise.lunges': 'لنجز',
    'exercise.glute_bridges': 'گلوٹ برجز',
    'exercise.mountain_climbers': 'ماؤنٹین کلائمبرز',
    'exercise.tricep_dips': 'ٹرائسپ ڈپس',
    'exercise.burpees': 'برپیز',
    'exercise.yoga': 'یوگا',
    'exercise.pilates': 'پائلیٹس',
    'exercise.dance_cardio': 'ڈانس کارڈیو',

    // Exercise Categories
    'category.chest': 'سینہ',
    'category.back': 'کمر',
    'category.legs': 'ٹانگیں',
    'category.arms': 'بازو',
    'category.shoulders': 'کندھے',
    'category.core': 'پیٹ',
    'category.cardio': 'کارڈیو',
    'category.full_body': 'پورا جسم',
    'category.glutes': 'کولہے',
    'category.flexibility': 'لچک',

    // Muscle Groups
    'muscle.chest': 'سینہ',
    'muscle.triceps': 'ٹرائسپس',
    'muscle.shoulders': 'کندھے',
    'muscle.back': 'کمر',
    'muscle.biceps': 'بائسپس',
    'muscle.quadriceps': 'کواڈرسپس',
    'muscle.glutes': 'کولہے',
    'muscle.hamstrings': 'ہیمسٹرنگز',
    'muscle.core': 'پیٹ',
    'muscle.legs': 'ٹانگیں',
    'muscle.arms': 'بازو',
    'muscle.full_body': 'پورا جسم',
    'muscle.flexibility': 'لچک',

    // Exercise Detail Page
    'exercise.detail.targetMuscles': 'ہدف کے پٹھے',
    'exercise.detail.demonstration': 'ورزش کا مظاہرہ',
    'exercise.detail.tapToPlay': 'مظاہرہ چلانے کے لیے ٹیپ کریں',
    'exercise.detail.chooseLevel': 'اپنا لیول منتخب کریں',
    'exercise.detail.duration': 'مدت',
    'exercise.detail.reps': 'بار',
    'exercise.detail.sets': 'سیٹس',
    'exercise.detail.proTips': '💡 پرو ٹپس',
    'exercise.detail.startWorkout': 'ورکاؤٹ شروع کریں',
    'exercise.detail.beginner': 'ابتدائی',
    'exercise.detail.medium': 'درمیانہ',
    'exercise.detail.advanced': 'ایڈوانس',

    // Location Labels
    'location.home': 'Home',
    'location.gym': 'Gym',
    'location.both': 'Both',

    // Language Preferences Page
    'language.preferences.title': 'زبان کی ترجیحات',
    'language.preferences.subtitle': 'ایپ انٹرفیس کے لیے اپنی پسندیدہ زبان منتخب کریں',
    'language.preferences.current': 'موجودہ',
    'language.preferences.available': 'دستیاب زبانیں',
    'language.preferences.select': 'تبدیل کرنے کے لیے زبان منتخب کریں',
    'language.preferences.active': 'فعال',
    'language.preferences.changed': 'زبان تبدیل ہو گئی',
    'language.preferences.changeFailed': 'زبان تبدیل کرنے میں ناکامی۔ برائے کرم دوبارہ کوشش کریں۔',
    'language.preferences.actionFailed': 'اس عمل کو مکمل نہیں کر سکے۔ برائے کرم دوبارہ کوشش کریں۔',

    // Contact Page
    'contact.title': 'رابطہ کریں',
    'contact.subtitle': 'کوئی سوال ہے یا مدد چاہیے؟ ہمیں پیغام بھیجیں اور ہم جلد از جلد آپ سے رابطہ کریں گے۔',
    'contact.form.name': 'مکمل نام',
    'contact.form.name.placeholder': 'اپنا مکمل نام درج کریں',
    'contact.form.email': 'ای میل ایڈریس',
    'contact.form.email.placeholder': 'اپنا ای میل ایڈریس درج کریں',
    'contact.form.problem': 'اپنا مسئلہ بیان کریں',
    'contact.form.problem.placeholder': 'برائے کرم اپنا مسئلہ یا سوال تفصیل سے بیان کریں...',
    'contact.form.characters': 'حروف',
    'contact.form.sending': 'بھیج رہے ہیں...',
    'contact.form.send': 'پیغام بھیجیں',
    'contact.validation.name': 'برائے کرم اپنا نام درج کریں',
    'contact.validation.email': 'برائے کرم اپنا ای میل درج کریں',
    'contact.validation.emailInvalid': 'برائے کرم صحیح ای میل ایڈریس درج کریں',
    'contact.validation.problem': 'برائے کرم اپنا مسئلہ بیان کریں',
    'contact.validation.problemMin': 'برائے کرم اپنے مسئلے کے بارے میں مزید تفصیلات فراہم کریں (کم از کم 10 حروف)',
    'contact.success': 'پیغام کامیابی سے بھیج دیا گیا! ہم جلد از جلد آپ سے رابطہ کریں گے۔',
    'contact.error.send': 'ای میل بھیجنے میں ناکامی۔ برائے کرم دوبارہ کوشش کریں۔',
    'contact.error.message': 'پیغام بھیجنے میں ناکامی۔ برائے کرم بعد میں دوبارہ کوشش کریں۔',
    'contact.error.general': 'کچھ غلط ہو گیا۔ برائے کرم دوبارہ کوشش کریں۔',

    // AI Trainer Page
    'aiTrainer.title': 'AI ٹرینر',
    'aiTrainer.subtitle': 'آپ کا ذاتی فٹنس کوچ',
    'aiTrainer.loading': 'AI ٹرینر شروع ہو رہا ہے...',
    'aiTrainer.loadMore': 'پچھلے پیغامات لوڈ کریں',
    'aiTrainer.placeholder': 'اپنے ورکاؤٹ اور ڈائٹ کے بارے میں پوچھیں...',
    'aiTrainer.welcome': 'ہیلو {name}! میں آپ کا AI ٹرینر ہوں۔ میں یہاں آپ کی ورکاؤٹس، غذائیت اور مجموعی فٹنس سفر کو بہتر بنانے میں مدد کے لیے ہوں۔ آپ کیا جاننا چاہیں گے؟',
    'aiTrainer.welcome.guest': 'ہیلو! میں آپ کا AI ٹرینر ہوں۔ میں یہاں آپ کی ورکاؤٹس، غذائیت اور مجموعی فٹنس سفر کو بہتر بنانے میں مدد کے لیے ہوں۔ آپ کیا جاننا چاہیں گے؟',
    'aiTrainer.premiumOnly': 'AI ٹرینر صرف پریمیم صارفین کے لیے دستیاب ہے۔',
    'aiTrainer.error.loadHistory': 'چیٹ ہسٹری لوڈ کرنے میں ناکامی۔',
    'aiTrainer.error.loadConversation': 'بات چیت لوڈ کرنے میں ناکامی۔',
    'aiTrainer.success.newChat': 'نیا چیٹ شروع ہو گیا',
    'aiTrainer.error.newChat': 'نیا چیٹ بنانے میں ناکامی۔',
    'aiTrainer.error.send': 'پیغام بھیجنے میں ناکامی۔ برائے کرم دوبارہ کوشش کریں۔',
    'aiTrainer.error.logout': 'لاگ آؤٹ کرنے میں ناکامی۔',
    'aiTrainer.limit.reached': 'آپ نے AI ٹرینر کو آج کی 3 پیغامات کی حد تک پہنچ گئے ہیں۔ برائے کرم کل واپس آئیں۔',
  },
};

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>('en');
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('primeform_language_selected');
        const deviceLanguageSelected = await AsyncStorage.getItem('primeform_device_language_selected');
        const hasEverSignedUp = await AsyncStorage.getItem('primeform_has_ever_signed_up');

        console.log('🌍 LanguageContext: Loading language from storage:', {
          savedLanguage,
          deviceLanguageSelected,
          hasEverSignedUp
        });

        // CRITICAL: If user has ever signed up, always mark language as selected
        // According to workflow Phase 4: After sign-up, language modal NEVER appears again
        if (hasEverSignedUp === 'true') {
          console.log('🚫 LanguageContext: User has signed up before - language marked as selected');
          setHasSelectedLanguage(true);
          // Use saved language or default to English
          const finalLanguage = (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ur')) ? savedLanguage : 'en';
          setLanguage(finalLanguage);
          // Ensure device language is also marked as selected
          await AsyncStorage.setItem('primeform_device_language_selected', 'true');
          return;
        }

        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ur')) {
          setLanguage(savedLanguage);
          setHasSelectedLanguage(true);
          console.log('✅ LanguageContext: Language loaded and marked as selected');
        } else if (deviceLanguageSelected === 'true') {
          // Device language was selected before, use default English
          setLanguage('en');
          setHasSelectedLanguage(true);
          console.log('✅ LanguageContext: Device language previously selected, using English default');
        } else {
          // If no language is saved and device language not selected, mark as not selected
          setLanguage('en');
          setHasSelectedLanguage(false);
          console.log('🌍 LanguageContext: No saved language, defaulting to English');
        }
      } catch (error) {
        console.error('Failed to load language:', error);
        // Fallback to English
        setLanguage('en');
        setHasSelectedLanguage(false);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('primeform_language_selected', lang);
      setLanguage(lang);
      setHasSelectedLanguage(true);
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
    hasSelectedLanguage,
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
