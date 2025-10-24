#!/usr/bin/env node

/**
 * Test Tracker Script
 * Manages test execution and tracks test results for OvenAI project
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test categories
const TEST_CATEGORIES = {
  unit: 'Unit Tests',
  integration: 'Integration Tests',
  e2e: 'End-to-End Tests',
  smoke: 'Smoke Tests',
  accessibility: 'Accessibility Tests'
};

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createTestResults(category, command, passed, failed, total) {
  return {
    category,
    command,
    timestamp: new Date().toISOString(),
    results: {
      passed,
      failed,
      total,
      success: failed === 0
    }
  };
}

function saveTestResults(results) {
  const resultsDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const filename = `test-results-${results.category}-${Date.now()}.json`;
  const filepath = path.join(resultsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  log(`📊 Test results saved to: ${filename}`, 'blue');
}

function runTestCommand(category, command) {
  return new Promise((resolve, reject) => {
    log(`\n🚀 Running ${TEST_CATEGORIES[category] || category}...`, 'bold');
    log(`📋 Command: ${command}`, 'blue');
    
    const child = spawn('sh', ['-c', command], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${TEST_CATEGORIES[category] || category} completed successfully`, 'green');
        resolve({ success: true, code });
      } else {
        log(`❌ ${TEST_CATEGORIES[category] || category} failed with exit code ${code}`, 'red');
        resolve({ success: false, code });
      }
    });
    
    child.on('error', (error) => {
      log(`💥 Error running tests: ${error.message}`, 'red');
      reject(error);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    log('Usage: node test-tracker.js <category> <command>', 'yellow');
    log('Categories: unit, integration, e2e, smoke, accessibility', 'blue');
    process.exit(1);
  }
  
  const [category, ...commandParts] = args;
  const command = commandParts.join(' ');
  
  if (!TEST_CATEGORIES[category] && category !== 'custom') {
    log(`Unknown test category: ${category}`, 'red');
    log('Available categories: ' + Object.keys(TEST_CATEGORIES).join(', '), 'blue');
    process.exit(1);
  }
  
  try {
    log(`\n🧪 OvenAI Test Tracker`, 'bold');
    log(`📁 Working directory: ${process.cwd()}`, 'blue');
    
    const result = await runTestCommand(category, command);
    
    // Create basic test results (enhanced parsing can be added later)
    const testResults = createTestResults(
      category,
      command,
      result.success ? 1 : 0, // passed
      result.success ? 0 : 1, // failed  
      1 // total
    );
    
    saveTestResults(testResults);
    
    if (result.success) {
      log(`\n🎉 All tests completed successfully!`, 'green');
      process.exit(0);
    } else {
      log(`\n💥 Tests failed. Check the output above for details.`, 'red');
      process.exit(result.code || 1);
    }
    
  } catch (error) {
    log(`\n💥 Test execution failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n⏹️  Test execution interrupted by user', 'yellow');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('\n⏹️  Test execution terminated', 'yellow');
  process.exit(1);
});

if (require.main === module) {
  main().catch((error) => {
    log(`💥 Unhandled error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  runTestCommand,
  createTestResults,
  saveTestResults
}; 