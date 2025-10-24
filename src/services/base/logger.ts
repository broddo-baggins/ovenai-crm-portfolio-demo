/**
 * Log levels for different types of logging
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Log entry interface
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: Date;
  data?: any;
}

/**
 * Structured logging service to replace console.log statements
 * Provides consistent logging across the application
 */
export class Logger {
  private static instance: Logger;
  private currentLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the minimum log level to capture
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Log a debug message (development only)
   */
  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Log an informational message
   */
  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Log an error message
   */
  error(message: string, context?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    if (level < this.currentLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date(),
      data
    };

    // Store log entry
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Output to console with formatting
    this.outputToConsole(entry);
  }

  /**
   * Output log entry to console with proper formatting
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const contextPrefix = entry.context ? `[${entry.context}] ` : '';
    const message = `${timestamp} ${levelName}: ${contextPrefix}${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data);
        break;
    }
  }

  /**
   * Get all stored logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs filtered by context
   */
  getLogsByContext(context: string): LogEntry[] {
    return this.logs.filter(log => log.context === context);
  }

  /**
   * Clear all stored logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create singleton instance
const logger = Logger.getInstance();

// Set appropriate log level based on environment
if (import.meta.env.DEV) {
  logger.setLevel(LogLevel.DEBUG);
} else {
  logger.setLevel(LogLevel.INFO);
}

export default logger; 