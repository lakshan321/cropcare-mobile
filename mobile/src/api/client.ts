import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { tokenStorage } from '../storage/secureStore';

// Determine default host: on physical device or emulator, use computer LAN IP
const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

export const API_BASE_URL = DEFAULT_API_URL.replace(/\/$/, '');

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedCallback = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

export const apiRequest = async <T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: any;
    isFormData?: boolean;
    headers?: Record<string, string>;
  } = {}
): Promise<{ success: boolean; data?: T; message?: string; errors?: any[] }> => {
  const method = options.method || 'GET';
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = await tokenStorage.getToken();

  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body: any = options.body;
  if (body && !options.isFormData && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const response = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 401) {
      console.warn('[API] 401 Unauthorized encountered. Session invalid or expired.');
      await tokenStorage.removeToken();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        message: data.message || 'Session expired. Please log in again.',
      };
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/csv')) {
      const csvText = await response.text();
      return {
        success: response.ok,
        data: csvText as any,
      };
    }

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: json.message || `Request failed with status ${response.status}`,
        errors: json.errors,
      };
    }

    return {
      success: true,
      data: json,
      message: json.message,
    };
  } catch (error: any) {
    console.error(`[API] Error on ${method} ${url}:`, error.message);
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'Network request timed out. Please check your connectivity.',
      };
    }
    return {
      success: false,
      message:
        'Unable to reach CropCare server. Make sure the backend is running and the device is connected to the same network.',
    };
  }
};
