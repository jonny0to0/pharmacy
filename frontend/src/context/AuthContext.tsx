import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../api/axios';

interface User {
  id: string;
  name: string;
  roles: string[];
  permissions: string[];
  email: string;
  mobile: string;
  businessName: string;
  tenantId: string | null;
  isSetupCompleted: boolean;
  businessType: 'PHARMACY' | 'HOSPITAL' | 'WHOLESALER' | 'RETAILER' | 'DISTRIBUTOR' | 'MEDICAL_STORE' | null;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
  updateSetupStatus: (status: boolean, businessType?: User['businessType']) => void;
  setUser: (user: User | null) => void;
  isSuperAdmin: boolean;
  isBusinessAdmin: boolean;
  isImpersonating: boolean;
  startImpersonation: (token: string) => void;
  stopImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');
        const impersonationActive = localStorage.getItem('originalToken') !== null;

        if (storedToken && storedUser) {
          setToken(storedToken);
          setIsImpersonating(impersonationActive);
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            localStorage.removeItem('user');
          }
          setIsLoading(false);
          return;
        }

        const isAuthPage = 
          window.location.pathname.includes('/login') || 
          window.location.pathname.includes('/register') ||
          window.location.pathname.includes('/setup-account');
        
        if (isAuthPage) {
          setIsLoading(false);
          return;
        }

        const { data } = await api.post('/auth/refresh');
        setToken(data.accessToken);
        setUser(data.user);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch (err) {
        // No session found
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('accessToken', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error("Logout failed", err);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('originalToken');
    setToken(null);
    setUser(null);
    setIsImpersonating(false);
  }, []);

  const startImpersonation = useCallback((newToken: string) => {
    const currentToken = localStorage.getItem('accessToken');
    if (currentToken) {
      sessionStorage.setItem('originalToken', currentToken);
    }
    localStorage.setItem('accessToken', newToken);
    localStorage.removeItem('user'); // Force profile refresh on reload
    setToken(newToken);
    setUser(null);
    setIsImpersonating(true);
    // Reload to re-fetch business context with new token
    window.location.href = '/dashboard';
  }, []);

  const stopImpersonation = useCallback(async () => {
    const originalToken = sessionStorage.getItem('originalToken');
    if (originalToken) {
      try {
        // Formally log the exit in the backend ledger
        await api.post('/admin/impersonate/stop', {}, { baseURL: '/api/v1' });
      } catch (err) {
        console.warn("Audit stop failed, but restoring identity locally", err);
      }

      localStorage.setItem('accessToken', originalToken);
      sessionStorage.removeItem('originalToken');
      localStorage.removeItem('user'); // Force profile refresh
      setToken(originalToken);
      setUser(null);
      setIsImpersonating(false);
      window.location.href = '/admin/subscriptions'; // Go back to admin context
    }
  }, []);

  const handleSetUser = useCallback((newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  const updateSetupStatus = useCallback((status: boolean, businessType?: User['businessType']) => {
    setUser(prev => {
      if (!prev) return null;
      const updatedUser = { ...prev, isSetupCompleted: status };
      if (businessType) {
        updatedUser.businessType = businessType;
      }
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const isSuperAdmin = useMemo(() => Array.isArray(user?.roles) && user.roles.includes('SUPER_ADMIN'), [user]);
  const isBusinessAdmin = useMemo(() => Array.isArray(user?.roles) && user.roles.includes('BUSINESS_ADMIN'), [user]);

  const contextValue = useMemo(() => ({ 
    user, 
    token, 
    login, 
    logout, 
    isLoading, 
    updateSetupStatus, 
    setUser: handleSetUser,
    isSuperAdmin, 
    isBusinessAdmin,
    isImpersonating,
    startImpersonation,
    stopImpersonation
  }), [user, token, login, logout, isLoading, updateSetupStatus, handleSetUser, isSuperAdmin, isBusinessAdmin, isImpersonating, startImpersonation, stopImpersonation]);

  return (
    <AuthContext.Provider value={contextValue}>
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
