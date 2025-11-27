'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '@/services/api';
import { startHeartbeat, stopHeartbeat } from '@/services/heartbeat';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from localStorage synchronously to avoid setting state inside effects.
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const t = localStorage.getItem('token');
    if (!t) return null;
    try {
      const decoded = jwtDecode(t) as { exp?: number };
      if (!decoded.exp || decoded.exp * 1000 > Date.now()) return t;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const s = localStorage.getItem('user');
    if (s) {
      try {
        return JSON.parse(s) as User;
      } catch {
        return null;
      }
    }
    // Try to derive from token if possible
    const t = localStorage.getItem('token');
    if (t) {
      try {
        const decoded = jwtDecode(t) as { id?: string; role?: User['role'] };
        if (decoded.id && decoded.role) return { id: decoded.id, name: '', email: '', role: decoded.role };
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, _setLoading] = useState(false);

  useEffect(() => {
    // Apply Authorization header if token exists
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Start background heartbeat to keep frontend/backend communication alive
    startHeartbeat(30000);
    return () => stopHeartbeat();
  }, [token]);

  const login = (loggedInUser: User, newToken: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setToken(newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
