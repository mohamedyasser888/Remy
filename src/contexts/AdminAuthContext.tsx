/**
 * Admin Auth Context
 * Simple hardcoded admin authentication — no Supabase needed.
 * Username: remyadmin  |  Password: remyadmin
 */

import { createContext, useContext, useState, type ReactNode } from 'react';

const ADMIN_USERNAME = 'remyadmin';
const ADMIN_PASSWORD = 'remyadmin';
const STORAGE_KEY    = 'remy_admin_session';

interface AdminAuthContextValue {
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  });

  const login = (username: string, password: string): boolean => {
    // Accept both "remyadmin" or "remyadmin@remy.app" as the username/email
    const normalised = username.trim().toLowerCase().replace('@remy.app', '');
    if (normalised === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsAdmin(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
