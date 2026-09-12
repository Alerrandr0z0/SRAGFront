import type React from 'react';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type UserRole = 'USER' | 'ADMIN';

interface User {
  fullName: string;
  cpf: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  updateSession: (userData: User, accessToken?: string) => void;
  logout: () => void;
  refreshTokens: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const navigate = useNavigate();

  const baseApiUrl = import.meta.env.REACT_APP_API_URL || '/api';

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    try {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('token', refreshToken);
      localStorage.setItem('userName', userData.fullName);
      localStorage.setItem('userCpf', userData.cpf);
      localStorage.setItem('userRole', userData.role);

      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error during login:', error);
      throw new Error('Failed to save authentication data');
    }
  };

  const clearAuth = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userCpf');
    localStorage.removeItem('userRole');
    localStorage.removeItem('yearSelected');
    localStorage.removeItem('dashboardScopeSelected');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('token');
      const userName = localStorage.getItem('userName');
      const userRole = parseRole(localStorage.getItem('userRole'));

      if (accessToken && refreshToken && userName) {
        setUser({
          fullName: userName,
          cpf: localStorage.getItem('userCpf') || '',
          role: userRole,
        });
        setIsAuthenticated(true);
      } else {
        clearAuth();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  const logout = () => {
    try {
      clearAuth();
      // Navigate to login page using React Router
      navigate('/auth/login', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: force page reload
      window.location.href = '/auth/login';
    }
  };

  const updateSession = (userData: User, accessToken?: string) => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }

    localStorage.setItem('userName', userData.fullName);
    localStorage.setItem('userCpf', userData.cpf);
    localStorage.setItem('userRole', userData.role);
    setUser(userData);
    setIsAuthenticated(true);
  };

  function storeRefreshedSession(data: {
    jwtToken?: string;
    refreshToken?: string;
    fullName?: string;
    cpf?: string;
    role?: string;
  }): boolean {
    if (!data.jwtToken) return false;

    localStorage.setItem('accessToken', data.jwtToken);

    if (data.refreshToken) {
      localStorage.setItem('token', data.refreshToken);
    }

    if (data.fullName) {
      localStorage.setItem('userName', data.fullName);
    }

    if (data.cpf) {
      localStorage.setItem('userCpf', data.cpf);
    }

    if (data.role) {
      localStorage.setItem('userRole', parseRole(data.role));
    }

    return true;
  }

  const refreshTokens = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('token');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${baseApiUrl}/auth/refreshToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();

      if (!storeRefreshedSession(data)) {
        throw new Error('Invalid response from token refresh');
      }

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);

      setTimeout(() => {
        logout();
      }, 100);

      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isAdmin: user?.role === 'ADMIN',
    isLoading,
    login,
    updateSession,
    logout,
    refreshTokens,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

function parseRole(role: string | null | undefined): UserRole {
  return role === 'ADMIN' ? 'ADMIN' : 'USER';
}
