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
import userProfileService from '../../src/services/userProfileService';

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
      // Update user profile logic would go here
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
        userName={userInfo?.fullName || 'User'}
        onProfilePress={handleProfilePress}
        onNotificationPress={handleNotificationPress}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories Grid */}
        <View style={styles.categoriesContainer}>
          {sportCategories.map((category, index) => (
            <Animated.View
              key={category.id}
              entering={FadeInDown.delay(100 + index * 100).duration(600)}
            >
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.85}
              >
                {/* Main Card Background */}
                <LinearGradient
                  colors={['rgba(30, 35, 50, 0.95)', 'rgba(20, 25, 40, 0.98)']}
                  style={styles.categoryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Glow Effect Background */}
                  <View style={[styles.glowEffect, { backgroundColor: category.color + '12' }]} />
                  
                  {/* Top Section - Icon and Arrow */}
                  <View style={styles.topSection}>
                    {/* Icon Container with Gradient */}
                    <LinearGradient
                      colors={[category.color + '25', category.color + '10']}
                      style={styles.iconGradientContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={[styles.iconInnerGlow, { backgroundColor: category.color + '15' }]}>
                        <Text style={styles.categoryIcon}>{category.icon}</Text>
                      </View>
                    </LinearGradient>

                    {/* Arrow with Animated Border */}
                    <View style={[styles.arrowContainer, { borderColor: category.color + '30' }]}>
                      <LinearGradient
                        colors={[category.color + '20', category.color + '10']}
                        style={styles.arrowGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons name="arrow-forward" size={18} color={category.color} />
                      </LinearGradient>
                    </View>
                  </View>

                  {/* Content Section */}
                  <View style={styles.contentSection}>
                    {/* Title */}
                    <Text style={styles.categoryTitle}>{category.name}</Text>
                    
                    {/* Exercise Count Badge */}
                    <View style={[styles.exerciseBadge, { backgroundColor: category.color + '18' }]}>
                      <View style={[styles.badgeDot, { backgroundColor: category.color }]} />
                      <Text style={[styles.exerciseBadgeText, { color: category.color }]}>
                        {category.exercises.length} Exercises
                      </Text>
                    </View>

                    {/* Description */}
                    <Text style={styles.categoryDescriptionNew} numberOfLines={2}>
                      {category.description}
                    </Text>
                  </View>

                  {/* Bottom Accent Line */}
                  <LinearGradient
                    colors={[category.color + '00', category.color + '40', category.color + '00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.accentLine}
                  />

                  {/* Decorative Elements */}
                  <View style={[styles.decorativeDot1, { backgroundColor: category.color + '20' }]} />
                  <View style={[styles.decorativeDot2, { backgroundColor: category.color + '15' }]} />
                  <View style={[styles.decorativeDot3, { backgroundColor: category.color + '10' }]} />
                </LinearGradient>

                {/* Card Border Glow */}
                <View style={[styles.cardBorderGlow, { 
                  shadowColor: category.color,
                  borderColor: category.color + '15'
                }]} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
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
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },
  categoriesContainer: {
    gap: spacing.lg,
  },
  categoryCard: {
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  categoryGradient: {
    padding: spacing.xl,
    minHeight: 200,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    zIndex: 2,
  },
  iconGradientContainer: {
    width: 70,
    height: 70,
    borderRadius: 20,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInnerGlow: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 36,
  },
  arrowContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  arrowGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSection: {
    zIndex: 2,
    gap: spacing.sm,
  },
  categoryTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    fontFamily: fonts.headingBold,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  exerciseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  exerciseBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fonts.heading,
    letterSpacing: 0.3,
  },
  categoryDescriptionNew: {
    fontSize: 14,
    color: colors.mutedText,
    lineHeight: 22,
    fontFamily: fonts.body,
    opacity: 0.9,
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  decorativeDot1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    bottom: -35,
    right: -35,
    opacity: 0.3,
  },
  decorativeDot2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    bottom: 40,
    right: 30,
    opacity: 0.2,
  },
  decorativeDot3: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    top: 40,
    right: -15,
    opacity: 0.15,
  },
  cardBorderGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
});

