import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  surfaceSecondary: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  
  // Border colors
  border: string;
  
  // Card colors
  card: string;
  
  // Tab bar
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  
  // Special UI elements to match exact design
  balanceCard: string;
  balanceText: string;
  circleButton: string;
  circleButtonSecondary: string;
  pillButton: string;
  pillButtonText: string;
  transactionRow: string;
  statusBarBg: string;
  goldAccent: string;
  navyBlue: string;
  lightCream: string;
}

const lightTheme: ThemeColors = {
  background: '#F5F5F0', // Light cream background
  surface: '#FFFFFF',
  surfaceSecondary: '#F8F9FA',
  
  text: '#1A1A1A',
  textSecondary: '#5F6368',
  textTertiary: '#9AA0A6',
  
  primary: '#2C3E50', // Navy blue from design
  primaryLight: '#34495E',
  primaryDark: '#1A252F',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  border: '#E5E7EB',
  
  card: '#FFFFFF',
  
  tabBar: '#FFFFFF',
  tabBarActive: '#2C3E50',
  tabBarInactive: '#9CA3AF',
  
  // Exact design elements
  balanceCard: '#2C3E50', // Navy blue card
  balanceText: '#FFFFFF',
  circleButton: '#8B6914', // Much darker gold accent
  circleButtonSecondary: '#8E8E93',
  pillButton: '#2C3E50',
  pillButtonText: '#FFFFFF',
  transactionRow: 'rgba(255, 255, 255, 0.95)',
  statusBarBg: '#F5F5F0',
  goldAccent: '#8B6914', // Much darker gold
  navyBlue: '#2C3E50',
  lightCream: '#F5F5F0',
};

const darkTheme: ThemeColors = {
  background: '#1A1A1A', // Very dark background matching the image
  surface: '#2A2A2A', // Slightly lighter dark surface
  surfaceSecondary: '#333333',
  
  text: '#FFFFFF', // Pure white text
  textSecondary: '#B8B8B8', // Light gray for secondary text
  textTertiary: '#808080', // Medium gray for tertiary text
  
  primary: '#D4AF37', // Elegant gold/champagne color from the image
  primaryLight: '#E6C55A',
  primaryDark: '#B8941F',
  
  success: '#4ADE80', // Subtle green for income
  warning: '#FBBF24', // Muted yellow for warnings
  error: '#F87171', // Soft red for expenses
  
  border: '#404040', // Dark border
  
  card: '#2A2A2A', // Dark card background
  
  tabBar: '#1A1A1A', // Same as background
  tabBarActive: '#D4AF37', // Gold for active tab
  tabBarInactive: '#808080', // Gray for inactive tabs
  
  // Exact design elements matching the image
  balanceCard: '#2A2A2A', // Dark card with subtle difference from background
  balanceText: '#FFFFFF', // White text on dark card
  circleButton: '#D4AF37', // Gold accent for buttons
  circleButtonSecondary: '#404040', // Dark gray for secondary buttons
  pillButton: '#D4AF37', // Gold pill buttons
  pillButtonText: '#1A1A1A', // Dark text on gold buttons
  transactionRow: '#2A2A2A', // Dark transaction rows
  statusBarBg: '#1A1A1A', // Dark status bar
  goldAccent: '#D4AF37', // Primary gold accent
  navyBlue: '#2C3E50', // Keep navy for contrast when needed
  lightCream: '#F5F5F0', // Keep for light mode references
};

interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'budge_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  
  // Load theme preference on app start
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };
    
    loadThemePreference();
  }, []);
  
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };
  
  // Determine if dark mode should be active
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && systemColorScheme === 'dark');
  
  // Select theme based on mode
  const theme = isDark ? darkTheme : lightTheme;
  
  return (
    <ThemeContext.Provider value={{
      theme,
      themeMode,
      isDark,
      setThemeMode,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}