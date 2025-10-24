#!/usr/bin/env node

// MIGRATE MISSING TABLES - Complete missing data migration
// This script migrates all tables that exist in master but not in local

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

console.log('🔄 MIGRATING MISSING TABLES AND DATA');
console.log('═══════════════════════════════════════════════════════════════');

// Load credentials
function loadCredentials(path) {
  const content = readFileSync(path, 'utf8');
  const credentials = {};
  content.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      credentials[key.trim()] = value.trim();
    }
  });
  return credentials;
}

const masterCredentials = loadCredentials('./master-db-credentials.local');
const localCredentials = loadCredentials('./supabase-credentials.local');

// Create clients - READ ONLY for master
const masterClient = createClient(
  masterCredentials.MASTER_SUPABASE_URL,
  masterCredentials.MASTER_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const localClient = createClient(
  localCredentials.SUPABASE_URL,
  localCredentials.SUPABASE_SERVICE_ROLE_KEY
);

// Tables to migrate (found in master but missing in local)
const MISSING_TABLES = [
  'agent_interaction_logs',
  'conversation_audit_log', 
  'dashboard_bant_distribution',
  'dashboard_business_kpis',
  'dashboard_lead_funnel',
  'dashboard_system_metrics',
  'lead_status_history'
];

// Empty tables (exist in master but are empty - we'll create schema only)
const EMPTY_TABLES = [
  'dashboard_error_analytics',
  'dashboard_queue_analytics', 
  'lead_project_history'
];

async function getTableSchema(client, tableName) {
  try {
    const { data: sample } = await client
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (sample && sample.length > 0) {
      return Object.keys(sample[0]);
    }
    
    return [];
  } catch (error) {
    console.log(`❌ Error getting schema for ${tableName}:`, error.message);
    return [];
  }
}

async function createTableFromSample(tableName, sampleRecord) {
  console.log(`📋 Creating table schema for: ${tableName}`);
  
  if (!sampleRecord) {
    console.log(`⚠️  No sample data for ${tableName}, skipping schema creation`);
    return false;
  }
  
  // Generate CREATE TABLE statement based on sample data
  const columns = Object.keys(sampleRecord).map(col => {
    const value = sampleRecord[col];
    let type = 'text';
    
    if (col === 'id' || col.endsWith('_id')) {
      type = 'uuid';
    } else if (col.includes('created_at') || col.includes('updated_at') || col.includes('timestamp')) {
      type = 'timestamptz';
    } else if (typeof value === 'number') {
      type = Number.isInteger(value) ? 'integer' : 'numeric';
    } else if (typeof value === 'boolean') {
      type = 'boolean';
    } else if (value && typeof value === 'object') {
      type = 'jsonb';
    }
    
    return `${col} ${type}`;
  }).join(',\n  ');
  
  const createSQL = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${columns}
    );
  `;
  
  console.log(`📝 SQL for ${tableName}:`);
  console.log(createSQL);
  
  return true;
}

async function migrateTableData(tableName) {
  try {
    console.log(`\n🔄 Migrating ${tableName}...`);
    
    // Get record count
    const { count: masterCount } = await masterClient
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(0);
    
    if (masterCount === 0) {
      console.log(`   ℹ️  Table ${tableName} is empty in master, skipping data migration`);
      return { success: true, migrated: 0 };
    }
    
    console.log(`   📊 Found ${masterCount} records in master`);
    
    // Get sample record for schema understanding
    const { data: sample } = await masterClient
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (sample && sample.length > 0) {
      console.log(`   📋 Sample columns: ${Object.keys(sample[0]).join(', ')}`);
      
      // Show the CREATE TABLE statement
      await createTableFromSample(tableName, sample[0]);
    }
    
    // Fetch all data in batches
    let allRecords = [];
    let from = 0;
    const batchSize = 100;
    
    while (true) {
      const { data: batch } = await masterClient
        .from(tableName)
        .select('*')
        .range(from, from + batchSize - 1);
      
      if (!batch || batch.length === 0) break;
      
      allRecords = allRecords.concat(batch);
      from += batchSize;
      
      console.log(`   📥 Fetched ${allRecords.length}/${masterCount} records`);
      
      if (batch.length < batchSize) break;
    }
    
    console.log(`   ✅ Retrieved ${allRecords.length} records from master`);
    console.log(`   ⚠️  Table schema needs to be created manually in Supabase before inserting data`);
    console.log(`   💾 Data ready for insertion once table exists`);
    
    return { success: true, migrated: allRecords.length, data: allRecords };
    
  } catch (error) {
    console.error(`❌ Error migrating ${tableName}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function completeMissingWhatsAppMessages() {
  console.log(`\n🔄 Completing WhatsApp messages migration...`);
  
  try {
    // Get counts
    const { count: masterCount } = await masterClient
      .from('whatsapp_messages')
      .select('*', { count: 'exact' })
      .limit(0);
      
    const { count: localCount } = await localClient
      .from('whatsapp_messages')
      .select('*', { count: 'exact' })
      .limit(0);
    
    const missing = masterCount - localCount;
    console.log(`   📊 Master: ${masterCount}, Local: ${localCount}, Missing: ${missing}`);
    
    if (missing <= 0) {
      console.log(`   ✅ WhatsApp messages are already complete`);
      return;
    }
    
    // Get existing IDs in local to avoid duplicates
    const { data: localIds } = await localClient
      .from('whatsapp_messages')
      .select('id');
    
    const existingIds = new Set(localIds?.map(r => r.id) || []);
    console.log(`   📋 Found ${existingIds.size} existing IDs in local`);
    
    // Fetch missing records from master
    let migratedCount = 0;
    let from = 0;
    const batchSize = 50;
    
    while (migratedCount < missing) {
      const { data: batch } = await masterClient
        .from('whatsapp_messages')
        .select('*')
        .range(from, from + batchSize - 1);
      
      if (!batch || batch.length === 0) break;
      
      // Filter out records that already exist locally
      const newRecords = batch.filter(record => !existingIds.has(record.id));
      
      if (newRecords.length > 0) {
        // Remove 'updated_at' column if it exists (local has it, master might not)
        const cleanRecords = newRecords.map(record => {
          const { updated_at, ...cleanRecord } = record;
          return cleanRecord;
        });
        
        const { error } = await localClient
          .from('whatsapp_messages')
          .upsert(cleanRecords, { onConflict: 'id' });
        
        if (error) {
          console.error(`❌ Error inserting batch:`, error);
        } else {
          migratedCount += newRecords.length;
          console.log(`   ✅ Migrated ${migratedCount} new records`);
        }
      }
      
      from += batchSize;
      
      if (batch.length < batchSize) break;
    }
    
    console.log(`   ✅ WhatsApp messages migration complete: ${migratedCount} new records added`);
    
  } catch (error) {
    console.error(`❌ Error completing WhatsApp messages:`, error.message);
  }
}

async function main() {
  try {
    console.log('📋 MISSING TABLES TO MIGRATE:');
    MISSING_TABLES.forEach(table => console.log(`   - ${table}`));
    
    console.log('\n📋 EMPTY TABLES (schema only):');
    EMPTY_TABLES.forEach(table => console.log(`   - ${table}`));
    
    // Step 1: Complete WhatsApp messages first (table exists but data incomplete)
    await completeMissingWhatsAppMessages();
    
    console.log('\n📋 ANALYZING MISSING TABLES:');
    console.log('═'.repeat(70));
    
    // Step 2: Analyze each missing table
    const migrationResults = {};
    
    for (const tableName of MISSING_TABLES) {
      const result = await migrateTableData(tableName);
      migrationResults[tableName] = result;
    }
    
    // Step 3: Handle empty tables
    for (const tableName of EMPTY_TABLES) {
      console.log(`\n🔄 Analyzing empty table: ${tableName}`);
      const result = await migrateTableData(tableName);
      migrationResults[tableName] = result;
    }
    
    // Summary
    console.log('\n📊 MIGRATION SUMMARY:');
    console.log('═'.repeat(70));
    
    Object.entries(migrationResults).forEach(([table, result]) => {
      if (result.success) {
        console.log(`   ✅ ${table}: ${result.migrated || 0} records ready`);
      } else {
        console.log(`   ❌ ${table}: ${result.error}`);
      }
    });
    
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Create missing table schemas in Supabase Dashboard');
    console.log('   2. Tables with data > 0 need manual table creation');
    console.log('   3. Use the generated CREATE TABLE statements above');
    console.log('   4. After tables exist, we can insert the prepared data');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
  }
}

main().catch(console.error); 