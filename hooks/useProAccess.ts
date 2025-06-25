import { useEffect, useState } from 'react';
import { useRevenueCat } from './useRevenueCat';
import { Platform } from 'react-native';

const PRO_ENTITLEMENT_ID = 'pro'; // This should match your RevenueCat entitlement ID

export function useProAccess() {
  const { customerInfo, isConfigured, isLoading } = useRevenueCat();
  const [hasProAccess, setHasProAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    checkProAccess();
  }, [customerInfo, isConfigured]);

  const checkProAccess = () => {
    setIsCheckingAccess(true);

    try {
      // On web, we'll check the user's isPro status from the auth context
      if (Platform.OS === 'web') {
        // For web, we'll rely on the existing isPro field from the user context
        // This will be handled in the component that uses this hook
        setHasProAccess(false); // Default to false for web
        setIsCheckingAccess(false);
        return;
      }

      if (!isConfigured || !customerInfo) {
        setHasProAccess(false);
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
      setHasProAccess(false);
      setIsCheckingAccess(false);
    }
  };

  return {
    hasProAccess,
    isCheckingAccess: isCheckingAccess || isLoading,
    checkProAccess,
  };
}