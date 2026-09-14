import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken } from '../api/client.js';

const AuthContext = createContext(null);

/**
 * Auth state provider.
 * Manages user state, login, register, logout, and token refresh.
 * Access token lives in memory only; refresh token is HttpOnly cookie.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Attempt to restore session from refresh token cookie on mount.
   */
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const data = await api.post('/auth/refresh', {}, { skipAuth: true });
        if (!cancelled && data?.data?.accessToken) {
          setAccessToken(data.data.accessToken);
          setUser(data.data.user);
        }
      } catch {
        // No valid session — that's fine
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    const data = await api.post('/auth/login', { email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data;
  }, []);

  const register = useCallback(async (payload) => {
    setError(null);
    const data = await api.post('/auth/register', payload);
    return data.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Logout endpoint may fail if token is already expired
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      setUser(data.data.user);
      return data.data.user;
    } catch {
      setAccessToken(null);
      setUser(null);
      return null;
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator' || user?.role === 'admin',
    login,
    register,
    logout,
    refreshUser,
    setUser,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context.
 * @returns {ReturnType<typeof AuthProvider>['value']}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
