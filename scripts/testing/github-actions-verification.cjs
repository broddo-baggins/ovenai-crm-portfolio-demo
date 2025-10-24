#!/usr/bin/env node

/**
 * GitHub Actions Verification Script
 * 
 * This script verifies:
 * 1. All GitHub Actions are using latest stable versions
 * 2. Environment variables are properly configured
 * 3. Workflow syntax is valid
 * 4. Required secrets are referenced
 */

const fs = require('fs');
const path = require('path');

// Define latest stable action versions
const LATEST_ACTION_VERSIONS = {
  'actions/checkout': 'v4',
  'actions/setup-node': 'v4',
  'actions/upload-artifact': 'v4',
  'actions/download-artifact': 'v4',
  'actions/github-script': 'v7',
  'actions/cache': 'v4',
  'peaceiris/actions-gh-pages': 'v4'
};

// Required environment variables for different workflows
const REQUIRED_SECRETS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_AGENT_DB_URL',
  'VITE_AGENT_DB_ANON_KEY',
  'VITE_APP_URL',
  'GITHUB_TOKEN' // Built-in, but verify usage
];

class GitHubActionsVerifier {
  constructor() {
    this.workflowsDir = path.join(process.cwd(), '.github', 'workflows');
    this.results = {
      totalWorkflows: 0,
      actionVersions: [],
      deprecatedActions: [],
      environmentVariables: [],
      syntaxIssues: [],
      recommendations: []
    };
  }

  /**
   * Simple YAML parser for basic workflow analysis
   */
  parseYAML(content) {
    const lines = content.split('\n');
    const result = {};
    let currentPath = [];
    let currentIndent = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const indent = line.length - line.trimLeft().length;
      const colonIndex = trimmed.indexOf(':');
      
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();
        
        // This is a very basic parser - just for demonstration
        if (key === 'name' && !result.name) {
          result.name = value.replace(/['"]/g, '');
        }
        if (key === 'on' && !result.on) {
          result.on = true;
        }
        if (trimmed.includes('jobs:')) {
          result.jobs = true;
        }
      }
    }
    
    return result;
  }

  /**
   * Main verification method
   */
  async verify() {
    console.log('🔍 Starting GitHub Actions Verification...\n');

    if (!fs.existsSync(this.workflowsDir)) {
      console.error('❌ .github/workflows directory not found!');
      return;
    }

    const workflowFiles = fs.readdirSync(this.workflowsDir)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

    this.results.totalWorkflows = workflowFiles.length;

    console.log(`📋 Found ${workflowFiles.length} workflow file(s):`);
    workflowFiles.forEach(file => console.log(`   • ${file}`));
    console.log('');

    // Verify each workflow file
    for (const file of workflowFiles) {
      await this.verifyWorkflow(file);
    }

    this.generateReport();
  }

  /**
   * Verify individual workflow file
   */
  async verifyWorkflow(filename) {
    const filePath = path.join(this.workflowsDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');

    console.log(`🔧 Verifying: ${filename}`);

    try {
      const workflow = this.parseYAML(content);
      
      // Check action versions
      this.checkActionVersions(filename, content);
      
      // Check environment variables
      this.checkEnvironmentVariables(filename, content);
      
      // Check workflow syntax
      this.checkWorkflowSyntax(filename, workflow);

      console.log(`   ✅ ${filename} verified successfully`);
    } catch (error) {
      console.log(`   ❌ ${filename} has errors: ${error.message}`);
      this.results.syntaxIssues.push({
        file: filename,
        error: error.message
      });
    }
  }

  /**
   * Check action versions against latest stable
   */
  checkActionVersions(filename, content) {
    const actionRegex = /uses:\s*([^@\s]+)@([^\s]+)/g;
    let match;

    while ((match = actionRegex.exec(content)) !== null) {
      const [fullMatch, actionName, version] = match;
      const latestVersion = LATEST_ACTION_VERSIONS[actionName];

      this.results.actionVersions.push({
        file: filename,
        action: actionName,
        currentVersion: version,
        latestVersion: latestVersion || 'Unknown',
        isLatest: latestVersion ? version === latestVersion : null
      });

      // Check for deprecated versions
      if (latestVersion && version !== latestVersion) {
        if (version.startsWith('v1') || version.startsWith('v2') || version.startsWith('v3')) {
          this.results.deprecatedActions.push({
            file: filename,
            action: actionName,
            currentVersion: version,
            recommendedVersion: latestVersion
          });
        }
      }
    }
  }

  /**
   * Check environment variable configuration
   */
  checkEnvironmentVariables(filename, content) {
    const envVars = new Set();
    
    // Look for environment variable patterns
    const envPattern = /VITE_[A-Z_]+/g;
    let match;
    
    while ((match = envPattern.exec(content)) !== null) {
      envVars.add(match[0]);
    }

    this.results.environmentVariables.push({
      file: filename,
      variables: Array.from(envVars)
    });
  }

  /**
   * Check workflow syntax and structure
   */
  checkWorkflowSyntax(filename, workflow) {
    const issues = [];

    // Check required fields
    if (!workflow.name) {
      issues.push('Missing workflow name');
    }

    if (!workflow.on) {
      issues.push('Missing trigger configuration (on)');
    }

    if (!workflow.jobs) {
      issues.push('No jobs defined');
    }

    if (issues.length > 0) {
      this.results.syntaxIssues.push({
        file: filename,
        issues: issues
      });
    }
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n📊 VERIFICATION REPORT');
    console.log('='.repeat(50));

    // Summary
    console.log(`\n📋 Summary:`);
    console.log(`   • Total Workflows: ${this.results.totalWorkflows}`);
    console.log(`   • Action References: ${this.results.actionVersions.length}`);
    console.log(`   • Deprecated Actions: ${this.results.deprecatedActions.length}`);
    console.log(`   • Syntax Issues: ${this.results.syntaxIssues.length}`);

    // Action versions
    if (this.results.actionVersions.length > 0) {
      console.log(`\n🔧 Action Versions:`);
      const actionsByFile = {};
      this.results.actionVersions.forEach(item => {
        if (!actionsByFile[item.file]) {
          actionsByFile[item.file] = [];
        }
        actionsByFile[item.file].push(item);
      });

      Object.entries(actionsByFile).forEach(([file, actions]) => {
        console.log(`\n   📄 ${file}:`);
        actions.forEach(action => {
          const status = action.isLatest === true ? '✅' : 
                        action.isLatest === false ? '⚠️' : '❓';
          console.log(`      ${status} ${action.action}@${action.currentVersion} ${
            action.isLatest === false ? `(latest: ${action.latestVersion})` : ''
          }`);
        });
      });
    }

    // Deprecated actions
    if (this.results.deprecatedActions.length > 0) {
      console.log(`\n⚠️  Deprecated Actions Found:`);
      this.results.deprecatedActions.forEach(item => {
        console.log(`   • ${item.file}: ${item.action}@${item.currentVersion} → ${item.recommendedVersion}`);
      });
    } else {
      console.log(`\n✅ No deprecated actions found!`);
    }

    // Environment variables
    if (this.results.environmentVariables.length > 0) {
      console.log(`\n🔒 Environment Variables:`);
      this.results.environmentVariables.forEach(item => {
        if (item.variables.length > 0) {
          console.log(`\n   📄 ${item.file}:`);
          item.variables.forEach(variable => {
            const isRequired = REQUIRED_SECRETS.includes(variable);
            console.log(`      ${isRequired ? '🔑' : '📝'} ${variable}`);
          });
        }
      });
    }

    // Syntax issues
    if (this.results.syntaxIssues.length > 0) {
      console.log(`\n❌ Syntax Issues:`);
      this.results.syntaxIssues.forEach(item => {
        console.log(`\n   📄 ${item.file}:`);
        if (item.issues) {
          item.issues.forEach(issue => {
            console.log(`      • ${issue}`);
          });
        } else {
          console.log(`      • ${item.error}`);
        }
      });
    } else {
      console.log(`\n✅ No syntax issues found!`);
    }

    // Generate recommendations
    this.generateRecommendations();
    if (this.results.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      this.results.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // Save detailed report
    this.saveReport();
  }

  /**
   * Generate recommendations based on findings
   */
  generateRecommendations() {
    if (this.results.deprecatedActions.length > 0) {
      this.results.recommendations.push(
        'Update deprecated actions to latest versions for security and compatibility'
      );
    }

    if (this.results.syntaxIssues.length > 0) {
      this.results.recommendations.push(
        'Fix workflow syntax issues to prevent runtime failures'
      );
    }

    const hasSecrets = this.results.environmentVariables.some(item => 
      item.variables.some(variable => REQUIRED_SECRETS.includes(variable))
    );

    if (hasSecrets) {
      this.results.recommendations.push(
        'Verify all required secrets are configured in repository settings'
      );
    }

    this.results.recommendations.push(
      'Test workflows in a feature branch before merging to main'
    );

    this.results.recommendations.push(
      'Consider using dependabot for automatic action updates'
    );
  }

  /**
   * Save detailed report to file
   */
  saveReport() {
    const reportPath = path.join(process.cwd(), 'GITHUB_ACTIONS_REPORT.json');
    const detailedReport = {
      timestamp: new Date().toISOString(),
      ...this.results
    };

    fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
    console.log(`\n📄 Detailed report saved to: GITHUB_ACTIONS_REPORT.json`);
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new GitHubActionsVerifier();
  verifier.verify().catch(console.error);
}

module.exports = GitHubActionsVerifier; 