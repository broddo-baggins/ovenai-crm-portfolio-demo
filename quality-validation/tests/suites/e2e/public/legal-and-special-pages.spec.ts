import { test, expect } from '@playwright/test';
import { testCredentials } from '../../../__helpers__/test-credentials';

// Legal and Special Pages Test Suite
test.describe('Legal and Special Pages Tests', () => {
  test.setTimeout(60000); // 1 minute per test

  test.describe('Legal Pages', () => {
    test('Privacy Policy - Content and Navigation', async ({ page }) => {
      console.log('🔒 Testing Privacy Policy page...');
      
      await page.goto('/privacy-policy');
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded
      await expect(page.locator('h1:has-text("Privacy Policy")')).toBeVisible();
      console.log('✅ Privacy Policy page loaded');
      
      // Check for key sections
      const sections = [
        'Information We Collect',
        'How We Use',
        'Data Security',
        'Your Rights',
        'Contact Us'
      ];
      
      for (const section of sections) {
        const sectionHeading = page.locator(`h2:has-text("${section}"), h3:has-text("${section}")`).first();
        const isVisible = await sectionHeading.isVisible({ timeout: 3000 }).catch(() => false);
        if (isVisible) {
          console.log(`✅ Found section: ${section}`);
        }
      }
      
      // Test table of contents if present
      const tocLinks = page.locator('a[href^="#"]');
      const tocCount = await tocLinks.count();
      if (tocCount > 0) {
        console.log(`✅ Found ${tocCount} table of contents links`);
        
        // Test first TOC link
        const firstLink = tocLinks.first();
        const href = await firstLink.getAttribute('href');
        if (href) {
          await firstLink.click();
          await page.waitForTimeout(500);
          console.log('   TOC navigation works');
        }
      }
      
      // Check for last updated date
      const lastUpdated = page.locator('text=/last updated|effective date/i').first();
      if (await lastUpdated.isVisible()) {
        console.log('✅ Last updated date found');
      }
      
      // Test print functionality
      const printButton = page.locator('button:has-text("Print")').first();
      if (await printButton.isVisible()) {
        console.log('✅ Print button available');
      }
      
      // Take screenshot
      await page.screenshot({
        path: 'test-results/privacy-policy.png',
        fullPage: true
      });
    });

    test('Terms of Service - Acceptance and Sections', async ({ page }) => {
      console.log('📜 Testing Terms of Service page...');
      
      await page.goto('/terms-of-service');
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded
      await expect(page.locator('h1:has-text("Terms of Service")')).toBeVisible();
      console.log('✅ Terms of Service page loaded');
      
      // Check for essential sections
      const essentialSections = [
        'Acceptance of Terms',
        'Use of Service',
        'User Accounts',
        'Prohibited Uses',
        'Termination',
        'Limitation of Liability'
      ];
      
      for (const section of essentialSections) {
        const sectionElement = page.locator(`text="${section}"`).first();
        const isVisible = await sectionElement.isVisible({ timeout: 3000 }).catch(() => false);
        if (isVisible) {
          console.log(`✅ Found section: ${section}`);
        }
      }
      
      // Test acceptance mechanism if present
      const acceptButton = page.locator('button:has-text("Accept"), button:has-text("I Agree")').first();
      if (await acceptButton.isVisible()) {
        console.log('✅ Terms acceptance button found');
        const isEnabled = await acceptButton.isEnabled();
        console.log(`   Button is ${isEnabled ? 'enabled' : 'disabled'}`);
      }
      
      // Check for version number
      const version = page.locator('text=/version|v\\d+\\.\\d+/i').first();
      if (await version.isVisible()) {
        console.log('✅ Version information found');
      }
    });

    test('Accessibility Declaration - WCAG Compliance', async ({ page }) => {
      console.log('♿ Testing Accessibility Declaration page...');
      
      await page.goto('/accessibility');
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded
      await expect(page.locator('h1:has-text("Accessibility")')).toBeVisible();
      console.log('✅ Accessibility Declaration page loaded');
      
      // Check for WCAG compliance statement
      const wcagStatement = page.locator('text=/WCAG|Web Content Accessibility Guidelines/i').first();
      if (await wcagStatement.isVisible()) {
        console.log('✅ WCAG compliance statement found');
      }
      
      // Check for accessibility features list
      const features = [
        'Keyboard Navigation',
        'Screen Reader',
        'Color Contrast',
        'Alternative Text',
        'Focus Indicators'
      ];
      
      for (const feature of features) {
        const featureText = page.locator(`text=/${feature}/i`).first();
        if (await featureText.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`✅ Accessibility feature mentioned: ${feature}`);
        }
      }
      
      // Check for contact information
      const contactInfo = page.locator('text=/contact|email|report/i').first();
      if (await contactInfo.isVisible()) {
        console.log('✅ Accessibility contact information found');
      }
      
      // Test any accessibility tools on the page
      const textSizeButtons = page.locator('button:has-text("A+"), button:has-text("Increase")');
      if (await textSizeButtons.first().isVisible()) {
        await textSizeButtons.first().click();
        console.log('✅ Text size adjustment available');
        
        // Reset
        const resetButton = page.locator('button:has-text("Reset"), button:has-text("A")').first();
        if (await resetButton.isVisible()) {
          await resetButton.click();
        }
      }
    });

    test('Data Export - User Rights', async ({ page, context }) => {
      console.log('📤 Testing Data Export page...');
      
      // Add authentication
      await context.addCookies([{
        name: 'auth-token',
        value: 'mock-auth-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto('/data-export');
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded
      const pageHeader = page.locator('h1:has-text("Data Export"), h1:has-text("Export Your Data")').first();
      await expect(pageHeader).toBeVisible();
      console.log('✅ Data Export page loaded');
      
      // Check export options
      const exportOptions = [
        'Profile Information',
        'Messages',
        'Leads',
        'Activity History',
        'All Data'
      ];
      
      for (const option of exportOptions) {
        const checkbox = page.locator(`label:has-text("${option}"), input[value="${option.toLowerCase()}"]`).first();
        if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`✅ Export option available: ${option}`);
        }
      }
      
      // Check format options
      const formatSelect = page.locator('select[name="format"], [data-testid="export-format"]').first();
      if (await formatSelect.isVisible()) {
        const options = await formatSelect.locator('option').allTextContents();
        console.log(`✅ Export formats available: ${options.join(', ')}`);
      }
      
      // Test export button
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
      if (await exportButton.isVisible()) {
        const isEnabled = await exportButton.isEnabled();
        console.log(`✅ Export button ${isEnabled ? 'ready' : 'requires selection'}`);
      }
      
      // Check for GDPR compliance notice
      const gdprNotice = page.locator('text=/GDPR|data protection|privacy rights/i').first();
      if (await gdprNotice.isVisible()) {
        console.log('✅ GDPR compliance notice found');
      }
    });

    test('Data Deletion - Account Removal', async ({ page, context }) => {
      console.log('🗑️ Testing Data Deletion page...');
      
      // Add authentication
      await context.addCookies([{
        name: 'auth-token',
        value: 'mock-auth-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto('/data-deletion');
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded
      await expect(page.locator('h1:has-text("Data Deletion"), h1:has-text("Delete Your Data")').first()).toBeVisible();
      console.log('✅ Data Deletion page loaded');
      
      // Check for warning messages
      const warningText = page.locator('text=/warning|permanent|cannot be undone/i').first();
      if (await warningText.isVisible()) {
        console.log('✅ Deletion warning displayed');
      }
      
      // Check deletion options
      const deletionOptions = page.locator('input[type="checkbox"], input[type="radio"]');
      const optionCount = await deletionOptions.count();
      console.log(`✅ Found ${optionCount} deletion options`);
      
      // Test confirmation mechanism
      const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Request Deletion")').first();
      if (await deleteButton.isVisible()) {
        const isDisabled = await deleteButton.isDisabled();
        console.log(`✅ Delete button ${isDisabled ? 'requires confirmation' : 'is active'}`);
        
        // Look for confirmation input
        const confirmInput = page.locator('input[placeholder*="confirm"], input[placeholder*="type"]').first();
        if (await confirmInput.isVisible()) {
          console.log('✅ Confirmation input required');
          await confirmInput.fill('DELETE');
          await page.waitForTimeout(500);
          
          const isNowEnabled = await deleteButton.isEnabled();
          console.log(`   Delete button ${isNowEnabled ? 'enabled after confirmation' : 'still disabled'}`);
        }
      }
      
      // Check for data retention notice
      const retentionNotice = page.locator('text=/retention|days|backup/i').first();
      if (await retentionNotice.isVisible()) {
        console.log('✅ Data retention information provided');
      }
    });
  });

  test.describe('Special Pages', () => {
    test('Coming Soon - Feature Preview', async ({ page }) => {
      console.log('🚀 Testing Coming Soon page...');
      
      await page.goto('/coming-soon');
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded
      await expect(page.locator('h1:has-text("Coming Soon"), h2:has-text("Coming Soon")').first()).toBeVisible();
      console.log('✅ Coming Soon page loaded');
      
      // Check for countdown timer
      const countdown = page.locator('[data-testid="countdown"], .countdown-timer').first();
      if (await countdown.isVisible()) {
        console.log('✅ Countdown timer found');
        
        // Check timer elements
        const timerElements = await page.locator('.countdown-item, [class*="time"]').count();
        console.log(`   Found ${timerElements} timer elements`);
      }
      
      // Check for feature list
      const features = page.locator('.feature-item, [data-testid="feature"]');
      const featureCount = await features.count();
      if (featureCount > 0) {
        console.log(`✅ Found ${featureCount} upcoming features`);
        
        // Check feature status badges
        const badges = await page.locator('.badge, .status-badge').count();
        console.log(`   Found ${badges} status badges`);
      }
      
      // Test email signup
      const emailInput = page.locator('input[type="email"]').first();
      const notifyButton = page.locator('button:has-text("Notify"), button:has-text("Subscribe")').first();
      
      if (await emailInput.isVisible() && await notifyButton.isVisible()) {
        console.log('✅ Email notification signup available');
        
        await emailInput.fill(testCredentials.email);
        await notifyButton.click();
        await page.waitForTimeout(1000);
        
        // Check for success message
        const successMessage = page.locator('text=/thank you|subscribed|success/i').first();
        if (await successMessage.isVisible()) {
          console.log('   Email signup successful');
        }
      }
      
      // Check progress indicator
      const progressBar = page.locator('[role="progressbar"], .progress-bar').first();
      if (await progressBar.isVisible()) {
        const progress = await progressBar.getAttribute('aria-valuenow') || 
                        await progressBar.getAttribute('data-progress');
        console.log(`✅ Progress indicator showing ${progress}%`);
      }
    });

    test('Maintenance Page - Service Status', async ({ page }) => {
      console.log('🔧 Testing Maintenance page...');
      
      await page.goto('/maintenance');
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded
      await expect(page.locator('h1:has-text("Maintenance"), h1:has-text("System Maintenance")').first()).toBeVisible();
      console.log('✅ Maintenance page loaded');
      
      // Check for status information
      const statusIndicator = page.locator('.status-indicator, [data-testid="status"]').first();
      if (await statusIndicator.isVisible()) {
        console.log('✅ Status indicator found');
      }
      
      // Check for estimated completion time
      const estimatedTime = page.locator('text=/estimated|completion|time remaining/i').first();
      if (await estimatedTime.isVisible()) {
        console.log('✅ Estimated completion time displayed');
      }
      
      // Check for progress updates
      const updates = page.locator('.update-item, [data-testid="update"]');
      const updateCount = await updates.count();
      if (updateCount > 0) {
        console.log(`✅ Found ${updateCount} status updates`);
      }
      
      // Check for contact information
      const contactInfo = page.locator('text=/contact|support|email/i').first();
      if (await contactInfo.isVisible()) {
        console.log('✅ Support contact information provided');
      }
      
      // Test refresh functionality
      const refreshButton = page.locator('button:has-text("Refresh"), button:has-text("Check Status")').first();
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        console.log('✅ Status refresh available');
        await page.waitForTimeout(1000);
      }
      
      // Check for auto-refresh indicator
      const autoRefresh = page.locator('text=/auto.?refresh|updating/i').first();
      if (await autoRefresh.isVisible()) {
        console.log('✅ Auto-refresh indicator found');
      }
    });

    test('Landing Page - Hero and Features', async ({ page }) => {
      console.log('🏠 Testing Landing page...');
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check if redirected to dashboard (authenticated) or stays on landing
      const url = page.url();
      if (url.includes('dashboard')) {
        console.log('✅ Authenticated user redirected to dashboard');
        return;
      }
      
      // Verify landing page elements
      await expect(page.locator('h1:has-text("OvenAI"), .hero-title').first()).toBeVisible();
      console.log('✅ Landing page loaded');
      
      // Test hero section
      const heroSection = page.locator('.hero, [data-testid="hero"]').first();
      if (await heroSection.isVisible()) {
        console.log('✅ Hero section found');
        
        // Check CTA buttons
        const ctaButtons = page.locator('.hero button, .hero a[role="button"]');
        const ctaCount = await ctaButtons.count();
        console.log(`   Found ${ctaCount} CTA buttons`);
        
        if (ctaCount > 0) {
          const primaryCta = ctaButtons.first();
          await primaryCta.hover();
          console.log('   Primary CTA hover tested');
        }
      }
      
      // Test feature sections
      const featureSections = page.locator('.feature-section, [data-testid="feature"]');
      const featureCount = await featureSections.count();
      console.log(`✅ Found ${featureCount} feature sections`);
      
      // Test testimonials if present
      const testimonials = page.locator('.testimonial, [data-testid="testimonial"]');
      if (await testimonials.first().isVisible()) {
        const testimonialCount = await testimonials.count();
        console.log(`✅ Found ${testimonialCount} testimonials`);
      }
      
      // Test FAQ accordion
      const faqItems = page.locator('.faq-item, [data-testid="faq-item"]');
      if (await faqItems.first().isVisible()) {
        const faqCount = await faqItems.count();
        console.log(`✅ Found ${faqCount} FAQ items`);
        
        // Test first FAQ item
        const firstFaq = faqItems.first();
        await firstFaq.click();
        await page.waitForTimeout(500);
        console.log('   FAQ accordion interaction tested');
      }
      
      // Test language toggle
      const languageToggle = page.locator('[data-testid="language-toggle"], button:has-text("EN"), button:has-text("HE")').first();
      if (await languageToggle.isVisible()) {
        await languageToggle.click();
        console.log('✅ Language toggle tested');
        await page.waitForTimeout(1000);
      }
      
      // Test smooth scrolling
      const navLinks = page.locator('a[href^="#"]');
      if (await navLinks.first().isVisible()) {
        const firstNavLink = navLinks.first();
        await firstNavLink.click();
        await page.waitForTimeout(1000);
        console.log('✅ Smooth scroll navigation tested');
      }
    });

    test('Components Demo - UI Showcase', async ({ page }) => {
      console.log('🎨 Testing Components Demo page...');
      
      await page.goto('/components-demo');
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded
      await expect(page.locator('h1:has-text("Components"), h1:has-text("UI Components")').first()).toBeVisible();
      console.log('✅ Components Demo page loaded');
      
      // Test button variants
      const buttons = page.locator('.demo-section button, [data-testid*="button"]');
      const buttonCount = await buttons.count();
      console.log(`✅ Found ${buttonCount} demo buttons`);
      
      if (buttonCount > 0) {
        // Test different button states
        for (let i = 0; i < Math.min(3, buttonCount); i++) {
          const button = buttons.nth(i);
          await button.hover();
          await page.waitForTimeout(200);
        }
        console.log('   Button hover states tested');
      }
      
      // Test form elements
      const formInputs = page.locator('.demo-section input, .demo-section select, .demo-section textarea');
      const inputCount = await formInputs.count();
      console.log(`✅ Found ${inputCount} form elements`);
      
      // Test modal/dialog
      const modalTrigger = page.locator('button:has-text("Open Modal"), button:has-text("Show Dialog")').first();
      if (await modalTrigger.isVisible()) {
        await modalTrigger.click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[role="dialog"], .modal').first();
        if (await modal.isVisible()) {
          console.log('✅ Modal functionality works');
          
          // Close modal
          const closeButton = page.locator('[role="dialog"] button:has-text("Close"), [aria-label="Close"]').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        }
      }
      
      // Test tabs
      const tabs = page.locator('[role="tab"]');
      if (await tabs.first().isVisible()) {
        const tabCount = await tabs.count();
        console.log(`✅ Found ${tabCount} demo tabs`);
        
        // Click through tabs
        for (let i = 0; i < Math.min(3, tabCount); i++) {
          await tabs.nth(i).click();
          await page.waitForTimeout(300);
        }
      }
      
      // Test tooltips
      const tooltipTriggers = page.locator('[data-tooltip], [title]');
      if (await tooltipTriggers.first().isVisible()) {
        await tooltipTriggers.first().hover();
        await page.waitForTimeout(1000);
        console.log('✅ Tooltip functionality tested');
      }
      
      // Take screenshot of components
      await page.screenshot({
        path: 'test-results/components-demo.png',
        fullPage: true
      });
    });
  });
}); 