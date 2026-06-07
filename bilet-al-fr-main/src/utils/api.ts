import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

export { useTranslation } from 'react-i18next';

// ============================================================
// AUTH STORE - Zustand
// ============================================================

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      userId: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, userId: user.id, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, userId: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken, userId: s.userId, isAuthenticated: s.isAuthenticated }) }
  )
);

// ============================================================
// APP STORE - Theme, Language
// ============================================================

interface AppState {
  theme: 'light' | 'dark';
  language: 'tr' | 'en';
  sidebarOpen: boolean;
  toggleTheme: () => void;
  setLanguage: (lang: 'tr' | 'en') => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'tr',
      sidebarOpen: true,
      toggleTheme: () => set((s) => {
        const newTheme = s.theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        return { theme: newTheme };
      }),
      setLanguage: (language) => {
        localStorage.setItem('lang', language);
        set({ language });
      },
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: 'app-storage' }
  )
);

// ============================================================
// API CLIENT
// ============================================================

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const lang = localStorage.getItem('lang') || 'tr';
  config.headers['Accept-Language'] = lang;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { refreshToken, userId } = useAuthStore.getState();
        const res = await axios.post('/api/v1/auth/refresh', { userId, refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data;
        useAuthStore.getState().setTokens(accessToken, newRefresh);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/giris';
      }
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;
