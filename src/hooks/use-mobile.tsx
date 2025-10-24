import * as React from 'react';

// Mobile-first breakpoints (Tailwind CSS defaults)
const MOBILE_BREAKPOINT = 640; // sm
const TABLET_BREAKPOINT = 1024; // lg

export interface MobileInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  deviceType: 'mobile' | 'tablet' | 'desktop';
  touchSupported: boolean;
  hasNotch: boolean;
  // Performance optimizations for mobile
  shouldOptimize: boolean;
  maxTimeout: number;
  preferReducedData: boolean;
}

/**
 * Hook for mobile device detection and optimization
 * Provides mobile-specific performance settings
 */
export function useMobileInfo(): MobileInfo {
  const [mobileInfo, setMobileInfo] = React.useState<MobileInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1920,
        screenHeight: 1080,
        orientation: 'landscape',
        deviceType: 'desktop',
        touchSupported: false,
        hasNotch: false,
        shouldOptimize: false,
        maxTimeout: 30000,
        preferReducedData: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < MOBILE_BREAKPOINT;
    const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
    const isDesktop = width >= TABLET_BREAKPOINT;
    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasNotch = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('padding: max(0px)') && 
                     (CSS.supports('padding-top: env(safe-area-inset-top)') ||
                      CSS.supports('padding-top: constant(safe-area-inset-top)'));

    // Detect slow connections or low-end devices
    const connection = (navigator as any).connection;
    const isSlowConnection = connection && (
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g' ||
      connection.effectiveType === '3g' ||
      connection.downlink < 1.5
    );
    
    // Performance optimization settings for mobile
    const shouldOptimize = isMobile || isSlowConnection;
    const maxTimeout = shouldOptimize ? 20000 : 30000; // Longer timeout for mobile
    const preferReducedData = shouldOptimize || connection?.saveData;

    return {
      isMobile,
      isTablet,
      isDesktop,
      screenWidth: width,
      screenHeight: height,
      orientation: width > height ? 'landscape' : 'portrait',
      deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      touchSupported,
      hasNotch,
      shouldOptimize,
      maxTimeout,
      preferReducedData,
    };
  });

  React.useEffect(() => {
    const updateMobileInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < MOBILE_BREAKPOINT;
      const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
      const isDesktop = width >= TABLET_BREAKPOINT;
      const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hasNotch = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('padding: max(0px)') && 
                       (CSS.supports('padding-top: env(safe-area-inset-top)') ||
                        CSS.supports('padding-top: constant(safe-area-inset-top)'));

      // Performance optimization detection
      const connection = (navigator as any).connection;
      const isSlowConnection = connection && (
        connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g' ||
        connection.effectiveType === '3g' ||
        connection.downlink < 1.5
      );
      
      const shouldOptimize = isMobile || isSlowConnection;
      const maxTimeout = shouldOptimize ? 20000 : 30000;
      const preferReducedData = shouldOptimize || connection?.saveData;

      setMobileInfo({
        isMobile,
        isTablet,
        isDesktop,
        screenWidth: width,
        screenHeight: height,
        orientation: width > height ? 'landscape' : 'portrait',
        deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        touchSupported,
        hasNotch,
        shouldOptimize,
        maxTimeout,
        preferReducedData,
      });
    };

    const resizeObserver = new ResizeObserver(updateMobileInfo);
    resizeObserver.observe(document.documentElement);

    const orientationQuery = window.matchMedia('(orientation: portrait)');
    orientationQuery.addEventListener('change', updateMobileInfo);

    return () => {
      resizeObserver.disconnect();
      orientationQuery.removeEventListener('change', updateMobileInfo);
    };
  }, []);

  return mobileInfo;
}

/**
 * Hook for mobile-optimized loading strategies
 */
export function useMobileLoading() {
  const { shouldOptimize, maxTimeout, preferReducedData } = useMobileInfo();
  
  return React.useMemo(() => ({
    // Loading timeouts optimized for mobile
    pageTimeout: shouldOptimize ? 20000 : 15000,
    apiTimeout: shouldOptimize ? 15000 : 10000,
    imageTimeout: shouldOptimize ? 10000 : 5000,
    
    // Loading strategies
    waitStrategy: shouldOptimize ? 'domcontentloaded' : 'networkidle',
    retryCount: shouldOptimize ? 3 : 2,
    
    // Data optimization
    preferReducedData,
    chunkSize: shouldOptimize ? 10 : 50,
    
    // Fallback options
    enableFallbacks: shouldOptimize,
    showLoadingStates: true,
  }), [shouldOptimize, maxTimeout, preferReducedData]);
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useDeviceOrientation() {
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>(() => {
    if (typeof window === 'undefined') return 'landscape';
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  });

  React.useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
}

export function useTouchDevice() {
  const [touchSupported, setTouchSupported] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  React.useEffect(() => {
    setTouchSupported('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return touchSupported;
}
