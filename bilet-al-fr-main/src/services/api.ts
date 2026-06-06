import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/stores/auth.store';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const STRICT_BACKEND_MODE = true;
export const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';

export type NormalizedApiError = Error & {
  status?: number;
  code?: string;
  details?: unknown;
  url?: string;
  method?: string;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 18_000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Tiatru-Client'] = 'tiatru-frontend';
  config.headers['X-Tiatru-Env'] = APP_ENV;
  config.headers['X-Request-Id'] = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return config;
});

let refreshing = false;
let pending: Array<(token: string | null) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const isRefreshCall = original?.url?.includes('/auth/refresh');
    const isAuthEndpoint = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !original._retry && !isRefreshCall && !isAuthEndpoint) {
      original._retry = true;

      if (!refreshing) {
        refreshing = true;
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true, timeout: 12_000 });
          const token = response.data?.data?.accessToken || response.data?.accessToken;
          const user = response.data?.data?.user || response.data?.user || useAuthStore.getState().user;

          if (token && user) {
            useAuthStore.getState().setSession(user, token);
          }

          pending.forEach((callback) => callback(token ?? null));
          return api(original);
        } catch (refreshError) {
          pending.forEach((callback) => callback(null));
          useAuthStore.getState().logout();
          return Promise.reject(normalizeApiError(refreshError));
        } finally {
          refreshing = false;
          pending = [];
        }
      }

      return new Promise((resolve, reject) => {
        pending.push((token) => {
          if (!token) return reject(normalizeApiError(error));
          original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
          resolve(api(original));
        });
      });
    }

    return Promise.reject(normalizeApiError(error));
  }
);

export function unwrap<T>(response: AxiosResponse<any> | { data: any }): T {
  const payload = response.data;
  if (payload?.data !== undefined) return payload.data as T;
  if (payload?.result !== undefined) return payload.result as T;
  if (payload?.payload !== undefined) return payload.payload as T;
  return payload as T;
}

export function unwrapList<T>(response: AxiosResponse<any> | { data: any }, preferredKeys: string[] = ['items', 'docs', 'results', 'tickets', 'bookings', 'events', 'users', 'showtimes', 'halls', 'payments', 'refunds', 'auditLogs', 'logs', 'notifications']): T[] {
  const value = unwrap<any>(response);
  if (Array.isArray(value)) return value as T[];
  for (const key of preferredKeys) {
    if (Array.isArray(value?.[key])) return value[key] as T[];
  }
  if (Array.isArray(value?.data)) return value.data as T[];
  return [];
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as any;

    console.group('❌ TAM API HATASI');

    console.error('Tam Axios hatası:', error);

    console.log('Durum:', error.response?.status);
    console.log('Durum metni:', error.response?.statusText);

    console.log('Backend yanıt verisi:', error.response?.data);

    console.log('İstek URL:', (error.config?.baseURL ?? '') + (error.config?.url ?? ''));
    console.log('İstek yöntemi:', error.config?.method?.toUpperCase());
    console.log('İstek parametreleri:', error.config?.params);
    console.log('İstek gövdesi:', error.config?.data);

    console.log('İstek başlıkları:', error.config?.headers);
    console.log('Yanıt başlıkları:', error.response?.headers);

    console.groupEnd();

    const message =
      payload?.message ||
      payload?.error ||
      payload?.errors?.[0]?.message ||
      error.message ||
      'API hatası';

    const normalized = new Error(message) as NormalizedApiError;

    normalized.status = error.response?.status;
    normalized.code = payload?.code || error.code;
    normalized.details = payload?.errors || payload?.details || payload;
    normalized.url = error.config?.url;
    normalized.method = error.config?.method?.toUpperCase();

    return normalized;
  }

  console.group('❌ BİLİNMEYEN API HATASI');
  console.error(error);
  console.groupEnd();

  return error instanceof Error ? error : new Error('Bilinmeyen hata');
}

export const apiHealthService = {
  ping: () => api.get('/health').then(unwrap).catch(() => api.get('/settings').then(unwrap)),
  config: () => ({ baseUrl: API_BASE_URL, backendOnlyMode: STRICT_BACKEND_MODE, strictBackendMode: STRICT_BACKEND_MODE, appEnv: APP_ENV })
};
