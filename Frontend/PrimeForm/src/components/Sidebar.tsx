import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInLeft, FadeOutLeft, FadeIn, FadeOut } from 'react-native-reanimated';
import { router } from 'expo-router';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

const { height: screenHeight, width: screenWidth } = Dimensions.get('screen');

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
  isGuest?: boolean;
  badges?: string[];
}

const menuItems: MenuItem[] = [
  { icon: 'person-outline', label: 'Profile', action: 'profile' },
  { icon: 'basketball-outline', label: 'Sport Mode', action: 'sport-mode', color: colors.white },
  { icon: 'flame-outline', label: 'Streak Tracker', action: 'streak' },
  { icon: 'fitness-outline', label: 'AI Trainer', action: 'ai-trainer' },
  { icon: 'language-outline', label: 'Language', action: 'language' },
  { icon: 'mail-outline', label: 'Contact Us', action: 'contact' },
  { icon: 'settings-outline', label: 'Settings', action: 'settings' },
];

export default function Sidebar({ visible, onClose, onMenuItemPress, userName, userEmail, userInfo, isGuest = false, badges }: Props) {
  const { t } = useLanguage();

  const handleMenuPress = (action: string) => {
    if (action === 'profile') {
      onMenuItemPress('profile');
      onClose();
      return;
    }
    if (action === 'sport-mode') {
      onMenuItemPress('sport-mode');
      onClose();
      return;
    }
    if (action === 'contact') {
      onMenuItemPress('contact');
      onClose();
      return;
    }
    if (action === 'language') {
      onMenuItemPress('language');
      onClose();
      return;
    }
    onMenuItemPress(action);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        {/* Background overlay */}
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
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
          entering={FadeInLeft.duration(300)}
          exiting={FadeOutLeft.duration(300)}
          style={styles.sidebar}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={32} color={colors.gold} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userName || 'User'}</Text>
                <Text style={styles.userEmail}>{userEmail || 'user@primeform.com'}</Text>
              </View>
              {/* Close Button - Always navigates to home page */}
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => {
                  onClose();
                  router.replace('/(dashboard)');
                }}
              >
                <Ionicons name="close" size={24} color={colors.mutedText} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView
            style={styles.menuContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuContent}
          >
            {menuItems
              .filter(item => !isGuest || item.action !== 'logout')
              .map((item, index) => (
                <TouchableOpacity
                  key={item.action}
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
                    <View style={styles.menuItemTextContainer}>
                      <View style={styles.menuItemTextRow}>
                        <Text style={[styles.menuItemText, item.color && { color: item.color }]}>
                          {item.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.menuItemRight}>
                    <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => handleMenuPress('logout')}
              activeOpacity={0.8}
            >
              <View style={styles.logoutContent}>
                <Ionicons name="power" size={22} color={colors.gold} />
                <Text style={styles.logoutButtonText}>Log Out</Text>
              </View>
            </TouchableOpacity>
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
    width: '100%',
    maxWidth: undefined,
    height: screenHeight, // Force full screen height
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
    padding: spacing.sm,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginLeft: spacing.sm,
  },
  menuContainer: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  menuContent: {
    paddingBottom: spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
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
  menuItemTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuItemTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemSubtext: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontFamily: fonts.body,
    marginTop: 2,
    opacity: 0.8,
  },
  upgradeTag: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  upgradeTagText: {
    color: colors.background,
    fontSize: typography.small,
    fontFamily: fonts.body,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  menuItemRight: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  languageOptions: {
    marginLeft: spacing.xl,
    marginBottom: spacing.sm,
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
    fontWeight: '600',
  },
  // New Language Toggle Styles
  languageToggleContainer: {
    marginLeft: spacing.xl,
    marginBottom: spacing.sm,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.cardBorder,
  },
  languageToggleHeader: {
    marginBottom: spacing.sm,
  },
  languageToggleTitle: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontFamily: fonts.body,
    fontWeight: '500',
  },
  languageToggleSwitch: {
    gap: spacing.xs,
  },
  languageToggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minHeight: 48,
  },
  languageToggleActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: colors.gold,
    borderWidth: 2,
  },
  languageToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageToggleFlag: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  languageToggleText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    fontWeight: '500',
  },
  languageToggleTextActive: {
    color: colors.gold,
    fontWeight: '600',
  },
  languageToggleCheckmark: {
    marginLeft: spacing.sm,
  },
  languageMenuItemActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderColor: colors.gold,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.background,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl + 20 : spacing.xl + 10, // Ensure coverage of bottom area
  },
  logoutButton: {
    flexDirection: 'row',
    shadowRadius: 4,
    elevation: 2,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'transparent', // Ensure no background color
  },
  logoutButtonText: {
    color: colors.gold,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: fonts.body,
    letterSpacing: 0.5,
  },
});
