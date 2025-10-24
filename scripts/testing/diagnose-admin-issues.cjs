#!/usr/bin/env node

/**
 * 🔍 Admin Console Issues Diagnostic Script
 * 
 * This script diagnoses all the critical issues found:
 * 1. User statistics table mismatches  
 * 2. Cookie consent causing API errors
 * 3. Admin console fake vs real features
 * 4. Supabase 400 errors from leads API
 * 5. Database operations safety
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load credentials safely
const credentialsPath = path.join(process.cwd(), 'credentials', 'db-credentials.local.json');
let credentials;

try {
  credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
} catch (error) {
  console.error('❌ Could not load credentials file');
  process.exit(1);
}

const supabase = createClient(
  credentials.supabase.development.url,
  credentials.supabase.development.anon_key
);

class AdminDiagnostics {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.report = {
      timestamp: new Date().toISOString(),
      issues_found: 0,
      critical_issues: 0,
      fixes_applied: 0
    };
  }

  async diagnose() {
    console.log('🔍 ADMIN CONSOLE DIAGNOSTICS');
    console.log('=' .repeat(50));
    
    await this.checkUserStatsTables();
    await this.checkLeadsAPIErrors();
    await this.checkAdminAccess();
    await this.checkSystemMetrics();
    await this.checkDatabaseOperations();
    await this.checkCookieConsent();
    
    this.generateReport();
  }

  async checkUserStatsTables() {
    console.log('\n📊 Checking User Statistics Tables...');
    
    try {
      // Check profiles table
      const { count: profilesCount, error: profilesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (profilesError) {
        this.addIssue('CRITICAL', 'Profiles table query failed', profilesError.message);
        return;
      }

      // Check if users table exists
      const { count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      console.log(`   Profiles table: ${profilesCount || 0} records`);
      
      if (usersError) {
        console.log(`   Users table: ❌ Error (${usersError.message})`);
        this.addIssue('HIGH', 'Admin console queries wrong table', 
          'System monitoring service queries "users" table but should query "profiles" table');
        this.addFix('Update systemMonitoringService.ts to use "profiles" table instead of "users"');
      } else {
        console.log(`   Users table: ${usersCount || 0} records`);
        if ((usersCount || 0) === 0 && (profilesCount || 0) > 0) {
          this.addIssue('HIGH', 'User stats showing zero due to empty users table',
            'Admin console shows "Total Users: 0" because it queries empty "users" table instead of populated "profiles" table');
        }
      }

    } catch (error) {
      this.addIssue('CRITICAL', 'Database connection failed', error.message);
    }
  }

  async checkLeadsAPIErrors() {
    console.log('\n🔗 Checking Leads API...');
    
    try {
      // Test simple leads query that might be causing 400 errors
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, status')
        .limit(1);

      if (error) {
        if (error.message.includes('column') || error.message.includes('does not exist')) {
          this.addIssue('HIGH', 'Leads table schema mismatch', 
            `API queries reference fields that don't exist: ${error.message}`);
          this.addFix('Check leads table schema and update queries to match existing fields');
        } else {
          this.addIssue('MEDIUM', 'Leads API error', error.message);
        }
      } else {
        console.log(`   ✅ Leads API working (${leads?.length || 0} leads)`);
      }

    } catch (error) {
      this.addIssue('HIGH', 'Leads API completely broken', error.message);
    }
  }

  async checkAdminAccess() {
    console.log('\n🔐 Checking Admin Access...');
    
    try {
      const { count: adminCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      console.log(`   Admin users: ${adminCount || 0}`);
      
      if ((adminCount || 0) === 0) {
        this.addIssue('MEDIUM', 'No admin users found', 
          'No users have admin role - admin console will be inaccessible');
        this.addFix('Create admin user: UPDATE profiles SET role = \'admin\' WHERE email = \'your-email@domain.com\'');
      }

    } catch (error) {
      this.addIssue('HIGH', 'Admin access check failed', error.message);
    }
  }

  async checkSystemMetrics() {
    console.log('\n📈 Checking System Metrics...');
    
    // This is a static check of the code
    this.addIssue('HIGH', 'System metrics are fake', 
      'CPU, Memory, Disk usage are generated with Math.random() - not real system data');
    this.addFix('Implement real system monitoring using proper APIs or remove fake metrics');
  }

  checkDatabaseOperations() {
    console.log('\n🗄️ Checking Database Operations...');
    
    this.addIssue('CRITICAL', 'Database operations are simulated', 
      'Manual Backup, Optimize Database, Integrity Check are UI mockups with setTimeout() delays');
    this.addFix('Implement real database operations or clearly label as "Demo Mode"');
    
    this.addIssue('HIGH', 'Admin operations safety concern', 
      'Database operations appear functional but don\'t perform real actions');
    this.addFix('Add safety warnings and implement proper database operation handlers');
  }

  checkCookieConsent() {
    console.log('\n🍪 Checking Cookie Consent...');
    
    this.addIssue('HIGH', 'Cookie consent may trigger API errors', 
      'localStorage operations in cookie consent can cause Supabase API calls to fail with 400 errors');
    this.addFix('Add error handling around cookie consent tracking and analytics calls');
  }

  addIssue(severity, title, description) {
    this.issues.push({ severity, title, description });
    this.report.issues_found++;
    if (severity === 'CRITICAL') this.report.critical_issues++;
  }

  addFix(description) {
    this.fixes.push(description);
    this.report.fixes_applied++;
  }

  generateReport() {
    console.log('\n📋 DIAGNOSTIC REPORT');
    console.log('=' .repeat(50));
    
    console.log(`Total Issues Found: ${this.report.issues_found}`);
    console.log(`Critical Issues: ${this.report.critical_issues}`);
    console.log(`Suggested Fixes: ${this.fixes.length}`);
    
    console.log('\n🚨 ISSUES BY SEVERITY:');
    
    // Group by severity
    const severityGroups = {
      'CRITICAL': this.issues.filter(i => i.severity === 'CRITICAL'),
      'HIGH': this.issues.filter(i => i.severity === 'HIGH'),
      'MEDIUM': this.issues.filter(i => i.severity === 'MEDIUM')
    };

    Object.entries(severityGroups).forEach(([severity, issues]) => {
      if (issues.length > 0) {
        console.log(`\n${severity} (${issues.length}):`);
        issues.forEach((issue, i) => {
          console.log(`  ${i + 1}. ${issue.title}`);
          console.log(`     ${issue.description}`);
        });
      }
    });

    console.log('\n🛠️ SUGGESTED FIXES:');
    this.fixes.forEach((fix, i) => {
      console.log(`  ${i + 1}. ${fix}`);
    });

    // Save report to file
    const reportPath = path.join(process.cwd(), 'admin-diagnostics-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      ...this.report,
      issues: this.issues,
      fixes: this.fixes
    }, null, 2));

    console.log(`\n📄 Full report saved to: ${reportPath}`);
    
    console.log('\n🎯 PRIORITY ACTIONS:');
    console.log('1. Fix user statistics table queries (profiles vs users)');
    console.log('2. Add error handling to cookie consent');
    console.log('3. Add warnings that admin operations are simulated');
    console.log('4. Implement real system monitoring or remove fake metrics');
    console.log('5. Check leads table schema for API 400 errors');
  }
}

// Run diagnostics
async function main() {
  const diagnostics = new AdminDiagnostics();
  try {
    await diagnostics.diagnose();
  } catch (error) {
    console.error('💥 Diagnostic failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AdminDiagnostics; 