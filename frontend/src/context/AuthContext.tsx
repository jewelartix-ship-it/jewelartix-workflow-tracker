import { createContext, useContext, useState, type ReactNode } from 'react';
import { api, ApiRequestError } from '../lib/api';

interface AuthContextValue {
  isAdmin: boolean;
  login: (password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Two access levels, no user accounts: everyone with the link can view
// everything; editing requires the one shared admin password. Once entered
// correctly it's remembered in sessionStorage (cleared when the browser tab
// closes) and sent back as a header on every edit/add/delete request — see
// lib/api.ts and backend/src/middleware/requireAdminPassword.ts.
export const ADMIN_PASSWORD_STORAGE_KEY = 'admin-password';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) !== null);

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

  return <AuthContext.Provider value={{ isAdmin, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
