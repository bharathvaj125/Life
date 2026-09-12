import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getCharacter();
      setUser(data.user);
    } catch (err) {
      console.warn('Auth token expired or invalid:', err);
      api.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [checkAuth]);

  const login = async (emailOrUsername, password) => {
    setError(null);
    try {
      const data = await api.login({ emailOrUsername, password });
      api.setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message || 'Login failed.');
      throw err;
    }
  };

  const signup = async (username, email, password) => {
    setError(null);
    try {
      const data = await api.signup({ username, email, password });
      api.setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message || 'Registration failed.');
      throw err;
    }
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, error, login, signup, logout, refreshAuth: checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
