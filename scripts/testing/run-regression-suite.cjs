#!/usr/bin/env node

/**
 * 🧪 Regression Test Suite Runner
 * Runs all test suites with 6 workers for maximum efficiency
 * Tracks results and provides comprehensive reporting
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test Suite Configuration (Updated for 8 workers)
const TEST_SUITES = {
  // E2E Test Suites (8 workers for better performance)
  e2e: {
    admin: { path: 'tests/suites/e2e/admin/', workers: 2, priority: 1 },
    auth: { path: 'tests/suites/e2e/auth/', workers: 2, priority: 1 },
    dashboard: { path: 'tests/suites/e2e/dashboard/', workers: 2, priority: 2 },
    leads: { path: 'tests/suites/e2e/leads/', workers: 2, priority: 2 },
    queue: { path: 'tests/suites/e2e/queue/', workers: 2, priority: 2 },
    reports: { path: 'tests/suites/e2e/reports/', workers: 2, priority: 3 },
    messages: { path: 'tests/suites/e2e/messages/', workers: 2, priority: 3 },
    navigation: { path: 'tests/suites/e2e/navigation/', workers: 2, priority: 3 },
    errors: { path: 'tests/suites/e2e/errors/', workers: 2, priority: 4 },
    public: { path: 'tests/suites/e2e/public/', workers: 2, priority: 4 },
    integration: { path: 'tests/suites/e2e/integration/', workers: 2, priority: 2 },
    performance: { path: 'tests/suites/e2e/performance/', workers: 2, priority: 1 }
  },
  
  // Unit Test Suites (4 workers)
  unit: {
    components: { path: 'tests/suites/unit/components/', workers: 2, priority: 1 },
    services: { path: 'tests/suites/unit/services/', workers: 2, priority: 1 },
    utils: { path: 'tests/suites/unit/utils/', workers: 2, priority: 2 },
    hooks: { path: 'tests/suites/unit/hooks/', workers: 2, priority: 2 }
  },
  
  // Integration Test Suites (3 workers)
  integration: {
    api: { path: 'tests/suites/integration/api/', workers: 1, priority: 1 },
    database: { path: 'tests/suites/integration/database/', workers: 1, priority: 1 },
    external: { path: 'tests/suites/integration/external/', workers: 1, priority: 2 }
  },
  
  // Mobile Test Suites (2 workers)
  mobile: {
    responsive: { path: 'tests/suites/mobile/responsive/', workers: 1, priority: 1 },
    touch: { path: 'tests/suites/mobile/touch/', workers: 1, priority: 2 },
    orientation: { path: 'tests/suites/mobile/orientation/', workers: 1, priority: 3 },
    performance: { path: 'tests/suites/mobile/performance/', workers: 1, priority: 3 }
  },
  
  // Security Test Suites (2 workers)
  security: {
    authentication: { path: 'tests/suites/security/authentication/', workers: 1, priority: 1 },
    authorization: { path: 'tests/suites/security/authorization/', workers: 1, priority: 1 },
    'data-protection': { path: 'tests/suites/security/data-protection/', workers: 1, priority: 2 },
    penetration: { path: 'tests/suites/security/penetration/', workers: 1, priority: 3 }
  },
  
  // Performance Test Suites (2 workers)
  performance: {
    load: { path: 'tests/suites/performance/load/', workers: 1, priority: 1 },
    stress: { path: 'tests/suites/performance/stress/', workers: 1, priority: 2 },
    optimization: { path: 'tests/suites/performance/optimization/', workers: 1, priority: 3 }
  },
  
  // Accessibility Test Suites (1 worker)
  accessibility: {
    wcag: { path: 'tests/suites/accessibility/wcag/', workers: 1, priority: 1 },
    i18n: { path: 'tests/suites/accessibility/i18n/', workers: 1, priority: 2 }
  }
};

// Configuration
const DEFAULT_CONFIG = {
  maxWorkers: 8,
  timeout: 30000,
  retries: 1,
  failFast: false,
  parallel: true,
  framework: 'playwright' // or 'vitest' for unit tests
};

class RegressionTestRunner {
  constructor(options = {}) {
    this.config = { ...DEFAULT_CONFIG, ...options };
    this.results = [];
    this.startTime = Date.now();
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async runAll() {
    console.log('🧪 Starting Regression Test Suite with 8 Workers');
    console.log('='.repeat(60));
    
    try {
      // Run tests by priority level
      await this.runByPriority();
      
      // Generate results
      await this.generateResults();
      
      // Update tracking
      await this.updateResultsTracking();
      
      console.log('\n🏆 Regression Test Suite Complete');
      this.printSummary();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Regression test suite failed:', error.message);
      process.exit(1);
    }
  }

  async runByPriority() {
    const priorities = [1, 2, 3, 4];
    
    for (const priority of priorities) {
      console.log(`\n🎯 Running Priority ${priority} Tests`);
      console.log('-'.repeat(40));
      
      const suitesAtPriority = this.getSuitesAtPriority(priority);
      
      if (this.config.parallel) {
        await this.runSuitesParallel(suitesAtPriority);
      } else {
        await this.runSuitesSequential(suitesAtPriority);
      }
    }
  }

  getSuitesAtPriority(priority) {
    const suites = [];
    
    for (const [category, categoryTests] of Object.entries(TEST_SUITES)) {
      for (const [suiteName, suiteConfig] of Object.entries(categoryTests)) {
        if (suiteConfig.priority === priority) {
          suites.push({
            category,
            name: suiteName,
            fullName: `${category}_${suiteName}`,
            ...suiteConfig
          });
        }
      }
    }
    
    return suites;
  }

  async runSuitesParallel(suites) {
    const promises = suites.map(suite => this.runSuite(suite));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`❌ Suite ${suites[index].fullName} failed:`, result.reason);
      }
    });
  }

  async runSuitesSequential(suites) {
    for (const suite of suites) {
      await this.runSuite(suite);
    }
  }

  async runSuite(suite) {
    const startTime = Date.now();
    console.log(`  🧪 Running ${suite.fullName}...`);
    
    try {
      let command, args;
      
      if (suite.category === 'unit') {
        // Run unit tests with Vitest
        command = 'npx';
        args = ['vitest', 'run', suite.path, '--reporter=json'];
      } else {
        // Run E2E/Integration tests with Playwright
        command = 'npx';
        args = [
          'playwright', 'test', 
          suite.path,
          '--workers=1',
          '--reporter=json',
          `--timeout=${this.config.timeout}`
        ];
      }
      
      const result = await this.executeCommand(command, args);
      const duration = Date.now() - startTime;
      
      const suiteResult = {
        suite: suite.fullName,
        category: suite.category,
        path: suite.path,
        status: result.exitCode === 0 ? 'PASS' : 'FAIL',
        duration,
        tests: result.tests || 0,
        passed: result.passed || 0,
        failed: result.failed || 0,
        output: result.stdout,
        error: result.stderr
      };
      
      this.results.push(suiteResult);
      this.totalTests += suiteResult.tests;
      this.passedTests += suiteResult.passed;
      this.failedTests += suiteResult.failed;
      
      const status = suiteResult.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${status} ${suite.fullName} (${duration}ms)`);
      
      return suiteResult;
      
    } catch (error) {
      console.error(`  ❌ ${suite.fullName} failed:`, error.message);
      const failedResult = {
        suite: suite.fullName,
        category: suite.category,
        path: suite.path,
        status: 'ERROR',
        duration: Date.now() - startTime,
        error: error.message
      };
      this.results.push(failedResult);
      return failedResult;
    }
  }

  executeCommand(command, args) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { stdio: 'pipe' });
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (exitCode) => {
        let tests = 0, passed = 0, failed = 0;
        
        try {
          // Try to parse JSON output for test counts
          const jsonOutput = JSON.parse(stdout);
          if (jsonOutput.stats) {
            tests = jsonOutput.stats.total || 0;
            passed = jsonOutput.stats.passed || 0;
            failed = jsonOutput.stats.failed || 0;
          }
        } catch (e) {
          // Fallback to parsing text output
          const testMatch = stdout.match(/(\d+) (test|spec)s? ran/i);
          if (testMatch) tests = parseInt(testMatch[1]);
          
          const passMatch = stdout.match(/(\d+) passed/i);
          if (passMatch) passed = parseInt(passMatch[1]);
          
          const failMatch = stdout.match(/(\d+) failed/i);
          if (failMatch) failed = parseInt(failMatch[1]);
        }
        
        resolve({
          exitCode,
          stdout,
          stderr,
          tests,
          passed,
          failed
        });
      });
      
      process.on('error', reject);
    });
  }

  async generateResults() {
    const resultsDir = path.join(process.cwd(), 'tests/results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const resultFile = path.join(resultsDir, `regression_${timestamp.split('T')[0]}.json`);
    
    const summary = {
      timestamp,
      totalDuration: Date.now() - this.startTime,
      totalTests: this.totalTests,
      passedTests: this.passedTests,
      failedTests: this.failedTests,
      successRate: this.totalTests > 0 ? ((this.passedTests / this.totalTests) * 100).toFixed(2) : 0,
      suites: this.results
    };
    
    fs.writeFileSync(resultFile, JSON.stringify(summary, null, 2));
    console.log(`\n📊 Results saved to: ${resultFile}`);
  }

  async updateResultsTracking() {
    try {
      const trackerPath = path.join(process.cwd(), 'tests/results/test-results-tracker.js');
      if (fs.existsSync(trackerPath)) {
        const { TestResultsTracker } = require('../../tests/results/test-results-tracker.js');
        const tracker = new TestResultsTracker();
        
        for (const result of this.results) {
          await tracker.logTestResult({
            suiteName: result.suite,
            testFile: result.path,
            testName: `${result.category} suite`,
            status: result.status,
            duration: result.duration,
            coverage: 0, // Would need to calculate actual coverage
            error: result.error || null
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not update results tracking:', error.message);
    }
  }

  printSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const successRate = this.totalTests > 0 ? ((this.passedTests / this.totalTests) * 100).toFixed(2) : 0;
    
    console.log('\n📊 Regression Test Summary');
    console.log('='.repeat(40));
    console.log(`⏱️  Total Duration: ${duration}s`);
    console.log(`🧪 Total Tests: ${this.totalTests}`);
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log('\n🏆 Suite Results:');
    
    this.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`  ${status} ${result.suite} (${result.duration}ms)`);
    });
    
    if (this.failedTests > 0) {
      console.log('\n❌ Failed Suites Need Attention');
      process.exit(1);
    } else {
      console.log('\n🎉 All Tests Passed!');
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--workers':
        options.maxWorkers = parseInt(args[++i]);
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i]);
        break;
      case '--fail-fast':
        options.failFast = true;
        break;
      case '--sequential':
        options.parallel = false;
        break;
      case '--help':
        console.log(`
🧪 Regression Test Suite Runner

Usage: node run-regression-suite.cjs [options]

Options:
  --workers <n>     Number of workers (default: 6)
  --timeout <ms>    Test timeout (default: 30000)
  --fail-fast       Stop on first failure
  --sequential      Run suites sequentially
  --help            Show this help

Examples:
  node run-regression-suite.cjs
  node run-regression-suite.cjs --workers 4 --fail-fast
  node run-regression-suite.cjs --sequential --timeout 60000
        `);
        process.exit(0);
    }
  }
  
  const runner = new RegressionTestRunner(options);
  runner.runAll().catch(error => {
    console.error('💥 Regression test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { RegressionTestRunner, TEST_SUITES }; 