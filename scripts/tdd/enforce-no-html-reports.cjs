#!/usr/bin/env node

/**
 * 🚨 HTML REPORT PREVENTION ENFORCER
 * Prevents any HTML report generation that causes test hangs
 * NEVER ALLOW HTML REPORTS - THEY BREAK TDD WORKFLOW!
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 ENFORCING NO-HTML-REPORTS POLICY');
console.log('=====================================');

function enforceTextOnlyReporters() {
  console.log('\n🔍 SCANNING FOR HTML REPORT VIOLATIONS...\n');
  
  let totalViolations = 0;

  // Check playwright config
  if (fs.existsSync('playwright.config.ts')) {
    const content = fs.readFileSync('playwright.config.ts', 'utf8');
    if (content.includes("'html'") || content.includes('"html"')) {
      console.log('❌ HTML reporter found in playwright.config.ts');
      totalViolations++;
    }
  }

  // Check vitest config  
  if (fs.existsSync('vitest.config.ts')) {
    const content = fs.readFileSync('vitest.config.ts', 'utf8');
    if (content.includes("'html'") || content.includes('"html"')) {
      console.log('❌ HTML reporter found in vitest.config.ts');
      totalViolations++;
    }
  }

  // Check package.json for specific HTML report commands
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts || {};
    
    Object.keys(scripts).forEach(scriptName => {
      const script = scripts[scriptName];
      
      // Only flag actual HTML report commands
      if (script.includes('show-report') || 
          script.includes('--reporter=html') ||
          script.includes('--ui') ||
          script.includes('allure generate')) {
        console.log(`❌ HTML REPORT VIOLATION in package.json script: ${scriptName}`);
        console.log(`   Command: ${script}`);
        totalViolations++;
      }
    });
  }

  console.log('\n📊 ENFORCEMENT SUMMARY:');
  console.log('========================');
  
  if (totalViolations === 0) {
    console.log('✅ NO HTML REPORT VIOLATIONS FOUND!');
    console.log('✅ TDD-COMPLIANT: Text-only reporters enforced');
    console.log('\n🎯 APPROVED REPORTERS:');
    console.log('   ✅ list (Playwright)');
    console.log('   ✅ verbose (Vitest)'); 
    console.log('   ✅ json (for analysis)');
    console.log('   ✅ text (coverage)');
  } else {
    console.log(`❌ ${totalViolations} HTML REPORT VIOLATIONS FOUND!`);
    console.log('🚨 ACTION REQUIRED: Remove all HTML report configurations');
    process.exit(1);
  }
}

// Create .no-html-reports marker file
function createEnforcementMarker() {
  const markerContent = `# NO HTML REPORTS POLICY - PREVENTS TEST HANGS
# Created: ${new Date().toISOString()}
# NEVER REMOVE THIS FILE

POLICY: Text-only test reporters ONLY
FORBIDDEN: HTML, Allure, UI-based reporters  
ALLOWED: list, verbose, json, text
`;

  fs.writeFileSync('.no-html-reports', markerContent);
  console.log('✅ Created enforcement marker: .no-html-reports');
}

// Run enforcement
enforceTextOnlyReporters();
createEnforcementMarker();

console.log('\n🎯 HTML REPORT PREVENTION COMPLETE!');
console.log('🚀 READY FOR FAST TDD TESTING - NO MORE HANGS!'); 