import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInLeft, FadeOutLeft, FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

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
}

const menuItems: MenuItem[] = [
  { icon: 'person-outline', label: 'Profile', action: 'profile' },
  { icon: 'settings-outline', label: 'Settings', action: 'settings' },
  { icon: 'language-outline', label: 'Language', action: 'language' },
  { icon: 'card-outline', label: 'Subscription Plan', action: 'subscription' },
  { icon: 'log-out-outline', label: 'Log Out', action: 'logout', color: colors.error },
];

export default function Sidebar({ visible, onClose, onMenuItemPress, userName, userEmail }: Props) {
  const { t, language, changeLanguage } = useLanguage();
  const [showLanguageToggle, setShowLanguageToggle] = useState(false);

  const handleMenuPress = (action: string) => {
    if (action === 'language') {
      setShowLanguageToggle(!showLanguageToggle);
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
                  <Ionicons 
                    name={item.action === 'language' ? (showLanguageToggle ? "chevron-up" : "chevron-down") : "chevron-forward"} 
                    size={18} 
                    color={colors.mutedText} 
                  />
                </TouchableOpacity>
                
                {/* Language Toggle Options */}
                {item.action === 'language' && showLanguageToggle && (
                  <View style={styles.languageOptions}>
                    <TouchableOpacity 
                      style={[styles.languageOption, language === 'en' && styles.activeLanguage]}
                      onPress={() => handleLanguageChange('en')}
                    >
                      <Text style={[styles.languageText, language === 'en' && styles.activeLanguageText]}>
                        English
                      </Text>
                      {language === 'en' && <Ionicons name="checkmark" size={16} color={colors.gold} />}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.languageOption, language === 'ur' && styles.activeLanguage]}
                      onPress={() => handleLanguageChange('ur')}
                    >
                      <Text style={[styles.languageText, language === 'ur' && styles.activeLanguageText]}>
                        اردو
                      </Text>
                      {language === 'ur' && <Ionicons name="checkmark" size={16} color={colors.gold} />}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.appName}>{t('app.name')}</Text>
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
    color: colors.white,
    fontSize: typography.small,
    fontFamily: fonts.body,
  },
  activeLanguageText: {
    color: colors.gold,
    fontWeight: '600',
  },
});
