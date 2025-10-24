#!/usr/bin/env node

// INSERT MISSING DATA - Insert data for newly created tables
// Run this AFTER creating the missing tables using create-missing-tables.sql

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

console.log('📥 INSERTING MISSING DATA');
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

// Tables to insert data for
const TABLES_TO_INSERT = [
  'agent_interaction_logs',      // 191 records
  'conversation_audit_log',      // 14 records  
  'dashboard_bant_distribution', // 3 records
  'dashboard_business_kpis',     // 1 record
  'dashboard_lead_funnel',       // 3 records
  'dashboard_system_metrics',    // 1 record
  'lead_status_history'          // 138 records
];

async function insertTableData(tableName) {
  try {
    console.log(`\n📥 Inserting data for ${tableName}...`);
    
    // Check if table exists in local
    try {
      const { count: localCount } = await localClient
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(0);
      
      if (localCount > 0) {
        console.log(`   ℹ️  Table ${tableName} already has ${localCount} records, skipping`);
        return { success: true, message: 'Already has data', inserted: 0 };
      }
    } catch (error) {
      console.log(`   ❌ Table ${tableName} doesn't exist yet. Create it first using create-missing-tables.sql`);
      return { success: false, error: 'Table does not exist' };
    }
    
    // Get data from master
    const { count: masterCount } = await masterClient
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(0);
    
    if (masterCount === 0) {
      console.log(`   ℹ️  No data in master for ${tableName}`);
      return { success: true, message: 'No data to insert', inserted: 0 };
    }
    
    console.log(`   📊 Found ${masterCount} records in master`);
    
    // Fetch all data in batches
    let allRecords = [];
    let from = 0;
    const batchSize = 100;
    
    while (true) {
      const { data: batch, error } = await masterClient
        .from(tableName)
        .select('*')
        .range(from, from + batchSize - 1);
      
      if (error) {
        console.error(`   ❌ Error fetching from master:`, error);
        break;
      }
      
      if (!batch || batch.length === 0) break;
      
      allRecords = allRecords.concat(batch);
      from += batchSize;
      
      console.log(`   📥 Fetched ${allRecords.length}/${masterCount} records`);
      
      if (batch.length < batchSize) break;
    }
    
    if (allRecords.length === 0) {
      console.log(`   ⚠️  No records retrieved from master`);
      return { success: false, error: 'No data retrieved' };
    }
    
    // Insert data in batches
    let insertedCount = 0;
    const insertBatchSize = 50;
    
    for (let i = 0; i < allRecords.length; i += insertBatchSize) {
      const batch = allRecords.slice(i, i + insertBatchSize);
      
      const { error } = await localClient
        .from(tableName)
        .insert(batch);
      
      if (error) {
        console.error(`   ❌ Error inserting batch:`, error);
        
        // Try individual inserts for this batch
        for (const record of batch) {
          const { error: singleError } = await localClient
            .from(tableName)
            .insert([record]);
          
          if (!singleError) {
            insertedCount++;
          } else {
            console.error(`   ❌ Failed to insert single record:`, singleError.message);
          }
        }
      } else {
        insertedCount += batch.length;
        console.log(`   ✅ Inserted ${insertedCount}/${allRecords.length} records`);
      }
    }
    
    console.log(`   ✅ Data insertion complete: ${insertedCount} records inserted`);
    return { success: true, inserted: insertedCount };
    
  } catch (error) {
    console.error(`❌ Error inserting data for ${tableName}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function verifyDataIntegrity() {
  console.log('\n🔍 VERIFYING DATA INTEGRITY...');
  console.log('═'.repeat(70));
  
  for (const tableName of TABLES_TO_INSERT) {
    try {
      // Get counts from both databases
      const { count: masterCount } = await masterClient
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(0);
      
      let localCount = 0;
      try {
        const result = await localClient
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(0);
        localCount = result.count || 0;
      } catch (error) {
        console.log(`   ❌ ${tableName}: Table not found in local`);
        continue;
      }
      
      const status = localCount === masterCount ? '✅' : 
                    localCount > 0 ? '⚠️ ' : '❌';
      
      console.log(`   ${status} ${tableName}: Master(${masterCount}) Local(${localCount})`);
      
    } catch (error) {
      console.log(`   ❌ ${tableName}: Error checking counts`);
    }
  }
}

async function main() {
  try {
    console.log('📋 TABLES TO INSERT DATA FOR:');
    TABLES_TO_INSERT.forEach(table => console.log(`   - ${table}`));
    
    console.log('\n⚠️  PREREQUISITES:');
    console.log('   1. Run create-missing-tables.sql in Supabase SQL Editor first');
    console.log('   2. Ensure all missing tables are created');
    console.log('   3. This script will insert the data');
    
    // Insert data for each table
    const insertResults = {};
    
    for (const tableName of TABLES_TO_INSERT) {
      const result = await insertTableData(tableName);
      insertResults[tableName] = result;
    }
    
    // Summary
    console.log('\n📊 INSERTION SUMMARY:');
    console.log('═'.repeat(70));
    
    let totalInserted = 0;
    let successCount = 0;
    
    Object.entries(insertResults).forEach(([table, result]) => {
      if (result.success) {
        const inserted = result.inserted || 0;
        totalInserted += inserted;
        successCount++;
        console.log(`   ✅ ${table}: ${inserted} records ${result.message || 'inserted'}`);
      } else {
        console.log(`   ❌ ${table}: ${result.error}`);
      }
    });
    
    console.log(`\n📊 FINAL TOTALS:`);
    console.log(`   ✅ Successfully processed: ${successCount}/${TABLES_TO_INSERT.length} tables`);
    console.log(`   📥 Total records inserted: ${totalInserted}`);
    
    // Verify data integrity
    await verifyDataIntegrity();
    
    if (successCount === TABLES_TO_INSERT.length) {
      console.log('\n🎉 ALL MISSING DATA MIGRATION COMPLETE!');
      console.log('   📊 Your local database now has all the production data');
      console.log('   🔄 Database synchronization is complete');
    } else {
      console.log('\n⚠️  PARTIAL MIGRATION COMPLETE');
      console.log('   📝 Some tables may need manual attention');
      console.log('   🔍 Check the errors above and ensure tables are created');
    }
    
  } catch (error) {
    console.error('\n❌ Data insertion failed:', error.message);
  }
}

main().catch(console.error); 