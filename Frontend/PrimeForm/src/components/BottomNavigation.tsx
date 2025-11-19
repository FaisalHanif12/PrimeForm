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
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
}

const tabs: Tab[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'diet', label: 'Diet', icon: 'restaurant' },
  { key: 'gym', label: 'Gym', icon: 'barbell' },
  { key: 'workout', label: 'Workout', icon: 'fitness' },
  { key: 'progress', label: 'Progress', icon: 'trending-up' },
];

export default function BottomNavigation({ activeTab, onTabPress }: Props) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const indicatorPosition = useSharedValue(0); // Keeping for potential future use but indicator removed
  const containerWidth = useSharedValue(0);

  const getTabIndex = (tab: TabType) => tabs.findIndex(t => t.key === tab);

  React.useEffect(() => {
    const activeIndex = getTabIndex(activeTab);
    indicatorPosition.value = withSpring(activeIndex, {
      damping: 15,
      stiffness: 150,
    });
  }, [activeTab]);

  // Indicator is removed, but shared values kept if needed later

  return (
    <View
      style={[styles.container, { 
        paddingBottom: Math.max(insets.bottom, spacing.xs),
        marginBottom: spacing.sm, // Reduced margin from bottom edge
      }]}
      onLayout={({ nativeEvent }) => {
        containerWidth.value = nativeEvent.layout.width;
      }}
    >
      {/* Inner container to keep tabs centered regardless of padding */}
      <View style={styles.tabsContainer}>
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
              <View style={[styles.tabContent, isActive && styles.activeTabContent]}>
                <Ionicons
                  name={tab.icon}
                  size={20}
                  color={isActive ? colors.gold : colors.mutedText}
                />
                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                  {t(`nav.${tab.key}`)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface, // Dark gray-blue for card backgrounds
    borderRadius: 20,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)', // Slightly more visible border
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    justifyContent: 'center', // Center the inner container
    alignItems: 'center', // Center the inner container
  },
  // Inner container to hold tabs and keep them centered
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Center tabs vertically
    justifyContent: 'space-evenly', // Distribute tabs evenly
    width: '100%',
    height: 56, // Fixed compact height (reduced from 60)
    paddingVertical: spacing.xs, // Minimal padding for compact look
    paddingTop: spacing.sm, // Top padding for breathing room
    paddingBottom: spacing.xs, // Minimal bottom padding
  },
  // Removed indicator styling
  tab: {
    flex: 1,
    zIndex: 1,
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    height: '100%', // Take full height of tabsContainer
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
    paddingVertical: 4, // Minimal vertical padding for compact look
    paddingHorizontal: spacing.xs,
    borderRadius: 12,
  },
  activeTabContent: {
    // No special background for active tab
  },
  tabLabel: {
    color: colors.mutedText,
    fontSize: 9, // Slightly smaller for compact look
    fontFamily: fonts.body,
    fontWeight: '500',
    marginTop: 3, // Reduced spacing between icon and label
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
});
