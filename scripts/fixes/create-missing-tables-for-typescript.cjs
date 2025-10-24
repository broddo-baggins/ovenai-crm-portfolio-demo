#!/usr/bin/env node

/**
 * Create Missing Tables for TypeScript Fix
 * 
 * This script creates the missing tables that are causing 273 TypeScript errors:
 * - conversation_audit_log
 * - dashboard_system_metrics
 * 
 * These tables are referenced in the code but missing from the Site DB TypeScript types.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  try {
    log('cyan', '🔧 Creating Missing Tables for TypeScript Fix');
    log('blue', '================================================');

    // Read Site DB credentials
    const credsPath = path.join(__dirname, '../../credentials/db-credentials.local.json');
    if (!fs.existsSync(credsPath)) {
      throw new Error(`❌ Credentials file not found: ${credsPath}`);
    }

    const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    const siteDbUrl = creds.supabase.development.url;
    const siteDbServiceKey = creds.supabase.development.service_role_key;
    
    log('green', `✅ Loaded Site DB credentials: ${siteDbUrl}`);

    // Initialize Supabase client
    const supabase = createClient(siteDbUrl, siteDbServiceKey);

    // Check current tables
    log('blue', '\n📊 Checking current table existence...');
    
    let existingTables = [];
    try {
      // Try to query the tables directly to see if they exist
      const { error: auditError } = await supabase
        .from('conversation_audit_log')
        .select('count', { count: 'exact', head: true });
      
      const { error: metricsError } = await supabase
        .from('dashboard_system_metrics')
        .select('count', { count: 'exact', head: true });

      if (!auditError) existingTables.push('conversation_audit_log');
      if (!metricsError) existingTables.push('dashboard_system_metrics');
      
      log('yellow', `Existing tables: ${existingTables.join(', ') || 'none'}`);
    } catch (error) {
      log('yellow', 'Unable to check table existence, proceeding with SQL generation...');
      existingTables = []; // Assume none exist
    }

    // Create conversation_audit_log table
    if (!existingTables.includes('conversation_audit_log')) {
      log('blue', '\n🔨 Creating conversation_audit_log table...');
      log('cyan', 'Please run this SQL in your Supabase SQL Editor:');
      
      const auditTableSQL = `
-- Create conversation_audit_log table
CREATE TABLE IF NOT EXISTS conversation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  validation_mode TEXT,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_audit_log_conversation_id 
  ON conversation_audit_log(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_audit_log_created_at 
  ON conversation_audit_log(created_at);

-- Enable RLS
ALTER TABLE conversation_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow all for authenticated users" ON conversation_audit_log
  FOR ALL USING (auth.role() = 'authenticated');
      `;
      
      console.log('\n' + colors.yellow + auditTableSQL + colors.reset + '\n');
    } else {
      log('yellow', '⚠️ conversation_audit_log table already exists');
    }

    // Create dashboard_system_metrics table
    if (!existingTables.includes('dashboard_system_metrics')) {
      log('blue', '\n🔨 Creating dashboard_system_metrics table...');
      log('cyan', 'Please run this SQL in your Supabase SQL Editor:');
      
      const metricsTableSQL = `
-- Create dashboard_system_metrics table
CREATE TABLE IF NOT EXISTS dashboard_system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_queue_items_24h INTEGER DEFAULT 0,
  processed_messages INTEGER DEFAULT 0,
  queued_messages INTEGER DEFAULT 0,
  failed_messages INTEGER DEFAULT 0,
  processing_messages INTEGER DEFAULT 0,
  avg_processing_time_seconds TEXT,
  avg_queue_wait_time_seconds TEXT,
  max_retry_count INTEGER DEFAULT 0,
  avg_queue_priority INTEGER DEFAULT 0,
  success_rate_percentage TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dashboard_system_metrics_created_at 
  ON dashboard_system_metrics(created_at);

-- Enable RLS
ALTER TABLE dashboard_system_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow all for authenticated users" ON dashboard_system_metrics
  FOR ALL USING (auth.role() = 'authenticated');
      `;
      
      console.log('\n' + colors.yellow + metricsTableSQL + colors.reset + '\n');
    } else {
      log('yellow', '⚠️ dashboard_system_metrics table already exists');
    }

    log('cyan', '\n🎉 SQL generation completed!');
    log('blue', '📝 Next steps:');
    log('yellow', '1. Copy the SQL from scripts/fixes/create-missing-tables.sql');
    log('yellow', '2. Go to Supabase Dashboard > SQL Editor');
    log('yellow', '3. Paste and run the SQL');
    log('yellow', '4. Regenerate TypeScript types: supabase gen types typescript');
    log('yellow', '5. Fix environment variable naming issues');
    log('yellow', '6. Fix field mismatches in code');
    log('yellow', '7. Remove @ts-nocheck comments');
    
    log('blue', '\n💡 Or use the direct SQL file:');
    log('green', 'cat scripts/fixes/create-missing-tables.sql');

  } catch (error) {
    log('red', `❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main(); 