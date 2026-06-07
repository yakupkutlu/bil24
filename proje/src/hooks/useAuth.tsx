import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, getToken, setToken, removeToken } from '../lib/api';
import type { Profile, UserRole } from '../types';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isOperator: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      authApi.me()
        .then(setUser)
        .catch(() => { removeToken(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function signIn(email: string, password: string) {
    const { token, user: profile } = await authApi.login(email, password);
    setToken(token);
    setUser(profile);
  }

  async function signUp(email: string, password: string, fullName: string, phone: string, role: UserRole) {
    const { token, user: profile } = await authApi.register(email, password, fullName, phone, role);
    setToken(token);
    setUser(profile);
  }

  async function signOut() {
    removeToken();
    setUser(null);
  }

  const isAdmin = user?.role === 'super_admin';
  const isOperator = user?.role === 'operator';
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isAdmin, isOperator, isCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
