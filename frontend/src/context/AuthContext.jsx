import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, apiCall } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if token exists on load
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('student_portal_token');
      if (token) {
        try {
          // Fetch current user details
          const userData = await apiCall('/auth/me');
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user session', error);
          // Token expired or invalid
          localStorage.removeItem('student_portal_token');
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await loginUser(username, password);
      localStorage.setItem('student_portal_token', data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await registerUser(userData);
      localStorage.setItem('student_portal_token', data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('student_portal_token');
    setUser(null);
  };

  const updateProfile = (updatedUserData) => {
    setUser(updatedUserData);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile
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
