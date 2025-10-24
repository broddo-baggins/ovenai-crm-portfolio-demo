/**
 * 📱 MOBILE TESTING FRAMEWORK
 * Comprehensive cross-device testing with touch interactions and performance monitoring
 * 
 * This framework provides automated testing across multiple mobile devices,
 * handling touch gestures, orientation changes, and mobile-specific performance metrics.
 */

import { test, expect, devices, Page, BrowserContext } from '@playwright/test';

export interface DeviceConfig {
  name: string;
  device: any; // Playwright device descriptor
  viewport: { width: number; height: number };
  userAgent: string;
  platform: 'iOS' | 'Android';
  orientation: 'portrait' | 'landscape';
}

export interface TouchInteraction {
  type: 'tap' | 'doubleTap' | 'longPress' | 'swipe' | 'pinch' | 'scroll';
  element?: string;
  coordinates?: { x: number; y: number };
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  duration?: number;
}

export interface MobileTestResult {
  device: string;
  test: string;
  passed: boolean;
  duration: number;
  screenshots: string[];
  performanceMetrics: {
    loadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
  };
  touchInteractions: TouchInteraction[];
  errors: string[];
}

export interface CoreWebVitals {
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay  
  CLS: number; // Cumulative Layout Shift
  FCP: number; // First Contentful Paint
  TTFB: number; // Time to First Byte
}

export class MobileTestingFramework {
  private deviceConfigs: DeviceConfig[] = [
    {
      name: 'iPhone 13 Pro',
      device: devices['iPhone 13 Pro'],
      viewport: { width: 390, height: 844 },
      userAgent: devices['iPhone 13 Pro'].userAgent,
      platform: 'iOS',
      orientation: 'portrait'
    },
    {
      name: 'iPhone 13 Pro Landscape',
      device: devices['iPhone 13 Pro landscape'],
      viewport: { width: 844, height: 390 },
      userAgent: devices['iPhone 13 Pro landscape'].userAgent,
      platform: 'iOS',
      orientation: 'landscape'
    },
    {
      name: 'Samsung Galaxy S21',
      device: devices['Galaxy S5'],
      viewport: { width: 360, height: 640 },
      userAgent: devices['Galaxy S5'].userAgent,
      platform: 'Android',
      orientation: 'portrait'
    },
    {
      name: 'Samsung Galaxy S21 Landscape',
      device: devices['Galaxy S5 landscape'],
      viewport: { width: 640, height: 360 },
      userAgent: devices['Galaxy S5 landscape'].userAgent,
      platform: 'Android',
      orientation: 'landscape'
    },
    {
      name: 'iPad Pro',
      device: devices['iPad Pro'],
      viewport: { width: 1024, height: 1366 },
      userAgent: devices['iPad Pro'].userAgent,
      platform: 'iOS',
      orientation: 'portrait'
    },
    {
      name: 'Galaxy Tab S4',
      device: devices['Galaxy S5'], // Using Galaxy S5 as base for Android tablet
      viewport: { width: 712, height: 1138 },
      userAgent: devices['Galaxy S5'].userAgent,
      platform: 'Android',
      orientation: 'portrait'
    }
  ];

  private testResults: MobileTestResult[] = [];

  /**
   * Run comprehensive mobile test suite across all devices
   */
  async runMobileTestSuite(
    testFunctions: Array<{
      name: string;
      fn: (page: Page, device: DeviceConfig) => Promise<void>;
    }>,
    options: {
      capturePerformance?: boolean;
      takeScreenshots?: boolean;
      testOffline?: boolean;
    } = {}
  ): Promise<MobileTestResult[]> {
    console.log('📱 Starting comprehensive mobile test suite...');
    
    for (const deviceConfig of this.deviceConfigs) {
      console.log(`📱 Testing on device: ${deviceConfig.name}`);
      
      for (const testFunction of testFunctions) {
        console.log(`🧪 Running test: ${testFunction.name}`);
        
        const result = await this.runSingleMobileTest(
          testFunction,
          deviceConfig,
          options
        );
        
        this.testResults.push(result);
      }
    }

    return this.testResults;
  }

  /**
   * Run a single test on a specific device
   */
  private async runSingleMobileTest(
    testFunction: { name: string; fn: (page: Page, device: DeviceConfig) => Promise<void> },
    deviceConfig: DeviceConfig,
    options: {
      capturePerformance?: boolean;
      takeScreenshots?: boolean;
      testOffline?: boolean;
    }
  ): Promise<MobileTestResult> {
    const startTime = Date.now();
    const result: MobileTestResult = {
      device: deviceConfig.name,
      test: testFunction.name,
      passed: false,
      duration: 0,
      screenshots: [],
      performanceMetrics: {
        loadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0
      },
      touchInteractions: [],
      errors: []
    };

    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      // Create browser context with mobile device configuration
      context = await this.createMobileContext(deviceConfig);
      page = await context.newPage();

      // Set up performance monitoring if enabled
      if (options.capturePerformance) {
        await this.setupPerformanceMonitoring(page);
      }

      // Set up screenshot capture if enabled
      if (options.takeScreenshots) {
        await this.setupScreenshotCapture(page, result);
      }

      // Test offline functionality if enabled
      if (options.testOffline) {
        await this.testOfflineMode(page, deviceConfig);
      }

      // Run the actual test
      await testFunction.fn(page, deviceConfig);

      // Capture performance metrics
      if (options.capturePerformance) {
        result.performanceMetrics = await this.capturePerformanceMetrics(page);
      }

      result.passed = true;
      console.log(`✅ Test passed on ${deviceConfig.name}: ${testFunction.name}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      console.log(`❌ Test failed on ${deviceConfig.name}: ${testFunction.name} - ${errorMessage}`);
    } finally {
      result.duration = Date.now() - startTime;
      
      if (page) {
        await page.close();
      }
      if (context) {
        await context.close();
      }
    }

    return result;
  }

  /**
   * Create mobile browser context with device-specific settings
   */
  private async createMobileContext(deviceConfig: DeviceConfig): Promise<BrowserContext> {
    const { chromium } = require('@playwright/test');
    const browser = await chromium.launch();
    
    const context = await browser.newContext({
      ...deviceConfig.device,
      viewport: deviceConfig.viewport,
      userAgent: deviceConfig.userAgent,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: deviceConfig.platform === 'iOS' ? 3 : 2,
      locale: 'en-US',
      timezoneId: 'America/New_York'
    });

    return context;
  }

  /**
   * Setup performance monitoring for Core Web Vitals
   */
  private async setupPerformanceMonitoring(page: Page): Promise<void> {
    // Inject performance monitoring script
    await page.addInitScript(() => {
      // Monitor Core Web Vitals
      (window as any).performanceMetrics = {
        LCP: 0,
        FID: 0,
        CLS: 0,
        FCP: 0,
        TTFB: 0
      };

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          (window as any).performanceMetrics.LCP = entries[entries.length - 1].startTime;
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-input') {
            (window as any).performanceMetrics.FID = entry.processingStart - entry.startTime;
          }
        });
      }).observe({ entryTypes: ['event'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            (window as any).performanceMetrics.CLS = clsValue;
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });

      // First Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            (window as any).performanceMetrics.FCP = entry.startTime;
          }
        });
      }).observe({ entryTypes: ['paint'] });

      // Time to First Byte
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as any;
        if (navigation) {
          (window as any).performanceMetrics.TTFB = navigation.responseStart - navigation.requestStart;
        }
      });
    });
  }

  /**
   * Setup automatic screenshot capture
   */
  private async setupScreenshotCapture(page: Page, result: MobileTestResult): Promise<void> {
    // Take initial screenshot
    const initialScreenshot = await page.screenshot({ 
      path: `screenshots/mobile-${result.device}-${result.test}-initial.png`,
      fullPage: true 
    });
    result.screenshots.push('initial');

    // Setup automatic screenshot capture on errors
    page.on('pageerror', async (error) => {
      const errorScreenshot = await page.screenshot({ 
        path: `screenshots/mobile-${result.device}-${result.test}-error.png`,
        fullPage: true 
      });
      result.screenshots.push('error');
    });
  }

  /**
   * Test offline functionality
   */
  private async testOfflineMode(page: Page, deviceConfig: DeviceConfig): Promise<void> {
    console.log(`📡 Testing offline mode on ${deviceConfig.name}`);
    
    // Go offline
    await page.context().setOffline(true);
    
    try {
      // Test offline behavior
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Check for offline indicator
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
      if (await offlineIndicator.isVisible()) {
        console.log('✅ Offline indicator displayed correctly');
      }

      // Test cached content accessibility
      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();
      
    } finally {
      // Go back online
      await page.context().setOffline(false);
    }
  }

  /**
   * Capture comprehensive performance metrics
   */
  private async capturePerformanceMetrics(page: Page): Promise<MobileTestResult['performanceMetrics']> {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Extract performance metrics from the page
    const metrics = await page.evaluate(() => {
      const perf = (window as any).performanceMetrics || {};
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      
      return {
        loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
        firstContentfulPaint: perf.FCP || 0,
        largestContentfulPaint: perf.LCP || 0,
        cumulativeLayoutShift: perf.CLS || 0,
        firstInputDelay: perf.FID || 0
      };
    });

    return metrics;
  }

  /**
   * Perform touch interactions (tap, swipe, pinch, etc.)
   */
  async performTouchInteraction(
    page: Page, 
    interaction: TouchInteraction
  ): Promise<void> {
    console.log(`👆 Performing ${interaction.type} interaction`);

    switch (interaction.type) {
      case 'tap':
        if (interaction.element) {
          await page.locator(interaction.element).tap();
        } else if (interaction.coordinates) {
          await page.tap(`body`, { position: interaction.coordinates });
        }
        break;

      case 'doubleTap':
        if (interaction.element) {
          await page.locator(interaction.element).dblclick();
        } else if (interaction.coordinates) {
          await page.dblclick(`body`, { position: interaction.coordinates });
        }
        break;

      case 'longPress':
        if (interaction.element) {
          const element = page.locator(interaction.element);
          await element.hover();
          await page.mouse.down();
          await page.waitForTimeout(interaction.duration || 1000);
          await page.mouse.up();
        }
        break;

      case 'swipe':
        await this.performSwipeGesture(page, interaction);
        break;

      case 'pinch':
        await this.performPinchGesture(page, interaction);
        break;

      case 'scroll':
        await this.performScrollGesture(page, interaction);
        break;
    }
  }

  /**
   * Perform swipe gesture
   */
  private async performSwipeGesture(page: Page, interaction: TouchInteraction): Promise<void> {
    const viewport = page.viewportSize();
    if (!viewport) return;

    const startX = viewport.width / 2;
    const startY = viewport.height / 2;
    let endX = startX;
    let endY = startY;

    const distance = interaction.distance || 200;

    switch (interaction.direction) {
      case 'up':
        endY = startY - distance;
        break;
      case 'down':
        endY = startY + distance;
        break;
      case 'left':
        endX = startX - distance;
        break;
      case 'right':
        endX = startX + distance;
        break;
    }

    // Perform swipe
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 10 });
    await page.mouse.up();
  }

  /**
   * Perform pinch gesture (zoom)
   */
  private async performPinchGesture(page: Page, interaction: TouchInteraction): Promise<void> {
    // Simulate pinch-to-zoom using touch events
    await page.evaluate(() => {
      const target = document.documentElement;
      
      // Create touch events for pinch gesture
      const touch1Start = new Touch({
        identifier: 1,
        target: target,
        clientX: 100,
        clientY: 100,
        radiusX: 2.5,
        radiusY: 2.5,
        rotationAngle: 0,
        force: 0.5,
      });

      const touch2Start = new Touch({
        identifier: 2,
        target: target,
        clientX: 200,
        clientY: 200,
        radiusX: 2.5,
        radiusY: 2.5,
        rotationAngle: 0,
        force: 0.5,
      });

      const touchStartEvent = new TouchEvent('touchstart', {
        cancelable: true,
        bubbles: true,
        touches: [touch1Start, touch2Start],
        targetTouches: [touch1Start, touch2Start],
        changedTouches: [touch1Start, touch2Start],
      });

      target.dispatchEvent(touchStartEvent);

      // Simulate pinch movement
      setTimeout(() => {
        const touch1End = new Touch({
          identifier: 1,
          target: target,
          clientX: 50,  // Move fingers closer together
          clientY: 50,
          radiusX: 2.5,
          radiusY: 2.5,
          rotationAngle: 0,
          force: 0.5,
        });

        const touch2End = new Touch({
          identifier: 2,
          target: target,
          clientX: 250,  // Move fingers further apart
          clientY: 250,
          radiusX: 2.5,
          radiusY: 2.5,
          rotationAngle: 0,
          force: 0.5,
        });

        const touchEndEvent = new TouchEvent('touchend', {
          cancelable: true,
          bubbles: true,
          touches: [],
          targetTouches: [],
          changedTouches: [touch1End, touch2End],
        });

        target.dispatchEvent(touchEndEvent);
      }, 100);
    });
  }

  /**
   * Perform scroll gesture
   */
  private async performScrollGesture(page: Page, interaction: TouchInteraction): Promise<void> {
    if (interaction.element) {
      const element = page.locator(interaction.element);
      await element.hover();
    }

    const distance = interaction.distance || 300;
    const direction = interaction.direction || 'down';

    switch (direction) {
      case 'up':
        await page.mouse.wheel(0, -distance);
        break;
      case 'down':
        await page.mouse.wheel(0, distance);
        break;
      case 'left':
        await page.mouse.wheel(-distance, 0);
        break;
      case 'right':
        await page.mouse.wheel(distance, 0);
        break;
    }
  }

  /**
   * Test orientation changes
   */
  async testOrientationChange(
    page: Page,
    testFn: (orientation: 'portrait' | 'landscape') => Promise<void>
  ): Promise<void> {
    console.log('🔄 Testing orientation changes...');

    // Test portrait mode
    await page.setViewportSize({ width: 390, height: 844 });
    console.log('📱 Testing in portrait mode');
    await testFn('portrait');

    // Test landscape mode  
    await page.setViewportSize({ width: 844, height: 390 });
    console.log('📱 Testing in landscape mode');
    await testFn('landscape');
  }

  /**
   * Generate comprehensive mobile testing report
   */
  generateMobileTestReport(): {
    summary: string;
    deviceResults: Record<string, { passed: number; failed: number; avgDuration: number }>;
    performanceSummary: {
      avgLoadTime: number;
      avgLCP: number;
      avgCLS: number;
      coreWebVitalsPass: number;
    };
    recommendations: string[];
  } {
    const deviceResults: Record<string, { passed: number; failed: number; avgDuration: number }> = {};
    
    // Analyze results by device
    this.deviceConfigs.forEach(device => {
      const deviceTests = this.testResults.filter(r => r.device === device.name);
      const passed = deviceTests.filter(t => t.passed).length;
      const failed = deviceTests.filter(t => !t.passed).length;
      const avgDuration = deviceTests.reduce((sum, t) => sum + t.duration, 0) / deviceTests.length;
      
      deviceResults[device.name] = { passed, failed, avgDuration };
    });

    // Calculate performance metrics
    const validResults = this.testResults.filter(r => r.passed);
    const avgLoadTime = validResults.reduce((sum, r) => sum + r.performanceMetrics.loadTime, 0) / validResults.length;
    const avgLCP = validResults.reduce((sum, r) => sum + r.performanceMetrics.largestContentfulPaint, 0) / validResults.length;
    const avgCLS = validResults.reduce((sum, r) => sum + r.performanceMetrics.cumulativeLayoutShift, 0) / validResults.length;
    
    // Core Web Vitals pass rate (LCP < 2.5s, CLS < 0.1)
    const passedVitals = validResults.filter(r => 
      r.performanceMetrics.largestContentfulPaint < 2500 && 
      r.performanceMetrics.cumulativeLayoutShift < 0.1
    ).length;
    const coreWebVitalsPass = (passedVitals / validResults.length) * 100;

    // Generate recommendations
    const recommendations: string[] = [];
    if (avgLCP > 2500) {
      recommendations.push('Optimize Largest Contentful Paint - consider image optimization and lazy loading');
    }
    if (avgCLS > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift - reserve space for dynamic content');
    }
    if (avgLoadTime > 3000) {
      recommendations.push('Improve load time - optimize bundle size and implement code splitting');
    }

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;

    return {
      summary: `Mobile testing complete: ${passedTests}/${totalTests} tests passed across ${this.deviceConfigs.length} devices`,
      deviceResults,
      performanceSummary: {
        avgLoadTime: Math.round(avgLoadTime),
        avgLCP: Math.round(avgLCP),
        avgCLS: Math.round(avgCLS * 1000) / 1000,
        coreWebVitalsPass: Math.round(coreWebVitalsPass)
      },
      recommendations
    };
  }

  /**
   * Reset test results for new test run
   */
  reset(): void {
    this.testResults = [];
  }
} 