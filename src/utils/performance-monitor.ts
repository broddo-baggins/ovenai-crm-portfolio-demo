// Performance Monitor - Predicts and prevents common application issues
// This utility helps detect memory leaks, performance bottlenecks, and resource issues

interface PerformanceMetrics {
  memoryUsage: number;
  componentRenderCount: number;
  apiCallCount: number;
  supabaseConnections: number;
  lastActivity: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    memoryUsage: 0,
    componentRenderCount: 0,
    apiCallCount: 0,
    supabaseConnections: 0,
    lastActivity: Date.now()
  };

  private watchers: Array<() => void> = [];
  private monitoring = false;

  constructor() {
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    // Monitor memory usage
    this.watchers.push(this.monitorMemory());
    
    // Monitor Supabase connections
    this.watchers.push(this.monitorSupabaseConnections());
    
    // Monitor long-running tasks
    this.watchers.push(this.monitorLongTasks());
    
    // Monitor React re-renders (if React DevTools is available)
    this.watchers.push(this.monitorReactRenders());

    this.monitoring = true;
    
  }

  private monitorMemory(): () => void {
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize;
        
        // Warn if memory usage is high (>100MB)
        if (memory.usedJSHeapSize > 100 * 1024 * 1024) {
          console.warn('WARNING High memory usage detected:', {
            used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
            total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
            limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
          });
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }

  private monitorSupabaseConnections(): () => void {
    let connectionCount = 0;
    
    // Override WebSocket constructor to count connections
    if (typeof WebSocket !== 'undefined') {
      const originalWebSocket = WebSocket;
      (window as any).WebSocket = function(...args: any[]) {
        connectionCount++;
        console.log(`🔌 WebSocket connection #${connectionCount} created`);
        
        if (connectionCount > 5) {
          console.warn('WARNING Too many WebSocket connections detected:', connectionCount);
        }
        
        const ws = new originalWebSocket(...(args as [string, string?]));
        
        ws.addEventListener('close', () => {
          connectionCount--;
          console.log(`🔌 WebSocket connection closed, remaining: ${connectionCount}`);
        });
        
        return ws;
      };
    }

    return () => {
      // Restore original WebSocket if needed
    };
  }

  private monitorLongTasks(): () => void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn('WARNING Long task detected:', {
              duration: `${entry.duration.toFixed(2)}ms`,
              name: entry.name,
              startTime: entry.startTime
            });
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Longtask API not supported
      }

      return () => observer.disconnect();
    }

    return () => {};
  }

  private monitorReactRenders(): () => void {
    // Track React render cycles
    let renderCount = 0;
    
    const interval = setInterval(() => {
      this.metrics.componentRenderCount = renderCount;
      
      if (renderCount > 100) {
        console.warn('WARNING High React render count detected:', renderCount, 'renders in 10 seconds');
        renderCount = 0; // Reset counter
      }
    }, 10000);

    // Hook into React's render cycle if possible
    if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const devTools = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      const originalOnCommitFiberRoot = devTools.onCommitFiberRoot;
      devTools.onCommitFiberRoot = function(...args: any[]) {
        renderCount++;
        return originalOnCommitFiberRoot?.apply(this, args);
      };
    }

    return () => clearInterval(interval);
  }

  // Public methods to track specific events
  public trackApiCall(endpoint: string) {
    this.metrics.apiCallCount++;
    this.metrics.lastActivity = Date.now();
    
    if (import.meta.env.DEV) {
      console.log(`📡 API call tracked: ${endpoint} (total: ${this.metrics.apiCallCount})`);
    }
  }

  public trackSupabaseQuery(table: string, operation: string) {
    this.metrics.lastActivity = Date.now();
    
    if (import.meta.env.DEV) {
      console.log(`🗃️ Supabase query: ${operation} on ${table}`);
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public generateReport(): string {
    const report = [
      'DATA Performance Report:',
      `Memory Usage: ${(this.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      `Component Renders: ${this.metrics.componentRenderCount}`,
      `API Calls: ${this.metrics.apiCallCount}`,
      `Supabase Connections: ${this.metrics.supabaseConnections}`,
      `Last Activity: ${new Date(this.metrics.lastActivity).toLocaleTimeString()}`
    ].join('\n');

    return report;
  }

  public logReport() {
    console.log(this.generateReport());
  }

  public destroy() {
    this.watchers.forEach(watcher => watcher());
    this.watchers = [];
    this.monitoring = false;
    
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Predict and prevent common issues
export const preventCommonIssues = {
  // Prevent memory leaks from event listeners
  addEventListener: (element: EventTarget, event: string, handler: EventListener) => {
    element.addEventListener(event, handler);
    
    // Return cleanup function
    return () => element.removeEventListener(event, handler);
  },

  // Prevent memory leaks from intervals/timeouts
  setInterval: (callback: () => void, ms: number) => {
    const id = setInterval(callback, ms);
    
    // Auto-cleanup after 5 minutes to prevent long-running intervals
    setTimeout(() => {
      clearInterval(id);
      console.warn('WARNING Auto-cleared long-running interval to prevent memory leak');
    }, 5 * 60 * 1000);
    
    return id;
  },

  // Debounce API calls to prevent excessive requests
  debounceApiCall: <T extends (...args: any[]) => any>(
    func: T,
    delay: number = 300
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: number;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => func(...args), delay);
    };
  },

  // Throttle expensive operations
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number = 100
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// Global error boundary for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('ALERT Unhandled Promise Rejection:', event.reason);
    
    // Track specific error types that could cause issues
    if (event.reason?.message?.includes('Supabase')) {
      console.warn('🗃️ Supabase-related error detected - check connection');
    }
    
    if (event.reason?.message?.includes('Network')) {
      console.warn('WEB Network error detected - check connectivity');
    }
    
    // Prevent default to avoid console spam in development
    if (import.meta.env.DEV) {
      event.preventDefault();
    }
  });
} 