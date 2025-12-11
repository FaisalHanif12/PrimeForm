import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, FadeInLeft, FadeInRight, SlideInUp, SlideInRight, ZoomIn } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useAuthContext } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import Sidebar from '../../src/components/Sidebar';
import ProfilePage from  '../../src/components/ProfilePage';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import { useToast } from '../../src/context/ToastContext';
import userProfileService from '../../src/services/userProfileService';
import NotificationModal from '../../src/components/NotificationModal';
import { useNotifications } from '../../src/contexts/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Enhanced workout categories with correct exercise counts and sport-style design
const workoutCategories = [
  {
    id: 'chest',
    name: 'Chest',
    iconName: 'fitness-outline',
    description: 'Build powerful pecs',
    exerciseCount: 6,
    gradientColors: ['#667eea', '#764ba2'],
    iconBg: '#667eea'
  },
  {
    id: 'back',
    name: 'Back',
    iconName: 'body-outline',
    description: 'Strengthen your spine',
    exerciseCount: 4,
    gradientColors: ['#f093fb', '#f5576c'],
    iconBg: '#f093fb'
  },
  {
    id: 'arms',
    name: 'Arms',
    iconName: 'barbell-outline',
    description: 'Sculpt strong arms',
    exerciseCount: 5,
    gradientColors: ['#4facfe', '#00f2fe'],
    iconBg: '#4facfe'
  },
  {
    id: 'legs',
    name: 'Legs',
    iconName: 'walk-outline',
    description: 'Power up your legs',
    exerciseCount: 8,
    gradientColors: ['#43e97b', '#38f9d7'],
    iconBg: '#43e97b'
  },
  {
    id: 'abs',
    name: 'Abs',
    iconName: 'accessibility-outline',
    description: 'Core strength & definition',
    exerciseCount: 9,
    gradientColors: ['#fa709a', '#fee140'],
    iconBg: '#fa709a'
  },
  {
    id: 'full_body',
    name: 'Full Body',
    iconName: 'accessibility',
    description: 'Complete workout',
    exerciseCount: 5,
    gradientColors: ['#a8edea', '#fed6e3'],
    iconBg: '#a8edea'
  },
];

const totalExercises = workoutCategories.reduce(
  (sum, category) => sum + (category.exerciseCount || 0),
  0,
);
const totalCategories = workoutCategories.length;

export default function GymScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const { unreadCount } = useNotifications();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [hasPersonalizedWorkout, setHasPersonalizedWorkout] = useState(false);

  const handleProfilePress = () => {
    setSidebarVisible(true);
  };

  const handleSidebarMenuPress = async (action: string) => {
    switch (action) {
      case 'profile':
        setShowProfilePage(true);
        break;
      case 'edit_profile':
        showToast('info', 'Edit profile feature coming soon!');
        break;
      case 'sport-mode':
        router.push('/(dashboard)/sport-mode');
        break;
      case 'streak':
        router.push('/(dashboard)/streak');
        break;
      case 'ai-trainer':
        router.push('/(dashboard)/ai-trainer');
        break;
      case 'language':
        router.push('/(dashboard)/language');
        break;
      case 'settings':
        router.push('/(dashboard)/settings');
        break;
      case 'subscription':
        showToast('info', 'Subscription Plan feature coming soon!');
        break;
      case 'contact':
        router.push('/(dashboard)/contact');
        break;
      case 'logout':
        try {
          const { authService } = await import('../../src/services/authService');
          await authService.logout();
          router.replace('/auth/login');
        } catch (error) {
          showToast('error', 'Failed to logout. Please try again.');
        }
        break;
    }
  };

  const handleUpdateUserInfo = async (updatedUserInfo: any) => {
    try {
      const response = await userProfileService.createOrUpdateProfile(updatedUserInfo);
      if (response.success) {
        setUserInfo(updatedUserInfo);
      } else {
        showToast('error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      showToast('error', 'Failed to update profile. Please check your connection and try again.');
    }
  };

  // Load user info when profile page is opened if it's missing
  useEffect(() => {
    if (showProfilePage && !userInfo) {
      const loadUserInfo = async () => {
        try {
          const cachedData = userProfileService.getCachedData();
          if (cachedData && cachedData.data) {
            setUserInfo(cachedData.data);
          } else {
            const response = await userProfileService.getUserProfile();
            if (response.success && response.data) {
              setUserInfo(response.data);
            }
          }
        } catch (error) {
          // Failed to load user info
        }
      };
      loadUserInfo();
    }
  }, [showProfilePage]);

  // Check if user has personalized workout
  useEffect(() => {
    checkPersonalizedWorkout();
  }, []);

  const checkPersonalizedWorkout = async () => {
    try {
      const savedExercises = await AsyncStorage.getItem('personalizedWorkout');
      setHasPersonalizedWorkout(!!savedExercises);
    } catch (error) {
      console.error('Error checking personalized workout:', error);
    }
  };

  const handlePersonalizedWorkoutPress = () => {
    if (hasPersonalizedWorkout) {
      // Navigate to personalized workout screen
      router.push('/(dashboard)/personalized-workout');
    } else {
      // Navigate to exercise selection screen
      router.push('/(dashboard)/create-personalized-workout');
    }
  };

  const handleTabPress = (tab: 'home' | 'diet' | 'gym' | 'workout' | 'progress') => {
    if (tab === 'home') {
      router.push('/(dashboard)');
    } else if (tab === 'diet') {
      router.push('/(dashboard)/diet');
    } else if (tab === 'workout') {
      router.push('/(dashboard)/workout');
    } else if (tab === 'progress') {
      router.push('/(dashboard)/progress');
    } else {
      console.log('Feature coming soon:', tab);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    // Navigate to exercise listing page with enhanced parameters (gender removed)
    router.push({
      pathname: '/gym-exercises',
      params: {
        category: categoryId,
        categoryName: workoutCategories.find(cat => cat.id === categoryId)?.name || categoryId,
      },
    });
  };

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        <DashboardHeader
          userName={user?.fullName || 'User'}
          onProfilePress={handleProfilePress}
          onNotificationPress={() => setShowNotificationModal(true)}
          notificationCount={unreadCount}
        />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <Animated.View entering={FadeInUp} style={styles.heroSection}>
            <LinearGradient
              colors={['rgba(0, 201, 124, 0.2)', 'rgba(0, 201, 124, 0.05)']}
              style={styles.heroGradient}
            >
              <Text style={styles.heroTitle}>Transform Your Body</Text>
              <Text style={styles.heroSubtitle}>Choose your perfect workout experience</Text>
              <View style={styles.heroStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{totalExercises}</Text>
                  <Text style={styles.statLabel}>Exercises</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{totalCategories}</Text>
                  <Text style={styles.statLabel}>Categories</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>24/7</Text>
                  <Text style={styles.statLabel}>Access</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Categories Section */}
          <Animated.View entering={SlideInUp.delay(200)} style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Workout Categories</Text>
            <View style={styles.categoriesGrid}>
              {workoutCategories.map((category, index) => (
                <Animated.View
                  key={category.id}
                  entering={FadeInUp.delay(300 + (index * 100))}
                  style={styles.categoryWrapper}
                >
                  <TouchableOpacity
                    style={styles.categoryCard}
                    onPress={() => handleCategoryPress(category.id)}
                    activeOpacity={0.85}
                  >
                    {/** Use normal app color for card background */}
                    <LinearGradient
                      // Use normal app surface colors instead of green
                      colors={[colors.surface, colors.cardBackground] as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.categoryGradient}
                    >
                      <View style={styles.categoryLeft}>
                        {/* Icon */}
                        <View style={[styles.categoryIconContainer, { backgroundColor: colors.cardBackground }]}>
                          <Ionicons
                            name={category.iconName as any}
                            size={28}
                            color={colors.white}
                          />
                        </View>

                        {/* Text content */}
                        <View style={styles.categoryTextContainer}>
                          <Text style={styles.categoryName}>{category.name}</Text>
                          <Text style={styles.categoryDescription}>{category.description}</Text>
                          <Text style={styles.exerciseCount}>
                            {category.exerciseCount} exercises
                          </Text>
                        </View>
                      </View>

                      {/* Arrow on the right */}
                      <View style={[styles.categoryArrowCircle, { backgroundColor: colors.cardBackground }]}>
                        <Ionicons name="chevron-forward" size={22} color={colors.white} />
                      </View>

                      {/* Bottom accent bar - Keep green */}
                      <View
                        style={[
                          styles.categoryBottomBorder,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Floating CTA Button */}
        <Animated.View 
          entering={ZoomIn.delay(600).springify()} 
          style={styles.floatingButton}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePersonalizedWorkoutPress}
            style={styles.ctaButton}
          >
            <LinearGradient
              colors={[colors.primary, colors.primary + 'DD'] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Ionicons 
                name={hasPersonalizedWorkout ? "fitness" : "add-circle"} 
                size={28} 
                color={colors.white} 
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <BottomNavigation activeTab="gym" onTabPress={handleTabPress} />

        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onMenuItemPress={handleSidebarMenuPress}
          userName={user?.fullName || 'User'}
          userEmail={user?.email || 'user@example.com'}
          userInfo={userInfo}
          badges={userInfo?.badges || []}
        />

        <ProfilePage
          visible={showProfilePage}
          onClose={() => setShowProfilePage(false)}
          userInfo={userInfo}
          onUpdateUserInfo={handleUpdateUserInfo}
        />

        <NotificationModal
          visible={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
        />
      </SafeAreaView>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },

  // Hero Section
  heroSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  heroTitle: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: colors.mutedText,
    fontSize: 16,
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: fonts.heading,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.cardBorder,
    marginHorizontal: spacing.lg,
  },

  // Section Styles
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  // Gender Section
  // Categories Section
  categoriesSection: {
    marginBottom: spacing.xl,
  },
  categoriesGrid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  categoryWrapper: {
    marginBottom: spacing.md,
  },
  categoryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    minHeight: 100,
    position: 'relative',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryName: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: 4,
  },
  categoryDescription: {
    color: colors.mutedText,
    fontSize: 14,
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  exerciseCount: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.body,
    color: colors.white,
    opacity: 0.8,
  },
  categoryArrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBottomBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
  },

  bottomSpacing: {
    height: 100,
  },

  // Floating CTA Button
  floatingButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 120,
    zIndex: 10,
  },
  ctaButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  ctaGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});