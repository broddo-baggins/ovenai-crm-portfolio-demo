/**
 * Early RTL Initialization
 * This must run BEFORE React renders any components to prevent layout timing issues
 */

// Safely check localStorage for the saved language preference
const getSavedLanguage = (): string => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('i18nextLng') || 'en';
    }
  } catch (error) {
    console.warn('[Early RTL Init] localStorage access failed:', error);
  }
  return 'en'; // Default fallback
};

const savedLanguage = getSavedLanguage();

// Set document direction immediately based on saved language
export function initializeRTLEarly() {
  try {
    // Only proceed if we have document access
    if (typeof document === 'undefined') {
      console.warn('[Early RTL Init] Document not available, skipping early initialization');
      return;
    }

    const isHebrew = savedLanguage === 'he';
    
    // Set direction IMMEDIATELY
    document.documentElement.dir = isHebrew ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLanguage;
    
    // Function to apply body classes when body is available
    const applyBodyClasses = () => {
      if (document.body) {
        if (isHebrew) {
          document.body.classList.add('font-hebrew');
        } else {
          document.body.classList.remove('font-hebrew');
        }
        return true;
      }
      return false;
    };
    
    // Try to apply body classes immediately
    if (!applyBodyClasses()) {
      // If body not available, wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          applyBodyClasses();
        });
      } else {
        // DOM is already loaded, body should be available soon
        setTimeout(() => {
          applyBodyClasses();
        }, 0);
      }
    }
    
    // Add a data attribute for CSS to detect early initialization
    document.documentElement.setAttribute('data-rtl-initialized', 'true');
    
    // Store the language for other systems to check
    document.documentElement.setAttribute('data-rtl-language', savedLanguage);
    
  } catch (error) {
    // Only log errors in development
    if (import.meta.env.DEV) {
      console.error('[Early RTL Init] Initialization failed:', error);
    }
  }
}

// Run immediately when this module is imported, but safely
if (typeof window !== 'undefined') {
  initializeRTLEarly();
} 