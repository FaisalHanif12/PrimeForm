import { Platform } from 'react-native';

export const colors = {
  // New color theme - Dark navy with green accents
  background: '#0A0F1A', // Very dark navy/black
  surface: '#131922', // Dark gray-blue for card backgrounds
  text: '#FFFFFF', // White text for heading
  mutedText: '#9DA8B6', // Gray text for labels and secondary text
  white: '#FFFFFF',
  // Primary Accent Green - Replacing gold colors
  primary: '#00C97C', // Primary Accent Green
  primaryDark: '#00A86B', // Darker shade of primary green
  primarySoft: 'rgba(0, 201, 124, 0.7)', // Soft version of primary green
  // Inactive elements
  inactive: '#212833', // Muted dark gray for inactive buttons
  // Glass surfaces - Updated to match new theme
  inputBackground: 'rgba(19, 25, 34, 0.6)',
  inputFill: 'rgba(19, 25, 34, 0.8)',
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  cardBackground: 'rgba(19, 25, 34, 0.4)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  // Icon and stroke colors
  iconStroke: '#D1D5DB', // Light gray stroke for workout icons
  // Additional colors
  blue: '#3B82F6',
  green: '#10B981',
  purple: '#8B5CF6',
  // Feedback
  error: '#EF4444',
  warning: '#F59E0B',
  black: '#000000',
  // Legacy gradient tokens - Updated to match new background
  gradientStart: '#0A0F1A',
  gradientMid: '#0F1419',
  gradientEnd: '#020617',
  // Legacy gold references - now pointing to primary green
  gold: '#00C97C',
  goldDark: '#00A86B',
  goldSoft: 'rgba(0, 201, 124, 0.7)',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const typography = {
  h3: 24,
  h4: 20,
  title: 28,
  subtitle: 18,
  body: 16,
  small: 13,
};

export const fonts = {
  // Beautiful font families
  heading: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  headingBold: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  brand: Platform.OS === 'ios' ? 'Optima' : 'sans-serif-light',
  brandBold: Platform.OS === 'ios' ? 'Optima' : 'sans-serif-light', 
  body: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
};


