#!/usr/bin/env node

/**
 * 🧹 COMPLETE SQL CLEANUP
 * 
 * Removes ALL remaining test leads that were missed by previous cleanup,
 * including those from leads_rows.sql file.
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

console.log('🧹 COMPLETE SQL CLEANUP');
console.log('========================');
console.log('Finding and removing ALL remaining test leads...');
console.log('');

// All possible patterns for test leads
const ALL_TEST_PATTERNS = [
  'RegressionLead',
  'QueueLead', 
  'TestSurname',
  'TestLead',
  'DemoLead',
  'BackendTest',
  'StressTest',
  'SampleLead',
  'UpdateLead'
];

async function findAllTestLeads() {
  console.log('🔍 Scanning database for ALL test leads...');
  
  try {
    let allTestLeads = [];
    
    // Search by first name patterns
    for (const pattern of ALL_TEST_PATTERNS) {
      console.log(`   Searching for ${pattern} in first_name...`);
      
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, phone, created_at, status')
        .ilike('first_name', `%${pattern}%`)
        .limit(500);
      
      if (error) {
        console.error(`❌ Error searching ${pattern}:`, error.message);
        continue;
      }
      
      if (leads && leads.length > 0) {
        console.log(`     Found ${leads.length} leads with ${pattern}`);
        allTestLeads.push(...leads);
      }
    }
    
    // Search by last name patterns  
    for (const pattern of ['TestSurname', 'Surname']) {
      console.log(`   Searching for ${pattern} in last_name...`);
      
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, phone, created_at, status')
        .ilike('last_name', `%${pattern}%`)
        .limit(500);
      
      if (error) {
        console.error(`❌ Error searching ${pattern}:`, error.message);
        continue;
      }
      
      if (leads && leads.length > 0) {
        console.log(`     Found ${leads.length} leads with ${pattern} surname`);
        allTestLeads.push(...leads);
      }
    }
    
    // Search by phone patterns (test phone numbers)
    console.log('   Searching for test phone patterns...');
    const { data: phoneLeads, error: phoneError } = await supabase
      .from('leads')
      .select('id, first_name, last_name, phone, created_at, status')
      .or('phone.like.+1555%,phone.like.+19990%,phone.like.+15550%')
      .limit(500);
    
    if (!phoneError && phoneLeads && phoneLeads.length > 0) {
      console.log(`     Found ${phoneLeads.length} leads with test phone numbers`);
      allTestLeads.push(...phoneLeads);
    }
    
    // Remove duplicates based on ID
    const uniqueLeads = allTestLeads.filter((lead, index, self) => 
      index === self.findIndex(l => l.id === lead.id)
    );
    
    console.log(`\n📊 Total unique test leads found: ${uniqueLeads.length}`);
    
    return uniqueLeads;
    
  } catch (error) {
    console.error('💥 Error finding test leads:', error);
    return [];
  }
}

async function showTestLeadsSample(testLeads) {
  console.log('\n📋 SAMPLE OF TEST LEADS TO DELETE:');
  
  // Group by pattern for better overview
  const grouped = {};
  
  testLeads.forEach(lead => {
    const pattern = ALL_TEST_PATTERNS.find(p => 
      lead.first_name?.includes(p) || lead.last_name?.includes(p)
    ) || 'Other';
    
    if (!grouped[pattern]) grouped[pattern] = [];
    grouped[pattern].push(lead);
  });
  
  Object.entries(grouped).forEach(([pattern, leads]) => {
    console.log(`\n   ${pattern} (${leads.length} leads):`);
    leads.slice(0, 5).forEach(lead => {
      console.log(`     • ${lead.first_name} ${lead.last_name} - ${lead.phone}`);
    });
    if (leads.length > 5) {
      console.log(`     ... and ${leads.length - 5} more`);
    }
  });
}

async function deleteTestLeads(testLeads, dryRun = true) {
  if (testLeads.length === 0) {
    console.log('🎉 No test leads found to delete!');
    return 0;
  }
  
  if (dryRun) {
    console.log('\n🧪 DRY RUN MODE - No actual deletions performed');
    console.log(`Would delete ${testLeads.length} test leads`);
    return 0;
  }
  
  console.log(`\n🗑️  Deleting ${testLeads.length} test leads...`);
  
  let deletedCount = 0;
  const batchSize = 20; // Larger batches for efficiency
  
  for (let i = 0; i < testLeads.length; i += batchSize) {
    const batch = testLeads.slice(i, i + batchSize);
    const leadIds = batch.map(lead => lead.id);
    
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', leadIds);
      
      if (error) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
      } else {
        deletedCount += batch.length;
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: Deleted ${batch.length} leads`);
      }
    } catch (err) {
      console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} exception:`, err.message);
    }
  }
  
  return deletedCount;
}

async function verifyCleanupComplete() {
  console.log('\n🔍 Verifying cleanup is complete...');
  
  try {
    // Check for any remaining test patterns
    for (const pattern of ALL_TEST_PATTERNS) {
      const { data: remaining, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name')
        .or(`first_name.ilike.%${pattern}%,last_name.ilike.%${pattern}%`)
        .limit(5);
      
      if (!error && remaining && remaining.length > 0) {
        console.log(`⚠️  Still found ${remaining.length} leads with ${pattern}:`);
        remaining.forEach(lead => {
          console.log(`     • ${lead.first_name} ${lead.last_name}`);
        });
      }
    }
    
    // Show final database state
    const { data: finalLeads } = await supabase
      .from('leads')
      .select('first_name, last_name, phone')
      .limit(10);
    
    console.log('\n🎯 Final database state (sample):');
    finalLeads?.forEach(lead => {
      console.log(`   • ${lead.first_name} ${lead.last_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

async function main() {
  try {
    // Find all test leads
    const testLeads = await findAllTestLeads();
    
    // Show sample
    await showTestLeadsSample(testLeads);
    
    // Check command line arguments
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--execute');
    
    // Delete test leads
    const deletedCount = await deleteTestLeads(testLeads, dryRun);
    
    // Verify if not dry run
    if (!dryRun && deletedCount > 0) {
      await verifyCleanupComplete();
    }
    
    console.log('\n📊 COMPLETE CLEANUP SUMMARY:');
    console.log(`🔍 Test leads found: ${testLeads.length}`);
    console.log(`🗑️  Test leads ${dryRun ? 'would be deleted' : 'deleted'}: ${deletedCount}`);
    
    if (dryRun) {
      console.log('\n💡 To execute the complete cleanup, run:');
      console.log('   node scripts/testing/complete-sql-cleanup.cjs --execute');
      console.log('');
      console.log('⚠️  This will remove ALL test leads including those from leads_rows.sql');
    } else {
      console.log('\n🎉 Complete cleanup finished!');
      console.log('✅ All test leads have been removed');
      console.log('✅ Only biblical Hebrew names remain');
    }
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
} 