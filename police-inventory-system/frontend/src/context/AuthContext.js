import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Refs to prevent multiple simultaneous operations
  const loginInProgress = useRef(false);
  const logoutInProgress = useRef(false);
  const checkAuthInProgress = useRef(false);
  const initCheckDone = useRef(false);

  // Debounce utility
  const debounce = useCallback((func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  const clearSession = useCallback(debounce(() => {
    console.log('🧹 Clearing session data');
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    loginInProgress.current = false;
    logoutInProgress.current = false;
  }, 200), [debounce]);

  const checkInitialAuth = useCallback(async () => {
    if (checkAuthInProgress.current) {
      console.log('🔄 Auth check already in progress, skipping');
      return;
    }

    checkAuthInProgress.current = true;

    const token = localStorage.getItem('token');
    console.log('🔍 Initial auth check, token exists:', !!token);

    if (token) {
      try {
        // Set default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Validate token by fetching user profile  
        console.log('🔐 Validating token...');
        const response = await api.get('/auth/me');

        if (response.data.success) {
          console.log('✅ Token valid, user authenticated:', response.data.data.user.username);
          setUser(response.data.data.user);
          setIsAuthenticated(true);
        } else {
          console.log('❌ Token invalid, clearing session');
          clearSession();
        }
      } catch (error) {
        console.log('❌ Token validation failed:', error.message);
        clearSession();
      }
    } else {
      console.log('ℹ️ No token found');
    }

    setLoading(false);
    checkAuthInProgress.current = false;
  }, [clearSession]);

  // Check if user is logged in on app start (only once)
  useEffect(() => {
    if (!initCheckDone.current) {
      initCheckDone.current = true;
      checkInitialAuth();
    }
  }, [checkInitialAuth]);

  const login = async (credentials) => {
    if (loginInProgress.current) {
      console.log('🔄 Login already in progress, ignoring');
      return { success: false, message: 'Login already in progress' };
    }

    try {
      loginInProgress.current = true;
      setLoading(true);
      console.log('🔐 Attempting login for:', credentials.username);

      const response = await api.post('/auth/login', credentials);

      if (response.data.success) {
        const { user, token } = response.data.data;

        console.log('✅ Login successful for:', user.username, 'Role:', user.role);

        // Store token in localStorage
        localStorage.setItem('token', token);

        // Set default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Update state
        setUser(user);
        setIsAuthenticated(true);

        toast.success(`Welcome back, ${user.firstName}!`);

        return { success: true, user };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error.message);
      const message = error.response?.data?.message || error.message || 'Login failed';

      // Don't show toast for rate limiting errors (already handled by API)
      if (!message.includes('Too many') && !message.includes('rate limit')) {
        toast.error(message);
      }

      clearSession();
      return { success: false, message };
    } finally {
      setLoading(false);
      loginInProgress.current = false;
    }
  };

  const register = async (userData) => {
    if (loginInProgress.current) {
      console.log('🔄 Registration already in progress, ignoring');
      return { success: false, message: 'Registration already in progress' };
    }

    try {
      loginInProgress.current = true; // Use same flag to prevent simultaneous login/register
      setLoading(true);
      console.log('📝 Attempting registration for:', userData.username);

      const response = await api.post('/auth/register', userData);

      if (response.data.success) {
        const { user, token } = response.data.data;

        console.log('✅ Registration successful for:', user.username, 'Role:', user.role);

        // Store token in localStorage
        localStorage.setItem('token', token);

        // Set default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Update state
        setUser(user);
        setIsAuthenticated(true);

        toast.success(`Account created successfully! Welcome, ${user.firstName}!`);

        return { success: true, user };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error.message);
      const message = error.response?.data?.message || error.message || 'Registration failed';

      // Don't show toast for rate limiting errors (already handled by API)
      if (!message.includes('Too many') && !message.includes('rate limit')) {
        toast.error(message);
      }

      return { success: false, message };
    } finally {
      setLoading(false);
      loginInProgress.current = false;
    }
  };

  const logout = useCallback(debounce(() => {
    if (logoutInProgress.current) {
      console.log('🔄 Logout already in progress, ignoring');
      return;
    }

    logoutInProgress.current = true;

    console.log('🚪 Logging out user:', user?.username);

    // Clear session data immediately
    clearSession();

    // Show success message (debounced)
    toast.info('Logged out successfully');

    // Force redirect to login page with a small delay
    setTimeout(() => {
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      logoutInProgress.current = false;
    }, 500);
  }, 1000), [clearSession, debounce, user]);

  // Handle authentication errors from API interceptor
  useEffect(() => {
    const handleAuthError = debounce(() => {
      if (!logoutInProgress.current && isAuthenticated) {
        console.log('🔄 Handling auth error from API');
        logout();
      }
    }, 500);

    window.addEventListener('auth-error', handleAuthError);

    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, [isAuthenticated, logout, debounce]);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
