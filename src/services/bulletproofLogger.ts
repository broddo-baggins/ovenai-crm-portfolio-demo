import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// 🛡️ BULLETPROOF LOGGING SYSTEM FOR WEB APP
// Based on Agent Design architecture analysis

export interface LogEntry {
  timestamp: string;
  session_id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS' | 'FLAG_CHANGE';
  component: string;
  message: string;
  data: Record<string, any>;
  context: {
    environment: string;
    user_id?: string;
    ip_address?: string;
    user_agent?: string;
    route?: string;
    source: string;
  };
}

export interface DatabaseLogEntry {
  id?: string;
  session_id: string;
  timestamp: string;
  level: string;
  component: string;
  message: string;
  data: any;
  context: any;
  created_at?: string;
}

class BulletproofLogger {
  private sessionId: string;
  private logBuffer: LogEntry[] = [];
  private supabase: SupabaseClient<Database>;
  private isEnabled: boolean = true;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Generate unique session ID
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize Supabase client with anon key only (secure)
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );

    // Set up auto-flush mechanism (every 30 seconds)
    this.flushInterval = setInterval(() => {
      this.flushBuffer().catch(console.error);
    }, 30000);

    console.log(`🛡️ BULLETPROOF LOGGER INITIALIZED - Session: ${this.sessionId}`);
  }

  /**
   * TARGET CORE LOGGING METHOD - All logs flow through here
   */
  async log(
    level: LogEntry['level'], 
    component: string, 
    message: string, 
    data: Record<string, any> = {}, 
    options: {
      context?: Partial<LogEntry['context']>;
      persistToDb?: boolean;
      forceFlush?: boolean;
    } = {}
  ): Promise<LogEntry> {
    if (!this.isEnabled) {
      return {} as LogEntry;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      level,
      component,
      message,
      data,
      context: {
        environment: import.meta.env.MODE || 'development',
        source: 'bulletproof_logger',
        user_agent: navigator?.userAgent,
        route: window?.location?.pathname,
        ...options.context
      }
    };

    // 1. IMMEDIATE CONSOLE OUTPUT (for development)
    this.consoleOutput(logEntry);

    // 2. BUFFER FOR BATCH PROCESSING
    this.logBuffer.push(logEntry);

    // 3. DATABASE LOGGING (async, non-blocking)
    if (options.persistToDb !== false) {
      this.persistToDatabase(logEntry).catch(err => {
        console.error('ALERT Logger database error:', err.message);
      });
    }

    // 4. AUTO-FLUSH BUFFER (every 10 entries or force flush)
    if (this.logBuffer.length >= 10 || options.forceFlush) {
      await this.flushBuffer();
    }

    return logEntry;
  }

  /**
   * DATA SPECIALIZED LOGGING METHODS
   */
  async info(component: string, message: string, data: Record<string, any> = {}, options = {}) {
    return this.log('INFO', component, message, data, options);
  }

  async warn(component: string, message: string, data: Record<string, any> = {}, options = {}) {
    return this.log('WARN', component, message, data, options);
  }

  async error(component: string, message: string, error: Error | string, data: Record<string, any> = {}, options = {}) {
    const errorData = {
      ...data,
      error: {
        message: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'UnknownError'
      }
    };
    return this.log('ERROR', component, message, errorData, options);
  }

  async debug(component: string, message: string, data: Record<string, any> = {}, options = {}) {
    return this.log('DEBUG', component, message, data, options);
  }

  async success(component: string, message: string, data: Record<string, any> = {}, options = {}) {
    return this.log('SUCCESS', component, message, data, options);
  }

  /**
   * 🎛️ FEATURE FLAG INTEGRATION
   */
  async logFlagChange(flagName: string, oldValue: any, newValue: any, reason: string, context: Record<string, any> = {}) {
    return this.log('FLAG_CHANGE', 'feature_flags', `Flag ${flagName} changed`, {
      flag_name: flagName,
      old_value: oldValue,
      new_value: newValue,
      reason,
      change_timestamp: new Date().toISOString(),
      ...context
    });
  }

  /**
   * STYLE CONSOLE OUTPUT FORMATTING
   */
  private consoleOutput(logEntry: LogEntry) {
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${logEntry.level}] [${logEntry.component}]`;
    
    const style = this.getConsoleStyle(logEntry.level);
    
    if (typeof console !== 'undefined') {
      console.log(
        `%c${prefix}`,
        style,
        logEntry.message,
        Object.keys(logEntry.data).length > 0 ? logEntry.data : ''
      );
    }
  }

  private getConsoleStyle(level: LogEntry['level']): string {
    const styles = {
      INFO: 'color: #0066cc; font-weight: normal;',
      SUCCESS: 'color: #00cc66; font-weight: bold;',
      WARN: 'color: #ff9900; font-weight: bold;',
      ERROR: 'color: #cc0000; font-weight: bold; background: #ffe6e6;',
      DEBUG: 'color: #666666; font-style: italic;',
      FLAG_CHANGE: 'color: #9900ff; font-weight: bold;'
    };
    return styles[level] || styles.INFO;
  }

  /**
   * SAVE PERSISTENCE (Browser Storage for now)
   */
  private async persistToDatabase(logEntry: LogEntry) {
    try {
      // Store in browser storage for immediate implementation
      // Database persistence can be added later when system_logs table is created
      this.storeInBrowserStorage(logEntry);
    } catch (err) {
      // Fail silently to not break the application
      console.error('ALERT Logger persistence error:', err);
    }
  }

  private storeInBrowserStorage(logEntry: LogEntry) {
    try {
      const key = `bulletproof_logs_${this.sessionId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(logEntry);
      
      // Keep only last 1000 entries per session
      if (existing.length > 1000) {
        existing.splice(0, existing.length - 1000);
      }
      
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (err) {
      // Storage full or disabled, fail silently
      console.warn('ALERT Browser storage logging failed:', err);
    }
  }

  /**
   * REFRESH BUFFER MANAGEMENT
   */
  private async flushBuffer() {
    if (this.logBuffer.length === 0) return;

    const bufferCopy = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Batch store to browser storage
      bufferCopy.forEach(entry => {
        this.storeInBrowserStorage(entry);
      });
    } catch (err) {
      console.error('ALERT Buffer flush error:', err);
    }
  }

  /**
   * TARGET SESSION MANAGEMENT
   */
  getSessionId(): string {
    return this.sessionId;
  }

  setContext(context: Partial<LogEntry['context']>) {
    // Update default context for future logs
    Object.assign(this.context, context);
  }

  private context: Partial<LogEntry['context']> = {};

  /**
   * 🧹 CLEANUP
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushBuffer().catch(console.error);
    this.isEnabled = false;
  }

  /**
   * DATA ANALYTICS METHODS
   */
  async getSessionStats(): Promise<{
    total_logs: number;
    by_level: Record<string, number>;
    by_component: Record<string, number>;
    session_duration_ms: number;
  }> {
    try {
      const key = `bulletproof_logs_${this.sessionId}`;
      const stored = localStorage.getItem(key);
      const data: LogEntry[] = stored ? JSON.parse(stored) : [];

      const stats = {
        total_logs: data.length,
        by_level: {} as Record<string, number>,
        by_component: {} as Record<string, number>,
        session_duration_ms: 0
      };

      data.forEach(log => {
        stats.by_level[log.level] = (stats.by_level[log.level] || 0) + 1;
        stats.by_component[log.component] = (stats.by_component[log.component] || 0) + 1;
      });

      if (data.length > 0) {
        const timestamps = data.map(log => new Date(log.timestamp).getTime());
        stats.session_duration_ms = Math.max(...timestamps) - Math.min(...timestamps);
      }

      return stats;
    } catch (err) {
      console.error('ALERT Session stats error:', err);
      return { total_logs: 0, by_level: {}, by_component: {}, session_duration_ms: 0 };
    }
  }
}

// GLOBAL GLOBAL LOGGER INSTANCE
export const bulletproofLogger = new BulletproofLogger();

// REFRESH CLEANUP ON PAGE UNLOAD
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    bulletproofLogger.destroy();
  });
}

export default bulletproofLogger; 