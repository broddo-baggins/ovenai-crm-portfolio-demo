// Performance monitoring utilities for production

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  pageLoadTime?: number;
  navigationStart?: number;
  interactiveTime?: number;
  
  // User context
  timestamp: number;
  userAgent: string;
  url: string;
  viewport: { width: number; height: number };
  connectionType?: string;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private isProduction = process.env.NODE_ENV === 'production';

  constructor() {
    this.initializeMetrics();
    this.setupObservers();
  }

  private initializeMetrics() {
    this.metrics = {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // Get connection information if available
    const connection = (navigator as any).connection;
    if (connection) {
      this.metrics.connectionType = connection.effectiveType || connection.type;
    }
  }

  private setupObservers() {
    try {
      // Observe paint metrics (FCP, LCP)
      if ('PerformanceObserver' in window) {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);

        // Observe LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // Observe layout shifts (CLS)
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.metrics.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);

        // Observe first input delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Type assertion for PerformanceEventTiming
            const eventEntry = entry as any;
            if (eventEntry.processingStart) {
              this.metrics.fid = eventEntry.processingStart - eventEntry.startTime;
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      }

      // Navigation timing
      if (performance.timing) {
        const timing = performance.timing;
        this.metrics.navigationStart = timing.navigationStart;
        this.metrics.ttfb = timing.responseStart - timing.navigationStart;
        
        // Calculate page load time when DOM is ready
        if (document.readyState === 'complete') {
          this.calculatePageLoadTime();
        } else {
          window.addEventListener('load', () => this.calculatePageLoadTime());
        }
      }
    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  private calculatePageLoadTime() {
    if (performance.timing) {
      const timing = performance.timing;
      this.metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
    }
  }

  // Track custom performance marks
  public mark(name: string) {
    try {
      performance.mark(name);
    } catch (error) {
      console.warn(`Failed to create performance mark '${name}':`, error);
    }
  }

  // Measure time between marks
  public measure(name: string, startMark: string, endMark?: string) {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
      
      const measure = performance.getEntriesByName(name, 'measure')[0];
      return measure ? measure.duration : 0;
    } catch (error) {
      console.warn(`Failed to measure '${name}':`, error);
      return 0;
    }
  }

  // Get current metrics snapshot
  public getMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      timestamp: Date.now()
    } as PerformanceMetrics;
  }

  // Send metrics to analytics service
  public sendMetrics(additionalData?: Record<string, any>) {
    if (!this.isProduction) {
      console.log('Performance Metrics (Dev):', this.getMetrics());
      return;
    }

    try {
      const metrics = {
        ...this.getMetrics(),
        ...additionalData
      };

      // In production, this would send to your analytics service
      // Examples:
      // - Google Analytics 4
      // - Adobe Analytics  
      // - Custom analytics endpoint
      // - Performance monitoring service like New Relic, Datadog

      // Example: Send to custom endpoint
      // fetch('/api/metrics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(metrics),
      //   keepalive: true // Ensure it sends even if page is unloading
      // }).catch(error => console.warn('Failed to send metrics:', error));

      // Example: Google Analytics 4
      // if (window.gtag) {
      //   window.gtag('event', 'page_performance', {
      //     page_load_time: metrics.pageLoadTime,
      //     largest_contentful_paint: metrics.lcp,
      //     first_input_delay: metrics.fid,
      //     cumulative_layout_shift: metrics.cls,
      //     custom_parameter: additionalData
      //   });
      // }

      console.log('[Production] Performance metrics ready to send:', metrics);
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
    }
  }

  // Track interaction metrics
  public trackInteraction(interactionName: string, startTime?: number) {
    const endTime = performance.now();
    const duration = startTime ? endTime - startTime : 0;
    
    this.mark(`interaction-${interactionName}-end`);
    
    if (this.isProduction) {
      // Send interaction timing to analytics
      // Example: gtag('event', 'timing_complete', {
      //   name: interactionName,
      //   value: Math.round(duration)
      // });
    }
    
    return duration;
  }

  // Cleanup observers
  public cleanup() {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Failed to disconnect performance observer:', error);
      }
    });
    this.observers = [];
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export utilities
export const perf = {
  // Track component mount/render times
  startRender: (componentName: string) => {
    performanceMonitor.mark(`${componentName}-render-start`);
    return performance.now();
  },

  endRender: (componentName: string, startTime?: number) => {
    performanceMonitor.mark(`${componentName}-render-end`);
    const duration = performanceMonitor.measure(
      `${componentName}-render-duration`,
      `${componentName}-render-start`,
      `${componentName}-render-end`
    );
    
    if (process.env.NODE_ENV === 'development' && duration > 16) {
      console.warn(`Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  },

  // Track route changes
  trackRouteChange: (routeName: string) => {
    performanceMonitor.mark(`route-${routeName}-start`);
    setTimeout(() => {
      performanceMonitor.sendMetrics({
        route: routeName,
        type: 'route_change'
      });
    }, 100);
  },

  // Track user interactions
  trackClick: (elementName: string) => {
    return performanceMonitor.trackInteraction(`click-${elementName}`, performance.now());
  },

  // Get current metrics
  getMetrics: () => performanceMonitor.getMetrics(),
  
  // Send metrics manually
  sendMetrics: (data?: Record<string, any>) => performanceMonitor.sendMetrics(data),
  
  // Cleanup
  cleanup: () => performanceMonitor.cleanup()
};

// Auto-send metrics on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.sendMetrics({ type: 'page_unload' });
  });

  // Send metrics after page is fully loaded
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.sendMetrics({ type: 'page_loaded' });
    }, 2000); // Wait 2 seconds for metrics to stabilize
  });
}

export default performanceMonitor; 