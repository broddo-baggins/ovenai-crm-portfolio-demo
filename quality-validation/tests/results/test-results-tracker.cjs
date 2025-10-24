#!/usr/bin/env node

/**
 * 📊 Test Results Tracker
 * 
 * Tracks test results across all suites with historical data in CSV format
 * Provides version comparison, trending analysis, and coverage tracking
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestResultsTracker {
  constructor() {
    this.resultsDir = path.join(__dirname);
    this.historyDir = path.join(this.resultsDir, 'history');
    this.currentDir = path.join(this.resultsDir, 'current');
    this.coverageDir = path.join(this.resultsDir, 'coverage');
    
    // Ensure directories exist
    [this.historyDir, this.currentDir, this.coverageDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Get current Git information
   */
  getGitInfo() {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
      const version = this.getVersion();
      
      return { branch, commit, version };
    } catch (error) {
      return { branch: 'unknown', commit: 'unknown', version: 'unknown' };
    }
  }

  /**
   * Get version from package.json
   */
  getVersion() {
    try {
      const packagePath = path.join(__dirname, '../../package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return packageData.version || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Log test result to CSV
   */
  logTestResult(testResult) {
    const timestamp = new Date().toISOString();
    const gitInfo = this.getGitInfo();
    
    const csvRecord = {
      timestamp,
      suite_name: testResult.suiteName,
      test_file: testResult.testFile,
      test_name: testResult.testName,
      status: testResult.status, // PASS, FAIL, SKIP
      duration_ms: testResult.duration || 0,
      coverage_percent: testResult.coverage || 0,
      version: gitInfo.version,
      branch: gitInfo.branch,
      commit: gitInfo.commit,
      worker_id: testResult.workerId || 0,
      error_message: testResult.errorMessage || '',
      retry_count: testResult.retryCount || 0
    };

    // Create CSV filename with date
    const dateStr = timestamp.split('T')[0]; // YYYY-MM-DD
    const csvFileName = `${dateStr}_${testResult.suiteName}_suite.csv`;
    const csvFilePath = path.join(this.historyDir, csvFileName);

    // Check if file exists, if not create with headers
    if (!fs.existsSync(csvFilePath)) {
      const headers = Object.keys(csvRecord).join(',') + '\n';
      fs.writeFileSync(csvFilePath, headers);
    }

    // Append test result
    const csvLine = Object.values(csvRecord).map(value => 
      typeof value === 'string' && value.includes(',') ? `"${value}"` : value
    ).join(',') + '\n';
    
    fs.appendFileSync(csvFilePath, csvLine);

    // Also update current results
    this.updateCurrentResults(testResult.suiteName, csvRecord);
  }

  /**
   * Update current test results JSON
   */
  updateCurrentResults(suiteName, result) {
    const currentFile = path.join(this.currentDir, `latest_${suiteName}_results.json`);
    
    let currentData = { suite: suiteName, tests: [], summary: {} };
    if (fs.existsSync(currentFile)) {
      try {
        currentData = JSON.parse(fs.readFileSync(currentFile, 'utf8'));
      } catch (error) {
        // File corrupted, start fresh
      }
    }

    // Add/update test result
    const existingIndex = currentData.tests.findIndex(test => 
      test.test_file === result.test_file && test.test_name === result.test_name
    );

    if (existingIndex >= 0) {
      currentData.tests[existingIndex] = result;
    } else {
      currentData.tests.push(result);
    }

    // Update summary
    currentData.summary = this.calculateSummary(currentData.tests);
    currentData.lastUpdated = result.timestamp;

    fs.writeFileSync(currentFile, JSON.stringify(currentData, null, 2));
  }

  /**
   * Calculate test suite summary statistics
   */
  calculateSummary(tests) {
    const total = tests.length;
    const passed = tests.filter(t => t.status === 'PASS').length;
    const failed = tests.filter(t => t.status === 'FAIL').length;
    const skipped = tests.filter(t => t.status === 'SKIP').length;
    
    const avgDuration = total > 0 ? 
      tests.reduce((sum, t) => sum + (t.duration_ms || 0), 0) / total : 0;
    
    const avgCoverage = total > 0 ? 
      tests.reduce((sum, t) => sum + (t.coverage_percent || 0), 0) / total : 0;

    return {
      total,
      passed,
      failed,
      skipped,
      passRate: total > 0 ? (passed / total * 100).toFixed(2) : 0,
      avgDuration: Math.round(avgDuration),
      avgCoverage: avgCoverage.toFixed(2)
    };
  }

  /**
   * Get test history for a specific suite
   */
  getTestHistory(suiteName, days = 30) {
    const results = [];
    const files = fs.readdirSync(this.historyDir)
      .filter(file => file.includes(suiteName) && file.endsWith('.csv'))
      .sort()
      .reverse();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    for (const file of files) {
      const filePath = path.join(this.historyDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length <= 1) continue; // Skip empty files or header-only

      const headers = lines[0].split(',');
      
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;

        const record = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });

        const testDate = new Date(record.timestamp);
        if (testDate >= cutoffDate) {
          results.push(record);
        }
      }
    }

    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Parse CSV line handling quoted values
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  /**
   * Compare test results between versions
   */
  compareVersions(fromVersion, toVersion, suiteName = null) {
    const allFiles = fs.readdirSync(this.historyDir)
      .filter(file => file.endsWith('.csv'));

    if (suiteName) {
      allFiles = allFiles.filter(file => file.includes(suiteName));
    }

    const fromResults = this.getResultsForVersion(allFiles, fromVersion);
    const toResults = this.getResultsForVersion(allFiles, toVersion);

    return {
      from: { version: fromVersion, results: fromResults },
      to: { version: toVersion, results: toResults },
      comparison: this.generateComparison(fromResults, toResults)
    };
  }

  /**
   * Get results for a specific version
   */
  getResultsForVersion(files, version) {
    const results = {};

    for (const file of files) {
      const filePath = path.join(this.historyDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length <= 1) continue;

      const headers = lines[0].split(',');
      const versionIndex = headers.indexOf('version');
      
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values[versionIndex] === version) {
          const record = {};
          headers.forEach((header, index) => {
            record[header] = values[index];
          });
          
          const suite = record.suite_name;
          if (!results[suite]) results[suite] = [];
          results[suite].push(record);
        }
      }
    }

    return results;
  }

  /**
   * Generate comparison between two sets of results
   */
  generateComparison(fromResults, toResults) {
    const comparison = {
      suites: {},
      overall: { improved: 0, regressed: 0, unchanged: 0 }
    };

    const allSuites = new Set([...Object.keys(fromResults), ...Object.keys(toResults)]);

    for (const suite of allSuites) {
      const from = fromResults[suite] || [];
      const to = toResults[suite] || [];

      const fromSummary = this.calculateSummary(from);
      const toSummary = this.calculateSummary(to);

      const passRateChange = parseFloat(toSummary.passRate) - parseFloat(fromSummary.passRate);
      const coverageChange = parseFloat(toSummary.avgCoverage) - parseFloat(fromSummary.avgCoverage);

      let status = 'unchanged';
      if (passRateChange > 1 || coverageChange > 1) status = 'improved';
      if (passRateChange < -1 || coverageChange < -1) status = 'regressed';

      comparison.suites[suite] = {
        from: fromSummary,
        to: toSummary,
        changes: {
          passRate: passRateChange.toFixed(2),
          coverage: coverageChange.toFixed(2)
        },
        status
      };

      comparison.overall[status]++;
    }

    return comparison;
  }

  /**
   * Generate trending analysis
   */
  generateTrends(suiteName = null, days = 30) {
    const suites = suiteName ? [suiteName] : this.getAllSuites();
    const trends = {};

    for (const suite of suites) {
      const history = this.getTestHistory(suite, days);
      
      // Group by date
      const dailyStats = {};
      for (const result of history) {
        const date = result.timestamp.split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = { tests: [], date };
        }
        dailyStats[date].tests.push(result);
      }

      // Calculate daily summaries
      const trendData = Object.values(dailyStats)
        .map(day => ({
          date: day.date,
          ...this.calculateSummary(day.tests)
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      trends[suite] = {
        data: trendData,
        trend: this.calculateTrendDirection(trendData)
      };
    }

    return trends;
  }

  /**
   * Calculate trend direction
   */
  calculateTrendDirection(data) {
    if (data.length < 2) return 'stable';

    const recent = data.slice(-7); // Last 7 days
    const older = data.slice(-14, -7); // Previous 7 days

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, day) => sum + parseFloat(day.passRate), 0) / recent.length;
    const olderAvg = older.reduce((sum, day) => sum + parseFloat(day.passRate), 0) / older.length;

    const change = recentAvg - olderAvg;
    
    if (change > 2) return 'improving';
    if (change < -2) return 'declining';
    return 'stable';
  }

  /**
   * Get all test suites
   */
  getAllSuites() {
    const files = fs.readdirSync(this.historyDir)
      .filter(file => file.endsWith('.csv'));
    
    const suites = new Set();
    for (const file of files) {
      const parts = file.split('_');
      if (parts.length >= 3) {
        const suite = parts.slice(1, -1).join('_'); // Everything between date and 'suite.csv'
        suites.add(suite);
      }
    }
    
    return Array.from(suites);
  }

  /**
   * Export results to CSV format
   */
  exportResults(options = {}) {
    const { suite, format = 'csv', days = 30 } = options;
    
    if (format === 'csv') {
      if (suite) {
        return this.exportSuiteToCSV(suite, days);
      } else {
        return this.exportAllSuitesToCSV(days);
      }
    }
    
    throw new Error(`Unsupported format: ${format}`);
  }

  /**
   * Export single suite to CSV
   */
  exportSuiteToCSV(suiteName, days) {
    const history = this.getTestHistory(suiteName, days);
    
    if (history.length === 0) {
      return `No data found for suite: ${suiteName}`;
    }

    const headers = Object.keys(history[0]).join(',');
    const rows = history.map(record => 
      Object.values(record).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }

  /**
   * Export all suites to CSV
   */
  exportAllSuitesToCSV(days) {
    const allSuites = this.getAllSuites();
    const allResults = [];

    for (const suite of allSuites) {
      const history = this.getTestHistory(suite, days);
      allResults.push(...history);
    }

    if (allResults.length === 0) {
      return 'No test data found';
    }

    // Sort by timestamp
    allResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const headers = Object.keys(allResults[0]).join(',');
    const rows = allResults.map(record => 
      Object.values(record).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }

  /**
   * Get latest results summary
   */
  getLatestResults() {
    const currentFiles = fs.readdirSync(this.currentDir)
      .filter(file => file.endsWith('_results.json'));

    const latestResults = {};
    
    for (const file of currentFiles) {
      try {
        const content = fs.readFileSync(path.join(this.currentDir, file), 'utf8');
        const data = JSON.parse(content);
        latestResults[data.suite] = data;
      } catch (error) {
        console.warn(`Failed to read ${file}: ${error.message}`);
      }
    }

    return latestResults;
  }
}

module.exports = TestResultsTracker;

// CLI interface
if (require.main === module) {
  const tracker = new TestResultsTracker();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'latest':
      console.log(JSON.stringify(tracker.getLatestResults(), null, 2));
      break;
      
    case 'history':
      const suite = args.find(arg => arg.startsWith('--suite='))?.split('=')[1];
      const days = parseInt(args.find(arg => arg.startsWith('--days='))?.split('=')[1]) || 30;
      console.log(JSON.stringify(tracker.getTestHistory(suite, days), null, 2));
      break;
      
    case 'compare':
      const from = args.find(arg => arg.startsWith('--from='))?.split('=')[1];
      const to = args.find(arg => arg.startsWith('--to='))?.split('=')[1];
      const compareSuite = args.find(arg => arg.startsWith('--suite='))?.split('=')[1];
      
      if (!from || !to) {
        console.error('Usage: node test-results-tracker.js compare --from=v1.0.0 --to=v1.1.0 [--suite=admin]');
        process.exit(1);
      }
      
      console.log(JSON.stringify(tracker.compareVersions(from, to, compareSuite), null, 2));
      break;
      
    case 'trends':
      const trendSuite = args.find(arg => arg.startsWith('--suite='))?.split('=')[1];
      const trendDays = parseInt(args.find(arg => arg.startsWith('--days='))?.split('=')[1]) || 30;
      console.log(JSON.stringify(tracker.generateTrends(trendSuite, trendDays), null, 2));
      break;
      
    case 'export':
      const exportSuite = args.find(arg => arg.startsWith('--suite='))?.split('=')[1];
      const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'csv';
      const exportDays = parseInt(args.find(arg => arg.startsWith('--days='))?.split('=')[1]) || 30;
      
      const exported = tracker.exportResults({ suite: exportSuite, format, days: exportDays });
      console.log(exported);
      break;
      
    default:
      console.log(`
Usage: node test-results-tracker.js <command> [options]

Commands:
  latest                          Show latest test results for all suites
  history [--suite=name] [--days=30]  Show test history
  compare --from=v1 --to=v2 [--suite=name]  Compare versions
  trends [--suite=name] [--days=30]    Show trending analysis
  export [--suite=name] [--format=csv] [--days=30]  Export results

Examples:
  node test-results-tracker.js latest
  node test-results-tracker.js history --suite=admin --days=7
  node test-results-tracker.js compare --from=v1.2.0 --to=v1.3.0
  node test-results-tracker.js trends --suite=admin
  node test-results-tracker.js export --suite=all --format=csv
      `);
      break;
  }
} 