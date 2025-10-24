import React, { useEffect } from 'react';

interface LightModeWrapperProps {
  children: React.ReactNode;
}

/**
 * LightModeWrapper - Forces light mode on specific pages
 * 
 * This component temporarily overrides the global theme to force light mode
 * on pages like Landing and Login, while preserving the original theme
 * for when the user navigates away from these pages.
 */
export const LightModeWrapper: React.FC<LightModeWrapperProps> = ({ children }) => {
  useEffect(() => {
    // Store the original theme classes
    const root = document.documentElement;
    const originalClasses = Array.from(root.classList);
    
    // Force light mode by removing dark class and adding light class
    root.classList.remove('dark', 'system');
    root.classList.add('light');
    
    // Also force light mode on body for additional styling
    document.body.classList.remove('dark');
    document.body.classList.add('light');
    
    // Cleanup function to restore original theme when component unmounts
    return () => {
      // Remove the forced light class from both elements
      root.classList.remove('light');
      document.body.classList.remove('light');
      
      // Small delay to ensure theme restoration happens after navigation
      setTimeout(() => {
        // Restore original theme based on user preference
        const storedTheme = localStorage.getItem('crm-demo-theme');
        if (storedTheme === 'dark') {
          root.classList.add('dark');
          document.body.classList.add('dark');
        } else if (storedTheme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          root.classList.add(systemTheme);
          document.body.classList.add(systemTheme);
        } else {
          // Default to light if no preference or light preference
          root.classList.add('light');
          document.body.classList.add('light');
        }
      }, 100);
    };
  }, []);

  return <>{children}</>;
}; 