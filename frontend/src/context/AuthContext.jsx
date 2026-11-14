import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, loginUser, registerUser, updateUserProfile } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('smartfin_user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('smartfin_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem('smartfin_token');
    localStorage.removeItem('smartfin_user');
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  // Verify and hydrate token on initial app load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('smartfin_token');
      if (storedToken) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
          setToken(storedToken);
          localStorage.setItem('smartfin_user', JSON.stringify(userData));
        } catch (err) {
          console.warn('Session verification failed, logging out:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen for 401 interceptor trigger
    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener('smartfin_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('smartfin_auth_expired', handleAuthExpired);
  }, [logout]);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await loginUser({ email, password });
      localStorage.setItem('smartfin_token', data.access_token);
      localStorage.setItem('smartfin_user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const data = await registerUser(userData);
      localStorage.setItem('smartfin_token', data.access_token);
      localStorage.setItem('smartfin_user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const updatedUser = await updateUserProfile(profileData);
      setUser(updatedUser);
      localStorage.setItem('smartfin_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
