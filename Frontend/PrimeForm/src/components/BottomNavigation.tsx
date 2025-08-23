import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
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
      style={styles.container}
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
            <View style={[styles.tabContent, isActive && styles.activeTabContent]}>
              <Ionicons
                name={tab.icon}
                size={22}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl + spacing.md, // Increased bottom margin
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    position: 'relative',
  },
  // Removed indicator styling
  tab: {
    flex: 1,
    zIndex: 1,
  },
  tabContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 16,
  },
  activeTabContent: {
    // No special background for active tab
  },
  tabLabel: {
    color: colors.mutedText,
    fontSize: 10,
    fontFamily: fonts.body,
    fontWeight: '500',
    marginTop: 2,
  },
  activeTabLabel: {
    color: colors.gold,
    fontWeight: '600',
  },
});
