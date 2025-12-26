import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
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
import { sportCategories, getTranslatedSportName } from '../../src/data/sportExercises';
import userProfileService from '../../src/services/userProfileService';
import { useAuthContext } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - spacing.xl * 3) / 2;

export default function SportModePage() {
  const { user } = useAuthContext();
  const { t, language } = useLanguage();
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

  // Load user info from cache or API
  const loadUserInfo = async () => {
    try {
      const cachedData = await userProfileService.getCachedData();
      if (cachedData && cachedData.success && cachedData.data) {
        setUserInfo(cachedData.data);
      } else {
        // If no cache, fetch from API
        const response = await userProfileService.getUserProfile();
        if (response.success && response.data) {
          setUserInfo(response.data);
        }
      }
    } catch (error) {
      // Failed to load user info
    }
  };

  const handleUpdateUserInfo = async (updatedInfo: any) => {
    try {
      // Update user profile logic would go here
      setUserInfo(updatedInfo);
    } catch (error) {
      throw error;
    }
  };

  React.useEffect(() => {
    loadUserInfo();
  }, []);

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
        userName={user?.fullName || 'User'}
        onProfilePress={handleProfilePress}
        onNotificationPress={handleNotificationPress}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <Text style={styles.pageTitle}>{t('sportMode.title')}</Text>
        <Text style={styles.pageSubtitle}>{t('sportMode.subtitle')}</Text>

        {/* Categories Grid */}
        <View style={styles.categoriesContainer}>
          {sportCategories.map((category, index) => (
            <Animated.View
              key={category.id}
              entering={FadeInDown.delay(index * 100).duration(500)}
            >
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[category.color + '20', category.color + '05']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  {/* Left Side - Icon and Content */}
                  <View style={styles.cardLeft}>
                    {/* Icon */}
                    <View style={[styles.iconCircle, { backgroundColor: category.color + '25' }]}>
                      <Text style={styles.icon}>{category.icon}</Text>
                    </View>

                    {/* Content */}
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>
                        {getTranslatedSportName(category.id, t, language)}
                      </Text>
                      <Text style={[styles.exerciseCount, { color: category.color }]}>
                        {category.exercises.length} {t('sportMode.exercises')}
                      </Text>
                    </View>
                  </View>

                  {/* Right Side - Arrow */}
                  <View style={[styles.arrowCircle, { backgroundColor: category.color + '20' }]}>
                    <Ionicons name="chevron-forward" size={22} color={colors.white} />
                  </View>

                  {/* Bottom Border */}
                  <View style={[styles.bottomBorder, { backgroundColor: category.color }]} />
                </LinearGradient>
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
        userName={user?.fullName || 'User'}
        userEmail={user?.email || 'user@purebody.com'}
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 120,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.white,
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
    textAlign: 'center',
    opacity: 0.9,
  },
  pageSubtitle: {
    fontSize: 16,
    color: colors.primary,
    fontFamily: fonts.body,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  categoriesContainer: {
    gap: spacing.md,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    minHeight: 100,
    position: 'relative',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 32,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.headingBold,
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
});

