import { useEffect, useState } from 'react';
import { useRevenueCat } from './useRevenueCat';
import { useAuth } from '@/contexts/AuthContext';
import { Platform } from 'react-native';

const PRO_ENTITLEMENT_ID = 'pro'; // This should match your RevenueCat entitlement ID

export function useProAccess() {
  const { customerInfo, isConfigured, isLoading } = useRevenueCat();
  const { user } = useAuth();
  const [hasProAccess, setHasProAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    checkProAccess();
  }, [customerInfo, isConfigured, user]);

  const checkProAccess = () => {
    setIsCheckingAccess(true);

    try {
      // For web platform, use the existing isPro field from user context
      if (Platform.OS === 'web') {
        setHasProAccess(user?.isPro || false);
        setIsCheckingAccess(false);
        return;
      }

      if (!isConfigured || !customerInfo) {
        // If RevenueCat is not configured, fall back to user.isPro
        setHasProAccess(user?.isPro || false);
        setIsCheckingAccess(false);
        return;
      }

      // Check if user has the pro entitlement
      const proEntitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];
      const hasAccess = proEntitlement?.isActive === true;

      setHasProAccess(hasAccess);
      setIsCheckingAccess(false);

    } catch (error) {
      console.error('Error checking pro access:', error);
      // Fall back to user.isPro on error
      setHasProAccess(user?.isPro || false);
      setIsCheckingAccess(false);
    }
  };

  return {
    hasProAccess,
    isCheckingAccess: isCheckingAccess || isLoading,
    checkProAccess,
  };
}