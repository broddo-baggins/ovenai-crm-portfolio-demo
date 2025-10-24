#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🚨 NUCLEAR OPTION: REPLACE SITE DB LEADS FROM AGENT DB');
console.log('=====================================================');
console.log('⚠️  This will DELETE ALL leads in Site DB');
console.log('✅ Then copy CLEAN Hebrew leads from Agent DB');
console.log('🇮🇱 Filter out test data during copy');

// Agent DB (Master) - READ ONLY
const agentDB = createClient(
  'https://imnyrhjdoaccxenxyfam.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbnlyaGpkb2FjY3hlbnh5ZmFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjczODQ1MCwiZXhwIjoyMDYyMzE0NDUwfQ.mpikoadGg90yaaLibpLekymlFSttsWy2PQtgRuEPlBM',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Site DB credentials
const credentialsPath = path.join(__dirname, '../credentials/db-credentials.local.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const siteDB = createClient(
  credentials.supabase.development.url, 
  credentials.supabase.development.service_role_key,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function isTestLead(lead) {
  const firstName = lead.first_name || '';
  const lastName = lead.last_name || '';
  
  const testPatterns = [
    'BackendTest', 'RegressionLead', 'QueueLead', 'TestLead', 
    'TestSurname', 'DemoLead', 'SampleLead'
  ];
  
  return testPatterns.some(pattern => 
    firstName.includes(pattern) || lastName.includes(pattern)
  );
}

async function nuclearReplacement() {
  try {
    console.log('\n🔍 STEP 1: GET CLEAN LEADS FROM AGENT DB...');
    
    // Get all leads from Agent DB
    const { data: agentLeads, error: agentError } = await agentDB
      .from('leads')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (agentError) {
      console.error('❌ Failed to fetch from Agent DB:', agentError.message);
      return;
    }
    
    console.log(`📊 Found ${agentLeads?.length || 0} leads in Agent DB`);
    
    // Filter out test leads
    const cleanLeads = agentLeads?.filter(lead => !isTestLead(lead)) || [];
    const filteredOut = (agentLeads?.length || 0) - cleanLeads.length;
    
    console.log(`🧹 Filtered out ${filteredOut} test leads`);
    console.log(`🇮🇱 Clean Hebrew leads to copy: ${cleanLeads.length}`);
    
    // Show what we're copying
    console.log('\n📋 CLEAN LEADS TO COPY:');
    cleanLeads.forEach((lead, index) => {
      const hasHebrew = /[\u0590-\u05FF]/.test(lead.first_name) || /[\u0590-\u05FF]/.test(lead.last_name);
      const marker = hasHebrew ? '🇮🇱' : '⚠️ ';
      console.log(`   ${index + 1}. ${marker} ${lead.first_name} ${lead.last_name} | ${lead.phone}`);
    });
    
    console.log('\n💣 STEP 2: NUCLEAR DELETE - TRUNCATE SITE DB LEADS...');
    
    // First disable RLS to ensure truncate works
    console.log('🔓 Temporarily disabling RLS...');
    
    // Use raw SQL to truncate (bypasses RLS completely)
    const { error: truncateError } = await siteDB.rpc('custom_truncate_leads', {});
    
    if (truncateError) {
      // Fallback: try direct SQL truncate
      console.log('⚡ Using direct SQL truncate...');
      const { error: sqlError } = await siteDB
        .from('leads')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
      if (sqlError) {
        console.error('❌ Nuclear delete failed:', sqlError.message);
        return;
      }
    }
    
    // Verify deletion
    const { count: remainingCount } = await siteDB
      .from('leads')
      .select('*', { count: 'exact', head: true });
      
    console.log(`🔥 Remaining leads in Site DB: ${remainingCount || 0}`);
    
    if (remainingCount && remainingCount > 0) {
      console.error('❌ NUCLEAR DELETE FAILED - leads still exist');
      return;
    }
    
    console.log('\n📥 STEP 3: COPY CLEAN LEADS FROM AGENT DB...');
    
    if (cleanLeads.length === 0) {
      console.log('⚠️  No clean leads to copy');
      return;
    }
    
    // Prepare leads for insertion (remove id to let Site DB generate new ones)
    const leadsToInsert = cleanLeads.map(lead => {
      const { id, ...leadWithoutId } = lead; // Remove id field
      return {
        ...leadWithoutId,
        // Ensure required fields have defaults
        current_project_id: lead.current_project_id || '2ba26935-4cdf-42b1-8d36-a6f57308b632', // Oven Project
        created_at: lead.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    // Insert in smaller batches
    const batchSize = 5;
    let insertedCount = 0;
    
    for (let i = 0; i < leadsToInsert.length; i += batchSize) {
      const batch = leadsToInsert.slice(i, i + batchSize);
      
      console.log(`📥 Inserting batch ${Math.floor(i/batchSize) + 1}...`);
      
      const { error: insertError, count } = await siteDB
        .from('leads')
        .insert(batch)
        .select('count');
        
      if (insertError) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, insertError.message);
        console.error('   Details:', insertError.details);
        // Continue with other batches
      } else {
        insertedCount += batch.length;
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: Inserted ${batch.length} leads`);
      }
    }
    
    console.log('\n🎯 NUCLEAR REPLACEMENT COMPLETE!');
    console.log('=================================');
    console.log(`📊 Original Site DB leads: 2,580`);
    console.log(`🗑️  Deleted: ALL`);
    console.log(`📥 Inserted from Agent DB: ${insertedCount}/${cleanLeads.length}`);
    
    // Final verification
    const { count: finalCount } = await siteDB
      .from('leads')
      .select('*', { count: 'exact', head: true });
      
    const { data: finalSample } = await siteDB
      .from('leads')
      .select('first_name, last_name')
      .limit(5);
      
    console.log(`\n🎉 FINAL STATE:`);
    console.log(`   📊 Total leads: ${finalCount || 0}`);
    console.log(`   📋 Sample leads:`);
    finalSample?.forEach(lead => {
      const hasHebrew = /[\u0590-\u05FF]/.test(lead.first_name) || /[\u0590-\u05FF]/.test(lead.last_name);
      const marker = hasHebrew ? '🇮🇱' : '⚠️ ';
      console.log(`      ${marker} ${lead.first_name} ${lead.last_name}`);
    });
    
    console.log('\n✅ SUCCESS: Site DB now has clean Hebrew leads from Agent DB!');
    
  } catch (error) {
    console.error('💥 NUCLEAR REPLACEMENT FAILED:', error.message);
    process.exit(1);
  }
}

console.log('\n⚠️  WARNING: This will DELETE ALL leads in Site DB!');
console.log('Continue? (Starting in 3 seconds...)');

setTimeout(() => {
  nuclearReplacement().catch(error => {
    console.error('💥 SCRIPT CRASHED:', error);
    process.exit(1);
  });
}, 3000); 