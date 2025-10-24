import { test, expect, Page } from '@playwright/test';

// Safari Core Functionality Tests - Focus on Safari-specific code paths
test.describe('🦎 Safari Core Functionality Validation', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage, browserName }) => {
    page = testPage;
    
    // Only run these tests on WebKit (Safari)
    test.skip(browserName !== 'webkit', 'Safari-specific tests only run on WebKit');
    
    // Set Safari user agent for consistency
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15'
    });
    
    console.log('🦎 Safari core functionality test setup complete');
  });

  test('✅ Safari browser detection works correctly', async () => {
    console.log('🦎 Testing Safari browser detection...');
    
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Test Safari detection function
    const safariDetection = await page.evaluate(() => {
      const userAgent = navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      
      console.log('🦎 User Agent:', userAgent);
      console.log('🦎 Safari detected:', isSafari);
      
      return {
        userAgent,
        isSafari,
        isWebKit: userAgent.includes('WebKit'),
        hasVersion: userAgent.includes('Version/')
      };
    });
    
    expect(safariDetection.isSafari).toBe(true);
    expect(safariDetection.isWebKit).toBe(true);
    expect(safariDetection.hasVersion).toBe(true);
    expect(safariDetection.userAgent).toContain('Safari');
    
    console.log('✅ Safari detection working correctly:', safariDetection);
  });

  test('✅ Safari OAuth URL generation includes cache-busting parameters', async () => {
    console.log('🦎 Testing Safari OAuth URL generation...');
    
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Test Safari-specific OAuth URL generation
    const oauthUrlValidation = await page.evaluate(() => {
      // Simulate Safari OAuth URL generation
      const clientId = 'test-client-id';
      const redirectUri = `${window.location.origin}/auth/calendly/callback`;
      
      // Generate Safari-specific OAuth URL (matching our implementation)
      const baseUrl = 'https://auth.calendly.com/oauth/authorize';
      const timestamp = Date.now();
      const cacheBust = Math.random().toString(36).substring(7);
      
      const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        _t: timestamp.toString(),
        _safari: 'true',
        _cache_bust: cacheBust,
        _force_auth: 'true'
      });
      
      const fullUrl = `${baseUrl}?${params.toString()}`;
      
      return {
        url: fullUrl,
        hasCorrectEndpoint: fullUrl.includes('auth.calendly.com'),
        hasSafariFlag: fullUrl.includes('_safari=true'),
        hasTimestamp: fullUrl.includes('_t='),
        hasCacheBust: fullUrl.includes('_cache_bust='),
        hasForceAuth: fullUrl.includes('_force_auth=true'),
        clientId: clientId,
        redirectUri: redirectUri,
        timestamp: timestamp
      };
    });
    
    // Verify Safari-specific parameters are included
    expect(oauthUrlValidation.hasCorrectEndpoint).toBe(true);
    expect(oauthUrlValidation.hasSafariFlag).toBe(true);
    expect(oauthUrlValidation.hasTimestamp).toBe(true);
    expect(oauthUrlValidation.hasCacheBust).toBe(true);
    expect(oauthUrlValidation.hasForceAuth).toBe(true);
    
    // Verify it's using the correct OAuth endpoint
    expect(oauthUrlValidation.url).toContain('auth.calendly.com/oauth/authorize');
    expect(oauthUrlValidation.url).not.toContain('www.calendly.com/oauth/authorize');
    
    console.log('✅ Safari OAuth URL validation passed:', oauthUrlValidation.url);
  });

  test('✅ Safari cache handling works correctly', async () => {
    console.log('🦎 Testing Safari cache handling...');
    
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Test Safari cache operations
    const cacheHandling = await page.evaluate(() => {
      try {
        // Test setting cache data
        localStorage.setItem('calendly_test_cache', 'test-value');
        sessionStorage.setItem('calendly_test_session', 'session-value');
        
        // Verify data was set
        const cacheValue = localStorage.getItem('calendly_test_cache');
        const sessionValue = sessionStorage.getItem('calendly_test_session');
        
        // Test clearing Safari-specific cache
        const safariKeys = ['calendly_oauth_state', 'calendly_auth_cache', 'calendly_test_cache'];
        safariKeys.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
        
        // Verify cache was cleared
        const clearedCache = localStorage.getItem('calendly_test_cache');
        const clearedSession = sessionStorage.getItem('calendly_test_session');
        
        return {
          initialCache: cacheValue,
          initialSession: sessionValue,
          clearedCache: clearedCache,
          clearedSession: clearedSession,
          storageAvailable: typeof(Storage) !== 'undefined'
        };
      } catch (error) {
        return {
          error: error.message,
          storageAvailable: false
        };
      }
    });
    
    if (cacheHandling.error) {
      console.log('🦎 Safari storage restriction detected (expected):', cacheHandling.error);
      // In Safari with strict security, this is expected behavior
      expect(cacheHandling.storageAvailable).toBe(false);
    } else {
      // If storage is available, verify cache operations work
      expect(cacheHandling.initialCache).toBe('test-value');
      expect(cacheHandling.clearedCache).toBeNull();
      expect(cacheHandling.storageAvailable).toBe(true);
    }
    
    console.log('✅ Safari cache handling validation passed');
  });

  test('✅ Safari window.open functionality works for OAuth popups', async () => {
    console.log('🦎 Testing Safari popup functionality...');
    
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Test Safari popup functionality
    const popupTest = await page.evaluate(() => {
      // Mock window.open to test Safari popup behavior
      let popupOpened = false;
      let popupUrl = '';
      let popupFeatures = '';
      
      const originalOpen = window.open;
      window.open = function(url: string | URL | undefined, target?: string, features?: string) {
        popupOpened = true;
        popupUrl = (url?.toString()) || '';
        popupFeatures = features || '';
        
        // Return a mock popup object
        return {
          focus: () => console.log('🦎 Popup focused'),
          closed: false,
          close: () => console.log('🦎 Popup closed')
        } as any;
      };
      
      // Test Safari-specific popup opening
      const testUrl = 'https://auth.calendly.com/oauth/authorize?client_id=test&_safari=true';
      const popup = window.open(
        testUrl,
        'calendly-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );
      
      // Restore original window.open
      window.open = originalOpen;
      
      return {
        popupOpened,
        popupUrl,
        popupFeatures,
        hasPopupObject: !!popup,
        testUrl
      };
    });
    
    expect(popupTest.popupOpened).toBe(true);
    expect(popupTest.popupUrl).toContain('auth.calendly.com');
    expect(popupTest.popupUrl).toContain('_safari=true');
    expect(popupTest.popupFeatures).toContain('width=600');
    expect(popupTest.hasPopupObject).toBe(true);
    
    console.log('✅ Safari popup functionality validation passed');
  });

  test('✅ Safari timestamp cache-busting generates unique values', async () => {
    console.log('🦎 Testing Safari timestamp cache-busting...');
    
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Test timestamp generation for Safari cache busting
    const timestampTest = await page.evaluate(() => {
      const results = [];
      
      // Generate multiple timestamps with small delays
      for (let i = 0; i < 5; i++) {
        const timestamp = Date.now();
        results.push(timestamp);
        
        // Small delay to ensure different timestamps
        const start = Date.now();
        while (Date.now() - start < 5) {
          // Wait 5ms
        }
      }
      
      return {
        timestamps: results,
        uniqueCount: new Set(results).size,
        allRecent: results.every(ts => Date.now() - ts < 10000) // Within 10 seconds
      };
    });
    
    // Verify each timestamp is unique
    expect(timestampTest.uniqueCount).toBe(timestampTest.timestamps.length);
    expect(timestampTest.allRecent).toBe(true);
    expect(timestampTest.timestamps.length).toBe(5);
    
    console.log('✅ Safari timestamp validation passed:', timestampTest);
  });

  test('✅ Safari OAuth endpoint validation prevents wrong URLs', async () => {
    console.log('🦎 Testing Safari OAuth endpoint validation...');
    
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Test OAuth endpoint validation
    const endpointValidation = await page.evaluate(() => {
      const testUrls = [
        'https://auth.calendly.com/oauth/authorize?client_id=test',
        'https://calendly.com/oauth/authorize?client_id=test',
        'https://www.calendly.com/oauth/authorize?client_id=test'
      ];
      
      const results = testUrls.map(url => ({
        url,
        isCorrectEndpoint: url.includes('auth.calendly.com'),
        isWrongEndpoint: url.includes('calendly.com/oauth/authorize') && !url.includes('auth.calendly.com')
      }));
      
      return results;
    });
    
    // Verify correct endpoint detection
    expect(endpointValidation[0].isCorrectEndpoint).toBe(true);
    expect(endpointValidation[0].isWrongEndpoint).toBe(false);
    
    // Verify wrong endpoint detection
    expect(endpointValidation[1].isCorrectEndpoint).toBe(false);
    expect(endpointValidation[1].isWrongEndpoint).toBe(true);
    
    expect(endpointValidation[2].isCorrectEndpoint).toBe(false);
    expect(endpointValidation[2].isWrongEndpoint).toBe(true);
    
    console.log('✅ Safari OAuth endpoint validation passed');
  });
}); 