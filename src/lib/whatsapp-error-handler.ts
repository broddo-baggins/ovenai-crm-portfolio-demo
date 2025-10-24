// Enhanced Error Handling and Logging System for Meta WhatsApp Integration
// Production-ready error handling designed for Meta App Review requirements

// === LOGGING SYSTEM ===
interface LogContext {
  requestId: string;
  phoneNumberId?: string;
  messageId?: string;
  from?: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

class WhatsAppLogger {
  private static instance: WhatsAppLogger;

  static getInstance(): WhatsAppLogger {
    if (!WhatsAppLogger.instance) {
      WhatsAppLogger.instance = new WhatsAppLogger();
    }
    return WhatsAppLogger.instance;
  }

  private generateRequestId(): string {
    return `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatLog(
    level: LogLevel,
    message: string,
    context: Partial<LogContext>,
    data?: any,
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: "whatsapp-webhook",
      message,
      context,
      data: data ? JSON.stringify(data, null, 2) : undefined,
      environment: import.meta.env.MODE || "development",
    };

    // Console logging with emoji indicators for easy scanning
    const emoji = {
      [LogLevel.DEBUG]: "SEARCH",
      [LogLevel.INFO]: "DATA",
      [LogLevel.WARN]: "WARNING",
      [LogLevel.ERROR]: "ERROR",
      [LogLevel.CRITICAL]: "ALERT",
    };

    console.log(
      `${emoji[level]} [${level}] ${message}`,
      JSON.stringify(logEntry, null, 2),
    );

    // TODO: Send to external logging service (DataDog, Sentry, etc.)
    // await this.sendToExternalLogger(logEntry);
  }

  debug(message: string, context: Partial<LogContext>, data?: any): void {
    this.formatLog(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context: Partial<LogContext>, data?: any): void {
    this.formatLog(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context: Partial<LogContext>, data?: any): void {
    this.formatLog(LogLevel.WARN, message, context, data);
  }

  error(
    message: string,
    context: Partial<LogContext>,
    error?: Error,
    data?: any,
  ): void {
    const errorData = error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...data,
        }
      : data;

    this.formatLog(LogLevel.ERROR, message, context, errorData);
  }

  critical(
    message: string,
    context: Partial<LogContext>,
    error?: Error,
    data?: any,
  ): void {
    const errorData = error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...data,
        }
      : data;

    this.formatLog(LogLevel.CRITICAL, message, context, errorData);

    // TODO: Trigger immediate alerts for critical errors
    // await this.triggerCriticalAlert(message, context, errorData);
  }
}

// === ERROR HANDLING CLASSES ===
class WhatsAppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public retryable: boolean = false,
    public context?: any,
  ) {
    super(message);
    this.name = "WhatsAppError";
  }
}

class ValidationError extends WhatsAppError {
  constructor(message: string, field?: string) {
    super(message, "VALIDATION_ERROR", 400, false, { field });
    this.name = "ValidationError";
  }
}

class AuthenticationError extends WhatsAppError {
  constructor(message: string) {
    super(message, "AUTH_ERROR", 401, false);
    this.name = "AuthenticationError";
  }
}

class RateLimitError extends WhatsAppError {
  constructor(message: string, retryAfter?: number) {
    super(message, "RATE_LIMIT_ERROR", 429, true, { retryAfter });
    this.name = "RateLimitError";
  }
}

class MetaAPIError extends WhatsAppError {
  constructor(
    message: string,
    metaErrorCode?: string,
    metaErrorSubcode?: string,
  ) {
    super(message, "META_API_ERROR", 502, true, {
      metaErrorCode,
      metaErrorSubcode,
    });
    this.name = "MetaAPIError";
  }
}

// === RATE LIMITING & CIRCUIT BREAKER ===
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(
    phoneNumber: string,
    limit: number = 10,
    windowMs: number = 60000,
  ): boolean {
    const now = Date.now();
    const requests = this.requests.get(phoneNumber) || [];

    // Remove requests outside the window
    const validRequests = requests.filter((time) => now - time < windowMs);

    if (validRequests.length >= limit) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(phoneNumber, validRequests);
    return true;
  }
}

class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeMs: number = 60000,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeMs) {
        this.state = "HALF_OPEN";
      } else {
        throw new WhatsAppError(
          "Circuit breaker is OPEN",
          "CIRCUIT_BREAKER_OPEN",
          503,
          true,
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "CLOSED";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }
}

// === ERROR RECOVERY STRATEGIES ===
class ErrorRecoveryManager {
  private retryCount: Map<string, number> = new Map();

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    maxRetries: number = 3,
    backoffMs: number = 1000,
  ): Promise<T> {
    const currentRetries = this.retryCount.get(operationId) || 0;

    try {
      const result = await operation();
      this.retryCount.delete(operationId); // Reset on success
      return result;
    } catch (error) {
      if (
        currentRetries < maxRetries &&
        error instanceof WhatsAppError &&
        error.retryable
      ) {
        this.retryCount.set(operationId, currentRetries + 1);

        // Exponential backoff
        const delay = backoffMs * Math.pow(2, currentRetries);
        await new Promise((resolve) => setTimeout(resolve, delay));

        return this.executeWithRetry(
          operation,
          operationId,
          maxRetries,
          backoffMs,
        );
      } else {
        this.retryCount.delete(operationId);
        throw error;
      }
    }
  }
}

// === META-SPECIFIC ERROR HANDLING ===
class MetaErrorHandler {
  private static readonly META_ERROR_CODES = {
    // Authentication errors
    190: {
      type: "AUTH_ERROR",
      retryable: false,
      message: "Access token invalid",
    },
    102: {
      type: "AUTH_ERROR",
      retryable: false,
      message: "Session key invalid",
    },

    // Rate limiting errors
    4: {
      type: "RATE_LIMIT",
      retryable: true,
      message: "Application request limit reached",
    },
    17: {
      type: "RATE_LIMIT",
      retryable: true,
      message: "User request limit reached",
    },
    613: {
      type: "RATE_LIMIT",
      retryable: true,
      message: "Calls to this API have exceeded the rate limit",
    },

    // WhatsApp specific errors
    131056: {
      type: "WHATSAPP_ERROR",
      retryable: false,
      message: "WhatsApp Business account restricted",
    },
    131009: {
      type: "WHATSAPP_ERROR",
      retryable: false,
      message: "Parameter value invalid",
    },
    131026: {
      type: "WHATSAPP_ERROR",
      retryable: true,
      message: "Message undeliverable",
    },
    131047: {
      type: "WHATSAPP_ERROR",
      retryable: false,
      message: "Re-engagement message",
    },

    // Temporary errors
    1: {
      type: "TEMPORARY",
      retryable: true,
      message: "An unknown error occurred",
    },
    2: {
      type: "TEMPORARY",
      retryable: true,
      message: "Service temporarily unavailable",
    },

    // Webhook errors
    368: {
      type: "WEBHOOK_ERROR",
      retryable: false,
      message:
        "The action attempted has been deemed abusive or is otherwise disallowed",
    },
  };

  static handleMetaError(errorResponse: any): WhatsAppError {
    const errorCode = errorResponse.error?.code;
    const errorMessage =
      errorResponse.error?.message || "Unknown Meta API error";
    const errorSubcode = errorResponse.error?.error_subcode;

    const knownError =
      this.META_ERROR_CODES[errorCode as keyof typeof this.META_ERROR_CODES];

    if (knownError) {
      switch (knownError.type) {
        case "AUTH_ERROR":
          return new AuthenticationError(
            `${knownError.message}: ${errorMessage}`,
          );
        case "RATE_LIMIT":
          return new RateLimitError(`${knownError.message}: ${errorMessage}`);
        case "WHATSAPP_ERROR":
        case "WEBHOOK_ERROR":
        case "TEMPORARY":
          return new MetaAPIError(
            `${knownError.message}: ${errorMessage}`,
            errorCode?.toString(),
            errorSubcode?.toString(),
          );
        default:
          return new MetaAPIError(
            errorMessage,
            errorCode?.toString(),
            errorSubcode?.toString(),
          );
      }
    } else {
      return new MetaAPIError(
        `Unknown Meta API error: ${errorMessage}`,
        errorCode?.toString(),
        errorSubcode?.toString(),
      );
    }
  }
}

// === HEALTH MONITORING ===
class HealthMonitor {
  private metrics = {
    messagesReceived: 0,
    messagesSent: 0,
    errors: 0,
    lastActivity: Date.now(),
    uptime: Date.now(),
  };

  incrementMessagesReceived(): void {
    this.metrics.messagesReceived++;
    this.metrics.lastActivity = Date.now();
  }

  incrementMessagesSent(): void {
    this.metrics.messagesSent++;
    this.metrics.lastActivity = Date.now();
  }

  incrementErrors(): void {
    this.metrics.errors++;
  }

  getHealthStatus(): any {
    const now = Date.now();
    return {
      status: "healthy",
      uptime: now - this.metrics.uptime,
      lastActivity: now - this.metrics.lastActivity,
      metrics: { ...this.metrics },
      timestamp: new Date().toISOString(),
    };
  }

  getErrorRate(): number {
    const total = this.metrics.messagesReceived + this.metrics.messagesSent;
    return total > 0 ? (this.metrics.errors / total) * 100 : 0;
  }
}

// === EXPORT ALL CLASSES ===
export {
  WhatsAppLogger,
  WhatsAppError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  MetaAPIError,
  RateLimiter,
  CircuitBreaker,
  ErrorRecoveryManager,
  MetaErrorHandler,
  HealthMonitor,
  LogLevel,
  type LogContext,
};
