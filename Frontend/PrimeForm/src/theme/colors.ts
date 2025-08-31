import { Platform } from 'react-native';

export const colors = {
  // Dark navy + gold glassmorphism theme - Updated to match provided UI
  background: '#0A0E1A',
  surface: '#1A1F2E',
  text: '#FFFFFF',
  mutedText: '#6B7280',
  white: '#FFFFFF',
  // Gold accents - More vibrant to match the image
  gold: '#F59E0B',
  goldDark: '#D97706',
  goldSoft: 'rgba(245, 158, 11, 0.7)',
  // Glass surfaces - Darker and more subtle
  inputBackground: 'rgba(26, 31, 46, 0.6)',
  inputFill: 'rgba(26, 31, 46, 0.8)',
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  cardBackground: 'rgba(26, 31, 46, 0.4)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  // Additional colors from the image
  blue: '#3B82F6',
  green: '#10B981',
  purple: '#8B5CF6',
  // Feedback
  error: '#EF4444',
  // Legacy gradient tokens
  gradientStart: '#0A0E1A',
  gradientMid: '#0F1419',
  gradientEnd: '#020617',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};

export const radius = {
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


