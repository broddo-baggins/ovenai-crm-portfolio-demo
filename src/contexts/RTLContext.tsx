import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface RTLContextType {
  isRTL: boolean;
  setIsRTL: (isRTL: boolean) => void;
  toggleRTL: () => void;
}

const RTLContext = createContext<RTLContextType | undefined>(undefined);

export function useRTL() {
  const context = useContext(RTLContext);
  if (context === undefined) {
    throw new Error('useRTL must be used within a RTLProvider');
  }
  return context;
}

interface RTLProviderProps {
  children: ReactNode;
  defaultRTL?: boolean;
}

export function RTLProvider({ children, defaultRTL = false }: RTLProviderProps) {
  const [isRTL, setIsRTL] = useState(defaultRTL);
  
  // Safely get i18n, handle case where it might not be available (like in tests)
  let i18n: any = null;
  try {
    const translation = useTranslation();
    i18n = translation.i18n;
  } catch (error) {
    console.warn('WEB RTL Context: i18n not available, using fallback behavior');
  }

  // Handle initial RTL state and update document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.className = document.documentElement.className
        .replace(/\b(rtl|ltr)\b/g, '')
        .trim() + ` ${isRTL ? 'rtl' : 'ltr'}`;
    }
  }, [isRTL]);

  // Sync RTL state with i18n language
  useEffect(() => {
    if (!i18n || !i18n.language) {
      console.log('WEB RTL Context: i18n not available, maintaining current RTL state:', isRTL);
      return;
    }

    const newIsRTL = i18n.language === 'he' || i18n.language === 'ar';
    setIsRTL(newIsRTL);
    
    console.log(`WEB RTL Context: Language changed to ${i18n.language}, RTL: ${newIsRTL}`);
  }, [i18n?.language]);

  const toggleRTL = () => {
    const newIsRTL = !isRTL;
    setIsRTL(newIsRTL);
    
    // Change language when RTL is toggled (if i18n is available)
    if (i18n && i18n.changeLanguage) {
      i18n.changeLanguage(newIsRTL ? 'he' : 'en');
    }
  };

  const value = {
    isRTL,
    setIsRTL,
    toggleRTL,
  };

  // Remove the wrapper div that was causing sidebar positioning conflicts
  return (
    <RTLContext.Provider value={value}>
      {children}
    </RTLContext.Provider>
  );
} 