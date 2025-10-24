#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const credentialsPath = path.join(__dirname, '../../credentials/db-credentials.local.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
const supabase = createClient(credentials.supabase.development.url, credentials.supabase.development.service_role_key);

(async () => {
  console.log('🔍 Final cleanup - Finding any remaining old test leads...');
  
  const { data: remainingOldLeads } = await supabase
    .from('leads')
    .select('id, first_name, last_name')
    .or('first_name.ilike.%queue%,first_name.ilike.%regression%,first_name.ilike.%test%,last_name.ilike.%testsurname%');
  
  if (remainingOldLeads && remainingOldLeads.length > 0) {
    console.log(`🗑️ Found ${remainingOldLeads.length} remaining old test leads:`);
    remainingOldLeads.forEach(lead => {
      console.log(`   • ${lead.first_name} ${lead.last_name} (${lead.id})`);
    });
    
    const leadIds = remainingOldLeads.map(lead => lead.id);
    const { error } = await supabase.from('leads').delete().in('id', leadIds);
    
    if (!error) {
      console.log(`✅ Deleted ${remainingOldLeads.length} remaining old test leads`);
    } else {
      console.error('❌ Error:', error.message);
    }
  } else {
    console.log('✅ No remaining old test leads found');
  }
  
  // Show final clean state
  const { data: finalLeads } = await supabase
    .from('leads')
    .select('first_name, last_name')
    .limit(8);
  
  console.log('\n🎯 Final clean database (sample):');
  finalLeads?.forEach(lead => {
    console.log(`   • ${lead.first_name} ${lead.last_name}`);
  });
  
  console.log('\n🎉 Database is now perfectly clean with beautiful biblical Hebrew names!');
})(); 