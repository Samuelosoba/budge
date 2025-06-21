import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from './ApiContext';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', locale: 'es-MX' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', locale: 'en-HK' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', locale: 'ar-EG' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', locale: 'en-KE' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', locale: 'en-GH' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', locale: 'da-DK' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Złoty', locale: 'pl-PL' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', locale: 'cs-CZ' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', locale: 'hu-HU' },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number, options?: { showSymbol?: boolean; compact?: boolean }) => string;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => Promise<number>;
  updateUserCurrency: (currencyCode: string, token?: string) => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'budge_selected_currency';

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(SUPPORTED_CURRENCIES[0]); // Default to USD
  const { put } = useApi();

  // Load saved currency on app start
  useEffect(() => {
    const loadSavedCurrency = async () => {
      try {
        const savedCurrencyCode = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
        if (savedCurrencyCode) {
          const savedCurrency = SUPPORTED_CURRENCIES.find(c => c.code === savedCurrencyCode);
          if (savedCurrency) {
            setCurrencyState(savedCurrency);
          }
        }
      } catch (error) {
        console.error('Error loading saved currency:', error);
      }
    };

    loadSavedCurrency();
  }, []);

  const setCurrency = async (newCurrency: Currency) => {
    try {
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency.code);
      setCurrencyState(newCurrency);
    } catch (error) {
      console.error('Error saving currency:', error);
    }
  };

  const updateUserCurrency = async (currencyCode: string, token?: string) => {
    try {
      // Update local state first
      const newCurrency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
      if (newCurrency) {
        await setCurrency(newCurrency);
      }

      // Update on server if token is provided
      if (token) {
        try {
          await put('/auth/currency', { currency: currencyCode }, token);
        } catch (error) {
          console.error('Failed to update currency on server:', error);
          // Don't throw error as local update succeeded
        }
      }
    } catch (error) {
      console.error('Error updating user currency:', error);
      throw error;
    }
  };

  const formatCurrency = (amount: number, options: { showSymbol?: boolean; compact?: boolean } = {}) => {
    const { showSymbol = true, compact = false } = options;

    try {
      // Special handling for Nigerian Naira and other currencies that might not have full Intl support
      if (currency.code === 'NGN') {
        const formattedAmount = compact && Math.abs(amount) >= 1000 
          ? formatCompactNumber(amount)
          : amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        
        return showSymbol ? `₦${formattedAmount}` : formattedAmount;
      }

      // Special handling for other currencies with limited Intl support
      const currenciesWithLimitedSupport = ['KES', 'GHS', 'EGP'];
      if (currenciesWithLimitedSupport.includes(currency.code)) {
        const formattedAmount = compact && Math.abs(amount) >= 1000 
          ? formatCompactNumber(amount)
          : amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        
        return showSymbol ? `${currency.symbol}${formattedAmount}` : formattedAmount;
      }

      const formatter = new Intl.NumberFormat(currency.locale, {
        style: showSymbol ? 'currency' : 'decimal',
        currency: currency.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        notation: compact ? 'compact' : 'standard',
        compactDisplay: 'short',
      });

      return formatter.format(amount);
    } catch (error) {
      // Fallback formatting if Intl.NumberFormat fails
      const formattedAmount = compact && Math.abs(amount) >= 1000 
        ? formatCompactNumber(amount)
        : amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      
      return showSymbol ? `${currency.symbol}${formattedAmount}` : formattedAmount;
    }
  };

  // Simple conversion function (in a real app, you'd use a currency API)
  const convertAmount = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
    if (fromCurrency === toCurrency) return amount;
    
    // This is a simplified conversion - in production, you'd use a real exchange rate API
    // For now, we'll just return the amount as-is since we don't have real-time rates
    console.warn('Currency conversion not implemented - using 1:1 rate');
    return amount;
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      formatCurrency,
      convertAmount,
      updateUserCurrency,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

// Helper function for compact number formatting
function formatCompactNumber(num: number): string {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1e9) {
    return sign + (absNum / 1e9).toFixed(1) + 'B';
  } else if (absNum >= 1e6) {
    return sign + (absNum / 1e6).toFixed(1) + 'M';
  } else if (absNum >= 1e3) {
    return sign + (absNum / 1e3).toFixed(1) + 'K';
  }
  
  return num.toString();
}