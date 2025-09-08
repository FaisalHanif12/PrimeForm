import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, FadeInLeft, FadeInRight, SlideInUp } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useAuthContext } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import Sidebar from '../../src/components/Sidebar';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import { useToast } from '../../src/context/ToastContext';
// Using Expo Vector Icons instead
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Enhanced workout categories with correct exercise counts and elegant design
const workoutCategories = [
  { 
    id: 'chest', 
    name: 'Chest', 
    emoji: '💪', 
    description: 'Build powerful pecs',
    exerciseCount: 8,
    gradientColors: ['#667eea', '#764ba2'],
    iconBg: '#667eea'
  },
  { 
    id: 'back', 
    name: 'Back', 
    emoji: '🏋️', 
    description: 'Strengthen your spine',
    exerciseCount: 6,
    gradientColors: ['#f093fb', '#f5576c'],
    iconBg: '#f093fb'
  },
  { 
    id: 'arms', 
    name: 'Arms', 
    emoji: '💪', 
    description: 'Sculpt strong arms',
    exerciseCount: 5,
    gradientColors: ['#4facfe', '#00f2fe'],
    iconBg: '#4facfe'
  },
  { 
    id: 'legs', 
    name: 'Legs', 
    emoji: '🦵', 
    description: 'Power up your legs',
    exerciseCount: 6,
    gradientColors: ['#43e97b', '#38f9d7'],
    iconBg: '#43e97b'
  },
  { 
    id: 'abs', 
    name: 'Abs', 
    emoji: '🔥', 
    description: 'Core strength & definition',
    exerciseCount: 7,
    gradientColors: ['#fa709a', '#fee140'],
    iconBg: '#fa709a'
  },
  { 
    id: 'full_body', 
    name: 'Full Body', 
    emoji: '🚀', 
    description: 'Complete workout',
    exerciseCount: 8,
    gradientColors: ['#a8edea', '#fed6e3'],
    iconBg: '#a8edea'
  },
];

export default function GymScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'men' | 'women'>('men');

  const handleProfilePress = () => {
    setSidebarVisible(true);
  };

  const handleSidebarMenuPress = async (action: string) => {
    switch (action) {
      case 'profile':
        router.push('/(dashboard)');
        break;
      case 'edit_profile':
        showToast('info', 'Edit profile feature coming soon!');
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
          console.error('Logout failed:', error);
          showToast('error', 'Failed to logout. Please try again.');
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
    setSidebarVisible(false);
  };

  const handleTabPress = (tab: 'home' | 'diet' | 'gym' | 'workout' | 'progress') => {
    if (tab === 'home') {
      router.push('/(dashboard)');
    } else if (tab === 'diet') {
      router.push('/(dashboard)/diet');
    } else if (tab === 'workout') {
      router.push('/(dashboard)/workout');
    } else {
      console.log('Feature coming soon:', tab);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    // Navigate to exercise listing page with enhanced parameters
    router.push({
      pathname: '/gym-exercises',
      params: {
        category: categoryId,
        gender: selectedGender,
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
          onNotificationPress={() => console.log('Notifications pressed')}
          notificationCount={0}
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
                  <Text style={styles.statNumber}>89</Text>
                  <Text style={styles.statLabel}>Exercises</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>6</Text>
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

          {/* Gender Selector */}
          <Animated.View entering={FadeInLeft.delay(100)} style={styles.genderSection}>
            <Text style={styles.sectionTitle}>Choose Your Profile</Text>
            <View style={styles.genderSelector}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  selectedGender === 'men' && styles.genderButtonActive
                ]}
                onPress={() => setSelectedGender('men')}
                activeOpacity={0.8}
              >
                <Text style={styles.genderEmoji}>👨</Text>
                <Text style={[
                  styles.genderButtonText,
                  selectedGender === 'men' && styles.genderButtonTextActive
                ]}>
                  Men
                </Text>
                <Text style={styles.genderDescription}>Strength focused</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  selectedGender === 'women' && styles.genderButtonActive
                ]}
                onPress={() => setSelectedGender('women')}
                activeOpacity={0.8}
              >
                <Text style={styles.genderEmoji}>👩</Text>
                <Text style={[
                  styles.genderButtonText,
                  selectedGender === 'women' && styles.genderButtonTextActive
                ]}>
                  Women
                </Text>
                <Text style={styles.genderDescription}>Toned & strong</Text>
              </TouchableOpacity>
            </View>
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
                    activeOpacity={0.9}
                  >
                    <View style={styles.categoryCardContent}>
                      <View style={[styles.categoryIconContainer, { backgroundColor: category.iconBg + '20' }]}>
                        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                      </View>
                      
                      <View style={styles.categoryTextContainer}>
                        <Text style={styles.categoryName}>{category.name}</Text>
                        <Text style={styles.categoryDescription}>{category.description}</Text>
                        <View style={styles.categoryFooter}>
                          <Text style={styles.exerciseCount}>{category.exerciseCount} exercises</Text>
                        </View>
                      </View>
                      
                      <View style={styles.categoryArrowContainer}>
                        <LinearGradient
                          colors={category.gradientColors as [string, string]}
                          style={styles.categoryArrowGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.arrowText}>→</Text>
                        </LinearGradient>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        <BottomNavigation activeTab="gym" onTabPress={handleTabPress} />

        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onMenuItemPress={handleSidebarMenuPress}
          userName={user?.fullName || 'User'}
          userEmail={user?.email || 'user@example.com'}
          userInfo={null}
          badges={[]}
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
  genderSection: {
    marginBottom: spacing.xl,
  },
  genderSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  genderButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  genderButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  genderEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  genderButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: 4,
  },
  genderButtonTextActive: {
    color: colors.primary,
  },
  genderDescription: {
    color: colors.mutedText,
    fontSize: 12,
    fontFamily: fonts.body,
  },


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
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  categoryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryEmoji: {
    fontSize: 28,
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
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  categoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseCount: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  categoryArrowContainer: {
    marginLeft: spacing.sm,
  },
  categoryArrowGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },

  bottomSpacing: {
    height: 100,
  },
});