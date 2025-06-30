import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Crown, Check, X, Sparkles, ArrowLeft } from 'lucide-react-native';
import { PurchasesPackage } from 'react-native-purchases';

export default function PricingScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user, upgradeToPro } = useAuth();
  const { 
    offerings, 
    isLoading, 
    error, 
    purchasePackage, 
    restorePurchases,
    isConfigured 
  } = useRevenueCat();
  
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    // Auto-select the first available package
    if (offerings && offerings.length > 0 && offerings[0].availablePackages.length > 0) {
      setSelectedPackage(offerings[0].availablePackages[0]);
    }
  }, [offerings]);

  const handlePurchase = async () => {
    if (Platform.OS === 'web') {
      // For web, use the existing upgrade flow
      try {
        await upgradeToPro();
        Alert.alert(
          'Success!',
          'You have been upgraded to Pro! Enjoy all the premium features.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to upgrade. Please try again.');
      }
      return;
    }

    if (!isConfigured) {
      Alert.alert(
        'RevenueCat Not Available',
        'In-app purchases are not available. Please try the web version for upgrades.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    setIsPurchasing(true);
    try {
      await purchasePackage(selectedPackage);
      Alert.alert(
        'Success!',
        'Welcome to Pro! You now have access to all premium features.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Purchase restoration is not available on web.');
      return;
    }

    if (!isConfigured) {
      Alert.alert('Error', 'RevenueCat is not configured. Cannot restore purchases.');
      return;
    }

    setIsRestoring(true);
    try {
      await restorePurchases();
      Alert.alert('Success', 'Your purchases have been restored!');
    } catch (error: any) {
      Alert.alert('Restore Failed', error.message || 'Failed to restore purchases.');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatPrice = (packageItem: PurchasesPackage) => {
    if (Platform.OS === 'web') {
      return '$9.99/month'; // Fallback for web
    }
    return packageItem.product.priceString;
  };

  const getPackageTitle = (packageItem: PurchasesPackage) => {
    if (Platform.OS === 'web') {
      return 'Pro Monthly';
    }
    return packageItem.product.title || 'Pro Subscription';
  };

  const getPackageDescription = (packageItem: PurchasesPackage) => {
    if (Platform.OS === 'web') {
      return 'Unlock all premium features';
    }
    return packageItem.product.description || 'Access to all premium features';
  };

  const features = [
    { name: 'AI-Powered Financial Assistant', included: true },
    { name: 'Advanced Analytics & Insights', included: true },
    { name: 'Unlimited Budget Categories', included: true },
    { name: 'Custom Spending Reports', included: true },
    { name: 'Priority Customer Support', included: true },
    { name: 'Export Data in Multiple Formats', included: true },
    { name: 'Advanced Security Features', included: true },
  ];

  const freeFeatures = [
    { name: 'Basic Transaction Tracking', included: true },
    { name: 'Up to 5 Budget Categories', included: true },
    { name: 'Monthly Spending Overview', included: true },
    { name: 'Basic Analytics', included: true },
    { name: 'AI Assistant', included: false },
    { name: 'Advanced Reports', included: false },
    { name: 'Priority Support', included: false },
  ];

  if (isLoading && Platform.OS !== 'web') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading pricing...</Text>
      </View>
    );
  }

  if (error && Platform.OS !== 'web') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: '#EF4444' }]}>Unable to load pricing</Text>
        <Text style={[styles.errorSubtext, { color: theme.textSecondary }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.retryButtonText, { color: isDark ? '#1A1A1A' : 'white' }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const styles = createStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.surface }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: theme.primary }]}>
            <Crown size={48} color={isDark ? '#1A1A1A' : 'white'} />
          </View>
          <Text style={styles.heroTitle}>Unlock Premium Features</Text>
          <Text style={styles.heroSubtitle}>
            Get the most out of your financial journey with our Pro subscription
          </Text>
        </View>

        {/* Platform Notice */}
        {Platform.OS === 'web' && (
          <View style={[styles.platformNotice, { backgroundColor: theme.surface }]}>
            <Text style={[styles.platformNoticeText, { color: theme.textSecondary }]}>
              💻 Web Version: Upgrade directly through our secure payment system
            </Text>
          </View>
        )}

        {!isConfigured && Platform.OS !== 'web' && (
          <View style={[styles.platformNotice, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.platformNoticeText, { color: '#92400E' }]}>
              ⚠️ In-app purchases not available. Please use the web version to upgrade.
            </Text>
          </View>
        )}

        {/* Pricing Cards */}
        <View style={styles.pricingSection}>
          {/* Free Plan */}
          <View style={[styles.pricingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.planName, { color: theme.text }]}>Free</Text>
              <Text style={[styles.planPrice, { color: theme.text }]}>$0</Text>
              <Text style={[styles.planPeriod, { color: theme.textSecondary }]}>forever</Text>
            </View>
            
            <View style={styles.featuresList}>
              {freeFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  {feature.included ? (
                    <Check size={16} color="#10B981" />
                  ) : (
                    <X size={16} color="#EF4444" />
                  )}
                  <Text style={[
                    styles.featureText,
                    { color: feature.included ? theme.text : theme.textTertiary }
                  ]}>
                    {feature.name}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.planButton, styles.freeButton, { borderColor: theme.border }]}
              disabled
            >
              <Text style={[styles.planButtonText, { color: theme.textSecondary }]}>
                Current Plan
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pro Plan */}
          <View style={[
            styles.pricingCard, 
            styles.featuredCard,
            { backgroundColor: theme.card, borderColor: theme.primary }
          ]}>
            <View style={[styles.featuredBadge, { backgroundColor: theme.primary }]}>
              <Sparkles size={16} color={isDark ? '#1A1A1A' : 'white'} />
              <Text style={[styles.featuredText, { color: isDark ? '#1A1A1A' : 'white' }]}>
                Most Popular
              </Text>
            </View>

            <View style={styles.cardHeader}>
              <Text style={[styles.planName, { color: theme.text }]}>Pro</Text>
              <Text style={[styles.planPrice, { color: theme.primary }]}>
                {Platform.OS === 'web' ? '$9.99' : (selectedPackage ? formatPrice(selectedPackage) : '$9.99')}
              </Text>
              <Text style={[styles.planPeriod, { color: theme.textSecondary }]}>per month</Text>
            </View>
            
            <View style={styles.featuresList}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Check size={16} color="#10B981" />
                  <Text style={[styles.featureText, { color: theme.text }]}>
                    {feature.name}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.planButton, styles.proButton, { backgroundColor: theme.primary }]}
              onPress={handlePurchase}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color={isDark ? '#1A1A1A' : 'white'} />
              ) : (
                <>
                  <Crown size={20} color={isDark ? '#1A1A1A' : 'white'} />
                  <Text style={[styles.planButtonText, { color: isDark ? '#1A1A1A' : 'white' }]}>
                    Upgrade to Pro
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Restore Purchases Button (Mobile Only) */}
        {Platform.OS !== 'web' && isConfigured && (
          <TouchableOpacity
            style={[styles.restoreButton, { borderColor: theme.border }]}
            onPress={handleRestorePurchases}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={theme.textSecondary} />
            ) : (
              <Text style={[styles.restoreButtonText, { color: theme.textSecondary }]}>
                Restore Purchases
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Terms */}
        <View style={styles.terms}>
          <Text style={[styles.termsText, { color: theme.textTertiary }]}>
            By subscribing, you agree to our Terms of Service and Privacy Policy. 
            {Platform.OS !== 'web' && ' Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.text,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  platformNotice: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  platformNoticeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  pricingSection: {
    paddingHorizontal: 20,
    gap: 20,
    marginBottom: 32,
  },
  pricingCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  featuredCard: {
    transform: [{ scale: 1.02 }],
  },
  featuredBadge: {
    position: 'absolute',
    top: -12,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 4,
  },
  featuredText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  planName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  planPeriod: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  featuresList: {
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  freeButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  proButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  planButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  restoreButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  restoreButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  terms: {
    paddingHorizontal: 20,
  },
  termsText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
});