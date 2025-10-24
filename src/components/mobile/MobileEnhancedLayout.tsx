import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { useMobileInfo } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  FileText, 
  Settings, 
  MessageSquare, 
  Users, 
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  Home,
  Phone
} from 'lucide-react';
import { useState } from 'react';

interface MobileEnhancedLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  pageType?: 'dashboard' | 'form' | 'list' | 'detail' | 'settings';
  actions?: ReactNode;
  mobileOptimizations?: {
    enableSwipeGestures?: boolean;
    stickyHeader?: boolean;
    compactMode?: boolean;
    touchOptimized?: boolean;
  };
}

export const MobileEnhancedLayout: React.FC<MobileEnhancedLayoutProps> = ({
  children,
  title,
  showBackButton = false,
  onBack,
  pageType = 'dashboard',
  actions,
  mobileOptimizations = {
    enableSwipeGestures: true,
    stickyHeader: true,
    compactMode: true,
    touchOptimized: true
  }
}) => {
  const { t } = useTranslation(['pages', 'common']);
  const { isRTL } = useLang();
  const { isMobile, isTablet } = useMobileInfo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If not mobile, return children without mobile wrapper
  if (!isMobile && !isTablet) {
    return <div dir={isRTL ? 'rtl' : 'ltr'}>{children}</div>;
  }

  const isCompactMode = mobileOptimizations.compactMode && isMobile;
  const isTouchOptimized = mobileOptimizations.touchOptimized;

  return (
    <div 
      className={cn(
        'min-h-screen bg-background',
        isRTL && 'rtl',
        isTouchOptimized && 'touch-manipulation'
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Mobile Header */}
      {isMobile && (
        <header 
          className={cn(
            'bg-background border-b border-border p-4',
            mobileOptimizations.stickyHeader && 'sticky top-0 z-50 backdrop-blur-sm bg-background/95'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className={cn(
                    'h-8 w-8 p-0',
                    isTouchOptimized && 'min-h-[44px] min-w-[44px]'
                  )}
                >
                  <ChevronLeft className={cn(
                    'h-4 w-4',
                    isRTL && 'rotate-180'
                  )} />
                </Button>
              )}
              
              {!showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(true)}
                  className={cn(
                    'h-8 w-8 p-0',
                    isTouchOptimized && 'min-h-[44px] min-w-[44px]'
                  )}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              
              {title && (
                <h1 className={cn(
                  'font-semibold text-lg',
                  isCompactMode && 'text-base'
                )}>
                  {title}
                </h1>
              )}
            </div>
            
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </header>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <Card className="h-full w-80 max-w-[85vw] shadow-lg">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold">{t('common.navigation.menu', 'Menu')}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'h-8 w-8 p-0',
                    isTouchOptimized && 'min-h-[44px] min-w-[44px]'
                  )}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <ScrollArea className="h-[calc(100vh-80px)]">
                <div className="p-2">
                  <MobileNavigationMenu 
                    onItemClick={() => setMobileMenuOpen(false)}
                    touchOptimized={isTouchOptimized}
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        'flex-1',
        isMobile && 'pb-safe-area-inset-bottom',
        isCompactMode && 'px-3' || 'px-4'
      )}>
        {/* Page Type Specific Optimizations */}
        {pageType === 'form' ? (
          <div className={cn(
            'max-w-md mx-auto',
            isCompactMode && 'py-2' || 'py-4'
          )}>
            <MobileFormWrapper>{children}</MobileFormWrapper>
          </div>
        ) : pageType === 'list' ? (
          <div className={cn(
            isCompactMode && 'py-2' || 'py-4'
          )}>
            <MobileListWrapper>{children}</MobileListWrapper>
          </div>
        ) : (
          <div className={cn(
            isCompactMode && 'py-2' || 'py-4'
          )}>
            {children}
          </div>
        )}
      </main>

      {/* Mobile Bottom Actions (for forms and detail pages) */}
      {isMobile && (pageType === 'form' || pageType === 'detail') && (
        <MobileBottomActions pageType={pageType}>
          {actions}
        </MobileBottomActions>
      )}
    </div>
  );
};

// Mobile Navigation Menu Component
const MobileNavigationMenu: React.FC<{ 
  onItemClick: () => void;
  touchOptimized: boolean;
}> = ({ onItemClick, touchOptimized }) => {
  const { t } = useTranslation(['pages', 'common']);
  
  const navigationItems = [
    { icon: Home, label: t('pages:navigation.dashboard', 'Dashboard'), href: '/dashboard' },
    { icon: Users, label: t('pages:navigation.leads', 'Leads'), href: '/leads' },
    { icon: MessageSquare, label: t('pages:navigation.messages', 'Messages'), href: '/messages' },
    { icon: Calendar, label: t('pages:navigation.calendar', 'Calendar'), href: '/calendar' },
    { icon: BarChart3, label: t('pages:navigation.reports', 'Reports'), href: '/reports' },
    { icon: Settings, label: t('pages:navigation.settings', 'Settings'), href: '/settings' }
  ];

  return (
    <nav className="space-y-1">
      {navigationItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          onClick={onItemClick}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            'focus:bg-accent focus:text-accent-foreground',
            touchOptimized && 'min-h-[44px] py-3'
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </a>
      ))}
      
      <Separator className="my-2" />
      
      <a
        href="tel:+972123456789"
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground text-green-600',
          touchOptimized && 'min-h-[44px] py-3'
        )}
      >
        <Phone className="h-4 w-4" />
        {t('common.actions.callSupport', 'Call Support')}
      </a>
    </nav>
  );
};

// Mobile Form Wrapper for better form experience
const MobileFormWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    // Add mobile form styles
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile form optimizations */
      .mobile-form input, 
      .mobile-form textarea, 
      .mobile-form select {
        font-size: 16px !important; /* Prevent zoom on iOS */
        min-height: 44px; /* Touch-friendly height */
      }
      
      .mobile-form button {
        min-height: 44px; /* Touch-friendly buttons */
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="space-y-4 mobile-form">
      {children}
    </div>
  );
};

// Mobile List Wrapper for better scrolling experience
const MobileListWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    // Add mobile list styles
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile list optimizations */
      .mobile-list-wrapper .mobile-list-item {
        min-height: 64px; /* Comfortable tap target */
        padding: 12px 16px;
        border-radius: 8px;
        transition: background-color 0.2s ease;
      }
      
      .mobile-list-wrapper .mobile-list-item:active {
        background-color: var(--accent);
        transform: scale(0.98);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="space-y-2 mobile-list-wrapper">
      {children}
    </div>
  );
};

// Mobile Bottom Actions for sticky action buttons
const MobileBottomActions: React.FC<{ 
  children: ReactNode;
  pageType: string;
}> = ({ children, pageType }) => {
  const { isRTL } = useLang();
  
  if (!children) return null;

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border',
      'safe-area-inset-bottom backdrop-blur-sm bg-background/95',
      isRTL && 'rtl'
    )} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex gap-2 max-w-md mx-auto">
        {children}
      </div>
    </div>
  );
};

export default MobileEnhancedLayout; 