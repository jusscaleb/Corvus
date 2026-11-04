import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authStorage, apiRequest } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while session is being validated

  // On mount: check if stored tokens are still valid
  useEffect(() => {
    async function checkSession() {
      const { access } = authStorage.getTokens();
      if (!access) {
        setLoading(false);
        return;
      }
      try {
        const profile = await apiRequest('/api/auth/profile/', { requireAuth: true });
        authStorage.setUser(profile);
        setUser(profile);
      } catch {
        // Token invalid/expired — clear session
        authStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const signIn = useCallback((userData) => {
    setUser(userData);
  }, []);

  const signOut = useCallback(() => {
    authStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

