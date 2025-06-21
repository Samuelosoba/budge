import { Tabs, Redirect } from 'expo-router';
import { Chrome as Home, ChartBar as BarChart3, MessageCircle, Settings, Plus } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Calculate tab bar height and padding for Android
  const getTabBarStyle = () => {
    const baseHeight = 80;
    const basePaddingBottom = 20;
    
    if (Platform.OS === 'android') {
      // For Android devices with three-button navigation
      // Reduce bottom padding and adjust height to move tabs up
      return {
        backgroundColor: theme.tabBar,
        borderTopWidth: isDark ? 0 : 1,
        borderTopColor: isDark ? 'transparent' : theme.border,
        paddingTop: 12,
        paddingBottom: Math.max(8, insets.bottom - 12), // Reduced padding for Android
        height: baseHeight - 10, // Slightly reduced height
        paddingHorizontal: 20,
        // Add margin bottom to lift the entire tab bar
        marginBottom: Platform.OS === 'android' ? 8 : 0,
      };
    }
    
    // iOS styling remains the same
    return {
      backgroundColor: theme.tabBar,
      borderTopWidth: isDark ? 0 : 1,
      borderTopColor: isDark ? 'transparent' : theme.border,
      paddingTop: 16,
      paddingBottom: Math.max(basePaddingBottom, insets.bottom + 10),
      height: baseHeight + Math.max(0, insets.bottom - 10),
      paddingHorizontal: 20,
    };
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: getTabBarStyle(),
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter-Medium',
          marginTop: Platform.OS === 'android' ? 4 : 6, // Reduced margin for Android
        },
        tabBarIconStyle: {
          marginBottom: Platform.OS === 'android' ? 2 : 4, // Reduced margin for Android
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ size, color }) => (
            <Plus size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: 'AI Assistant',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});