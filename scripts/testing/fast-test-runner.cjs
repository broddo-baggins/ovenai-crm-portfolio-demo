#!/usr/bin/env node

/**
 * Fast Test Runner
 * Optimized test execution for speed (2.5h → 15-20 minutes)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_STRATEGIES = {
  'ultra-fast': {
    description: 'Critical tests only (~5 minutes)',
    patterns: [
      'tests/e2e/full-system-e2e.spec.ts',
      'tests/e2e/authentication*.spec.ts'
    ],
    projects: ['chromium-fast'],
    workers: 8,
    timeout: 20000
  },
  
  'fast': {
    description: 'Essential functionality (~15 minutes)',
    patterns: [
      'tests/e2e/full-system-e2e.spec.ts',
      'tests/e2e/authentication*.spec.ts',
      'tests/e2e/dashboard*.spec.ts',
      'tests/e2e/leads*.spec.ts',
      'tests/e2e/navigation*.spec.ts'
    ],
    projects: ['chromium-fast'],
    workers: 6,
    timeout: 30000
  },
  
  'comprehensive': {
    description: 'All essential tests (~30 minutes)',
    patterns: [
      'tests/**/*.spec.ts'
    ],
    projects: ['chromium-fast', 'mobile-essential'],
    workers: 4,
    timeout: 45000,
    exclude: [
      'tests/**/queue*.spec.ts',
      'tests/**/performance*.spec.ts',
      'tests/**/visual*.spec.ts'
    ]
  },
  
  'full': {
    description: 'Complete test suite (~1 hour)',
    patterns: ['tests/**/*.spec.ts'],
    projects: ['chromium-fast', 'mobile-essential', 'firefox-critical'],
    workers: 4,
    timeout: 60000
  }
};

function parseArgs() {
  const args = process.argv.slice(2);
  
  const options = {
    strategy: 'fast',
    verbose: false,
    bail: false,
    reporter: 'line',
    headed: false
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--strategy':
      case '-s':
        options.strategy = args[++i];
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--bail':
      case '-b':
        options.bail = true;
        break;
      case '--headed':
        options.headed = true;
        break;
      case '--reporter':
      case '-r':
        options.reporter = args[++i];
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

function showHelp() {
  console.log(`
🚀 Fast Test Runner - Optimized Playwright Testing

Usage: node scripts/testing/fast-test-runner.js [options]

Strategies:
`);
  
  Object.entries(TEST_STRATEGIES).forEach(([name, config]) => {
    console.log(`  ${name.padEnd(12)} - ${config.description}`);
  });
  
  console.log(`
Options:
  -s, --strategy <name>     Test strategy (default: fast)
  -v, --verbose            Verbose output
  -b, --bail               Stop on first failure
  --headed                 Run in headed mode
  -r, --reporter <type>    Reporter type (line, html, json)
  -h, --help               Show this help

Examples:
  node scripts/testing/fast-test-runner.js                    # Fast strategy
  node scripts/testing/fast-test-runner.js -s ultra-fast     # Ultra fast
  node scripts/testing/fast-test-runner.js -s comprehensive  # Comprehensive
  node scripts/testing/fast-test-runner.js --headed -v       # Debug mode
`);
}

async function runTests(options) {
  const strategy = TEST_STRATEGIES[options.strategy];
  
  if (!strategy) {
    console.error(`❌ Unknown strategy: ${options.strategy}`);
    console.log('Available strategies:', Object.keys(TEST_STRATEGIES).join(', '));
    process.exit(1);
  }
  
  console.log(`🚀 Running tests with ${options.strategy} strategy`);
  console.log(`📋 ${strategy.description}`);
  console.log(`⚡ Workers: ${strategy.workers}, Timeout: ${strategy.timeout}ms`);
  console.log('');
  
  const playwrightArgs = [
    'test',
    
    // Test patterns
    ...strategy.patterns,
    
    // Project selection
    ...strategy.projects.map(project => `--project=${project}`),
    
    // Performance options
    `--workers=${strategy.workers}`,
    `--timeout=${strategy.timeout}`,
    `--reporter=${options.reporter}`,
    
    // Exclude patterns
    ...(strategy.exclude || []).map(pattern => `--ignore-pattern=${pattern}`),
    
    // Additional options
    ...(options.bail ? ['--max-failures=1'] : []),
    ...(options.headed ? ['--headed'] : []),
    ...(options.verbose ? ['--verbose'] : [])
  ];
  
  // Set environment variables for speed
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
    PWDEBUG: options.verbose ? '1' : '0'
  };
  
  console.log('🧪 Starting test execution...');
  const startTime = Date.now();
  
  try {
    const result = await runCommand('npx', ['playwright', ...playwrightArgs], { env });
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    if (result.code === 0) {
      console.log(`\n✅ Tests completed successfully in ${duration} minutes`);
    } else {
      console.log(`\n❌ Tests failed in ${duration} minutes`);
    }
    
    return result.code;
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
    return 1;
  }
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options
    });
    
    child.on('close', (code) => {
      resolve({ code });
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  // Check if server is running
  try {
    const response = await fetch('http://localhost:3001');
    if (response.ok) {
      console.log('✅ Development server is running');
    }
  } catch (error) {
    console.log('⚠️ Development server may not be running');
    console.log('   Start with: npm run dev');
  }
  
  // Check test user
  try {
    const { spawn } = require('child_process');
    const checkUser = spawn('node', ['scripts/testing/check-test-user.cjs'], { stdio: 'pipe' });
    
    checkUser.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Test user verified');
      } else {
        console.log('⚠️ Test user may have issues');
      }
    });
  } catch (error) {
    console.log('⚠️ Could not verify test user');
  }
  
  console.log('');
}

async function main() {
  const options = parseArgs();
  
  // Show available strategies if no strategy specified
  if (process.argv.length === 2) {
    console.log('🎯 Available test strategies:\n');
    Object.entries(TEST_STRATEGIES).forEach(([name, config]) => {
      console.log(`  ${name.padEnd(12)} - ${config.description}`);
    });
    console.log('\nRun with -h for more options\n');
  }
  
  await checkPrerequisites();
  const exitCode = await runTests(options);
  process.exit(exitCode);
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, TEST_STRATEGIES }; 