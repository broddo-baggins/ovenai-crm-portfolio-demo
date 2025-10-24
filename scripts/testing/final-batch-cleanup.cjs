#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const credentialsPath = path.join(__dirname, '../../credentials/db-credentials.local.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
const supabase = createClient(credentials.supabase.development.url, credentials.supabase.development.service_role_key);

(async () => {
  console.log('🧹 Final batch cleanup of remaining old test leads...');
  
  // Delete in smaller batches to avoid URI limit
  const patterns = ['QueueLead', 'RegressionLead', 'TestLead', 'DemoLead', 'BackendTest'];
  let totalDeleted = 0;
  
  for (const pattern of patterns) {
    try {
      console.log(`🔍 Searching for ${pattern} entries...`);
      
      const { data: toDelete } = await supabase
        .from('leads')
        .select('id, first_name, last_name')
        .or(`first_name.ilike.%${pattern}%,last_name.ilike.%${pattern}%`)
        .limit(50);
      
      if (toDelete && toDelete.length > 0) {
        console.log(`   Found ${toDelete.length} ${pattern} entries to delete`);
        
        const { error } = await supabase
          .from('leads')
          .delete()
          .in('id', toDelete.map(l => l.id));
        
        if (!error) {
          console.log(`✅ Deleted ${toDelete.length} ${pattern} entries`);
          totalDeleted += toDelete.length;
        } else {
          console.log(`❌ Error deleting ${pattern}:`, error.message);
        }
      } else {
        console.log(`   No ${pattern} entries found`);
      }
    } catch (err) {
      console.log(`⚠️ Error with ${pattern}:`, err.message);
    }
  }
  
  console.log(`\n📊 Final cleanup complete: ${totalDeleted} more old leads removed`);
  
  // Show final clean state
  try {
    const { data: finalState } = await supabase
      .from('leads')
      .select('first_name, last_name')
      .limit(12);
    
    console.log('\n🎯 Final clean database state:');
    finalState?.forEach(lead => {
      console.log(`   • ${lead.first_name} ${lead.last_name}`);
    });
    
    console.log('\n🎉 Database cleanup complete! Only beautiful names remain!');
  } catch (err) {
    console.log('⚠️ Could not fetch final state:', err.message);
  }
})(); 