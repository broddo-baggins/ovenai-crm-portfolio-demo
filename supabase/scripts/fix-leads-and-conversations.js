#!/usr/bin/env node

// FIX LEADS AND CONVERSATIONS - Targeted Fix for Constraint Issues
// This script fixes the specific issues preventing leads and conversations migration

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

console.log('🔧 FIXING LEADS AND CONVERSATIONS MIGRATION');
console.log('═══════════════════════════════════════════════════════════');
console.log('🎯 Fixing constraint issues and completing migration');

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

async function analyzeLeadsStatusConstraint() {
  console.log('\n🔍 ANALYZING LEADS STATUS CONSTRAINT...');
  console.log('─'.repeat(70));
  
  try {
    // Check what status values exist in master
    const { data: masterLeads } = await masterClient
      .from('leads')
      .select('status')
      .limit(20);
    
    const masterStatuses = [...new Set(masterLeads?.map(l => l.status))];
    console.log('📋 Master status values:', masterStatuses);
    
    // Check what status values are allowed in local
    const { data: localLeads, error } = await localClient
      .from('leads')
      .select('status')
      .limit(1);
    
    if (error) {
      console.log('❌ Error checking local leads:', error.message);
    }
    
    // Try inserting a test record with different status values
    const testStatuses = ['active', 'new', 'qualified', 'cold', 'hot', 'warm'];
    
    for (const status of testStatuses) {
      try {
        const testLead = {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'test@example.com',
          status: status,
          phone: '+1234567890'
        };
        
        const { error: testError } = await localClient
          .from('leads')
          .upsert([testLead], { onConflict: 'id' });
        
        if (testError) {
          console.log(`❌ Status '${status}' not allowed: ${testError.message}`);
        } else {
          console.log(`✅ Status '${status}' is allowed`);
          // Clean up test record
          await localClient.from('leads').delete().eq('id', testLead.id);
        }
      } catch (e) {
        console.log(`❌ Status '${status}' failed: ${e.message}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Analysis failed:', error.message);
  }
}

async function migrateLeadsWithStatusFix() {
  console.log('\n📥 MIGRATING LEADS WITH STATUS FIXES...');
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
    
    let migrated = 0;
    
    for (const lead of masterLeads) {
      try {
        // Transform the lead to fix constraint issues
        const transformedLead = {
          id: lead.id,
          email: lead.email,
          phone: lead.phone,
          // Map status to allowed values
          status: mapStatusToLocal(lead.status),
          created_at: lead.created_at,
          updated_at: lead.updated_at,
          // Add other fields but check if they exist
          name: lead.name || null,
          client_id: lead.client_id || null,
          current_project_id: lead.current_project_id || null,
          state: lead.state || null,
          bant_status: lead.bant_status || null,
          // Set safe defaults for new fields
          interaction_count: lead.interaction_count || 0,
          follow_up_count: lead.follow_up_count || 0,
          requires_human_review: lead.requires_human_review || false,
          first_interaction: lead.first_interaction || null,
          last_interaction: lead.last_interaction || null,
          next_follow_up: lead.next_follow_up || null,
          last_message_from: lead.last_message_from || null,
          last_agent_processed_at: lead.last_agent_processed_at || null,
          state_status_metadata: lead.state_status_metadata || {},
          lead_metadata: lead.lead_metadata || {}
        };
        
        const { error: insertError } = await localClient
          .from('leads')
          .upsert([transformedLead], { onConflict: 'id' });
        
        if (insertError) {
          console.log(`❌ Failed to migrate lead ${lead.id}: ${insertError.message}`);
        } else {
          migrated++;
          console.log(`✅ Migrated lead ${lead.id.substring(0, 8)} (${lead.email})`);
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

function mapStatusToLocal(masterStatus) {
  // Map master status values to local allowed values
  const statusMap = {
    'new': 'active',
    'qualified': 'active', 
    'cold': 'active',
    'hot': 'active',
    'warm': 'active',
    'contacted': 'active',
    'converted': 'active',
    'lost': 'active'
  };
  
  return statusMap[masterStatus] || 'active';
}

async function migrateConversationsAfterLeads() {
  console.log('\n📥 MIGRATING CONVERSATIONS (AFTER LEADS)...');
  console.log('─'.repeat(70));
  
  try {
    // First check if we have leads
    const { count: leadCount } = await localClient
      .from('leads')
      .select('*', { count: 'exact' })
      .limit(0);
    
    console.log(`📊 Local database has ${leadCount} leads`);
    
    if (leadCount === 0) {
      console.log('❌ No leads in local database - cannot migrate conversations');
      return 0;
    }
    
    // Get master conversations
    const { data: masterConversations, error: fetchError } = await masterClient
      .from('conversations')
      .select('*');
    
    if (fetchError) {
      console.log('❌ Failed to fetch master conversations:', fetchError.message);
      return 0;
    }
    
    console.log(`📊 Found ${masterConversations.length} conversations in master`);
    
    // Clear existing conversations
    console.log('🗑️  Clearing existing conversations...');
    await localClient.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    let migrated = 0;
    const batchSize = 20;
    
    for (let i = 0; i < masterConversations.length; i += batchSize) {
      const batch = masterConversations.slice(i, i + batchSize);
      
      console.log(`📤 Processing batch ${Math.floor(i/batchSize) + 1} (${batch.length} conversations)...`);
      
      // Filter conversations that have valid lead_ids
      const validConversations = [];
      
      for (const conv of batch) {
        if (conv.lead_id) {
          // Check if this lead exists in local database
          const { data: leadExists } = await localClient
            .from('leads')
            .select('id')
            .eq('id', conv.lead_id)
            .limit(1);
          
          if (leadExists && leadExists.length > 0) {
            validConversations.push({
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
            });
          } else {
            console.log(`   ⚠️  Skipping conversation - lead ${conv.lead_id?.substring(0, 8)} not found`);
          }
        }
      }
      
      if (validConversations.length > 0) {
        const { error: insertError } = await localClient
          .from('conversations')
          .upsert(validConversations, { onConflict: 'id' });
        
        if (insertError) {
          console.log(`   ❌ Batch failed: ${insertError.message}`);
          
          // Try individual inserts
          for (const conv of validConversations) {
            try {
              const { error: singleError } = await localClient
                .from('conversations')
                .upsert([conv], { onConflict: 'id' });
              
              if (!singleError) migrated++;
            } catch (e) {
              console.log(`     ⚠️  Failed individual: ${e.message}`);
            }
          }
        } else {
          migrated += validConversations.length;
          console.log(`   ✅ Batch success: ${validConversations.length} conversations`);
        }
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`🎉 Conversations migration: ${migrated} migrated`);
    return migrated;
    
  } catch (error) {
    console.log('❌ Conversations migration failed:', error.message);
    return 0;
  }
}

async function verifyFinalState() {
  console.log('\n✅ VERIFYING FINAL STATE...');
  console.log('─'.repeat(70));
  
  const tables = ['clients', 'projects', 'leads', 'conversations', 'whatsapp_messages'];
  const results = {};
  
  for (const table of tables) {
    try {
      const { count } = await localClient
        .from(table)
        .select('*', { count: 'exact' })
        .limit(0);
      
      results[table] = count;
      console.log(`   ${table}: ${count} records`);
      
      // Show sample for conversations
      if (table === 'conversations' && count > 0) {
        const { data: sample } = await localClient
          .from(table)
          .select('message_content, lead_id')
          .limit(1);
        
        if (sample && sample.length > 0) {
          console.log(`     Sample: "${sample[0].message_content?.substring(0, 40)}..."`);
          console.log(`     Lead: ${sample[0].lead_id?.substring(0, 8)}...`);
        }
      }
      
    } catch (error) {
      results[table] = 0;
      console.log(`   ${table}: Error - ${error.message}`);
    }
  }
  
  return results;
}

async function main() {
  console.log('🚀 Starting targeted fix...\n');
  
  try {
    // Step 1: Analyze status constraint issue
    await analyzeLeadsStatusConstraint();
    
    // Step 2: Migrate leads with fixes
    const leadsResult = await migrateLeadsWithStatusFix();
    
    // Step 3: Migrate conversations (now that we have leads)
    const conversationsResult = await migrateConversationsAfterLeads();
    
    // Step 4: Verify final state
    const finalState = await verifyFinalState();
    
    // Final summary
    console.log('\n🎉 TARGETED FIX COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (finalState.conversations > 0 && finalState.whatsapp_messages > 0) {
      console.log('🎊 SUCCESS! Migration complete:');
      console.log(`   ✅ ${finalState.clients} clients`);
      console.log(`   ✅ ${finalState.projects} projects`);
      console.log(`   ✅ ${finalState.leads} leads`);
      console.log(`   ✅ ${finalState.conversations} conversations`);
      console.log(`   ✅ ${finalState.whatsapp_messages} WhatsApp messages`);
      console.log('\n🚀 You now have real production data in your local database!');
      console.log('🔗 Check your Supabase interface to see the conversations');
    } else {
      console.log('⚠️  Some issues remain - check errors above');
    }
    
  } catch (error) {
    console.error('\n❌ Targeted fix failed:', error.message);
  }
}

main().catch(console.error); 