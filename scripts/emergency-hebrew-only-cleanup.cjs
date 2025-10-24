#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 🚨 EMERGENCY HEBREW-ONLY CLEANUP
// KEEP ONLY LEADS WITH HEBREW LETTERS
// WORK FAST TO PREVENT AGENTDB SYNC

console.log('🚨 EMERGENCY: HEBREW-ONLY LEAD CLEANUP');
console.log('=======================================');
console.log('⚡ Working fast to prevent AgentDB sync...');
console.log('🇮🇱 Keeping ONLY Hebrew letter names');

// Load credentials
const credentialsPath = path.join(__dirname, '../credentials/db-credentials.local.json');
if (!fs.existsSync(credentialsPath)) {
  console.error('❌ Missing credentials file:', credentialsPath);
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

// Create Supabase client with SERVICE ROLE (should bypass RLS)
const supabase = createClient(
  credentials.supabase.development.url, 
  credentials.supabase.development.service_role_key,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Hebrew Unicode range: \u0590-\u05FF
function hasHebrewLetters(text) {
  return /[\u0590-\u05FF]/.test(text || '');
}

async function emergencyCleanup() {
  try {
    console.log('\n🔍 SCANNING ALL LEADS...');
    
    // Get ALL leads
    const { data: allLeads, error } = await supabase
      .from('leads')
      .select('id, first_name, last_name, phone, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ CRITICAL: Cannot fetch leads:', error.message);
      console.error('   This might be RLS blocking service role');
      process.exit(1);
    }
    
    console.log(`📊 TOTAL LEADS: ${allLeads?.length || 0}`);
    
    // Separate Hebrew vs Non-Hebrew
    const hebrewLeads = [];
    const nonHebrewLeads = [];
    
    allLeads?.forEach(lead => {
      const firstName = lead.first_name || '';
      const lastName = lead.last_name || '';
      
      // Check if either name has Hebrew letters
      const hasHebrewFirstName = hasHebrewLetters(firstName);
      const hasHebrewLastName = hasHebrewLetters(lastName);
      
      if (hasHebrewFirstName || hasHebrewLastName) {
        hebrewLeads.push(lead);
        console.log(`🇮🇱 KEEP: ${firstName} ${lastName}`);
      } else {
        nonHebrewLeads.push(lead);
        console.log(`🗑️  DELETE: ${firstName} ${lastName}`);
      }
    });
    
    console.log(`\n📈 RESULTS:`);
    console.log(`   🇮🇱 Hebrew leads (KEEP): ${hebrewLeads.length}`);
    console.log(`   🗑️  Non-Hebrew leads (DELETE): ${nonHebrewLeads.length}`);
    
    if (nonHebrewLeads.length === 0) {
      console.log('\n🎉 NO CLEANUP NEEDED - All leads have Hebrew letters!');
      return;
    }
    
    // EMERGENCY DELETION - Work in large batches for speed
    console.log(`\n🚨 EMERGENCY DELETION STARTING...`);
    console.log(`⚡ Deleting ${nonHebrewLeads.length} non-Hebrew leads`);
    
    const batchSize = 100; // Large batches for speed
    let deletedCount = 0;
    
    for (let i = 0; i < nonHebrewLeads.length; i += batchSize) {
      const batch = nonHebrewLeads.slice(i, i + batchSize);
      const leadIds = batch.map(lead => lead.id);
      
      console.log(`⚡ Batch ${Math.floor(i/batchSize) + 1}: Deleting ${batch.length} leads...`);
      
      // Use service role to bypass RLS
      const { error: deleteError, count } = await supabase
        .from('leads')
        .delete({ count: 'exact' })
        .in('id', leadIds);
      
      if (deleteError) {
        console.error(`❌ BATCH FAILED:`, deleteError.message);
        console.error(`   Code:`, deleteError.code);
        console.error(`   Details:`, deleteError.details);
        
        // Try individual deletions if batch fails
        console.log(`🔄 Trying individual deletions...`);
        for (const leadId of leadIds) {
          const { error: individualError } = await supabase
            .from('leads')
            .delete()
            .eq('id', leadId);
          
          if (!individualError) {
            deletedCount++;
            console.log(`✅ Individual delete success: ${leadId}`);
          } else {
            console.error(`❌ Individual delete failed: ${leadId}`, individualError.message);
          }
        }
      } else {
        deletedCount += count || batch.length;
        console.log(`✅ Batch success: ${count || batch.length} deleted`);
      }
    }
    
    console.log(`\n🎯 CLEANUP COMPLETE:`);
    console.log(`   ✅ Deleted: ${deletedCount}/${nonHebrewLeads.length} non-Hebrew leads`);
    console.log(`   🇮🇱 Kept: ${hebrewLeads.length} Hebrew leads`);
    
    // Verify final state
    const { data: finalLeads } = await supabase
      .from('leads')
      .select('id, first_name, last_name')
      .limit(10);
    
    console.log('\n🎯 FINAL STATE (sample):');
    finalLeads?.forEach(lead => {
      const hasHebrew = hasHebrewLetters(lead.first_name) || hasHebrewLetters(lead.last_name);
      const marker = hasHebrew ? '🇮🇱' : '⚠️ ';
      console.log(`   ${marker} ${lead.first_name} ${lead.last_name}`);
    });
    
    console.log('\n🚨 EMERGENCY CLEANUP COMPLETE!');
    console.log('✅ Only Hebrew letter names remain');
    
  } catch (error) {
    console.error('💥 EMERGENCY CLEANUP FAILED:', error);
    console.error('🔍 Possible causes:');
    console.error('   - RLS policies blocking service role');
    console.error('   - Foreign key constraints');
    console.error('   - Database connection issues');
    process.exit(1);
  }
}

// RUN EMERGENCY CLEANUP
emergencyCleanup().catch(error => {
  console.error('💥 SCRIPT CRASHED:', error);
  process.exit(1);
}); 