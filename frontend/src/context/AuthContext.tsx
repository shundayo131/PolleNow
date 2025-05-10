import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '../types/auth';
import api from '../services/api';

// Set up the AuthContext with default values 
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

// Create the AuthContext with default values 
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a hook to use the AuthContext 
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

/**
 * AuthProvider component to wrap the entire App and provide authentication context
 * It manages authetication state and provides authentication functions to all child components. 
 *   
 * @Param {ReactNode} children - The child components to be wrapped by the AuthProvider
 * @returns {JSX.Element} - The AuthProvider component with AuthContext 
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State to hold user data and loading state 
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on initial load
  useEffect(() => {
    // Funuction to check authentication status 
    const checkAuth = async () => {
      try {
        // Get userID and accessToken from local storage 
        const userId = localStorage.getItem('userId');
        const accessToken = localStorage.getItem('accessToken');
        
        if (userId && accessToken) {
          /**
           * For now, we are not calling the backend to verify the token.
           */
          
          // Populate user state with data retrieved from local storage
          setUser({
            _id: userId,
            email: localStorage.getItem('userEmail') || '',
            name: localStorage.getItem('userName') || '',
            createdAt: localStorage.getItem('userCreatedAt') || '',
            updatedAt: localStorage.getItem('userUpdatedAt') || ''
          });
        }
      } catch (error) {
        // Clear storage if there was an error 
        console.error('Auth check error:', error);
        localStorage.clear();
      } finally {
        // Set loading to false after checking auth status 
        setLoading(false);
      }
    };
    
    // Call the checkAuth function to veriify login status 
    checkAuth();
  }, []);

  /**
   * login function to authenticate user
   * @param credentials User credentials for login
   */
  const login = async (credentials: LoginCredentials) => {
    // Call the backend login endpoint with user credentials 
    // Destructure the response to get user data and tokens 
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
    
    // Set user state with the retrieved user data 
    setUser(user);
  };

  /**
   * register function to create a new user
   * @param credentials User credentials for registration
   */
  const register = async (credentials: RegisterCredentials) => {
    // Call the backend register endpoint with user credentials 
    // Destructure the response to get user data and tokens  
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
    
    // Set user state with the retrieved user data 
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

  // Provide the authentication context to child components
  // AuthProvider wraps the entire App and provides authentication context
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