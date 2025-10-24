import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface AccessibilityEnhancementsProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Accessibility Enhancements Component
 * Implements WCAG 2.1 AA+ compliance features:
 * - Skip links for keyboard navigation
 * - Live regions for dynamic content updates
 * - Enhanced focus management
 * - Screen reader announcements
 */
export const AccessibilityEnhancements: React.FC<AccessibilityEnhancementsProps> = ({
  children,
  className
}) => {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [focusVisible, setFocusVisible] = useState(false);

  // Enhanced focus management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Live region announcements
  const announce = (message: string) => {
    setAnnouncements(prev => [...prev, message]);
    // Clear announcements after 5 seconds
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1));
    }, 5000);
  };

  // Skip link handler
  const handleSkipToMain = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSkipToNavigation = () => {
    const navigation = document.getElementById('main-navigation');
    if (navigation) {
      navigation.focus();
      navigation.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={cn('accessibility-enhanced', className)}>
      {/* Skip Links - Hidden until focused */}
      <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-0 focus-within:left-0 focus-within:z-50 focus-within:bg-primary focus-within:text-primary-foreground focus-within:p-2 focus-within:rounded-br-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkipToMain}
          className="focus:bg-primary-foreground focus:text-primary mr-2"
        >
          {t('accessibility.skipToMain', 'Skip to main content')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkipToNavigation}
          className="focus:bg-primary-foreground focus:text-primary"
        >
          {t('accessibility.skipToNavigation', 'Skip to navigation')}
        </Button>
      </div>

      {/* Live Region for Dynamic Announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>

      {/* Assertive Live Region for Important Updates */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
        id="urgent-announcements"
      />

      {/* Enhanced Focus Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .accessibility-enhanced {
            --focus-ring: 2px solid hsl(var(--primary));
            --focus-ring-offset: 2px;
          }
          
          .accessibility-enhanced *:focus-visible {
            outline: var(--focus-ring);
            outline-offset: var(--focus-ring-offset);
            border-radius: 4px;
          }
          
          .accessibility-enhanced button:focus-visible,
          .accessibility-enhanced a:focus-visible,
          .accessibility-enhanced input:focus-visible,
          .accessibility-enhanced select:focus-visible,
          .accessibility-enhanced textarea:focus-visible {
            box-shadow: 0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--primary));
          }
          
          /* High contrast mode support */
          @media (prefers-contrast: high) {
            .accessibility-enhanced {
              --focus-ring: 3px solid currentColor;
            }
          }
          
          /* Reduced motion support */
          @media (prefers-reduced-motion: reduce) {
            .accessibility-enhanced * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `
      }} />

      {/* Main Content */}
      {children}
    </div>
  );
};

/**
 * Accessibility Hook for announcing dynamic content changes
 */
export const useAccessibilityAnnouncements = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.querySelector(
      priority === 'assertive' ? '#urgent-announcements' : '[aria-live="polite"]'
    );
    
    if (liveRegion) {
      liveRegion.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  };

  const announceNavigation = (pageName: string) => {
    announce(`Navigated to ${pageName}`, 'polite');
  };

  const announceError = (errorMessage: string) => {
    announce(`Error: ${errorMessage}`, 'assertive');
  };

  const announceSuccess = (successMessage: string) => {
    announce(`Success: ${successMessage}`, 'polite');
  };

  const announceLoading = (loadingMessage: string) => {
    announce(`Loading: ${loadingMessage}`, 'polite');
  };

  return {
    announce,
    announceNavigation,
    announceError,
    announceSuccess,
    announceLoading
  };
};

/**
 * Enhanced Focus Trap Component for Modals
 */
interface FocusTrapProps {
  children: React.ReactNode;
  active: boolean;
  onEscape?: () => void;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ 
  children, 
  active, 
  onEscape 
}) => {
  const trapRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const trap = trapRef.current;
    if (!trap) return;

    // Get all focusable elements
    const focusableElements = trap.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, onEscape]);

  return (
    <div ref={trapRef} className="focus-trap">
      {children}
    </div>
  );
};

export default AccessibilityEnhancements; 