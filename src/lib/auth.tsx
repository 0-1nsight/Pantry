import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, ApiError } from './api';

export interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null; needsVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get<{ user: User }>('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    try {
      const { token, user: newUser } = await api.post<{ token: string; user: User }>('/auth/signup', { email, password, username });
      localStorage.setItem('token', token);
      setUser(newUser);
      return { error: null, needsVerification: false };
    } catch (e) {
      return { error: e instanceof ApiError ? new Error(e.message) : new Error('Signup failed'), needsVerification: false };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { token, user: newUser } = await api.post<{ token: string; user: User }>('/auth/signin', { email, password });
      localStorage.setItem('token', token);
      setUser(newUser);
      return { error: null };
    } catch (e) {
      return { error: e instanceof ApiError ? new Error(e.message) : new Error('Sign in failed') };
    }
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
