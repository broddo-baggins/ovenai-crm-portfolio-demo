#!/usr/bin/env node

/**
 * Queue System Schema Fix Runner
 * 
 * Executes the comprehensive SQL migration to fix:
 * 1. Missing foreign key constraints
 * 2. Queue ledger table creation
 * 3. User settings enhancements
 * 4. Proper data integrity
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load credentials
const credentialsPath = path.join(__dirname, '../../credentials/db-credentials.local.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const supabaseUrl = credentials.supabase.development.url;
const supabaseKey = credentials.supabase.development.service_role_key;
const supabase = createClient(supabaseUrl, supabaseKey);

// Load SQL migration
const sqlPath = path.join(__dirname, 'fix-queue-foreign-keys-and-ledger.sql');
const migrationSQL = fs.readFileSync(sqlPath, 'utf8');

console.log('🔧 QUEUE SYSTEM SCHEMA FIX');
console.log('=========================');
console.log(`Database: ${supabaseUrl}`);
console.log(`Migration: ${sqlPath}`);
console.log('');

async function runMigration() {
  try {
    console.log('🚀 Starting migration...');
    
    // Split SQL into individual statements (rough approach)
    const statements = migrationSQL
      .split(/;\s*\n/)
      .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'))
      .map(stmt => stmt.trim());
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute statements one by one for better error reporting
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('BEGIN') || statement.includes('COMMIT') || statement.length < 10) {
        continue; // Skip transaction control and tiny statements
      }
      
      try {
        console.log(`📤 Executing statement ${i + 1}/${statements.length}...`);
        
        // Use RPC to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          // Try alternative approach - execute via a simple query
          const { error: altError } = await supabase
            .from('queue_ledger') // This will fail but we want to see the error
            .select('*')
            .limit(0);
          
          // If we can't execute via RPC, try individual table operations
          if (statement.includes('CREATE TABLE') && statement.includes('queue_ledger')) {
            console.log('⚠️  Cannot execute raw SQL via RPC, attempting manual table creation...');
            
            // Manual approach for critical operations
            const { error: createError } = await supabase
              .from('queue_ledger')
              .select('*')
              .limit(1);
            
            if (createError && createError.code === '42P01') {
              console.log('❌ queue_ledger table does not exist - manual creation needed');
              errorCount++;
            } else {
              console.log('✅ queue_ledger table exists or accessible');
              successCount++;
            }
          } else {
            console.log(`❌ Error executing statement: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log('✅ Statement executed successfully');
          successCount++;
        }
        
        // Small delay between statements
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.log(`❌ Exception executing statement: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 MIGRATION RESULTS');
    console.log('====================');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Success Rate: ${Math.round((successCount / (successCount + errorCount)) * 100)}%`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This may be due to:');
      console.log('  • Supabase RPC limitations for raw SQL execution');
      console.log('  • Tables/constraints already existing');
      console.log('  • Permission restrictions');
      console.log('\n📝 MANUAL STEPS REQUIRED:');
      console.log('  1. Run the SQL migration directly in Supabase SQL Editor');
      console.log('  2. Verify foreign key constraints were added');
      console.log('  3. Check that queue_ledger table was created');
      console.log('  4. Test UI button functionality');
    }
    
    // Test basic functionality
    console.log('\n🧪 TESTING BASIC FUNCTIONALITY');
    console.log('==============================');
    
    // Test table access
    const tables = ['leads', 'user_queue_settings', 'whatsapp_message_queue', 'lead_processing_queue'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: accessible (${data?.length || 0} records)`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    return {
      success: successCount > errorCount,
      successCount,
      errorCount,
      message: errorCount > 0 ? 'Migration completed with errors' : 'Migration completed successfully'
    };
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

// Alternative approach: Create minimal queue ledger via Supabase client
async function createQueueLedgerManually() {
  console.log('\n🛠️  ATTEMPTING MANUAL QUEUE LEDGER SETUP');
  console.log('=========================================');
  
  try {
    // Test if queue_ledger exists by trying to insert/select
    const { data, error } = await supabase
      .from('queue_ledger')
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('❌ queue_ledger table does not exist');
      console.log('📋 You need to create it manually in Supabase SQL Editor:');
      console.log('');
      console.log('CREATE TABLE queue_ledger (');
      console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
      console.log('  lead_id UUID NOT NULL,');
      console.log('  user_id UUID NOT NULL,');
      console.log('  action TEXT NOT NULL,');
      console.log('  previous_state TEXT,');
      console.log('  new_state TEXT NOT NULL,');
      console.log('  created_at TIMESTAMPTZ DEFAULT NOW()');
      console.log(');');
      
      return false;
    } else if (error) {
      console.log(`⚠️  queue_ledger error: ${error.message}`);
      return false;
    } else {
      console.log('✅ queue_ledger table exists and is accessible');
      return true;
    }
    
  } catch (err) {
    console.log(`❌ Manual setup failed: ${err.message}`);
    return false;
  }
}

// Run migration
runMigration()
  .then(async result => {
    console.log(`\n${result.success ? '✅' : '⚠️'} ${result.message}`);
    
    // Attempt manual setup if needed
    const ledgerExists = await createQueueLedgerManually();
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('===============');
    console.log('1. Open Supabase SQL Editor');
    console.log('2. Run the complete SQL migration manually if needed');
    console.log('3. Verify foreign key constraints');
    console.log('4. Test queue UI buttons');
    console.log('5. Check export functionality');
    
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 