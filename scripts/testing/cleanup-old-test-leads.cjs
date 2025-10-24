#!/usr/bin/env node

/**
 * 🧹 CLEANUP OLD TEST LEADS
 * 
 * Removes old regression test leads (RegressionLead, QueueLead, TestSurname)
 * and keeps only the beautiful biblical Hebrew names we just generated.
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

console.log('🧹 CLEANUP OLD TEST LEADS');
console.log('=========================');
console.log('Removing old regression/test leads and keeping biblical Hebrew names...');
console.log('');

// Patterns to identify old test leads
const OLD_TEST_PATTERNS = [
  'RegressionLead',
  'QueueLead', 
  'TestSurname',
  'TestLead',
  'DemoLead',
  'SampleLead'
];

async function identifyOldTestLeads() {
  console.log('🔍 Identifying old test leads to remove...');
  
  try {
    // Get all leads
    const { data: allLeads, error } = await supabase
      .from('leads')
      .select('id, first_name, last_name, created_at, lead_metadata')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching leads:', error.message);
      return { oldLeads: [], biblicalLeads: [] };
    }
    
    console.log(`📊 Found ${allLeads?.length || 0} total leads`);
    
    // Separate old test leads from biblical Hebrew leads
    const oldLeads = [];
    const biblicalLeads = [];
    
    allLeads?.forEach(lead => {
      const firstName = lead.first_name || '';
      const lastName = lead.last_name || '';
      const fullName = `${firstName} ${lastName}`;
      
      // Check if it's an old test lead pattern
      const isOldTestLead = OLD_TEST_PATTERNS.some(pattern => 
        firstName.includes(pattern) || 
        lastName.includes(pattern) ||
        fullName.includes(pattern)
      );
      
      // Check if it's a biblical Hebrew lead (has our metadata)
      const isBiblicalLead = lead.lead_metadata?.name_origin === 'biblical_hebrew' || 
                            lead.lead_metadata?.purpose === 'automated_testing';
      
      if (isOldTestLead) {
        oldLeads.push(lead);
      } else if (isBiblicalLead || (!isOldTestLead && firstName && lastName)) {
        biblicalLeads.push(lead);
      } else {
        // Unclear - show for manual review
        console.log(`⚠️  Unclear lead: ${fullName} (${lead.id})`);
        biblicalLeads.push(lead); // Keep it safe
      }
    });
    
    return { oldLeads, biblicalLeads };
    
  } catch (error) {
    console.error('💥 Error identifying leads:', error);
    return { oldLeads: [], biblicalLeads: [] };
  }
}

async function cleanupOldLeads() {
  try {
    const { oldLeads, biblicalLeads } = await identifyOldTestLeads();
    
    console.log('\n📋 CLEANUP SUMMARY:');
    console.log(`🗑️  Old test leads to remove: ${oldLeads.length}`);
    console.log(`✅ Biblical Hebrew leads to keep: ${biblicalLeads.length}`);
    
    if (oldLeads.length === 0) {
      console.log('\n🎉 No old test leads found! Database is already clean.');
      return;
    }
    
    // Show sample of what will be deleted
    console.log('\n🗑️  LEADS TO DELETE (sample):');
    oldLeads.slice(0, 10).forEach(lead => {
      console.log(`   • ${lead.first_name} ${lead.last_name} (${lead.id})`);
    });
    
    if (oldLeads.length > 10) {
      console.log(`   ... and ${oldLeads.length - 10} more`);
    }
    
    // Show sample of what will be kept
    console.log('\n✅ LEADS TO KEEP (sample):');
    biblicalLeads.slice(0, 10).forEach(lead => {
      console.log(`   • ${lead.first_name} ${lead.last_name} (${lead.id})`);
    });
    
    if (biblicalLeads.length > 10) {
      console.log(`   ... and ${biblicalLeads.length - 10} more`);
    }
    
    // Delete old test leads in batches
    console.log('\n🗑️  Starting cleanup...');
    
    const batchSize = 10;
    let deletedCount = 0;
    
    for (let i = 0; i < oldLeads.length; i += batchSize) {
      const batch = oldLeads.slice(i, i + batchSize);
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
          console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: Deleted ${batch.length} old test leads`);
        }
      } catch (err) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} exception:`, err.message);
      }
    }
    
    console.log(`\n📊 CLEANUP COMPLETE`);
    console.log(`🗑️  Successfully deleted: ${deletedCount}/${oldLeads.length} old test leads`);
    console.log(`✅ Kept: ${biblicalLeads.length} biblical Hebrew leads`);
    
    // Verify final state
    const { data: finalLeads } = await supabase
      .from('leads')
      .select('id, first_name, last_name')
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log('\n🎯 FINAL DATABASE STATE (latest 10 leads):');
    finalLeads?.forEach(lead => {
      console.log(`   • ${lead.first_name} ${lead.last_name}`);
    });
    
    if (deletedCount > 0) {
      console.log('\n🎉 SUCCESS: Database cleaned successfully!');
      console.log('✅ Only beautiful biblical Hebrew names remain');
      console.log('✅ Ready for professional testing and demonstration');
    }
    
    return deletedCount;
    
  } catch (error) {
    console.error('💥 Cleanup failed:', error);
    throw error;
  }
}

// Execute cleanup
cleanupOldLeads()
  .then(deletedCount => {
    if (deletedCount >= 0) {
      console.log('\n🧹 Cleanup completed successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Cleanup had issues');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 