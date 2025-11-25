import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DashboardHeader from '../../src/components/DashboardHeader';
import Sidebar from '../../src/components/Sidebar';
import BottomNavigation from '../../src/components/BottomNavigation';
import ProfilePage from '../../src/components/ProfilePage';
import NotificationModal from '../../src/components/NotificationModal';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { sportCategories } from '../../src/data/sportExercises';
import { userProfileService } from '../../src/services/userProfileService';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - spacing.xl * 3) / 2;

export default function SportModePage() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  const handleProfilePress = () => {
    setSidebarVisible(true);
  };

  const handleNotificationPress = () => {
    setNotificationModalVisible(true);
  };

  const handleSidebarMenuPress = (action: string) => {
    switch (action) {
      case 'profile':
        setSidebarVisible(false);
        setShowProfilePage(true);
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
      case 'contact':
        router.push('/(dashboard)/contact');
        break;
      case 'settings':
        router.push('/(dashboard)/settings');
        break;
      default:
        router.push('/(dashboard)');
    }
  };

  const handleTabPress = (tab: string) => {
    switch (tab) {
      case 'home':
        router.push('/(dashboard)');
        break;
      case 'workout':
        router.push('/(dashboard)/workout');
        break;
      case 'diet':
        router.push('/(dashboard)/diet');
        break;
      case 'gym':
        router.push('/(dashboard)/gym');
        break;
      case 'progress':
        router.push('/(dashboard)/progress');
        break;
    }
  };

  const loadUserInfo = async () => {
    try {
      const data = await userProfileService.getUserProfile();
      setUserInfo(data);
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const handleUpdateUserInfo = async (updatedInfo: any) => {
    try {
      await userProfileService.updateUserProfile(updatedInfo);
      setUserInfo(updatedInfo);
    } catch (error) {
      console.error('Failed to update user info:', error);
      throw error;
    }
  };

  React.useEffect(() => {
    if (showProfilePage) {
      loadUserInfo();
    }
  }, [showProfilePage]);

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/(dashboard)/sport-mode/${categoryId}` as any);
  };

  return (
    <View style={styles.container}>
      <DashboardHeader
        onProfilePress={handleProfilePress}
        onNotificationPress={handleNotificationPress}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <LinearGradient
              colors={[colors.primary + '20', colors.primary + '10']}
              style={styles.heroIconGradient}
            >
              <Text style={styles.heroIcon}>🏆</Text>
            </LinearGradient>
          </View>
          <Text style={styles.heroTitle}>Sport Mode</Text>
          <Text style={styles.heroSubtitle}>
            Train like a pro with sport-specific exercises
          </Text>
        </Animated.View>

        {/* Categories Grid */}
        <View style={styles.categoriesContainer}>
          {sportCategories.map((category, index) => (
            <Animated.View
              key={category.id}
              entering={FadeInDown.delay(200 + index * 100).duration(600)}
            >
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[category.color + '15', category.color + '08']}
                  style={styles.categoryGradient}
                >
                  {/* Icon */}
                  <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' }]}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                  </View>

                  {/* Content */}
                  <View style={styles.categoryContent}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryExerciseCount}>
                      {category.exercises.length} Exercises
                    </Text>
                    <Text style={styles.categoryDescription} numberOfLines={2}>
                      {category.description}
                    </Text>
                  </View>

                  {/* Arrow */}
                  <View style={[styles.categoryArrow, { backgroundColor: category.color + '15' }]}>
                    <Ionicons name="chevron-forward" size={20} color={category.color} />
                  </View>

                  {/* Decorative Circles */}
                  <View style={[styles.decorativeCircle1, { backgroundColor: category.color + '10' }]} />
                  <View style={[styles.decorativeCircle2, { backgroundColor: category.color + '08' }]} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Info Section */}
        <Animated.View entering={FadeInDown.delay(800).duration(600)} style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How It Works</Text>
              <Text style={styles.infoText}>
                Choose a sport, select an exercise, and follow the guided training with animations, timers, and rep counters.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <BottomNavigation activeTab="" onTabPress={handleTabPress} />

      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onMenuItemPress={handleSidebarMenuPress}
        userName={userInfo?.fullName || 'User'}
        userEmail={userInfo?.email || ''}
        userInfo={userInfo}
      />

      {showProfilePage && (
        <ProfilePage
          visible={showProfilePage}
          onClose={() => {
            setShowProfilePage(false);
            setSidebarVisible(true);
          }}
          userInfo={userInfo}
          onUpdateUserInfo={handleUpdateUserInfo}
        />
      )}

      {notificationModalVisible && (
        <NotificationModal
          visible={notificationModalVisible}
          onClose={() => setNotificationModalVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroIconContainer: {
    marginBottom: spacing.md,
  },
  heroIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  heroIcon: {
    fontSize: 40,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
    fontFamily: fonts.bold,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.mutedText,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
  categoriesContainer: {
    gap: spacing.md,
  },
  categoryCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  categoryGradient: {
    padding: spacing.lg,
    minHeight: 180,
    position: 'relative',
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
    fontFamily: fonts.bold,
  },
  categoryExerciseCount: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    fontFamily: fonts.semiBold,
  },
  categoryDescription: {
    fontSize: 14,
    color: colors.mutedText,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  categoryArrow: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -30,
    right: -30,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: -20,
    right: 60,
  },
  infoSection: {
    marginTop: spacing.xl,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  infoIconContainer: {
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.xs,
    fontFamily: fonts.semiBold,
  },
  infoText: {
    fontSize: 14,
    color: colors.mutedText,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
});

