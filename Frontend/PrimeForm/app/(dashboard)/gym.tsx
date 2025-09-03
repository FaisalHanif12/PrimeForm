import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useAuthContext } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import Sidebar from '../../src/components/Sidebar';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import { useToast } from '../../src/context/ToastContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: screenWidth } = Dimensions.get('window');

// Workout categories data
const workoutCategories = [
  { id: 'chest', name: 'Chest', icon: 'weight-lifter', color: '#4CAF50' },
  { id: 'back', name: 'Back', icon: 'weight', color: '#4CAF50' },
  { id: 'arms', name: 'Arms', icon: 'weight-lifting', color: '#4CAF50' },
  { id: 'legs', name: 'Legs', icon: 'run-fast', color: '#4CAF50' },
  { id: 'abs', name: 'Abs', icon: 'yoga', color: '#4CAF50' },
  { id: 'full_body', name: 'Full Body', icon: 'account-supervisor', color: '#4CAF50' },
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
    // Navigate to category-specific exercises
    router.push({
      pathname: '/(dashboard)/exercise-detail',
      params: {
        category: categoryId,
        gender: selectedGender,
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
          {/* Main Title */}
          <Animated.View entering={FadeInUp} style={styles.titleSection}>
            <Text style={styles.mainTitle}>Choose Your Workout, Transform Your Body</Text>
            <Text style={styles.subtitle}>Pick a category to get started</Text>
          </Animated.View>

          {/* Gender Selector */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.genderSelector}>
            <TouchableOpacity
                   style={[
                styles.genderButton,
                selectedGender === 'men' && styles.genderButtonActive
              ]}
              onPress={() => setSelectedGender('men')}
                   activeOpacity={0.8}
                 >
                                          <Text style={[
                styles.genderButtonText,
                selectedGender === 'men' && styles.genderButtonTextActive
                    ]}>
                Men
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
              style={[
                styles.genderButton,
                selectedGender === 'women' && styles.genderButtonActive
              ]}
              onPress={() => setSelectedGender('women')}
                   activeOpacity={0.8}
                 >
                                          <Text style={[
                styles.genderButtonText,
                selectedGender === 'women' && styles.genderButtonTextActive
                    ]}>
                Women
                    </Text>
                </TouchableOpacity>
          </Animated.View>



          {/* Workout Categories Grid */}
          <Animated.View entering={FadeInUp.delay(300)} style={styles.categoriesGrid}>
            {/* First Row - Chest, Back */}
            <View style={styles.categoriesRow}>
              {workoutCategories.slice(0, 2).map((category, index) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => handleCategoryPress(category.id)}
                  activeOpacity={0.8}
                >
                  <Icon name={category.icon} size={40} color={colors.white} style={styles.categoryIcon} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Second Row - Arms, Legs */}
            <View style={styles.categoriesRow}>
              {workoutCategories.slice(2, 4).map((category, index) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => handleCategoryPress(category.id)}
                  activeOpacity={0.8}
                >
                  <Icon name={category.icon} size={40} color={colors.white} style={styles.categoryIcon} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Third Row - Abs, Full Body */}
            <View style={styles.categoriesRow}>
              {workoutCategories.slice(4, 6).map((category, index) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => handleCategoryPress(category.id)}
                  activeOpacity={0.8}
                >
                  <Icon name={category.icon} size={40} color={colors.white} style={styles.categoryIcon} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
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
    padding: spacing.lg,
    paddingTop: 0,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  mainTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '700',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 36,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 16,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  genderSelector: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  genderButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  genderButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  genderButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  genderButtonTextActive: {
    color: colors.white,
    fontWeight: '700',
  },

  categoriesGrid: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  categoryCard: {
    width: (screenWidth - spacing.lg * 4 - spacing.lg) / 2,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  categoryIcon: {
    marginBottom: spacing.sm,
  },
  categoryName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.body,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  bottomSpacing: {
    height: 100,
  },
});