import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, fonts, radius } from '../theme/colors';

interface BadgeProps {
  type: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ type, size = 'medium', showLabel = true }) => {
  const getBadgeInfo = () => {
    switch (type) {
      case 'profile_completion':
        return {
          icon: '🏆',
          label: 'Profile Complete',
          color: colors.primary,
          bgColor: 'transparent'
        };
      default:
        return {
          icon: '🎖️',
          label: 'Achievement',
          color: colors.primary,
          bgColor: 'rgba(59, 130, 246, 0.15)'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 32, height: 32, borderRadius: 16 },
          icon: { fontSize: 16 },
          label: { fontSize: 10 }
        };
      case 'large':
        return {
          container: { width: 64, height: 64, borderRadius: 32 },
          icon: { fontSize: 32 },
          label: { fontSize: 12 }
        };
      default: // medium
        return {
          container: { width: 48, height: 48, borderRadius: 24 },
          icon: { fontSize: 24 },
          label: { fontSize: 11 }
        };
    }
  };

  const badgeInfo = getBadgeInfo();
  const sizeStyles = getSizeStyles();

  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.badgeContainer, 
          sizeStyles.container,
          { backgroundColor: badgeInfo.bgColor, borderColor: badgeInfo.color }
        ]}
      >
        <Text style={[styles.icon, sizeStyles.icon]}>
          {badgeInfo.icon}
        </Text>
      </View>
      
      {showLabel && (
        <Text style={[styles.label, sizeStyles.label, { color: badgeInfo.color }]}>
          {badgeInfo.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    textAlign: 'center',
  },
  label: {
    fontFamily: fonts.body,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default Badge;
