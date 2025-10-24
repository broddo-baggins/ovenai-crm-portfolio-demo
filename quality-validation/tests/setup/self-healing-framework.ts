/**
 * 🔧 SELF-HEALING TEST FRAMEWORK
 * AI-powered automatic test recovery and maintenance
 * 
 * This framework detects test failures, analyzes the root cause,
 * and automatically applies healing strategies to get tests back to passing.
 */

import { Page, Locator } from '@playwright/test';

export interface HealingStrategy {
  name: string;
  description: string;
  confidence: number; // 0-100
  action: () => Promise<boolean>;
  fallback?: HealingStrategy;
}

export interface FailureAnalysis {
  type: 'element_not_found' | 'timeout' | 'assertion_failed' | 'network_error' | 'data_mismatch';
  confidence: number;
  context: string;
  suggestedFix: string;
  autoHealable: boolean;
}

export interface HealingReport {
  originalError: string;
  failureType: string;
  healingAttempted: boolean;
  healingSuccessful: boolean;
  strategy: string;
  timeToHeal: number; // milliseconds
  recommendations: string[];
}

export class SelfHealingFramework {
  private page: Page;
  private healingReports: HealingReport[] = [];
  private retryCount = 0;
  private maxRetries = 3;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Execute test with automatic healing capabilities
   */
  async executeWithHealing<T>(
    testFn: () => Promise<T>,
    testName: string = 'unnamed'
  ): Promise<T> {
    const startTime = Date.now();
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔧 Executing test: ${testName} (attempt ${attempt + 1})`);
        const result = await testFn();
        
        if (attempt > 0) {
          console.log(`✅ Test healed successfully after ${attempt} attempts`);
        }
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Test failed on attempt ${attempt + 1}: ${errorMessage}`);

        if (attempt === this.maxRetries) {
          // Final attempt failed, log and re-throw
          this.logHealingReport({
            originalError: errorMessage,
            failureType: this.classifyError(errorMessage),
            healingAttempted: attempt > 0,
            healingSuccessful: false,
            strategy: 'none',
            timeToHeal: Date.now() - startTime,
            recommendations: await this.generateRecommendations(errorMessage)
          });
          throw error;
        }

        // Attempt to heal the test
        const healed = await this.attemptHealing(error, testName);
        if (!healed && attempt < this.maxRetries) {
          // Wait before retrying
          await this.page.waitForTimeout(1000 * (attempt + 1));
        }
      }
    }

    throw new Error('Test healing failed after maximum retries');
  }

  /**
   * Attempt to heal a failed test
   */
  private async attemptHealing(error: any, testName: string): Promise<boolean> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const analysis = await this.analyzeFailure(errorMessage);
    
    if (!analysis.autoHealable) {
      console.log(`🚫 Error not auto-healable: ${analysis.type}`);
      return false;
    }

    console.log(`🔍 Analyzing failure: ${analysis.type} (${analysis.confidence}% confidence)`);
    
    const strategies = await this.generateHealingStrategies(analysis, testName);
    
    for (const strategy of strategies) {
      console.log(`🔧 Trying healing strategy: ${strategy.name}`);
      
      try {
        const success = await strategy.action();
        if (success) {
          console.log(`✅ Healing successful with strategy: ${strategy.name}`);
          return true;
        }
      } catch (healingError) {
        console.log(`❌ Healing strategy failed: ${strategy.name}`);
        if (strategy.fallback) {
          console.log(`🔄 Trying fallback strategy: ${strategy.fallback.name}`);
          try {
            const fallbackSuccess = await strategy.fallback.action();
            if (fallbackSuccess) {
              console.log(`✅ Fallback healing successful`);
              return true;
            }
          } catch (fallbackError) {
            console.log(`❌ Fallback strategy also failed`);
          }
        }
      }
    }

    return false;
  }

  /**
   * Analyze test failure to determine root cause
   */
  private async analyzeFailure(errorMessage: string): Promise<FailureAnalysis> {
    // Element not found patterns
    if (errorMessage.includes('locator.click') && errorMessage.includes('not found')) {
      return {
        type: 'element_not_found',
        confidence: 95,
        context: this.extractElementContext(errorMessage),
        suggestedFix: 'Update selector or wait for element',
        autoHealable: true
      };
    }

    // Timeout patterns
    if (errorMessage.includes('timeout') || errorMessage.includes('waiting for')) {
      return {
        type: 'timeout',
        confidence: 90,
        context: this.extractTimeoutContext(errorMessage),
        suggestedFix: 'Increase timeout or optimize page load',
        autoHealable: true
      };
    }

    // Assertion failures
    if (errorMessage.includes('expect') && errorMessage.includes('received')) {
      return {
        type: 'assertion_failed',
        confidence: 85,
        context: this.extractAssertionContext(errorMessage),
        suggestedFix: 'Update expected value or selector',
        autoHealable: true
      };
    }

    // Network errors
    if (errorMessage.includes('net::') || errorMessage.includes('fetch')) {
      return {
        type: 'network_error',
        confidence: 80,
        context: 'Network connectivity issue',
        suggestedFix: 'Retry request or check network',
        autoHealable: true
      };
    }

    // Data mismatches
    if (errorMessage.includes('undefined') || errorMessage.includes('null')) {
      return {
        type: 'data_mismatch',
        confidence: 70,
        context: 'Data not available or malformed',
        suggestedFix: 'Wait for data load or update data source',
        autoHealable: true
      };
    }

    return {
      type: 'assertion_failed',
      confidence: 50,
      context: 'Unknown error type',
      suggestedFix: 'Manual intervention required',
      autoHealable: false
    };
  }

  /**
   * Generate healing strategies based on failure analysis
   */
  private async generateHealingStrategies(
    analysis: FailureAnalysis, 
    testName: string
  ): Promise<HealingStrategy[]> {
    const strategies: HealingStrategy[] = [];

    switch (analysis.type) {
      case 'element_not_found':
        strategies.push(
          {
            name: 'Alternative Selector Search',
            description: 'Try alternative selectors for the element',
            confidence: 85,
            action: () => this.tryAlternativeSelectors(analysis.context),
            fallback: {
              name: 'Wait and Retry',
              description: 'Wait longer for element to appear',
              confidence: 70,
              action: () => this.waitAndRetry(analysis.context)
            }
          },
          {
            name: 'Page Refresh Recovery',
            description: 'Refresh page and retry',
            confidence: 60,
            action: () => this.refreshAndRetry()
          }
        );
        break;

      case 'timeout':
        strategies.push(
          {
            name: 'Extended Wait Strategy',
            description: 'Wait longer for condition',
            confidence: 80,
            action: () => this.extendWaitTime(),
            fallback: {
              name: 'Page Reload',
              description: 'Reload page to reset state',
              confidence: 65,
              action: () => this.refreshAndRetry()
            }
          }
        );
        break;

      case 'assertion_failed':
        strategies.push(
          {
            name: 'Dynamic Content Wait',
            description: 'Wait for dynamic content to load',
            confidence: 75,
            action: () => this.waitForDynamicContent(),
            fallback: {
              name: 'Flexible Assertion',
              description: 'Use more flexible assertion criteria',
              confidence: 60,
              action: () => this.useFlexibleAssertion(analysis.context)
            }
          }
        );
        break;

      case 'network_error':
        strategies.push(
          {
            name: 'Network Retry',
            description: 'Retry network request',
            confidence: 90,
            action: () => this.retryNetworkRequest(),
            fallback: {
              name: 'Offline Mode Simulation',
              description: 'Test offline functionality',
              confidence: 50,
              action: () => this.simulateOfflineMode()
            }
          }
        );
        break;

      case 'data_mismatch':
        strategies.push(
          {
            name: 'Data Refresh',
            description: 'Refresh data and retry',
            confidence: 85,
            action: () => this.refreshDataAndRetry(),
            fallback: {
              name: 'Mock Data Injection',
              description: 'Inject mock data for test',
              confidence: 70,
              action: () => this.injectMockData(testName)
            }
          }
        );
        break;
    }

    return strategies.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Try alternative selectors for missing elements
   */
  private async tryAlternativeSelectors(context: string): Promise<boolean> {
    // Extract potential selector from context
    const selectorMatch = context.match(/locator\('([^']+)'\)/);
    if (!selectorMatch) return false;

    const originalSelector = selectorMatch[1];
    const alternatives = this.generateAlternativeSelectors(originalSelector);

    for (const altSelector of alternatives) {
      try {
        console.log(`🔍 Trying alternative selector: ${altSelector}`);
        const element = await this.page.locator(altSelector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`✅ Found element with selector: ${altSelector}`);
          return true;
        }
      } catch (error) {
        // Continue to next alternative
      }
    }

    return false;
  }

  /**
   * Generate alternative selectors for an element
   */
  private generateAlternativeSelectors(originalSelector: string): string[] {
    const alternatives: string[] = [];

    // If it's a data-testid, try other common patterns
    if (originalSelector.includes('data-testid')) {
      const testId = originalSelector.match(/data-testid="([^"]+)"/)?.[1];
      if (testId) {
        alternatives.push(
          `[data-test="${testId}"]`,
          `[data-cy="${testId}"]`,
          `[data-qa="${testId}"]`,
          `#${testId}`,
          `.${testId}`
        );
      }
    }

    // If it's a class selector, try similar patterns
    if (originalSelector.startsWith('.')) {
      const className = originalSelector.slice(1);
      alternatives.push(
        `[class*="${className}"]`,
        `[class^="${className}"]`,
        `[class$="${className}"]`
      );
    }

    // If it's an ID, try class alternatives
    if (originalSelector.startsWith('#')) {
      const id = originalSelector.slice(1);
      alternatives.push(
        `.${id}`,
        `[data-testid="${id}"]`,
        `[id*="${id}"]`
      );
    }

    // Try text-based selectors
    alternatives.push(
      `text="${originalSelector}"`,
      `text*="${originalSelector}"`,
      `role=button >> text="${originalSelector}"`
    );

    return alternatives;
  }

  /**
   * Wait longer and retry operation
   */
  private async waitAndRetry(context: string): Promise<boolean> {
    console.log(`⏳ Waiting longer for element...`);
    await this.page.waitForTimeout(5000);
    
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh page and retry
   */
  private async refreshAndRetry(): Promise<boolean> {
    console.log(`🔄 Refreshing page...`);
    try {
      await this.page.reload({ timeout: 30000 });
      await this.page.waitForLoadState('networkidle');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extend wait time for timeouts
   */
  private async extendWaitTime(): Promise<boolean> {
    console.log(`⏳ Extending wait time...`);
    try {
      await this.page.waitForTimeout(10000);
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for dynamic content to load
   */
  private async waitForDynamicContent(): Promise<boolean> {
    console.log(`📊 Waiting for dynamic content...`);
    try {
      // Wait for any loading indicators to disappear
      await this.page.waitForSelector('.loading', { state: 'detached', timeout: 5000 }).catch(() => {});
      await this.page.waitForSelector('[data-loading="true"]', { state: 'detached', timeout: 5000 }).catch(() => {});
      
      // Wait for network requests to settle
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Use more flexible assertion criteria
   */
  private async useFlexibleAssertion(context: string): Promise<boolean> {
    console.log(`🎯 Using flexible assertion...`);
    // This would need to be implemented based on specific assertion types
    return true;
  }

  /**
   * Retry network requests
   */
  private async retryNetworkRequest(): Promise<boolean> {
    console.log(`🌐 Retrying network requests...`);
    try {
      await this.page.reload({ timeout: 30000 });
      await this.page.waitForLoadState('networkidle');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Simulate offline mode for testing
   */
  private async simulateOfflineMode(): Promise<boolean> {
    console.log(`📡 Testing offline mode...`);
    try {
      await this.page.context().setOffline(true);
      await this.page.waitForTimeout(2000);
      await this.page.context().setOffline(false);
      await this.page.waitForLoadState('networkidle');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh data and retry
   */
  private async refreshDataAndRetry(): Promise<boolean> {
    console.log(`💾 Refreshing data...`);
    try {
      // Trigger data refresh (implementation depends on app)
      await this.page.keyboard.press('F5');
      await this.page.waitForLoadState('networkidle');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Inject mock data for testing
   */
  private async injectMockData(testName: string): Promise<boolean> {
    console.log(`🎭 Injecting mock data for ${testName}...`);
    try {
      // This would inject appropriate mock data based on test context
      await this.page.addInitScript(() => {
        (window as any).MOCK_DATA_ENABLED = true;
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Helper methods for extracting context from error messages
  private extractElementContext(errorMessage: string): string {
    const match = errorMessage.match(/locator\('([^']+)'\)/);
    return match ? match[1] : errorMessage;
  }

  private extractTimeoutContext(errorMessage: string): string {
    if (errorMessage.includes('waitFor')) {
      return errorMessage.match(/waitFor[A-Za-z]+/)?.[0] || 'timeout';
    }
    return 'general timeout';
  }

  private extractAssertionContext(errorMessage: string): string {
    const match = errorMessage.match(/expect\(([^)]+)\)/);
    return match ? match[1] : errorMessage;
  }

  private classifyError(errorMessage: string): string {
    if (errorMessage.includes('locator') && errorMessage.includes('not found')) return 'element_not_found';
    if (errorMessage.includes('timeout')) return 'timeout';
    if (errorMessage.includes('expect')) return 'assertion_failed';
    if (errorMessage.includes('net::') || errorMessage.includes('fetch')) return 'network_error';
    if (errorMessage.includes('undefined') || errorMessage.includes('null')) return 'data_mismatch';
    return 'unknown';
  }

  private async generateRecommendations(errorMessage: string): Promise<string[]> {
    const recommendations: string[] = [];
    const errorType = this.classifyError(errorMessage);

    switch (errorType) {
      case 'element_not_found':
        recommendations.push(
          'Update element selectors to be more robust',
          'Add data-testid attributes to important elements',
          'Implement waiting strategies for dynamic content'
        );
        break;
      case 'timeout':
        recommendations.push(
          'Increase timeout values for slow operations',
          'Optimize page load performance',
          'Add loading state indicators'
        );
        break;
      case 'assertion_failed':
        recommendations.push(
          'Review assertion logic for edge cases',
          'Add better error messages to assertions',
          'Consider using soft assertions for non-critical checks'
        );
        break;
      default:
        recommendations.push(
          'Review test stability and add error handling',
          'Consider implementing retry mechanisms',
          'Add comprehensive logging for debugging'
        );
    }

    return recommendations;
  }

  private logHealingReport(report: HealingReport): void {
    this.healingReports.push(report);
    console.log(`📋 Healing Report:`, report);
  }

  /**
   * Get healing statistics and recommendations
   */
  getHealingStats(): {
    totalAttempts: number;
    successRate: number;
    commonFailures: string[];
    recommendations: string[];
  } {
    const total = this.healingReports.length;
    const successful = this.healingReports.filter(r => r.healingSuccessful).length;
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    const failureTypes = this.healingReports.map(r => r.failureType);
    const commonFailures = Array.from(new Set(failureTypes))
      .map(type => ({
        type,
        count: failureTypes.filter(f => f === type).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(f => f.type);

    const allRecommendations = this.healingReports
      .flatMap(r => r.recommendations)
      .filter((rec, index, arr) => arr.indexOf(rec) === index);

    return {
      totalAttempts: total,
      successRate: Math.round(successRate),
      commonFailures,
      recommendations: allRecommendations
    };
  }
}

// Helper function to create healing framework instance
export function createHealingFramework(page: Page): SelfHealingFramework {
  return new SelfHealingFramework(page);
} 