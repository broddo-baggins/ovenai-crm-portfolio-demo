#!/usr/bin/env node

/**
 * Design System Compliance Report Generator
 * 
 * This script generates a comprehensive report on our design system compliance
 * based on the "Golden Row" standard established by the Messages page.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, options = {}) {
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

function generateReport() {
  log('\n🎯 OVEN AI DESIGN SYSTEM COMPLIANCE REPORT', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Generated: ${new Date().toLocaleString()}`, 'white');
  log(`Based on "Golden Row" standard (Messages page)\n`, 'white');

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      issues: [],
    },
    sections: {},
  };

  // Section 1: RTL Compliance Testing
  log('📋 SECTION 1: RTL COMPLIANCE TESTING', 'blue');
  log('-'.repeat(40), 'blue');
  
  const rtlTest = runCommand('npm run test:rtl', { silent: true });
  report.sections.rtl = {
    passed: rtlTest.success,
    output: rtlTest.output,
    issues: [],
  };

  if (rtlTest.success) {
    log('✅ RTL automation tests passed', 'green');
  } else {
    log('❌ RTL automation tests failed', 'red');
    report.summary.issues.push('RTL compliance issues detected');
  }

  // Section 2: Messages Page Testing (Golden Row)
  log('\n📋 SECTION 2: GOLDEN ROW TESTING (Messages Page)', 'blue');
  log('-'.repeat(40), 'blue');

  const messagesTest = runCommand('npm run test:messages', { silent: true });
  report.sections.messages = {
    passed: messagesTest.success,
    output: messagesTest.output,
  };

  if (messagesTest.success) {
    log('✅ Messages page tests passed (Golden Row verified)', 'green');
  } else {
    log('❌ Messages page tests failed', 'red');
    report.summary.issues.push('Golden Row standard violations in Messages page');
  }

  // Section 3: Dark Mode Compliance
  log('\n📋 SECTION 3: DARK MODE COMPLIANCE', 'blue');
  log('-'.repeat(40), 'blue');

  const darkModeTest = runCommand('npm run test:dark-mode', { silent: true });
  report.sections.darkMode = {
    passed: darkModeTest.success,
    output: darkModeTest.output,
  };

  if (darkModeTest.success) {
    log('✅ Dark mode tests passed', 'green');
  } else {
    log('❌ Dark mode tests failed', 'red');
    report.summary.issues.push('Dark mode implementation issues');
  }

  // Section 4: Translation System
  log('\n📋 SECTION 4: TRANSLATION SYSTEM', 'blue');
  log('-'.repeat(40), 'blue');

  const translationTest = runCommand('npm run test:translations', { silent: true });
  report.sections.translations = {
    passed: translationTest.success,
    output: translationTest.output,
  };

  if (translationTest.success) {
    log('✅ Translation tests passed', 'green');
  } else {
    log('❌ Translation tests failed', 'red');
    report.summary.issues.push('Translation system issues');
  }

  // Section 5: Accessibility Testing
  log('\n📋 SECTION 5: ACCESSIBILITY COMPLIANCE', 'blue');
  log('-'.repeat(40), 'blue');

  const a11yTest = runCommand('npm run test:accessibility', { silent: true });
  report.sections.accessibility = {
    passed: a11yTest.success,
    output: a11yTest.output,
  };

  if (a11yTest.success) {
    log('✅ Accessibility tests passed', 'green');
  } else {
    log('❌ Accessibility tests failed', 'red');
    report.summary.issues.push('Accessibility compliance issues');
  }

  // Section 6: Component Library Analysis
  log('\n📋 SECTION 6: COMPONENT LIBRARY ANALYSIS', 'blue');
  log('-'.repeat(40), 'blue');

  try {
    const srcPath = path.join(process.cwd(), 'src');
    const componentStats = analyzeComponentLibrary(srcPath);
    report.sections.componentLibrary = componentStats;

    log(`📊 Total Components: ${componentStats.totalComponents}`, 'white');
    log(`🎨 UI Components: ${componentStats.uiComponents}`, 'white');
    log(`📄 Page Components: ${componentStats.pageComponents}`, 'white');
    log(`🔧 Utility Components: ${componentStats.utilityComponents}`, 'white');
    log(`🌐 Components with RTL: ${componentStats.rtlCompliant}`, 'green');
    log(`🌙 Components with Dark Mode: ${componentStats.darkModeCompliant}`, 'green');
    log(`🔤 Components with Translations: ${componentStats.translationCompliant}`, 'green');

    const rtlCoverage = (componentStats.rtlCompliant / componentStats.totalComponents * 100).toFixed(1);
    const darkCoverage = (componentStats.darkModeCompliant / componentStats.totalComponents * 100).toFixed(1);
    const translationCoverage = (componentStats.translationCompliant / componentStats.totalComponents * 100).toFixed(1);

    log(`\n📈 COVERAGE METRICS:`, 'yellow');
    log(`   RTL Coverage: ${rtlCoverage}%`, rtlCoverage > 80 ? 'green' : 'yellow');
    log(`   Dark Mode Coverage: ${darkCoverage}%`, darkCoverage > 80 ? 'green' : 'yellow');
    log(`   Translation Coverage: ${translationCoverage}%`, translationCoverage > 80 ? 'green' : 'yellow');

  } catch (error) {
    log(`❌ Component analysis failed: ${error.message}`, 'red');
    report.summary.issues.push('Component library analysis failed');
  }

  // Section 7: Build and Type Check
  log('\n📋 SECTION 7: BUILD VERIFICATION', 'blue');
  log('-'.repeat(40), 'blue');

  const typeCheck = runCommand('npx tsc --noEmit', { silent: true });
  const buildCheck = runCommand('npm run build:check', { silent: true });

  report.sections.build = {
    typeCheck: typeCheck.success,
    buildCheck: buildCheck.success,
  };

  if (typeCheck.success) {
    log('✅ TypeScript compilation successful', 'green');
  } else {
    log('❌ TypeScript compilation failed', 'red');
    report.summary.issues.push('TypeScript compilation errors');
  }

  if (buildCheck.success) {
    log('✅ Build verification successful', 'green');
  } else {
    log('❌ Build verification failed', 'red');
    report.summary.issues.push('Build process errors');
  }

  // Generate Summary
  log('\n🎯 COMPLIANCE SUMMARY', 'magenta');
  log('='.repeat(60), 'magenta');

  const sections = Object.values(report.sections);
  const totalSections = sections.length;
  const passedSections = sections.filter(section => 
    typeof section.passed === 'boolean' ? section.passed : true
  ).length;

  report.summary.totalTests = totalSections;
  report.summary.passedTests = passedSections;
  report.summary.failedTests = totalSections - passedSections;

  const overallScore = (passedSections / totalSections * 100).toFixed(1);
  const scoreColor = overallScore >= 90 ? 'green' : overallScore >= 70 ? 'yellow' : 'red';

  log(`Overall Compliance Score: ${overallScore}%`, scoreColor);
  log(`Sections Passed: ${passedSections}/${totalSections}`, passedSections === totalSections ? 'green' : 'yellow');

  if (report.summary.issues.length > 0) {
    log('\n⚠️  ISSUES DETECTED:', 'yellow');
    report.summary.issues.forEach(issue => {
      log(`   • ${issue}`, 'yellow');
    });
  } else {
    log('\n🎉 NO CRITICAL ISSUES DETECTED!', 'green');
  }

  // Golden Row Compliance Badge
  if (overallScore >= 95) {
    log('\n🏆 GOLDEN ROW COMPLIANCE ACHIEVED!', 'green');
    log('   Your codebase meets the highest standards.', 'green');
  } else if (overallScore >= 85) {
    log('\n🥈 EXCELLENT COMPLIANCE LEVEL', 'green');
    log('   Minor improvements needed to reach Golden Row status.', 'yellow');
  } else if (overallScore >= 70) {
    log('\n🥉 GOOD COMPLIANCE LEVEL', 'yellow');
    log('   Several improvements needed for optimal compliance.', 'yellow');
  } else {
    log('\n⚠️  COMPLIANCE NEEDS ATTENTION', 'red');
    log('   Significant improvements required to meet standards.', 'red');
  }

  // Recommendations
  log('\n💡 RECOMMENDATIONS:', 'cyan');
  if (report.sections.componentLibrary) {
    const stats = report.sections.componentLibrary;
    if (stats.rtlCompliant / stats.totalComponents < 0.8) {
      log('   • Improve RTL support using useLang hook', 'cyan');
    }
    if (stats.darkModeCompliant / stats.totalComponents < 0.8) {
      log('   • Add dark: variants to all background/border/text classes', 'cyan');
    }
    if (stats.translationCompliant / stats.totalComponents < 0.8) {
      log('   • Replace hardcoded text with translation keys', 'cyan');
    }
  }
  log('   • Follow the Messages page as your Golden Row reference', 'cyan');
  log('   • Run automated tests regularly during development', 'cyan');
  log('   • Use Storybook for visual regression testing', 'cyan');

  // Save report to file
  const reportPath = path.join(process.cwd(), 'design-system-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 Detailed report saved to: ${reportPath}`, 'blue');

  log('\n' + '='.repeat(60), 'cyan');
  log('🎯 DESIGN SYSTEM COMPLIANCE REPORT COMPLETE', 'cyan');
}

function analyzeComponentLibrary(srcPath) {
  const stats = {
    totalComponents: 0,
    uiComponents: 0,
    pageComponents: 0,
    utilityComponents: 0,
    rtlCompliant: 0,
    darkModeCompliant: 0,
    translationCompliant: 0,
    files: [],
  };

  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'test' && item !== '__tests__') {
        scanDirectory(fullPath);
      } else if (item.endsWith('.tsx') && !item.endsWith('.test.tsx') && !item.endsWith('.stories.tsx')) {
        analyzeComponent(fullPath, stats);
      }
    }
  }

  scanDirectory(srcPath);
  return stats;
}

function analyzeComponent(filePath, stats) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Skip non-component files
  if (!content.includes('return') || !content.includes('className')) {
    return;
  }

  stats.totalComponents++;
  
  // Categorize component type
  if (filePath.includes('/ui/')) {
    stats.uiComponents++;
  } else if (filePath.includes('/pages/')) {
    stats.pageComponents++;
  } else {
    stats.utilityComponents++;
  }

  // Check RTL compliance
  if (content.includes('useLang') || content.includes('textStart') || content.includes('flexRowReverse')) {
    stats.rtlCompliant++;
  }

  // Check dark mode compliance
  if (content.includes('dark:')) {
    stats.darkModeCompliant++;
  }

  // Check translation compliance
  if (content.includes('useTranslation') || content.includes('t(')) {
    stats.translationCompliant++;
  }

  stats.files.push({
    path: filePath,
    hasRTL: content.includes('useLang'),
    hasDarkMode: content.includes('dark:'),
    hasTranslations: content.includes('t('),
  });
}

// Run the report generator
if (require.main === module) {
  generateReport();
}

module.exports = { generateReport, analyzeComponentLibrary }; 