import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useProAccess } from '@/hooks/useProAccess';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Crown, Lock, Sparkles } from 'lucide-react-native';
import { Platform } from 'react-native';

interface ProGateProps {
  children: React.ReactNode;
  fallbackScreen?: React.ReactNode;
}

export default function ProGate({ children, fallbackScreen }: ProGateProps) {
  const { hasProAccess, isCheckingAccess } = useProAccess();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const router = useRouter();

  // For web platform, use the existing isPro field from user context
  const isProUser = Platform.OS === 'web' ? user?.isPro : hasProAccess;

  if (isCheckingAccess) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Sparkles size={48} color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Checking subscription status...
          </Text>
        </View>
      </View>
    );
  }

  if (isProUser) {
    return <>{children}</>;
  }

  if (fallbackScreen) {
    return <>{fallbackScreen}</>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
          <Crown size={64} color={theme.primary} />
        </View>
        
        <Text style={[styles.title, { color: theme.text }]}>
          Upgrade to Pro
        </Text>
        
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Unlock the AI Assistant and get personalized financial insights, advanced analytics, and unlimited budget tracking.
        </Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Sparkles size={20} color={theme.primary} />
            <Text style={[styles.featureText, { color: theme.text }]}>
              AI-Powered Financial Assistant
            </Text>
          </View>
          <View style={styles.feature}>
            <Sparkles size={20} color={theme.primary} />
            <Text style={[styles.featureText, { color: theme.text }]}>
              Advanced Analytics & Insights
            </Text>
          </View>
          <View style={styles.feature}>
            <Sparkles size={20} color={theme.primary} />
            <Text style={[styles.featureText, { color: theme.text }]}>
              Unlimited Budget Categories
            </Text>
          </View>
          <View style={styles.feature}>
            <Sparkles size={20} color={theme.primary} />
            <Text style={[styles.featureText, { color: theme.text }]}>
              Priority Customer Support
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/pricing')}
        >
          <Crown size={20} color={isDark ? '#1A1A1A' : 'white'} />
          <Text style={[styles.upgradeButtonText, { color: isDark ? '#1A1A1A' : 'white' }]}>
            View Pricing Plans
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  features: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});