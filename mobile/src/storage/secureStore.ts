import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const tokenStorage = {
  async getToken(): Promise<string | null> {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem('cropcare_token');
        }
        return null;
      }
      return await SecureStore.getItemAsync('cropcare_token');
    } catch (e) {
      console.warn('[SecureStore] Failed to read token:', e);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('cropcare_token', token);
        }
        return;
      }
      await SecureStore.setItemAsync('cropcare_token', token);
    } catch (e) {
      console.warn('[SecureStore] Failed to save token:', e);
    }
  },

  async removeToken(): Promise<void> {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('cropcare_token');
        }
        return;
      }
      await SecureStore.deleteItemAsync('cropcare_token');
    } catch (e) {
      console.warn('[SecureStore] Failed to delete token:', e);
    }
  },
};
