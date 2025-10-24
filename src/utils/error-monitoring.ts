/**
 * Error Monitoring and Reporting Utility
 * 
 * This module provides centralized error handling and monitoring
 * specifically for environment configuration issues and critical failures.
 */

import { toast } from 'sonner';

// Error categories for better tracking
export enum ErrorCategory {
  ENVIRONMENT = 'environment',
  SUPABASE = 'supabase',
  AUTHENTICATION = 'authentication',
  BUILD = 'build',
  RUNTIME = 'runtime'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

interface ErrorReport {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  details?: unknown;
  timestamp: string;
  environment: string;
  userAgent?: string;
  url?: string;
  stackTrace?: string;
}

class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errors: ErrorReport[] = [];
  private maxErrors = 100; // Keep last 100 errors in memory

  private constructor() {
    // Set up global error handlers
    this.setupGlobalHandlers();
  }

  public static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        category: ErrorCategory.RUNTIME,
        severity: ErrorSeverity.HIGH,
        message: 'Unhandled Promise Rejection',
        details: {
          reason: event.reason,
          promise: event.promise
        }
      });
    });

    // Handle general JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError({
        category: ErrorCategory.RUNTIME,
        severity: ErrorSeverity.MEDIUM,
        message: `JavaScript Error: ${event.message}`,
        details: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        }
      });
    });
  }

  public reportError(options: {
    category: ErrorCategory;
    severity: ErrorSeverity;
    message: string;
    details?: unknown;
    showToast?: boolean;
  }) {
    const error: ErrorReport = {
      ...options,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.VITE_ENVIRONMENT || 'unknown',
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: new Error().stack
    };

    // Add to local storage for debugging
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift(); // Remove oldest error
    }

    // Log to console with appropriate level
    const logMethod = this.getLogMethod(options.severity);
    logMethod(`[${options.category.toUpperCase()}] ${options.message}`, error);

    // Show user-friendly toast for critical errors
    if (options.showToast !== false && options.severity === ErrorSeverity.CRITICAL) {
      toast.error(this.getUserFriendlyMessage(options.category, options.message));
    }

    // Send to monitoring service in production
    if (import.meta.env.PROD && options.severity >= ErrorSeverity.HIGH) {
      this.sendToMonitoringService(error);
    }

    return error;
  }

  private getLogMethod(severity: ErrorSeverity) {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return console.error;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.LOW:
        return console.info;
      default:
        return console.log;
    }
  }

  private getUserFriendlyMessage(category: ErrorCategory, _message: string): string {
    switch (category) {
      case ErrorCategory.ENVIRONMENT:
        return 'Configuration error detected. Please contact support if this persists.';
      case ErrorCategory.SUPABASE:
        return 'Database connection issue. Trying to reconnect...';
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication error. Please try signing in again.';
      case ErrorCategory.BUILD:
        return 'Application loading error. Please refresh the page.';
      default:
        return 'An unexpected error occurred. Please refresh the page or contact support.';
    }
  }

  private async sendToMonitoringService(error: ErrorReport) {
    try {
      // In a real application, you'd send this to your monitoring service
      // Examples: Sentry, LogRocket, Datadog, etc.
      
      // For now, we'll just log it as a structured message
      console.warn('DATA Error reported to monitoring:', {
        category: error.category,
        severity: error.severity,
        message: error.message,
        timestamp: error.timestamp,
        environment: error.environment
      });

      // You could also send to a webhook or API endpoint
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(error)
      // });
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring service:', monitoringError);
    }
  }

  // Helper methods for common error scenarios
  public reportEnvironmentError(message: string, details?: unknown) {
    return this.reportError({
      category: ErrorCategory.ENVIRONMENT,
      severity: ErrorSeverity.CRITICAL,
      message: `Environment Configuration Error: ${message}`,
      details,
      showToast: true
    });
  }

  public reportSupabaseError(message: string, details?: unknown, severity = ErrorSeverity.HIGH) {
    return this.reportError({
      category: ErrorCategory.SUPABASE,
      severity,
      message: `Supabase Error: ${message}`,
      details,
      showToast: severity === ErrorSeverity.CRITICAL
    });
  }

  public reportAuthError(message: string, details?: unknown) {
    return this.reportError({
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      message: `Authentication Error: ${message}`,
      details,
      showToast: false // Auth errors usually have their own UI handling
    });
  }

  // Get error reports for debugging
  public getErrorReports(category?: ErrorCategory): ErrorReport[] {
    if (category) {
      return this.errors.filter(error => error.category === category);
    }
    return [...this.errors];
  }

  // Clear error reports
  public clearErrorReports() {
    this.errors = [];
  }

  // Get system health summary
  public getHealthSummary() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentErrors = this.errors.filter(
      error => new Date(error.timestamp).getTime() > oneHourAgo
    );

    const errorsBySeverity = {
      critical: recentErrors.filter(e => e.severity === ErrorSeverity.CRITICAL).length,
      high: recentErrors.filter(e => e.severity === ErrorSeverity.HIGH).length,
      medium: recentErrors.filter(e => e.severity === ErrorSeverity.MEDIUM).length,
      low: recentErrors.filter(e => e.severity === ErrorSeverity.LOW).length
    };

    const errorsByCategory = {
      environment: recentErrors.filter(e => e.category === ErrorCategory.ENVIRONMENT).length,
      supabase: recentErrors.filter(e => e.category === ErrorCategory.SUPABASE).length,
      authentication: recentErrors.filter(e => e.category === ErrorCategory.AUTHENTICATION).length,
      build: recentErrors.filter(e => e.category === ErrorCategory.BUILD).length,
      runtime: recentErrors.filter(e => e.category === ErrorCategory.RUNTIME).length
    };

    return {
      totalErrors: recentErrors.length,
      errorsBySeverity,
      errorsByCategory,
      lastError: this.errors[this.errors.length - 1] || null,
      healthStatus: this.getOverallHealthStatus(errorsBySeverity)
    };
  }

  private getOverallHealthStatus(errorsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  }): 'healthy' | 'warning' | 'critical' {
    if (errorsBySeverity.critical > 0) return 'critical';
    if (errorsBySeverity.high > 2) return 'critical';
    if (errorsBySeverity.high > 0 || errorsBySeverity.medium > 5) return 'warning';
    return 'healthy';
  }
}

// Export singleton instance
export const errorMonitor = ErrorMonitor.getInstance();

// Convenience functions
export const reportEnvironmentError = (message: string, details?: unknown) => 
  errorMonitor.reportEnvironmentError(message, details);

export const reportSupabaseError = (message: string, details?: unknown, severity?: ErrorSeverity) => 
  errorMonitor.reportSupabaseError(message, details, severity);

export const reportAuthError = (message: string, details?: unknown) => 
  errorMonitor.reportAuthError(message, details);

export const getHealthSummary = () => errorMonitor.getHealthSummary(); 