#!/usr/bin/env node

// FINAL STATUS FIX - Complete the migration with correct status mapping
// This script fixes the exact status constraint issue identified in the analysis

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

console.log('🔧 FINAL STATUS FIX AND COMPLETE MIGRATION');
console.log('═══════════════════════════════════════════════════════════');
console.log('🎯 Fixing exact status constraints and completing full migration');

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

function mapMasterStatusToLocal(masterStatus) {
  // Map the ACTUAL master status values to local allowed values
  const statusMap = {
    'unqualified': 'new',      // Master: unqualified → Local: new
    'consideration': 'qualified', // Master: consideration → Local: qualified  
    'intent': 'qualified',     // Master: intent → Local: qualified
    // Fallback for any other values
    'active': 'new',
    'cold': 'new',
    'hot': 'qualified',
    'warm': 'qualified'
  };
  
  return statusMap[masterStatus] || 'new'; // Default to 'new' if not found
}

async function migrateLeadsWithCorrectMapping() {
  console.log('\n📥 MIGRATING LEADS WITH CORRECT STATUS MAPPING...');
  console.log('─'.repeat(70));
  
  try {
    // Get master leads
    const { data: masterLeads, error: fetchError } = await masterClient
      .from('leads')
      .select('*');
    
    if (fetchError) {
      console.log('❌ Failed to fetch master leads:', fetchError.message);
      return 0;
    }
    
    console.log(`📊 Found ${masterLeads.length} leads in master`);
    console.log('📋 Master status values found:');
    
    const statusCounts = {};
    masterLeads.forEach(lead => {
      const status = lead.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      const mappedStatus = mapMasterStatusToLocal(status);
      console.log(`   ${status} (${count}) → ${mappedStatus}`);
    });
    
    let migrated = 0;
    
    for (const lead of masterLeads) {
      try {
        // Transform with correct status mapping
        const transformedLead = {
          id: lead.id,
          email: lead.email,
          phone: lead.phone,
          status: mapMasterStatusToLocal(lead.status), // Use correct mapping
          created_at: lead.created_at,
          updated_at: lead.updated_at
          // Note: Skipping new columns since they may not exist in local schema
        };
        
        const { error: insertError } = await localClient
          .from('leads')
          .upsert([transformedLead], { onConflict: 'id' });
        
        if (insertError) {
          console.log(`❌ Failed ${lead.id}: ${insertError.message}`);
        } else {
          migrated++;
          console.log(`✅ Migrated ${lead.id.substring(0, 8)} (${lead.status} → ${transformedLead.status})`);
        }
        
      } catch (error) {
        console.log(`❌ Error processing lead ${lead.id}: ${error.message}`);
      }
    }
    
    console.log(`🎉 Leads migration: ${migrated}/${masterLeads.length} migrated`);
    return migrated;
    
  } catch (error) {
    console.log('❌ Leads migration failed:', error.message);
    return 0;
  }
}

async function migrateConversationsWithValidLeads() {
  console.log('\n📥 MIGRATING CONVERSATIONS WITH VALID LEADS...');
  console.log('─'.repeat(70));
  
  try {
    // Get all local lead IDs that exist now
    const { data: localLeads } = await localClient
      .from('leads')
      .select('id');
    
    const localLeadIds = new Set(localLeads?.map(l => l.id));
    console.log(`📊 Available local leads: ${localLeadIds.size}`);
    
    // Get master conversations
    const { data: masterConversations, error: fetchError } = await masterClient
      .from('conversations')
      .select('*');
    
    if (fetchError) {
      console.log('❌ Failed to fetch conversations:', fetchError.message);
      return 0;
    }
    
    console.log(`📊 Found ${masterConversations.length} conversations in master`);
    
    // Filter conversations that have valid lead_ids
    const validConversations = masterConversations.filter(conv => 
      conv.lead_id && localLeadIds.has(conv.lead_id)
    );
    
    console.log(`📊 Valid conversations (with existing leads): ${validConversations.length}`);
    
    if (validConversations.length === 0) {
      console.log('⚠️  No conversations can be migrated - no matching leads');
      return 0;
    }
    
    // Clear existing conversations
    console.log('🗑️  Clearing existing conversations...');
    await localClient.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Migrate in smaller batches
    const batchSize = 50;
    let migrated = 0;
    
    for (let i = 0; i < validConversations.length; i += batchSize) {
      const batch = validConversations.slice(i, i + batchSize);
      
      console.log(`📤 Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} conversations...`);
      
      const transformedBatch = batch.map(conv => ({
        id: conv.id,
        lead_id: conv.lead_id,
        message_content: conv.message_content,
        timestamp: conv.timestamp,
        metadata: conv.metadata || {},
        message_id: conv.message_id,
        message_type: conv.message_type,
        status: conv.status || 'active',
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        validation_context: conv.validation_context,
        conversation_context: conv.conversation_context
      }));
      
      const { error: insertError } = await localClient
        .from('conversations')
        .upsert(transformedBatch, { onConflict: 'id' });
      
      if (insertError) {
        console.log(`   ❌ Batch failed: ${insertError.message}`);
      } else {
        migrated += transformedBatch.length;
        console.log(`   ✅ Batch success: ${transformedBatch.length} conversations`);
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`🎉 Conversations migration: ${migrated} conversations migrated`);
    return migrated;
    
  } catch (error) {
    console.log('❌ Conversations migration failed:', error.message);
    return 0;
  }
}

async function showFinalSummary() {
  console.log('\n✅ FINAL MIGRATION SUMMARY...');
  console.log('─'.repeat(70));
  
  const tables = ['clients', 'projects', 'leads', 'conversations', 'whatsapp_messages'];
  const totals = {};
  
  for (const table of tables) {
    try {
      const { count } = await localClient
        .from(table)
        .select('*', { count: 'exact' })
        .limit(0);
      
      totals[table] = count;
      console.log(`   ${table}: ${count} records`);
      
    } catch (error) {
      totals[table] = 0;
      console.log(`   ${table}: Error - ${error.message}`);
    }
  }
  
  // Show sample conversation if any exist
  if (totals.conversations > 0) {
    const { data: sample } = await localClient
      .from('conversations')
      .select('message_content, lead_id')
      .limit(1);
    
    if (sample && sample.length > 0) {
      console.log('\n📋 Sample conversation:');
      console.log(`   Content: "${sample[0].message_content?.substring(0, 60)}..."`);
      console.log(`   Lead ID: ${sample[0].lead_id?.substring(0, 8)}...`);
    }
  }
  
  return totals;
}

async function main() {
  console.log('🚀 Starting final status fix and complete migration...\n');
  
  try {
    // Step 1: Migrate leads with correct status mapping
    const leadsResult = await migrateLeadsWithCorrectMapping();
    
    // Step 2: Migrate conversations now that we have valid leads
    const conversationsResult = await migrateConversationsWithValidLeads();
    
    // Step 3: Show final summary
    const totals = await showFinalSummary();
    
    // Final results
    console.log('\n🎉 COMPLETE MIGRATION FINISHED!');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (totals.conversations > 0 && totals.whatsapp_messages > 0) {
      console.log('🎊 SUCCESS! Your local database now has REAL production data:');
      console.log(`   ✅ ${totals.clients} clients`);
      console.log(`   ✅ ${totals.projects} projects`);
      console.log(`   ✅ ${totals.leads} leads`);
      console.log(`   ✅ ${totals.conversations} REAL conversations`);
      console.log(`   ✅ ${totals.whatsapp_messages} REAL WhatsApp messages`);
      console.log('\n🚀 MISSION ACCOMPLISHED!');
      console.log('You now have real customer conversation data in your local database!');
      console.log('🔗 Check your Supabase interface to see the conversations and messages');
      console.log('\n🎯 Ready to build UI with real production data!');
    } else {
      console.log('⚠️  Migration completed but some data may be missing');
      console.log(`Results: ${totals.conversations} conversations, ${totals.whatsapp_messages} messages`);
    }
    
  } catch (error) {
    console.error('\n❌ Final migration failed:', error.message);
    console.log('🛡️  No changes made to master database');
  }
}

main().catch(console.error); 