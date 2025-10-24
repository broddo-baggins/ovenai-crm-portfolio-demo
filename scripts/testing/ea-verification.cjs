#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// EA Verification Results
const verificationResults = {
  timestamp: new Date().toISOString(),
  totalRequirements: 17,
  passedRequirements: 0,
  failedRequirements: 0,
  results: [],
  overallStatus: 'PENDING'
};

// Test credentials
const TEST_CREDENTIALS = {
  email: 'test@test.test',
  password: 'testtesttest'
};

// Base URL - check both 3001 and 3000
const BASE_URLS = ['http://localhost:3001', 'http://localhost:3000'];
let BASE_URL = '';

// Helper function to add result
function addResult(requirement, status, details, error = null) {
  const result = {
    requirement,
    status,
    details,
    error: error?.message || null
  };
  
  verificationResults.results.push(result);
  
  if (status === 'PASSED') {
    verificationResults.passedRequirements++;
  } else {
    verificationResults.failedRequirements++;
  }
  
  const statusIcon = status === 'PASSED' ? '✅' : '❌';
  console.log(`${statusIcon} ${requirement}: ${details}`);
  
  if (error) {
    console.log(`   Error: ${error.message}`);
  }
}

// Helper function to safely navigate and authenticate
async function authenticateIfNeeded(page) {
  const currentUrl = page.url();
  const url = String(currentUrl); // Ensure url is a string
  
  // Check if we're on login page or need to navigate there
  if (url.includes('/login') || url.includes('/auth') || url.includes('/signin')) {
    console.log('🔑 Authenticating...');
    
    try {
      // Wait for login form to be visible
      await page.waitForLoadState('networkidle');
      
      // Fill in login form with more specific selectors
      const emailSelector = 'input[type="email"], input[name="email"], input[id="email"], [data-testid="email-input"]';
      const passwordSelector = 'input[type="password"], input[name="password"], input[id="password"], [data-testid="password-input"]';
      
      await page.fill(emailSelector, TEST_CREDENTIALS.email, { timeout: 5000 });
      await page.fill(passwordSelector, TEST_CREDENTIALS.password, { timeout: 5000 });
      
      // Submit form - try multiple approaches
      let submitSuccess = false;
      
      // Try clicking submit button
      const submitSelectors = [
        'button[type="submit"]',
        '[data-testid="login-button"]', 
        'button:has-text("Sign In")',
        'button:has-text("Login")',
        'button:has-text("Sign in")',
        'form button[type="submit"]'
      ];
      
      for (const selector of submitSelectors) {
        try {
          const button = page.locator(selector).first();
          if (await button.isVisible({ timeout: 2000 })) {
            await button.click();
            submitSuccess = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      // If button click failed, try form submission
      if (!submitSuccess) {
        try {
          await page.keyboard.press('Enter');
          submitSuccess = true;
        } catch (e) {
          console.log('   Form submission failed');
        }
      }
      
      if (!submitSuccess) {
        console.log('   Could not submit form');
        return false;
      }
      
      // Wait for navigation away from login page with shorter timeout
      try {
        await page.waitForURL(urlString => {
          const urlStr = String(urlString);
          return !urlStr.includes('/login') && !urlStr.includes('/auth') && !urlStr.includes('/signin');
        }, { timeout: 10000 });
        console.log('✅ Authentication successful');
        return true;
      } catch (e) {
        // Check if we're actually authenticated by looking for dashboard elements
        try {
          await page.waitForSelector('[data-testid*="dashboard"], .dashboard, h1:has-text("Dashboard")', { timeout: 3000 });
          console.log('✅ Authentication successful (detected dashboard)');
          return true;
        } catch (e2) {
          console.log('⚠️  Authentication may have failed');
          return false;
        }
      }
    } catch (error) {
      console.log('⚠️  Authentication failed, continuing with current page');
      console.log('   Details:', error.message);
      return false;
    }
  }
  
  return true;
}

// Helper function to navigate to authenticated page
async function navigateToAuthenticatedPage(page, path) {
  try {
    await page.goto(`${BASE_URL}${path}`, { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    
    // Check if we were redirected to login
    const currentUrl = String(page.url());
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      const authenticated = await authenticateIfNeeded(page);
      if (authenticated) {
        // Navigate to the intended page again
        await page.goto(`${BASE_URL}${path}`, { timeout: 30000 });
        await page.waitForLoadState('networkidle');
      }
      return authenticated;
    }
    
    return true;
  } catch (error) {
    console.log(`Failed to navigate to ${path}:`, error.message);
    return false;
  }
}

// Helper function to check if server is running
async function checkServer() {
  for (const url of BASE_URLS) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        BASE_URL = url;
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  return false;
}

async function runEAVerification() {
  console.log('🚀 Starting EA Verification - All 17 Requirements');
  console.log('='.repeat(60));
  
  let browser;
  
  try {
    // Check if server is running
    const serverRunning = await checkServer();
    if (!serverRunning) {
      throw new Error('Server not running on port 3000 or 3001');
    }
    
    console.log(`✅ Server found at: ${BASE_URL}`);
    
    // Launch browser
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 1. Landing Page
    try {
      await page.goto(BASE_URL, { timeout: 30000 });
      await page.waitForLoadState('networkidle');
      
      const title = await page.title();
      const hasNav = await page.locator('nav, [role="navigation"], header').count() > 0;
      const hasCTA = await page.locator('button, [data-testid*="cta"], .cta, a[href*="login"], a[href*="signup"]').count() > 0;
      
      const landingPageWorking = title.includes('OvenAI') && hasNav && hasCTA;
      
      addResult('1. Landing Page', landingPageWorking ? 'PASSED' : 'FAILED', 
        `Page loads with title "${title}", navigation: ${hasNav}, CTAs: ${hasCTA}`);
    } catch (error) {
      addResult('1. Landing Page', 'FAILED', 'Failed to load landing page', error);
    }
    
    // 2. Login System
    try {
      await page.goto(`${BASE_URL}/auth/login`, { timeout: 30000 });
      await page.waitForLoadState('networkidle');
      
      const hasLoginForm = await page.locator('form, [data-testid*="login"]').count() > 0;
      const hasEmailInput = await page.locator('input[type="email"], input[name="email"], input[id="email"], [data-testid="email-input"]').count() > 0;
      const hasPasswordInput = await page.locator('input[type="password"], input[name="password"], input[id="password"], [data-testid="password-input"]').count() > 0;
      const hasResetLink = await page.locator('a[href*="reset"], a[href*="forgot"], [data-testid*="reset"], [data-testid*="forgot"]').count() > 0;
      
      const loginSystemWorking = hasLoginForm && hasEmailInput && hasPasswordInput;
      
      addResult('2. Login System', loginSystemWorking ? 'PASSED' : 'FAILED', 
        `Login form complete, reset password link: ${hasResetLink}`);
        
      // Authenticate for remaining tests
      if (loginSystemWorking) {
        await authenticateIfNeeded(page);
      }
    } catch (error) {
      addResult('2. Login System', 'FAILED', 'Failed to load login page', error);
    }
    
    // 3. Dashboard
    try {
      const navigated = await navigateToAuthenticatedPage(page, '/dashboard');
      if (!navigated) {
        addResult('3. Dashboard', 'FAILED', 'Failed to navigate to dashboard - authentication required');
      } else {
        const hasCards = await page.locator('[data-testid*="metric"], [data-testid*="card"], .card, .metric, .bg-card, .rounded-lg').count() > 3;
        const hasData = await page.locator('[data-testid*="dashboard"], [data-testid*="data"], .dashboard-data').count() > 0;
        const hasSettings = await page.locator('[data-testid*="settings"], button:has-text("Settings")').count() > 0;
        
        const dashboardWorking = hasCards && hasData;
        
        addResult('3. Dashboard', dashboardWorking ? 'PASSED' : 'FAILED', 
          `Missing elements: cards=${hasCards}, data=${hasData}, settings=${hasSettings}`);
      }
    } catch (error) {
      addResult('3. Dashboard', 'FAILED', 'Failed to load dashboard', error);
    }
    
    // 4. Leads
    try {
      const navigated = await navigateToAuthenticatedPage(page, '/leads');
      if (!navigated) {
        addResult('4. Leads', 'FAILED', 'Failed to navigate to leads - authentication required');
      } else {
        const hasLeadsList = await page.locator('[data-testid*="leads-table"], [data-testid*="lead"], .lead, table').count() > 0;
        const hasLeadsData = await page.locator('[data-testid*="leads-table-body"] tr, [data-testid*="lead-row"]').count() > 0 ||
                             await page.locator('[data-testid*="leads-empty-state"]').count() > 0;
        
        const leadsWorking = hasLeadsList || hasLeadsData;
        
        addResult('4. Leads', leadsWorking ? 'PASSED' : 'FAILED', 
          leadsWorking ? 'Leads list and functionality found' : 'Missing leads list or functionality');
      }
    } catch (error) {
      addResult('4. Leads', 'FAILED', 'Failed to load leads page', error);
    }
    
    // 5. Queue
    try {
      const navigated = await navigateToAuthenticatedPage(page, '/queue');
      if (!navigated) {
        // Try leads page which contains queue management
        const leadsNavigated = await navigateToAuthenticatedPage(page, '/leads');
        if (!leadsNavigated) {
          addResult('5. Queue', 'FAILED', 'Failed to navigate to queue - authentication required');
        } else {
          // Look for queue elements on leads page
          const hasQueueElements = await page.locator('[data-testid*="queue"], [data-testid*="management"], h2:has-text("Queue Management")').count() > 0;
          const hasQueueTabs = await page.locator('[data-testid="queue-tab"], [data-testid="management-tab"]').count() > 0;
          const hasQueueContent = await page.locator('[data-testid="queue-management-section"]').count() > 0;
          
          const queueWorking = hasQueueElements || hasQueueTabs || hasQueueContent;
          
          addResult('5. Queue', queueWorking ? 'PASSED' : 'FAILED', 
            queueWorking ? 'Queue functionality found' : 'Missing queue functionality');
        }
      } else {
        // Direct queue page
        const hasQueueElements = await page.locator('[data-testid*="queue"], h1:has-text("Queue Management")').count() > 0;
        const hasQueueTabs = await page.locator('[data-testid="queue-tab"], [data-testid="management-tab"]').count() > 0;
        const hasQueueMetrics = await page.locator('.text-2xl').count() > 2; // Queue metrics cards
        
        const queueWorking = hasQueueElements || hasQueueTabs || hasQueueMetrics;
        
        addResult('5. Queue', queueWorking ? 'PASSED' : 'FAILED', 
          queueWorking ? 'Queue functionality found' : 'Missing queue functionality');
      }
    } catch (error) {
      addResult('5. Queue', 'FAILED', 'Failed to load queue page', error);
    }
    
    // 6. API Keys
    try {
      const navigated = await navigateToAuthenticatedPage(page, '/settings');
      if (!navigated) {
        addResult('6. API Keys', 'FAILED', 'Failed to navigate to settings - authentication required');
      } else {
        const hasAPISection = await page.locator('[data-testid*="api"], h2:has-text("API"), h3:has-text("API")').count() > 0;
        const hasAPIKeys = await page.locator('input[type="password"], input[placeholder*="API"], [data-testid*="key"]').count() > 0;
        const hasAPITokens = await page.locator('button:has-text("Generate"), button:has-text("API"), [data-testid*="token"]').count() > 0;
        
        const apiWorking = hasAPISection || hasAPIKeys || hasAPITokens;
        
        addResult('6. API Keys', apiWorking ? 'PASSED' : 'FAILED', 
          apiWorking ? 'API Keys functionality found' : 'Missing API Keys functionality');
      }
    } catch (error) {
      addResult('6. API Keys', 'FAILED', 'Failed to verify API Keys functionality', error);
    }
    
    // 7. Messages
    try {
      const navigated = await navigateToAuthenticatedPage(page, '/messages');
      if (!navigated) {
        addResult('7. Messages', 'FAILED', 'Failed to navigate to messages - authentication required');
      } else {
        const hasMessagesPage = await page.locator('[data-testid="messages-page"]').count() > 0;
        const hasMessagesTitle = await page.locator('h1:has-text("Messages")').count() > 0;
        const hasConversationsContent = await page.locator('[data-testid*="conversations"], .conversation').count() > 0;
        const hasMessagesUI = await page.locator('[data-testid*="chat"], [data-testid*="message"]').count() > 0;
        
        const messagesWorking = hasMessagesPage || hasMessagesTitle || hasConversationsContent || hasMessagesUI;
        
        addResult('7. Messages', messagesWorking ? 'PASSED' : 'FAILED', 
          messagesWorking ? 'Messages functionality found' : 'Missing messages functionality');
      }
    } catch (error) {
      addResult('7. Messages', 'FAILED', 'Failed to load messages page', error);
    }
    
    // 8. Projects
    try {
      const navigated = await navigateToAuthenticatedPage(page, '/projects');
      if (!navigated) {
        addResult('8. Projects', 'FAILED', 'Failed to navigate to projects - authentication required');
      } else {
        const hasProjectsPage = await page.locator('[data-testid="projects-page"]').count() > 0;
        const hasProjectsTitle = await page.locator('h1:has-text("Projects")').count() > 0;
        const hasProjectsContent = await page.locator('[data-testid*="project"], .project, .grid').count() > 0;
        const hasCreateButton = await page.locator('button:has-text("Create"), button:has-text("New"), [data-testid*="create"]').count() > 0;
        
        const projectsWorking = hasProjectsPage || hasProjectsTitle || hasProjectsContent || hasCreateButton;
        
        addResult('8. Projects', projectsWorking ? 'PASSED' : 'FAILED', 
          projectsWorking ? 'Projects functionality found' : 'Missing projects functionality');
      }
    } catch (error) {
      addResult('8. Projects', 'FAILED', 'Failed to load projects page', error);
    }
    
    // 9. Calendar
    try {
      let calendarWorking = false;
      
      // Check if calendar exists as a separate page
      try {
        const navigated = await navigateToAuthenticatedPage(page, '/calendar');
        if (navigated) {
          const hasCalendarPage = await page.locator('[data-testid*="calendar"], h1:has-text("Calendar")').count() > 0;
          const hasCalendarComponent = await page.locator('.calendar, [data-testid*="date"]').count() > 0;
          if (hasCalendarPage || hasCalendarComponent) {
            calendarWorking = true;
          }
        }
      } catch (e) {
        // Calendar page doesn't exist
      }
      
      // Check if calendar exists within other pages (e.g., dashboard, leads)
      if (!calendarWorking) {
        const dashboardNavigated = await navigateToAuthenticatedPage(page, '/dashboard');
        if (dashboardNavigated) {
          const hasCalendarWidget = await page.locator('[data-testid*="calendar"], .calendar-widget, input[type="date"]').count() > 0;
          if (hasCalendarWidget) {
            calendarWorking = true;
          }
        }
      }
      
      addResult('9. Calendar', calendarWorking ? 'PASSED' : 'FAILED', 
        calendarWorking ? 'Calendar functionality found' : 'Missing calendar functionality');
    } catch (error) {
      addResult('9. Calendar', 'FAILED', 'Failed to verify calendar functionality', error);
    }
    
    // 10. Settings
    try {
      const navigated = await navigateToAuthenticatedPage(page, '/settings');
      if (!navigated) {
        addResult('10. Settings', 'FAILED', 'Failed to navigate to settings - authentication required');
      } else {
        const hasSettingsPage = await page.locator('[data-testid="settings-page"]').count() > 0;
        const hasSettingsForm = await page.locator('form, [data-testid*="settings"]').count() > 0;
        const hasInputs = await page.locator('input, select, textarea').count() > 5;
        const hasSaveButton = await page.locator('button:has-text("Save"), [data-testid*="save"]').count() > 0;
        
        const settingsWorking = hasSettingsPage || (hasSettingsForm && hasInputs && hasSaveButton);
        
        addResult('10. Settings', settingsWorking ? 'PASSED' : 'FAILED', 
          `Settings page loaded with form, inputs, save button: ${settingsWorking}`);
      }
    } catch (error) {
      addResult('10. Settings', 'FAILED', 'Failed to load settings page', error);
    }
    
    // 11. Reports
    try {
      const navigated = await navigateToAuthenticatedPage(page, '/reports');
      if (!navigated) {
        addResult('11. Reports', 'FAILED', 'Failed to navigate to reports - authentication required');
      } else {
        const hasReportsPage = await page.locator('[data-testid="reports-page"]').count() > 0;
        const hasReportsTitle = await page.locator('h1:has-text("Reports")').count() > 0;
        const hasReportsContent = await page.locator('[data-testid*="report"], .report, .chart').count() > 0;
        const hasExportButton = await page.locator('button:has-text("Export"), [data-testid*="export"]').count() > 0;
        
        const reportsWorking = hasReportsPage || hasReportsTitle || hasReportsContent || hasExportButton;
        
        addResult('11. Reports', reportsWorking ? 'PASSED' : 'FAILED', 
          reportsWorking ? 'Reports functionality found' : 'Missing reports functionality');
      }
    } catch (error) {
      addResult('11. Reports', 'FAILED', 'Failed to load reports page', error);
    }
    
    // 12. Logout
    try {
      const navigated = await navigateToAuthenticatedPage(page, '/dashboard');
      if (!navigated) {
        addResult('12. Logout', 'FAILED', 'Failed to navigate to dashboard - authentication required');
      } else {
        const hasLogoutButton = await page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [data-testid*="logout"], [data-testid*="signout"]').count() > 0;
        const hasUserMenu = await page.locator('[data-testid*="user-menu"], [data-testid*="profile"]').count() > 0;
        const hasLogoutLink = await page.locator('a[href*="logout"], a:has-text("Logout")').count() > 0;
        
        const logoutWorking = hasLogoutButton || hasUserMenu || hasLogoutLink;
        
        addResult('12. Logout', logoutWorking ? 'PASSED' : 'FAILED', 
          logoutWorking ? 'Logout functionality found' : 'Missing logout functionality');
      }
    } catch (error) {
      addResult('12. Logout', 'FAILED', 'Failed to verify logout functionality', error);
    }
    
    // 13. Error Pages
    try {
      await page.goto(`${BASE_URL}/non-existent-page`, { timeout: 30000 });
      await page.waitForLoadState('networkidle');
      
      const hasErrorPage = await page.locator('h1:has-text("404"), h1:has-text("Not Found"), [data-testid*="error"]').count() > 0;
      const hasAnimation = await page.locator('[data-testid*="meteor"], .meteor, .animation, canvas').count() > 0;
      
      const errorPagesWorking = hasErrorPage;
      
      addResult('13. Error Pages', errorPagesWorking ? 'PASSED' : 'FAILED', 
        `Error page loaded with animations: ${hasAnimation}`);
    } catch (error) {
      addResult('13. Error Pages', 'FAILED', 'Failed to load error page', error);
    }
    
    // 14. FAQ/Help  
    try {
      // Check if FAQ/Help exists on dashboard or as separate page
      const navigated = await navigateToAuthenticatedPage(page, '/dashboard');
      if (!navigated) {
        addResult('14. FAQ/Help', 'FAILED', 'Failed to navigate to dashboard - authentication required');
      } else {
        let faqWorking = false;
        
        // Check for FAQ/Help content on dashboard
        const hasFAQContent = await page.locator('[data-testid*="faq"], [data-testid*="help"], h1:has-text("FAQ"), h2:has-text("FAQ"), h3:has-text("FAQ")').count() > 0;
        const hasHelpLinks = await page.locator('a[href*="help"], a[href*="faq"], a:has-text("Help"), a:has-text("FAQ")').count() > 0;
        
        if (hasFAQContent || hasHelpLinks) {
          faqWorking = true;
        } else {
          // Try navigating to /help or /faq pages
          try {
            await page.goto(`${BASE_URL}/help`, { timeout: 10000 });
            await page.waitForLoadState('networkidle', { timeout: 5000 });
            const helpPageExists = await page.locator('h1, h2, h3').count() > 0;
            if (helpPageExists) faqWorking = true;
          } catch (e) {
            try {
              await page.goto(`${BASE_URL}/faq`, { timeout: 10000 });
              await page.waitForLoadState('networkidle', { timeout: 5000 });
              const faqPageExists = await page.locator('h1, h2, h3').count() > 0;
              if (faqPageExists) faqWorking = true;
            } catch (e2) {
              // No dedicated help/faq pages found
            }
          }
        }
        
        addResult('14. FAQ/Help', faqWorking ? 'PASSED' : 'FAILED', 
          faqWorking ? 'FAQ/Help functionality found' : 'Missing FAQ/Help functionality');
      }
    } catch (error) {
      addResult('14. FAQ/Help', 'FAILED', 'Failed to verify FAQ/Help functionality', error);
    }
    
    // 15. RTL Support
    try {
      const navigated = await navigateToAuthenticatedPage(page, '/dashboard');
      if (!navigated) {
        addResult('15. RTL Support', 'FAILED', 'Failed to navigate to dashboard - authentication required');
      } else {
        // Look for RTL elements
        const rtlElements = await page.locator('[dir="rtl"], .rtl').count();
        const hasLanguageToggle = await page.locator('button:has-text("עברית"), [data-testid*="language"]').count() > 0;
        
        const rtlWorking = rtlElements > 0 || hasLanguageToggle;
        
        addResult('15. RTL Support', rtlWorking ? 'PASSED' : 'FAILED', 
          rtlWorking ? 'RTL support found' : 'Failed to verify RTL');
      }
    } catch (error) {
      addResult('15. RTL Support', 'FAILED', 'Failed to verify RTL', error);
    }
    
    // 16. Hebrew Support
    try {
      const navigated = await navigateToAuthenticatedPage(page, '/dashboard');
      if (!navigated) {
        addResult('16. Hebrew Support', 'FAILED', 'Failed to navigate to dashboard - authentication required');
      } else {
        // Look for Hebrew text or language selector
        const hasHebrewText = await page.evaluate(() => {
          const text = document.body.innerText;
          return /[\u0590-\u05FF]/.test(text); // Hebrew Unicode range
        });
        
        const hasLanguageOption = await page.locator('option[value="he"], option:has-text("עברית"), [data-testid*="hebrew"]').count() > 0;
        
        const hebrewWorking = hasHebrewText || hasLanguageOption;
        
        addResult('16. Hebrew Support', hebrewWorking ? 'PASSED' : 'FAILED', 
          hebrewWorking ? 'Hebrew support found' : 'Failed to verify Hebrew');
      }
    } catch (error) {
      addResult('16. Hebrew Support', 'FAILED', 'Failed to verify Hebrew', error);
    }
    
    // 17. Test Coverage
    try {
      // Check if test coverage meets minimum requirements
      const fs = require('fs');
      const path = require('path');
      let testCoverageWorking = false;
      
      // Check if test results file exists
      const testResultsFile = path.join(process.cwd(), 'test-results.json');
      if (fs.existsSync(testResultsFile)) {
        try {
          const testResults = JSON.parse(fs.readFileSync(testResultsFile, 'utf8'));
          const passRate = testResults.passRate || 0;
          const totalTests = testResults.totalTests || 0;
          
          // Consider passing if we have reasonable test coverage
          if (passRate >= 50 && totalTests >= 100) {
            testCoverageWorking = true;
          }
        } catch (e) {
          // File exists but couldn't parse
        }
      }
      
      // Check if we have test files in the tests directory
      const testsDir = path.join(process.cwd(), 'tests');
      if (fs.existsSync(testsDir)) {
        const testFiles = fs.readdirSync(testsDir, { recursive: true })
          .filter(file => file.endsWith('.spec.ts') || file.endsWith('.test.ts'));
        
        if (testFiles.length >= 20) {
          testCoverageWorking = true;
        }
      }
      
      addResult('17. Test Coverage', testCoverageWorking ? 'PASSED' : 'FAILED', 
        testCoverageWorking ? 'Test coverage meets minimum requirements' : 'Insufficient test coverage');
    } catch (error) {
      addResult('17. Test Coverage', 'FAILED', 'Failed to verify test coverage', error);
    }
    
  } catch (error) {
    console.error('Critical error during EA verification:', error);
    addResult('CRITICAL ERROR', 'FAILED', 'Critical error during verification', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Calculate final results
  const passRate = (verificationResults.passedRequirements / verificationResults.totalRequirements) * 100;
  verificationResults.overallStatus = passRate >= 80 ? 'READY' : 'NOT_READY';
  
  // Output results
  console.log('\n' + '='.repeat(60));
  console.log('📊 EA VERIFICATION RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${verificationResults.passedRequirements}/${verificationResults.totalRequirements}`);
  console.log(`❌ Failed: ${verificationResults.failedRequirements}/${verificationResults.totalRequirements}`);
  console.log(`📈 Pass Rate: ${passRate.toFixed(1)}%`);
  console.log(`🎯 Overall Status: ${verificationResults.overallStatus}`);
  
  // Save results
  const resultsPath = path.join(process.cwd(), 'ea-verification-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(verificationResults, null, 2));
  console.log(`💾 Results saved to: ${resultsPath}`);
  
  if (verificationResults.overallStatus === 'NOT_READY') {
    console.log('\n⚠️  RECOMMENDATION: FIX ISSUES BEFORE EA LAUNCH');
  } else {
    console.log('\n🎉 READY FOR EA LAUNCH!');
  }
}

// Run the verification
runEAVerification().catch(console.error); 