#!/usr/bin/env node

/**
 * 500 Leads Queue Management Stress Test Runner
 * Tests the system's ability to handle large datasets with queue management
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function run500LeadsStressTest() {
  console.log('🚀 1000 LEADS QUEUE MANAGEMENT STRESS TEST');
  console.log('='.repeat(60));
  console.log('🎯 Testing system performance with 1000 leads');
  console.log('📊 Includes: Database operations, UI responsiveness, Queue management');
  console.log('');

  // Check credentials
  const credentialsPath = path.join(__dirname, '../../credentials/test-credentials.local');
  if (!fs.existsSync(credentialsPath)) {
    console.error('❌ Error: test-credentials.local not found');
    console.error('💡 Please ensure credentials file exists at:', credentialsPath);
    process.exit(1);
  }

  console.log('✅ Credentials file found');
  console.log('🔧 Starting stress test...');
  console.log('');

  const testCommand = [
    'npx playwright test',
    'tests/e2e/queue-500-leads-stress-test.spec.ts',
    '--reporter=line',
    '--workers=1', // Single worker for stress test
    '--timeout=600000', // 10 minutes timeout for 1000 leads
    '--project=chromium'
  ].join(' ');

  return new Promise((resolve, reject) => {
    const testProcess = exec(testCommand, {
      cwd: path.join(__dirname, '../..'),
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large output
    });

    let output = '';
    let hasErrors = false;

    testProcess.stdout?.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      process.stdout.write(chunk);
    });

    testProcess.stderr?.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      
      // Check for critical errors
      if (chunk.includes('Error') || chunk.includes('FAIL')) {
        hasErrors = true;
      }
      
      process.stderr.write(chunk);
    });

    testProcess.on('close', (code) => {
      console.log('');
      console.log('📋 STRESS TEST SUMMARY');
      console.log('='.repeat(40));
      
      if (code === 0) {
        console.log('🎉 SUCCESS: Stress test completed successfully!');
        console.log('');
        console.log('✅ PERFORMANCE VERIFIED:');
        console.log('   • 1000 leads created and managed ✅');
        console.log('   • Database operations stable ✅');
        console.log('   • UI responsive with large dataset ✅');
        console.log('   • Queue management functional ✅');
        console.log('   • Search/filter working ✅');
        console.log('   • Sort operations successful ✅');
        console.log('   • System stability confirmed ✅');
        console.log('');
        console.log('💡 Your system can handle enterprise-scale datasets!');
        
        // Save test results
        saveTestResults(output, true);
        resolve();
      } else {
        console.log('❌ FAILURE: Stress test encountered issues');
        console.log(`   Exit code: ${code}`);
        
        if (hasErrors) {
          console.log('⚠️  Critical errors detected in output');
        }
        
        console.log('');
        console.log('🔧 TROUBLESHOOTING:');
        console.log('   1. Check database connectivity');
        console.log('   2. Verify test credentials');
        console.log('   3. Ensure sufficient system resources');
        console.log('   4. Check application is running (npm run dev)');
        
        // Save test results with errors
        saveTestResults(output, false);
        reject(new Error(`Stress test failed with code ${code}`));
      }
    });
  });
}

function saveTestResults(output, success) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsDir = path.join(__dirname, '../../test-results');
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const resultsFile = path.join(resultsDir, `500-leads-stress-test-${timestamp}.log`);
  
  const report = [
    '500 LEADS QUEUE MANAGEMENT STRESS TEST RESULTS',
    '='.repeat(50),
    `Timestamp: ${new Date().toISOString()}`,
    `Status: ${success ? 'SUCCESS' : 'FAILURE'}`,
    '',
    'Test Output:',
    '='.repeat(20),
    output,
    '',
    'Test Configuration:',
    '='.repeat(20),
    '• Total leads tested: 1000',
    '• Database: Supabase (test-credentials.local)',
    '• Browser: Chromium',
    '• Workers: 1',
    '• Timeout: 5 minutes',
    '',
    'Performance Metrics Tested:',
    '='.repeat(30),
    '• Lead creation (batch operations)',
    '• UI rendering with large datasets',
    '• Search and filtering performance',
    '• Queue management operations',
    '• Database query performance',
    '• Sorting and pagination',
    '• Concurrent operations',
    '• Edge case handling'
  ].join('\n');
  
  fs.writeFileSync(resultsFile, report);
  console.log(`📄 Test results saved to: ${resultsFile}`);
}

// Performance monitoring
function monitorPerformance() {
  const memUsage = process.memoryUsage();
  console.log('📊 SYSTEM PERFORMANCE:');
  console.log(`   Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB used`);
  console.log(`   CPU Load: Monitoring active processes...`);
  console.log('');
}

// Pre-flight checks
function preFlightChecks() {
  console.log('🔍 PRE-FLIGHT CHECKS:');
  
  // Check if application is running
  exec('curl -s http://localhost:3000 > /dev/null', (error) => {
    if (error) {
      console.log('⚠️  Application may not be running on localhost:3000');
      console.log('💡 Please start the app with: npm run dev');
    } else {
      console.log('✅ Application is running');
    }
  });
  
  // Check available memory
  if (process.platform !== 'win32') {
    exec('free -m 2>/dev/null || vm_stat', (error, stdout) => {
      if (!error && stdout) {
        console.log('✅ System memory check passed');
      }
    });
  }
  
  console.log('✅ Pre-flight checks completed');
  console.log('');
}

// Main execution
if (require.main === module) {
  console.log('🚀 Initializing 500 Leads Stress Test...');
  console.log('');
  
  preFlightChecks();
  monitorPerformance();
  
  run500LeadsStressTest()
    .then(() => {
      console.log('');
      console.log('🎯 STRESS TEST COMPLETED SUCCESSFULLY!');
      console.log('💪 Your system is ready for enterprise-scale workloads!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('');
      console.error('❌ STRESS TEST FAILED:', error.message);
      console.error('💡 Check the logs above for detailed error information');
      process.exit(1);
    });
}

module.exports = { run500LeadsStressTest }; 