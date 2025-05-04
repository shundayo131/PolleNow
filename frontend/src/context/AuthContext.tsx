import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '../types/auth';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const accessToken = localStorage.getItem('accessToken');
        
        if (userId && accessToken) {
          // For now, we'll use stored data to create user object
          // In a real app, you might want to fetch the user profile
          setUser({
            _id: userId,
            email: localStorage.getItem('userEmail') || '',
            name: localStorage.getItem('userName') || '',
            createdAt: localStorage.getItem('userCreatedAt') || '',
            updatedAt: localStorage.getItem('userUpdatedAt') || ''
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Clear storage if there was an error
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    const { user, accessToken, refreshToken } = response.data;
    
    // Store tokens and user data in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('userId', user._id);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userCreatedAt', user.createdAt);
    localStorage.setItem('userUpdatedAt', user.updatedAt);
    
    setUser(user);
  };

  const register = async (credentials: RegisterCredentials) => {
    const response = await api.post('/auth/register', credentials);
    const { user, accessToken, refreshToken } = response.data;
    
    // Store tokens and user data in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('userId', user._id);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userCreatedAt', user.createdAt);
    localStorage.setItem('userUpdatedAt', user.updatedAt);
    
    setUser(user);
  };

  const logout = async () => {
    try {
      // Get the token
      const token = localStorage.getItem('accessToken');
      
      // Only call backend if we have a token
      if (token) {
        // Call backend logout endpoint with proper headers
        await api.post('/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage and state regardless of API call success
      localStorage.clear();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};