#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Test Failure Analysis
 * Categorizes failing tests by error type to prioritize fixes
 */

const CATEGORIES = {
  EMAIL_DEPRECATED: 'Email Field Removed (Lead Management)',
  AUTHENTICATION: 'Authentication Flow Issues', 
  SELECTORS: 'CSS Selector Not Found',
  TIMEOUTS: 'Timeout/Loading Issues',
  NAVIGATION: 'Navigation/Routing Issues',
  MOBILE: 'Mobile Layout Issues',
  CHARTS: 'Charts/Data Visualization',
  FORMS: 'Form Validation/Submission',
  SECURITY: 'Security/Permissions',
  ACCESSIBILITY: 'Accessibility Issues',
  OTHER: 'Other Issues'
};

function categorizeError(testName, errorMessage) {
  const testLower = testName.toLowerCase();
  const errorLower = errorMessage.toLowerCase();

  // Email deprecation (highest priority - user mentioned this)
  if (errorLower.includes('email') && (testLower.includes('lead') || testLower.includes('csv') || testLower.includes('upload'))) {
    return CATEGORIES.EMAIL_DEPRECATED;
  }

  // Authentication issues
  if (errorLower.includes('login') || errorLower.includes('auth') || errorLower.includes('signin') || 
      errorLower.includes('password') || errorLower.includes('could not find login form')) {
    return CATEGORIES.AUTHENTICATION;
  }

  // Selector issues
  if (errorLower.includes('locator') || errorLower.includes('selector') || errorLower.includes('not found') ||
      errorLower.includes('waitforselector') || errorLower.includes('element not visible')) {
    return CATEGORIES.SELECTORS;
  }

  // Timeout issues
  if (errorLower.includes('timeout') || errorLower.includes('exceeded') || errorLower.includes('waitfor')) {
    return CATEGORIES.TIMEOUTS;
  }

  // Navigation issues
  if (errorLower.includes('navigation') || errorLower.includes('route') || errorLower.includes('url') ||
      testLower.includes('nav') || testLower.includes('sidebar') || testLower.includes('menu')) {
    return CATEGORIES.NAVIGATION;
  }

  // Mobile issues
  if (testLower.includes('mobile') || testLower.includes('responsive') || testLower.includes('touch') ||
      errorLower.includes('viewport') || errorLower.includes('breakpoint')) {
    return CATEGORIES.MOBILE;
  }

  // Charts/visualization
  if (testLower.includes('chart') || testLower.includes('graph') || testLower.includes('analytics') ||
      testLower.includes('dashboard') || errorLower.includes('recharts')) {
    return CATEGORIES.CHARTS;
  }

  // Forms
  if (testLower.includes('form') || errorLower.includes('validation') || errorLower.includes('submit') ||
      errorLower.includes('input') || errorLower.includes('field')) {
    return CATEGORIES.FORMS;
  }

  // Security
  if (testLower.includes('security') || testLower.includes('permission') || testLower.includes('admin') ||
      testLower.includes('role') || errorLower.includes('unauthorized')) {
    return CATEGORIES.SECURITY;
  }

  // Accessibility  
  if (testLower.includes('accessibility') || testLower.includes('a11y') || errorLower.includes('aria') ||
      errorLower.includes('alt text') || errorLower.includes('screen reader')) {
    return CATEGORIES.ACCESSIBILITY;
  }

  return CATEGORIES.OTHER;
}

function runTestAnalysis() {
  console.log('🔍 COMPREHENSIVE TEST FAILURE ANALYSIS');
  console.log('=======================================');
  
  const failures = {
    [CATEGORIES.EMAIL_DEPRECATED]: [],
    [CATEGORIES.AUTHENTICATION]: [],
    [CATEGORIES.SELECTORS]: [],
    [CATEGORIES.TIMEOUTS]: [],
    [CATEGORIES.NAVIGATION]: [],
    [CATEGORIES.MOBILE]: [],
    [CATEGORIES.CHARTS]: [],
    [CATEGORIES.FORMS]: [],
    [CATEGORIES.SECURITY]: [],
    [CATEGORIES.ACCESSIBILITY]: [],
    [CATEGORIES.OTHER]: []
  };

  try {
    console.log('🧪 Running full test suite with detailed output...');
    
    // Run tests and capture failures
    const testOutput = execSync('npm test 2>&1', { 
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      timeout: 300000 // 5 minutes
    });
    
    console.log('✅ All tests passed! No failures to analyze.');
    return;
    
  } catch (error) {
    console.log('📊 Analyzing test failures...');
    
    const output = error.stdout || error.message;
    const lines = output.split('\n');
    
    let currentTest = '';
    let currentError = '';
    let inError = false;
    
    for (const line of lines) {
      // Detect test names
      if (line.includes('❯') || line.includes('FAIL') || line.includes('×')) {
        if (currentTest && currentError) {
          const category = categorizeError(currentTest, currentError);
          failures[category].push({
            test: currentTest,
            error: currentError.trim(),
            fullOutput: line
          });
        }
        
        currentTest = line.trim();
        currentError = '';
        inError = false;
      }
      
      // Detect error messages
      if (line.includes('Error:') || line.includes('AssertionError:') || 
          line.includes('TimeoutError:') || line.includes('ExpectError:')) {
        inError = true;
        currentError = line.trim();
      } else if (inError && line.trim()) {
        currentError += ' ' + line.trim();
      }
      
      // Simple failure detection
      if (line.includes('❌') || line.includes('Could not find') || 
          line.includes('Authentication error') || line.includes('Timeout')) {
        const category = categorizeError(line, line);
        failures[category].push({
          test: line.trim(),
          error: line.trim(),
          fullOutput: line
        });
      }
    }
    
    // Add final test if exists
    if (currentTest && currentError) {
      const category = categorizeError(currentTest, currentError);
      failures[category].push({
        test: currentTest,
        error: currentError.trim(),
        fullOutput: currentTest
      });
    }
  }

  // Generate analysis report
  console.log('\n📋 FAILURE ANALYSIS REPORT');
  console.log('===========================');
  
  let totalFailures = 0;
  const priorityOrder = [
    CATEGORIES.EMAIL_DEPRECATED,
    CATEGORIES.AUTHENTICATION,
    CATEGORIES.SELECTORS,
    CATEGORIES.TIMEOUTS,
    CATEGORIES.NAVIGATION,
    CATEGORIES.MOBILE,
    CATEGORIES.CHARTS,
    CATEGORIES.FORMS,
    CATEGORIES.SECURITY,
    CATEGORIES.ACCESSIBILITY,
    CATEGORIES.OTHER
  ];

  for (const category of priorityOrder) {
    const categoryFailures = failures[category];
    if (categoryFailures.length > 0) {
      console.log(`\n🔸 ${category} (${categoryFailures.length} failures)`);
      console.log('─'.repeat(50));
      
      categoryFailures.forEach((failure, index) => {
        console.log(`${index + 1}. ${failure.test}`);
        if (failure.error !== failure.test) {
          console.log(`   Error: ${failure.error.slice(0, 100)}...`);
        }
      });
      
      totalFailures += categoryFailures.length;
    }
  }

  console.log(`\n📊 SUMMARY: ${totalFailures} total failures across ${priorityOrder.filter(cat => failures[cat].length > 0).length} categories`);
  
  // Priority recommendations
  console.log('\n🎯 RECOMMENDED FIX PRIORITY:');
  console.log('═══════════════════════════');
  
  if (failures[CATEGORIES.EMAIL_DEPRECATED].length > 0) {
    console.log('🥇 PRIORITY 1: Remove email fields from lead forms (user requirement)');
  }
  
  if (failures[CATEGORIES.AUTHENTICATION].length > 0) {
    console.log('🥈 PRIORITY 2: Fix authentication flow (blocks all other tests)');
  }
  
  if (failures[CATEGORIES.SELECTORS].length > 0) {
    console.log('🥉 PRIORITY 3: Update CSS selectors (easy wins)');
  }

  // Save detailed report
  const reportPath = 'test-results/failure-analysis.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalFailures,
      categoriesWithFailures: priorityOrder.filter(cat => failures[cat].length > 0).length
    },
    failures,
    recommendations: [
      failures[CATEGORIES.EMAIL_DEPRECATED].length > 0 ? 'Remove email fields from lead management' : null,
      failures[CATEGORIES.AUTHENTICATION].length > 0 ? 'Fix authentication flow' : null,
      failures[CATEGORIES.SELECTORS].length > 0 ? 'Update CSS selectors' : null
    ].filter(Boolean)
  }, null, 2));
  
  console.log(`\n💾 Detailed report saved: ${reportPath}`);
}

if (require.main === module) {
  runTestAnalysis();
}

module.exports = { runTestAnalysis, categorizeError, CATEGORIES }; 