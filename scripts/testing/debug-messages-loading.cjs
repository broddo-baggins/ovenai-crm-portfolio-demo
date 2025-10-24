const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load credentials
const credentialsPath = path.join(__dirname, '../../credentials/db-credentials.local.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const supabaseUrl = credentials.supabase.development.url;
const supabaseServiceRoleKey = credentials.supabase.development.service_role_key;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function debugMessagesLoading() {
  console.log('🔍 DEBUGGING MESSAGES LOADING PROCESS\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Simulate getAllConversations() call
    console.log('\n📋 Step 1: Testing getAllConversations()...');
    
    const { data: allConversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        lead_id,
        message_content,
        message_type,
        created_at,
        updated_at,
        timestamp,
        wamid,
        wa_timestamp
      `)
      .not('message_content', 'is', null)
      .order('updated_at', { ascending: false });

    if (convError) {
      console.log('❌ Error loading conversations:', convError.message);
      return;
    }

    console.log(`✅ Loaded ${allConversations?.length || 0} total conversations`);

    // Step 2: Find a test lead with multiple conversations
    console.log('\n📋 Step 2: Finding test lead...');
    
    const leadGroups = {};
    allConversations?.forEach(conv => {
      if (!leadGroups[conv.lead_id]) {
        leadGroups[conv.lead_id] = [];
      }
      leadGroups[conv.lead_id].push(conv);
    });

    const testLeadId = Object.keys(leadGroups).find(leadId => leadGroups[leadId].length >= 2);
    
    if (!testLeadId) {
      console.log('❌ No lead found with multiple conversations');
      return;
    }

    const leadConversations = leadGroups[testLeadId];
    console.log(`✅ Test lead: ${testLeadId} has ${leadConversations.length} conversations`);

    // Step 3: Get lead details
    console.log('\n📋 Step 3: Loading lead details...');
    
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', testLeadId)
      .single();

    if (leadError) {
      console.log('❌ Error loading lead:', leadError.message);
      return;
    }

    console.log(`✅ Lead: ${lead.first_name} ${lead.last_name} (${lead.phone || lead.phone_number})`);

    // Step 4: Simulate the exact frontend transformation logic
    console.log('\n📋 Step 4: Testing message transformation...');
    
    console.log('Raw conversations data sample:');
    leadConversations.slice(0, 3).forEach((conv, i) => {
      console.log(`${i + 1}. ID: ${conv.id}, Type: ${conv.message_type}, Content: "${conv.message_content?.substring(0, 50)}..."`);
    });

    // Apply the EXACT same logic as the frontend
    const messages = leadConversations.map((conv, index) => {
      let direction = "inbound";
      
      if (conv.message_type === "incoming") {
        direction = "inbound";
      } else if (conv.message_type === "outgoing") {
        direction = "outbound";
      } else {
        direction = index % 2 === 0 ? "inbound" : "outbound";
      }

      return {
        id: conv.id,
        lead_id: conv.lead_id,
        conversation_id: conv.id,
        content: conv.message_content || "",
        sender_number: direction === "inbound" ? (lead.phone || lead.phone_number || "") : "system",
        receiver_number: direction === "outbound" ? (lead.phone || lead.phone_number || "") : "system",
        wamid: conv.wamid || conv.id,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        wa_timestamp: conv.wa_timestamp || conv.timestamp || conv.created_at,
        direction,
        message_type: "text",
        lead_phone: lead.phone || lead.phone_number || "",
        lead_name: `${lead.first_name || ""} ${lead.last_name || ""}`.trim(),
      };
    });

    // Sort messages
    const sortedMessages = messages.sort(
      (a, b) =>
        new Date(a.wa_timestamp || a.created_at).getTime() -
        new Date(b.wa_timestamp || b.created_at).getTime()
    );

    console.log(`✅ Transformed ${sortedMessages.length} messages`);

    // Step 5: Display the results exactly as the frontend would
    console.log('\n💬 TRANSFORMED MESSAGES (as frontend would see):');
    console.log('-'.repeat(50));
    
    if (sortedMessages.length === 0) {
      console.log('❌ NO MESSAGES TRANSFORMED - THIS IS THE ISSUE!');
      console.log('\nDEBUG INFO:');
      console.log('- leadConversations.length:', leadConversations.length);
      console.log('- messages.length:', messages.length);
      console.log('- sortedMessages.length:', sortedMessages.length);
    } else {
      sortedMessages.forEach((msg, index) => {
        const direction = msg.direction === "inbound" ? "👤" : "🏢";
        const time = new Date(msg.wa_timestamp).toLocaleTimeString();
        console.log(`${index + 1}. [${time}] ${direction} ${msg.direction}: "${msg.content?.substring(0, 60)}..."`);
      });
    }

    // Step 6: Check for potential issues
    console.log('\n🔍 POTENTIAL ISSUES ANALYSIS:');
    console.log('-'.repeat(30));
    
    const emptyContent = leadConversations.filter(conv => !conv.message_content || conv.message_content.trim() === '');
    const missingTypes = leadConversations.filter(conv => !conv.message_type);
    const missingTimestamps = leadConversations.filter(conv => !conv.created_at && !conv.timestamp);
    
    console.log(`📊 Empty content messages: ${emptyContent.length}`);
    console.log(`📊 Missing message_type: ${missingTypes.length}`);
    console.log(`📊 Missing timestamps: ${missingTimestamps.length}`);
    
    if (emptyContent.length > 0) {
      console.log('⚠️  WARNING: Some conversations have empty message_content!');
    }
    
    if (missingTypes.length > 0) {
      console.log('⚠️  WARNING: Some conversations missing message_type!');
    }

    // Step 7: Test the frontend's filtering logic
    console.log('\n📋 Step 7: Testing frontend filtering...');
    
    const filteredMessages = sortedMessages.filter(msg => 
      msg.content && msg.content.trim().length > 0
    );
    
    console.log(`✅ Messages after filtering: ${filteredMessages.length}`);
    
    if (filteredMessages.length !== sortedMessages.length) {
      console.log(`⚠️  ${sortedMessages.length - filteredMessages.length} messages filtered out due to empty content`);
    }

    console.log('\n🎯 FINAL RESULT:');
    console.log('='.repeat(20));
    
    if (filteredMessages.length > 0) {
      console.log(`✅ SUCCESS: ${filteredMessages.length} messages should display in UI`);
      console.log('\n📌 If messages still not showing, check:');
      console.log('1. Browser console for React errors');
      console.log('2. Network tab for failed API calls');
      console.log('3. React DevTools for currentMessages state');
      console.log('4. CSS styling hiding the messages');
    } else {
      console.log('❌ FAILURE: No messages would display');
      console.log('\n📌 Issues to fix:');
      console.log('1. All conversations have empty message_content');
      console.log('2. Message transformation logic is incorrect');
      console.log('3. Filtering is too aggressive');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugMessagesLoading().catch(console.error); 