// 🛡️ BULLETPROOF LOGGER INTEGRATION EXAMPLES
// Shows how to use the new logging system throughout the Web APP

import { bulletproofLogger } from '../services/bulletproofLogger';

// DATA COMPONENT LOGGING EXAMPLES
export class ComponentLoggingExamples {
  
  // TARGET AUTHENTICATION LOGGING
  static async logUserAuthentication(userId: string, success: boolean) {
    if (success) {
      await bulletproofLogger.success('authentication', 'User login successful', {
        user_id: userId,
        timestamp: new Date().toISOString(),
        login_method: 'supabase_auth'
      });
    } else {
      await bulletproofLogger.error('authentication', 'User login failed', new Error('Invalid credentials'), {
        user_id: userId,
        attempt_count: 1
      });
    }
  }

  // DATABASE DATABASE OPERATION LOGGING
  static async logDatabaseOperation(operation: string, table: string, recordId?: string, error?: Error) {
    if (error) {
      await bulletproofLogger.error('database', `Database ${operation} failed on ${table}`, error, {
        table,
        record_id: recordId,
        operation,
        error_code: (error as any)?.code
      });
    } else {
      await bulletproofLogger.info('database', `Database ${operation} successful on ${table}`, {
        table,
        record_id: recordId,
        operation,
        duration_ms: Math.random() * 100 // Replace with actual timing
      });
    }
  }

  // 📤 API CALL LOGGING
  static async logApiCall(endpoint: string, method: string, statusCode: number, duration: number) {
    const data = {
      endpoint,
      method,
      status_code: statusCode,
      duration_ms: duration,
      response_category: statusCode >= 400 ? 'error' : 'success'
    };

    if (statusCode >= 400) {
      await bulletproofLogger.error('api', `${method} ${endpoint} - ${statusCode}`, 
        new Error(`API call failed with status ${statusCode}`), data);
    } else if (statusCode >= 300) {
      await bulletproofLogger.warn('api', `${method} ${endpoint} - ${statusCode}`, data);
    } else {
      await bulletproofLogger.info('api', `${method} ${endpoint} - ${statusCode}`, data);
    }
  }

  // 🎛️ FEATURE FLAG LOGGING
  static async logFeatureFlagChange(flagName: string, enabled: boolean, userId?: string) {
    await bulletproofLogger.logFlagChange(flagName, !enabled, enabled, 'User toggle', {
      user_id: userId,
      flag_category: 'user_preference'
    });
  }

  // ALERT ERROR BOUNDARY LOGGING
  static async logErrorBoundary(error: Error, componentName: string, props: any) {
    await bulletproofLogger.error('error_boundary', `React component error in ${componentName}`, error, {
      component: componentName,
      props: JSON.stringify(props),
      stack_trace: error.stack,
      user_action: 'component_render'
    });
  }

  // DATA PERFORMANCE LOGGING
  static async logPerformanceMetric(metric: string, value: number, context: Record<string, any> = {}) {
    await bulletproofLogger.info('performance', `Performance metric: ${metric}`, {
      metric_name: metric,
      metric_value: value,
      metric_unit: context.unit || 'ms',
      ...context
    });
  }
}

// TARGET QUEUE SYSTEM INTEGRATION
export class QueueLoggingIntegration {
  
  static async logQueueOperation(operation: string, leadId: string, success: boolean, details?: any) {
    if (success) {
      await bulletproofLogger.success('queue', `Queue ${operation} completed for lead ${leadId}`, {
        lead_id: leadId,
        operation,
        details
      });
    } else {
      await bulletproofLogger.error('queue', `Queue ${operation} failed for lead ${leadId}`, 
        new Error(`Queue operation failed: ${operation}`), {
          lead_id: leadId,
          operation,
          details
        });
    }
  }
}

// 🛡️ MONITORING INTEGRATION
export class MonitoringIntegration {
  
  // System health check with logging
  static async performHealthCheck(): Promise<{
    healthy: boolean;
    details: any;
    session_stats: any;
  }> {
    const startTime = Date.now();
    
    try {
      // Simulate health checks
      const sessionStats = await bulletproofLogger.getSessionStats();
      const healthy = sessionStats.total_logs >= 0; // Always healthy for demo
      
      const details = {
        session_id: bulletproofLogger.getSessionId(),
        uptime_ms: Date.now() - startTime,
        logs_count: sessionStats.total_logs,
        error_rate: sessionStats.by_level.ERROR ? 
          (sessionStats.by_level.ERROR / sessionStats.total_logs) * 100 : 0
      };

      await bulletproofLogger.success('monitoring', 'Health check completed', details);
      
      return { healthy, details, session_stats: sessionStats };
      
    } catch (error) {
      await bulletproofLogger.error('monitoring', 'Health check failed', error as Error);
      return { 
        healthy: false, 
        details: { error: (error as Error).message }, 
        session_stats: { total_logs: 0, by_level: {}, by_component: {}, session_duration_ms: 0 }
      };
    }
  }
}

// STYLE USAGE EXAMPLES IN REACT COMPONENTS
export const ReactIntegrationExamples = {
  
  // Hook for component logging
  useComponentLogger: (componentName: string) => {
    return {
      logMount: () => bulletproofLogger.debug(componentName, 'Component mounted'),
      logUnmount: () => bulletproofLogger.debug(componentName, 'Component unmounted'),
      logError: (error: Error) => bulletproofLogger.error(componentName, 'Component error', error),
      logAction: (action: string, data?: any) => bulletproofLogger.info(componentName, `User action: ${action}`, data)
    };
  },

  // Error boundary integration
  logErrorBoundary: (error: Error, errorInfo: any, componentName: string) => {
    ComponentLoggingExamples.logErrorBoundary(error, componentName, errorInfo);
  }
};

// TARGET EXAMPLE USAGE:
/*
// In a React component:
import { ComponentLoggingExamples, ReactIntegrationExamples } from './examples/bulletproofLoggerExample';

function MyComponent() {
  const logger = ReactIntegrationExamples.useComponentLogger('MyComponent');
  
  useEffect(() => {
    logger.logMount();
    return () => logger.logUnmount();
  }, []);
  
  const handleClick = () => {
    logger.logAction('button_click', { button_id: 'primary_action' });
  };
  
  return <button onClick={handleClick}>Click me</button>;
}

// In API calls:
try {
  const response = await fetch('/api/leads');
  await ComponentLoggingExamples.logApiCall('/api/leads', 'GET', response.status, 150);
} catch (error) {
  await ComponentLoggingExamples.logDatabaseOperation('fetch', 'leads', undefined, error);
}
*/

export default {
  ComponentLoggingExamples,
  QueueLoggingIntegration,
  MonitoringIntegration,
  ReactIntegrationExamples
}; 