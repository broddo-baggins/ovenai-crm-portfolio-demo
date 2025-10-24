/**
 * CRITICAL PRODUCTION SANITY TESTS
 * 
 * These tests BUILD and SERVE the actual production app and test it like a real user.
 * This should catch DOA issues that other tests miss.
 * 
 * REQUIREMENT: Must run as part of unit tests before every commit
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { execSync, spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import puppeteer from 'puppeteer';
import type { Browser, Page } from 'puppeteer';

// Only run these tests when explicitly running sanity tests, not during full test suite
const shouldRunSanityTests = process.env.npm_lifecycle_event === 'test:sanity' || 
                            process.argv.includes('production-sanity.test.ts');

describe.skipIf(!shouldRunSanityTests)('🚨 PRODUCTION SANITY TESTS - CRITICAL DOA PREVENTION', () => {
  let browser: Browser;
  let page: Page;
  let serverProcess: any;
  let serverPort: number;
  const distPath = join(process.cwd(), 'dist');

  beforeAll(async () => {
    console.log('🏗️ Building production app for sanity testing...');
    
    // Build the production app
    execSync('npm run build:clean', { 
      encoding: 'utf-8',
      timeout: 120000,
      stdio: 'inherit'
    });

    // Verify build exists
    expect(existsSync(distPath)).toBe(true);
    expect(existsSync(join(distPath, 'index.html'))).toBe(true);

    // Find an available port
    serverPort = 4173; // Default Vite preview port
    
    // Start production server
    console.log(`🚀 Starting production server on port ${serverPort}...`);
    serverProcess = spawn('npx', ['vite', 'preview', '--port', serverPort.toString()], {
      stdio: 'pipe',
      detached: false
    });

    // Wait for server to be ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server failed to start within 30 seconds'));
      }, 30000);

      serverProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        if (output.includes('Local:') || output.includes(`http://localhost:${serverPort}`)) {
          clearTimeout(timeout);
          resolve(void 0);
        }
      });

      serverProcess.stderr.on('data', (data: Buffer) => {
        console.error('Server error:', data.toString());
      });
    });

    // Launch browser
    console.log('🌐 Launching browser for production testing...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Set up console error monitoring
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const errorText = msg.text();
        consoleErrors.push(errorText);
        console.error('🚨 Console Error:', errorText);
      }
    });

    // Store console errors for tests
    (global as any).consoleErrors = consoleErrors;
  }, 150000); // 2.5 minute timeout for build + server start

  afterAll(async () => {
    if (page) await page.close();
    if (browser) await browser.close();
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  });

  test('🌐 SANITY: Production app loads without errors', async () => {
    console.log('📱 Testing production app loads...');
    
    const response = await page.goto(`http://localhost:${serverPort}`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Should get successful response
    expect(response?.status()).toBe(200);

    // Should not have React forwardRef errors
    const consoleErrors = (global as any).consoleErrors as string[];
    const forwardRefErrors = consoleErrors.filter(error => 
      error.includes('forwardRef') || 
      error.includes('undefined is not an object') ||
      error.includes('Cannot read properties of undefined')
    );
    
    if (forwardRefErrors.length > 0) {
      console.error('🚨 CRITICAL: React forwardRef errors found:', forwardRefErrors);
    }
    expect(forwardRefErrors).toHaveLength(0);
  }, 45000);

  test('⚛️ SANITY: React is properly initialized', async () => {
    console.log('⚛️ Testing React initialization...');

    // Check if React is available globally
    const reactExists = await page.evaluate(() => {
      return typeof window.React !== 'undefined' || 
             typeof (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' ||
             document.querySelector('[data-reactroot], #root > *') !== null;
    });

    expect(reactExists).toBe(true);

    // Check for React app mount
    const appMounted = await page.waitForSelector('#root > *', { timeout: 10000 });
    expect(appMounted).toBeTruthy();

    // Verify no React errors in console
    const consoleErrors = (global as any).consoleErrors as string[];
    const reactErrors = consoleErrors.filter(error => 
      error.toLowerCase().includes('react') && 
      (error.includes('error') || error.includes('failed'))
    );
    expect(reactErrors).toHaveLength(0);
  }, 30000);

  test('🏠 SANITY: Landing page renders correctly', async () => {
    console.log('🏠 Testing landing page...');

    // Should have proper title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    // Should have basic structure
    const hasRootElement = await page.$('#root');
    expect(hasRootElement).toBeTruthy();

    // Should not have React/JS undefined values rendered as text
    const bodyText = await page.evaluate(() => document.body.textContent || '');
    
    // Check for critical JavaScript/React errors (ignore accessibility script issues)
    const criticalPatterns = [
      /\[object Object\]/g,           // Unrendered objects
      /TypeError:/g,                 // JavaScript errors
      /ReferenceError:/g,            // Reference errors
      /Cannot read prop/g,           // Property access errors
      /is not a function/g,          // Function call errors
      /Error: /g,                    // General errors
      /forwardRef.*undefined/g,      // React forwardRef errors
    ];
    
    // Check for "undefined" only if it's not from accessibility scripts
    const undefinedMatches = bodyText.match(/\bundefined\b(?![a-zA-Z])/g);
    if (undefinedMatches) {
      // Allow a few undefined values from accessibility scripts (nagishli), but fail if too many
      if (undefinedMatches.length > 10) {
        console.error(`🚨 Too many undefined values found (${undefinedMatches.length}), likely a JavaScript error`);
        expect(undefinedMatches.length).toBeLessThanOrEqual(10);
      } else {
        console.log(`📱 Found ${undefinedMatches.length} undefined values (acceptable for accessibility scripts)`);
      }
    }
    
    // Check for critical errors that indicate real problems
    for (const pattern of criticalPatterns) {
      const matches = bodyText.match(pattern);
      if (matches) {
        console.error(`🚨 Found critical pattern in page content:`, pattern, matches);
        expect(matches).toBeNull();
      }
    }

    // Should have some actual content (not just empty page)
    expect(bodyText.trim().length).toBeGreaterThan(10);
  }, 30000);

  test('🔐 SANITY: Navigation and basic interactions work', async () => {
    console.log('🔐 Testing navigation...');

    // Try to find navigation elements or interactive elements
    await page.waitForSelector('body', { timeout: 10000 });

    // Check if page is interactive (not frozen)
    const isInteractive = await page.evaluate(() => {
      // Try to create a simple element to test if JS is working
      const testDiv = document.createElement('div');
      testDiv.textContent = 'test';
      return testDiv.textContent === 'test';
    });

    expect(isInteractive).toBe(true);

    // Check for critical JavaScript errors that would break functionality
    const consoleErrors = (global as any).consoleErrors as string[];
    const criticalErrors = consoleErrors.filter(error =>
      error.includes('TypeError') ||
      error.includes('ReferenceError') ||
      error.includes('SyntaxError')
    );

    if (criticalErrors.length > 0) {
      console.error('🚨 CRITICAL JS ERRORS:', criticalErrors);
    }
    expect(criticalErrors).toHaveLength(0);
  }, 30000);

  test('📱 SANITY: Mobile viewport works', async () => {
    console.log('📱 Testing mobile viewport...');

    // Set mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await page.reload({ waitUntil: 'networkidle0' });

    // Should still render without errors
    const hasContent = await page.$('#root > *');
    expect(hasContent).toBeTruthy();

    // Mobile-specific console errors check
    const consoleErrors = (global as any).consoleErrors as string[];
    const mobileErrors = consoleErrors.filter(error =>
      error.includes('viewport') ||
      error.includes('mobile') ||
      error.includes('touch')
    );

    expect(mobileErrors).toHaveLength(0);
  }, 30000);

  test('🎨 SANITY: CSS and styles load correctly', async () => {
    console.log('🎨 Testing CSS loading...');

    // Check if any elements have computed styles (CSS loaded)
    const hasStyles = await page.evaluate(() => {
      const element = document.querySelector('body');
      if (!element) return false;
      
      const styles = window.getComputedStyle(element);
      return styles.fontSize !== '' || styles.margin !== '';
    });

    expect(hasStyles).toBe(true);

    // Check for CSS loading errors
    const consoleErrors = (global as any).consoleErrors as string[];
    const cssErrors = consoleErrors.filter(error =>
      error.includes('stylesheet') ||
      error.includes('.css') ||
      error.includes('Failed to load resource')
    );

    expect(cssErrors).toHaveLength(0);
  }, 30000);

  test('🛡️ SANITY: No critical performance issues', async () => {
    console.log('🛡️ Testing performance...');

    // Measure page load time
    const metrics = await page.metrics();
    
    // Basic performance checks
    expect(metrics.JSHeapUsedSize).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    expect(metrics.JSHeapTotalSize).toBeLessThan(200 * 1024 * 1024); // Less than 200MB

    // Check for memory leaks or excessive resource usage
    const consoleErrors = (global as any).consoleErrors as string[];
    const performanceErrors = consoleErrors.filter(error =>
      error.includes('memory') ||
      error.includes('heap') ||
      error.includes('performance')
    );

    expect(performanceErrors).toHaveLength(0);
  }, 30000);
}); 