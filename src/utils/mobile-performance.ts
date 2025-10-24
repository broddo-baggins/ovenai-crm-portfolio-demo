/**
 * Mobile Performance Optimization Utilities
 * Provides tools for optimizing performance on mobile devices
 */

import React from 'react';

export interface PerformanceSettings {
  reduceAnimations: boolean;
  enableLazyLoading: boolean;
  optimizeImages: boolean;
  limitConcurrentRequests: boolean;
  useDataSaver: boolean;
}

/**
 * Detects if device has performance constraints
 */
export function detectPerformanceConstraints(): PerformanceSettings {
  const isLowEnd = detectLowEndDevice();
  const isSlowConnection = detectSlowConnection();
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasDataSaver = 'connection' in navigator && 
                       (navigator as any).connection?.saveData === true;

  return {
    reduceAnimations: isLowEnd || prefersReducedMotion,
    enableLazyLoading: true,
    optimizeImages: isLowEnd || isSlowConnection,
    limitConcurrentRequests: isLowEnd || isSlowConnection,
    useDataSaver: hasDataSaver || isSlowConnection,
  };
}

/**
 * Detects low-end devices based on various heuristics
 */
export function detectLowEndDevice(): boolean {
  // Hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 2;
  if (cores <= 2) return true;

  // Memory (if available)
  const memory = (navigator as any).deviceMemory;
  if (memory && memory <= 2) return true;

  // User agent patterns for low-end devices
  const userAgent = navigator.userAgent.toLowerCase();
  const lowEndPatterns = [
    /android\s[0-4]\./,
    /android\s5\.[0-1]/,
    /cpu\sos\s[0-9]_/,
    /iphone\sos\s[0-9]_/,
    /webos/,
    /blackberry/,
    /bb10/,
    /rimtablet/,
  ];

  return lowEndPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Detects slow network connections
 */
export function detectSlowConnection(): boolean {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      // Effective connection type
      const slowTypes = ['slow-2g', '2g', '3g'];
      if (slowTypes.includes(connection.effectiveType)) return true;

      // Downlink speed (Mbps)
      if (connection.downlink && connection.downlink < 1.5) return true;

      // RTT (Round Trip Time in ms)
      if (connection.rtt && connection.rtt > 300) return true;
    }
  }

  return false;
}

/**
 * Optimizes images for mobile viewing
 */
export function getOptimizedImageUrl(
  originalUrl: string, 
  maxWidth: number = 800, 
  quality: number = 80
): string {
  // If it's already a data URL or blob, return as-is
  if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) {
    return originalUrl;
  }

  // Check if it's from a CDN that supports transformations
  if (originalUrl.includes('cloudinary.com')) {
    return originalUrl.replace('/upload/', `/upload/w_${maxWidth},q_${quality},f_auto/`);
  }

  if (originalUrl.includes('imagekit.io')) {
    return `${originalUrl}?tr=w-${maxWidth},q-${quality}`;
  }

  // For other cases, return original (you might want to implement your own CDN logic)
  return originalUrl;
}

/**
 * Lazy loading intersection observer for mobile
 */
export function createMobileLazyLoader(
  callback: (entries: IntersectionObserverEntry[]) => void,
  rootMargin: string = '50px'
): IntersectionObserver {
  const options = {
    root: null,
    rootMargin,
    threshold: 0.1,
  };

  return new IntersectionObserver(callback, options);
}

/**
 * Debounce function optimized for mobile events
 */
export function mobileDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 100
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for scroll and resize events on mobile
 */
export function mobileThrottle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 16
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Preload critical resources for mobile
 */
export function preloadCriticalResources(resources: string[]): Promise<void[]> {
  const promises = resources.map(resource => {
    return new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      // Determine resource type
      if (resource.match(/\.(woff2?|ttf|otf)$/)) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      } else if (resource.match(/\.(jpg|jpeg|png|webp|svg)$/)) {
        link.as = 'image';
      } else if (resource.match(/\.(css)$/)) {
        link.as = 'style';
      } else if (resource.match(/\.(js|mjs)$/)) {
        link.as = 'script';
      }

      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload ${resource}`));
      
      document.head.appendChild(link);
    });
  });

  return Promise.all(promises);
}

/**
 * Mobile-optimized virtual scrolling helper
 */
export class MobileVirtualScroller {
  private container: HTMLElement;
  private itemHeight: number;
  private buffer: number;
  private visibleItems: number;

  constructor(
    container: HTMLElement,
    itemHeight: number,
    buffer: number = 5
  ) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.buffer = buffer;
    this.visibleItems = Math.ceil(container.clientHeight / itemHeight);
  }

  getVisibleRange(scrollTop: number, totalItems: number) {
    const start = Math.floor(scrollTop / this.itemHeight);
    const end = Math.min(
      start + this.visibleItems + this.buffer * 2,
      totalItems
    );
    
    return {
      start: Math.max(0, start - this.buffer),
      end,
      visibleStart: start,
      visibleEnd: Math.min(start + this.visibleItems, totalItems)
    };
  }
}

/**
 * Battery status integration for performance adjustments
 */
export async function getBatteryOptimizations(): Promise<Partial<PerformanceSettings>> {
  if ('getBattery' in navigator) {
    try {
      const battery = await (navigator as any).getBattery();
      const isLowBattery = battery.level < 0.2;
      const isCharging = battery.charging;

      if (isLowBattery && !isCharging) {
        return {
          reduceAnimations: true,
          limitConcurrentRequests: true,
          useDataSaver: true,
        };
      }
    } catch (error) {
      console.warn('Battery API not available:', error);
    }
  }

  return {};
}

/**
 * Mobile gesture detection utilities
 */
export interface TouchGestureHandler {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  threshold?: number;
}

export function addTouchGestureListener(
  element: HTMLElement,
  handlers: TouchGestureHandler
): () => void {
  const threshold = handlers.threshold || 50;
  let startX = 0;
  let startY = 0;
  let startDistance = 0;

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      startDistance = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && handlers.onPinch && startDistance > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scale = distance / startDistance;
      handlers.onPinch(scale);
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (e.changedTouches.length === 1) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0 && handlers.onSwipeRight) {
            handlers.onSwipeRight();
          } else if (deltaX < 0 && handlers.onSwipeLeft) {
            handlers.onSwipeLeft();
          }
        }
      } else {
        if (Math.abs(deltaY) > threshold) {
          if (deltaY > 0 && handlers.onSwipeDown) {
            handlers.onSwipeDown();
          } else if (deltaY < 0 && handlers.onSwipeUp) {
            handlers.onSwipeUp();
          }
        }
      }
    }
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
} 

/**
 * Mobile-optimized loading utilities
 */
export class MobileLoader {
  private static instance: MobileLoader;
  private loadingQueue: Promise<any>[] = [];
  private maxConcurrent: number = 3;

  static getInstance(): MobileLoader {
    if (!MobileLoader.instance) {
      MobileLoader.instance = new MobileLoader();
    }
    return MobileLoader.instance;
  }

  /**
   * Load chunks optimally for mobile
   */
  async loadChunksOptimally(chunks: string[]): Promise<void> {
    const settings = detectPerformanceConstraints();
    
    if (settings.limitConcurrentRequests) {
      // Load chunks sequentially on slow connections
      for (const chunk of chunks) {
        await this.loadChunk(chunk);
      }
    } else {
      // Load chunks in parallel on fast connections
      await Promise.all(chunks.map(chunk => this.loadChunk(chunk)));
    }
  }

  private async loadChunk(chunk: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chunk;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load chunk: ${chunk}`));
      document.head.appendChild(script);
    });
  }
}