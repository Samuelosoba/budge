import React, { createContext, useContext } from 'react';
import Constants from 'expo-constants';

const getApiUrl = () => {
  // Always prefer explicitly set public API URL first
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Development mode: try to infer local IP
  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (debuggerHost) {
      return `http://${debuggerHost}:3000/api`;
    }
  }

  // Final fallback (localhost)
  return 'http://localhost:3000/api';
};

const API_BASE_URL ="https://1b1d-129-205-124-201.ngrok-free.app/api";

interface ApiContextType {
  apiCall: (endpoint: string, options?: RequestInit) => Promise<any>;
  get: (endpoint: string, token?: string) => Promise<any>;
  post: (endpoint: string, data: any, token?: string) => Promise<any>;
  put: (endpoint: string, data: any, token?: string) => Promise<any>;
  delete: (endpoint: string, token?: string, data?: any) => Promise<any>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`Making API call to: ${url}`);
      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error ${response.status}:`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API call failed:', error);

      // Provide more specific error messages
      if (
        error instanceof TypeError &&
        error.message.includes('Network request failed')
      ) {
        throw new Error(
          'Unable to connect to server. Please check your internet connection and ensure the backend is running.'
        );
      }

      throw error;
    }
  };

  const get = async (endpoint: string, token?: string) => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return apiCall(endpoint, {
      method: 'GET',
      headers,
    });
  };

  const post = async (endpoint: string, data: any, token?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return apiCall(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  };

  const put = async (endpoint: string, data: any, token?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return apiCall(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
  };

  const deleteMethod = async (endpoint: string, token?: string, data?: any) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method: 'DELETE',
      headers,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    return apiCall(endpoint, options);
  };

  return (
    <ApiContext.Provider
      value={{
        apiCall,
        get,
        post,
        put,
        delete: deleteMethod,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}

export default getApiUrl;