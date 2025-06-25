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
      if (!REVENUECAT_API_KEY) {
        throw new Error('RevenueCat API key not found in environment variables');
      }

      // Configure RevenueCat
      if (Platform.OS === 'ios') {
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      } else if (Platform.OS === 'android') {
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      } else {
        // Web fallback - RevenueCat doesn't work on web
        setState(prev => ({
          ...prev,
          isConfigured: false,
          isLoading: false,
          error: 'RevenueCat is not supported on web platform'
        }));
        return;
      }

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
    } catch (error) {
      console.error('Purchase error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
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
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to restore purchases',
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