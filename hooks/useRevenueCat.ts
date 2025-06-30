import { useEffect, useState } from 'react';
import Purchases, { 
  PurchasesOffering, 
  CustomerInfo, 
  PurchasesPackage,
  LOG_LEVEL 
} from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const REVENUECAT_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_API_KEY;

export interface RevenueCatState {
  isConfigured: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOffering[] | null;
  isLoading: boolean;
  error: string | null;
}

export function useRevenueCat() {
  const [state, setState] = useState<RevenueCatState>({
    isConfigured: false,
    customerInfo: null,
    offerings: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    initializeRevenueCat();
  }, []);

  const initializeRevenueCat = async () => {
    try {
      // Check if we're on web platform
      if (Platform.OS === 'web') {
        setState(prev => ({
          ...prev,
          isConfigured: false,
          isLoading: false,
          error: 'RevenueCat is not supported on web platform. Please use the web upgrade flow.'
        }));
        return;
      }

      if (!REVENUECAT_API_KEY) {
        setState(prev => ({
          ...prev,
          isConfigured: false,
          isLoading: false,
          error: 'RevenueCat API key not found. Please configure EXPO_PUBLIC_REVENUECAT_API_KEY in your environment.'
        }));
        return;
      }

      // Configure RevenueCat
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });

      // Set debug logs in development
      if (__DEV__) {
        await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Get initial customer info
      const customerInfo = await Purchases.getCustomerInfo();
      
      // Get available offerings
      const offerings = await Purchases.getOfferings();

      setState(prev => ({
        ...prev,
        isConfigured: true,
        customerInfo,
        offerings: offerings.all ? Object.values(offerings.all) : [],
        isLoading: false,
        error: null,
      }));

    } catch (error) {
      console.error('RevenueCat initialization error:', error);
      setState(prev => ({
        ...prev,
        isConfigured: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize RevenueCat',
      }));
    }
  };

  const purchasePackage = async (packageToPurchase: PurchasesPackage) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      setState(prev => ({
        ...prev,
        customerInfo,
        isLoading: false,
      }));

      return customerInfo;
    } catch (error: any) {
      console.error('Purchase error:', error);
      
      // Handle user cancellation gracefully
      if (error.userCancelled) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null, // Don't show error for user cancellation
        }));
        throw { userCancelled: true };
      }
      
      const errorMessage = error.message || 'Purchase failed. Please try again.';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const restorePurchases = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const customerInfo = await Purchases.restorePurchases();
      
      setState(prev => ({
        ...prev,
        customerInfo,
        isLoading: false,
      }));

      return customerInfo;
    } catch (error) {
      console.error('Restore purchases error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore purchases';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const refreshCustomerInfo = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setState(prev => ({ ...prev, customerInfo }));
      return customerInfo;
    } catch (error) {
      console.error('Refresh customer info error:', error);
      throw error;
    }
  };

  return {
    ...state,
    purchasePackage,
    restorePurchases,
    refreshCustomerInfo,
    initializeRevenueCat,
  };
}