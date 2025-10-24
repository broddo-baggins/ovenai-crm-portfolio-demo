#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * OvenAI Regression Testing Dashboard
 * 
 * Provides centralized test reporting and tracking similar to PractiTest.com or Jira pytest boards
 * Features:
 * - Test execution tracking
 * - Regression pattern detection
 * - Performance metrics
 * - Historical trend analysis
 * - Automated reporting
 */

class RegressionDashboard {
  constructor() {
    this.dashboardDir = 'tests/results/regression-dashboard';
    this.reportsDir = path.join(this.dashboardDir, 'reports');
    this.historyDir = path.join(this.dashboardDir, 'history');
    this.timestamp = new Date().toISOString();
    
    this.createDirectories();
  }

  createDirectories() {
    [this.dashboardDir, this.reportsDir, this.historyDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async runRegressionSuite() {
    console.log('🚀 Starting Comprehensive Regression Test Suite...');
    
    const testSuites = [
      { name: 'Sanity Tests', command: 'npx playwright test tests/sanity/ --reporter=json', priority: 'critical' },
      { name: 'E2E Core', command: 'npx playwright test tests/e2e/ --reporter=json', priority: 'high' },
      { name: 'Admin Console', command: 'npx playwright test tests/suites/e2e/admin/ --reporter=json', priority: 'high' },
      { name: 'Search Functionality', command: 'npx playwright test tests/suites/e2e/search/ --reporter=json', priority: 'medium' },
      { name: 'Mobile Tests', command: 'npx playwright test tests/mobile/ --reporter=json', priority: 'medium' },
      { name: 'API Tests', command: 'npx playwright test tests/api/ --reporter=json', priority: 'high' },
      { name: 'Security Tests', command: 'npx playwright test tests/security/ --reporter=json', priority: 'critical' },
      { name: 'Performance Tests', command: 'npx playwright test tests/functional/ --reporter=json', priority: 'medium' }
    ];

    const results = [];
    
    for (const suite of testSuites) {
      console.log(`\n📋 Running ${suite.name}...`);
      const startTime = Date.now();
      
      try {
        const output = execSync(suite.command, { 
          encoding: 'utf8',
          timeout: 300000, // 5 minutes timeout
          stdio: 'pipe'
        });
        
        const duration = Date.now() - startTime;
        const testResult = this.parseTestResults(output, suite.name, duration, suite.priority);
        results.push(testResult);
        
        console.log(`✅ ${suite.name}: ${testResult.passed}/${testResult.total} passed (${duration}ms)`);
        
      } catch (error) {
        const duration = Date.now() - startTime;
        const testResult = {
          suite: suite.name,
          priority: suite.priority,
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: duration,
          status: 'failed',
          error: error.message,
          timestamp: this.timestamp
        };
        results.push(testResult);
        
        console.log(`❌ ${suite.name}: Failed to execute (${duration}ms)`);
      }
    }

    return results;
  }

  parseTestResults(output, suiteName, duration, priority) {
    try {
      const jsonOutput = JSON.parse(output);
      const stats = jsonOutput.stats || {};
      
      return {
        suite: suiteName,
        priority: priority,
        total: stats.expected || 0,
        passed: stats.passed || 0,
        failed: stats.failed || 0,
        skipped: stats.skipped || 0,
        duration: duration,
        status: stats.failed === 0 ? 'passed' : 'failed',
        timestamp: this.timestamp,
        details: jsonOutput.suites || []
      };
    } catch (error) {
      return {
        suite: suiteName,
        priority: priority,
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: duration,
        status: 'error',
        error: 'Failed to parse test results',
        timestamp: this.timestamp
      };
    }
  }

  generateDashboard(results) {
    console.log('\n📊 Generating Regression Dashboard...');
    
    const dashboard = {
      timestamp: this.timestamp,
      summary: this.generateSummary(results),
      suites: results,
      trends: this.analyzeTrends(results),
      recommendations: this.generateRecommendations(results)
    };

    // Save dashboard data
    const dashboardFile = path.join(this.reportsDir, `regression-${this.timestamp.split('T')[0]}.json`);
    fs.writeFileSync(dashboardFile, JSON.stringify(dashboard, null, 2));

    // Generate HTML report
    this.generateHTMLReport(dashboard);
    
    // Update history
    this.updateHistory(dashboard);
    
    return dashboard;
  }

  generateSummary(results) {
    const summary = {
      totalSuites: results.length,
      totalTests: results.reduce((sum, r) => sum + r.total, 0),
      totalPassed: results.reduce((sum, r) => sum + r.passed, 0),
      totalFailed: results.reduce((sum, r) => sum + r.failed, 0),
      totalSkipped: results.reduce((sum, r) => sum + r.skipped, 0),
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
      passRate: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0
    };

    summary.passRate = summary.totalTests > 0 ? 
      ((summary.totalPassed / summary.totalTests) * 100).toFixed(2) : 0;

    // Count issues by priority
    results.forEach(result => {
      if (result.failed > 0) {
        switch (result.priority) {
          case 'critical':
            summary.criticalIssues++;
            break;
          case 'high':
            summary.highIssues++;
            break;
          case 'medium':
            summary.mediumIssues++;
            break;
        }
      }
    });

    return summary;
  }

  analyzeTrends(results) {
    // Load historical data for trend analysis
    const historyFiles = fs.readdirSync(this.historyDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .slice(-10); // Last 10 runs

    const trends = {
      passRateTrend: [],
      performanceTrend: [],
      flakyTests: [],
      improvingTests: [],
      degradingTests: []
    };

    historyFiles.forEach(file => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(this.historyDir, file), 'utf8'));
        trends.passRateTrend.push({
          date: data.timestamp,
          passRate: data.summary.passRate,
          totalTests: data.summary.totalTests
        });
        
        trends.performanceTrend.push({
          date: data.timestamp,
          duration: data.summary.totalDuration,
          avgDuration: data.summary.totalDuration / data.summary.totalTests
        });
      } catch (error) {
        console.warn(`Warning: Could not parse history file ${file}`);
      }
    });

    return trends;
  }

  generateRecommendations(results) {
    const recommendations = [];

    // Critical failures
    const criticalFailures = results.filter(r => r.priority === 'critical' && r.failed > 0);
    if (criticalFailures.length > 0) {
      recommendations.push({
        priority: 'critical',
        type: 'failure',
        message: `${criticalFailures.length} critical test suite(s) failing`,
        action: 'Immediate investigation required',
        suites: criticalFailures.map(r => r.suite)
      });
    }

    // Performance issues
    const slowSuites = results.filter(r => r.duration > 60000); // > 1 minute
    if (slowSuites.length > 0) {
      recommendations.push({
        priority: 'medium',
        type: 'performance',
        message: `${slowSuites.length} test suite(s) running slowly`,
        action: 'Consider optimization or parallel execution',
        suites: slowSuites.map(r => ({ suite: r.suite, duration: r.duration }))
      });
    }

    // Low pass rate
    const totalPassRate = results.reduce((sum, r) => sum + r.total, 0) > 0 ?
      ((results.reduce((sum, r) => sum + r.passed, 0) / results.reduce((sum, r) => sum + r.total, 0)) * 100) : 0;
    
    if (totalPassRate < 95) {
      recommendations.push({
        priority: 'high',
        type: 'quality',
        message: `Overall pass rate is ${totalPassRate.toFixed(2)}% (target: 95%+)`,
        action: 'Review and fix failing tests',
        details: 'Focus on high-priority suites first'
      });
    }

    return recommendations;
  }

  generateHTMLReport(dashboard) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OvenAI Regression Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 0.9em; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .warning { color: #ffc107; }
        .suites { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .suite { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; }
        .suite:last-child { border-bottom: none; }
        .suite-name { font-weight: bold; }
        .suite-stats { display: flex; gap: 15px; }
        .stat { padding: 5px 10px; border-radius: 4px; font-size: 0.9em; }
        .recommendations { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .recommendation { padding: 15px; border-left: 4px solid #007bff; margin-bottom: 15px; background: #f8f9fa; }
        .recommendation.critical { border-left-color: #dc3545; }
        .recommendation.high { border-left-color: #fd7e14; }
        .recommendation.medium { border-left-color: #ffc107; }
        .priority { font-weight: bold; text-transform: uppercase; font-size: 0.8em; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🧪 OvenAI Regression Testing Dashboard</h1>
            <p class="timestamp">Generated: ${new Date(dashboard.timestamp).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value ${dashboard.summary.passRate >= 95 ? 'passed' : 'failed'}">${dashboard.summary.passRate}%</div>
                <div class="metric-label">Pass Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${dashboard.summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value passed">${dashboard.summary.totalPassed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value failed">${dashboard.summary.totalFailed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(dashboard.summary.totalDuration / 1000).toFixed(1)}s</div>
                <div class="metric-label">Total Duration</div>
            </div>
        </div>

        <div class="suites">
            <h2>Test Suites</h2>
            ${dashboard.suites.map(suite => `
                <div class="suite">
                    <div>
                        <div class="suite-name">${suite.suite}</div>
                        <div style="color: #666; font-size: 0.9em;">${suite.priority} priority</div>
                    </div>
                    <div class="suite-stats">
                        <div class="stat passed">${suite.passed} passed</div>
                        <div class="stat failed">${suite.failed} failed</div>
                        <div class="stat">${(suite.duration / 1000).toFixed(1)}s</div>
                    </div>
                </div>
            `).join('')}
        </div>

        ${dashboard.recommendations.length > 0 ? `
        <div class="recommendations">
            <h2>Recommendations</h2>
            ${dashboard.recommendations.map(rec => `
                <div class="recommendation ${rec.priority}">
                    <div class="priority">${rec.priority}</div>
                    <div style="margin: 10px 0;"><strong>${rec.message}</strong></div>
                    <div style="color: #666;">${rec.action}</div>
                </div>
            `).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>`;

    const reportFile = path.join(this.reportsDir, `regression-dashboard-${this.timestamp.split('T')[0]}.html`);
    fs.writeFileSync(reportFile, html);
    
    console.log(`📊 HTML Dashboard: ${reportFile}`);
  }

  updateHistory(dashboard) {
    const historyFile = path.join(this.historyDir, `${this.timestamp.split('T')[0]}.json`);
    fs.writeFileSync(historyFile, JSON.stringify(dashboard, null, 2));
  }

  async generateReport() {
    try {
      const results = await this.runRegressionSuite();
      const dashboard = this.generateDashboard(results);
      
      console.log('\n🎉 Regression Dashboard Complete!');
      console.log(`📊 Pass Rate: ${dashboard.summary.passRate}%`);
      console.log(`📋 Total Tests: ${dashboard.summary.totalTests}`);
      console.log(`⏱️ Duration: ${(dashboard.summary.totalDuration / 1000).toFixed(1)}s`);
      
      if (dashboard.recommendations.length > 0) {
        console.log(`⚠️ Recommendations: ${dashboard.recommendations.length}`);
        dashboard.recommendations.forEach(rec => {
          console.log(`   ${rec.priority.toUpperCase()}: ${rec.message}`);
        });
      }
      
      return dashboard;
    } catch (error) {
      console.error('❌ Failed to generate regression report:', error);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const dashboard = new RegressionDashboard();
  dashboard.generateReport()
    .then(() => {
      console.log('\n✅ Regression dashboard generation complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Dashboard generation failed:', error);
      process.exit(1);
    });
}

module.exports = RegressionDashboard; 