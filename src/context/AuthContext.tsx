/**
 * NagarSetu – Authentication Context
 *
 * Provides the authenticated user and auth actions to the entire app.
 * Sessions are verified by the backend on every page load.
 * The client NEVER trusts locally stored roles – the role always comes from the server.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient, AuthUser } from '../services/apiClient';

export type { AuthUser };

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: AuthUser | null;
  status: AuthStatus;
  /** Server is unreachable (backend not running) */
  backendOffline: boolean;
  login: (email: string, password: string, portal: AuthUser['role']) => Promise<{ error?: string }>;
  register: (data: { email: string; password: string; name: string; consent: boolean }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  /** Refresh user from server (e.g. after profile update) */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [backendOffline, setBackendOffline] = useState(false);

  const restoreSession = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await apiClient.getMe();
      if (result.data?.user) {
        setUser(result.data.user);
        setStatus('authenticated');
        setBackendOffline(false);
      } else {
        // 401 or 403 – not logged in, or account inactive
        setUser(null);
        setStatus('unauthenticated');
        setBackendOffline(false);
      }
    } catch {
      // Network failure – backend likely not running
      setUser(null);
      setStatus('unauthenticated');
      setBackendOffline(true);
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (
    email: string,
    password: string,
    portal: AuthUser['role']
  ): Promise<{ error?: string }> => {
    const result = await apiClient.login(email, password, portal);
    if (result.error) return { error: result.error };
    if (result.data?.user) {
      setUser(result.data.user);
      setStatus('authenticated');
      return {};
    }
    return { error: 'Unexpected response from server.' };
  }, []);

  const register = useCallback(async (data: {
    email: string;
    password: string;
    name: string;
    consent: boolean;
  }): Promise<{ error?: string }> => {
    const result = await apiClient.register(data);
    if (result.error) return { error: result.error };
    if (result.data?.user) {
      setUser(result.data.user);
      setStatus('authenticated');
      return {};
    }
    return { error: 'Unexpected response from server.' };
  }, []);

  const logout = useCallback(async () => {
    await apiClient.logout();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const refreshUser = useCallback(async () => {
    const result = await apiClient.getMe();
    if (result.data?.user) {
      setUser(result.data.user);
      setStatus('authenticated');
    } else if (result.status === 401 || result.status === 403) {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, backendOffline, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
