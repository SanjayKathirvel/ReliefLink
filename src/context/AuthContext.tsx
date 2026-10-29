import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { apiRequest } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (payload: any) => Promise<{ success: boolean; error?: string }>;
  switchRole: (role: 'CITIZEN' | 'VOLUNTEER' | 'GOVERNMENT' | 'ADMIN') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const DEMO_CREDENTIALS: Record<string, { email: string; pass: string }> = {
  CITIZEN: { email: 'citizen@relieflink.org', pass: 'Citizen@123' },
  VOLUNTEER: { email: 'volunteer@relieflink.org', pass: 'Vol@123' },
  GOVERNMENT: { email: 'gov@relieflink.org', pass: 'Gov@123' },
  ADMIN: { email: 'admin@relieflink.org', pass: 'Admin@123' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('relieflink_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = async (email: string, pass: string) => {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });

    if (res.success && res.data?.token) {
      localStorage.setItem('relieflink_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    }

    return { success: false, error: res.error?.message || 'Login failed' };
  };

  const switchRole = async (role: 'CITIZEN' | 'VOLUNTEER' | 'GOVERNMENT' | 'ADMIN') => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      setIsLoading(true);
      await login(creds.email, creds.pass);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('relieflink_token');
    if (!storedToken) {
      // Auto-initialize with Citizen account so user immediately sees live features
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'citizen@relieflink.org', password: 'Citizen@123' }),
      });
      if (res.success && res.data?.token) {
        localStorage.setItem('relieflink_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      }
      setIsLoading(false);
      return;
    }

    const res = await apiRequest('/api/auth/me');
    if (res.success && res.data?.user) {
      setUser(res.data.user);
    } else {
      // If token expired, fall back to demo session
      const fallback = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'citizen@relieflink.org', password: 'Citizen@123' }),
      });
      if (fallback.success && fallback.data?.token) {
        localStorage.setItem('relieflink_token', fallback.data.token);
        setToken(fallback.data.token);
        setUser(fallback.data.user);
      } else {
        localStorage.removeItem('relieflink_token');
        setUser(null);
        setToken(null);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const register = async (payload: any) => {
    const res = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success && res.data?.token) {
      localStorage.setItem('relieflink_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    }

    return { success: false, error: res.error?.message || 'Registration failed' };
  };

  const logout = () => {
    localStorage.removeItem('relieflink_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, switchRole, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
