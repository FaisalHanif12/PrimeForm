import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInLeft, FadeOutLeft, FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import Badge from './Badge';

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
  { icon: 'flame-outline', label: 'Streak Tracker', action: 'streak', color: colors.gold },
  { icon: 'fitness-outline', label: 'AI Trainer', action: 'ai-trainer', color: colors.primary },
  { icon: 'card-outline', label: 'Subscription Plan', action: 'subscription' },
  { icon: 'language-outline', label: 'Language', action: 'language' },
  { icon: 'mail-outline', label: 'Contact Us', action: 'contact' },
  { icon: 'settings-outline', label: 'Settings', action: 'settings' },
];

export default function Sidebar({ visible, onClose, onMenuItemPress, userName, userEmail, userInfo, isGuest = false, badges }: Props) {
  const { t, language, changeLanguage } = useLanguage();
  const [showLanguageToggle, setShowLanguageToggle] = useState(false);

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
    if (action === 'contact') {
      // Navigate to contact page
      onMenuItemPress('contact');
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
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={32} color={colors.gold} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userName}</Text>
                <Text style={styles.userEmail}>{userEmail}</Text>
              </View>
            </View>
            
            {/* Badge Display */}
            {badges && badges.includes('profile_completion') && (
              <View style={styles.badgeSection}>
                <Badge type="profile_completion" size="small" showLabel={false} />
                <Text style={styles.badgeText}>
                  {language === 'en' ? 'Profile Completed!' : 'پروفائل مکمل!'}
                </Text>
              </View>
            )}
          </View>

          {/* Menu Items */}
          <ScrollView 
            style={styles.menuContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuContent}
          >
            {menuItems
              .filter(item => !isGuest || item.action !== 'logout') // Hide logout for guests (though logout is now in footer)
              .map((item, index) => (
                <View key={item.action}>
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      item.action === 'language' && showLanguageToggle && styles.languageMenuItemActive
                    ]}
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
                          {(item.action === 'streak' || item.action === 'ai-trainer') && (
                            <View style={styles.premiumTag}>
                              <Text style={styles.premiumTagText}>
                                {language === 'en' ? 'PREMIUM' : 'پریمیم'}
                              </Text>
                            </View>
                          )}
                          {item.action === 'subscription' && (
                            <View style={styles.upgradeTag}>
                              <Text style={styles.upgradeTagText}>
                                {language === 'en' ? 'UPGRADE' : 'اپ گریڈ'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.menuItemRight}>
                      {item.action === 'language' ? (
                        <Ionicons 
                          name={showLanguageToggle ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color={colors.mutedText} 
                        />
                      ) : (
                        <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  {/* Language Toggle Options */}
                  {item.action === 'language' && showLanguageToggle && (
                    <Animated.View 
                      entering={FadeIn.duration(200)}
                      exiting={FadeOut.duration(200)}
                      style={styles.languageToggleContainer}
                    >
                      <View style={styles.languageToggleHeader}>
                        <Text style={styles.languageToggleTitle}>
                          {t('language.choose')}
                        </Text>
                      </View>
                      <View style={styles.languageToggleSwitch}>
                        <TouchableOpacity 
                          style={[
                            styles.languageToggleOption, 
                            language === 'en' && styles.languageToggleActive
                          ]}
                          onPress={() => handleLanguageChange('en')}
                        >
                          <View style={styles.languageToggleContent}>
                            <Text style={styles.languageToggleFlag}>🇺🇸</Text>
                            <Text style={[
                              styles.languageToggleText, 
                              language === 'en' && styles.languageToggleTextActive
                            ]}>
                              English
                            </Text>
                          </View>
                          {language === 'en' && (
                            <View style={styles.languageToggleCheckmark}>
                              <Ionicons name="checkmark-circle" size={20} color={colors.gold} />
                            </View>
                          )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[
                            styles.languageToggleOption, 
                            language === 'ur' && styles.languageToggleActive
                          ]}
                          onPress={() => handleLanguageChange('ur')}
                        >
                          <View style={styles.languageToggleContent}>
                            <Text style={styles.languageToggleFlag}>🇵🇰</Text>
                            <Text style={[
                              styles.languageToggleText, 
                              language === 'ur' && styles.languageToggleTextActive
                            ]}>
                              اردو
                            </Text>
                          </View>
                          {language === 'ur' && (
                            <View style={styles.languageToggleCheckmark}>
                              <Ionicons name="checkmark-circle" size={20} color={colors.gold} />
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  )}
                </View>
              ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => handleMenuPress('logout')}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={styles.logoutButtonText}>Log Out</Text>
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
    height: '100%',
    backgroundColor: colors.background,
    paddingTop: 60,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    minHeight: 60,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutButtonText: {
    color: colors.error,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: fonts.body,
    marginLeft: spacing.xs,
  },


  // Badge styles
  badgeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeText: {
    color: colors.gold,
    fontSize: typography.small,
    fontFamily: fonts.body,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  
  // Premium tag styles
  premiumTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: spacing.xs,
  },
  premiumTagText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: fonts.heading,
  },
});
