import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, spacing, radius, typography, fonts } from '../theme/colors';

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
  const indicatorPosition = useSharedValue(0);

  const getTabIndex = (tab: TabType) => tabs.findIndex(t => t.key === tab);

  React.useEffect(() => {
    const activeIndex = getTabIndex(activeTab);
    indicatorPosition.value = withSpring(activeIndex, {
      damping: 15,
      stiffness: 150,
    });
  }, [activeTab]);

  const indicatorStyle = useAnimatedStyle(() => {
    const containerWidth = 100; // percentage
    const tabWidth = containerWidth / tabs.length;
    const translateValue = indicatorPosition.value * tabWidth;
    
    return {
      transform: [
        {
          translateX: `${translateValue}%`,
        },
      ],
    };
  });

  return (
    <View style={styles.container}>
      {/* Floating indicator */}
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      
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
                color={isActive ? colors.background : colors.mutedText}
              />
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
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
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: spacing.xs,
    bottom: spacing.xs,
    left: spacing.xs,
    width: `${100 / tabs.length - 1.2}%`,
    backgroundColor: colors.gold,
    borderRadius: 16,
    zIndex: 0,
  },
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
    // Active state styling handled by indicator
  },
  tabLabel: {
    color: colors.mutedText,
    fontSize: 10,
    fontFamily: fonts.body,
    fontWeight: '500',
    marginTop: 2,
  },
  activeTabLabel: {
    color: colors.background,
    fontWeight: '600',
  },
});
