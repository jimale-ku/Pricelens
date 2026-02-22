/**
 * Design System - Theme Configuration
 * Based on PriceLens Figma Design
 */

export const theme = {
  colors: {
    // Primary Brand Colors
    primary: {
      main: '#8B5CF6', // Purple
      light: '#A78BFA',
      dark: '#7C3AED',
      gradient: ['#8B5CF6', '#3B82F6'], // Purple to Blue
    },
    
    // Accent Colors
    accent: {
      cyan: '#06B6D4',
      blue: '#3B82F6',
      green: '#10B981',
      yellow: '#FBBF24',
      orange: '#F97316',
      red: '#EF4444',
      pink: '#EC4899',
    },
    
    // Background Colors
    background: {
      primary: '#0B1020', // Main dark bg
      secondary: '#1A1F35',
      /** App header / category bar color – use this for all category headers so the app has one uniform color */
      appHeader: 'rgba(15, 23, 42, 0.6)',
      appHeaderSolid: '#0F172A',
      card: 'rgba(255, 255, 255, 0.05)',
      cardBorder: 'rgba(255, 255, 255, 0.1)',
      input: 'rgba(255, 255, 255, 0.05)',
    },
    
    // Text Colors
    text: {
      primary: '#FFFFFF',
      secondary: '#9CA3AF',
      tertiary: '#6B7280',
      muted: '#4B5563',
    },
    
    // Status Colors
    status: {
      success: '#10B981',
      error: '#EF4444',
      warning: '#FBBF24',
      info: '#3B82F6',
    },
    
    // Category Icon Colors (from Figma)
    categoryIcons: {
      green: '#10B981',
      blue: '#3B82F6',
      purple: '#8B5CF6',
      cyan: '#06B6D4',
      orange: '#F97316',
      yellow: '#FBBF24',
      red: '#EF4444',
      pink: '#EC4899',
      gray: '#6B7280',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },
  
  typography: {
    fontSizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
} as const;

export type Theme = typeof theme;
