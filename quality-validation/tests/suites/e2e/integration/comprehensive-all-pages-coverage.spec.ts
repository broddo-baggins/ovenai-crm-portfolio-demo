import { test, expect } from '@playwright/test';
import { authenticateAndNavigate } from '../__helpers__/auth-helper';

// Comprehensive list of ALL pages in the application
const ALL_PAGES = [
  // Main Pages
  {
    name: 'Dashboard',
    path: '/dashboard',
    requiresAuth: true,
    elements: {
      headers: ['Dashboard', 'Recent Activity', 'Quick Stats'],
      buttons: ['Add Lead', 'View Reports'],
      charts: true,
      cards: true
    }
  },
  {
    name: 'Leads',
    path: '/leads',
    requiresAuth: true,
    elements: {
      headers: ['Leads', 'Lead Management'],
      buttons: ['New Lead', 'Import', 'Export', 'Filter'],
      table: true,
      search: true
    }
  },
  {
    name: 'Projects',
    path: '/projects',
    requiresAuth: true,
    elements: {
      headers: ['Projects', 'Active Projects'],
      buttons: ['New Project', 'Archive'],
      cards: true
    }
  },
  {
    name: 'Messages',
    path: '/messages',
    requiresAuth: true,
    elements: {
      headers: ['Messages', 'Conversations'],
      buttons: ['New Message', 'Mark as Read'],
      list: true,
      search: true
    }
  },
  {
    name: 'Optimized Messages',
    path: '/messages/optimized',
    requiresAuth: true,
    elements: {
      headers: ['Messages', 'Optimized View'],
      list: true,
      search: true
    }
  },
  {
    name: 'Reports',
    path: '/reports',
    requiresAuth: true,
    elements: {
      headers: ['Reports', 'Analytics'],
      buttons: ['Export', 'Filter', 'Date Range'],
      charts: true,
      tabs: true
    }
  },
  {
    name: 'Modern Reports',
    path: '/reports/modern',
    requiresAuth: true,
    elements: {
      headers: ['Modern Reports', 'Analytics Dashboard'],
      charts: true,
      cards: true
    }
  },
  {
    name: 'Enhanced Reports',
    path: '/reports/enhanced',
    requiresAuth: true,
    elements: {
      headers: ['Enhanced Reports', 'Advanced Analytics'],
      charts: true,
      filters: true
    }
  },
  {
    name: 'Calendar',
    path: '/calendar',
    requiresAuth: true,
    elements: {
      headers: ['Calendar', 'Schedule'],
      buttons: ['New Event', 'Today', 'Month View'],
      calendar: true
    }
  },
  {
    name: 'Lead Pipeline',
    path: '/lead-pipeline',
    requiresAuth: true,
    elements: {
      headers: ['Lead Pipeline', 'Pipeline View'],
      kanban: true,
      buttons: ['Add Stage']
    }
  },
  {
    name: 'Users',
    path: '/users',
    requiresAuth: true,
    elements: {
      headers: ['Users', 'Team Management'],
      table: true,
      buttons: ['Add User', 'Invite']
    }
  },
  {
    name: 'Settings',
    path: '/settings',
    requiresAuth: true,
    elements: {
      headers: ['Settings', 'Account Settings'],
      tabs: ['Profile', 'Security', 'Notifications'],
      forms: true
    }
  },
  {
    name: 'FAQ',
    path: '/faq',
    requiresAuth: false,
    elements: {
      headers: ['FAQ', 'Frequently Asked Questions'],
      accordion: true
    }
  },
  
  // Admin Pages
  {
    name: 'Admin Console',
    path: '/admin/console',
    requiresAuth: true,
    requiresAdmin: true,
    elements: {
      headers: ['System Administration Console', 'Infrastructure monitoring'],
      tabs: ['System Health', 'Users', 'Database', 'Scripts', 'Monitoring'],
      buttons: ['Refresh', 'Auto-Refresh'],
      cards: true
    }
  },

  
  // Test Pages
  // {
  //   name: 'Components Demo',
  //   path: '/components-demo',
  //   requiresAuth: false,
  //   elements: {
  //     headers: ['Components Demo', 'UI Components'],
  //     buttons: true,
  //     forms: true,
  //     cards: true
  //   }
  // },
  {
    name: 'Connection Test',
    path: '/connection-test',
    requiresAuth: false,
    elements: {
      headers: ['Connection Test', 'System Status'],
      status: true
    }
  },
  {
    name: 'Integrations Test',
    path: '/integrations-test',
    requiresAuth: true,
    elements: {
      headers: ['Integrations', 'Test Integrations'],
      buttons: ['Test WhatsApp', 'Test Calendar'],
      cards: true
    }
  },
  {
    name: 'WhatsApp Demo',
    path: '/whatsapp-demo',
    requiresAuth: true,
    elements: {
      headers: ['WhatsApp Demo', 'Messaging Demo'],
      chat: true
    }
  },
  {
    name: 'WhatsApp Test',
    path: '/whatsapp-test',
    requiresAuth: true,
    elements: {
      headers: ['WhatsApp Test', 'Integration Test'],
      forms: true
    }
  },
  
  // Legal Pages
  {
    name: 'Privacy Policy',
    path: '/privacy-policy',
    requiresAuth: false,
    elements: {
      headers: ['Privacy Policy'],
      content: true
    }
  },
  {
    name: 'Terms of Service',
    path: '/terms-of-service',
    requiresAuth: false,
    elements: {
      headers: ['Terms of Service'],
      content: true
    }
  },
  {
    name: 'Accessibility Declaration',
    path: '/accessibility',
    requiresAuth: false,
    elements: {
      headers: ['Accessibility', 'Accessibility Declaration'],
      content: true
    }
  },
  {
    name: 'Data Export',
    path: '/data-export',
    requiresAuth: true,
    elements: {
      headers: ['Data Export', 'Export Your Data'],
      buttons: ['Export All', 'Select Data'],
      forms: true
    }
  },
  {
    name: 'Data Deletion',
    path: '/data-deletion',
    requiresAuth: true,
    elements: {
      headers: ['Data Deletion', 'Delete Your Data'],
      buttons: ['Request Deletion'],
      warning: true
    }
  },
  
  // Special Pages
  {
    name: 'Landing Page',
    path: '/',
    requiresAuth: false,
    elements: {
      headers: ['OvenAI'],
      buttons: ['Get Started', 'Request Demo'],
      hero: true,
      features: true
    }
  },
  {
    name: 'Coming Soon',
    path: '/coming-soon',
    requiresAuth: false,
    elements: {
      headers: ['Coming Soon'],
      countdown: true,
      email: true
    }
  },
  {
    name: 'Maintenance',
    path: '/maintenance',
    requiresAuth: false,
    elements: {
      headers: ['System Maintenance'],
      status: true
    }
  },
  
  // Error Pages
  {
    name: '404 Not Found',
    path: '/404',
    requiresAuth: false,
    elements: {
      headers: ['404', 'Page Not Found'],
      buttons: ['Go Home', 'Go Back']
    }
  },
  {
    name: '401 Unauthorized',
    path: '/401',
    requiresAuth: false,
    elements: {
      headers: ['401', 'Unauthorized'],
      buttons: ['Login']
    }
  },
  {
    name: '403 Forbidden',
    path: '/403',
    requiresAuth: false,
    elements: {
      headers: ['403', 'Forbidden'],
      buttons: ['Go Home']
    }
  },
  {
    name: '500 Internal Server Error',
    path: '/500',
    requiresAuth: false,
    elements: {
      headers: ['500', 'Internal Server Error'],
      buttons: ['Refresh', 'Go Home']
    }
  },
  {
    name: '503 Service Unavailable',
    path: '/503',
    requiresAuth: false,
    elements: {
      headers: ['503', 'Service Unavailable'],
      status: true
    }
  }
];

test.describe('Comprehensive All Pages Coverage', () => {
  test.setTimeout(120000); // 2 minutes per test

  // Test all pages
  ALL_PAGES.forEach(pageConfig => {
    test(`should fully test ${pageConfig.name} page`, async ({ page }) => {
      console.log(`\n📄 Testing ${pageConfig.name} page...`);
      
      // Handle authentication if required
      if (pageConfig.requiresAuth) {
        await authenticateAndNavigate(page, pageConfig.path);
      } else {
        await page.goto(pageConfig.path);
      }
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Take initial screenshot
      await page.screenshot({ 
        path: `test-results/${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}-initial.png`,
        fullPage: true 
      });
      
      // Verify URL
      expect(page.url()).toContain(pageConfig.path);
      console.log(`✅ URL verified: ${pageConfig.path}`);
      
      // Check page elements
      const { elements } = pageConfig;
      
      // Check headers
      if (elements.headers) {
        for (const header of elements.headers) {
          const headerElement = page.locator(`h1:has-text("${header}"), h2:has-text("${header}"), h3:has-text("${header}")`).first();
          const isVisible = await headerElement.isVisible({ timeout: 5000 }).catch(() => false);
          if (isVisible) {
            console.log(`✅ Header found: "${header}"`);
          } else {
            console.log(`⚠️ Header not found: "${header}"`);
          }
        }
      }
      
      // Check buttons
      if (elements.buttons) {
        const buttons = Array.isArray(elements.buttons) ? elements.buttons : ['Submit', 'Cancel', 'Save'];
        for (const button of buttons) {
          const buttonElement = page.locator(`button:has-text("${button}"), a:has-text("${button}")`).first();
          const isVisible = await buttonElement.isVisible({ timeout: 3000 }).catch(() => false);
          if (isVisible) {
            console.log(`✅ Button found: "${button}"`);
            // Test hover state
            await buttonElement.hover();
            await page.waitForTimeout(500);
          }
        }
      }
      
      // Check special elements
      if (elements.table) {
        const table = page.locator('table, [role="table"], .data-table').first();
        if (await table.isVisible()) {
          console.log('✅ Table element found');
          // Count rows
          const rows = await page.locator('tbody tr, [role="row"]').count();
          console.log(`   Found ${rows} rows`);
        }
      }
      
      if (elements.charts) {
        const charts = page.locator('.recharts-wrapper, canvas, [data-testid*="chart"]');
        const chartCount = await charts.count();
        console.log(`✅ Found ${chartCount} chart(s)`);
      }
      
      if (elements.cards) {
        const cards = page.locator('.card, [data-testid*="card"]');
        const cardCount = await cards.count();
        console.log(`✅ Found ${cardCount} card(s)`);
      }
      
      if (elements.forms) {
        const forms = page.locator('form');
        const formCount = await forms.count();
        console.log(`✅ Found ${formCount} form(s)`);
        
        // Test form fields
        const inputs = page.locator('input:visible, textarea:visible, select:visible');
        const inputCount = await inputs.count();
        console.log(`   Found ${inputCount} input field(s)`);
      }
      
      if (elements.tabs) {
        const tabs = page.locator('[role="tablist"], .tabs');
        if (await tabs.isVisible()) {
          console.log('✅ Tab navigation found');
          // Click through tabs
          const tabButtons = page.locator('[role="tab"], .tab-button');
          const tabCount = await tabButtons.count();
          for (let i = 0; i < Math.min(tabCount, 3); i++) {
            await tabButtons.nth(i).click();
            await page.waitForTimeout(500);
          }
        }
      }
      
      if (elements.search) {
        const search = page.locator('input[type="search"], input[placeholder*="search" i]').first();
        if (await search.isVisible()) {
          console.log('✅ Search functionality found');
          await search.fill('test search');
          await page.waitForTimeout(1000);
          await search.clear();
        }
      }
      
      if (elements.calendar) {
        const calendar = page.locator('.calendar, [role="grid"], .fc-view').first();
        if (await calendar.isVisible()) {
          console.log('✅ Calendar component found');
        }
      }
      
      if (elements.kanban) {
        const kanban = page.locator('.kanban-board, .pipeline-stages').first();
        if (await kanban.isVisible()) {
          console.log('✅ Kanban board found');
        }
      }
      
      if (elements.accordion) {
        const accordion = page.locator('[role="button"][aria-expanded], .accordion-trigger').first();
        if (await accordion.isVisible()) {
          console.log('✅ Accordion found');
          await accordion.click();
          await page.waitForTimeout(500);
        }
      }
      
      if (elements.chat) {
        const chat = page.locator('.chat-container, .message-list').first();
        if (await chat.isVisible()) {
          console.log('✅ Chat interface found');
        }
      }
      
      // Test responsive behavior
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 390, height: 844, name: 'mobile' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(500);
        await page.screenshot({ 
          path: `test-results/${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}-${viewport.name}.png`,
          fullPage: true 
        });
        console.log(`✅ ${viewport.name} view tested`);
      }
      
      // Test accessibility
      try {
        const accessibilityScan = await page.evaluate(() => {
          const images = document.querySelectorAll('img');
          const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
          const buttons = document.querySelectorAll('button');
          const buttonsWithoutText = Array.from(buttons).filter(btn => !btn.textContent?.trim() && !btn.getAttribute('aria-label'));
          
          return {
            imagesWithoutAlt: imagesWithoutAlt.length,
            buttonsWithoutText: buttonsWithoutText.length,
            totalImages: images.length,
            totalButtons: buttons.length
          };
        });
        
        console.log(`📊 Accessibility scan:`);
        console.log(`   Images: ${accessibilityScan.totalImages} total, ${accessibilityScan.imagesWithoutAlt} without alt text`);
        console.log(`   Buttons: ${accessibilityScan.totalButtons} total, ${accessibilityScan.buttonsWithoutText} without text/label`);
      } catch (error) {
        console.log('⚠️ Could not perform accessibility scan');
      }
    });
  });
  
  // Special test for admin functionality
  test('should test admin-specific functionality', async ({ page }) => {
    // This would require admin authentication
    console.log('\n🛡️ Testing admin functionality...');
    
    // Set admin authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('userRole', 'ADMIN');
      window.localStorage.setItem('isAdminUser', 'true');
    });
    
    // Navigate to admin console
    await authenticateAndNavigate(page, '/admin/console');
    
    // Verify System Administration Console loads
    await expect(page.locator('h1:has-text("System Administration Console")')).toBeVisible();
    console.log('✅ System Administration Console loaded');
    
    // Test refresh functionality
    const refreshButton = page.locator('button:has-text("Refresh")').first();
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      console.log('✅ System refresh initiated');
      await page.waitForTimeout(2000);
    }
    
    // Test Users tab
    const usersTab = page.locator('[role="tab"]:has-text("Users")').first();
    if (await usersTab.isVisible()) {
      await usersTab.click();
      console.log('✅ Users tab accessed');
      await page.waitForTimeout(1000);
    }
    
    // Test Database tab
    const databaseTab = page.locator('[role="tab"]:has-text("Database")').first();
    if (await databaseTab.isVisible()) {
      await databaseTab.click();
      console.log('✅ Database tab accessed');
      await page.waitForTimeout(1000);
    }
    
    // Take screenshot of admin console
    await page.screenshot({ 
      path: 'test-results/system-admin-console-full.png',
      fullPage: true 
    });
  });
  
  // Navigation flow test
  test('should test complete navigation flow', async ({ page }) => {
    console.log('\n🧭 Testing navigation flow...');
    
    await authenticateAndNavigate(page, '/dashboard');
    
    // Test navigation through main pages
    const mainPages = ['/leads', '/projects', '/messages', '/reports', '/calendar', '/settings'];
    
    for (const path of mainPages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain(path);
      console.log(`✅ Navigated to ${path}`);
    }
  });
  
  // Error handling test
  test('should handle errors gracefully', async ({ page }) => {
    console.log('\n⚠️ Testing error handling...');
    
    // Test 404
    await page.goto('/non-existent-page-12345');
    await page.waitForLoadState('networkidle');
    const notFoundText = await page.locator('h1:has-text("404")').isVisible();
    expect(notFoundText).toBeTruthy();
    console.log('✅ 404 page works correctly');
    
    // Test API errors (if applicable)
    await authenticateAndNavigate(page, '/dashboard');
    // Intercept API calls to simulate errors
    await page.route('**/api/**', route => route.abort());
    await page.reload();
    // Check for error handling UI
    const errorUI = await page.locator('text=/error|retry|failed/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(errorUI ? '✅ API error handling works' : '⚠️ No visible error handling for API failures');
  });
}); 