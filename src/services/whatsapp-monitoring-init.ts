// @ts-nocheck
// TEMP: TypeScript compatibility issues - systematic fix needed

import WhatsAppMonitoringService from './whatsapp-monitoring';
import WhatsAppUptimeMonitoringService from './whatsapp-uptime-monitoring';

/**
 * WhatsApp Monitoring System Initialization
 * 
 * This script initializes the WhatsApp monitoring system for Meta App Provider
 * compliance tracking. It starts monitoring, sets up alerts, and ensures
 * continuous compliance monitoring.
 */

class WhatsAppMonitoringInit {
  private static monitoring: WhatsAppMonitoringService;
  private static uptimeMonitoring: WhatsAppUptimeMonitoringService;
  private static initialized = false;

  /**
   * Initialize the WhatsApp monitoring system
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      
      return;
    }

    try {
      console.log('INIT Initializing WhatsApp monitoring system for Meta compliance...');

      // Get monitoring service instances
      this.monitoring = WhatsAppMonitoringService.getInstance();
      this.uptimeMonitoring = WhatsAppUptimeMonitoringService.getInstance();

      // Start monitoring every 5 minutes
      this.monitoring.startMonitoring(5);
      
      // Start uptime monitoring every 2 minutes
      this.uptimeMonitoring.startMonitoring(2);

      // Set up graceful shutdown
      this.setupGracefulShutdown();

      // Mark as initialized
      this.initialized = true;

      
      console.log('NOTIFY Alerts configured for Meta compliance');
      console.log('STATS Dashboard available at /whatsapp-monitoring');

      // Log initial compliance status
      const [report, uptimeStatus] = await Promise.all([
        this.monitoring.getComplianceReport(),
        this.uptimeMonitoring.getUptimeStatus()
      ]);

      console.log('📋 Initial compliance status:', report.overallStatus);
      
      if (report.violations.length > 0) {
        console.warn('WARNING  Compliance violations detected:');
        report.violations.forEach(violation => {
          console.warn(`  - ${violation}`);
        });
      }

      if (uptimeStatus.status !== 'healthy') {
        console.warn('WARNING  Uptime issues detected:', uptimeStatus.message);
      }

      if (report.recommendations.length > 0) {
        console.log('IDEA Recommendations:');
        report.recommendations.forEach(rec => {
          console.log(`  - ${rec}`);
        });
      }

    } catch (error) {
      console.error('ERROR Failed to initialize WhatsApp monitoring:', error);
      
      // Don't throw error to avoid breaking main application
      // but log it for debugging
      console.error('Monitoring initialization failed, continuing without monitoring');
    }
  }

  /**
   * Stop monitoring system
   */
  static async stop(): Promise<void> {
    if (!this.initialized) {
      
      return;
    }

    try {
      console.log('⏹️ Stopping WhatsApp monitoring system...');

      // Stop monitoring services
      if (this.monitoring) {
        this.monitoring.stopMonitoring();
      }
      
      if (this.uptimeMonitoring) {
        this.uptimeMonitoring.stopMonitoring();
      }

      this.initialized = false;
      
    } catch (error) {
      console.error('ERROR Error stopping monitoring system:', error);
    }
  }

  /**
   * Restart monitoring system
   */
  static async restart(): Promise<void> {
    
    await this.stop();
    await this.initialize();
  }

  /**
   * Get current monitoring status
   */
  static async getStatus(): Promise<{
    initialized: boolean;
    monitoring: boolean;
    uptime: boolean;
    compliance: any;
    uptimeStatus: any;
  }> {
    if (!this.initialized) {
      return {
        initialized: false,
        monitoring: false,
        uptime: false,
        compliance: null,
        uptimeStatus: null
      };
    }

    try {
      const [compliance, uptimeStatus] = await Promise.all([
        this.monitoring.getComplianceReport(),
        this.uptimeMonitoring.getUptimeStatus()
      ]);

      return {
        initialized: true,
        monitoring: true,
        uptime: true,
        compliance,
        uptimeStatus
      };
    } catch (error) {
      console.error('ERROR Error getting monitoring status:', error);
      return {
        initialized: this.initialized,
        monitoring: false,
        uptime: false,
        compliance: null,
        uptimeStatus: null
      };
    }
  }

  /**
   * Get comprehensive monitoring data for dashboard
   */
  static async getDashboardData(): Promise<{
    qualityMetrics: any;
    uptimeMetrics: any;
    alerts: any[];
    compliance: any;
  }> {
    if (!this.initialized) {
      throw new Error('Monitoring system not initialized');
    }

    try {
      const [qualityData, uptimeStatus, uptimeAlerts] = await Promise.all([
        this.monitoring.getDashboardData(24),
        this.uptimeMonitoring.getUptimeStatus(),
        this.uptimeMonitoring.getRecentAlerts(24)
      ]);

      return {
        qualityMetrics: qualityData,
        uptimeMetrics: uptimeStatus.metrics,
        alerts: [...(qualityData.alerts || []), ...uptimeAlerts],
        compliance: qualityData.complianceStatus
      };
    } catch (error) {
      console.error('ERROR Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private static setupGracefulShutdown(): void {
    const shutdown = async () => {
      
      await this.stop();
      process.exit(0);
    };

    // Handle different shutdown signals
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('SIGQUIT', shutdown);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('ERROR Uncaught exception in monitoring system:', error);
      shutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('ERROR Unhandled rejection in monitoring system:', reason);
      shutdown();
    });
  }

  /**
   * Initialize in production environment
   */
  static async initializeInProduction(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      console.log('INIT Production environment detected, initializing monitoring...');
      await this.initialize();
    } else {
      console.log('TOOL Development environment, skipping automatic monitoring initialization');
    }
  }

  /**
   * Manual monitoring control methods
   */
  static async pauseMonitoring(): Promise<void> {
    if (this.monitoring) {
      this.monitoring.stopMonitoring();
    }
    if (this.uptimeMonitoring) {
      this.uptimeMonitoring.stopMonitoring();
    }
    console.log('⏸️ Monitoring paused');
  }

  static async resumeMonitoring(): Promise<void> {
    if (this.monitoring) {
      this.monitoring.startMonitoring(5);
    }
    if (this.uptimeMonitoring) {
      this.uptimeMonitoring.startMonitoring(2);
    }
    console.log('▶️ Monitoring resumed');
  }
}

export default WhatsAppMonitoringInit; 