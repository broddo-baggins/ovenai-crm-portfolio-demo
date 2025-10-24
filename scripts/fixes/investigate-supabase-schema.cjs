#!/usr/bin/env node

/**
 * Investigate Supabase CLI Type Generation Issues
 * 
 * This script investigates why the Supabase CLI is only generating types for ~25% of tables
 * and provides solutions for comprehensive schema synchronization.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  try {
    log('cyan', '🔍 INVESTIGATING SUPABASE CLI TYPE GENERATION ISSUES');
    log('blue', '=====================================================');

    // Read credentials
    const credsPath = path.join(__dirname, '../../credentials/db-credentials.local.json');
    const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    const siteDbUrl = creds.supabase.development.url;
    const siteDbServiceKey = creds.supabase.development.service_role_key;
    const jwtSecret = creds.supabase.development.jwt_secret;
    
    log('green', `✅ Site DB URL: ${siteDbUrl}`);
    log('yellow', `🔑 JWT Secret available: ${!!jwtSecret}`);

    const supabase = createClient(siteDbUrl, siteDbServiceKey);

    log('blue', '\n📊 STEP 1: Database Table Discovery');
    log('blue', '===================================');

    // Method 1: Direct table access test
    const knownTables = [
      'clients', 'projects', 'leads', 'conversations', 'profiles',
      'whatsapp_message_queue', 'whatsapp_messages', 'conversation_audit_log', 
      'dashboard_system_metrics', 'agent_interaction_logs', 'notifications',
      'user_api_credentials', 'user_dashboard_settings', 'user_queue_settings',
      'sync_logs', 'system_changes', 'background_jobs'
    ];

    const accessibleTables = [];
    const inaccessibleTables = [];

    log('cyan', 'Testing table access...');
    for (const table of knownTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          inaccessibleTables.push({ table, error: error.message });
        } else {
          accessibleTables.push(table);
        }
      } catch (e) {
        inaccessibleTables.push({ table, error: e.message });
      }
    }

    log('green', `✅ Accessible tables (${accessibleTables.length}):`);
    accessibleTables.forEach(table => log('green', `   • ${table}`));
    
    if (inaccessibleTables.length > 0) {
      log('red', `❌ Inaccessible tables (${inaccessibleTables.length}):`);
      inaccessibleTables.forEach(({table, error}) => {
        log('red', `   • ${table}: ${error}`);
      });
    }

    log('blue', '\n🔧 STEP 2: Supabase CLI Investigation');
    log('blue', '====================================');

    // Check Supabase CLI version and configuration
    try {
      const { stdout: version } = await execAsync('supabase --version');
      log('green', `✅ Supabase CLI version: ${version.trim()}`);
    } catch (error) {
      log('red', `❌ Supabase CLI not found: ${error.message}`);
    }

    // Test JWT-based type generation
    log('cyan', '\n🔑 Testing JWT-based type generation...');
    
    const typeGenCommands = [
      {
        name: 'Service Role Key',
        cmd: `supabase gen types typescript --project-id ajszzemkpenbfnghqiyz --schema public`
      },
      {
        name: 'With JWT Secret',
        cmd: `SUPABASE_JWT_SECRET="${jwtSecret}" supabase gen types typescript --project-id ajszzemkpenbfnghqiyz --schema public`
      }
    ];

    for (const { name, cmd } of typeGenCommands) {
      try {
        log('yellow', `Testing: ${name}`);
        const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });
        
        // Count generated table types
        const tableMatches = stdout.match(/^\s+[a-z_]+:\s*\{$/gm);
        const tableCount = tableMatches ? tableMatches.length : 0;
        
        log('green', `✅ ${name}: Generated ${tableCount} table types`);
        
        // Save sample for analysis
        fs.writeFileSync(
          path.join(__dirname, `../../tmp-types-${name.toLowerCase().replace(/\s+/g, '-')}.ts`), 
          stdout
        );
        
      } catch (error) {
        log('red', `❌ ${name} failed: ${error.message}`);
      }
    }

    log('blue', '\n🛠️ STEP 3: RLS Policy Investigation');
    log('blue', '===================================');

    // Check if RLS policies might be blocking type generation
    log('cyan', 'Checking RLS policies that might block schema access...');
    
    const rlsCheckTables = inaccessibleTables.slice(0, 3); // Check first 3 inaccessible
    for (const { table } of rlsCheckTables) {
      try {
        // Try with different auth contexts
        const { error: anonError } = await createClient(siteDbUrl, creds.supabase.development.anon_key)
          .from(table)
          .select('count', { count: 'exact', head: true });
          
        if (anonError) {
          log('yellow', `⚠️ ${table}: RLS blocks anon access - ${anonError.message}`);
        } else {
          log('green', `✅ ${table}: Accessible with anon key`);
        }
      } catch (e) {
        log('red', `❌ ${table}: Error with anon key - ${e.message}`);
      }
    }

    log('blue', '\n📋 STEP 4: Schema Comparison');
    log('blue', '============================');

    // Compare current types with accessible tables
    const currentTypesPath = path.join(__dirname, '../../src/types/database.ts');
    const currentTypes = fs.readFileSync(currentTypesPath, 'utf8');
    
    const typedTables = [];
    const tableRegex = /^\s+([a-z_]+):\s*\{$/gm;
    let match;
    while ((match = tableRegex.exec(currentTypes)) !== null) {
      typedTables.push(match[1]);
    }

    log('cyan', `Current TypeScript types include ${typedTables.length} tables`);
    
    const missingFromTypes = accessibleTables.filter(table => !typedTables.includes(table));
    const extraInTypes = typedTables.filter(table => !accessibleTables.includes(table));

    if (missingFromTypes.length > 0) {
      log('red', `❌ Missing from types (${missingFromTypes.length}):`);
      missingFromTypes.forEach(table => log('red', `   • ${table}`));
    }

    if (extraInTypes.length > 0) {
      log('yellow', `⚠️ In types but not accessible (${extraInTypes.length}):`);
      extraInTypes.forEach(table => log('yellow', `   • ${table}`));
    }

    log('blue', '\n🎯 STEP 5: Root Cause Analysis');
    log('blue', '==============================');

    const issues = [];
    
    if (inaccessibleTables.length > 0) {
      issues.push(`${inaccessibleTables.length} tables are inaccessible due to permissions/RLS`);
    }
    
    if (missingFromTypes.length > 0) {
      issues.push(`${missingFromTypes.length} accessible tables missing from generated types`);
    }

    if (issues.length === 0) {
      log('green', '✅ No obvious issues found with table access or type generation');
    } else {
      log('red', '❌ Identified issues:');
      issues.forEach(issue => log('red', `   • ${issue}`));
    }

    log('blue', '\n💡 STEP 6: Recommended Solutions');
    log('blue', '=================================');

    log('cyan', '1. Use JWT Secret for type generation:');
    log('green', `   export SUPABASE_JWT_SECRET="${jwtSecret}"`);
    log('green', `   supabase gen types typescript --project-id ajszzemkpenbfnghqiyz`);

    log('cyan', '\n2. Create comprehensive schema sync script');
    log('cyan', '\n3. Fix RLS policies for missing tables');
    log('cyan', '\n4. Use service role key with proper permissions');

    log('magenta', '\n🏁 Investigation Complete!');
    log('blue', 'Check tmp-types-*.ts files for generated type samples');

  } catch (error) {
    log('red', `❌ Investigation failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main(); 