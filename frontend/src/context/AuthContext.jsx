
import {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

import {
  loginUser,
  registerUser,
} from '../services/api';

// Create Context
const AuthContext = createContext(null);

// Safely read stored user details
const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Error reading stored user:', error);
    localStorage.removeItem('user');
    return null;
  }
};

// Auth Provider
export function AuthProvider({ children }) {

  const [token, setToken] = useState(
    () => localStorage.getItem('token')
  );

  const [user, setUser] = useState(getStoredUser);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep token in localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // Keep user details in localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // LOGIN
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await loginUser(credentials);

      const { token: newToken, user: newUser } = response.data;

      if (!newToken || !newUser) {
        throw new Error(
          'Login response did not contain authentication details.'
        );
      }

      // Save authentication details immediately
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return {
        success: true,
        user: newUser,
      };

    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please try again.';

      setError(message);

      return {
        success: false,
        message,
      };

    } finally {
      setLoading(false);
    }
  };

  // REGISTER
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await registerUser(userData);

      const newUser = response.data.user;

      if (newUser) {
        setUser(newUser);
      }

      // Registration endpoint currently does not return a JWT.
      // The user must log in to establish an authenticated session.
      return {
        success: true,
        user: newUser,
      };

    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again.';

      setError(message);

      return {
        success: false,
        message,
      };

    } finally {
      setLoading(false);
    }
  };

  // LOGOUT
  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // CLEAR ERRORS
  const clearError = () => {
    setError(null);
  };

  // Context value
  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isLoggedIn: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside an <AuthProvider>'
    );
  }

  return context;
}

export default AuthContext;
