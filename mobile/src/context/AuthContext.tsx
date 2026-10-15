import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { tokenStorage } from '../storage/secureStore';
import { apiRequest, setOnUnauthorizedCallback } from '../api/client';
import { useRouter } from 'expo-router';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  registerFarmer: (data: {
    username: string;
    password: string;
    fullName: string;
    district?: string;
    phone?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => ({ success: false }),
  registerFarmer: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const handleLogout = async () => {
    await tokenStorage.removeToken();
    setUser(null);
    setToken(null);
    router.replace('/(auth)/login');
  };

  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      handleLogout();
    });

    const restoreSession = async () => {
      try {
        const storedToken = await tokenStorage.getToken();
        if (storedToken) {
          setToken(storedToken);
          const res = await apiRequest<{ user: User }>('/api/auth/me');
          if (res.success && res.data?.user) {
            setUser(res.data.user);
          } else {
            await tokenStorage.removeToken();
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Session restore error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      });

      if (!res.success || !res.data) {
        return { success: false, message: res.message || 'Login failed.' };
      }

      const { token: receivedToken, user: receivedUser } = res.data;
      await tokenStorage.setToken(receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);

      // Route based on role derived from backend database
      if (receivedUser.role === 'officer') {
        router.replace('/(officer)/dashboard');
      } else {
        router.replace('/(farmer)');
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection error.' };
    }
  };

  const registerFarmer = async (data: {
    username: string;
    password: string;
    fullName: string;
    district?: string;
    phone?: string;
  }) => {
    try {
      const res = await apiRequest<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: data,
      });

      if (!res.success || !res.data) {
        return { success: false, message: res.message || 'Registration failed.' };
      }

      const { token: receivedToken, user: receivedUser } = res.data;
      await tokenStorage.setToken(receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);

      router.replace('/(farmer)');
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration failed.' };
    }
  };

  const refreshUser = async () => {
    try {
      const res = await apiRequest<{ user: User }>('/api/auth/me');
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        registerFarmer,
        logout: handleLogout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
