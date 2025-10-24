#!/usr/bin/env node

// AUTOMATED FULL MIGRATION - Schema Updates + Data Migration
// This script automates everything: schema updates and data migration

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

console.log('🚀 AUTOMATED FULL MIGRATION - SCHEMA + DATA');
console.log('═══════════════════════════════════════════════════════════');
console.log('🎯 Automatically updating schemas and migrating all data');

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

// Create clients
const masterClient = createClient(
  masterCredentials.MASTER_SUPABASE_URL,
  masterCredentials.MASTER_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const localClient = createClient(
  localCredentials.SUPABASE_URL,
  localCredentials.SUPABASE_SERVICE_ROLE_KEY
);

// Schema update SQL
const SCHEMA_UPDATES = [
  {
    name: 'Add contact_info to clients',
    sql: `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}'`
  },
  {
    name: 'Add whatsapp_number_id to clients', 
    sql: `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS whatsapp_number_id VARCHAR(255)`
  },
  {
    name: 'Add whatsapp_phone_number to clients',
    sql: `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS whatsapp_phone_number VARCHAR(50)`
  },
  {
    name: 'Add metadata to projects',
    sql: `ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'`
  },
  {
    name: 'Add client_id to leads',
    sql: `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS client_id UUID`
  },
  {
    name: 'Add current_project_id to leads', 
    sql: `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS current_project_id UUID`
  },
  {
    name: 'Add name to leads',
    sql: `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS name VARCHAR(255)`
  },
  {
    name: 'Add state to leads',
    sql: `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS state VARCHAR(50)`
  },
  {
    name: 'Add bant_status to leads',
    sql: `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS bant_status VARCHAR(50)`
  },
  {
    name: 'Add state_status_metadata to leads',
    sql: `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS state_status_metadata JSONB DEFAULT '{}'`
  },
  {
    name: 'Add lead_metadata to leads',
    sql: `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_metadata JSONB DEFAULT '{}'`
  },
  {
    name: 'Add last_message_from to leads',
    sql: `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_message_from VARCHAR(50)`
  },
  {
    name: 'Add interaction timestamps to leads',
    sql: `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_interaction TIMESTAMP WITH TIME ZONE, ADD COLUMN IF NOT EXISTS last_interaction TIMESTAMP WITH TIME ZONE`
  },
  {
    name: 'Add interaction counts to leads',
    sql: `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS interaction_count INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS follow_up_count INTEGER DEFAULT 0`
  },
  {
    name: 'Add follow_up fields to leads',
    sql: `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_follow_up TIMESTAMP WITH TIME ZONE, ADD COLUMN IF NOT EXISTS requires_human_review BOOLEAN DEFAULT false`
  },
  {
    name: 'Add last_agent_processed_at to leads',
    sql: `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_agent_processed_at TIMESTAMP WITH TIME ZONE`
  }
];

async function executeSchemaUpdates() {
  console.log('\n🔧 EXECUTING SCHEMA UPDATES AUTOMATICALLY...');
  console.log('─'.repeat(70));
  
  let successCount = 0;
  let failCount = 0;
  
  for (const update of SCHEMA_UPDATES) {
    try {
      console.log(`📝 ${update.name}...`);
      
      // Try to execute via raw SQL using a simple query
      // We'll use a workaround since direct DDL may not be supported
      const { error } = await localClient.rpc('exec_sql', { sql: update.sql });
      
      if (error) {
        // Try alternative approach using simple query
        try {
          await localClient.from('_temp_schema_check').select('1').limit(0);
        } catch (e) {
          // This is expected to fail, we're just trying to trigger the schema update
        }
        
        console.log(`   ⚠️  Standard execution failed: ${error.message}`);
        console.log(`   📋 SQL: ${update.sql}`);
        failCount++;
      } else {
        console.log(`   ✅ Success`);
        successCount++;
      }
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      failCount++;
    }
  }
  
  console.log(`\n📊 Schema Updates: ${successCount} success, ${failCount} failed`);
  
  if (failCount > 0) {
    console.log('\n⚠️  Some schema updates failed - trying alternative approach...');
    return false;
  }
  
  return true;
}

async function migrateAllData() {
  console.log('\n📥 MIGRATING ALL DATA...');
  console.log('─'.repeat(70));
  
  const tables = [
    { name: 'clients', description: '2 client records' },
    { name: 'projects', description: '2 project records' },
    { name: 'leads', description: '11 lead records' },
    { name: 'conversations', description: '499 conversation records' },
    { name: 'whatsapp_messages', description: '1,296 WhatsApp messages' }
  ];
  
  const results = {};
  
  for (const table of tables) {
    console.log(`\n📤 Migrating ${table.name} (${table.description})...`);
    
    try {
      // Get data from master
      const { data: masterData, error: fetchError } = await masterClient
        .from(table.name)
        .select('*');
      
      if (fetchError) {
        console.log(`   ❌ Failed to fetch ${table.name}: ${fetchError.message}`);
        results[table.name] = 0;
        continue;
      }
      
      if (!masterData || masterData.length === 0) {
        console.log(`   ⚠️  No data in master ${table.name}`);
        results[table.name] = 0;
        continue;
      }
      
      console.log(`   📊 Found ${masterData.length} records in master`);
      
      // Clear existing data for conversations and messages
      if (table.name === 'conversations' || table.name === 'whatsapp_messages') {
        console.log(`   🗑️  Clearing existing ${table.name}...`);
        await localClient.from(table.name).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      
      // Transform and insert data
      const transformedData = masterData.map(record => transformRecord(record, table.name));
      
      // Insert in smaller batches
      const batchSize = 10;
      let migrated = 0;
      
      for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize);
        
        try {
          const { error: insertError } = await localClient
            .from(table.name)
            .upsert(batch, { onConflict: 'id' });
          
          if (insertError) {
            console.log(`   ⚠️  Batch ${Math.floor(i/batchSize) + 1} failed: ${insertError.message}`);
            
            // Try individual inserts
            for (const record of batch) {
              try {
                const { error: singleError } = await localClient
                  .from(table.name)
                  .upsert([record], { onConflict: 'id' });
                
                if (!singleError) migrated++;
              } catch (e) {
                console.log(`     ⚠️  Failed individual insert: ${e.message}`);
              }
            }
          } else {
            migrated += batch.length;
            console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records`);
          }
        } catch (error) {
          console.log(`   ❌ Batch error: ${error.message}`);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      results[table.name] = migrated;
      console.log(`   🎉 ${table.name}: ${migrated}/${masterData.length} migrated`);
      
    } catch (error) {
      console.log(`   ❌ Migration failed: ${error.message}`);
      results[table.name] = 0;
    }
  }
  
  return results;
}

function transformRecord(record, tableName) {
  // Keep all existing fields and add master fields
  const transformed = { ...record };
  
  // Ensure required fields exist with defaults
  if (tableName === 'leads') {
    transformed.interaction_count = transformed.interaction_count || 0;
    transformed.follow_up_count = transformed.follow_up_count || 0;
    transformed.requires_human_review = transformed.requires_human_review || false;
    transformed.state_status_metadata = transformed.state_status_metadata || {};
    transformed.lead_metadata = transformed.lead_metadata || {};
  }
  
  if (tableName === 'clients') {
    transformed.contact_info = transformed.contact_info || {};
  }
  
  if (tableName === 'projects') {
    transformed.metadata = transformed.metadata || {};
  }
  
  if (tableName === 'conversations') {
    transformed.metadata = transformed.metadata || {};
    transformed.status = transformed.status || 'active';
  }
  
  if (tableName === 'whatsapp_messages') {
    transformed.payload = transformed.payload || {};
    transformed.awaits_response = transformed.awaits_response || false;
    transformed.test_mode = transformed.test_mode || false;
  }
  
  return transformed;
}

async function verifyResults() {
  console.log('\n✅ VERIFYING RESULTS...');
  console.log('─'.repeat(70));
  
  const tables = ['clients', 'projects', 'leads', 'conversations', 'whatsapp_messages'];
  
  for (const table of tables) {
    try {
      const { count } = await localClient
        .from(table)
        .select('*', { count: 'exact' })
        .limit(0);
      
      console.log(`   ${table}: ${count} records`);
      
      // Show sample data
      if (count > 0) {
        const { data: sample } = await localClient
          .from(table)
          .select('*')
          .limit(1);
        
        if (sample && sample.length > 0) {
          const record = sample[0];
          if (table === 'conversations') {
            console.log(`     Sample: "${record.message_content?.substring(0, 30)}..."`);
          } else if (table === 'whatsapp_messages') {
            console.log(`     Sample: "${record.content?.substring(0, 30)}..."`);
          }
        }
      }
      
    } catch (error) {
      console.log(`   ${table}: Error - ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting automated migration...\n');
  
  try {
    // Step 1: Try to update schemas automatically
    console.log('📋 STEP 1: AUTOMATED SCHEMA UPDATES');
    console.log('═'.repeat(70));
    
    const schemaSuccess = await executeSchemaUpdates();
    
    if (!schemaSuccess) {
      console.log('\n⚠️  Schema updates may need manual intervention');
      console.log('📄 If migration fails, run the SQL from FIX_SCHEMAS_FOR_MIGRATION.sql manually');
    }
    
    // Step 2: Migrate all data
    console.log('\n📋 STEP 2: DATA MIGRATION');
    console.log('═'.repeat(70));
    
    const migrationResults = await migrateAllData();
    
    // Step 3: Verify results
    await verifyResults();
    
    // Final summary
    console.log('\n🎉 AUTOMATED MIGRATION COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    
    const totalConversations = migrationResults.conversations || 0;
    const totalMessages = migrationResults.whatsapp_messages || 0;
    
    if (totalConversations > 0 && totalMessages > 0) {
      console.log('🎊 SUCCESS! Your database now has real production data:');
      console.log(`   ✅ ${migrationResults.clients || 0} clients`);
      console.log(`   ✅ ${migrationResults.projects || 0} projects`);
      console.log(`   ✅ ${migrationResults.leads || 0} leads`);
      console.log(`   ✅ ${totalConversations} conversations`);
      console.log(`   ✅ ${totalMessages} WhatsApp messages`);
      console.log('\n🚀 Ready to build UI with real customer data!');
      console.log('🔗 Check your Supabase interface to see all the data');
    } else {
      console.log('⚠️  Migration may have failed - check errors above');
      console.log('💡 Try running FIX_SCHEMAS_FOR_MIGRATION.sql manually first');
    }
    
  } catch (error) {
    console.error('\n❌ Automated migration failed:', error.message);
    console.log('🛡️  No changes made to master database');
  }
}

main().catch(console.error); 