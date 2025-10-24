/**
 * 🔍 Admin Console Diagnostics for E2E Tests
 * 
 * This helper automatically detects admin console issues during test execution:
 * - Console errors related to admin functionality
 * - Missing database tables or RLS issues  
 * - Fake monitoring features still present
 * - Cookie consent API errors
 * - Admin permission issues
 * 
 * Usage in any E2E test:
 * 
 * ```typescript
 * import { AdminConsoleDiagnostics } from '../__helpers__/adminConsoleDiagnostics';
 * 
 * test('my test', async ({ page }) => {
 *   const diagnostics = new AdminConsoleDiagnostics(page);
 *   await diagnostics.startMonitoring();
 *   
 *   // Your test code here
 *   
 *   const issues = await diagnostics.getIssues();
 *   if (issues.length > 0) {
 *     console.warn('⚠️ Admin Console Issues Detected:', issues);
 *   }
 * });
 * ```
 */

import { Page } from '@playwright/test';

export interface AdminIssue {
  type: 'console_error' | 'network_error' | 'permission_error' | 'fake_feature' | 'database_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  url?: string;
  stack?: string;
  timestamp: Date;
}

export class AdminConsoleDiagnostics {
  private page: Page;
  private issues: AdminIssue[] = [];
  private monitoring = false;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Start monitoring for admin console issues
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoring) return;
    this.monitoring = true;

    // Monitor console errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.detectConsoleErrors(msg.text());
      } else if (msg.type() === 'warning') {
        this.detectConsoleWarnings(msg.text());
      }
    });

    // Monitor network failures
    this.page.on('response', (response) => {
      if (!response.ok() && response.status() >= 400) {
        this.detectNetworkErrors(response);
      }
    });

    // Monitor page errors
    this.page.on('pageerror', (error) => {
      this.detectPageErrors(error);
    });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.monitoring = false;
    this.page.removeAllListeners('console');
    this.page.removeAllListeners('response');
    this.page.removeAllListeners('pageerror');
  }

  /**
   * Get all detected issues
   */
  getIssues(): AdminIssue[] {
    return [...this.issues];
  }

  /**
   * Get issues by severity
   */
  getIssuesBySeverity(severity: AdminIssue['severity']): AdminIssue[] {
    return this.issues.filter(issue => issue.severity === severity);
  }

  /**
   * Check if admin console is accessible and working
   */
  async checkAdminConsoleHealth(): Promise<AdminIssue[]> {
    const adminIssues: AdminIssue[] = [];

    try {
      // Check if admin console loads
      await this.page.goto('/admin', { waitUntil: 'networkidle' });
      
      // Check for fake monitoring features
      const fakeFeatures = await this.page.evaluate(() => {
        const fakeIndicators = [];
        
        // Check for CPU/Memory fake metrics
        if (document.textContent?.includes('Math.random()') || 
            document.textContent?.includes('simulated for UI testing')) {
          fakeIndicators.push('Fake CPU/Memory metrics detected');
        }
        
        // Check for simulated database operations
        if (document.textContent?.includes('setTimeout(resolve, 2000)') ||
            document.textContent?.includes('simulated progress bars')) {
          fakeIndicators.push('Fake database operations detected');
        }

        // Check for real admin tabs
        const realTabs = ['Company Management', 'User Management', 'Usage Analytics', 'System Admin'];
        const fakeTabs = ['System Health', 'Monitoring', 'Scripts'];
        
        realTabs.forEach(tab => {
          if (!document.textContent?.includes(tab)) {
            fakeIndicators.push(`Missing real admin tab: ${tab}`);
          }
        });

        fakeTabs.forEach(tab => {
          if (document.textContent?.includes(tab)) {
            fakeIndicators.push(`Fake admin tab still present: ${tab}`);
          }
        });
        
        return fakeIndicators;
      });

      fakeFeatures.forEach(feature => {
        adminIssues.push({
          type: 'fake_feature',
          severity: 'high',
          message: feature,
          timestamp: new Date()
        });
      });

      // Check for admin permission issues
      const permissionErrors = await this.page.evaluate(() => {
        const errors = [];
        
        // Check for permission-related error messages
        if (document.textContent?.includes('not authorized') ||
            document.textContent?.includes('permission denied') ||
            document.textContent?.includes('access denied')) {
          errors.push('Admin permission issues detected');
        }
        
        return errors;
      });

      permissionErrors.forEach(error => {
        adminIssues.push({
          type: 'permission_error',
          severity: 'critical',
          message: error,
          timestamp: new Date()
        });
      });

    } catch (error) {
      adminIssues.push({
        type: 'console_error',
        severity: 'critical',
        message: `Admin console failed to load: ${error.message}`,
        timestamp: new Date()
      });
    }

    return adminIssues;
  }

  /**
   * Run comprehensive admin diagnostics
   */
  async runComprehensiveDiagnostics(): Promise<{
    issues: AdminIssue[];
    summary: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      total: number;
    };
    recommendations: string[];
  }> {
    await this.startMonitoring();
    
    // Run admin console health check
    const adminIssues = await this.checkAdminConsoleHealth();
    this.issues.push(...adminIssues);

    // Wait a bit to collect any runtime issues
    await this.page.waitForTimeout(2000);

    const summary = {
      critical: this.getIssuesBySeverity('critical').length,
      high: this.getIssuesBySeverity('high').length,
      medium: this.getIssuesBySeverity('medium').length,
      low: this.getIssuesBySeverity('low').length,
      total: this.issues.length
    };

    const recommendations = this.generateRecommendations();

    this.stopMonitoring();

    return {
      issues: this.getIssues(),
      summary,
      recommendations
    };
  }

  private detectConsoleErrors(message: string): void {
    const errorPatterns = [
      { pattern: /supabase.*400.*Bad Request/i, severity: 'high' as const, type: 'database_error' as const },
      { pattern: /cookie.*consent.*failed/i, severity: 'medium' as const, type: 'console_error' as const },
      { pattern: /user_settings.*does not exist/i, severity: 'high' as const, type: 'database_error' as const },
      { pattern: /admin.*not.*authorized/i, severity: 'critical' as const, type: 'permission_error' as const },
      { pattern: /monitoring.*service.*fake/i, severity: 'medium' as const, type: 'fake_feature' as const },
      { pattern: /Math\.random.*metrics/i, severity: 'high' as const, type: 'fake_feature' as const }
    ];

    for (const { pattern, severity, type } of errorPatterns) {
      if (pattern.test(message)) {
        this.issues.push({
          type,
          severity,
          message: `Console Error: ${message}`,
          timestamp: new Date()
        });
        break;
      }
    }
  }

  private detectConsoleWarnings(message: string): void {
    const warningPatterns = [
      { pattern: /failed to save cookie consent/i, severity: 'low' as const },
      { pattern: /tracking.*failed/i, severity: 'low' as const },
      { pattern: /fake.*data.*detected/i, severity: 'medium' as const }
    ];

    for (const { pattern, severity } of warningPatterns) {
      if (pattern.test(message)) {
        this.issues.push({
          type: 'console_error',
          severity,
          message: `Console Warning: ${message}`,
          timestamp: new Date()
        });
        break;
      }
    }
  }

  private detectNetworkErrors(response: any): void {
    const url = response.url();
    const status = response.status();
    
    // Check for specific admin-related network failures
    if (url.includes('/rest/v1/leads') && status === 400) {
      this.issues.push({
        type: 'network_error',
        severity: 'high',
        message: `Leads API 400 error (likely RLS policy issue): ${url}`,
        url,
        timestamp: new Date()
      });
    }

    if (url.includes('user_settings') || url.includes('user_app_preferences')) {
      this.issues.push({
        type: 'database_error',
        severity: 'high',
        message: `User settings table error (${status}): ${url}`,
        url,
        timestamp: new Date()
      });
    }

    if (url.includes('/admin') && status >= 500) {
      this.issues.push({
        type: 'network_error',
        severity: 'critical',
        message: `Admin console server error (${status}): ${url}`,
        url,
        timestamp: new Date()
      });
    }
  }

  private detectPageErrors(error: Error): void {
    const message = error.message;
    
    if (message.includes('admin') || message.includes('monitoring') || message.includes('console')) {
      this.issues.push({
        type: 'console_error',
        severity: 'high',
        message: `Page Error in Admin: ${message}`,
        stack: error.stack,
        timestamp: new Date()
      });
    }
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const fakeFeatureCount = this.issues.filter(i => i.type === 'fake_feature').length;
    const dbErrorCount = this.issues.filter(i => i.type === 'database_error').length;
    const permissionErrorCount = this.issues.filter(i => i.type === 'permission_error').length;

    if (fakeFeatureCount > 0) {
      recommendations.push('🎭 Remove all fake monitoring features (CPU/Memory/simulated operations)');
      recommendations.push('✅ Replace with RealAdminConsole.tsx for actual business management');
    }

    if (dbErrorCount > 0) {
      recommendations.push('🗃️ Fix database table issues (user_settings, RLS policies)');
      recommendations.push('⚡ Run database migration scripts to create missing tables');
    }

    if (permissionErrorCount > 0) {
      recommendations.push('🔒 Fix admin permission and role-based access issues');
      recommendations.push('👥 Ensure test user has proper admin role');
    }

    if (this.issues.length === 0) {
      recommendations.push('✅ Admin console is working correctly!');
    }

    return recommendations;
  }
}

/**
 * Quick diagnostic function for simple test integration
 */
export async function quickAdminDiagnostics(page: Page): Promise<AdminIssue[]> {
  const diagnostics = new AdminConsoleDiagnostics(page);
  const result = await diagnostics.runComprehensiveDiagnostics();
  
  if (result.issues.length > 0) {
    console.log('\n🔍 Admin Console Diagnostic Results:');
    console.log(`Total Issues: ${result.summary.total}`);
    console.log(`Critical: ${result.summary.critical}, High: ${result.summary.high}, Medium: ${result.summary.medium}, Low: ${result.summary.low}`);
    console.log('\n📝 Recommendations:');
    result.recommendations.forEach(rec => console.log(`  ${rec}`));
    console.log('\n⚠️ Issues:');
    result.issues.forEach(issue => {
      console.log(`  [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.message}`);
    });
  }

  return result.issues;
} 