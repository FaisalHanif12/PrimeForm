import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInLeft, FadeOutLeft, FadeIn, FadeOut } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

interface UserInfo {
  country: string;
  age: string;
  gender: string;
  height: string;
  currentWeight: string;
  goalWeight: string;
  bodyGoal: string;
  medicalConditions: string;
  occupationType: string;
  availableEquipment: string;
  dietPreference: string;
}

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  action: string;
  color?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onMenuItemPress: (action: string) => void;
  userName: string;
  userEmail: string;
  userInfo?: UserInfo | null;
}

const menuItems: MenuItem[] = [
  { icon: 'person-outline', label: 'Profile', action: 'profile' },
  { icon: 'settings-outline', label: 'Settings', action: 'settings' },
  { icon: 'language-outline', label: 'Language', action: 'language' },
  { icon: 'card-outline', label: 'Subscription Plan', action: 'subscription' },
  { icon: 'log-out-outline', label: 'Log Out', action: 'logout', color: colors.error },
];

export default function Sidebar({ visible, onClose, onMenuItemPress, userName, userEmail, userInfo }: Props) {
  const { t, language, changeLanguage } = useLanguage();
  const [showLanguageToggle, setShowLanguageToggle] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(null);

  // Load user image on component mount
  useEffect(() => {
    loadUserImage();
  }, []);

  const loadUserImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem('userProfileImage');
      if (savedImage) {
        setUserImage(savedImage);
      }
    } catch (error) {
      console.error('Failed to load user image:', error);
    }
  };

  const handleImageUpload = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Save image URI to AsyncStorage (persistent across app reinstalls)
        await AsyncStorage.setItem('userProfileImage', imageUri);
        setUserImage(imageUri);
        
        console.log('User image uploaded and saved successfully');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const handleMenuPress = (action: string) => {
    if (action === 'language') {
      setShowLanguageToggle(!showLanguageToggle);
      return;
    }
    if (action === 'profile') {
      // Navigate to profile page instead of showing dropdown
      onMenuItemPress('profile');
      onClose();
      return;
    }
    onMenuItemPress(action);
    onClose();
  };

  const handleLanguageChange = async (lang: 'en' | 'ur') => {
    await changeLanguage(lang);
    setShowLanguageToggle(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Background overlay */}
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut}
          style={styles.backdrop}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject} 
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Sidebar content */}
        <Animated.View 
          entering={FadeInLeft.springify().damping(15)} 
          exiting={FadeOutLeft.springify().damping(15)}
          style={styles.sidebar}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.mutedText} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <TouchableOpacity 
                style={styles.avatarContainer} 
                onPress={handleImageUpload}
                activeOpacity={0.8}
              >
                {userImage ? (
                  <Image source={{ uri: userImage }} style={styles.userAvatar} />
                ) : (
                  <Ionicons name="person" size={32} color={colors.gold} />
                )}
                {!userImage && (
                  <View style={styles.uploadOverlay}>
                    <Ionicons name="camera" size={16} color={colors.white} />
                  </View>
                )}
                {userImage && (
                  <View style={styles.imageOverlay}>
                    <Ionicons name="camera" size={14} color={colors.white} />
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userName}</Text>
                <Text style={styles.userEmail}>{userEmail}</Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <View key={item.action}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuPress(item.action)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemContent}>
                    <Ionicons 
                      name={item.icon} 
                      size={22} 
                      color={item.color || colors.white} 
                    />
                    <Text style={[styles.menuItemText, item.color && { color: item.color }]}>
                      {t(`sidebar.${item.action}`)}
                    </Text>
                  </View>
                  <View style={styles.menuItemRight}>
                    {item.action === 'subscription' && (
                      <View style={styles.upgradeBadge}>
                        <Text style={styles.upgradeText}>{t('sidebar.upgrade')}</Text>
                      </View>
                    )}
                    <Ionicons 
                      name={item.action === 'language' ? (showLanguageToggle ? "chevron-up" : "chevron-down") : "chevron-forward"} 
                      size={18} 
                      color={colors.mutedText} 
                    />
                  </View>
                </TouchableOpacity>
                
                {/* Language Toggle Options */}
                {item.action === 'language' && showLanguageToggle && (
                  <View style={styles.languageOptions}>
                    <TouchableOpacity 
                      style={[styles.languageOption, language === 'en' && styles.activeLanguage]}
                      onPress={() => handleLanguageChange('en')}
                    >
                      <Text style={[styles.languageText, language === 'en' && styles.activeLanguageText]}>
                        {t('language.english')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.languageOption, language === 'ur' && styles.activeLanguage]}
                      onPress={() => handleLanguageChange('ur')}
                    >
                      <Text style={[styles.languageText, language === 'ur' && styles.activeLanguageText]}>
                        اردو
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.appName}>{t('sidebar.appName')}</Text>
            <Text style={styles.version}>{t('sidebar.version')}</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: '100%', // Occupy full screen width so menu items are fully visible
    maxWidth: undefined,
    height: '100%',
    backgroundColor: colors.background,
    paddingTop: 60, // Status bar padding
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    position: 'relative', // Added for positioning overlay
  },
  userAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  uploadOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.gold,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.white,
  },

  userInfo: {
    flex: 1,
  },
  userName: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginBottom: 2,
  },
  userEmail: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontFamily: fonts.body,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: spacing.lg,
    padding: spacing.sm,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    zIndex: 1,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  menuContainer: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '500',
    fontFamily: fonts.body,
    marginLeft: spacing.md,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeBadge: {
    backgroundColor: colors.gold,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  upgradeText: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    alignItems: 'center',
  },
  appName: {
    color: colors.gold,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: fonts.brand,
    marginBottom: spacing.xs,
  },
  version: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontFamily: fonts.body,
  },
  languageOptions: {
    marginLeft: spacing.xl,
    marginTop: spacing.sm,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.cardBorder,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  activeLanguage: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: colors.gold,
  },
  languageText: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontFamily: fonts.body,
  },
  activeLanguageText: {
    color: colors.gold,
  },
  

});
