import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from '@/components/theme-provider';

interface AdminThemeContextType {
  adminTheme: 'light' | 'dark' | 'auto';
  setAdminTheme: (theme: 'light' | 'dark' | 'auto') => void;
  resolvedTheme: 'light' | 'dark';
  adminColors: {
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
    border: string;
    background: string;
    foreground: string;
    card: string;
    popover: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (context === undefined) {
    throw new Error('useAdminTheme must be used within an AdminThemeProvider');
  }
  return context;
}

interface AdminThemeProviderProps {
  children: React.ReactNode;
}

export function AdminThemeProvider({ children }: AdminThemeProviderProps) {
  const { theme: globalTheme } = useTheme();
  const [adminTheme, setAdminTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedAdminTheme = localStorage.getItem('admin-theme') as 'light' | 'dark' | 'auto' | null;
    if (savedAdminTheme) {
      setAdminTheme(savedAdminTheme);
    }
  }, []);

  useEffect(() => {
    if (adminTheme === 'auto') {
      setResolvedTheme(globalTheme as 'light' | 'dark');
    } else {
      setResolvedTheme(adminTheme);
    }
  }, [adminTheme, globalTheme]);

  useEffect(() => {
    localStorage.setItem('admin-theme', adminTheme);
  }, [adminTheme]);

  // Admin-specific color schemes
  const adminColors = {
    light: {
      primary: 'hsl(221.2 83.2% 53.3%)', // Blue
      secondary: 'hsl(210 40% 96%)', // Light gray
      accent: 'hsl(142.1 76.2% 36.3%)', // Green
      muted: 'hsl(210 40% 98%)',
      border: 'hsl(214.3 31.8% 91.4%)',
      background: 'hsl(0 0% 100%)',
      foreground: 'hsl(222.2 84% 4.9%)',
      card: 'hsl(0 0% 100%)',
      popover: 'hsl(0 0% 100%)',
      success: 'hsl(142.1 76.2% 36.3%)',
      warning: 'hsl(47.9 95.8% 53.1%)',
      error: 'hsl(0 84.2% 60.2%)',
      info: 'hsl(204 94% 94%)'
    },
    dark: {
      primary: 'hsl(217.2 91.2% 59.8%)', // Brighter blue for dark mode
      secondary: 'hsl(217.2 32.6% 17.5%)', // Dark gray
      accent: 'hsl(142.1 70.6% 45.3%)', // Brighter green
      muted: 'hsl(217.2 32.6% 17.5%)',
      border: 'hsl(217.2 32.6% 17.5%)',
      background: 'hsl(222.2 84% 4.9%)', // Very dark
      foreground: 'hsl(210 40% 98%)', // Almost white
      card: 'hsl(222.2 84% 4.9%)',
      popover: 'hsl(222.2 84% 4.9%)',
      success: 'hsl(142.1 70.6% 45.3%)',
      warning: 'hsl(47.9 95.8% 53.1%)',
      error: 'hsl(0 62.8% 30.6%)',
      info: 'hsl(215.4 16.3% 46.9%)'
    }
  };

  const contextValue: AdminThemeContextType = {
    adminTheme,
    setAdminTheme,
    resolvedTheme,
    adminColors: adminColors[resolvedTheme]
  };

  return (
    <AdminThemeContext.Provider value={contextValue}>
      <div 
        className={`admin-theme-${resolvedTheme}`}
        style={{
          '--admin-primary': adminColors[resolvedTheme].primary,
          '--admin-secondary': adminColors[resolvedTheme].secondary,
          '--admin-accent': adminColors[resolvedTheme].accent,
          '--admin-muted': adminColors[resolvedTheme].muted,
          '--admin-border': adminColors[resolvedTheme].border,
          '--admin-background': adminColors[resolvedTheme].background,
          '--admin-foreground': adminColors[resolvedTheme].foreground,
          '--admin-card': adminColors[resolvedTheme].card,
          '--admin-popover': adminColors[resolvedTheme].popover,
          '--admin-success': adminColors[resolvedTheme].success,
          '--admin-warning': adminColors[resolvedTheme].warning,
          '--admin-error': adminColors[resolvedTheme].error,
          '--admin-info': adminColors[resolvedTheme].info,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
} 