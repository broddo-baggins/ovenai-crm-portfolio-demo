#!/usr/bin/env node

/**
 * Admin Console Test Runner
 * 
 * This script provides an easy way to run admin console tests
 * with various configurations and options.
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  log('='.repeat(60), 'cyan');
  log(`🛡️  ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function section(message) {
  log(`\n📋 ${message}`, 'yellow');
  log('-'.repeat(40), 'yellow');
}

// Test configurations
const testConfigs = {
  comprehensive: {
    file: 'tests/e2e/admin-console-comprehensive.spec.ts',
    description: 'Complete admin console test suite (positive + negative + security)'
  },
  commands: {
    file: 'tests/e2e/admin-commands-execution.spec.ts', 
    description: 'Admin command execution and validation tests'
  },
  dialogs: {
    file: 'tests/e2e/admin-ui-dialogs.spec.ts',
    description: 'Admin UI dialogs and component tests'
  },
  negative: {
    file: 'tests/e2e/admin-console-comprehensive.spec.ts',
    grep: 'NEGATIVE TESTS',
    description: 'Unauthorized access prevention tests'
  },
  positive: {
    file: 'tests/e2e/admin-console-comprehensive.spec.ts',
    grep: 'POSITIVE TESTS',
    description: 'Authorized admin functionality tests'
  },
  security: {
    file: 'tests/e2e/admin-console-comprehensive.spec.ts',
    grep: 'SECURITY',
    description: 'Security boundary and permission tests'
  },
  all: {
    file: 'tests/e2e/admin-console-*.spec.ts',
    description: 'All admin console tests'
  }
};

// Runtime options
const runtimeOptions = {
  headed: '--headed',
  ui: '--ui',
  debug: '--debug',
  trace: '--trace=on',
  workers1: '--workers=1',
  workers3: '--workers=3',
  timeout60: '--timeout=60000',
  chromium: '--browser=chromium',
  firefox: '--browser=firefox',
  webkit: '--browser=webkit'
};

function showUsage() {
  header('Admin Console Test Runner');
  
  log('\nUsage:', 'bright');
  log('  node scripts/testing/run-admin-console-tests.js [TEST_TYPE] [OPTIONS]');
  
  section('Available Test Types:');
  Object.entries(testConfigs).forEach(([key, config]) => {
    log(`  ${key.padEnd(15)} - ${config.description}`, 'cyan');
  });
  
  section('Available Options:');
  Object.entries(runtimeOptions).forEach(([key, value]) => {
    log(`  --${key.padEnd(12)} - Add ${value} to test command`, 'magenta');
  });
  
  section('Examples:');
  log('  # Run comprehensive test suite', 'green');
  log('  node scripts/testing/run-admin-console-tests.js comprehensive');
  log('');
  log('  # Run negative tests with UI', 'green');
  log('  node scripts/testing/run-admin-console-tests.js negative --ui');
  log('');
  log('  # Run all tests in headed mode with 1 worker', 'green');
  log('  node scripts/testing/run-admin-console-tests.js all --headed --workers1');
  log('');
  log('  # Debug security tests', 'green');
  log('  node scripts/testing/run-admin-console-tests.js security --debug');
  log('');
  log('  # Run dialogs tests with trace', 'green');
  log('  node scripts/testing/run-admin-console-tests.js dialogs --trace');
  
  section('Prerequisites:');
  log('  ✅ Application running on http://localhost:3002');
  log('  ✅ Test users exist (test@test.test, regular@test.test)');
  log('  ✅ Database connectivity for admin operations');
  
  console.log('');
}

function buildTestCommand(testType, options) {
  const config = testConfigs[testType];
  if (!config) {
    log(`❌ Unknown test type: ${testType}`, 'red');
    log('Available types: ' + Object.keys(testConfigs).join(', '), 'yellow');
    process.exit(1);
  }
  
  let command = `npx playwright test ${config.file}`;
  
  // Add grep filter if specified
  if (config.grep) {
    command += ` --grep "${config.grep}"`;
  }
  
  // Add runtime options
  options.forEach(option => {
    const cleanOption = option.replace('--', '');
    if (runtimeOptions[cleanOption]) {
      command += ` ${runtimeOptions[cleanOption]}`;
    } else {
      log(`⚠️  Unknown option: ${option}`, 'yellow');
    }
  });
  
  return command;
}

function checkPrerequisites() {
  section('Checking Prerequisites');
  
  try {
    // Check if Playwright is installed
    execSync('npx playwright --version', { stdio: 'pipe' });
    log('✅ Playwright is installed', 'green');
  } catch (error) {
    log('❌ Playwright not found. Installing...', 'red');
    try {
      execSync('npx playwright install', { stdio: 'inherit' });
      log('✅ Playwright installed successfully', 'green');
    } catch (installError) {
      log('❌ Failed to install Playwright', 'red');
      process.exit(1);
    }
  }
  
  // Check if test files exist
  const testFiles = [
    'tests/e2e/admin-console-comprehensive.spec.ts',
    'tests/e2e/admin-commands-execution.spec.ts',
    'tests/e2e/admin-ui-dialogs.spec.ts'
  ];
  
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ ${file} exists`, 'green');
    } else {
      log(`❌ ${file} not found`, 'red');
    }
  });
  
  log('\n⚠️  Make sure the application is running on http://localhost:3002', 'yellow');
  log('⚠️  Ensure test users exist in the database', 'yellow');
}

function runTests(testType, options) {
  const config = testConfigs[testType];
  
  header(`Running ${testType.toUpperCase()} Tests`);
  log(`Description: ${config.description}`, 'cyan');
  
  const command = buildTestCommand(testType, options);
  log(`\nCommand: ${command}`, 'blue');
  
  section('Test Execution');
  
  try {
    const startTime = Date.now();
    execSync(command, { stdio: 'inherit' });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log(`\n✅ Tests completed successfully in ${duration}s`, 'green');
    
    // Suggest next steps
    section('Next Steps');
    log('📊 View HTML report: npx playwright show-report', 'cyan');
    log('🔍 Analyze traces: npx playwright show-trace', 'cyan');
    log('📝 Check test results in playwright-report/', 'cyan');
    
  } catch (error) {
    log('\n❌ Tests failed', 'red');
    log('Check the output above for details', 'yellow');
    
    section('Troubleshooting');
    log('🔧 Try running with --headed to see browser', 'cyan');
    log('🔧 Use --debug for step-by-step debugging', 'cyan');
    log('🔧 Check application is running on localhost:3002', 'cyan');
    log('🔧 Verify test users exist in database', 'cyan');
    
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    return;
  }
  
  const testType = args[0];
  const options = args.slice(1).filter(arg => arg.startsWith('--'));
  
  // Special commands
  if (testType === 'check') {
    checkPrerequisites();
    return;
  }
  
  if (testType === 'list') {
    section('Available Test Types:');
    Object.entries(testConfigs).forEach(([key, config]) => {
      log(`${key}: ${config.description}`, 'cyan');
    });
    return;
  }
  
  // Check prerequisites before running tests
  checkPrerequisites();
  
  // Run the specified tests
  runTests(testType, options);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`\n❌ Uncaught exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`\n❌ Unhandled rejection: ${reason}`, 'red');
  process.exit(1);
});

// Run the main function
main(); 