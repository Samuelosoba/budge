import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from './ApiContext';

interface User {
  id: string;
  email: string;
  name: string;
  isPro: boolean;
  monthlyBudget: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  upgradeToPro: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'budge_auth_token';
const USER_KEY = 'budge_user_data';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { post, get } = useApi();

  // Load stored auth data on app start
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token is still valid
          try {
            const response = await get('/auth/me', storedToken);
            setUser(response.user);
          } catch (error) {
            // Token is invalid, clear stored data
            await clearStoredAuth();
          }
        }
      } catch (error) {
        console.error('Error loading stored auth:', error);
        await clearStoredAuth();
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const clearStoredAuth = async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    setToken(null);
    setUser(null);
  };

  const storeAuth = async (authToken: string, userData: User) => {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, authToken),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(userData)),
    ]);
    setToken(authToken);
    setUser(userData);
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await post('/auth/login', { email, password });
      await storeAuth(response.token, response.user);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const response = await post('/auth/register', { email, password, name });
      await storeAuth(response.token, response.user);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await clearStoredAuth();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeToPro = async () => {
    if (!token) throw new Error('No authentication token');
    
    try {
      const response = await post('/auth/upgrade-pro', {}, token);
      const updatedUser = response.user;
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Upgrade to Pro error:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!token) throw new Error('No authentication token');
    
    try {
      const response = await post('/auth/profile', data, token);
      const updatedUser = response.user;
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      signIn,
      signUp,
      signOut,
      upgradeToPro,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}