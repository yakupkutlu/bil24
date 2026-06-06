import { create } from 'zustand';
import type { User } from '@/types';

type AuthState = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (user: User, accessToken: string) => void;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
};

function readSavedUser() {
  try {
    const saved = localStorage.getItem('tiatru_user');
    return saved ? JSON.parse(saved) as User : null;
  } catch {
    localStorage.removeItem('tiatru_user');
    return null;
  }
}

const savedUser = readSavedUser();
const savedToken = localStorage.getItem('tiatru_access_token');

export const useAuthStore = create<AuthState>((set) => ({
  user: savedUser,
  accessToken: savedToken,
  isAuthenticated: Boolean(savedUser && savedToken),
  setSession: (user, accessToken) => {
    localStorage.setItem('tiatru_user', JSON.stringify(user));
    localStorage.setItem('tiatru_access_token', accessToken);
    set({ user, accessToken, isAuthenticated: true });
  },
  login: (user, accessToken) => {
    localStorage.setItem('tiatru_user', JSON.stringify(user));
    localStorage.setItem('tiatru_access_token', accessToken);
    set({ user, accessToken, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('tiatru_user');
    localStorage.removeItem('tiatru_access_token');
    set({ user: null, accessToken: null, isAuthenticated: false });
  }
}));
