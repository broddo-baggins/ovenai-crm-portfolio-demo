#!/usr/bin/env node

/**
 * TDD Test Analysis and Fix Script
 * Identifies failing tests and provides systematic fixes for 100% pass rate
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 TDD TEST ANALYSIS AND FIX TOOL');
console.log('==================================');

// Test categories for systematic analysis
const testCategories = {
  unit: 'tests/unit/',
  e2e: 'tests/e2e/',
  integration: 'tests/integration/',
  suites_unit: 'tests/suites/unit/',
  suites_e2e: 'tests/suites/e2e/',
  suites_mobile: 'tests/suites/mobile/',
  suites_accessibility: 'tests/suites/accessibility/'
};

const failurePatterns = {
  syntax: /SyntaxError|Missing semicolon|Unexpected token|Cannot find module/,
  imports: /Cannot find module|does not provide an export/,
  selectors: /waiting for selector|locator/,
  auth: /Authentication|login|unauthorized/,
  timeout: /Timeout|exceeded/,
  providers: /useAuth|useProject|Provider/
};

async function analyzeTestCategory(category, path) {
  console.log(`\n📊 ANALYZING: ${category}`);
  console.log('='.repeat(40));
  
  try {
    const result = execSync(`npx playwright test ${path} --reporter=list --workers=4 --max-failures=10`, 
      { encoding: 'utf8', timeout: 30000 });
    
    const lines = result.split('\n');
    const passedTests = lines.filter(line => line.includes('✓')).length;
    const failedTests = lines.filter(line => line.includes('❌')).length;
    
    console.log(`✅ PASSED: ${passedTests}`);
    console.log(`❌ FAILED: ${failedTests}`);
    
    if (failedTests === 0) {
      console.log(`🎉 ${category}: 100% PASS RATE!`);
      return { category, status: 'PASSING', passed: passedTests, failed: 0 };
    }
    
    // Analyze failure patterns
    const failures = lines.filter(line => line.includes('❌') || line.includes('Error'));
    console.log('\n🔍 FAILURE ANALYSIS:');
    
    const issues = {
      syntax: [],
      imports: [],
      selectors: [],
      auth: [],
      timeout: [],
      providers: []
    };
    
    failures.forEach(failure => {
      Object.keys(failurePatterns).forEach(pattern => {
        if (failurePatterns[pattern].test(failure)) {
          issues[pattern].push(failure);
        }
      });
    });
    
    // Provide specific fixes
    Object.keys(issues).forEach(issueType => {
      if (issues[issueType].length > 0) {
        console.log(`\n🔧 ${issueType.toUpperCase()} ISSUES (${issues[issueType].length}):`);
        issues[issueType].slice(0, 3).forEach(issue => {
          console.log(`   - ${issue.substring(0, 100)}...`);
        });
        console.log(`   💡 FIX: ${getFix(issueType)}`);
      }
    });
    
    return { category, status: 'FAILING', passed: passedTests, failed: failedTests, issues };
    
  } catch (error) {
    console.log(`❌ CRITICAL ERROR in ${category}: ${error.message.substring(0, 200)}`);
    return { category, status: 'CRITICAL', passed: 0, failed: -1, error: error.message };
  }
}

function getFix(issueType) {
  const fixes = {
    syntax: 'Fix syntax errors: true -> try, setAttrue -> setAttribute, fix quotes',
    imports: 'Add missing exports to comprehensive-test-helpers.ts',
    selectors: 'Update selectors to match actual DOM elements',
    auth: 'Add AuthProvider wrapper and proper authentication',
    timeout: 'Increase timeouts and add retry mechanisms',
    providers: 'Add ProjectProvider and DashboardProvider wrappers'
  };
  return fixes[issueType] || 'Manual investigation required';
}

async function generateTDDReport() {
  console.log('\n📋 GENERATING TDD COMPLIANCE REPORT...');
  
  const results = [];
  
  for (const [category, testPath] of Object.entries(testCategories)) {
    if (fs.existsSync(testPath)) {
      const result = await analyzeTestCategory(category, testPath);
      results.push(result);
    } else {
      console.log(`⚠️  ${category}: Path does not exist - ${testPath}`);
    }
  }
  
  // Generate summary
  console.log('\n🎯 TDD COMPLIANCE SUMMARY');
  console.log('==========================');
  
  const passingCategories = results.filter(r => r.status === 'PASSING');
  const failingCategories = results.filter(r => r.status === 'FAILING');
  const criticalCategories = results.filter(r => r.status === 'CRITICAL');
  
  console.log(`✅ PASSING CATEGORIES: ${passingCategories.length}/${results.length}`);
  console.log(`❌ FAILING CATEGORIES: ${failingCategories.length}/${results.length}`);
  console.log(`🚨 CRITICAL CATEGORIES: ${criticalCategories.length}/${results.length}`);
  
  const totalPassed = results.reduce((sum, r) => sum + (r.passed || 0), 0);
  const totalFailed = results.reduce((sum, r) => sum + Math.max(0, r.failed || 0), 0);
  const passRate = totalPassed + totalFailed > 0 ? ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1) : 0;
  
  console.log(`\n📊 OVERALL PASS RATE: ${passRate}% (${totalPassed}/${totalPassed + totalFailed})`);
  
  if (passRate < 100) {
    console.log('\n🚨 TDD VIOLATION: Tests must pass BEFORE feature implementation!');
    console.log('📋 REQUIRED ACTIONS:');
    
    failingCategories.forEach(category => {
      console.log(`\n❌ ${category.category}:`);
      if (category.issues) {
        Object.keys(category.issues).forEach(issueType => {
          if (category.issues[issueType].length > 0) {
            console.log(`   🔧 ${issueType}: ${getFix(issueType)}`);
          }
        });
      }
    });
  } else {
    console.log('\n🎉 TDD COMPLIANCE ACHIEVED! All tests passing - ready for feature development!');
  }
  
  // Save detailed report
  const reportPath = `test-results/tdd-compliance-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved: ${reportPath}`);
  
  return { passRate, results };
}

// Run the analysis
generateTDDReport().catch(console.error); 