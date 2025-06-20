import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Accent colors
  accent: string;
  accentLight: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Border colors
  border: string;
  borderLight: string;
  
  // Card colors
  card: string;
  cardSecondary: string;
  
  // Tab bar
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  
  // Modal
  modalBackground: string;
  overlay: string;
}

const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceSecondary: '#F1F3F4',
  surfaceTertiary: '#E8EAED',
  
  text: '#1A1A1A',
  textSecondary: '#5F6368',
  textTertiary: '#9AA0A6',
  
  primary: '#10B981',
  primaryLight: '#34D399',
  primaryDark: '#059669',
  
  accent: '#3B82F6',
  accentLight: '#60A5FA',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  card: '#FFFFFF',
  cardSecondary: '#F8F9FA',
  
  tabBar: '#FFFFFF',
  tabBarActive: '#10B981',
  tabBarInactive: '#9CA3AF',
  
  modalBackground: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

const darkTheme: ThemeColors = {
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceSecondary: '#262626',
  surfaceTertiary: '#333333',
  
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textTertiary: '#808080',
  
  primary: '#10B981',
  primaryLight: '#34D399',
  primaryDark: '#059669',
  
  accent: '#60A5FA',
  accentLight: '#93C5FD',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#60A5FA',
  
  border: '#404040',
  borderLight: '#333333',
  
  card: '#1A1A1A',
  cardSecondary: '#262626',
  
  tabBar: '#1A1A1A',
  tabBarActive: '#10B981',
  tabBarInactive: '#808080',
  
  modalBackground: '#1A1A1A',
  overlay: 'rgba(0, 0, 0, 0.7)',
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