import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export type SidebarMode = 'MAIN' | 'SETTINGS';

interface SidebarContextType {
  mode: SidebarMode;
  setMode: (mode: SidebarMode) => void;
  userOverride: boolean;
  setUserOverride: (override: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [mode, setMode] = useState<SidebarMode>('MAIN');
  const [userOverride, setUserOverride] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved ? JSON.parse(saved) : false;
    } catch (e) {
      console.error("Failed to parse sidebar collapsed state", e);
      return false;
    }
  });

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Hybrid Control: Derive mode from route while allowing manual override
  useEffect(() => {
    const isAccountRoute = location.pathname.startsWith('/account');
    
    // Reset override when navigating to a completely different module
    if (!isAccountRoute && userOverride) {
      setUserOverride(false);
    }

    if (!userOverride) {
      const targetMode = isAccountRoute ? 'SETTINGS' : 'MAIN';
      if (mode !== targetMode) {
        setMode(targetMode);
      }
    }
  }, [location.pathname, userOverride, mode]);

  const handleSetMode = useCallback((m: SidebarMode) => setMode(m), []);
  const handleSetUserOverride = useCallback((o: boolean) => setUserOverride(o), []);
  const handleSetIsCollapsed = useCallback((c: boolean) => setIsCollapsed(c), []);
  const toggleMobile = useCallback(() => setIsMobileOpen(prev => !prev), []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const value = useMemo(() => ({ 
    mode, 
    setMode: handleSetMode, 
    userOverride, 
    setUserOverride: handleSetUserOverride, 
    isCollapsed, 
    setIsCollapsed: handleSetIsCollapsed,
    isMobileOpen,
    setIsMobileOpen,
    toggleMobile
  }), [mode, userOverride, isCollapsed, isMobileOpen, handleSetMode, handleSetUserOverride, handleSetIsCollapsed, toggleMobile]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
