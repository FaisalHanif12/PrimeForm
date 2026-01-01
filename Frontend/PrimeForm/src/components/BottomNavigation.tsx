import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography, fonts } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

type TabType = 'home' | 'diet' | 'gym' | 'workout' | 'progress';

interface Tab {
  key: TabType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface Props {
  activeTab: TabType | string;
  onTabPress: (tab: TabType) => void;
}

const tabs: Tab[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'diet', label: 'Diet', icon: 'restaurant' },
  { key: 'gym', label: 'Gym', icon: 'barbell' },
  { key: 'workout', label: 'Workout', icon: 'fitness' },
  { key: 'progress', label: 'Progress', icon: 'trending-up' },
];

// Fixed height for consistent rendering across all devices
const NAVIGATION_HEIGHT = 65; // iOS height - reduced for better visibility
const NAVIGATION_HEIGHT_ANDROID = 90; // Android height - taller for premium feel
const ICON_SIZE = 22;
const LABEL_FONT_SIZE = 10;

export default function BottomNavigation({ activeTab, onTabPress }: Props) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const indicatorPosition = useSharedValue(0); // Keeping for potential future use but indicator removed
  const containerWidth = useSharedValue(0);

  const getTabIndex = (tab: TabType | string) => tabs.findIndex(t => t.key === tab);

  React.useEffect(() => {
    const activeIndex = getTabIndex(activeTab);
    indicatorPosition.value = withSpring(activeIndex, {
      damping: 15,
      stiffness: 150,
    });
  }, [activeTab]);

  
  const isIOS = Platform.OS === 'ios';

  const bottomPadding = isIOS 
    ? Math.max(insets.bottom - 8, spacing.xs)
    : 0; // No padding for Android - height is fixed
  
  const bottomOffset = isIOS 
    ? spacing.xs // Very small offset to prevent cutoff on iOS
    : Math.max((insets.bottom || 0) + 8, 28); // Android: Use insets.bottom + 4px padding, minimum 24px to clear system nav bar
    
  const containerHeight = isIOS 
    ? NAVIGATION_HEIGHT + bottomPadding 
    : NAVIGATION_HEIGHT_ANDROID; // Fixed height for Android

  return (
    <View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          paddingBottom: bottomPadding,
          height: containerHeight,
        }
      ]}
      onLayout={({ nativeEvent }) => {
        containerWidth.value = nativeEvent.layout.width;
      }}
    >
      {/* Tab buttons */}
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <Ionicons
                name={tab.icon}
                size={ICON_SIZE}
                color={isActive ? colors.gold : colors.mutedText}
              />
              <Text 
                style={[styles.tabLabel, isActive && styles.activeTabLabel]}
                numberOfLines={1}
                adjustsFontSizeToFit={false}
                allowFontScaling={false}
              >
                {t(`nav.${tab.key}`)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    ...Platform.select({
      ios: {
        paddingTop: spacing.sm, // Reduced padding for iOS
        minHeight: NAVIGATION_HEIGHT,
      },
      android: {
        // On Android, use taller explicit height for premium feel - tabs will center perfectly
        height: NAVIGATION_HEIGHT_ANDROID,
        overflow: 'hidden',
      },
    }),
  },
  tab: {
    flex: 1,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        minHeight: NAVIGATION_HEIGHT,
      },
      android: {
        // On Android, use taller explicit height to ensure perfect centering in premium bar
        height: NAVIGATION_HEIGHT_ANDROID,
      },
    }),
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 16,
  },
  activeTabContent: {
    // No special background for active tab
  },
  tabLabel: {
    color: colors.mutedText,
    fontSize: LABEL_FONT_SIZE,
    fontFamily: fonts.body,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
    includeFontPadding: false, // Android specific - removes extra padding
    textAlignVertical: 'center', // Android specific - ensures vertical centering
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
});
