import { createContext, useContext, useState, type ReactNode } from 'react';
import { api, ApiRequestError } from '../lib/api';

interface AuthContextValue {
  hasViewAccess: boolean;
  loginView: (password: string) => Promise<{ ok: boolean; message?: string }>;
  isAdmin: boolean;
  login: (password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const ADMIN_PASSWORD_STORAGE_KEY = 'admin-password';
export const VIEW_PASSWORD_STORAGE_KEY = 'view-password';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hasViewAccess, setHasViewAccess] = useState(() => sessionStorage.getItem(VIEW_PASSWORD_STORAGE_KEY) !== null);
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) !== null);

  async function loginView(password: string) {
    try {
      await api.post('/auth/verify-view', { password });
      sessionStorage.setItem(VIEW_PASSWORD_STORAGE_KEY, password);
      setHasViewAccess(true);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof ApiRequestError ? err.message : 'Something went wrong.' };
    }
  }

  async function login(password: string) {
    try {
      await api.post('/auth/verify-admin', { password });
      sessionStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, password);
      setIsAdmin(true);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof ApiRequestError ? err.message : 'Something went wrong.' };
    }
  }

  function logout() {
    sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
    setIsAdmin(false);
  }

  return (
    <AuthContext.Provider value={{ hasViewAccess, loginView, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
